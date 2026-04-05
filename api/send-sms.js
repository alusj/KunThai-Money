export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: { http_code: 405, message: "Method not allowed" },
    });
  }

  try {
    const body = req.body || {};

    console.log("HOOK PAYLOAD:", body);

    const phone =
      body?.user?.phone ||
      body?.sms?.phone ||
      body?.phone ||
      "";

    const message =
      body?.sms?.message ||
      body?.message ||
      "";

    if (!phone || !message) {
      return res.status(400).json({
        error: {
          http_code: 400,
          message: "Missing phone or message",
        },
      });
    }

    const response = await fetch(
      `${process.env.INFOBIP_BASE_URL}/sms/3/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `App ${process.env.INFOBIP_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              destinations: [{ to: phone }],
              from: process.env.INFOBIP_SENDER,
              text: message,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Infobip error:", data);
      return res.status(500).json({
        error: {
          http_code: 500,
          message: "Infobip failed",
        },
      });
    }

    // ✅ THIS IS THE FIX
    return res.status(200).json({
      data: {
        message_id:
          data?.messages?.[0]?.messageId || "sent-successfully",
      },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: {
        http_code: 500,
        message: "Internal server error",
      },
    });
  }
}