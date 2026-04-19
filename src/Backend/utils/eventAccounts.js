export const EVENT_ACCOUNT_TYPE = "tickets";
export const EVENT_SERVICE_KEY = "events";
export const EVENT_ACCOUNT_LABEL = "Event Account";
export const EVENT_SERVICE_LABEL = "Events";

export function getEventProfile(account) {
  return account?.metadata?.event_profile || {};
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
