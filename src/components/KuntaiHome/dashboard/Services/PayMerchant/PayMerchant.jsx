import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, ReceiptText, Search, User, Wallet } from "lucide-react";

import { getDiscoverableMerchantAccounts } from "../../../../../Backend/services/otherAccountService";
import { formatCurrency } from "../../../../../Backend/utils/formatCurrency";
import AccountNumber from "../../MainAccountAction/CashOut/AccountNumber";
import BottomSheet from "../../MainAccountAction/CashOut/BottomSheet";
import PayMerchantHeader from "./PayMerchantHeader";

function MerchantCard({ merchant, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(merchant)}
      className="w-full rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-sky-300 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sky-700">Merchant Account</p>
          <h3 className="mt-3 truncate text-xl font-semibold text-slate-950">{merchant.merchant_name}</h3>
          <p className="mt-2 text-sm font-medium text-slate-500">{merchant.account_number}</p>
        </div>

        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
          {merchant.distance_km != null && Number.isFinite(merchant.distance_km)
            ? `${merchant.distance_km.toFixed(merchant.distance_km >= 10 ? 0 : 1)} km away`
            : merchant.same_city
              ? "Near you"
              : merchant.same_country
                ? "Same country"
                : "Available"}
        </span>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <MapPin size={16} className="mt-0.5 text-sky-700" />
        <p className="leading-6">{merchant.merchant_location}</p>
      </div>
    </button>
  );
}

