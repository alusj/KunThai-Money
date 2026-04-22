import { normalizeCurrencyCode } from "./currency";
import { formatCurrency } from "./formatCurrency";

const SERVICE_FLOW_CONFIG = {
  merchant_payment: {
    serviceName: "Merchant",
    accountLabel: "merchant account",
    metadataNameKeys: ["merchant_account_name", "recipient_name"],
    reasonKeys: ["purchase_description", "note"],
    paymentMethod: "Merchant payment",
  },
  agent_transfer: {
    serviceName: "Agent Transfer",
    accountLabel: "agent account",
    metadataNameKeys: ["agent_account_name", "recipient_name"],
    reasonKeys: ["note"],
    paymentMethod: "Agent transfer",
  },
  hotel_payment: {
    serviceName: "Hotel",
    accountLabel: "hotel account",
    metadataNameKeys: ["hotel_account_name", "recipient_name"],
    reasonKeys: ["hotel_note", "note"],
    paymentMethod: "Hotel payment",
  },
  school_payment: {
    serviceName: "School Fees",
    accountLabel: "school account",
    metadataNameKeys: ["school_account_name", "recipient_name"],
    reasonKeys: ["school_note", "note"],
    paymentMethod: "School fees payment",
  },
  restaurant_payment: {
    serviceName: "Restaurant",
    accountLabel: "restaurant account",
    metadataNameKeys: ["restaurant_account_name", "recipient_name"],
    reasonKeys: ["restaurant_note", "note"],
    paymentMethod: "Restaurant payment",
  },
  supermarket_payment: {
    serviceName: "Supermarket",
    accountLabel: "supermarket account",
    metadataNameKeys: ["supermarket_account_name", "recipient_name"],
    reasonKeys: ["supermarket_note", "note"],
    paymentMethod: "Supermarket payment",
  },
  pharmacy_payment: {
    serviceName: "Pharmacy",
    accountLabel: "pharmacy account",
    metadataNameKeys: ["pharmacy_account_name", "recipient_name"],
    reasonKeys: ["pharmacy_note", "note"],
    paymentMethod: "Pharmacy payment",
  },
  insurance_payment: {
    serviceName: "Insurance",
    accountLabel: "insurance account",
    metadataNameKeys: ["insurance_account_name", "recipient_name"],
    reasonKeys: ["insurance_note", "note"],
    paymentMethod: "Insurance payment",
  },
  donation_payment: {
    serviceName: "Donation",
    accountLabel: "donation account",
    metadataNameKeys: ["donation_account_name", "recipient_name"],
    reasonKeys: ["donation_note", "note"],
    paymentMethod: "Donation payment",
  },
  event_ticket_purchase: {
    serviceName: "Event Ticket",
    accountLabel: "event account",
    metadataNameKeys: ["event_name", "recipient_name"],
    reasonKeys: ["ticket_category_name", "note"],
    paymentMethod: "Event ticket payment",
  },
};

export function getServiceFlowConfig(flow) {
  return SERVICE_FLOW_CONFIG[flow] || null;
}

export function getTransactionSubject(transactionOrFlow) {
  const flow =
    typeof transactionOrFlow === "string"
      ? transactionOrFlow
      : transactionOrFlow?.metadata?.flow;
  const config = getServiceFlowConfig(flow);
  return config ? `${config.serviceName} Transaction` : null;
}

function pickFirstValue(source, keys = []) {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return value;
    }
  }
  return "";
}

export function resolveServiceCounterpartyName(transaction) {
  const config = getServiceFlowConfig(transaction?.metadata?.flow);
  if (!config) {
    return "";
  }

  return (
    pickFirstValue(transaction?.metadata, config.metadataNameKeys) ||
    transaction?.counterparty_name ||
    config.accountLabel
  );
}

export function resolveTransactionReason(transaction) {
  const config = getServiceFlowConfig(transaction?.metadata?.flow);
  return (
    pickFirstValue(transaction?.metadata, config?.reasonKeys || []) ||
    transaction?.metadata?.reason ||
    transaction?.metadata?.note ||
    transaction?.description ||
    "No note added"
  );
}

