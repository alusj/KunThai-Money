import { formatCurrency } from "./formatCurrency";

const OWN_ACCOUNT_NOTIFICATION_FLOWS = new Set([
  "foreign_to_main_conversion",
  "main_to_foreign_conversion",
  "wallet_conversion",
]);

function buildPaymentRequestMessage(request) {
  const lines = [
    `From ${request.requester_name}`,
    `Account No: ${request.requester_account_number}`,
    `Amount requested: ${formatCurrency(request.amount ?? 0, request.currency || "SLL")}`,
    `Reason for request: ${request.reason || "No reason added"}`,
  ];

  if (request.status) {
    lines.push(`Status: ${request.status}`);
  }

  return lines.join("\n");
}

function buildOwnAccountNotification(transaction) {
  const flow = transaction?.metadata?.flow;

  if (!OWN_ACCOUNT_NOTIFICATION_FLOWS.has(flow)) {
    return null;
  }

  const amountMoved = formatCurrency(transaction.amount ?? 0, transaction.currency || "SLL");
  const convertedAmount = formatCurrency(
    transaction.metadata?.converted_amount ??
      transaction.metadata?.convertedAmount ??
      transaction.metadata?.target_amount ??
      transaction.amount ??
      0,
    transaction.metadata?.conversion_target_currency ||
      transaction.metadata?.target_currency ||
      transaction.currency ||
      "SLL"
  );

  if (flow === "foreign_to_main_conversion") {
    return {
      id: `own-transfer-${transaction.id}`,
      tone: "info",
      title: "Foreign account update",
      body: `You have moved ${amountMoved} from your foreign account to your main account.\nYou have converted ${convertedAmount} from your foreign account.`,
      action: "notifications-only",
      actionLabel: "Open",
      created_at: transaction.created_at,
    };
  }

  if (flow === "main_to_foreign_conversion") {
    return {
      id: `own-transfer-${transaction.id}`,
      tone: "info",
      title: "Foreign account update",
      body: `You have moved ${amountMoved} from your main account to your foreign account.\nYou have converted ${convertedAmount} to your foreign account.`,
      action: "notifications-only",
      actionLabel: "Open",
      created_at: transaction.created_at,
    };
  }

  return {
    id: `own-transfer-${transaction.id}`,
    tone: "info",
    title: "Account transfer update",
    body: `You have moved ${amountMoved} between your accounts.\nConverted amount: ${convertedAmount}.`,
    action: "notifications-only",
    actionLabel: "Open",
    created_at: transaction.created_at,
  };
}

function buildMerchantPaymentNotification(transaction) {
  if (transaction?.metadata?.flow !== "merchant_payment") {
    return null;
  }

  const amount = formatCurrency(transaction.amount ?? 0, transaction.currency || "SLL");
  const merchantLabel =
    transaction.metadata?.merchant_account_name ||
    transaction.counterparty_name ||
    transaction.metadata?.recipient_name ||
    "merchant account";

  return {
    id: `merchant-payment-${transaction.id}`,
    tone: "info",
    title: "Merchant payment completed",
    body: `You have done payment to ${merchantLabel} for ${amount}.`,
    action: "transaction-receipt",
    actionLabel: "View receipt",
    transactionId: String(transaction.id),
    created_at: transaction.created_at,
  };
}

function buildAgentTransferNotification(transaction) {
  if (transaction?.metadata?.flow !== "agent_transfer") {
    return null;
  }

  const amount = formatCurrency(transaction.amount ?? 0, transaction.currency || "SLL");
  const agentLabel =
    transaction.metadata?.agent_account_name ||
    transaction.counterparty_name ||
    transaction.metadata?.recipient_name ||
    "agent account";

  return {
    id: `agent-transfer-${transaction.id}`,
    tone: "info",
    title: "Agent transfer completed",
    body: `You have sent payment to ${agentLabel} for ${amount}.`,
    action: "transaction-receipt",
    actionLabel: "View receipt",
    transactionId: String(transaction.id),
    created_at: transaction.created_at,
  };
}

function buildHotelPaymentNotification(transaction) {
  if (transaction?.metadata?.flow !== "hotel_payment") {
    return null;
  }

  const amount = formatCurrency(transaction.amount ?? 0, transaction.currency || "SLL");
  const hotelLabel =
    transaction.metadata?.hotel_account_name ||
    transaction.counterparty_name ||
    transaction.metadata?.recipient_name ||
    "hotel account";

  return {
    id: `hotel-payment-${transaction.id}`,
    tone: "info",
    title: "Hotel payment completed",
    body: `You have paid ${amount} to ${hotelLabel}.`,
    action: "transaction-receipt",
    actionLabel: "View receipt",
    transactionId: String(transaction.id),
    created_at: transaction.created_at,
  };
}

