import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import supabase from "../../Backend/lib/supabaseClient";
import { useAuth } from "../../Backend/hooks/useAuth";
import { useOnboardingStatus } from "../../Backend/hooks/useOnboardingStatus";
import {
  createOtherAccount,
  getOtherAccounts,
  resubmitAgentAccount,
  resubmitDonationAccount,
  resubmitInsuranceAccount,
} from "../../Backend/services/otherAccountService";
import { getUserAdminNotifications } from "../../Backend/services/adminNotificationService";
import {
  cancelPaymentRequest,
  getPaymentRequests,
  markPaymentRequestViewed,
  resolvePaymentRequest,
} from "../../Backend/services/paymentRequestService";
import { getTransactions } from "../../Backend/services/transactionService";
import {
  canUseBiometrics,
  clearStoredBiometrics,
  getBiometricStatus,
  registerBiometrics,
  verifyBiometrics,
} from "../../Backend/utils/biometricAuth";
import { normalizeCurrencyRecord } from "../../Backend/utils/currency";
import { formatCurrency } from "../../Backend/utils/formatCurrency";
import { buildHeaderNotifications } from "../../Backend/utils/headerNotifications";
import {
  clearStoredHomeScreen,
  getHomeScreenLastActiveAt,
  HOME_SCREEN_RESUME_WINDOW_MS,
  markHomeScreenActiveNow,
  persistHomeScreen,
  readStoredHomeScreen,
} from "../../Backend/utils/homeScreenSession";
import { buildFullName, resolveRegisteredName } from "../../Backend/utils/profileName";
import { useAppearance } from "../AppearanceProvider";
import AuthNotice from "../auth/AuthNotice";
import Header from "./header/Header";
import Dashboard from "./dashboard/Dashboard";
import CreateAnotherAccountScreen from "./header/CreateAnotherAccountScreen";
import ChangePasswordScreen from "./header/ChangePasswordScreen";
import ChangePinScreen from "./header/ChangePinScreen";
import EditProfileScreen from "./header/EditProfileScreen";
import EventSellerScreen from "./header/EventSellerScreen";
import EventTicketsScreen from "./header/EventTicketsScreen";
import NotificationScreen from "./header/NotificationScreen";
import PaymentRequestDetailScreen from "./header/PaymentRequestDetailScreen";
import PaymentRequestTransferScreen from "./header/PaymentRequestTransferScreen";
import ProfileScreen from "./header/ProfileScreen";
import SearchScreen from "./header/SearchScreen";
import TransactionsScreen from "./header/Transactions/TransactionScreen";
import ActionBanner from "../feedback/ActionBanner";

const SEEN_NOTIFICATION_IDS_KEY = "kuntai-seen-notification-ids";
const SEEN_TRANSACTION_IDS_KEY = "kuntai-seen-transaction-ids";
const DASHBOARD_ACCOUNT_NUMBER_HIDDEN_KEY = "kuntai-dashboard-account-number-hidden";
const DASHBOARD_HIDDEN_OTHER_ACCOUNT_IDS_KEY = "kuntai-dashboard-hidden-other-account-ids";
const PERSISTED_HOME_SCREENS = new Set([
  "dashboard",
  "profile",
  "notifications",
  "transactions",
  "search",
  "edit-profile",
  "change-pin",
  "change-password",
  "create-account",
  "event-tickets",
  "event-manager",
]);

