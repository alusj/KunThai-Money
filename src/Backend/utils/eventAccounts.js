export const EVENT_ACCOUNT_TYPE = "tickets";
export const EVENT_SERVICE_KEY = "events";
export const EVENT_ACCOUNT_LABEL = "Event Account";
export const EVENT_SERVICE_LABEL = "Events";

export function normalizeTicketCategories(categories = []) {
  return (Array.isArray(categories) ? categories : [])
    .map((item, index) => ({
      id: String(item?.id || `category-${index + 1}`).trim(),
      name: String(item?.name || "").trim(),
      price: Number(item?.price || 0),
      available_tickets: Number(item?.available_tickets || 0),
    }))
    .filter(
      (item) =>
        item.name &&
        Number.isFinite(item.price) &&
        item.price > 0 &&
        Number.isFinite(item.available_tickets) &&
        item.available_tickets > 0
    );
}

export function getEventProfile(account) {
  const profile = account?.metadata?.event_profile || {};
  const ticketCategories = normalizeTicketCategories(profile.ticket_categories);
  const totalAvailableTickets = ticketCategories.reduce(
    (total, category) => total + Number(category.available_tickets || 0),
    0
  );
  const lowestPrice = ticketCategories.length
    ? Math.min(...ticketCategories.map((category) => Number(category.price || 0)))
    : Number(profile.ticket_price || 0);

  return {
    ...profile,
    ticket_categories: ticketCategories,
    ticket_price: Number.isFinite(lowestPrice) ? lowestPrice : 0,
    available_tickets: ticketCategories.length
      ? totalAvailableTickets
      : Number(profile.available_tickets || 0),
  };
}

export function getEventDisplayName(account) {
  const profile = getEventProfile(account);
  return profile.event_name || account?.account_name || "Event";
}

export function getEventLocation(account) {
  const profile = getEventProfile(account);
  return (
    profile.event_location ||
    account?.location_address ||
    [account?.location_city, account?.location_country].filter(Boolean).join(", ") ||
    "Location pending"
  );
}

export function buildEventDateTime(profile = {}) {
  if (!profile.event_date) {
    return null;
  }

  const timePart = profile.event_time ? `${profile.event_time}:00` : "00:00:00";
  const parsed = new Date(`${profile.event_date}T${timePart}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatEventDateTime(profile = {}) {
  const eventDate = buildEventDateTime(profile);

  if (!eventDate) {
    return "Date to be announced";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(eventDate);
}
