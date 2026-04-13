import { formatCurrency } from "./formatCurrency";

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
  adminMessages = [],
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

  return items.slice(0, 6);
}
