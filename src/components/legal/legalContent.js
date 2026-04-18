import { CreditCard, FileText, Shield } from "lucide-react";

export const LEGAL_CONTENT = {
  privacy: {
    title: "Privacy policy",
    icon: FileText,
    description: "How Kuntai Money collects, uses, stores, and protects customer information.",
    sections: [
      {
        heading: "Information we collect",
        body:
          "We collect the information needed to open and operate your account, including your name, phone number, date of birth, address, identity details, device signals, transaction history, and any documents you submit during verification or support requests.",
      },
      {
        heading: "How we use your information",
        body:
          "Your information is used to create and secure your account, process transfers and payments, prevent fraud, complete identity checks, comply with legal obligations, improve service performance, and send important account, security, and product communications.",
      },
      {
        heading: "Sharing and disclosure",
        body:
          "We only share customer information where necessary with licensed financial partners, payment processors, identity verification providers, mobile network operators, auditors, regulators, or law enforcement where a lawful request applies. We do not sell your personal information.",
      },
      {
        heading: "Storage and protection",
        body:
          "We keep data in secured systems protected by access controls, monitoring, encryption, and operational safeguards. We retain information only for as long as needed to provide the service, resolve disputes, enforce our agreements, and satisfy record-keeping obligations.",
      },
      {
        heading: "Your privacy choices",
        body:
          "You are responsible for keeping your profile information accurate. Subject to applicable law, you may request access to your personal data, ask for corrections, object to certain processing, or request account closure, although some records may still be retained for compliance purposes.",
      },
    ],
  },
  service: {
    title: "Terms of service",
    icon: FileText,
    description: "The main rules that govern use of the Kuntai Money platform and wallet services.",
    sections: [
      {
        heading: "Account eligibility and acceptance",
        body:
          "By creating or using a Kuntai Money account, you confirm that the information you provide is true, complete, and belongs to you. You must be legally permitted to use financial services in your jurisdiction and must not act on behalf of another person without authority.",
      },
      {
        heading: "Use of the platform",
        body:
          "You may use the service for lawful personal or approved business transactions only. You must not use the platform for fraud, money laundering, terrorism financing, unauthorized cash cycling, abusive chargebacks, sanctions evasion, or any activity that exposes the service or other users to harm.",
      },
      {
        heading: "Security responsibilities",
        body:
          "You must keep your password, PIN, OTPs, and device access credentials confidential at all times. Transactions confirmed through your authenticated session may be treated as authorized unless we determine there is evidence of system error, compromise, or prohibited activity.",
      },
      {
        heading: "Service availability and limits",
        body:
          "Some features may be subject to eligibility checks, transaction limits, maintenance windows, partner availability, or regulatory restrictions. We may delay, decline, reverse, or place a hold on a transaction where additional review is required to protect customers, partners, or the platform.",
      },
      {
        heading: "Suspension and termination",
        body:
          "We may restrict, suspend, or close an account where we detect false information, suspicious activity, non-compliance, security risk, prolonged inactivity, or a breach of these terms. Where appropriate, remaining balances will be handled in line with law, partner rules, and ongoing investigations.",
      },
    ],
  },
  fees: {
    title: "Fees and charges",
    icon: CreditCard,
    description: "A clear summary of how service charges may apply across wallet activity.",
    sections: [
      {
        heading: "General charging principle",
        body:
          "Kuntai Money aims to display applicable fees before you confirm a transaction. Charges may vary by service type, transaction amount, payment rail, currency, destination, partner network, card scheme, or whether a transaction requires manual review or reversal handling.",
      },
      {
        heading: "Common fee categories",
        body:
          "Fees may apply to cash-in by card, cash-out to bank or mobile money, merchant payments, bill payments, foreign exchange, account servicing, failed reversal handling, or premium support channels where offered. Taxes, levies, and third-party charges may be added where required.",
      },
      {
        heading: "When fees are charged",
        body:
          "Transaction fees are generally deducted at the time the transaction is processed or reflected in the quoted total before confirmation. If a transfer fails after partner processing has started, non-refundable third-party charges may still apply where permitted by law.",
      },
      {
        heading: "Changes to pricing",
        body:
          "We may update fees from time to time to reflect market conditions, partner pricing, regulation, or product changes. Where required, we will provide notice through the app, website, SMS, email, or other official communication channels before updated charges take effect.",
      },
      {
        heading: "Customer responsibility",
        body:
          "You should review the fee summary shown before submitting any payment or transfer. By proceeding with a transaction, you authorize Kuntai Money to debit the applicable fees, charges, taxes, and partner costs from the funding source or account balance used for that transaction.",
      },
    ],
  },
  kyc: {
    title: "KYC / compliance rules",
    icon: Shield,
    description: "Identity verification and compliance obligations that support a safe financial platform.",
    sections: [
      {
        heading: "Verification requirement",
        body:
          "All customers must complete the required Know Your Customer checks before gaining access to certain features, limits, or account tiers. We may request government-issued identification, a selfie, proof of address, business documents, source-of-funds information, or other supporting records.",
      },
      {
        heading: "Customer obligations",
        body:
          "You must submit valid, current, and unaltered information and documents that belong to you or to an entity you are authorized to represent. If your profile details change, you must update them promptly and cooperate with any refresh or enhanced due diligence request.",
      },
      {
        heading: "Monitoring and review",
        body:
          "We monitor accounts and transactions to detect suspicious patterns, fraud risk, sanctions exposure, unusual activity, or other indicators that require investigation. Reviews may be automated or manual and may result in temporary limits, document requests, or delayed processing.",
      },
      {
        heading: "Restricted activity",
        body:
          "Accounts must not be used to conceal identity, move funds for third parties without disclosure, process proceeds of crime, structure transactions to avoid limits, or engage in any activity prohibited by anti-money laundering, counter-terrorist financing, or sanctions laws.",
      },
      {
        heading: "Compliance actions",
        body:
          "Where risk, legal, or regulatory concerns arise, Kuntai Money may refuse a transaction, freeze funds where permitted, file required reports, request additional explanation, or suspend account access until review is completed. Decisions are taken to protect customers, partners, and the wider financial system.",
      },
    ],
  },
};

