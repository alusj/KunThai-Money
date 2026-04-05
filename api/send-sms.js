export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: { http_code: 405, message: "Method not allowed" },
    });
  }

  try {
    const body = req.body || {};

    const phone =
      body?.user?.phone ||
      body?.sms?.phone ||
      body?.phone ||
      body?.recipient ||
      "";

    const message =
      body?.sms?.message ||
      body?.message ||
      body?.otp_message ||
      "";

    if (!phone || !message) {
      console.error("Missing phone or message in hook payload:", body);
      return res.status(400).json({
        error: { http_code: 400, message: "Missing phone or message" },
      });
    }

    const infobipRes = await fetch(
      `${process.env.INFOBIP_BASE_URL}/sms/3/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `App ${process.env.INFOBIP_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              destinations: [{ to: phone }],
              from: process.env.INFOBIP_SENDER || "InfoSMS",
              text: message,
            },
          ],
        }),
      }
    );

    const data = await infobipRes.json();

    if (!infobipRes.ok) {
      console.error("Infobip error:", data);
      return res.status(500).json({
        error: {
          http_code: 500,
          message: "Infobip SMS send failed",
        },
      });
    }

    return res.status(200).json({
      success: true,
      provider: "infobip",
      data,
    });
  } catch (error) {
    console.error("Send SMS hook error:", error);
    return res.status(500).json({
      error: { http_code: 500, message: "Internal server error" },
    });
  }
}