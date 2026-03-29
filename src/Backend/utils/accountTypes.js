export const MAIN_ACCOUNT_TYPE = "main";
export const FOREIGN_ACCOUNT_TYPE = "foreign";

export const AUTO_CREATED_ACCOUNT_TYPES = ["business", "transport"];

export const MANUAL_OTHER_ACCOUNT_TYPES = [
  "merchant",
  "airtime",
  "electricity",
  "government",
  "hotel",
  "insurance",
  "internet",
  "pharmacy",
  "restaurant",
  "school_fees",
  "supermarket",
  "tickets",
  "tv_subscription",
  "donation",
  FOREIGN_ACCOUNT_TYPE,
];

export const OTHER_ACCOUNT_TYPES = [...AUTO_CREATED_ACCOUNT_TYPES, ...MANUAL_OTHER_ACCOUNT_TYPES];

export const ACCOUNT_TYPE_OPTIONS = [
  { value: "merchant", label: "Merchant Account", currency: "local" },
  { value: "airtime", label: "Airtime Account", currency: "local" },
  { value: "electricity", label: "Electricity Account", currency: "local" },
  { value: "government", label: "Gov Account", currency: "local" },
  { value: "hotel", label: "Hotel Account", currency: "local" },
  { value: "insurance", label: "Insurance Account", currency: "local" },
  { value: "internet", label: "Internet Account", currency: "local" },
  { value: "pharmacy", label: "Pharmacy Account", currency: "local" },
  { value: "restaurant", label: "Restaurant Account", currency: "local" },
  { value: "school_fees", label: "School Fees Account", currency: "local" },
  { value: "supermarket", label: "Supermarket Account", currency: "local" },
  { value: "tickets", label: "Tickets Account", currency: "local" },
  { value: "tv_subscription", label: "TV Subscription Account", currency: "local" },
  { value: "donation", label: "Donation Account", currency: "local" },
  { value: FOREIGN_ACCOUNT_TYPE, label: "Foreign Account", currency: "USD" },
];

export function getAccountTypeLabel(accountType) {
  return (
    ACCOUNT_TYPE_OPTIONS.find((option) => option.value === accountType)?.label ||
    accountType
      ?.split?.("_")
      ?.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      ?.join?.(" ") ||
    "Account"
  );
}