function buildSchoolPaymentNotification(transaction) {
  if (transaction?.metadata?.flow !== "school_payment") {
    return null;
  }

  const amount = formatCurrency(transaction.amount ?? 0, transaction.currency || "SLL");
  const schoolLabel =
    transaction.metadata?.school_account_name ||
    transaction.counterparty_name ||
    transaction.metadata?.recipient_name ||
    "school account";

  return {
    id: `school-payment-${transaction.id}`,
    tone: "info",
    title: "School fees paid",
    body: `You have paid school fees to ${schoolLabel} for ${amount}.`,
    action: "transaction-receipt",
    actionLabel: "View receipt",
    transactionId: String(transaction.id),
    created_at: transaction.created_at,
  };
}

function buildRestaurantPaymentNotification(transaction) {
  if (transaction?.metadata?.flow !== "restaurant_payment") {
    return null;
  }

  const amount = formatCurrency(transaction.amount ?? 0, transaction.currency || "SLL");
  const restaurantLabel =
    transaction.metadata?.restaurant_account_name ||
    transaction.counterparty_name ||
    transaction.metadata?.recipient_name ||
    "restaurant account";

  return {
    id: `restaurant-payment-${transaction.id}`,
    tone: "info",
    title: "Restaurant payment completed",
    body: `You have paid ${amount} to ${restaurantLabel}.`,
    action: "transaction-receipt",
    actionLabel: "View receipt",
    transactionId: String(transaction.id),
    created_at: transaction.created_at,
  };
}

function buildSupermarketPaymentNotification(transaction) {
  if (transaction?.metadata?.flow !== "supermarket_payment") {
    return null;
  }

  const amount = formatCurrency(transaction.amount ?? 0, transaction.currency || "SLL");
  const supermarketLabel =
    transaction.metadata?.supermarket_account_name ||
    transaction.counterparty_name ||
    transaction.metadata?.recipient_name ||
    "supermarket account";

  return {
    id: `supermarket-payment-${transaction.id}`,
    tone: "info",
    title: "Supermarket payment completed",
    body: `You have paid ${amount} to ${supermarketLabel}.`,
    action: "transaction-receipt",
    actionLabel: "View receipt",
    transactionId: String(transaction.id),
    created_at: transaction.created_at,
  };
}

function buildPharmacyPaymentNotification(transaction) {
  if (transaction?.metadata?.flow !== "pharmacy_payment") {
    return null;
  }

  const amount = formatCurrency(transaction.amount ?? 0, transaction.currency || "SLL");
  const pharmacyLabel =
    transaction.metadata?.pharmacy_account_name ||
    transaction.counterparty_name ||
    transaction.metadata?.recipient_name ||
    "pharmacy account";

  return {
    id: `pharmacy-payment-${transaction.id}`,
    tone: "info",
    title: "Pharmacy payment completed",
    body: `You have paid ${amount} to ${pharmacyLabel}.`,
    action: "transaction-receipt",
    actionLabel: "View receipt",
    transactionId: String(transaction.id),
    created_at: transaction.created_at,
  };
}

function buildInsurancePaymentNotification(transaction) {
  if (transaction?.metadata?.flow !== "insurance_payment") {
    return null;
  }

  const amount = formatCurrency(transaction.amount ?? 0, transaction.currency || "SLL");
  const insuranceLabel =
    transaction.metadata?.insurance_account_name ||
    transaction.counterparty_name ||
    transaction.metadata?.recipient_name ||
    "insurance account";

  return {
    id: `insurance-payment-${transaction.id}`,
    tone: "info",
    title: "Insurance payment completed",
    body: `You have paid ${amount} to ${insuranceLabel}.`,
    action: "transaction-receipt",
    actionLabel: "View receipt",
    transactionId: String(transaction.id),
    created_at: transaction.created_at,
  };
}

function buildDonationPaymentNotification(transaction) {
  if (transaction?.metadata?.flow !== "donation_payment") {
    return null;
  }

  const amount = formatCurrency(transaction.amount ?? 0, transaction.currency || "SLL");
  const donationLabel =
    transaction.metadata?.donation_account_name ||
    transaction.counterparty_name ||
    transaction.metadata?.recipient_name ||
    "donation account";

  return {
    id: `donation-payment-${transaction.id}`,
    tone: "info",
    title: "Donation completed",
    body: `You have donated ${amount} to ${donationLabel}.`,
    action: "transaction-receipt",
    actionLabel: "View receipt",
    transactionId: String(transaction.id),
    created_at: transaction.created_at,
  };
}