export default function PayMerchant({ onBack, refreshAccount, account, user, profile }) {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    purpose: "",
    paymentReference: "",
    note: "",
    buyerName:
      [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
      user?.user_metadata?.full_name ||
      "",
    buyerPhone: profile?.phone || user?.phone || "",
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const viewerContext = {
      country: account?.country || "",
      city: account?.city || "",
    };

    const loadMerchants = async (context = viewerContext) => {
      setLoading(true);
      setError("");

      try {
        const data = await getDiscoverableMerchantAccounts(context);
        setMerchants(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Nearby merchants could not be loaded.");
        setMerchants([]);
      } finally {
        setLoading(false);
      }
    };

    void loadMerchants();

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          void loadMerchants({
            ...viewerContext,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [account?.city, account?.country]);

  const filteredMerchants = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    if (!searchTerm) {
      return merchants;
    }

    return merchants.filter((merchant) =>
      [merchant.merchant_name, merchant.account_number, merchant.merchant_location]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchTerm))
    );
  }, [merchants, search]);

  const numericAmount = Number(paymentForm.amount || 0);
  const canContinue =
    Boolean(selectedMerchant) &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    Boolean(paymentForm.purpose.trim()) &&
    Boolean(paymentForm.buyerName.trim()) &&
    Boolean(paymentForm.buyerPhone.trim());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f8fafc_28%,#ffffff_62%)]">
      <PayMerchantHeader onBack={onBack} />

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-sky-700">
                Merchant Payments
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">Pay nearby merchants professionally</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Select a verified merchant account, add what you are paying for, and keep the receipt in transaction history under All Entries.
              </p>
            </div>

            <label className="relative block w-full lg:max-w-md">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search merchant name, account, or location"
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>
          </div>
        </section>

        <div className="mt-6">
          {loading ? (
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 text-slate-600">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm font-medium">Loading nearby merchants...</span>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
              {error}
            </div>
          ) : filteredMerchants.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-400">No merchants yet</p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-950">No discoverable merchants right now</h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Once merchant accounts enable nearby discovery, they will show here with their account name and location.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredMerchants.map((merchant) => (
                <MerchantCard key={merchant.id} merchant={merchant} onSelect={setSelectedMerchant} />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomSheet
        isOpen={Boolean(selectedMerchant)}
        onClose={() => setSelectedMerchant(null)}
        title={selectedMerchant ? `Pay merchant: ${selectedMerchant.merchant_name}` : "Pay merchant"}
      >
        {selectedMerchant ? (
          <div className="space-y-5">
            <div className="rounded-[26px] border border-sky-200 bg-sky-50 px-5 py-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sky-700">Selected Merchant</p>
              <h3 className="mt-3 text-xl font-semibold text-slate-950">{selectedMerchant.merchant_name}</h3>
              <p className="mt-2 text-sm text-slate-600">{selectedMerchant.account_number}</p>
              <p className="mt-2 text-sm text-slate-600">{selectedMerchant.merchant_location}</p>
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-white px-5 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    <Wallet size={14} />
                    Amount
                  </span>
                  <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
                    <span className="text-sm font-semibold text-slate-500">{account?.currency || "SLL"}</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(event) =>
                        setPaymentForm((current) => ({ ...current, amount: event.target.value }))
                      }
                      placeholder="0.00"
                      className="w-full bg-transparent px-3 py-3 text-[16px] text-slate-900 outline-none"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    <ReceiptText size={14} />
                    Payment Reference
                  </span>
                  <input
                    type="text"
                    value={paymentForm.paymentReference}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, paymentReference: event.target.value }))
                    }
                    placeholder="Invoice, order, or receipt number"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4">
                <label className="block">
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    What Are You Paying For?
                  </span>
                  <input
                    type="text"
                    value={paymentForm.purpose}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, purpose: event.target.value }))
                    }
                    placeholder="Example: groceries, electronics, order payment"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Note
                  </span>
                  <textarea
                    rows="3"
                    value={paymentForm.note}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, note: event.target.value }))
                    }
                    placeholder="Optional note for this merchant payment"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    <User size={14} />
                    Buyer Name
                  </span>
                  <input
                    type="text"
                    value={paymentForm.buyerName}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, buyerName: event.target.value }))
                    }
                    placeholder="Buyer full name"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Buyer Phone
                  </span>
                  <input
                    type="tel"
                    value={paymentForm.buyerPhone}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, buyerPhone: event.target.value }))
                    }
                    placeholder="Buyer phone number"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                Total payment:{" "}
                <span className="font-semibold text-slate-950">
                  {formatCurrency(numericAmount || 0, account?.currency || "SLL")}
                </span>
              </div>
            </div>

            {canContinue ? (
              <AccountNumber
                account={account}
                user={user}
                profile={profile}
                onClose={() => setSelectedMerchant(null)}
                refreshAccount={refreshAccount}
                startStep="confirm"
                disableFormEditing
                backLabel="Back to merchant form"
                prefilledRecipientLookup={{
                  is_valid: true,
                  recipient_name: selectedMerchant.merchant_name,
                  recipient_profile_image: "",
                  recipient_account_number: selectedMerchant.account_number,
                  message: "Merchant account verified.",
                }}
                initialValues={{
                  accountNumber: selectedMerchant.account_number,
                  amount: paymentForm.amount,
                  reason: paymentForm.purpose.trim(),
                }}
                transferMetadata={{
                  flow: "merchant_payment",
                  merchant_account_type: selectedMerchant.account_type,
                  merchant_account_name: selectedMerchant.merchant_name,
                  merchant_location: selectedMerchant.merchant_location,
                  payment_reference: paymentForm.paymentReference.trim(),
                  reference: paymentForm.paymentReference.trim(),
                  purchase_description: paymentForm.purpose.trim(),
                  buyer_name: paymentForm.buyerName.trim(),
                  buyer_phone: paymentForm.buyerPhone.trim(),
                  note: paymentForm.note.trim(),
                }}
                receiptOverrides={{
                  paymentMethod: "Merchant payment",
                  reason: paymentForm.note.trim() || paymentForm.purpose.trim(),
                }}
                successBanner={{
                  title: "Transaction Successful",
                  message: "Your merchant payment receipt is ready below.",
                }}
                errorTitle="Merchant payment unsuccessful"
              />
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Add the amount, what you are paying for, buyer name, and buyer phone before continuing.
              </div>
            )}
          </div>
        ) : null}
      </BottomSheet>
    </div>
  );
}
