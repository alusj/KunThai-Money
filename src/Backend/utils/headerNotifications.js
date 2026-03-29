import { formatCurrency } from "./formatCurrency";

function buildTransactionMessage(transaction) {
  const amount = formatCurrency(transaction.amount ?? 0, transaction.currency || "USD");
  const counterparty =
    transaction.counterparty_name || transaction.description || transaction.transaction_type || "activity";

  return transaction.direction === "credit"
    ? `${amount} received from ${counterparty}`
    : `${amount} sent for ${counterparty}`;
}

export function buildHeaderNotifications({ status, account, transactions = [] }) {
  const items = [];

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
  } else if (status.kycStatus === "approved") {
    items.push({
      id: "kyc-approved",
      tone: "success",
      title: "KYC verified",
      body: "Your account identity check has been approved successfully.",
      action: "kyc",
    });
  }

  if (account?.account_number) {
    items.push({
      id: "account-ready",
      tone: "neutral",
      title: "Account ready for transfers",
      body: `Main account ${account.account_number} is active for cross-border activity.`,
      action: "transactions",
    });
  }

  transactions.slice(0, 2).forEach((transaction) => {
    items.push({
      id: transaction.id,
      tone: transaction.direction === "credit" ? "success" : "info",
      title: transaction.direction === "credit" ? "Cash in recorded" : "Cash out recorded",
      body: buildTransactionMessage(transaction),
      action: "transactions",
    });
  });

  if (!transactions.length) {
    items.push({
      id: "no-transactions",
      tone: "neutral",
      title: "No recent transactions yet",
      body: "Your cash in and cash out activity will appear here as soon as you start transacting.",
      action: "transactions",
    });
  }

  return items.slice(0, 4);
}
