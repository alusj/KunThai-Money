import { formatCurrency } from "./formatCurrency";
import {
  getAccountRejectionReason,
  getReviewAccountConfig,
  getNormalizedAccountReviewStatus,
} from "./accountReview";
import { buildServiceNotification } from "./serviceTransactions";

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
    .filter((account) => getNormalizedAccountReviewStatus(account) === "rejected")
    .slice(0, 4)
    .forEach((account, index) => {
      const reviewConfig = getReviewAccountConfig(account?.account_type);

      if (!reviewConfig) {
        return;
      }

      items.push({
        id: `${account.account_type}-rejected-${account.id || index}`,
        tone: "warning",
        title: `${account.account_name || reviewConfig.title} needs changes`,
        body: `Reason: ${getAccountRejectionReason(account)}`,
        action: reviewConfig.action,
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
    .map(buildServiceNotification)
    .filter(Boolean)
    .forEach((item) => {
      items.push(item);
    });

  return items
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 6);
}
