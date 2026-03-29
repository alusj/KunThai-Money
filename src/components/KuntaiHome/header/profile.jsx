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
      className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-2 transition hover:border-slate-300 hover:bg-slate-50"
      aria-label="Open profile"
    >
      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#0f172a,#334155)] text-sm font-semibold text-white">
        {profile?.profile_image ? (
          <img src={profile.profile_image} alt={name} className="h-full w-full object-cover" />
        ) : (
          initials || "U"
        )}
      </div>
    </button>
  );
}