export function buildHeaderNotifications({
  status,
  paymentRequests = [],
  adminMessages = [],
  otherAccounts = [],
  recentTransactions = [],
}) {
  const items = [];

  paymentRequests
    .filter((request) => request.status === "pending")
    .slice(0, 3)
    .forEach((request) => {
      items.push({
      id: request.id,
      tone: "success",
      title: "Cash-in request",
      body: buildPaymentRequestMessage(request),
      action: "payment-request-view",
      secondaryAction: "payment-request-cancel",
      actionLabel: "View",
      secondaryLabel: "Cancel",
      requestId: request.id,
      request,
    });
    });

  if (!status?.hasKyc) {
    items.push({
      id: "kyc-missing",
      tone: "warning",
      title: "Complete KYC verification",
      body: "Verify your identity to strengthen account trust and unlock future protected features.",
      action: "kyc",
    });
  } else if (status.kycStatus === "pending") {
    items.push({
      id: "kyc-pending",
      tone: "info",
      title: "Verification under review",
      body: "Your identity submission is in review. We will update your account once compliance clears it.",
      action: "kyc",
    });
  } else if (status.kycStatus === "rejected") {
    items.push({
      id: "kyc-rejected",
      tone: "warning",
      title: "KYC needs attention",
      body: "Your identity review needs an update. Open KYC to review the details and submit again.",
      action: "kyc",
    });
  } else if (status.kycStatus === "approved") {
    items.push({
      id: "kyc-approved",
      tone: "success",
      title: "KYC verified",
      body: "Your account identity check has been approved successfully.",
      action: "kyc",
    });
  }

  adminMessages.slice(0, 3).forEach((message, index) => {
    items.push({
      id: message.id || `admin-message-${index}`,
      tone: message.tone || "neutral",
      title: message.title || "Admin message",
      body: message.body || "You have a new update from the admin team.",
      action: message.action || "admin-message",
      actionLabel: message.actionLabel || "Done",
      ...message,
    });
  });

  otherAccounts
    .filter((account) => {
      const reviewStatus = account?.metadata?.agent_profile?.review_status || account?.status || "pending";
      return account?.account_type === "agent" && reviewStatus === "rejected";
    })
    .slice(0, 2)
    .forEach((account, index) => {
      const rejectionReason =
        account?.metadata?.agent_profile?.rejection_reason ||
        account?.metadata?.agent_profile?.rejection_comment ||
        "Please review your account name and upload fresh business documents before resubmitting.";

      items.push({
        id: `agent-rejected-${account.id || index}`,
        tone: "warning",
        title: `${account.account_name || "Agent account"} needs changes`,
        body: `Reason: ${rejectionReason}`,
        action: "agent-account-resubmit",
        actionLabel: "Open",
        accountId: account.id,
      });
    });

  otherAccounts
    .filter((account) => {
      const reviewStatus = account?.metadata?.insurance_profile?.review_status || account?.status || "pending";
      return account?.account_type === "insurance" && reviewStatus === "rejected";
    })
    .slice(0, 2)
    .forEach((account, index) => {
      const rejectionReason =
        account?.metadata?.insurance_profile?.rejection_reason ||
        account?.metadata?.insurance_profile?.rejection_comment ||
        "Please review your insurance details and upload fresh verification documents before resubmitting.";

      items.push({
        id: `insurance-rejected-${account.id || index}`,
        tone: "warning",
        title: `${account.account_name || "Insurance account"} needs changes`,
        body: `Reason: ${rejectionReason}`,
        action: "insurance-account-resubmit",
        actionLabel: "Open",
        accountId: account.id,
      });
    });

  otherAccounts
    .filter((account) => {
      const reviewStatus = account?.metadata?.donation_profile?.review_status || account?.status || "pending";
      return account?.account_type === "donation" && reviewStatus === "rejected";
    })
    .slice(0, 2)
    .forEach((account, index) => {
      const rejectionReason =
        account?.metadata?.donation_profile?.rejection_reason ||
        account?.metadata?.donation_profile?.rejection_comment ||
        "Please review your donation details and upload fresh verification documents before resubmitting.";

      items.push({
        id: `donation-rejected-${account.id || index}`,
        tone: "warning",
        title: `${account.account_name || "Donation account"} needs changes`,
        body: `Reason: ${rejectionReason}`,
        action: "donation-account-resubmit",
        actionLabel: "Open",
        accountId: account.id,
      });
    });

  recentTransactions
    .map(buildOwnAccountNotification)
    .filter(Boolean)
    .forEach((item) => {
      items.push(item);
    });

  recentTransactions
    .map(buildMerchantPaymentNotification)
    .filter(Boolean)
    .forEach((item) => {
      items.push(item);
    });

  recentTransactions
    .map(buildAgentTransferNotification)
    .filter(Boolean)
    .forEach((item) => {
      items.push(item);
    });

  recentTransactions
    .map(buildHotelPaymentNotification)
    .filter(Boolean)
    .forEach((item) => {
      items.push(item);
    });

  recentTransactions
    .map(buildSchoolPaymentNotification)
    .filter(Boolean)
    .forEach((item) => {
      items.push(item);
    });

  recentTransactions
    .map(buildRestaurantPaymentNotification)
    .filter(Boolean)
    .forEach((item) => {
      items.push(item);
    });

  recentTransactions
    .map(buildSupermarketPaymentNotification)
    .filter(Boolean)
    .forEach((item) => {
      items.push(item);
    });

  recentTransactions
    .map(buildPharmacyPaymentNotification)
    .filter(Boolean)
    .forEach((item) => {
      items.push(item);
    });

  recentTransactions
    .map(buildInsurancePaymentNotification)
    .filter(Boolean)
    .forEach((item) => {
      items.push(item);
    });

  recentTransactions
    .map(buildDonationPaymentNotification)
    .filter(Boolean)
    .forEach((item) => {
      items.push(item);
    });

  return items
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 6);
}