export function buildStandardServiceMetadata(baseMetadata = {}) {
  const flow = baseMetadata?.flow;
  const config = getServiceFlowConfig(flow);

  if (!config) {
    return baseMetadata;
  }

  return {
    ...baseMetadata,
    service_name: baseMetadata.service_name || config.serviceName,
    transaction_subject:
      baseMetadata.transaction_subject || `${config.serviceName} Transaction`,
    receipt_title:
      baseMetadata.receipt_title || `${config.serviceName} Transaction Receipt`,
    payment_method: baseMetadata.payment_method || config.paymentMethod,
  };
}

export function buildServiceNotification(transaction) {
  const config = getServiceFlowConfig(transaction?.metadata?.flow);
  if (!config) {
    return null;
  }

  const amount = formatCurrency(transaction.amount ?? 0, transaction.currency || "SLL");
  const counterparty = resolveServiceCounterpartyName(transaction);
  const subject = transaction?.metadata?.transaction_subject || `${config.serviceName} Transaction`;

  return {
    id: `${transaction.metadata.flow}-${transaction.id}`,
    tone: "info",
    title: subject,
    body:
      transaction.direction === "credit"
        ? `${subject} received from ${counterparty} for ${amount}.`
        : `${subject} completed with ${counterparty} for ${amount}.`,
    action: "transaction-receipt",
    actionLabel: "View receipt",
    transactionId: String(transaction.id),
    created_at: transaction.created_at,
  };
}

export function buildWalletTransferNotification(transaction) {
  const flow = transaction?.metadata?.flow;

  if (flow !== "dashboard_account_number_transfer") {
    return null;
  }

  const amount = formatCurrency(transaction.amount ?? 0, transaction.currency || "SLL");
  const counterparty =
    transaction?.metadata?.recipient_name ||
    transaction?.metadata?.sender_name ||
    transaction?.counterparty_name ||
    transaction?.counterparty_account ||
    "wallet user";

  return {
    id: `wallet-transfer-${transaction.id}`,
    tone: transaction.direction === "credit" ? "success" : "info",
    title:
      transaction.direction === "credit"
        ? "Wallet transfer received"
        : "Wallet transfer sent",
    body:
      transaction.direction === "credit"
        ? `${amount} was received from ${counterparty}.`
        : `${amount} was sent to ${counterparty}.`,
    action: "transaction-receipt",
    actionLabel: "View receipt",
    transactionId: String(transaction.id),
    category: "Transfers",
    created_at: transaction.created_at,
  };
}

export function buildServiceReceiptModel(transaction, { personName, personImage, personAccount }) {
  const direction = transaction.direction === "credit" ? "credit" : "debit";
  const amount = Number(transaction.amount || 0);
  const currency = normalizeCurrencyCode(transaction.currency) || "SLL";
  const config = getServiceFlowConfig(transaction?.metadata?.flow);
  const subject =
    transaction?.metadata?.transaction_subject ||
    (config ? `${config.serviceName} Transaction` : null);
  const title =
    transaction?.metadata?.receipt_title ||
    (subject ? `${subject} Receipt` : direction === "credit" ? "Cash In Receipt" : "Cash Out Receipt");

  return {
    direction,
    title,
    subject: subject || (direction === "credit" ? "Cash In Transaction" : "Cash Out Transaction"),
    serviceName: config?.serviceName || "",
    personName,
    personImage,
    personAccount,
    amount,
    currency,
    dateTime: transaction.created_at,
    transactionId:
      transaction.metadata?.transaction_id ||
      transaction.metadata?.sender_transaction_id ||
      transaction.metadata?.receiver_transaction_id ||
      transaction.id ||
      "Pending",
    referenceId:
      transaction.metadata?.payment_reference ||
      transaction.metadata?.reference_number ||
      transaction.metadata?.reference ||
      transaction.metadata?.transaction_reference ||
      transaction.id ||
      "Pending",
    reason: resolveTransactionReason(transaction),
    fee: Number(transaction.metadata?.transaction_fee || transaction.metadata?.fee || 0),
    tax: Number(transaction.metadata?.tax_amount || transaction.metadata?.tax || 0),
    totalSent:
      direction === "debit"
        ? Number(
            transaction.metadata?.total_amount ||
              amount +
                Number(transaction.metadata?.transaction_fee || transaction.metadata?.fee || 0) +
                Number(transaction.metadata?.tax_amount || transaction.metadata?.tax || 0)
          )
        : amount,
    paymentMethod:
      transaction.metadata?.payment_method ||
      config?.paymentMethod ||
      (direction === "credit" ? "Cash in" : "Cash out"),
  };
}
