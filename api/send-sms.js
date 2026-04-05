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

    const phone = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`;
    const text = `Your KunThai verification code is ${otp}`;

    console.log("FORMATTED PHONE:", phone);
    console.log("OTP PRESENT:", !!otp);

    if (!phone || !otp) {
      return res.status(400).json({
        error: {
          http_code: 400,
          message: "Missing phone or otp",
        },
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
              from: "InfoSMS",
              text,
            },
          ],
        }),
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