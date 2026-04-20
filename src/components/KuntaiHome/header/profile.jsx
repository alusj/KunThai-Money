export default function Profile({ name, profile, onClick }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <button
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-1.5 py-1.5 transition hover:border-slate-300 hover:bg-slate-50 sm:gap-3 sm:px-2 sm:py-2"
      aria-label="Open profile"
    >
      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#0f172a,#334155)] text-xs font-semibold text-white sm:h-9 sm:w-9 sm:text-sm">
        {profile?.profile_image ? (
          <img src={profile.profile_image} alt={name} className="h-full w-full object-cover" />
        ) : (
          initials || "U"
        )}
      </div>
    </button>
  );
}
