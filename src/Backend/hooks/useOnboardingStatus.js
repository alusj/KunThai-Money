import { useEffect, useState } from "react";

import supabase from "../lib/supabaseClient";

export function resolveOnboardingPath(status) {
  if (!status?.hasSecurity) {
    return "/security-setup";
  }

  if (!status?.hasProfile || !status?.hasAccount) {
    return "/create-profile";
  }

  return "/home";
}

export async function fetchOnboardingStatus(userId) {
  const [securityResponse, profileResponse, accountResponse, kycResponse] = await Promise.all([
    supabase.from("kuntai_security").select("id").eq("user_id", userId).maybeSingle(),
    supabase
      .from("kuntai_profiles")
      .select("id,first_name,middle_name,last_name,phone,is_profile_complete,profile_image")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("kuntai_accounts")
      .select("id,status,account_number,currency,balance,phone")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("kuntai_kyc")
      .select("id,kyc_status,updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const responses = [securityResponse, profileResponse, accountResponse, kycResponse];
  const failedResponse = responses.find((response) => response.error);

  if (failedResponse?.error) {
    throw failedResponse.error;
  }

  const hasSecurity = Boolean(securityResponse.data?.id);
  const hasProfile = Boolean(profileResponse.data?.id && profileResponse.data?.is_profile_complete);
  const hasAccount = Boolean(accountResponse.data?.id);
  const hasKyc = Boolean(kycResponse.data?.id);
  const hasCompletedKyc = kycResponse.data?.kyc_status === "approved";

  const status = {
    hasSecurity,
    hasProfile,
    hasAccount,
    hasKyc,
    hasCompletedKyc,
    kycStatus: kycResponse.data?.kyc_status ?? "missing",
    profile: profileResponse.data ?? null,
    account: accountResponse.data ?? null,
    recommendedPath: "",
  };

  status.recommendedPath = resolveOnboardingPath(status);
  return status;
}

export function useOnboardingStatus(userId) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadStatus = async () => {
      if (!userId) {
        setStatus(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nextStatus = await fetchOnboardingStatus(userId);

        if (isMounted) {
          setStatus(nextStatus);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStatus();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { status, loading, error };
}
