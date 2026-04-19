import { useEffect, useMemo, useState } from "react";
import { HeartHandshake, Loader2, MapPin, Search, User, Wallet } from "lucide-react";

import { getDiscoverableDonationAccounts } from "../../../../../Backend/services/otherAccountService";
import { formatCurrency } from "../../../../../Backend/utils/formatCurrency";
import AccountNumber from "../../MainAccountAction/CashOut/AccountNumber";
import BottomSheet from "../../MainAccountAction/CashOut/BottomSheet";
import DonationHeader from "./DonationHeader";

function DonationCard({ cause, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(cause)}
      className="w-full rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-sky-300 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sky-700">
            Donation Account
          </p>
          <h3 className="mt-3 truncate text-xl font-semibold text-slate-950">{cause.donation_name}</h3>
          <p className="mt-2 text-sm font-medium text-slate-500">{cause.account_number}</p>
        </div>

        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
          {cause.distance_km != null && Number.isFinite(cause.distance_km)
            ? `${cause.distance_km.toFixed(cause.distance_km >= 10 ? 0 : 1)} km away`
            : cause.same_city
              ? "Near you"
              : cause.same_country
                ? "Same country"
                : "Available"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <div className="flex items-start gap-3">
            <MapPin size={16} className="mt-0.5 text-sky-700" />
            <p className="leading-6">{cause.donation_location}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">Cause</p>
          <p className="mt-2 font-semibold text-slate-950">
            {cause.donation_profile?.cause_category || "Donation"}
          </p>
        </div>
      </div>

      {cause.donation_profile?.mission ? (
        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          {cause.donation_profile.mission}
        </div>
      ) : null}
    </button>
  );
}

