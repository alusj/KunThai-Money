import {
  checkTwilioVerification,
  createVerificationTicket,
  normalizeApiError,
} from "./_lib/authFlow.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { phone, code, intent } = req.body || {};

    if (!phone?.trim()) {
      return res.status(400).json({ error: "Phone number is required." });
    }

    if (!/^\d{6}$/.test(code || "")) {
      return res.status(400).json({ error: "Enter a valid 6-digit verification code." });
    }

    if (!intent?.trim()) {
      return res.status(400).json({ error: "Verification intent is required." });
    }

    await checkTwilioVerification({
      phone: phone.trim(),
      code: code.trim(),
    });

    return res.status(200).json({
      success: true,
      verificationToken: createVerificationTicket({
        phone: phone.trim(),
        intent: intent.trim(),
      }),
    });
  } catch (error) {
    return res.status(500).json(normalizeApiError(error, "Unable to verify the code."));
  }
}
