import { createServiceClient } from "./_lib/supabaseServer.js";
import {
  findUserByPhone,
  normalizeApiError,
  verifyVerificationTicket,
} from "./_lib/authFlow.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { phone, password, verificationToken } = req.body || {};

    if (!phone?.trim()) {
      return res.status(400).json({ error: "Phone number is required." });
    }

    if ((password || "").length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    verifyVerificationTicket(verificationToken, "register", phone.trim());

    const existingUser = await findUserByPhone(phone.trim());

    if (existingUser) {
      return res.status(409).json({
        error: "An account with this phone number already exists. Please sign in instead.",
      });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.auth.admin.createUser({
      phone: phone.trim(),
      password,
      phone_confirm: true,
    });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      userId: data?.user?.id || null,
    });
  } catch (error) {
    return res.status(500).json(normalizeApiError(error, "Unable to complete registration."));
  }
}
