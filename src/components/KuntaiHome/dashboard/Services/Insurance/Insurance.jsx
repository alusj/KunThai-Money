import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2, MapPin, Search, ShieldCheck, User, Wallet } from "lucide-react";

import { getDiscoverableInsuranceAccounts } from "../../../../../Backend/services/otherAccountService";
import { formatCurrency } from "../../../../../Backend/utils/formatCurrency";
import AccountNumber from "../../MainAccountAction/CashOut/AccountNumber";
import BottomSheet from "../../MainAccountAction/CashOut/BottomSheet";
import InsuranceHeader from "./InsuranceHeader";

function InsuranceCard({ provider, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(provider)}
      className="w-full rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-sky-300 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sky-700">
            Insurance Account
          </p>
          <h3 className="mt-3 truncate text-xl font-semibold text-slate-950">{provider.insurance_name}</h3>
          <p className="mt-2 text-sm font-medium text-slate-500">{provider.account_number}</p>
        </div>

        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
          {provider.distance_km != null && Number.isFinite(provider.distance_km)
            ? `${provider.distance_km.toFixed(provider.distance_km >= 10 ? 0 : 1)} km away`
            : provider.same_city
              ? "Near you"
              : provider.same_country
                ? "Same country"
                : "Available"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <div className="flex items-start gap-3">
            <MapPin size={16} className="mt-0.5 text-sky-700" />
            <p className="leading-6">{provider.insurance_location}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">Category</p>
          <p className="mt-2 font-semibold text-slate-950">
            {provider.insurance_profile?.insurance_category || "Insurance"}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function Insurance({ onBack, refreshAccount, account, user, profile }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    policyHolderName: "",
    policyNumber: "",
    paymentPeriod: "",
    note: "",
  });

  const payerName =
    [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "Payer";
  const payerPhone = profile?.phone || user?.phone || "";

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const viewerContext = {
      country: account?.country || "",
      city: account?.city || "",
    };

    const loadProviders = async (context = viewerContext) => {
      setLoading(true);
      setError("");

      try {
        const data = await getDiscoverableInsuranceAccounts(context);
        setProviders(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Nearby insurance providers could not be loaded.");
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };

    void loadProviders();

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          void loadProviders({
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

  const filteredProviders = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    if (!searchTerm) {
      return providers;
    }

    return providers.filter((provider) =>
      [
        provider.insurance_name,
        provider.account_number,
        provider.insurance_location,
        provider.insurance_profile?.insurance_category,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchTerm))
    );
  }, [providers, search]);

  const numericAmount = Number(paymentForm.amount || 0);
  const canContinue =
    Boolean(selectedProvider) &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    Boolean(paymentForm.policyHolderName.trim()) &&
    Boolean(paymentForm.policyNumber.trim()) &&
    Boolean(paymentForm.paymentPeriod.trim()) &&
    Boolean(payerName.trim()) &&
    Boolean(payerPhone.trim());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f8fafc_28%,#ffffff_62%)]">
      <InsuranceHeader onBack={onBack} />

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-sky-700">
                Insurance Payments
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">
                Pay approved insurance providers with trusted details
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Choose an approved nearby insurance account, add the policy details, and continue to payment without
                leaving the services area.
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
                placeholder="Search provider, category, account, or location"
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
                <span className="text-sm font-medium">Loading approved insurance providers...</span>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
              {error}
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
                No approved providers yet
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-950">
                No discoverable insurance accounts right now
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Once insurance providers are approved by admin and enable nearby discovery, they will show here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredProviders.map((provider) => (
                <InsuranceCard key={provider.id} provider={provider} onSelect={setSelectedProvider} />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomSheet
        isOpen={Boolean(selectedProvider)}
        onClose={() => setSelectedProvider(null)}
        title={selectedProvider ? `Pay insurance: ${selectedProvider.insurance_name}` : "Insurance payment"}
      >
        {selectedProvider ? (
          <div className="space-y-5">
            <div className="rounded-[26px] border border-sky-200 bg-sky-50 px-5 py-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sky-700">
                Selected Provider
              </p>
              <h3 className="mt-3 text-xl font-semibold text-slate-950">{selectedProvider.insurance_name}</h3>
              <p className="mt-2 text-sm text-slate-600">{selectedProvider.account_number}</p>
              <p className="mt-2 text-sm text-slate-600">{selectedProvider.insurance_location}</p>
              <p className="mt-2 text-sm text-slate-600">
                {selectedProvider.insurance_profile?.insurance_category || "Insurance"}
              </p>
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
                    <User size={14} />
                    Policy Holder Name
                  </span>
                  <input
                    type="text"
                    value={paymentForm.policyHolderName}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, policyHolderName: event.target.value }))
                    }
                    placeholder="Enter policy holder full name"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    <FileText size={14} />
                    Policy Number
                  </span>
                  <input
                    type="text"
                    value={paymentForm.policyNumber}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, policyNumber: event.target.value }))
                    }
                    placeholder={
                      selectedProvider.insurance_profile?.payment_reference_format ||
                      "Enter policy or premium reference"
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    <ShieldCheck size={14} />
                    Payment Period
                  </span>
                  <input
                    type="text"
                    value={paymentForm.paymentPeriod}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, paymentPeriod: event.target.value }))
                    }
                    placeholder={
                      selectedProvider.insurance_profile?.accepted_payment_types ||
                      "Monthly premium, annual premium"
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Note
                  </span>
                  <input
                    type="text"
                    value={paymentForm.note}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, note: event.target.value }))
                    }
                    placeholder="Optional premium payment note"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    <User size={14} />
                    Payer Name
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{payerName || "Name unavailable"}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Payer Phone
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{payerPhone || "Phone unavailable"}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  Total payment:{" "}
                  <span className="font-semibold text-slate-950">
                    {formatCurrency(numericAmount || 0, account?.currency || "SLL")}
                  </span>
                </div>
              </div>
            </div>

            {canContinue ? (
              <AccountNumber
                account={account}
                user={user}
                profile={profile}
                onClose={() => setSelectedProvider(null)}
                refreshAccount={refreshAccount}
                startStep="confirm"
                disableFormEditing
                backLabel="Back to insurance form"
                prefilledRecipientLookup={{
                  is_valid: true,
                  recipient_name: selectedProvider.insurance_name,
                  recipient_profile_image: "",
                  recipient_account_number: selectedProvider.account_number,
                  message: "Insurance account verified.",
                }}
                initialValues={{
                  accountNumber: selectedProvider.account_number,
                  amount: paymentForm.amount,
                  reason:
                    paymentForm.note.trim() ||
                    `Insurance premium for ${paymentForm.policyHolderName.trim()} (${paymentForm.paymentPeriod.trim()})`,
                }}
                transferMetadata={{
                  flow: "insurance_payment",
                  insurance_account_name: selectedProvider.insurance_name,
                  insurance_location: selectedProvider.insurance_location,
                  insurance_category:
                    selectedProvider.insurance_profile?.insurance_category || "",
                  policy_holder_name: paymentForm.policyHolderName.trim(),
                  policy_number: paymentForm.policyNumber.trim(),
                  payment_period: paymentForm.paymentPeriod.trim(),
                  payer_name: payerName,
                  payer_phone: payerPhone,
                  insurance_note: paymentForm.note.trim(),
                  note: paymentForm.note.trim(),
                }}
                receiptOverrides={{
                  paymentMethod: "Insurance payment",
                  reason:
                    paymentForm.note.trim() ||
                    `Insurance premium for ${paymentForm.policyHolderName.trim()} - ${paymentForm.paymentPeriod.trim()}`,
                }}
                successBanner={{
                  title: "Transaction Successful",
                  message: "Your insurance payment receipt is ready below.",
                }}
                errorTitle="Insurance payment unsuccessful"
              />
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Add amount, policy holder name, policy number, and payment period first. Payer name and phone come from profile.
              </div>
            )}
          </div>
        ) : null}
      </BottomSheet>
    </div>
  );
}
