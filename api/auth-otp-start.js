import { normalizeApiError, startTwilioVerification } from "./_lib/authFlow.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { phone, channel = "sms" } = req.body || {};

    if (!phone?.trim()) {
      return res.status(400).json({ error: "Phone number is required." });
    }

    await startTwilioVerification({
      phone: phone.trim(),
      channel,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json(normalizeApiError(error, "Unable to send verification code."));
  }
}
