import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import supabase from "../../Backend/lib/supabaseClient";
import { useAuth } from "../../Backend/hooks/useAuth";
import { useOnboardingStatus } from "../../Backend/hooks/useOnboardingStatus";
import { createOtherAccount, getOtherAccounts } from "../../Backend/services/otherAccountService";
import { getTransactions } from "../../Backend/services/transactionService";
import {
  canUseBiometrics,
  clearStoredBiometrics,
  getBiometricStatus,
  registerBiometrics,
  verifyBiometrics,
} from "../../Backend/utils/biometricAuth";
import { normalizeCurrencyRecord } from "../../Backend/utils/currency";
import { buildHeaderNotifications } from "../../Backend/utils/headerNotifications";
import { buildFullName, resolveRegisteredName } from "../../Backend/utils/profileName";
import { useAppearance } from "../AppearanceProvider";
import AuthNotice from "../auth/AuthNotice";
import Header from "./header/Header";
import Dashboard from "./dashboard/Dashboard";
import CreateAnotherAccountScreen from "./header/CreateAnotherAccountScreen";
import ChangePasswordScreen from "./header/ChangePasswordScreen";
import ChangePinScreen from "./header/ChangePinScreen";
import EditProfileScreen from "./header/EditProfileScreen";
import NotificationScreen from "./header/NotificationScreen";
import ProfileScreen from "./header/ProfileScreen";
import SearchScreen from "./header/SearchScreen";
import TransactionsScreen from "./header/Transactions/TransactionScreen";

function withImageVersion(url) {
  if (!url) {
    return null;
  }

  const cleanUrl = url.split("?")[0];
  return `${cleanUrl}?v=${Date.now()}`;
}

