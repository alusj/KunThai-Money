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

    verifyVerificationTicket(verificationToken, "reset-password", phone.trim());

    const user = await findUserByPhone(phone.trim());

    if (!user?.id) {
      return res.status(404).json({
        error: "We couldn't find an account for this phone number.",
      });
    }

    const supabase = createServiceClient();
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password,
      phone_confirm: true,
    });

    if (error) {
      throw error;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json(normalizeApiError(error, "Unable to reset the password."));
  }
}
