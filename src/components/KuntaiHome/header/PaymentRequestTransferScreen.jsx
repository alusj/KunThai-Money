import AccountNumber from "../dashboard/MainAccountAction/CashOut/AccountNumber";

export default function PaymentRequestTransferScreen({ account, request, refreshAccount, onBack, onTransferSuccess }) {
  if (!request) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
        <AccountNumber
          account={account}
          refreshAccount={refreshAccount}
          onClose={onBack}
          onTransferSuccess={onTransferSuccess}
          backLabel="Back"
          initialValues={{
            accountNumber: request.requester_account_number,
            amount: request.amount,
            reason: request.reason || "",
          }}
        />
      </div>
    </div>
  );
}
