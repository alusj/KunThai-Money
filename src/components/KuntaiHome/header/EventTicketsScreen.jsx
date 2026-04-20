import { useEffect, useMemo, useState } from "react";
import { CalendarDays, QrCode, Ticket, User } from "lucide-react";

import BackTab from "./Transactions/BackTab";
import {
  buildTicketQrImageUrl,
  getBuyerEventTickets,
} from "../../../Backend/services/eventTicketService";
import { formatCurrency } from "../../../Backend/utils/formatCurrency";

function StatusPill({ status }) {
  const tone =
    status === "used"
      ? "bg-slate-200 text-slate-700"
      : status === "unused"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-amber-100 text-amber-700";

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${tone}`}>{status}</span>;
}

function QrModal({ ticket, onClose }) {
  if (!ticket) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/75 px-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-[32px] bg-white p-6 shadow-2xl"
      >
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">Ticket QR</p>
        <h3 className="mt-3 text-2xl font-semibold text-slate-950">{ticket.order?.event_name || "Event Ticket"}</h3>
        <p className="mt-2 text-sm text-slate-500">{ticket.ticket_code}</p>

        <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
          <img
            src={buildTicketQrImageUrl(ticket)}
            alt={`QR for ${ticket.ticket_code}`}
            className="mx-auto h-56 w-56 rounded-[20px] bg-white p-3"
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function EventTicketsScreen({ onBack, user }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeQrTicket, setActiveQrTicket] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadTickets() {
      setLoading(true);
      setError("");

      try {
        const data = await getBuyerEventTickets(user?.id);
        if (isActive) {
          setTickets(data);
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Your event tickets could not be loaded.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadTickets();

    return () => {
      isActive = false;
    };
  }, [user?.id]);

  const totalTickets = tickets.length;
  const totalOrders = useMemo(() => new Set(tickets.map((ticket) => ticket.order_id)).size, [tickets]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_28%,#f8fafc_100%)]">
      <div className="border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5 md:px-8">
          <BackTab onBack={onBack} />
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-slate-400">Profile</p>
            <h2 className="mt-1 truncate text-xl font-bold text-slate-950">Event Tickets</h2>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] bg-slate-50 px-5 py-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-400">Tickets</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{totalTickets}</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 px-5 py-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-400">Orders</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{totalOrders}</p>
            </div>
            <div className="rounded-[24px] bg-slate-50 px-5 py-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-400">QR Access</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Generate QR only when you want to show it at the event gate.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              Loading your event tickets...
            </div>
          ) : error ? (
            <div className="rounded-[30px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
              {error}
            </div>
          ) : !tickets.length ? (
            <div className="rounded-[30px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-400">No tickets</p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-950">You have not bought any event tickets yet</h3>
            </div>
          ) : (
            tickets.map((ticket) => (
              <article key={ticket.id} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      {ticket.order?.event_name || "Event"}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">{ticket.ticket_code}</h3>
                    <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                      <p>Category: {ticket.ticket_category_name || ticket.order?.ticket_category_name || "General"}</p>
                      <p className="inline-flex items-center gap-2">
                        <User size={15} />
                        {ticket.buyer_name}
                      </p>
                      <p className="inline-flex items-center gap-2">
                        <CalendarDays size={15} />
                        {ticket.order?.event_date_time
                          ? new Intl.DateTimeFormat("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            }).format(new Date(ticket.order.event_date_time))
                          : "Date pending"}
                      </p>
                      <p>Ticket #{ticket.ticket_index}</p>
                      <p>Order quantity: {ticket.order?.quantity || 1}</p>
                      <p>
                        Paid: {formatCurrency(ticket.order?.total_amount || ticket.order?.unit_price || 0, "SLL")}
                      </p>
                      <p>
                        Category price:{" "}
                        {formatCurrency(
                          ticket.ticket_category_price || ticket.order?.ticket_category_price || ticket.order?.unit_price || 0,
                          "SLL"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <StatusPill status={ticket.status || "unused"} />
                    <button
                      type="button"
                      onClick={() => setActiveQrTicket(ticket)}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      <QrCode size={16} />
                      <span>Generate QR Code</span>
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <QrModal ticket={activeQrTicket} onClose={() => setActiveQrTicket(null)} />
    </div>
  );
}
