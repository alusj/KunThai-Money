import { useEffect, useMemo, useState } from "react";

import { ACCOUNT_TYPE_OPTIONS } from "../../../Backend/utils/accountTypes";
import { countryMap } from "../../../Backend/utils/countryMap";
import { EVENT_ACCOUNT_TYPE, normalizeTicketCategories } from "../../../Backend/utils/eventAccounts";
import BackTab from "./Transactions/BackTab";

const DEFAULT_EVENT_TICKET_CATEGORIES = [
  { id: "general", name: "General", price: "", available_tickets: "" },
];

export default function CreateAnotherAccountScreen({
  mainAccount,
  existingAccounts = [],
  mode = "create",
  editAccount = null,
  rejectionReason = "",
  onBack,
  onCreate,
}) {
  const [accountType, setAccountType] = useState(editAccount?.account_type || "");
  const [accountName, setAccountName] = useState(editAccount?.account_name || "");
  const [locationMode, setLocationMode] = useState(editAccount?.location_mode || "manual");
  const [useCurrentLocation, setUseCurrentLocation] = useState(Boolean(editAccount?.use_current_location));
  const [locationCountry, setLocationCountry] = useState(editAccount?.location_country || mainAccount?.country || "");
  const [locationCity, setLocationCity] = useState(editAccount?.location_city || "");
  const [locationAddress, setLocationAddress] = useState(editAccount?.location_address || "");
  const [nearbyDiscoveryEnabled, setNearbyDiscoveryEnabled] = useState(
    editAccount?.nearby_discovery_enabled ?? true
  );
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locationLookupLoading, setLocationLookupLoading] = useState(false);
  const [locatedAddress, setLocatedAddress] = useState("");
  const [locationLookupError, setLocationLookupError] = useState("");
  const [locatedCoordinates, setLocatedCoordinates] = useState(null);
  const [permissionState, setPermissionState] = useState("prompt");
  const [showLocationHelp, setShowLocationHelp] = useState(false);
  const [requestedBusinessDocuments, setRequestedBusinessDocuments] = useState(
    editAccount?.metadata?.agent_profile?.requested_business_documents ||
      editAccount?.metadata?.insurance_profile?.requested_business_documents ||
      []
  );
  const [businessDocumentNote, setBusinessDocumentNote] = useState(
    editAccount?.metadata?.agent_profile?.business_document_note ||
      editAccount?.metadata?.insurance_profile?.business_document_note ||
      ""
  );
  const [eventName, setEventName] = useState(editAccount?.metadata?.event_profile?.event_name || "");
  const [eventCategory, setEventCategory] = useState(editAccount?.metadata?.event_profile?.event_category || "");
  const [eventLocation, setEventLocation] = useState(editAccount?.metadata?.event_profile?.event_location || "");
  const [eventDate, setEventDate] = useState(editAccount?.metadata?.event_profile?.event_date || "");
  const [eventTime, setEventTime] = useState(editAccount?.metadata?.event_profile?.event_time || "");
  const [ticketCategories, setTicketCategories] = useState(() => {
    const existingCategories = normalizeTicketCategories(editAccount?.metadata?.event_profile?.ticket_categories);

    return existingCategories.length
      ? existingCategories.map((item, index) => ({
          id: item.id || `category-${index + 1}`,
          name: item.name,
          price: String(item.price || ""),
          available_tickets: String(item.available_tickets || ""),
        }))
      : DEFAULT_EVENT_TICKET_CATEGORIES;
  });
  const [eventDescription, setEventDescription] = useState(
    editAccount?.metadata?.event_profile?.description || ""
  );
  const [insuranceCategory, setInsuranceCategory] = useState(
    editAccount?.metadata?.insurance_profile?.insurance_category || ""
  );
  const [insuranceSupportPhone, setInsuranceSupportPhone] = useState(
    editAccount?.metadata?.insurance_profile?.support_phone || ""
  );
  const [insuranceReferenceFormat, setInsuranceReferenceFormat] = useState(
    editAccount?.metadata?.insurance_profile?.payment_reference_format || ""
  );
  const [insurancePaymentTypes, setInsurancePaymentTypes] = useState(
    editAccount?.metadata?.insurance_profile?.accepted_payment_types || ""
  );
  const [donationOrganizationName, setDonationOrganizationName] = useState(
    editAccount?.metadata?.donation_profile?.organization_name || ""
  );
  const [donationCauseCategory, setDonationCauseCategory] = useState(
    editAccount?.metadata?.donation_profile?.cause_category || ""
  );
  const [donationSupportPhone, setDonationSupportPhone] = useState(
    editAccount?.metadata?.donation_profile?.support_phone || ""
  );
  const [donationMission, setDonationMission] = useState(
    editAccount?.metadata?.donation_profile?.mission || ""
  );
  const [businessDocumentFiles, setBusinessDocumentFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEditMode = mode === "resubmit" && Boolean(editAccount?.id);
  const isResubmittingRejectedAgent = isEditMode && editAccount?.account_type === "agent";
  const isInsuranceAccount = accountType === "insurance";
  const isResubmittingRejectedInsurance = isEditMode && editAccount?.account_type === "insurance";
  const isDonationAccount = accountType === "donation";
  const isResubmittingRejectedDonation = isEditMode && editAccount?.account_type === "donation";
  const isResubmittingRejectedEvent = isEditMode && editAccount?.account_type === EVENT_ACCOUNT_TYPE;
  const resubmissionLabel = isResubmittingRejectedInsurance
    ? "insurance"
    : isResubmittingRejectedDonation
      ? "donation"
      : isResubmittingRejectedEvent
        ? "event"
      : "agent";

  useEffect(() => {
    setAccountType(editAccount?.account_type || "");
    setAccountName(editAccount?.account_name || "");
    setLocationMode(editAccount?.location_mode || "manual");
    setUseCurrentLocation(Boolean(editAccount?.use_current_location));
    setLocationCountry(editAccount?.location_country || mainAccount?.country || "");
    setLocationCity(editAccount?.location_city || "");
    setLocationAddress(editAccount?.location_address || "");
    setNearbyDiscoveryEnabled(editAccount?.nearby_discovery_enabled ?? true);
    setRequestedBusinessDocuments(
      editAccount?.metadata?.agent_profile?.requested_business_documents ||
      editAccount?.metadata?.insurance_profile?.requested_business_documents ||
      editAccount?.metadata?.donation_profile?.requested_business_documents ||
      []
    );
    setBusinessDocumentNote(
      editAccount?.metadata?.agent_profile?.business_document_note ||
      editAccount?.metadata?.insurance_profile?.business_document_note ||
      editAccount?.metadata?.donation_profile?.business_document_note ||
      ""
    );
    setEventName(editAccount?.metadata?.event_profile?.event_name || "");
    setEventCategory(editAccount?.metadata?.event_profile?.event_category || "");
    setEventLocation(editAccount?.metadata?.event_profile?.event_location || "");
    setEventDate(editAccount?.metadata?.event_profile?.event_date || "");
    setEventTime(editAccount?.metadata?.event_profile?.event_time || "");
    const existingCategories = normalizeTicketCategories(editAccount?.metadata?.event_profile?.ticket_categories);
    setTicketCategories(
      existingCategories.length
        ? existingCategories.map((item, index) => ({
            id: item.id || `category-${index + 1}`,
            name: item.name,
            price: String(item.price || ""),
            available_tickets: String(item.available_tickets || ""),
          }))
        : DEFAULT_EVENT_TICKET_CATEGORIES
    );
    setEventDescription(editAccount?.metadata?.event_profile?.description || "");
    setInsuranceCategory(editAccount?.metadata?.insurance_profile?.insurance_category || "");
    setInsuranceSupportPhone(editAccount?.metadata?.insurance_profile?.support_phone || "");
    setInsuranceReferenceFormat(editAccount?.metadata?.insurance_profile?.payment_reference_format || "");
    setInsurancePaymentTypes(editAccount?.metadata?.insurance_profile?.accepted_payment_types || "");
    setDonationOrganizationName(editAccount?.metadata?.donation_profile?.organization_name || "");
    setDonationCauseCategory(editAccount?.metadata?.donation_profile?.cause_category || "");
    setDonationSupportPhone(editAccount?.metadata?.donation_profile?.support_phone || "");
    setDonationMission(editAccount?.metadata?.donation_profile?.mission || "");
    setBusinessDocumentFiles([]);
    setError("");
  }, [editAccount, mainAccount?.country, mode]);

  const existingTypes = useMemo(
    () =>
      new Set(
        existingAccounts
          .filter((account) => !isEditMode || account.id !== editAccount?.id)
          .map((account) => account.account_type)
      ),
    [editAccount?.id, existingAccounts, isEditMode]
  );

  const availableOptions = useMemo(
    () => ACCOUNT_TYPE_OPTIONS.filter((option) => !existingTypes.has(option.value)),
    [existingTypes]
  );

  const selectedOption =
    availableOptions.find((option) => option.value === accountType) ||
    ACCOUNT_TYPE_OPTIONS.find((option) => option.value === accountType);
  const isAgentAccount = accountType === "agent";
  const isEventAccount = accountType === EVENT_ACCOUNT_TYPE;
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

  const agentDocumentOptions = [
    "Business registration certificate",
    "Business license",
    "Tax identification",
    "Proof of business address",
  ];

  const updateTicketCategory = (index, field, value) => {
    setTicketCategories((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const addTicketCategory = () => {
    setTicketCategories((current) => [
      ...current,
      {
        id: `category-${Date.now()}-${current.length + 1}`,
        name: "",
        price: "",
        available_tickets: "",
      },
    ]);
  };

  const removeTicketCategory = (index) => {
    setTicketCategories((current) =>
      current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const toggleRequestedDocument = (documentName) => {
    setRequestedBusinessDocuments((current) =>
      current.includes(documentName)
        ? current.filter((item) => item !== documentName)
        : [...current, documentName]
    );
  };

  const handleBusinessDocumentChange = (event) => {
    const files = Array.from(event.target.files || []);
    const invalidFile = files.find((file) => {
      const type = String(file.type || "").toLowerCase();
      return !(type === "application/pdf" || type.startsWith("image/"));
    });

    if (invalidFile) {
      setError("Business documents must be image files or PDF files only.");
      return;
    }

    const oversizedFile = files.find((file) => file.size > 10 * 1024 * 1024);

    if (oversizedFile) {
      setError("Each business document must be smaller than 10MB.");
      return;
    }

    setError("");
    setBusinessDocumentFiles(files);
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

    if (isEventAccount && !eventName.trim()) {
      setError("Enter the event name");
      return;
    }

    if (isEventAccount && !eventLocation.trim()) {
      setError("Enter the event location");
      return;
    }

    if (isEventAccount && !eventDate) {
      setError("Select the event date");
      return;
    }

    if (isEventAccount && !eventTime) {
      setError("Select the event time");
      return;
    }

    const normalizedCategories = isEventAccount
      ? ticketCategories
          .map((item, index) => ({
            id: item.id || `category-${index + 1}`,
            name: String(item.name || "").trim(),
            price: Number(item.price || 0),
            available_tickets: Number(item.available_tickets || 0),
          }))
          .filter((item) => item.name || item.price || item.available_tickets)
      : [];

    if (isEventAccount && !normalizedCategories.length) {
      setError("Add at least one ticket category for this event");
      return;
    }

    if (
      isEventAccount &&
      normalizedCategories.some(
        (item) =>
          !item.name ||
          !(item.price > 0) ||
          !Number.isFinite(item.price) ||
          !(item.available_tickets > 0) ||
          !Number.isFinite(item.available_tickets)
      )
    ) {
      setError("Each event category needs a name, price, and available tickets");
      return;
    }

    if (isInsuranceAccount && !insuranceCategory.trim()) {
      setError("Enter the insurance category");
      return;
    }

    if (isInsuranceAccount && !insuranceSupportPhone.trim()) {
      setError("Enter the insurance support phone");
      return;
    }

    if (isDonationAccount && !donationOrganizationName.trim()) {
      setError("Enter the organization name");
      return;
    }

    if (isDonationAccount && !donationCauseCategory.trim()) {
      setError("Enter the cause category");
      return;
    }

    if (isDonationAccount && !donationSupportPhone.trim()) {
      setError("Enter the donation support phone");
      return;
    }

    if (isResubmittingRejectedAgent && !businessDocumentFiles.length) {
      setError("Upload fresh business documents before resubmitting this agent account.");
      return;
    }

    if (isInsuranceAccount && !businessDocumentFiles.length) {
      setError(
        isResubmittingRejectedInsurance
          ? "Upload fresh insurance documents before resubmitting this insurance account."
          : "Upload at least one insurance document before creating this insurance account."
      );
      return;
    }

    if (isDonationAccount && !businessDocumentFiles.length) {
      setError(
        isResubmittingRejectedDonation
          ? "Upload fresh donation documents before resubmitting this donation account."
          : "Upload at least one donation document before creating this donation account."
      );
      return;
    }

    if (!locationCountry.trim() || !locationCity.trim()) {
      setError("Enter at least country and city for account location");
      return;
    }

    setSaving(true);

    try {
      await onCreate({
        id: editAccount?.id || null,
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
        requested_business_documents:
          isAgentAccount || isInsuranceAccount || isDonationAccount ? requestedBusinessDocuments : [],
        business_document_note:
          isAgentAccount || isInsuranceAccount || isDonationAccount ? businessDocumentNote.trim() : "",
        business_document_files:
          isAgentAccount || isInsuranceAccount || isDonationAccount ? businessDocumentFiles : [],
        event_name: isEventAccount ? eventName.trim() : "",
        event_category: isEventAccount ? eventCategory.trim() : "",
        event_location: isEventAccount ? eventLocation.trim() : "",
        event_date: isEventAccount ? eventDate : "",
        event_time: isEventAccount ? eventTime : "",
        ticket_categories: isEventAccount ? normalizedCategories : [],
        event_description: isEventAccount ? eventDescription.trim() : "",
        insurance_category: isInsuranceAccount ? insuranceCategory.trim() : "",
        support_phone: isInsuranceAccount ? insuranceSupportPhone.trim() : "",
        payment_reference_format: isInsuranceAccount ? insuranceReferenceFormat.trim() : "",
        accepted_payment_types: isInsuranceAccount ? insurancePaymentTypes.trim() : "",
        organization_name: isDonationAccount ? donationOrganizationName.trim() : "",
        cause_category: isDonationAccount ? donationCauseCategory.trim() : "",
        mission: isDonationAccount ? donationMission.trim() : "",
        is_resubmission:
          isResubmittingRejectedAgent ||
          isResubmittingRejectedInsurance ||
          isResubmittingRejectedDonation ||
          isResubmittingRejectedEvent,
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
              {isEditMode ? `${resubmissionLabel} Review Update` : "Account Setup"}
              </p>
            <h1 className="mt-2 text-lg font-bold text-slate-950 md:text-xl">
              {isEditMode ? `Update ${resubmissionLabel} account` : "Create another account"}
            </h1>
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

          {(isResubmittingRejectedAgent ||
            isResubmittingRejectedInsurance ||
            isResubmittingRejectedDonation ||
            isResubmittingRejectedEvent) &&
          rejectionReason ? (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span className="font-semibold">Admin reason:</span> {rejectionReason}
            </div>
          ) : null}

          <div className="grid gap-4">
            <label className="block">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Account Type
              </span>
              <select
                value={accountType}
                disabled={isEditMode}
                onChange={(event) => {
                  const nextType = event.target.value;
                  setAccountType(nextType);
                  const nextOption = availableOptions.find((option) => option.value === nextType);
                  setAccountName(nextOption?.label || "");
                }}
                className={`mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white ${
                  isEditMode ? "cursor-not-allowed bg-slate-100 text-slate-500" : "bg-slate-50"
                }`}
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

            {isEventAccount ? (
              <div className="rounded-[28px] border border-sky-200 bg-[linear-gradient(180deg,#f6fbff_0%,#ffffff_100%)] px-5 py-5">
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-sky-700">
                      Event Setup
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Add the event details buyers should see before paying for a ticket online.
                      {isResubmittingRejectedEvent
                        ? " Update anything the admin team flagged, then resubmit this event for approval."
                        : " New event accounts go live after admin approval."}
                    </p>
                  </div>

                  <div className="grid gap-4 pt-2 md:grid-cols-2">
                    <label className="block">
                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Event Name
                      </span>
                      <input
                        type="text"
                        value={eventName}
                        onChange={(event) => setEventName(event.target.value)}
                        placeholder="Afro Future Live"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Event Category
                      </span>
                      <input
                        type="text"
                        value={eventCategory}
                        onChange={(event) => setEventCategory(event.target.value)}
                        placeholder="Concert, match, conference"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Event Location
                      </span>
                      <input
                        type="text"
                        value={eventLocation}
                        onChange={(event) => setEventLocation(event.target.value)}
                        placeholder="National Stadium, Freetown"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Event Date
                      </span>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(event) => setEventDate(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Event Time
                      </span>
                      <input
                        type="time"
                        value={eventTime}
                        onChange={(event) => setEventTime(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Event Description
                      </span>
                      <textarea
                        rows={4}
                        value={eventDescription}
                        onChange={(event) => setEventDescription(event.target.value)}
                        placeholder="Tell buyers what to expect at this event."
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300"
                      />
                    </label>

                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                            Ticket Categories
                          </span>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            Add stages like General, Stage Area, VIP, or any custom category with its own price and ticket quantity.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={addTicketCategory}
                          className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          Add another category
                        </button>
                      </div>

                      <div className="mt-4 space-y-4">
                        {ticketCategories.map((category, index) => (
                          <div
                            key={category.id}
                            className="rounded-[24px] border border-slate-200 bg-white px-4 py-4"
                          >
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-950">Category {index + 1}</p>
                              {ticketCategories.length > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => removeTicketCategory(index)}
                                  className="text-xs font-semibold text-rose-600 transition hover:text-rose-700"
                                >
                                  Remove
                                </button>
                              ) : null}
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                              <label className="block">
                                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                                  Category Name
                                </span>
                                <input
                                  type="text"
                                  value={category.name}
                                  onChange={(event) => updateTicketCategory(index, "name", event.target.value)}
                                  placeholder="General, VIP, Stage Area"
                                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                                />
                              </label>

                              <label className="block">
                                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                                  Price
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={category.price}
                                  onChange={(event) => updateTicketCategory(index, "price", event.target.value)}
                                  placeholder="0.00"
                                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                                />
                              </label>

                              <label className="block">
                                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                                  Available Tickets
                                </span>
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={category.available_tickets}
                                  onChange={(event) =>
                                    updateTicketCategory(index, "available_tickets", event.target.value)
                                  }
                                  placeholder="300"
                                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                                />
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {isInsuranceAccount ? (
              <div className="rounded-[28px] border border-emerald-200 bg-[linear-gradient(180deg,#f0fdf4_0%,#ffffff_100%)] px-5 py-5">
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-emerald-700">
                      Insurance Setup
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Insurance accounts require admin review before they can appear for nearby premium payments.
                    </p>
                  </div>

                  <div className="grid gap-4 pt-2 md:grid-cols-2">
                    <label className="block">
                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Insurance Category
                      </span>
                      <input
                        type="text"
                        value={insuranceCategory}
                        onChange={(event) => setInsuranceCategory(event.target.value)}
                        placeholder="Health, vehicle, life, travel"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Support Phone
                      </span>
                      <input
                        type="text"
                        value={insuranceSupportPhone}
                        onChange={(event) => setInsuranceSupportPhone(event.target.value)}
                        placeholder="+232 79 000 000"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Policy Reference Format
                      </span>
                      <input
                        type="text"
                        value={insuranceReferenceFormat}
                        onChange={(event) => setInsuranceReferenceFormat(event.target.value)}
                        placeholder="Example: policy number or premium reference"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Accepted Payment Types
                      </span>
                      <input
                        type="text"
                        value={insurancePaymentTypes}
                        onChange={(event) => setInsurancePaymentTypes(event.target.value)}
                        placeholder="Monthly premium, annual premium"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300"
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : null}

            {isDonationAccount ? (
              <div className="rounded-[28px] border border-teal-200 bg-[linear-gradient(180deg,#f0fdfa_0%,#ffffff_100%)] px-5 py-5">
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-teal-700">
                      Donation Setup
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Donation accounts require admin review before they can appear publicly for donors.
                    </p>
                  </div>

                  <div className="grid gap-4 pt-2 md:grid-cols-2">
                    <label className="block">
                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Organization Name
                      </span>
                      <input
                        type="text"
                        value={donationOrganizationName}
                        onChange={(event) => setDonationOrganizationName(event.target.value)}
                        placeholder="KunThai Care Foundation"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Cause Category
                      </span>
                      <input
                        type="text"
                        value={donationCauseCategory}
                        onChange={(event) => setDonationCauseCategory(event.target.value)}
                        placeholder="Children, education, health, community"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Support Phone
                      </span>
                      <input
                        type="text"
                        value={donationSupportPhone}
                        onChange={(event) => setDonationSupportPhone(event.target.value)}
                        placeholder="+232 77 000 000"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Mission
                      </span>
                      <textarea
                        rows={4}
                        value={donationMission}
                        onChange={(event) => setDonationMission(event.target.value)}
                        placeholder="Tell donors what this cause supports and why it matters."
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300"
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : null}

            {(isAgentAccount || isInsuranceAccount || isDonationAccount) && (
              <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4">
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-amber-700">
                      {isResubmittingRejectedAgent || isResubmittingRejectedInsurance || isResubmittingRejectedDonation
                        ? "Business Documents Required"
                        : isInsuranceAccount
                          ? "Insurance Verification Documents"
                          : isDonationAccount
                            ? "Donation Verification Documents"
                            : "Optional Business Documents"}
                    </p>
                    <p className="mt-2 text-sm text-amber-900">
                      {isResubmittingRejectedAgent
                        ? "This agent account was rejected. Upload fresh image or PDF business documents before sending it back for admin review."
                        : isResubmittingRejectedInsurance
                        ? "This insurance account was rejected. Upload fresh image or PDF insurance documents before sending it back for admin review."
                        : isInsuranceAccount
                          ? "Insurance accounts must upload supporting image or PDF documents so the admin team can verify the provider before approval."
                          : isResubmittingRejectedDonation
                            ? "This donation account was rejected. Upload fresh image or PDF donation documents before sending it back for admin review."
                            : isDonationAccount
                              ? "Donation accounts must upload supporting image or PDF documents so the admin team can verify the organization before approval."
                            : "When someone opens an agent account, we can request supporting business documents, but keep them optional for a smoother setup."}
                    </p>
                  </div>

                  <div className="grid gap-3 pt-1 sm:grid-cols-2">
                    {(isInsuranceAccount
                      ? [
                          "Business registration certificate",
                          "Insurance license or regulator approval",
                          "Proof of office address",
                          "Tax identification or company ID",
                        ]
                      : isDonationAccount
                        ? [
                            "NGO or charity registration",
                            "Organization certificate",
                            "Proof of operating address",
                            "Tax or organization ID",
                          ]
                      : agentDocumentOptions
                    ).map((documentName) => (
                      <label
                        key={documentName}
                        className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-white/80 px-4 py-3 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={requestedBusinessDocuments.includes(documentName)}
                          onChange={() => toggleRequestedDocument(documentName)}
                          className="mt-0.5 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span>{documentName}</span>
                      </label>
                    ))}
                  </div>

                  <label className="block">
                    <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Business Document Note
                    </span>
                    <textarea
                      value={businessDocumentNote}
                      onChange={(event) => setBusinessDocumentNote(event.target.value)}
                      rows={3}
                      placeholder={
                        isResubmittingRejectedAgent
                          ? "Explain what you updated for the admin review team"
                          : isResubmittingRejectedInsurance
                            ? "Explain what you updated for the insurance review team"
                            : isResubmittingRejectedDonation
                              ? "Explain what you updated for the donation review team"
                          : isInsuranceAccount
                            ? "Optional note for the insurance review team"
                            : isDonationAccount
                              ? "Optional note for the donation review team"
                            : "Optional note for the agent review team"
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Upload Business Documents {(
                        isResubmittingRejectedAgent ||
                        isInsuranceAccount ||
                        isDonationAccount
                      )
                        ? "*"
                        : ""}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      multiple
                      onChange={handleBusinessDocumentChange}
                      className="mt-2 block w-full rounded-2xl border border-dashed border-amber-300 bg-white px-4 py-3 text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-amber-100 file:px-4 file:py-2 file:font-semibold file:text-amber-700"
                    />
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Upload images or PDF files only. Each file must stay under 10MB.
                    </p>
                    {!!businessDocumentFiles.length && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {businessDocumentFiles.map((file) => (
                          <span
                            key={`${file.name}-${file.size}`}
                            className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800"
                          >
                            {file.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}

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
            {saving
              ? isEditMode
                ? "Sending update..."
                : "Creating account..."
              : isEditMode
                ? `Resubmit ${resubmissionLabel} account`
                : "Create account"}
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
