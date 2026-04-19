import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, ImagePlus, ScanLine, Search, Ticket, User } from "lucide-react";

import BackTab from "./Transactions/BackTab";
import {
  findSellerTicketByCode,
  getSellerEventTickets,
  markEventTicketUsed,
} from "../../../Backend/services/eventTicketService";

async function decodeQrFromImage(file) {
  if (!(file instanceof File)) {
    throw new Error("Choose a QR image first.");
  }

  if (typeof BarcodeDetector === "undefined") {
    throw new Error("QR image scanning is not supported on this device. Enter the code manually.");
  }

  const detector = new BarcodeDetector({ formats: ["qr_code"] });
  const bitmap = await createImageBitmap(file);
  const results = await detector.detect(bitmap);

  if (!results.length) {
    throw new Error("No QR code was found in that image.");
  }

  const rawValue = results[0].rawValue || "";

  try {
    const parsed = JSON.parse(rawValue);
    return parsed.ticket_code || rawValue;
  } catch {
    return rawValue;
  }
}

function StatusPill({ status }) {
  const tone =
    status === "used"
      ? "bg-slate-200 text-slate-700"
      : "bg-emerald-100 text-emerald-700";

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${tone}`}>{status}</span>;
}

export default function EventSellerScreen({ onBack, user, eventAccounts = [] }) {
  const [tickets, setTickets] = useState([]);
  const [lookupCode, setLookupCode] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [qrFileName, setQrFileName] = useState("");

  const loadSellerTickets = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getSellerEventTickets(user?.id);
      setTickets(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Event ticket sales could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSellerTickets();
  }, [user?.id]);

  const soldCount = tickets.length;
  const usedCount = tickets.filter((ticket) => ticket.status === "used").length;
  const activeEventCount = eventAccounts.length;
  const recentSales = useMemo(() => tickets.slice(0, 8), [tickets]);

  const handleLookup = async (code) => {
    setLookupLoading(true);
    setLookupError("");

    try {
      const ticket = await findSellerTicketByCode(code, user?.id);
      setLookupCode(ticket.ticket_code);
      setLookupResult(ticket);
    } catch (lookupIssue) {
      setLookupResult(null);
      setLookupError(lookupIssue instanceof Error ? lookupIssue.message : "Ticket lookup failed.");
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_28%,#f8fafc_100%)]">
      <div className="border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5 md:px-8">
          <BackTab onBack={onBack} />
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-slate-400">Profile</p>
            <h2 className="mt-1 truncate text-xl font-bold text-slate-950">Events</h2>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] bg-slate-50 px-5 py-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-400">Active Events</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{activeEventCount}</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 px-5 py-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-400">Tickets Sold</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{soldCount}</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 px-5 py-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-400">Tickets Used</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{usedCount}</p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-400">Validate Buyer</p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950">Enter a ticket code or scan a QR image</h3>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Ticket Code
                </span>
                <div className="mt-2 flex gap-3">
                  <input
                    type="text"
                    value={lookupCode}
                    onChange={(event) => {
                      setLookupCode(event.target.value.toUpperCase());
                      setLookupError("");
                    }}
                    placeholder="EVT-XXXXXX-XXXXXX"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleLookup(lookupCode)}
                    disabled={lookupLoading}
                    className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Search size={16} />
                  </button>
                </div>
              </label>

              <label className="block rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-4">
                <span className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  <ImagePlus size={15} />
                  Upload QR Image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }

                    setQrFileName(file.name);
                    setLookupError("");

                    try {
                      const scannedCode = await decodeQrFromImage(file);
                      await handleLookup(scannedCode);
                    } catch (scanError) {
                      setLookupResult(null);
                      setLookupError(scanError instanceof Error ? scanError.message : "QR image could not be scanned.");
                    }
                  }}
                  className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:font-semibold file:text-white"
                />
                {qrFileName ? <p className="mt-2 text-xs text-slate-500">Selected: {qrFileName}</p> : null}
              </label>

              {lookupError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {lookupError}
                </div>
              ) : null}

              {lookupResult ? (
                <div className="rounded-[28px] border border-emerald-200 bg-emerald-50/60 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-4">
                      {lookupResult.buyer_image_url ? (
                        <img
                          src={lookupResult.buyer_image_url}
                          alt={lookupResult.buyer_name}
                          className="h-16 w-16 rounded-[22px] object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white text-slate-700">
                          <User size={24} />
                        </div>
                      )}

                      <div>
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                          Buyer Verified
                        </p>
                        <h4 className="mt-2 text-xl font-semibold text-slate-950">{lookupResult.buyer_name}</h4>
                        <p className="mt-1 text-sm text-slate-600">{lookupResult.ticket_code}</p>
                      </div>
                    </div>

                    <StatusPill status={lookupResult.status || "unused"} />
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                    <p>Event: {lookupResult.order?.event_name || "Event"}</p>
                    <p>Quantity Bought: {lookupResult.order?.quantity || 1}</p>
                    <p className="inline-flex items-center gap-2">
                      <CalendarDays size={15} />
                      {lookupResult.order?.event_date_time
                        ? new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          }).format(new Date(lookupResult.order.event_date_time))
                        : "Date pending"}
                    </p>
                    <p className="inline-flex items-center gap-2">
                      <Ticket size={15} />
                      Ticket #{lookupResult.ticket_index}
                    </p>
                  </div>

                  {lookupResult.status !== "used" ? (
                    <button
                      type="button"
                      onClick={async () => {
                        const updated = await markEventTicketUsed(lookupResult.id);
                        setLookupResult(updated);
                        await loadSellerTickets();
                      }}
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      <CheckCircle2 size={16} />
                      <span>Mark Ticket as Used</span>
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-400">Recent Sales</p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950">Latest ticket buyers</h3>

            <div className="mt-5 space-y-3">
              {loading ? (
                <div className="text-sm text-slate-500">Loading event sales...</div>
              ) : error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : !recentSales.length ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                  No ticket buyers yet.
                </div>
              ) : (
                recentSales.map((ticket) => (
                  <div key={ticket.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{ticket.buyer_name}</p>
                        <p className="mt-1 text-sm text-slate-500">{ticket.ticket_code}</p>
                        <p className="mt-1 text-sm text-slate-500">{ticket.order?.event_name || "Event"}</p>
                      </div>
                      <StatusPill status={ticket.status || "unused"} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
