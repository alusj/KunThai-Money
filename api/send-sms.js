export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: { http_code: 405, message: "Method not allowed" },
    });
  }

  try {
    const body = req.body || {};
    console.log("HOOK BODY:", JSON.stringify(body, null, 2));

    const rawPhone = body?.sms?.phone || body?.user?.phone || "";
    const otp = body?.sms?.otp || "";
    const baseUrl = process.env.INFOBIP_BASE_URL;
    const apiKey = process.env.INFOBIP_API_KEY;
    const sender = process.env.INFOBIP_SENDER || "InfoSMS";

    const phone = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`;
    const text = `Your KunThai verification code is ${otp}`;

    console.log("PHONE:", phone);
    console.log("OTP:", otp);
    console.log("ENV:", {
      hasBaseUrl: !!baseUrl,
      hasApiKey: !!apiKey,
      sender,
    });

    if (!phone || !otp) {
      return res.status(400).json({
        error: { http_code: 400, message: "Missing phone or otp" },
      });
    }

    if (!baseUrl || !apiKey) {
      return res.status(500).json({
        error: {
          http_code: 500,
          message: "Infobip environment is missing INFOBIP_BASE_URL or INFOBIP_API_KEY",
        },
      });
    }

    const payload = {
      messages: [
        {
          sender,
          destinations: [{ to: phone }],
          content: {
            text,
          },
        },
      ],
    };

    console.log("INFOBIP URL:", `${baseUrl}/sms/3/messages`);
    console.log("INFOBIP PAYLOAD:", JSON.stringify(payload, null, 2));

    const infobipRes = await fetch(
      `${baseUrl}/sms/3/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `App ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const rawResponse = await infobipRes.text();

    console.log("INFOBIP STATUS:", infobipRes.status);
    console.log("INFOBIP RESPONSE:", rawResponse);

    if (!infobipRes.ok) {
      return res.status(500).json({
        error: {
          http_code: 500,
          message: `Infobip failed: ${rawResponse}`,
        },
      });
    }

    return res.status(200).end();
  } catch (error) {
    console.error("SEND SMS HOOK ERROR:", error);
    return res.status(500).json({
      error: {
        http_code: 500,
        message: error?.message || "Internal server error",
      },
    });
  }
}