export default function Donation({ onBack, refreshAccount, account, user, profile }) {
  const [causes, setCauses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCause, setSelectedCause] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    donationPurpose: "",
    dedication: "",
    message: "",
    anonymous: false,
  });

  const donorName =
    [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "Donor";
  const donorPhone = profile?.phone || user?.phone || "";

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const viewerContext = {
      country: account?.country || "",
      city: account?.city || "",
    };

    const loadCauses = async (context = viewerContext) => {
      setLoading(true);
      setError("");

      try {
        const data = await getDiscoverableDonationAccounts(context);
        setCauses(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Nearby donation accounts could not be loaded.");
        setCauses([]);
      } finally {
        setLoading(false);
      }
    };

    void loadCauses();

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          void loadCauses({
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

  const filteredCauses = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    if (!searchTerm) {
      return causes;
    }

    return causes.filter((cause) =>
      [
        cause.donation_name,
        cause.account_number,
        cause.donation_location,
        cause.donation_profile?.cause_category,
        cause.donation_profile?.organization_name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchTerm))
    );
  }, [causes, search]);

  const numericAmount = Number(paymentForm.amount || 0);
  const canContinue =
    Boolean(selectedCause) &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    Boolean(paymentForm.donationPurpose.trim()) &&
    Boolean(donorPhone.trim());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_top,#ecfeff_0%,#f8fafc_30%,#ffffff_62%)]">
      <DonationHeader onBack={onBack} />

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-teal-700">
                Donations
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">
                Support approved causes with a simple giving flow
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Choose an approved nearby cause, add your donation details, and continue to payment without leaving
                the services area.
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
                placeholder="Search cause, organization, account, or location"
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
                <span className="text-sm font-medium">Loading approved causes...</span>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
              {error}
            </div>
          ) : filteredCauses.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
                No approved causes yet
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-950">
                No discoverable donation accounts right now
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Once donation organizations are approved by admin and enable nearby discovery, they will show here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCauses.map((cause) => (
                <DonationCard key={cause.id} cause={cause} onSelect={setSelectedCause} />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomSheet
        isOpen={Boolean(selectedCause)}
        onClose={() => setSelectedCause(null)}
        title={selectedCause ? `Donate to: ${selectedCause.donation_name}` : "Donation payment"}
      >
        {selectedCause ? (
          <div className="space-y-5">
            <div className="rounded-[26px] border border-teal-200 bg-teal-50 px-5 py-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-teal-700">
                Selected Cause
              </p>
              <h3 className="mt-3 text-xl font-semibold text-slate-950">{selectedCause.donation_name}</h3>
              <p className="mt-2 text-sm text-slate-600">{selectedCause.account_number}</p>
              <p className="mt-2 text-sm text-slate-600">{selectedCause.donation_location}</p>
              <p className="mt-2 text-sm text-slate-600">
                {selectedCause.donation_profile?.cause_category || "Donation"}
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
                    <HeartHandshake size={14} />
                    What are you donating for?
                  </span>
                  <input
                    type="text"
                    value={paymentForm.donationPurpose}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, donationPurpose: event.target.value }))
                    }
                    placeholder="Example: school support, health fund, feeding project"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Dedication
                  </span>
                  <input
                    type="text"
                    value={paymentForm.dedication}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, dedication: event.target.value }))
                    }
                    placeholder="Optional dedication or in-memory note"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Message
                  </span>
                  <input
                    type="text"
                    value={paymentForm.message}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, message: event.target.value }))
                    }
                    placeholder="Optional message to the organization"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    <User size={14} />
                    Donor Name
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {paymentForm.anonymous ? "Anonymous donor" : donorName || "Name unavailable"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Donor Phone
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{donorPhone || "Phone unavailable"}</p>
                </div>
              </div>

              <label className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <span>
                  <span className="block text-sm font-semibold text-slate-950">Donate anonymously</span>
                  <span className="mt-1 block text-sm text-slate-500">
                    Hide your donor name from the receiving organization.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={paymentForm.anonymous}
                  onChange={(event) =>
                    setPaymentForm((current) => ({ ...current, anonymous: event.target.checked }))
                  }
                  className="h-5 w-5 rounded border-slate-300 text-slate-950 focus:ring-slate-500"
                />
              </label>

              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                Total donation:{" "}
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
                onClose={() => setSelectedCause(null)}
                refreshAccount={refreshAccount}
                startStep="confirm"
                disableFormEditing
                backLabel="Back to donation form"
                prefilledRecipientLookup={{
                  is_valid: true,
                  recipient_name: selectedCause.donation_name,
                  recipient_profile_image: "",
                  recipient_account_number: selectedCause.account_number,
                  message: "Donation account verified.",
                }}
                initialValues={{
                  accountNumber: selectedCause.account_number,
                  amount: paymentForm.amount,
                  reason:
                    paymentForm.message.trim() ||
                    paymentForm.donationPurpose.trim() ||
                    "Donation payment",
                }}
                transferMetadata={{
                  flow: "donation_payment",
                  donation_account_name: selectedCause.donation_name,
                  donation_location: selectedCause.donation_location,
                  cause_category: selectedCause.donation_profile?.cause_category || "",
                  donation_purpose: paymentForm.donationPurpose.trim(),
                  dedication: paymentForm.dedication.trim(),
                  donor_message: paymentForm.message.trim(),
                  donor_name: paymentForm.anonymous ? "Anonymous donor" : donorName,
                  donor_phone: donorPhone,
                  anonymous_donation: Boolean(paymentForm.anonymous),
                  donation_note:
                    paymentForm.message.trim() || paymentForm.dedication.trim() || paymentForm.donationPurpose.trim(),
                  note:
                    paymentForm.message.trim() || paymentForm.dedication.trim() || paymentForm.donationPurpose.trim(),
                }}
                receiptOverrides={{
                  paymentMethod: "Donation payment",
                  reason:
                    paymentForm.message.trim() ||
                    paymentForm.dedication.trim() ||
                    paymentForm.donationPurpose.trim(),
                }}
                successBanner={{
                  title: "Transaction Successful",
                  message: "Your donation receipt is ready below.",
                }}
                errorTitle="Donation payment unsuccessful"
              />
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Add amount and donation purpose first. Donor phone comes from profile.
              </div>
            )}
          </div>
        ) : null}
      </BottomSheet>
    </div>
  );
}
