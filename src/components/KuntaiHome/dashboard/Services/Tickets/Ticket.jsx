import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ImagePlus, Loader2, MapPin, Search, Ticket as TicketIcon } from "lucide-react";

import { createEventTicketPurchase } from "../../../../../Backend/services/eventTicketService";
import { getDiscoverableEventAccounts } from "../../../../../Backend/services/otherAccountService";
import { formatCurrency } from "../../../../../Backend/utils/formatCurrency";
import { formatEventDateTime, normalizeTicketCategories } from "../../../../../Backend/utils/eventAccounts";
import AccountNumber from "../../MainAccountAction/CashOut/AccountNumber";
import BottomSheet from "../../MainAccountAction/CashOut/BottomSheet";
import TicketHeader from "./TicketHeader";

function getEventCategories(eventProfile = {}) {
  const normalized = normalizeTicketCategories(eventProfile.ticket_categories);

  if (normalized.length) {
    return normalized;
  }

  if (Number(eventProfile.ticket_price || 0) > 0) {
    return [
      {
        id: "general",
        name: "General",
        price: Number(eventProfile.ticket_price || 0),
        available_tickets: Number(eventProfile.available_tickets || 0),
      },
    ];
  }

  return [];
}

function EventCard({ event, onBuy }) {
  const categories = getEventCategories(event.event_profile);
  const lowestPrice = categories.length
    ? Math.min(...categories.map((item) => Number(item.price || 0)))
    : Number(event.event_profile?.ticket_price || 0);
  const totalTickets = categories.length
    ? categories.reduce((total, item) => total + Number(item.available_tickets || 0), 0)
    : Number(event.event_profile?.available_tickets || 0);

  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-300 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sky-700">
            {event.event_profile?.event_category || "Live Event"}
          </p>
          <h3 className="mt-3 text-xl font-semibold text-slate-950">{event.event_name}</h3>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Hosted by {event.account_name || "Event account"}
          </p>
        </div>

        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
          {event.distance_km != null && Number.isFinite(event.distance_km)
            ? `${event.distance_km.toFixed(event.distance_km >= 10 ? 0 : 1)} km away`
            : event.same_city
              ? "Near you"
              : event.same_country
                ? "Same country"
                : "Online"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
        <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
          <MapPin size={16} className="mt-0.5 text-sky-700" />
          <div>
            <p className="font-semibold text-slate-900">Location</p>
            <p className="mt-1 leading-6">{event.event_location}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
          <CalendarDays size={16} className="mt-0.5 text-sky-700" />
          <div>
            <p className="font-semibold text-slate-900">Date & Time</p>
            <p className="mt-1 leading-6">{formatEventDateTime(event.event_profile)}</p>
          </div>
        </div>
      </div>

      {event.event_profile?.description ? (
        <p className="mt-4 text-sm leading-6 text-slate-600">{event.event_profile.description}</p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ticket Price</p>
          <p className="text-lg font-semibold text-slate-950">
            {formatCurrency(lowestPrice || 0, event.currency || "SLL")}
          </p>
          <p className="text-sm text-slate-500">
            {totalTickets} tickets available
          </p>
          {categories.length ? (
            <p className="text-xs text-slate-500">{categories.length} categories available</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => onBuy(event)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <TicketIcon size={16} />
          <span>Buy Ticket</span>
        </button>
      </div>
    </article>
  );
}

export default function Ticket({ onBack, refreshAccount, account, user, profile }) {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [ticketQuantity, setTicketQuantity] = useState("1");
  const [buyerImageFile, setBuyerImageFile] = useState(null);
  const [buyerImagePreview, setBuyerImagePreview] = useState("");
  const [purchaseError, setPurchaseError] = useState("");

  const loadEvents = async (viewerContext = {}) => {
    setLoading(true);
    setError("");

    try {
      const data = await getDiscoverableEventAccounts(viewerContext);
      setEvents(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nearby events could not be loaded.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const baseViewerContext = {
      country: account?.country || "",
      city: account?.city || "",
    };

    void loadEvents(baseViewerContext);

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          void loadEvents({
            ...baseViewerContext,
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
  }, [account?.country, account?.city]);

  const filteredEvents = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    if (!searchTerm) {
      return events;
    }

    return events.filter((event) =>
      [
        event.event_name,
        event.account_name,
        event.event_location,
        event.event_profile?.event_category,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchTerm))
    );
  }, [events, search]);

  const selectedQuantity = Math.max(1, Number(ticketQuantity || 1));
  const selectedCategories = selectedEvent
    ? getEventCategories(selectedEvent.event_profile)
    : [];
  const selectedCategory =
    selectedCategories.find((item) => String(item.id) === String(selectedCategoryId)) ||
    selectedCategories[0] ||
    null;
  const totalAmount = selectedEvent
    ? Number(selectedCategory?.price || 0) * selectedQuantity
    : 0;

  useEffect(() => {
    return () => {
      if (buyerImagePreview) {
        URL.revokeObjectURL(buyerImagePreview);
      }
    };
  }, [buyerImagePreview]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f8fafc_28%,#ffffff_62%)]">
      <TicketHeader onBack={onBack} />

      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
        <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-sky-700">
                Nearby Event Accounts
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">Buy tickets from verified event sellers</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Browse live events near you, check account names, venue details, and event time, then pay directly from your wallet.
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
                placeholder="Search events, venue, or account name"
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
                <span className="text-sm font-medium">Loading nearby events...</span>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
              {error}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-slate-400">No events yet</p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-950">No discoverable event accounts right now</h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Once sellers create active event accounts and enable nearby discovery, their events will show up here with the account name, location, and event time.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onBuy={(eventItem) => {
                    setSelectedEvent(eventItem);
                    const categories = getEventCategories(eventItem.event_profile);
                    setSelectedCategoryId(categories[0]?.id || "");
                    setTicketQuantity("1");
                    setPurchaseError("");
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomSheet
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent ? `Buy ticket: ${selectedEvent.event_name}` : "Buy ticket"}
      >
        {selectedEvent ? (
          <div className="space-y-5">
            <div className="rounded-[26px] border border-sky-200 bg-sky-50 px-5 py-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-sky-700">Selected Event</p>
              <h3 className="mt-3 text-xl font-semibold text-slate-950">{selectedEvent.event_name}</h3>
              <p className="mt-2 text-sm text-slate-600">
                {selectedEvent.account_name} | {selectedEvent.account_number}
              </p>
              <p className="mt-2 text-sm text-slate-600">{selectedEvent.event_location}</p>
              <p className="mt-1 text-sm text-slate-600">
                {formatEventDateTime(selectedEvent.event_profile)}
              </p>
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-white px-5 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Ticket Category
                  </span>
                  <select
                    value={selectedCategoryId}
                    onChange={(event) => {
                      setSelectedCategoryId(event.target.value);
                      setPurchaseError("");
                    }}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  >
                    {selectedCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name} - {formatCurrency(category.price, selectedEvent.currency || "SLL")}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    Quantity to Buy
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={selectedCategory?.available_tickets || 1}
                    step="1"
                    value={ticketQuantity}
                    onChange={(event) => {
                      setTicketQuantity(event.target.value.replace(/[^\d]/g, "") || "1");
                      setPurchaseError("");
                    }}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    <ImagePlus size={14} />
                    Buyer Image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setBuyerImageFile(file);
                      setPurchaseError("");

                      if (buyerImagePreview) {
                        URL.revokeObjectURL(buyerImagePreview);
                      }

                      setBuyerImagePreview(file ? URL.createObjectURL(file) : "");
                    }}
                    className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:font-semibold file:text-white"
                  />
                </label>
              </div>

              {buyerImagePreview ? (
                <div className="mt-4">
                  <img
                    src={buyerImagePreview}
                    alt="Buyer preview"
                    className="h-20 w-20 rounded-[20px] object-cover"
                  />
                </div>
              ) : null}

              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <p>
                  Category:{" "}
                  <span className="font-semibold text-slate-950">
                    {selectedCategory?.name || "Select a category"}
                  </span>
                </p>
                <p className="mt-2">
                  Price per ticket:{" "}
                  <span className="font-semibold text-slate-950">
                    {formatCurrency(Number(selectedCategory?.price || 0), selectedEvent.currency || "SLL")}
                  </span>
                </p>
                <p className="mt-2">
                  Tickets left in category:{" "}
                  <span className="font-semibold text-slate-950">
                    {Number(selectedCategory?.available_tickets || 0)}
                  </span>
                </p>
                <p className="mt-3">
                Total:{" "}
                <span className="font-semibold text-slate-950">
                  {formatCurrency(totalAmount, selectedEvent.currency || "SLL")}
                </span>
                </p>
              </div>

              {purchaseError ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {purchaseError}
                </div>
              ) : null}
            </div>

            <AccountNumber
              account={account}
              user={user}
              profile={profile}
              onClose={() => setSelectedEvent(null)}
              refreshAccount={refreshAccount}
              initialValues={{
                accountNumber: selectedEvent.account_number || "",
                amount: totalAmount ? String(totalAmount) : "",
                reason: `Ticket for ${selectedEvent.event_name} - ${selectedCategory?.name || "Category"} x${selectedQuantity}`,
              }}
              backLabel="Back to event"
              onTransferSuccess={async (transfer) => {
                try {
                  if (!Number.isFinite(selectedQuantity) || selectedQuantity <= 0) {
                    setPurchaseError("Enter a valid quantity before paying.");
                    return;
                  }

                  if (!selectedCategory) {
                    setPurchaseError("Select a ticket category before paying.");
                    return;
                  }

                  const safeAvailable = Number(selectedCategory.available_tickets || 0);

                  if (safeAvailable && selectedQuantity > safeAvailable) {
                    setPurchaseError("Selected quantity is more than the tickets available in this category.");
                    return;
                  }

                  await createEventTicketPurchase({
                    buyerUserId: user?.id,
                    buyerProfile: profile,
                    buyerImageFile,
                    eventAccount: selectedEvent,
                    quantity: selectedQuantity,
                    ticketCategory: selectedCategory,
                    transfer,
                  });

                  setPurchaseError("");
                  await refreshAccount?.();
                  await loadEvents({
                    country: account?.country || "",
                    city: account?.city || "",
                  });
                } catch (ticketError) {
                  const message = ticketError instanceof Error ? ticketError.message : "Tickets could not be created after payment.";
                  setPurchaseError(
                    message.toLowerCase().includes("does not exist")
                      ? "The event ticket SQL is not installed yet. Run `event_ticketing_flow.sql` in Supabase, then try again."
                      : message
                  );
                }
              }}
            />
          </div>
        ) : null}
      </BottomSheet>
    </div>
  );
}
