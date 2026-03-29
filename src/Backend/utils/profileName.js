export function buildFullName(firstName = "", middleName = "", lastName = "") {
  return [firstName, middleName, lastName]
    .map((value) => value?.trim?.() ?? "")
    .filter(Boolean)
    .join(" ");
}

export function getGreetingName(profile) {
  return profile?.first_name?.trim?.() || "User";
}

export function resolveRegisteredName(profile, user) {
  const profileName = buildFullName(profile?.first_name, profile?.middle_name, profile?.last_name);

  if (profileName) {
    return profileName;
  }

  const meta = user?.user_metadata || user?.raw_user_meta_data || {};

  return (
    meta.full_name?.trim?.() ||
    meta.display_name?.trim?.() ||
    meta.name?.trim?.() ||
    buildFullName(meta.first_name, meta.middle_name, meta.last_name) ||
    user?.email?.split?.("@")?.[0] ||
    "User"
  );
}

export function resolveProfileNameParts(profile, user) {
  const meta = user?.user_metadata || user?.raw_user_meta_data || {};

  const firstName = profile?.first_name || meta.first_name || "";
  const middleName = profile?.middle_name || meta.middle_name || "";
  const lastName = profile?.last_name || meta.last_name || "";

  if (firstName || middleName || lastName) {
    return { firstName, middleName, lastName };
  }

  const fallbackName =
    meta.full_name?.trim?.() || meta.display_name?.trim?.() || meta.name?.trim?.() || "";

  if (!fallbackName) {
    return { firstName: "", middleName: "", lastName: "" };
  }

  const parts = fallbackName.split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || "",
    middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
    lastName: parts.length > 1 ? parts[parts.length - 1] : "",
  };
}
