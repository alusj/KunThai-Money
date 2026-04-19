import { useEffect, useMemo, useState } from "react";
import { getAccountTransferRecipient } from "../../../../../../Backend/services/transferService";
import { getRecipientStateIcon } from "../accountNumber.utils.jsx";

export function useRecipientLookup({
  formAccountNumber,
  accountId,
  isConversionFlow,
  disableFormEditing,
  prefilledRecipientLookup,
  conversionConfig,
}) {
  const [recipientLookup, setRecipientLookup] = useState(null);
  const [isCheckingRecipient, setIsCheckingRecipient] = useState(false);

  const effectiveRecipientLookup = isConversionFlow
    ? {
        is_valid: true,
        recipient_name:
          conversionConfig?.targetAccount?.account_name ||
          conversionConfig?.targetLabel ||
          "Conversion destination",
        recipient_profile_image: "",
        recipient_account_number:
          conversionConfig?.targetAccount?.account_number || "",
        message: "Your destination account is ready for conversion.",
      }
    : prefilledRecipientLookup || recipientLookup;

  useEffect(() => {
    if (isConversionFlow) {
      setRecipientLookup(null);
      setIsCheckingRecipient(false);
      return undefined;
    }

    if (disableFormEditing || prefilledRecipientLookup?.is_valid) {
      setRecipientLookup(null);
      setIsCheckingRecipient(false);
      return undefined;
    }

    const trimmedAccountNumber = formAccountNumber.trim();

    if (!trimmedAccountNumber || trimmedAccountNumber.length < 8 || !accountId) {
      setRecipientLookup(null);
      setIsCheckingRecipient(false);
      return undefined;
    }

    let isActive = true;
    const timeoutId = window.setTimeout(async () => {
      setIsCheckingRecipient(true);

      try {
        const result = await getAccountTransferRecipient({
          sourceAccountId: accountId,
          recipientAccountNumber: trimmedAccountNumber,
        });

        if (isActive) setRecipientLookup(result);
      } catch (lookupError) {
        if (isActive) {
          setRecipientLookup({
            is_valid: false,
            message:
              lookupError instanceof Error
                ? lookupError.message
                : "Recipient account could not be verified.",
          });
        }
      } finally {
        if (isActive) setIsCheckingRecipient(false);
      }
    }, 450);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [
    formAccountNumber,
    accountId,
    disableFormEditing,
    isConversionFlow,
    prefilledRecipientLookup,
  ]);

  const recipientStateIcon = useMemo(
    () =>
      getRecipientStateIcon({
        isCheckingRecipient,
        effectiveRecipientLookup,
      }),
    [isCheckingRecipient, effectiveRecipientLookup]
  );

  return {
    recipientLookup,
    isCheckingRecipient,
    recipientStateIcon,
  };
}