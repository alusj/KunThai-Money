import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";

import supabase from "../../Backend/lib/supabaseClient";
import { countryMap } from "../utils/countryMap";
import { generateAccountNumber } from "../utils/generateAccountNumber";
import { clearOnboardingPhone, getOnboardingPhone } from "../utils/onboardingStorage";
import { maskPhoneNumber } from "../utils/maskPhoneNumber";
import { buildFullName } from "../utils/profileName";
import AuthNotice from "../../components/auth/AuthNotice";
import AuthShell from "../../components/auth/AuthShell";

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

      const { error: profileError } = await supabase.from("kuntai_profiles").upsert({
        user_id: user.id,
        first_name: cleanFirstName,
        middle_name: cleanMiddleName || null,
        last_name: cleanLastName,
        email: email || null,
        phone,
        profile_image: avatarUrl,
        is_profile_complete: true,
      });

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
      let accountCreated = false;
      let retries = 0;

      while (!accountCreated && retries < 3) {
        const { data: lastAccount } = await supabase
          .from("kuntai_accounts")
          .select("account_number")
          .eq("country_code", countryCode)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        let lastNumber = 0;

        if (lastAccount?.account_number) {
          lastNumber = Number.parseInt(lastAccount.account_number.slice(-8), 10);
        }

        const accountNumber = generateAccountNumber(countryCode, lastNumber);
        const { error: accountError } = await supabase.from("kuntai_accounts").insert([
          {
            user_id: user.id,
            phone,
            country_code: countryCode,
            country,
            account_number: accountNumber,
            currency,
            balance: 0,
          },
        ]);

        if (!accountError) {
          accountCreated = true;
        } else {
          retries += 1;
        }
      }

      if (!accountCreated) {
        throw new Error("Failed to create account. Try again.");
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
    <AuthShell
      eyebrow="Profile Setup"
      title="Complete your profile"
      subtitle="Tell us a little about you so we can personalize your wallet and prepare your account."
    >
      <div className="w-full">
        <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">Create Your Profile</h2>
        <p className="mb-2 text-center text-gray-500">Personalize your account</p>
        {phone && <p className="mb-6 text-center text-sm text-slate-400">{maskPhoneNumber(phone)}</p>}

        {error && (
          <AuthNotice tone="danger" title="Profile setup incomplete">
            {error}
          </AuthNotice>
        )}

        <form onSubmit={handleCreateProfile} className="space-y-5">
          <div className="flex flex-col items-center">
            <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gray-200">
              {avatarPreview ? (
                <img src={avatarPreview} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-gray-500">U</span>
              )}
            </div>

            <label className="mt-3 cursor-pointer text-sm text-blue-600">
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
              className="w-full rounded-xl border px-4 py-3 focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="text"
              placeholder="Middle Name (optional)"
              value={middleName}
              onChange={(event) => setMiddleName(event.target.value)}
              className="w-full rounded-xl border px-4 py-3 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <input
            type="text"
            placeholder="Surname / Last Name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className="w-full rounded-xl border px-4 py-3 focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border px-4 py-3 focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-2xl py-3 font-semibold text-white ${
              loading ? "bg-slate-400" : "bg-slate-950 hover:bg-slate-800"
            }`}
          >
            {loading ? "Creating..." : "Finish Setup"}
          </button>
        </form>
      </div>

      {showCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-[90%] max-w-md rounded-xl bg-white p-4">
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
              onClick={() => setShowCrop(false)}
              className="mt-4 w-full rounded-lg bg-blue-600 py-2 text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
