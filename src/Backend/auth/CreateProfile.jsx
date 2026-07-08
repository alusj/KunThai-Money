import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";

import supabase from "../../Backend/lib/supabaseClient";
import { countryMap } from "../utils/countryMap";
import { clearOnboardingPhone, getOnboardingPhone } from "../utils/onboardingStorage";
import { maskPhoneNumber } from "../utils/maskPhoneNumber";
import { buildFullName } from "../utils/profileName";
import AuthNotice from "../../components/auth/AuthNotice";
import AuthShell from "../../components/auth/AuthShell";
import PageTransition from "../../components/animations/PageTransition";

export default function CreateProfile() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPhone = async () => {
      const savedPhone = getOnboardingPhone();

      if (savedPhone) {
        setPhone(savedPhone);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { data: profile } = await supabase
        .from("kuntai_profiles")
        .select("phone")
        .eq("user_id", user.id)
        .single();

      if (profile?.phone) {
        setPhone(profile.phone);
      }
    };

    loadPhone();
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const getCountryCode = (currentPhone) =>
    Object.keys(countryMap).find((code) => currentPhone.startsWith(code));

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file for your avatar");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Avatar image must be smaller than 5MB");
      return;
    }

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    const imageUrl = URL.createObjectURL(file);
    setAvatar(file);
    setAvatarPreview(imageUrl);
    setShowCrop(true);
    setError("");
  };

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const getCroppedImg = async () => {
    const image = new Image();
    image.src = avatarPreview;

    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    context.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg");
    });
  };

  const handleCreateProfile = async (event) => {
    event.preventDefault();
    setError("");

    const cleanFirstName = firstName.trim();
    const cleanMiddleName = middleName.trim();
    const cleanLastName = lastName.trim();
    const fullName = buildFullName(cleanFirstName, cleanMiddleName, cleanLastName);

    if (cleanFirstName.length < 2) {
      setError("Enter your first name");
      return;
    }

    if (cleanLastName.length < 2) {
      setError("Enter your surname or last name");
      return;
    }

    if (!phone) {
      setError("Phone number missing. Restart registration.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data: existingAccount } = await supabase
        .from("kuntai_accounts")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingAccount) {
        navigate("/home");
        return;
      }

      let avatarUrl = null;

      if (avatar && croppedAreaPixels) {
        const croppedBlob = await getCroppedImg();
        const fileName = `${user.id}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, croppedBlob, { upsert: true, contentType: "image/jpeg" });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(fileName);
        avatarUrl = publicData.publicUrl;
      }

      const { error: profileError } = await supabase
        .from("kuntai_profiles")
        .upsert(
          {
            user_id: user.id,
            first_name: cleanFirstName,
            middle_name: cleanMiddleName || null,
            last_name: cleanLastName,
            email: email || null,
            phone,
            profile_image: avatarUrl,
            is_profile_complete: true,
          },
          { onConflict: "user_id" }
        );

      if (profileError) {
        throw profileError;
      }

      const authUpdatePayload = {
        data: {
          name: fullName,
          display_name: fullName,
          full_name: fullName,
          first_name: cleanFirstName,
          middle_name: cleanMiddleName || null,
          last_name: cleanLastName,
        },
      };

      if (email) {
        authUpdatePayload.email = email;
      }

      const { error: authUpdateError } = await supabase.auth.updateUser(authUpdatePayload);

      if (authUpdateError) {
        console.warn("Auth profile sync warning:", authUpdateError.message);
      }

      const countryCode = getCountryCode(phone);

      if (!countryCode) {
        throw new Error("Unsupported country");
      }

      const countryData = countryMap[countryCode];

      if (!countryData) {
        throw new Error("Country config missing");
      }

      const { country, currency } = countryData;
      const { error: accountError } = await supabase.rpc("create_kuntai_account", {
        p_phone: phone,
        p_country_code: countryCode,
        p_country: country,
        p_currency: currency,
      });

      if (accountError) {
        throw accountError;
      }

      clearOnboardingPhone();
      navigate("/kyc");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create your profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
    <AuthShell
      eyebrow="Profile Setup"
      title="Complete your profile"
      subtitle="Tell us a little about you so we can personalize your wallet and prepare your account."
    >
      <div className="w-full">
        <h2 className="mb-2 text-center text-2xl font-bold text-slate-50 sm:text-3xl">Create Your Profile</h2>
        <p className="mb-2 text-center text-slate-300">Personalize your account</p>
        {phone && <p className="mb-6 text-center text-sm text-slate-400">{maskPhoneNumber(phone)}</p>}

        {error && (
          <AuthNotice tone="danger" title="Profile setup incomplete">
            {error}
          </AuthNotice>
        )}

        <form onSubmit={handleCreateProfile} className="space-y-5">
          <div className="flex flex-col items-center">
            <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[#31507f] bg-[#10213f]">
              {avatarPreview ? (
                <img src={avatarPreview} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-slate-300">U</span>
              )}
            </div>

            <label className="mt-3 cursor-pointer text-sm font-medium text-sky-300">
              Upload Photo
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="w-full rounded-xl border border-[#28456f] bg-[#10213f] px-4 py-3 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
            />

            <input
              type="text"
              placeholder="Middle Name (optional)"
              value={middleName}
              onChange={(event) => setMiddleName(event.target.value)}
              className="w-full rounded-xl border border-[#28456f] bg-[#10213f] px-4 py-3 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
            />
          </div>

          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className="w-full rounded-xl border border-[#28456f] bg-[#10213f] px-4 py-3 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
          />

          <input
            type="email"
            placeholder="Email Address (optional)"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-[#28456f] bg-[#10213f] px-4 py-3 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-2xl py-3 font-semibold text-white transition ${
              loading ? "bg-[#31507f]" : "bg-[#2563eb] hover:bg-[#3b82f6]"
            }`}
          >
            {loading ? "Creating profile..." : "Continue"}
          </button>
        </form>

        {showCrop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-[24px] border border-[#28456f] bg-[#0d1b34] p-4 text-slate-100 shadow-2xl">
              <div className="relative h-64 w-full">
                <Cropper
                  image={avatarPreview}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowCrop(false)}
                className="mt-4 w-full rounded-lg bg-[#2563eb] py-2 text-white transition hover:bg-[#3b82f6]"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthShell>
    </PageTransition>
  );
}
