import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";

import supabase from "../lib/supabaseClient";
import AuthNotice from "../../components/auth/AuthNotice";
import AuthShell from "../../components/auth/AuthShell";
import PageTransition from "../../components/animations/PageTransition";

function isMissingBucketError(error) {
  const message = error?.message?.toLowerCase?.() || "";
  return message.includes("bucket not found") || message.includes("storage bucket");
}

function getKycUploadErrorMessage(error) {
  if (isMissingBucketError(error)) {
    return "KYC storage is not configured yet. Create the private 'kyc' bucket in Supabase Storage, then try again.";
  }

  return error?.message || "Failed to upload your ID document";
}

export default function KYC() {
  const navigate = useNavigate();
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [issuedBy] = useState("Government");
  const [nin, setNin] = useState("");
  const [front, setFront] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFile = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Your ID image must be smaller than 10MB");
      return;
    }

    const url = URL.createObjectURL(file);
    setFront(file);
    setFrontPreview(url);
    setShowCrop(true);
    setErrorMessage("");
  };

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const getCroppedImg = async () => {
    const image = new Image();
    image.src = frontPreview;

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

  const validate = () => {
    if (!idType || !idNumber || !nin || !front) {
      setErrorMessage("Please fill all required fields");
      return false;
    }

    if (idNumber.length < 5) {
      setErrorMessage("Invalid ID number");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Your session expired. Please sign in again.");
      }

      const croppedBlob = await getCroppedImg();
      const fileName = `${user.id}_id.jpg`;

      let frontIdUrl = fileName;
      const { error: uploadError } = await supabase.storage
        .from("kyc")
        .upload(fileName, croppedBlob, { upsert: true, contentType: "image/jpeg" });

      if (uploadError) {
        throw new Error(getKycUploadErrorMessage(uploadError));
      }

      const payload = {
        user_id: user.id,
        id_type: idType,
        id_number: idNumber,
        issued_by: issuedBy,
        front_id_url: frontIdUrl,
        national_id: nin,
        kyc_status: "pending",
      };

      const { data: existingKyc, error: existingKycError } = await supabase
        .from("kuntai_kyc")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingKycError) {
        throw existingKycError;
      }

      const { error } = existingKyc
        ? await supabase.from("kuntai_kyc").update(payload).eq("id", existingKyc.id)
        : await supabase.from("kuntai_kyc").insert(payload);

      if (error) {
        throw error;
      }

      navigate("/welcome-loader");
    } catch (err) {
      setErrorMessage(err.message || "Failed to submit your identity details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
    <AuthShell
      eyebrow="Compliance"
      title="Verify your identity"
      subtitle="Identity verification strengthens trust on the platform and unlocks higher-value features."
    >
      <div className="w-full max-w-md">
        <h2 className="mb-2 text-center text-2xl font-bold text-slate-50">
          Verify Your Identity
        </h2>
        <p className="mb-6 text-center text-sm text-slate-300">
          Complete your KYC to unlock full features
        </p>

        {errorMessage && (
          <AuthNotice tone="danger" title="Verification incomplete">
            {errorMessage}
          </AuthNotice>
        )}

        <div className="space-y-4">
          <select
            value={idType}
            onChange={(event) => setIdType(event.target.value)}
            className="w-full rounded-xl border border-[#28456f] bg-[#10213f] p-3 text-slate-100 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
          >
            <option value="">Select ID Type</option>
            <option>National ID</option>
            <option>Passport</option>
            <option>Driver License</option>
          </select>

          <input
            placeholder="ID Number"
            value={idNumber}
            onChange={(event) => setIdNumber(event.target.value)}
            className="w-full rounded-xl border border-[#28456f] bg-[#10213f] p-3 text-slate-100 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
          />

          <input
            value={issuedBy}
            disabled
            className="w-full rounded-xl border border-[#28456f] bg-[#0c1830] p-3 text-slate-400"
          />

          <input
            placeholder="National Identification Number (NIN)"
            value={nin}
            onChange={(event) => setNin(event.target.value)}
            className="w-full rounded-xl border border-[#28456f] bg-[#10213f] p-3 text-slate-100 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
          />

          <label
            className="block cursor-pointer rounded-xl border-2 border-dashed border-[#31507f] bg-[#0f1f3b] p-4 text-center text-slate-100 transition hover:border-sky-400/70"
          >
            Upload ID (Front Only)
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>

          {frontPreview && <img src={frontPreview} className="h-40 w-full rounded-xl object-cover" />}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full rounded-2xl py-3 text-white ${
              loading
                ? "bg-[#31507f]"
                : "bg-[#2563eb] hover:bg-[#3b82f6]"
            }`}
          >
            {loading ? "Submitting..." : "Verify Identity"}
          </button>

          <button
            onClick={() => setShowSkipConfirm(true)}
            className="mt-3 w-full rounded-xl border border-[#31507f] bg-[#10213f] py-3 text-slate-100 transition hover:bg-[#14284d]"
          >
            Skip for now
          </button>
        </div>
      </div>

      {showCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-[90%] max-w-md rounded-[24px] border border-[#28456f] bg-[#0d1b34] p-4 text-slate-100 shadow-2xl">
            <div className="relative h-64 w-full">
              <Cropper
                image={frontPreview}
                crop={crop}
                zoom={zoom}
                aspect={1.6}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <button
              onClick={() => setShowCrop(false)}
              className="mt-4 w-full rounded-lg bg-[#2563eb] py-2 text-white transition hover:bg-[#3b82f6]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {showSkipConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-[#31507f] bg-[#0d1b34] p-6 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Before You Continue</p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-50">KYC is required for full access</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              You can enter the dashboard now, but you will need to verify your identity before accessing full account capabilities, higher-value activity, and future protected features.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="rounded-2xl border border-[#31507f] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-[#14284d]"
              >
                Go back
              </button>
              <button
                onClick={() => navigate("/welcome-loader")}
                className="rounded-2xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3b82f6]"
              >
                Continue for now
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthShell>
    </PageTransition>
  );
}