function readStoredIds(key) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistStoredIds(key, values) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(values));
}

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
  const [activeScreen, setActiveScreen] = useState(() =>
    readStoredHomeScreen(PERSISTED_HOME_SCREENS, "dashboard")
  );
  const [account, setAccount] = useState(null);
  const [profileName, setProfileName] = useState("User");
  const [profile, setProfile] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [notificationTransactions, setNotificationTransactions] = useState([]);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [outgoingPaymentRequests, setOutgoingPaymentRequests] = useState([]);
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [otherAccounts, setOtherAccounts] = useState([]);
  const [accountFormState, setAccountFormState] = useState({
    mode: "create",
    editAccount: null,
    returnScreen: "profile",
  });
  const [dismissedRequestIds, setDismissedRequestIds] = useState([]);
  const [adminMessages, setAdminMessages] = useState([]);
  const [dismissedAdminMessageIds, setDismissedAdminMessageIds] = useState([]);
  const [seenNotificationIds, setSeenNotificationIds] = useState(() =>
    readStoredIds(SEEN_NOTIFICATION_IDS_KEY)
  );
  const [seenTransactionIds, setSeenTransactionIds] = useState(() =>
    readStoredIds(SEEN_TRANSACTION_IDS_KEY)
  );
  const [isMainAccountNumberHidden, setIsMainAccountNumberHidden] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(DASHBOARD_ACCOUNT_NUMBER_HIDDEN_KEY) === "true";
  });
  const [hiddenOtherAccountIds, setHiddenOtherAccountIds] = useState(() =>
    readStoredIds(DASHBOARD_HIDDEN_OTHER_ACCOUNT_IDS_KEY)
  );
  const [actionFeedback, setActionFeedback] = useState(null);
  const [paymentRequestFeedback, setPaymentRequestFeedback] = useState(null);
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
    paymentRequests,
    adminMessages,
    otherAccounts,
    recentTransactions: notificationTransactions,
  });
  const unreadNotifications = notifications.filter(
    (item) => !seenNotificationIds.includes(String(item.id))
  );
  const unseenNotificationCount = notifications.filter(
    (item) => !seenNotificationIds.includes(String(item.id))
  ).length;
  const unseenTransactionCount = recentTransactions.filter(
    (item) => !seenTransactionIds.includes(String(item.id))
  ).length;
  const activeIncomingPopupRequest = paymentRequests.find(
    (request) => request.status === "pending" && !dismissedRequestIds.includes(request.id)
  );
  const activeAdminPopupMessage = adminMessages.find(
    (message) => message.is_popup && !dismissedAdminMessageIds.includes(message.id)
  );
  const visibleOtherAccounts = otherAccounts.filter(
    (item) => !hiddenOtherAccountIds.includes(String(item.id))
  );
  const hiddenOtherAccounts = otherAccounts.filter((item) =>
    hiddenOtherAccountIds.includes(String(item.id))
  );
  const rejectedAgentAccounts = otherAccounts.filter((item) => {
    const reviewStatus = item?.metadata?.agent_profile?.review_status || item?.status || "pending";
    return item?.account_type === "agent" && reviewStatus === "rejected";
  });
  const rejectedInsuranceAccounts = otherAccounts.filter((item) => {
    const reviewStatus = item?.metadata?.insurance_profile?.review_status || item?.status || "pending";
    return item?.account_type === "insurance" && reviewStatus === "rejected";
  });
  const rejectedDonationAccounts = otherAccounts.filter((item) => {
    const reviewStatus = item?.metadata?.donation_profile?.review_status || item?.status || "pending";
    return item?.account_type === "donation" && reviewStatus === "rejected";
  });
  const eventAccounts = otherAccounts.filter((item) => item?.account_type === "tickets");
  const updateBiometricBanner = (messageTitle, message, messageTone = "info") => {
    setBiometricState((current) => ({
      ...current,
      messageTitle,
      message,
      messageTone,
    }));
  };

  const showActionFeedback = (title, message, tone = "info") => {
    setActionFeedback({ title, message, tone });
    window.clearTimeout(window.__kunthaiActionFeedbackTimer);
    window.__kunthaiActionFeedbackTimer = window.setTimeout(() => {
      setActionFeedback(null);
    }, 4500);
  };

  const openAccountForm = ({ mode = "create", editAccount = null, returnScreen = "profile" } = {}) => {
    setAccountFormState({
      mode,
      editAccount,
      returnScreen,
    });
    setActiveScreen("create-account");
  };

  const openRejectedAgentResubmission = (agentAccount, returnScreen = "dashboard") => {
    if (!agentAccount?.id) {
      return;
    }

    const reviewStatus = agentAccount?.metadata?.agent_profile?.review_status || agentAccount?.status || "pending";

    if (reviewStatus !== "rejected") {
      showActionFeedback(
        "Account already verified",
        `${agentAccount?.account_name || "This account"} can no longer be edited.`,
        "info"
      );
      return;
    }

    openAccountForm({
      mode: "resubmit",
      editAccount: agentAccount,
      returnScreen,
    });
  };

  const openRejectedInsuranceResubmission = (insuranceAccount, returnScreen = "dashboard") => {
    if (!insuranceAccount?.id) {
      return;
    }

    const reviewStatus =
      insuranceAccount?.metadata?.insurance_profile?.review_status || insuranceAccount?.status || "pending";

    if (reviewStatus !== "rejected") {
      showActionFeedback(
        "Account already verified",
        `${insuranceAccount?.account_name || "This account"} can no longer be edited.`,
        "info"
      );
      return;
    }

    openAccountForm({
      mode: "resubmit",
      editAccount: insuranceAccount,
      returnScreen,
    });
  };

  const openRejectedDonationResubmission = (donationAccount, returnScreen = "dashboard") => {
    if (!donationAccount?.id) {
      return;
    }

    const reviewStatus =
      donationAccount?.metadata?.donation_profile?.review_status || donationAccount?.status || "pending";

    if (reviewStatus !== "rejected") {
      showActionFeedback(
        "Account already verified",
        `${donationAccount?.account_name || "This account"} can no longer be edited.`,
        "info"
      );
      return;
    }

    openAccountForm({
      mode: "resubmit",
      editAccount: donationAccount,
      returnScreen,
    });
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
      const [historyData, notificationData] = await Promise.all([
        getTransactions({ userId: user?.id, limit: 5 }),
        getTransactions({ userId: user?.id, limit: 10, includeNotificationOnly: true }),
      ]);
      setRecentTransactions(historyData);
      setNotificationTransactions(notificationData);
    } catch (error) {
      console.log("Recent transactions fetch error:", error);
      setRecentTransactions([]);
      setNotificationTransactions([]);
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

  const fetchPaymentRequests = async () => {
    try {
      const [incoming, outgoing] = await Promise.all([
        getPaymentRequests({ userId: user?.id, direction: "incoming", limit: 5 }),
        getPaymentRequests({ userId: user?.id, direction: "outgoing", limit: 5 }),
      ]);
      setPaymentRequests(incoming);
      setOutgoingPaymentRequests(outgoing);
    } catch (error) {
      console.log("Payment requests fetch error:", error);
      setPaymentRequests([]);
      setOutgoingPaymentRequests([]);
    }
  };

  const fetchAdminMessages = async () => {
    try {
      const data = await getUserAdminNotifications({ userId: user?.id, limit: 10 });
      setAdminMessages(data);
    } catch (error) {
      console.log("Admin notifications fetch error:", error);
      setAdminMessages([]);
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
    clearStoredHomeScreen();
    setActiveScreen("dashboard");
    await supabase.auth.signOut(scope === "all" ? { scope: "global" } : undefined);
    navigate("/login?reason=signed-out", { replace: true });
  };

  const openIncomingPaymentRequest = async (request) => {
    if (!request?.id) {
      return;
    }

    try {
      const viewed = await markPaymentRequestViewed(request.id);
      setSelectedPaymentRequest(viewed || request);
      setPaymentRequestFeedback({
        tone: "info",
        title: "Payment request opened",
        message: "You can review the request details below before paying or declining.",
      });
    } catch (error) {
      console.log("Payment request view error:", error);
      setSelectedPaymentRequest(request);
    }

    await fetchPaymentRequests();
    setActiveScreen("payment-request-detail");
  };

  const declineIncomingPaymentRequest = async (request) => {
    if (!request?.id) {
      return;
    }

    try {
      await resolvePaymentRequest(request.id, "declined");
      await fetchPaymentRequests();
      showActionFeedback(
        "Payment request declined",
        "The requester has been updated that you did not approve this payment request.",
        "warning"
      );
    } catch (error) {
      console.log("Payment request decline error:", error);
      showActionFeedback(
        "Action unsuccessful",
        error instanceof Error ? error.message : "The payment request could not be declined.",
        "danger"
      );
    } finally {
      setDismissedRequestIds((current) => [...new Set([...current, request.id])]);
    }
  };

  useEffect(() => {
    fetchAccount();
    fetchProfile();
    fetchRecentTransactions();
    fetchOtherAccounts();
    fetchPaymentRequests();
    fetchAdminMessages();
  }, [user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (PERSISTED_HOME_SCREENS.has(activeScreen)) {
      persistHomeScreen(activeScreen, PERSISTED_HOME_SCREENS);
      markHomeScreenActiveNow();
    }
  }, [activeScreen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        markHomeScreenActiveNow();
        return;
      }

      if (document.visibilityState !== "visible") {
        return;
      }

      const lastActiveAt = getHomeScreenLastActiveAt();

      if (lastActiveAt && Date.now() - lastActiveAt > HOME_SCREEN_RESUME_WINDOW_MS) {
        clearStoredHomeScreen();
        setActiveScreen("dashboard");
        return;
      }

      markHomeScreenActiveNow();
    };

    const handlePageHide = () => {
      markHomeScreenActiveNow();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      SEEN_NOTIFICATION_IDS_KEY,
      JSON.stringify(seenNotificationIds.slice(-120))
    );
  }, [seenNotificationIds]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      SEEN_TRANSACTION_IDS_KEY,
      JSON.stringify(seenTransactionIds.slice(-120))
    );
  }, [seenTransactionIds]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      DASHBOARD_ACCOUNT_NUMBER_HIDDEN_KEY,
      String(isMainAccountNumberHidden)
    );
  }, [isMainAccountNumberHidden]);

  useEffect(() => {
    persistStoredIds(DASHBOARD_HIDDEN_OTHER_ACCOUNT_IDS_KEY, hiddenOtherAccountIds);
  }, [hiddenOtherAccountIds]);

  useEffect(() => {
    if (activeScreen === "notifications" && notifications.length) {
      setSeenNotificationIds((current) => [
        ...new Set([...current, ...notifications.map((item) => String(item.id))]),
      ]);
    }
  }, [activeScreen, notifications]);

  useEffect(() => {
    if (activeScreen === "transactions" && recentTransactions.length) {
      setSeenTransactionIds((current) => [
        ...new Set([...current, ...recentTransactions.map((item) => String(item.id))]),
      ]);
    }
  }, [activeScreen, recentTransactions]);

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
      {actionFeedback ? (
        <div className="sticky top-3 z-[90] px-4 pt-4 md:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <ActionBanner tone={actionFeedback.tone} title={actionFeedback.title}>
              {actionFeedback.message}
            </ActionBanner>
          </div>
        </div>
      ) : null}

      {activeScreen === "dashboard" && (
        <>
          <Header
            setActiveScreen={setActiveScreen}
            displayName={profileName}
            loading={accountLoading || profileLoading || transactionsLoading || otherAccountsLoading}
            profile={profile}
            notificationCount={unseenNotificationCount}
            transactionCount={unseenTransactionCount}
          />

          {renderKycNotice()}

          {activeIncomingPopupRequest ? (
            <div className="px-4 pt-4 md:px-8 lg:px-12">
              <div className="rounded-[28px] border border-emerald-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                      Payment requested form
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                      {activeIncomingPopupRequest.requester_name} is requesting payment
                    </h3>
                    <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                      <p>From Account holder name: {activeIncomingPopupRequest.requester_name}</p>
                      <p>Account number: {activeIncomingPopupRequest.requester_account_number}</p>
                      <p>Amount requested: {formatCurrency(activeIncomingPopupRequest.amount || 0, activeIncomingPopupRequest.currency || "SLL")}</p>
                      <p>Reason for request: {activeIncomingPopupRequest.reason || "No reason added"}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => openIncomingPaymentRequest(activeIncomingPopupRequest)}
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => declineIncomingPaymentRequest(activeIncomingPopupRequest)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {!activeIncomingPopupRequest && activeAdminPopupMessage ? (
            <div className="px-4 pt-4 md:px-8 lg:px-12">
              <div className="rounded-[28px] border border-sky-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sky-700">
                      Admin notification
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                      {activeAdminPopupMessage.title}
                    </h3>
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {activeAdminPopupMessage.body}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveScreen("notifications")}
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDismissedAdminMessageIds((current) => [
                          ...new Set([...current, activeAdminPopupMessage.id]),
                        ])
                      }
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {rejectedAgentAccounts.length ? (
            <div className="px-4 pt-4 md:px-8 lg:px-12">
              <div className="rounded-[28px] border border-amber-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-amber-700">
                      Agent account update needed
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                      {rejectedAgentAccounts[0]?.account_name || "Agent account"} needs to be updated
                    </h3>
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {rejectedAgentAccounts[0]?.metadata?.agent_profile?.rejection_reason ||
                        rejectedAgentAccounts[0]?.metadata?.agent_profile?.rejection_comment ||
                        "The admin team asked for corrections before this account can be approved."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => openRejectedAgentResubmission(rejectedAgentAccounts[0], "dashboard")}
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Open
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {rejectedInsuranceAccounts.length ? (
            <div className="px-4 pt-4 md:px-8 lg:px-12">
              <div className="rounded-[28px] border border-amber-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-amber-700">
                      Insurance account update needed
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                      {rejectedInsuranceAccounts[0]?.account_name || "Insurance account"} needs to be updated
                    </h3>
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {rejectedInsuranceAccounts[0]?.metadata?.insurance_profile?.rejection_reason ||
                        rejectedInsuranceAccounts[0]?.metadata?.insurance_profile?.rejection_comment ||
                        "The admin team asked for corrections before this insurance account can be approved."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        openRejectedInsuranceResubmission(rejectedInsuranceAccounts[0], "dashboard")
                      }
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Open
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {rejectedDonationAccounts.length ? (
            <div className="px-4 pt-4 md:px-8 lg:px-12">
              <div className="rounded-[28px] border border-amber-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-amber-700">
                      Donation account update needed
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                      {rejectedDonationAccounts[0]?.account_name || "Donation account"} needs to be updated
                    </h3>
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {rejectedDonationAccounts[0]?.metadata?.donation_profile?.rejection_reason ||
                        rejectedDonationAccounts[0]?.metadata?.donation_profile?.rejection_comment ||
                        "The admin team asked for corrections before this donation account can be approved."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        openRejectedDonationResubmission(rejectedDonationAccounts[0], "dashboard")
                      }
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Open
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <Dashboard
            account={accountLoading ? null : account}
            refreshAccount={refreshWalletData}
            otherAccounts={visibleOtherAccounts}
            user={user}
            profile={profile}
            isMainAccountNumberHidden={isMainAccountNumberHidden}
            onHideMainAccountNumber={() => setIsMainAccountNumberHidden(true)}
            onHideOtherAccount={(accountId) =>
              setHiddenOtherAccountIds((current) => [
                ...new Set([...current, String(accountId)]),
              ])
            }
            onMoveOtherAccountToMain={(otherAccount) =>
              showActionFeedback(
                "Move to main coming soon",
                `${otherAccount?.account_name || "This account"} is ready for a future move-to-main flow, but the transfer action is not connected yet.`,
                "info"
              )
            }
            onEditRejectedAgent={(agentAccount) =>
              openRejectedAgentResubmission(agentAccount, "dashboard")
            }
            onEditRejectedInsurance={(insuranceAccount) =>
              openRejectedInsuranceResubmission(insuranceAccount, "dashboard")
            }
            onEditRejectedDonation={(donationAccount) =>
              openRejectedDonationResubmission(donationAccount, "dashboard")
            }
          />
        </>
      )}

      {activeScreen === "transactions" && (
        <TransactionsScreen
          setActiveScreen={setActiveScreen}
          account={account}
          profile={profile}
          initialSelectedTransactionId={selectedTransactionId}
          onReceiptOpened={() => setSelectedTransactionId(null)}
        />
      )}

      {activeScreen === "notifications" && (
        <NotificationScreen
          notifications={unreadNotifications}
          onBack={() => setActiveScreen("dashboard")}
          onAction={async (item, type) => {
            const action = type === "secondary" ? item.secondaryAction : item.action;

            if (action === "kyc") {
              navigate("/kyc");
              return;
            }

            if (action === "transactions") {
              setActiveScreen("transactions");
              return;
            }

            if (action === "transaction-receipt") {
              setSelectedTransactionId(item.transactionId || null);
              setActiveScreen("transactions");
              return;
            }

            if (action === "notifications-only") {
              return;
            }

            if (action === "admin-message") {
              if (item.id) {
                setDismissedAdminMessageIds((current) => [...new Set([...current, item.id])]);
              }
              return;
            }

            if (action === "agent-account-resubmit") {
              const targetAccount = otherAccounts.find((accountItem) => accountItem.id === item.accountId);

              if (targetAccount) {
                openRejectedAgentResubmission(targetAccount, "notifications");
              }
              return;
            }

            if (action === "insurance-account-resubmit") {
              const targetAccount = otherAccounts.find((accountItem) => accountItem.id === item.accountId);

              if (targetAccount) {
                openRejectedInsuranceResubmission(targetAccount, "notifications");
              }
              return;
            }

            if (action === "donation-account-resubmit") {
              const targetAccount = otherAccounts.find((accountItem) => accountItem.id === item.accountId);

              if (targetAccount) {
                openRejectedDonationResubmission(targetAccount, "notifications");
              }
              return;
            }

            if (action === "payment-request-view") {
              await openIncomingPaymentRequest(item.request);
              return;
            }

            if (action === "payment-request-outgoing-view") {
              setSelectedPaymentRequest(item.request);
              setPaymentRequestFeedback({
                tone: "info",
                title: "Outgoing request opened",
                message: "You are viewing the current status of the payment request you sent.",
              });
              setActiveScreen("payment-request-detail");
              return;
            }

            if (action === "payment-request-cancel") {
              try {
                if (item.request?.recipient_user_id === user?.id) {
                  await declineIncomingPaymentRequest(item.request);
                } else {
                  await cancelPaymentRequest(item.requestId);
                  await fetchPaymentRequests();
                  showActionFeedback(
                    "Payment request cancelled",
                    "Your request has been cancelled successfully.",
                    "warning"
                  );
                }
              } catch (error) {
                console.log("Payment request cancel error:", error);
                showActionFeedback(
                  "Action unsuccessful",
                  error instanceof Error ? error.message : "The payment request could not be cancelled.",
                  "danger"
                );
              }
            }
          }}
        />
      )}

      {activeScreen === "payment-request-detail" && (
        <PaymentRequestDetailScreen
          request={selectedPaymentRequest}
          mode={selectedPaymentRequest?.recipient_user_id === user?.id ? "incoming" : "outgoing"}
          feedback={paymentRequestFeedback}
          onBack={() => {
            setPaymentRequestFeedback(null);
            setSelectedPaymentRequest(null);
            setActiveScreen("notifications");
          }}
          onPayNow={() => setActiveScreen("payment-request-transfer")}
          onCancel={async () => {
            if (!selectedPaymentRequest?.id) {
              setActiveScreen("notifications");
              return;
            }

            try {
              if (selectedPaymentRequest?.recipient_user_id === user?.id) {
                await resolvePaymentRequest(selectedPaymentRequest.id, "declined");
                showActionFeedback(
                  "Payment request declined",
                  "The request has been declined successfully.",
                  "warning"
                );
              } else {
                await cancelPaymentRequest(selectedPaymentRequest.id);
                showActionFeedback(
                  "Payment request cancelled",
                  "Your outgoing payment request has been cancelled.",
                  "warning"
                );
              }
              await fetchPaymentRequests();
            } catch (error) {
              console.log("Payment request cancel error:", error);
              showActionFeedback(
                "Action unsuccessful",
                error instanceof Error ? error.message : "The payment request could not be updated.",
                "danger"
              );
            } finally {
              setPaymentRequestFeedback(null);
              setSelectedPaymentRequest(null);
              setActiveScreen("notifications");
            }
          }}
        />
      )}

      {activeScreen === "payment-request-transfer" && (
        <PaymentRequestTransferScreen
          account={account}
          request={selectedPaymentRequest}
          refreshAccount={refreshWalletData}
          onBack={() => setActiveScreen("payment-request-detail")}
          onTransferSuccess={async () => {
            if (selectedPaymentRequest?.id) {
              try {
                await resolvePaymentRequest(selectedPaymentRequest.id, "accepted");
                showActionFeedback(
                  "Payment sent successfully",
                  "The requested payment has been completed and the requester has been updated.",
                  "success"
                );
              } catch (error) {
                console.log("Payment request accept error:", error);
                showActionFeedback(
                  "Transfer completed, but request update failed",
                  error instanceof Error
                    ? error.message
                    : "The money transfer worked, but the request status could not be updated.",
                  "warning"
                );
              }
            }

            await fetchPaymentRequests();
            setPaymentRequestFeedback(null);
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
          onOpenCreateAccount={() => openAccountForm({ mode: "create", returnScreen: "profile" })}
          onOpenChangePin={() => openProtectedSecurityScreen("change-pin")}
          onOpenChangePassword={() => openProtectedSecurityScreen("change-password")}
          onOpenTransactions={() => setActiveScreen("transactions")}
          onOpenNotifications={() => setActiveScreen("notifications")}
          isAdmin={user?.app_metadata?.role === "admin"}
          onOpenAdmin={() => navigate("/admin")}
          onOpenHelp={() => setActiveScreen("dashboard")}
          onSignOut={handleSignOut}
          biometrics={biometricState}
          onToggleBiometrics={handleToggleBiometrics}
          appearance={{ isDarkMode }}
          onToggleAppearance={toggleTheme}
          isMainAccountNumberHidden={isMainAccountNumberHidden}
          hiddenOtherAccounts={hiddenOtherAccounts}
          onShowMainAccountNumber={() => {
            setIsMainAccountNumberHidden(false);
            showActionFeedback(
              "Account number added to dashboard",
              "Your main account number is now visible on the dashboard.",
              "success"
            );
          }}
          onShowOtherAccount={(accountId) => {
            setHiddenOtherAccountIds((current) =>
              current.filter((hiddenId) => hiddenId !== String(accountId))
            );
            showActionFeedback(
              "Account number added to dashboard",
              "The selected account number is now visible on the dashboard.",
              "success"
            );
          }}
          hasEventAccount={eventAccounts.length > 0}
          onOpenEventTickets={() => setActiveScreen("event-tickets")}
          onOpenEventManager={() => setActiveScreen("event-manager")}
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

      {activeScreen === "event-tickets" && (
        <EventTicketsScreen user={user} onBack={() => setActiveScreen("profile")} />
      )}

      {activeScreen === "event-manager" && (
        <EventSellerScreen
          user={user}
          eventAccounts={eventAccounts}
          onBack={() => setActiveScreen("profile")}
        />
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
          mode={accountFormState.mode}
          editAccount={accountFormState.editAccount}
          rejectionReason={
            accountFormState.editAccount?.metadata?.agent_profile?.rejection_reason ||
            accountFormState.editAccount?.metadata?.agent_profile?.rejection_comment ||
            accountFormState.editAccount?.metadata?.insurance_profile?.rejection_reason ||
            accountFormState.editAccount?.metadata?.insurance_profile?.rejection_comment ||
            accountFormState.editAccount?.metadata?.donation_profile?.rejection_reason ||
            accountFormState.editAccount?.metadata?.donation_profile?.rejection_comment ||
            ""
          }
          onBack={() => {
            const nextScreen = accountFormState.returnScreen || "profile";
            setAccountFormState({
              mode: "create",
              editAccount: null,
              returnScreen: "profile",
            });
            setActiveScreen(nextScreen);
          }}
          onCreate={async (payload) => {
            if (accountFormState.mode === "resubmit" && accountFormState.editAccount?.id) {
              const isInsuranceResubmission =
                accountFormState.editAccount?.account_type === "insurance";
              const isDonationResubmission =
                accountFormState.editAccount?.account_type === "donation";
              const reviewStatus = isInsuranceResubmission
                ? accountFormState.editAccount?.metadata?.insurance_profile?.review_status ||
                  accountFormState.editAccount?.status ||
                  "pending"
                : isDonationResubmission
                  ? accountFormState.editAccount?.metadata?.donation_profile?.review_status ||
                    accountFormState.editAccount?.status ||
                    "pending"
                : accountFormState.editAccount?.metadata?.agent_profile?.review_status ||
                  accountFormState.editAccount?.status ||
                  "pending";

              if (reviewStatus !== "rejected") {
                throw new Error("This account has already been verified and can no longer be edited.");
              }

              if (isInsuranceResubmission) {
                await resubmitInsuranceAccount(accountFormState.editAccount.id, payload);
                showActionFeedback(
                  "Insurance account resubmitted",
                  "Your updated insurance details and fresh documents have been sent back to the admin team for review.",
                  "success"
                );
              } else if (isDonationResubmission) {
                await resubmitDonationAccount(accountFormState.editAccount.id, payload);
                showActionFeedback(
                  "Donation account resubmitted",
                  "Your updated donation details and fresh documents have been sent back to the admin team for review.",
                  "success"
                );
              } else {
                await resubmitAgentAccount(accountFormState.editAccount.id, payload);
                showActionFeedback(
                  "Agent account resubmitted",
                  "Your updated name and fresh business documents have been sent back to the admin team for review.",
                  "success"
                );
              }
            } else {
              await createOtherAccount(payload);
            }
            await fetchOtherAccounts();
            await fetchAdminMessages();
            setAccountFormState({
              mode: "create",
              editAccount: null,
              returnScreen: "profile",
            });
            setActiveScreen("dashboard");
          }}
        />
      )}
    </div>
  );
}
