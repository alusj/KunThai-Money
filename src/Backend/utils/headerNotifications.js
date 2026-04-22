import { formatCurrency } from "./formatCurrency";
import {
  getAccountRejectionReason,
  getAccountReviewBadge,
  getReviewAccountConfig,
  getNormalizedAccountReviewStatus,
} from "./accountReview";
import { buildServiceNotification } from "./serviceTransactions";

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

export function buildHeaderNotifications({
  status,
  paymentRequests = [],
  outgoingPaymentRequests = [],
  adminMessages = [],
  otherAccounts = [],
  recentTransactions = [],
  activityNotifications = [],
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
        category: "Payments",
        created_at: request.created_at,
      });
    });

  outgoingPaymentRequests
    .filter((request) => request.status && request.status !== "pending")
    .slice(0, 3)
    .forEach((request) => {
      const titleMap = {
        viewed: "Payment request viewed",
        accepted: "Payment request accepted",
        declined: "Payment request declined",
        cancelled: "Payment request cancelled",
      };
      const toneMap = {
        viewed: "info",
        accepted: "success",
        declined: "warning",
        cancelled: "neutral",
      };
      const amount = formatCurrency(request.amount ?? 0, request.currency || "SLL");
      const recipientName = request.recipient_name || "The recipient";
      const bodyMap = {
        viewed: `${recipientName} opened your request for ${amount}.`,
        accepted: `${recipientName} accepted your request for ${amount}.`,
        declined: `${recipientName} declined your request for ${amount}.`,
        cancelled: `Your payment request for ${amount} has been cancelled.`,
      };

      items.push({
        id: `outgoing-request-${request.id}-${request.status}`,
        tone: toneMap[request.status] || "info",
        title: titleMap[request.status] || "Payment request updated",
        body:
          bodyMap[request.status] ||
          `Your payment request status is now ${request.status}.`,
        action: "payment-request-outgoing-view",
        actionLabel: "Open",
        requestId: request.id,
        request,
        category: "Payments",
        created_at: request.updated_at || request.created_at,
      });
    });

  if (!status?.hasKyc) {
    items.push({
      id: "kyc-missing",
      tone: "warning",
      title: "Complete KYC verification",
      body: "Verify your identity to strengthen account trust and unlock future protected features.",
      action: "kyc",
      category: "Security",
    });
  } else if (status.kycStatus === "pending") {
    items.push({
      id: "kyc-pending",
      tone: "info",
      title: "Verification under review",
      body: "Your identity submission is in review. We will update your account once compliance clears it.",
      action: "kyc",
      category: "Security",
    });
  } else if (status.kycStatus === "rejected") {
    items.push({
      id: "kyc-rejected",
      tone: "warning",
      title: "KYC needs attention",
      body: "Your identity review needs an update. Open KYC to review the details and submit again.",
      action: "kyc",
      category: "Security",
    });
  } else if (status.kycStatus === "approved") {
    items.push({
      id: "kyc-approved",
      tone: "success",
      title: "KYC verified",
      body: "Your account identity check has been approved successfully.",
      action: "kyc",
      category: "Security",
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
      category: "Admin",
      ...message,
    });
  });

  otherAccounts
    .filter((account) => {
      const reviewStatus = getNormalizedAccountReviewStatus(account);
      return reviewStatus === "rejected" || reviewStatus === "approved";
    })
    .slice(0, 4)
    .forEach((account, index) => {
      const reviewConfig = getReviewAccountConfig(account?.account_type);
      const reviewStatus = getNormalizedAccountReviewStatus(account);
      const reviewBadge = getAccountReviewBadge(account);

      if (!reviewConfig) {
        return;
      }

      items.push({
        id: `${account.account_type}-${reviewStatus}-${account.id || index}`,
        tone: reviewStatus === "approved" ? "success" : "warning",
        title:
          reviewStatus === "approved"
            ? `${account.account_name || reviewConfig.title} approved`
            : `${account.account_name || reviewConfig.title} needs changes`,
        body:
          reviewStatus === "approved"
            ? reviewBadge?.description || `${account.account_name || reviewConfig.title} is ready to use.`
            : `Reason: ${getAccountRejectionReason(account)}`,
        action: reviewStatus === "approved" ? "notifications-only" : reviewConfig.action,
        actionLabel: reviewStatus === "approved" ? "Reviewed" : "Open",
        accountId: account.id,
        category: "Accounts",
        created_at: account.updated_at || account.created_at,
      });
    });

  recentTransactions
    .map(buildServiceNotification)
    .filter(Boolean)
    .forEach((item) => {
      items.push(item);
    });

  activityNotifications.forEach((item) => {
    items.push(item);
  });

  return items
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 12);
}
