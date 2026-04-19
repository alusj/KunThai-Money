import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Loader2, MapPin, ReceiptText, Search, User, Wallet } from "lucide-react";

import { getDiscoverableSchoolAccounts } from "../../../../../Backend/services/otherAccountService";
import { formatCurrency } from "../../../../../Backend/utils/formatCurrency";
import AccountNumber from "../../MainAccountAction/CashOut/AccountNumber";
import BottomSheet from "../../MainAccountAction/CashOut/BottomSheet";
import SchoolFeesHeader from "./SchoolFeesHeader";

function SchoolCard({ school, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(school)}
      className="w-full rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-sky-300 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sky-700">
            School Fees Account
          </p>
          <h3 className="mt-3 truncate text-xl font-semibold text-slate-950">{school.school_name}</h3>
          <p className="mt-2 text-sm font-medium text-slate-500">{school.account_number}</p>
        </div>

        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
          {school.distance_km != null && Number.isFinite(school.distance_km)
            ? `${school.distance_km.toFixed(school.distance_km >= 10 ? 0 : 1)} km away`
            : school.same_city
              ? "Near you"
              : school.same_country
                ? "Same country"
                : "Available"}
        </span>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <MapPin size={16} className="mt-0.5 text-sky-700" />
        <p className="leading-6">{school.school_location}</p>
      </div>
    </button>
  );
}

export default function SchoolFees({ onBack, refreshAccount, account, user, profile }) {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    studentName: "",
    studentId: "",
    classLevel: "",
    termSemester: "",
    note: "",
  });

  const guardianName =
    [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "Guardian";
  const guardianPhone = profile?.phone || user?.phone || "";

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const viewerContext = {
      country: account?.country || "",
      city: account?.city || "",
    };

    const loadSchools = async (context = viewerContext) => {
      setLoading(true);
      setError("");

      try {
        const data = await getDiscoverableSchoolAccounts(context);
        setSchools(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Nearby schools could not be loaded.");
        setSchools([]);
      } finally {
        setLoading(false);
      }
    };

    void loadSchools();

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          void loadSchools({
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

  const filteredSchools = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    if (!searchTerm) {
      return schools;
    }

    return schools.filter((school) =>
      [school.school_name, school.account_number, school.school_location]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchTerm))
    );
  }, [schools, search]);

  const numericAmount = Number(paymentForm.amount || 0);
  const canContinue =
    Boolean(selectedSchool) &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    Boolean(paymentForm.studentName.trim()) &&
    Boolean(paymentForm.studentId.trim()) &&
    Boolean(paymentForm.classLevel.trim()) &&
    Boolean(paymentForm.termSemester.trim()) &&
    Boolean(guardianName.trim()) &&
    Boolean(guardianPhone.trim());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f8fafc_28%,#ffffff_62%)]">
      <SchoolFeesHeader onBack={onBack} />

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-sky-700">
                School Fees
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">
                Pay school fees with the right student details
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Choose a nearby school account, add the student details the school needs, and continue to payment
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
                placeholder="Search school name, account, or location"
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
                <span className="text-sm font-medium">Loading nearby schools...</span>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
              {error}
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-400">
                No schools yet
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-950">
                No discoverable school accounts right now
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Once schools enable nearby discovery, they will show here with their account name and location.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredSchools.map((school) => (
                <SchoolCard key={school.id} school={school} onSelect={setSelectedSchool} />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomSheet
        isOpen={Boolean(selectedSchool)}
        onClose={() => setSelectedSchool(null)}
        title={selectedSchool ? `Pay school: ${selectedSchool.school_name}` : "School fees payment"}
      >
        {selectedSchool ? (
          <div className="space-y-5">
            <div className="rounded-[26px] border border-sky-200 bg-sky-50 px-5 py-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sky-700">
                Selected School
              </p>
              <h3 className="mt-3 text-xl font-semibold text-slate-950">{selectedSchool.school_name}</h3>
              <p className="mt-2 text-sm text-slate-600">{selectedSchool.account_number}</p>
              <p className="mt-2 text-sm text-slate-600">{selectedSchool.school_location}</p>
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
                    Student Full Name
                  </span>
                  <input
                    type="text"
                    value={paymentForm.studentName}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, studentName: event.target.value }))
                    }
                    placeholder="Enter student full name"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    <ReceiptText size={14} />
                    Student ID
                  </span>
                  <input
                    type="text"
                    value={paymentForm.studentId}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, studentId: event.target.value }))
                    }
                    placeholder="Admission or student number"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    <GraduationCap size={14} />
                    Class / Level
                  </span>
                  <input
                    type="text"
                    value={paymentForm.classLevel}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, classLevel: event.target.value }))
                    }
                    placeholder="Example: JSS 3 or Grade 6"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Term / Semester
                  </span>
                  <input
                    type="text"
                    value={paymentForm.termSemester}
                    onChange={(event) =>
                      setPaymentForm((current) => ({ ...current, termSemester: event.target.value }))
                    }
                    placeholder="Example: Third Term 2026"
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
                    Parent / Guardian Name
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{guardianName || "Name unavailable"}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Parent / Guardian Phone
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{guardianPhone || "Phone unavailable"}</p>
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
                onClose={() => setSelectedSchool(null)}
                refreshAccount={refreshAccount}
                startStep="confirm"
                disableFormEditing
                backLabel="Back to school form"
                prefilledRecipientLookup={{
                  is_valid: true,
                  recipient_name: selectedSchool.school_name,
                  recipient_profile_image: "",
                  recipient_account_number: selectedSchool.account_number,
                  message: "School account verified.",
                }}
                initialValues={{
                  accountNumber: selectedSchool.account_number,
                  amount: paymentForm.amount,
                  reason:
                    paymentForm.note.trim() ||
                    `School fees for ${paymentForm.studentName.trim()} (${paymentForm.termSemester.trim()})`,
                }}
                transferMetadata={{
                  flow: "school_payment",
                  school_account_name: selectedSchool.school_name,
                  school_location: selectedSchool.school_location,
                  student_name: paymentForm.studentName.trim(),
                  student_id: paymentForm.studentId.trim(),
                  class_level: paymentForm.classLevel.trim(),
                  term_semester: paymentForm.termSemester.trim(),
                  guardian_name: guardianName,
                  guardian_phone: guardianPhone,
                  school_note: paymentForm.note.trim(),
                  note: paymentForm.note.trim(),
                }}
                receiptOverrides={{
                  paymentMethod: "School fees payment",
                  reason:
                    paymentForm.note.trim() ||
                    `School fees for ${paymentForm.studentName.trim()} - ${paymentForm.termSemester.trim()}`,
                }}
                successBanner={{
                  title: "Transaction Successful",
                  message: "Your school fees receipt is ready below.",
                }}
                errorTitle="School fees payment unsuccessful"
              />
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Add amount, student name, student ID, class, and term first. Parent name and phone come from profile.
              </div>
            )}
          </div>
        ) : null}
      </BottomSheet>
    </div>
  );
}
