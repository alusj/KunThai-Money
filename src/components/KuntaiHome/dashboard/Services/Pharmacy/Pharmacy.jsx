import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Pill, ReceiptText, Search, User, Wallet } from "lucide-react";

import { getDiscoverablePharmacyAccounts } from "../../../../../Backend/services/otherAccountService";
import { formatCurrency } from "../../../../../Backend/utils/formatCurrency";
import AccountNumber from "../../MainAccountAction/CashOut/AccountNumber";
import BottomSheet from "../../MainAccountAction/CashOut/BottomSheet";
import PharmacyHeader from "./PharmacyHeader";

function PharmacyCard({ pharmacy, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(pharmacy)}
      className="w-full rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-sky-300 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sky-700">
            Pharmacy Account
          </p>
          <h3 className="mt-3 truncate text-xl font-semibold text-slate-950">{pharmacy.pharmacy_name}</h3>
          <p className="mt-2 text-sm font-medium text-slate-500">{pharmacy.account_number}</p>
        </div>

        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
          {pharmacy.distance_km != null && Number.isFinite(pharmacy.distance_km)
            ? `${pharmacy.distance_km.toFixed(pharmacy.distance_km >= 10 ? 0 : 1)} km away`
            : pharmacy.same_city
              ? "Near you"
              : pharmacy.same_country
                ? "Same country"
                : "Available"}
        </span>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <MapPin size={16} className="mt-0.5 text-sky-700" />
        <p className="leading-6">{pharmacy.pharmacy_location}</p>
      </div>
    </button>
  );
}

export default function Pharmacy({ onBack, refreshAccount, account, user, profile }) {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    description: "",
    patientName: "",
    prescriptionNumber: "",
    orderNumber: "",
    note: "",
  });

  const buyerName =
    [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "Buyer";
  const buyerPhone = profile?.phone || user?.phone || "";

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const viewerContext = {
      country: account?.country || "",
      city: account?.city || "",
    };

    const loadPharmacies = async (context = viewerContext) => {
      setLoading(true);
      setError("");

      try {
        const data = await getDiscoverablePharmacyAccounts(context);
        setPharmacies(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Nearby pharmacies could not be loaded.");
        setPharmacies([]);
      } finally {
        setLoading(false);
      }
    };

    void loadPharmacies();

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          void loadPharmacies({
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

  const filteredPharmacies = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    if (!searchTerm) {
      return pharmacies;
    }

    return pharmacies.filter((pharmacy) =>
      [pharmacy.pharmacy_name, pharmacy.account_number, pharmacy.pharmacy_location]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchTerm))
    );
  }, [pharmacies, search]);

  const numericAmount = Number(paymentForm.amount || 0);
  const canContinue =
    Boolean(selectedPharmacy) &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    Boolean(paymentForm.description.trim()) &&
    Boolean(buyerName.trim()) &&
    Boolean(buyerPhone.trim());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f8fafc_28%,#ffffff_62%)]">
      <PharmacyHeader onBack={onBack} />

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-sky-700">
                Pharmacy Payments
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">
                Pay nearby pharmacies with the right order details
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Choose a nearby pharmacy account, add the medicine or order details you have, and continue to payment
                without leaving the services area.
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
                placeholder="Search pharmacy name, account, or location"
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
                <span className="text-sm font-medium">Loading nearby pharmacies...</span>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
              {error}
            </div>
          ) : filteredPharmacies.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
                No pharmacies yet
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-950">
                No discoverable pharmacy accounts right now
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Once pharmacies enable nearby discovery, they will show here with their account name and location.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPharmacies.map((pharmacy) => (
                <PharmacyCard key={pharmacy.id} pharmacy={pharmacy} onSelect={setSelectedPharmacy} />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomSheet
        isOpen={Boolean(selectedPharmacy)}
        onClose={() => setSelectedPharmacy(null)}
        title={selectedPharmacy ? `Pay pharmacy: ${selectedPharmacy.pharmacy_name}` : "Pharmacy payment"}
      >
        {selectedPharmacy ? (
          <div className="space-y-5">
            <div className="rounded-[26px] border border-sky-200 bg-sky-50 px-5 py-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sky-700">
                Selected Pharmacy
              </p>
              <h3 className="mt-3 text-xl font-semibold text-slate-950">{selectedPharmacy.pharmacy_name}</h3>
              <p className="mt-2 text-sm text-slate-600">{selectedPharmacy.account_number}</p>
              <p className="mt-2 text-sm text-slate-600">{selectedPharmacy.pharmacy_location}</p>
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
                    <Pill size={14} />
                    What are you paying for?
                  </span>
                  <input
                    type="text"
                    value={paymentForm.description}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Example: medicines, refill, pain relief"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Patient Name
                  </span>
                  <input
                    type="text"
                    value={paymentForm.patientName}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, patientName: event.target.value }))
                    }
                    placeholder="Optional patient name"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    <ReceiptText size={14} />
                    Prescription Number
                  </span>
                  <input
                    type="text"
                    value={paymentForm.prescriptionNumber}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, prescriptionNumber: event.target.value }))
                    }
                    placeholder="Optional prescription number"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Order Number
                  </span>
                  <input
                    type="text"
                    value={paymentForm.orderNumber}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, orderNumber: event.target.value }))
                    }
                    placeholder="Optional order number"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>

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
                    placeholder="Optional payment note"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    <User size={14} />
                    Buyer Name
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{buyerName || "Name unavailable"}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Buyer Phone
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{buyerPhone || "Phone unavailable"}</p>
                </div>
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
                onClose={() => setSelectedPharmacy(null)}
                refreshAccount={refreshAccount}
                startStep="confirm"
                disableFormEditing
                backLabel="Back to pharmacy form"
                prefilledRecipientLookup={{
                  is_valid: true,
                  recipient_name: selectedPharmacy.pharmacy_name,
                  recipient_profile_image: "",
                  recipient_account_number: selectedPharmacy.account_number,
                  message: "Pharmacy account verified.",
                }}
                initialValues={{
                  accountNumber: selectedPharmacy.account_number,
                  amount: paymentForm.amount,
                  reason:
                    paymentForm.note.trim() ||
                    paymentForm.description.trim() ||
                    "Pharmacy payment",
                }}
                transferMetadata={{
                  flow: "pharmacy_payment",
                  pharmacy_account_name: selectedPharmacy.pharmacy_name,
                  pharmacy_location: selectedPharmacy.pharmacy_location,
                  patient_name: paymentForm.patientName.trim(),
                  prescription_number: paymentForm.prescriptionNumber.trim(),
                  order_number: paymentForm.orderNumber.trim(),
                  purchase_description: paymentForm.description.trim(),
                  buyer_name: buyerName,
                  buyer_phone: buyerPhone,
                  pharmacy_note: paymentForm.note.trim(),
                  note: paymentForm.note.trim(),
                }}
                receiptOverrides={{
                  paymentMethod: "Pharmacy payment",
                  reason:
                    paymentForm.note.trim() ||
                    paymentForm.description.trim() ||
                    "Pharmacy payment",
                }}
                successBanner={{
                  title: "Transaction Successful",
                  message: "Your pharmacy payment receipt is ready below.",
                }}
                errorTitle="Pharmacy payment unsuccessful"
              />
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Add amount and what you are paying for first. Buyer name and phone come from profile.
              </div>
            )}
          </div>
        ) : null}
      </BottomSheet>
    </div>
  );
}
