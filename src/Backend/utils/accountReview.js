import { EVENT_ACCOUNT_TYPE, getAccountTypeLabel } from "./accountTypes";

export const REVIEW_ACCOUNT_CONFIG = {
  agent: {
    profileKey: "agent_profile",
    action: "agent-account-resubmit",
    noun: "agent account",
    title: "Agent account",
    rejectedDefault:
      "Please review your account name and upload fresh business documents before resubmitting.",
    pendingDescription:
      "This agent account is waiting for admin review before it can be used.",
    approvedDescription:
      "This agent account has been approved by the admin team and is ready to use.",
    resubmissionSuccessTitle: "Agent account resubmitted",
    resubmissionSuccessBody:
      "Your updated name and fresh business documents have been sent back to the admin team for review.",
    adminApproveTitle: "Agent account approved",
    adminApproveBody:
      "Your {accountName} account has been approved by the admin team and is now ready to use.",
    adminRejectTitle: "Agent account needs attention",
    adminRejectBody:
      "Your {accountName} account request was rejected by the admin team. Reason: {comment}. Please update your account details and upload fresh business documents before resubmitting.",
    rejectValidationMessage: "Add a rejection reason before rejecting an agent account.",
    accountUpdatedTitle: "Agent account update needed",
    accountUpdatedFallback:
      "The admin team asked for corrections before this agent account can be approved.",
  },
  insurance: {
    profileKey: "insurance_profile",
    action: "insurance-account-resubmit",
    noun: "insurance account",
    title: "Insurance account",
    rejectedDefault:
      "Please review your insurance details and upload fresh verification documents before resubmitting.",
    pendingDescription:
      "This insurance account is waiting for admin review before it can be used.",
    approvedDescription:
      "This insurance account has been approved by the admin team and is ready to use.",
    resubmissionSuccessTitle: "Insurance account resubmitted",
    resubmissionSuccessBody:
      "Your updated insurance details and fresh documents have been sent back to the admin team for review.",
    adminApproveTitle: "Insurance account approved",
    adminApproveBody:
      "Your {accountName} account has been approved by the admin team and is now ready to use.",
    adminRejectTitle: "Insurance account needs attention",
    adminRejectBody:
      "Your {accountName} account request was rejected by the admin team. Reason: {comment}. Please update your insurance details and upload fresh documents before resubmitting.",
    rejectValidationMessage: "Add a rejection reason before rejecting an insurance account.",
    accountUpdatedTitle: "Insurance account update needed",
    accountUpdatedFallback:
      "The admin team asked for corrections before this insurance account can be approved.",
  },
  donation: {
    profileKey: "donation_profile",
    action: "donation-account-resubmit",
    noun: "donation account",
    title: "Donation account",
    rejectedDefault:
      "Please review your donation details and upload fresh verification documents before resubmitting.",
    pendingDescription:
      "This donation account is waiting for admin review before it can be used.",
    approvedDescription:
      "This donation account has been approved by the admin team and is ready to use.",
    resubmissionSuccessTitle: "Donation account resubmitted",
    resubmissionSuccessBody:
      "Your updated donation details and fresh documents have been sent back to the admin team for review.",
    adminApproveTitle: "Donation account approved",
    adminApproveBody:
      "Your {accountName} account has been approved by the admin team and is now ready to use.",
    adminRejectTitle: "Donation account needs attention",
    adminRejectBody:
      "Your {accountName} account request was rejected by the admin team. Reason: {comment}. Please update your donation details and upload fresh documents before resubmitting.",
    rejectValidationMessage: "Add a rejection reason before rejecting a donation account.",
    accountUpdatedTitle: "Donation account update needed",
    accountUpdatedFallback:
      "The admin team asked for corrections before this donation account can be approved.",
  },
  [EVENT_ACCOUNT_TYPE]: {
    profileKey: "event_profile",
    action: "event-account-resubmit",
    noun: "event account",
    title: "Event account",
    rejectedDefault:
      "Please review your event details, schedule, and ticket setup before resubmitting.",
    pendingDescription:
      "This event account is waiting for admin review before buyers can discover or purchase tickets.",
    approvedDescription:
      "This event account has been approved by the admin team and can now accept ticket sales.",
    resubmissionSuccessTitle: "Event account resubmitted",
    resubmissionSuccessBody:
      "Your updated event details and ticket setup have been sent back to the admin team for review.",
    adminApproveTitle: "Event account approved",
    adminApproveBody:
      "Your {accountName} account has been approved by the admin team and is now ready to sell tickets.",
    adminRejectTitle: "Event account needs attention",
    adminRejectBody:
      "Your {accountName} account request was rejected by the admin team. Reason: {comment}. Please update your event details and ticket setup before resubmitting.",
    rejectValidationMessage: "Add a rejection reason before rejecting an event account.",
    accountUpdatedTitle: "Event account update needed",
    accountUpdatedFallback:
      "The admin team asked for corrections before this event account can be approved.",
  },
};

export function getReviewAccountConfig(accountType) {
  return REVIEW_ACCOUNT_CONFIG[accountType] || null;
}

export function isReviewManagedAccountType(accountType) {
  return Boolean(getReviewAccountConfig(accountType));
}

export function getAccountReviewProfile(account) {
  const config = getReviewAccountConfig(account?.account_type);
  return config ? account?.metadata?.[config.profileKey] || {} : null;
}

export function getAccountReviewStatus(account) {
  const profile = getAccountReviewProfile(account);
  if (!profile) {
    return account?.status || "";
  }

  return profile.review_status || account?.status || "pending";
}

export function getNormalizedAccountReviewStatus(account) {
  const status = getAccountReviewStatus(account);
  return status === "active" ? "approved" : status || "pending";
}

export function getAccountRejectionReason(account) {
  const profile = getAccountReviewProfile(account) || {};
  const config = getReviewAccountConfig(account?.account_type);

  return profile.rejection_reason || profile.rejection_comment || config?.rejectedDefault || "";
}

export function getAccountReviewBadge(account) {
  const config = getReviewAccountConfig(account?.account_type);
  const status = getNormalizedAccountReviewStatus(account);

  if (!config) {
    return null;
  }

  if (status === "approved") {
    return {
      tone: "success",
      label: "Approved by admin",
      description: config.approvedDescription,
    };
  }

  if (status === "rejected") {
    return {
      tone: "warning",
      label: "Needs changes",
      description: getAccountRejectionReason(account),
    };
  }

  return {
    tone: "pending",
    label: "Under review",
    description: config.pendingDescription,
  };
}

export function getAccountReviewQueueMeta(accountType) {
  const config = getReviewAccountConfig(accountType);
  const title = config?.title || getAccountTypeLabel(accountType);
  return {
    eyebrow: `${title} Review`,
    pendingTitle: `Pending ${title}s`,
    approvedTitle: `Approved ${title}s`,
    rejectedTitle: `Rejected ${title}s`,
    pendingEmpty: `No pending ${title.toLowerCase()}s right now.`,
    approvedEmpty: `No approved ${title.toLowerCase()}s yet.`,
    rejectedEmpty: `No rejected ${title.toLowerCase()}s right now.`,
  };
}

export function interpolateReviewMessage(template, values = {}) {
  return Object.entries(values).reduce((message, [key, value]) => {
    return message.replace(new RegExp(`\\{${key}\\}`, "g"), String(value ?? ""));
  }, template || "");
}