export default function KunTaiHome() {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useAppearance();
  const { user } = useAuth();
  const { status, loading: statusLoading } = useOnboardingStatus(user?.id);
  const [activeScreen, setActiveScreen] = useState("dashboard");
  const [account, setAccount] = useState(null);
  const [profileName, setProfileName] = useState("User");
  const [profile, setProfile] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [otherAccounts, setOtherAccounts] = useState([]);
  const [biometricState, setBiometricState] = useState({
    supported: false,
    enabled: false,
    busy: true,
    message: "",
    messageTitle: "",
    messageTone: "info",
  });
  const [accountLoading, setAccountLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [otherAccountsLoading, setOtherAccountsLoading] = useState(true);
  const notifications = buildHeaderNotifications({
    status,
    account,
    transactions: recentTransactions,
  });

  const updateBiometricBanner = (messageTitle, message, messageTone = "info") => {
    setBiometricState((current) => ({
      ...current,
      messageTitle,
      message,
      messageTone,
    }));
  };

  const fetchAccount = async () => {
    setAccountLoading(true);

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      setAccountLoading(false);
      return;
    }

    const { data: accountData, error } = await supabase
      .from("kuntai_accounts")
      .select("*")
      .eq("user_id", currentUser.id)
      .single();

    if (error) {
      console.log("Account fetch error:", error);
      setAccountLoading(false);
      return;
    }

    setAccount(normalizeCurrencyRecord(accountData));
    setAccountLoading(false);
  };

  const fetchProfile = async () => {
    setProfileLoading(true);

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      setProfileLoading(false);
      return;
    }

    const meta = currentUser.user_metadata || currentUser.raw_user_meta_data || {};
    const { data: profileData } = await supabase
      .from("kuntai_profiles")
      .select("id,first_name,middle_name,last_name,phone,profile_image,last_login_at")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    setProfileName(resolveRegisteredName(profileData, currentUser));

    const lastLoginAt = new Date().toISOString();
    setProfile(
      profileData
        ? {
            ...profileData,
            phone: profileData.phone ?? meta.phone ?? currentUser.phone ?? "",
            profile_image: withImageVersion(profileData.profile_image || meta.profile_image),
            last_login_at: lastLoginAt,
          }
        : {
            phone: meta.phone || currentUser.phone || "",
            profile_image: withImageVersion(meta.profile_image),
            last_login_at: lastLoginAt,
          }
    );

    await supabase
      .from("kuntai_profiles")
      .update({ last_login_at: lastLoginAt })
      .eq("user_id", currentUser.id);

    setProfileLoading(false);
  };

  const fetchRecentTransactions = async () => {
    setTransactionsLoading(true);

    try {
      const data = await getTransactions({ userId: user?.id, limit: 5 });
      setRecentTransactions(data);
    } catch (error) {
      console.log("Recent transactions fetch error:", error);
      setRecentTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const fetchOtherAccounts = async () => {
    setOtherAccountsLoading(true);

    try {
      const data = await getOtherAccounts(user?.id);
      setOtherAccounts(data);
    } catch (error) {
      console.log("Other accounts fetch error:", error);
      setOtherAccounts([]);
    } finally {
      setOtherAccountsLoading(false);
    }
  };

  const refreshWalletData = async () => {
    await Promise.all([fetchAccount(), fetchRecentTransactions()]);
  };

  const refreshBiometrics = async () => {
    if (!user?.id) {
      setBiometricState({
        supported: false,
        enabled: false,
        busy: false,
        message: "",
        messageTitle: "",
        messageTone: "info",
      });
      return;
    }

    const supported = await canUseBiometrics();
    const statusForUser = getBiometricStatus(user.id);

    setBiometricState((current) => ({
      ...current,
      supported,
      enabled: supported && statusForUser.enabled,
      busy: false,
    }));
  };

  const handleToggleBiometrics = async () => {
    if (!user?.id || biometricState.busy) {
      return;
    }

    setBiometricState((current) => ({ ...current, busy: true }));

    try {
      if (!biometricState.enabled) {
        await registerBiometrics({
          userId: user.id,
          displayName: profileName,
          phone: profile?.phone || user.phone || "",
        });

        setBiometricState((current) => ({
          ...current,
          enabled: true,
          busy: false,
        }));
        updateBiometricBanner(
          "Biometrics enabled",
          "Face ID or fingerprint is now active on this device for protected security screens.",
          "success"
        );
        return;
      }

      clearStoredBiometrics(user.id);
      setBiometricState((current) => ({
        ...current,
        enabled: false,
        busy: false,
      }));
      updateBiometricBanner(
        "Biometrics disabled",
        "Biometric protection has been turned off for this device.",
        "info"
      );
    } catch (error) {
      setBiometricState((current) => ({
        ...current,
        busy: false,
      }));
      updateBiometricBanner(
        "Biometrics not changed",
        error instanceof Error ? error.message : "Biometric setup could not be completed.",
        "danger"
      );
    }
  };

  const openProtectedSecurityScreen = async (nextScreen) => {
    if (!biometricState.enabled || !user?.id) {
      setActiveScreen(nextScreen);
      return;
    }

    setBiometricState((current) => ({ ...current, busy: true }));

    try {
      await verifyBiometrics(user.id);
      setBiometricState((current) => ({ ...current, busy: false }));
      updateBiometricBanner(
        "Biometric check passed",
        "Identity confirmed on this device.",
        "success"
      );
      setActiveScreen(nextScreen);
    } catch (error) {
      setBiometricState((current) => ({ ...current, busy: false }));
      updateBiometricBanner(
        "Verification required",
        error instanceof Error
          ? error.message
          : "Biometric verification was not completed, so the security screen stayed locked.",
        "warning"
      );
    }
  };

  const handleSignOut = async (scope = "current") => {
    await supabase.auth.signOut(scope === "all" ? { scope: "global" } : undefined);
    navigate("/login?reason=signed-out", { replace: true });
  };

  useEffect(() => {
    fetchAccount();
    fetchProfile();
    fetchRecentTransactions();
    fetchOtherAccounts();
  }, [user?.id]);

  useEffect(() => {
    refreshBiometrics();
  }, [user?.id]);

  const renderKycNotice = () => {
    if (statusLoading || !status) {
      return null;
    }

    if (!status.hasKyc) {
      return (
        <div className="px-4 pt-4 md:px-8 lg:px-12">
          <AuthNotice tone="warning" title="Identity verification recommended">
            Complete your KYC to strengthen trust on your account and unlock future high-value features.
          </AuthNotice>
          <button
            onClick={() => navigate("/kyc")}
            className="mt-3 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Start KYC
          </button>
        </div>
      );
    }

    if (status.kycStatus === "pending") {
      return (
        <div className="px-4 pt-4 md:px-8 lg:px-12">
          <AuthNotice tone="info" title="Verification in review">
            Your identity submission has been received successfully and is now under compliance review. We will unlock the next verification stage as soon as your account is cleared.
          </AuthNotice>
        </div>
      );
    }

    if (status.kycStatus === "rejected") {
      return (
        <div className="px-4 pt-4 md:px-8 lg:px-12">
          <AuthNotice tone="danger" title="Verification needs attention">
            We could not complete your identity review yet. Please update your KYC details and submit again so we can continue verifying your account.
          </AuthNotice>
          <button
            onClick={() => navigate("/kyc")}
            className="mt-3 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Update KYC
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {activeScreen === "dashboard" && (
        <>
          <Header
            setActiveScreen={setActiveScreen}
            displayName={profileName}
            loading={accountLoading || profileLoading || transactionsLoading || otherAccountsLoading}
            profile={profile}
            notificationCount={notifications.length}
            transactionCount={recentTransactions.length}
          />

          {renderKycNotice()}

          <Dashboard
            account={accountLoading ? null : account}
            refreshAccount={refreshWalletData}
            otherAccounts={otherAccounts}
            user={user}
          />
        </>
      )}

      {activeScreen === "transactions" && (
        <TransactionsScreen setActiveScreen={setActiveScreen} account={account} profile={profile} />
      )}

      {activeScreen === "notifications" && (
        <NotificationScreen
          notifications={notifications}
          onBack={() => setActiveScreen("dashboard")}
          onAction={(action) => {
            if (action === "kyc") {
              navigate("/kyc");
              return;
            }

            if (action === "transactions") {
              setActiveScreen("transactions");
            }
          }}
        />
      )}

      {activeScreen === "profile" && (
        <ProfileScreen
          name={profileName}
          profile={profile}
          account={account}
          status={status}
          onBack={() => setActiveScreen("dashboard")}
          onOpenEditProfile={() => setActiveScreen("edit-profile")}
          onOpenCreateAccount={() => setActiveScreen("create-account")}
          onOpenChangePin={() => openProtectedSecurityScreen("change-pin")}
          onOpenChangePassword={() => openProtectedSecurityScreen("change-password")}
          onOpenTransactions={() => setActiveScreen("transactions")}
          onOpenNotifications={() => setActiveScreen("notifications")}
          onOpenTerms={() => setActiveScreen("dashboard")}
          onOpenHelp={() => setActiveScreen("dashboard")}
          onSignOut={handleSignOut}
          biometrics={biometricState}
          onToggleBiometrics={handleToggleBiometrics}
          appearance={{ isDarkMode }}
          onToggleAppearance={toggleTheme}
        />
      )}

      {activeScreen === "edit-profile" && (
        <EditProfileScreen
          profile={profile}
          account={account}
          user={user}
          onBack={() => setActiveScreen("profile")}
          onSaved={async (updatedProfile) => {
            if (updatedProfile) {
              setProfile((currentProfile) => ({
                ...(currentProfile || {}),
                ...updatedProfile,
                profile_image: withImageVersion(updatedProfile.profile_image),
                last_login_at: currentProfile?.last_login_at || new Date().toISOString(),
              }));

              setProfileName(
                buildFullName(
                  updatedProfile.first_name,
                  updatedProfile.middle_name,
                  updatedProfile.last_name
                ) || "User"
              );
            }
          }}
        />
      )}

      {activeScreen === "change-pin" && (
        <ChangePinScreen user={user} onBack={() => setActiveScreen("profile")} />
      )}

      {activeScreen === "change-password" && (
        <ChangePasswordScreen user={user} onBack={() => setActiveScreen("profile")} />
      )}

      {activeScreen === "search" && (
        <SearchScreen
          transactions={recentTransactions}
          onBack={() => setActiveScreen("dashboard")}
          onOpenTransactions={() => setActiveScreen("transactions")}
          onOpenNotifications={() => setActiveScreen("notifications")}
        />
      )}

      {activeScreen === "create-account" && (
        <CreateAnotherAccountScreen
          mainAccount={account}
          existingAccounts={otherAccounts}
          onBack={() => setActiveScreen("profile")}
          onCreate={async (payload) => {
            await createOtherAccount(payload);
            await fetchOtherAccounts();
            setActiveScreen("dashboard");
          }}
        />
      )}
    </div>
  );
}
