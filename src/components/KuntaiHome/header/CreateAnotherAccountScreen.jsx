import { useMemo, useState } from "react";

import { ACCOUNT_TYPE_OPTIONS } from "../../../Backend/utils/accountTypes";
import { countryMap } from "../../../Backend/utils/countryMap";
import BackTab from "./Transactions/BackTab";

export default function CreateAnotherAccountScreen({
  mainAccount,
  existingAccounts = [],
  onBack,
  onCreate,
}) {
  const [accountType, setAccountType] = useState("");
  const [accountName, setAccountName] = useState("");
  const [locationMode, setLocationMode] = useState("manual");
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [locationCountry, setLocationCountry] = useState(mainAccount?.country || "");
  const [locationCity, setLocationCity] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [nearbyDiscoveryEnabled, setNearbyDiscoveryEnabled] = useState(true);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locationLookupLoading, setLocationLookupLoading] = useState(false);
  const [locatedAddress, setLocatedAddress] = useState("");
  const [locationLookupError, setLocationLookupError] = useState("");
  const [locatedCoordinates, setLocatedCoordinates] = useState(null);
  const [permissionState, setPermissionState] = useState("prompt");
  const [showLocationHelp, setShowLocationHelp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const existingTypes = useMemo(
    () => new Set(existingAccounts.map((account) => account.account_type)),
    [existingAccounts]
  );

  const availableOptions = useMemo(
    () => ACCOUNT_TYPE_OPTIONS.filter((option) => !existingTypes.has(option.value)),
    [existingTypes]
  );

  const selectedOption = availableOptions.find((option) => option.value === accountType);
  const locationIsDevice = locationMode === "device" || useCurrentLocation;
  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/i.test(navigator.userAgent || "");
  const isAndroid =
    typeof navigator !== "undefined" &&
    /Android/i.test(navigator.userAgent || "");

  const detectLocationPermission = async () => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
      return "prompt";
    }

    try {
      const permission = await navigator.permissions.query({ name: "geolocation" });
      return permission.state || "prompt";
    } catch {
      return "prompt";
    }
  };

  const handleOpenLocationPrompt = async () => {
    const nextPermissionState = await detectLocationPermission();

    setPermissionState(nextPermissionState);
    setShowLocationPrompt(true);
    setLocatedAddress("");
    setLocatedCoordinates(null);
    setLocationLookupError(
      nextPermissionState === "denied"
        ? "Location is blocked in your browser settings. Please enable location access for this site, or enter your location manually."
        : ""
    );
  };

  const handleLocateUser = async () => {
    setLocationLookupLoading(true);
    setLocationLookupError("");
    setLocatedAddress("");
    setLocatedCoordinates(null);

    try {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        throw new Error("Geolocation is not supported on this device.");
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
        });
      });

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to resolve your current location.");
      }

      const data = await response.json();
      const address = data.address || {};
      const resolvedCountry = address.country || mainAccount?.country || "";
      const resolvedCity =
        address.city ||
        address.town ||
        address.village ||
        address.county ||
        "";
      const resolvedAddress =
        data.display_name ||
        [resolvedCity, resolvedCountry].filter(Boolean).join(", ");

      setPermissionState("granted");
      setLocatedAddress(resolvedAddress);
      setLocatedCoordinates({
        latitude,
        longitude,
        country: resolvedCountry,
        city: resolvedCity,
        address: resolvedAddress,
      });
    } catch (err) {
      const message = err.message?.toLowerCase?.() || "";

      if (message.includes("denied") || message.includes("permission")) {
        setPermissionState("denied");
        setLocationLookupError(
          "Location is blocked in your browser settings. Please enable location access for this site, or enter your location manually."
        );
      } else {
        setLocationLookupError(err.message || "Failed to locate your current position.");
      }
    } finally {
      setLocationLookupLoading(false);
    }
  };

  const handleAddLocatedAddress = () => {
    if (!locatedCoordinates) {
      return;
    }

    setLocationMode("device");
    setUseCurrentLocation(true);
    setLocationCountry(locatedCoordinates.country || mainAccount?.country || "");
    setLocationCity(locatedCoordinates.city || "");
    setLocationAddress(locatedCoordinates.address || "");
    setShowLocationPrompt(false);
  };

  const handleSubmit = async () => {
    setError("");

    if (!accountType) {
      setError("Select an account type");
      return;
    }

    if (!accountName.trim()) {
      setError("Enter an account name");
      return;
    }

    if (!locationCountry.trim() || !locationCity.trim()) {
      setError("Enter at least country and city for account location");
      return;
    }

    setSaving(true);

    try {
      await onCreate({
        account_type: accountType,
        account_name: accountName.trim(),
        location_mode: locationIsDevice ? "device" : "manual",
        use_current_location: locationIsDevice,
        location_country: locationCountry.trim(),
        location_city: locationCity.trim(),
        location_address: locationAddress.trim() || null,
        latitude: locationIsDevice ? locatedCoordinates?.latitude || null : null,
        longitude: locationIsDevice ? locatedCoordinates?.longitude || null : null,
        nearby_discovery_enabled: nearbyDiscoveryEnabled,
      });
    } catch (err) {
      const message = err.message?.toLowerCase?.() || "";

      if (message.includes("kuntai_other_accounts_account_number_key") || message.includes("duplicate key value")) {
        setError(
          "The account-number generator in the database needs the numbering fix. Run `other_accounts_numbering_fix.sql` in Supabase and try again."
        );
      } else
      if (message.includes("function public.create_other_account")) {
        setError("The create account SQL is not installed yet. Run `other_accounts_schema.sql` first.");
      } else {
        setError(err.message || "Failed to create account");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-8">
          <BackTab onBack={onBack} />
          <div className="text-center">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
              Account Setup
            </p>
            <h1 className="mt-2 text-lg font-bold text-slate-950 md:text-xl">Create another account</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="grid gap-4">
            <label className="block">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Account Type
              </span>
              <select
                value={accountType}
                onChange={(event) => {
                  const nextType = event.target.value;
                  setAccountType(nextType);
                  const nextOption = availableOptions.find((option) => option.value === nextType);
                  setAccountName(nextOption?.label || "");
                }}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              >
                <option value="">Select an account type</option>
                {availableOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Account Name
              </span>
              <input
                type="text"
                value={accountName}
                onChange={(event) => setAccountName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Location Source
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                      setLocationMode("manual");
                      setUseCurrentLocation(false);
                      setShowLocationPrompt(false);
                      setLocatedAddress("");
                      setLocatedCoordinates(null);
                      setPermissionState("prompt");
                      setLocationLookupError("");
                    }}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    !locationIsDevice ? "bg-slate-950 text-white" : "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  Enter manually
                </button>
                <button
                  type="button"
                  onClick={handleOpenLocationPrompt}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    locationIsDevice ? "bg-slate-950 text-white" : "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  Use your current location
                </button>
              </div>
            </div>

            <label className="block">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Location Country
              </span>
              <select
                value={locationCountry}
                onChange={(event) => setLocationCountry(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              >
                <option value="">Select country</option>
                {Object.values(countryMap).map((country) => (
                  <option key={country.country} value={country.country}>
                    {country.country}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Location City
              </span>
              <input
                type="text"
                value={locationCity}
                onChange={(event) => setLocationCity(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Location Address
              </span>
              <input
                type="text"
                value={locationAddress}
                onChange={(event) => setLocationAddress(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>

            <label className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
              <span>
                <span className="block text-sm font-semibold text-slate-900">Nearby discovery</span>
                <span className="mt-1 block text-sm text-slate-500">
                  Allow this account to appear in nearby merchant or service suggestions.
                </span>
              </span>
              <input
                type="checkbox"
                checked={nearbyDiscoveryEnabled}
                onChange={(event) => setNearbyDiscoveryEnabled(event.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-slate-950 focus:ring-slate-500"
              />
            </label>

          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className={`mt-8 w-full rounded-[24px] px-5 py-4 text-sm font-semibold text-white transition ${
              saving ? "bg-slate-400" : "bg-slate-950 hover:bg-slate-800"
            }`}
          >
            {saving ? "Creating account..." : "Create account"}
          </button>
        </div>
      </div>

      {showLocationPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white p-6 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Current Location</p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950">Allow our system to locate you</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              We will try to detect your current location so nearby merchant and service suggestions feel more professional and relevant.
            </p>

            {!locationLookupLoading && !locatedAddress && permissionState === "prompt" && !locationLookupError && (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                Tap allow to let this site request your current location.
              </div>
            )}

            {!locationLookupLoading && !locatedAddress && permissionState === "granted" && !locationLookupError && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                Location permission is enabled. Tap allow to fetch your current location now.
              </div>
            )}

            {locationLookupLoading && (
              <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-700">
                Locating you...
              </div>
            )}

            {!locationLookupLoading && locatedAddress && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                Located, your current location is "{locatedAddress}".
              </div>
            )}

            {!locationLookupLoading && locationLookupError && (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                {locationLookupError}
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {!locatedAddress ? (
                <>
                  <button
                    onClick={handleLocateUser}
                    disabled={locationLookupLoading || permissionState === "denied"}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
                      locationLookupLoading || permissionState === "denied"
                        ? "bg-slate-300"
                        : "bg-slate-950 hover:bg-slate-800"
                    }`}
                  >
                    Allow
                  </button>
                  <button
                    onClick={() => {
                      setShowLocationPrompt(false);
                      setLocationMode("manual");
                      setUseCurrentLocation(false);
                    }}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Denied
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleAddLocatedAddress}
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Add location
                  </button>
                  <button
                    onClick={() => {
                      setShowLocationPrompt(false);
                      setLocatedAddress("");
                      setLocatedCoordinates(null);
                    }}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>

            {!locationLookupLoading && permissionState === "denied" && (
              <button
                onClick={() => setShowLocationHelp(true)}
                className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Enable location
              </button>
            )}
          </div>
        </div>
      )}

      {showLocationHelp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white p-6 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Enable Location</p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950">Turn location back on for this site</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Because this is running in your browser, we cannot open the device location settings directly like a native app. You can enable it in your browser settings, then come back and try again.
            </p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              {isIOS && (
                <div className="space-y-2">
                  <p>On iPhone or iPad:</p>
                  <p>1. Open the browser site settings for this page.</p>
                  <p>2. Find Location.</p>
                  <p>3. Change it to Allow.</p>
                  <p>4. Return here and tap Allow again.</p>
                </div>
              )}

              {isAndroid && (
                <div className="space-y-2">
                  <p>On Android:</p>
                  <p>1. Open the browser site settings for this page.</p>
                  <p>2. Tap Permissions or Location.</p>
                  <p>3. Change it to Allow.</p>
                  <p>4. Return here and tap Allow again.</p>
                </div>
              )}

              {!isIOS && !isAndroid && (
                <div className="space-y-2">
                  <p>In your browser:</p>
                  <p>1. Open site settings for this page.</p>
                  <p>2. Find Location permissions.</p>
                  <p>3. Change it to Allow.</p>
                  <p>4. Return here and tap Allow again.</p>
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={async () => {
                  const nextPermissionState = await detectLocationPermission();
                  setPermissionState(nextPermissionState);
                  setShowLocationHelp(false);
                  setLocationLookupError(
                    nextPermissionState === "denied"
                      ? "Location is blocked in your browser settings. Please enable location access for this site, or enter your location manually."
                      : ""
                  );
                }}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                I enabled it
              </button>
              <button
                onClick={() => setShowLocationHelp(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
