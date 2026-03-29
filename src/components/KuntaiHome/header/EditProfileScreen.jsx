import { useCallback, useEffect, useMemo, useState } from "react";
import Cropper from "react-easy-crop";

import supabase from "../../../Backend/lib/supabaseClient";
import { buildFullName, resolveProfileNameParts } from "../../../Backend/utils/profileName";
import BackTab from "./Transactions/BackTab";

export default function EditProfileScreen({ profile, account, user, onBack, onSaved }) {
  const initialParts = useMemo(() => resolveProfileNameParts(profile, user), [profile, user]);
  const [firstName, setFirstName] = useState(initialParts.firstName);
  const [middleName, setMiddleName] = useState(initialParts.middleName);
  const [lastName, setLastName] = useState(initialParts.lastName);
  const [phone, setPhone] = useState(profile?.phone || user?.phone || "");
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.profile_image || null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFirstName(initialParts.firstName);
    setMiddleName(initialParts.middleName);
    setLastName(initialParts.lastName);
    setPhone(profile?.phone || user?.phone || "");
    setAvatar(null);
    setAvatarPreview(profile?.profile_image || null);
  }, [initialParts, profile, user]);

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file for your profile picture");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile image must be smaller than 5MB");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setAvatar(file);
    setAvatarPreview(imageUrl);
    setShowCrop(true);
    setError("");
  };

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

  const handleSave = async () => {
    setError("");

    const cleanFirstName = firstName.trim();
    const cleanMiddleName = middleName.trim();
    const cleanLastName = lastName.trim();

    if (cleanFirstName.length < 2) {
      setError("Enter your first name");
      return;
    }

    if (cleanLastName.length < 2) {
      setError("Enter your surname or last name");
      return;
    }

    if (phone.trim().length < 7) {
      setError("Enter a valid phone number");
      return;
    }

    setLoading(true);

    try {
      let avatarUrl = profile?.profile_image || null;

      if (avatar && croppedAreaPixels) {
        const croppedBlob = await getCroppedImg();
        const fileName = `${user.id}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, croppedBlob, { contentType: "image/jpeg" });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(fileName);
        avatarUrl = publicData.publicUrl;
      }

      const profilePayload = {
        first_name: cleanFirstName,
        middle_name: cleanMiddleName || null,
        last_name: cleanLastName,
        phone: phone.trim(),
        profile_image: avatarUrl,
        is_profile_complete: true,
      };

      let profileId = profile?.id || null;

      if (!profileId) {
        const { data: existingProfile, error: existingProfileError } = await supabase
          .from("kuntai_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingProfileError) {
          throw existingProfileError;
        }

        profileId = existingProfile?.id || null;
      }

      if (!profileId) {
        const { data: insertedProfile, error: insertError } = await supabase
          .from("kuntai_profiles")
          .insert({
            user_id: user.id,
            ...profilePayload,
          })
          .select("id,first_name,middle_name,last_name,phone,profile_image")
          .single();

        if (insertError) {
          const message = insertError.message?.toLowerCase?.() || "";

          if (message.includes("row-level security")) {
            throw new Error(
              "Your profile row is missing and Supabase RLS is blocking creation. Run the `kuntai_profiles_rls.sql` policy first."
            );
          }

          throw insertError;
        }

        const fullName = buildFullName(cleanFirstName, cleanMiddleName, cleanLastName);
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            name: fullName,
            display_name: fullName,
            full_name: fullName,
            first_name: cleanFirstName,
            middle_name: cleanMiddleName || null,
            last_name: cleanLastName,
          },
        });

        if (authError) {
          console.warn("Auth profile sync warning:", authError.message);
        }

        await onSaved?.({
          id: insertedProfile.id,
          first_name: insertedProfile.first_name,
          middle_name: insertedProfile.middle_name,
          last_name: insertedProfile.last_name,
          phone: insertedProfile.phone,
          profile_image: insertedProfile.profile_image,
        });
        onBack?.();
        return;
      }

      const { data: savedProfile, error: profileError } = await supabase
        .from("kuntai_profiles")
        .update(profilePayload)
        .eq("id", profileId)
        .select("id,first_name,middle_name,last_name,phone,profile_image")
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!savedProfile?.id) {
        throw new Error("Profile update did not persist. Please try again.");
      }

      const fullName = buildFullName(cleanFirstName, cleanMiddleName, cleanLastName);
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: fullName,
          display_name: fullName,
          full_name: fullName,
          first_name: cleanFirstName,
          middle_name: cleanMiddleName || null,
          last_name: cleanLastName,
          phone: phone.trim(),
          profile_image: avatarUrl,
        },
      });

      if (authError) {
        console.warn("Auth profile sync warning:", authError.message);
      }

      await onSaved?.({
        first_name: savedProfile.first_name,
        middle_name: savedProfile.middle_name,
        last_name: savedProfile.last_name,
        phone: savedProfile.phone,
        profile_image: savedProfile.profile_image,
      });
      onBack?.();
    } catch (err) {
      setError(err.message || "Failed to update your profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-8">
          <BackTab onBack={onBack} />
          <div className="text-center">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
              Edit Profile
            </p>
            <h1 className="mt-2 text-lg font-bold text-slate-950 md:text-xl">Update your account details</h1>
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

          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#0f172a,#1d4ed8)] text-3xl font-semibold text-white">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                (firstName[0] || user?.email?.[0] || "U").toUpperCase()
              )}
            </div>

            <label className="mt-4 cursor-pointer rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
              Upload profile picture
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                First Name
              </span>
              <input
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Middle Name
              </span>
              <input
                type="text"
                value={middleName}
                onChange={(event) => setMiddleName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4">
            <label className="block">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Surname / Last Name
              </span>
              <input
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Phone Number
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </label>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Account Number
              </p>
              <p className="mt-2 text-base font-semibold text-slate-950">{account?.account_number || "Pending"}</p>
              <p className="mt-1 text-xs text-slate-500">Account number is generated by the system and cannot be edited.</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            className={`mt-8 w-full rounded-[24px] px-5 py-4 text-sm font-semibold text-white transition ${
              loading ? "bg-slate-400" : "bg-slate-950 hover:bg-slate-800"
            }`}
          >
            {loading ? "Saving changes..." : "Save profile changes"}
          </button>
        </div>
      </div>

      {showCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-4">
            <div className="relative h-72 w-full overflow-hidden rounded-2xl">
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
              className="mt-4 w-full rounded-2xl bg-slate-950 py-3 text-sm font-semibold text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
