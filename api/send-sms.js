export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: { http_code: 405, message: "Method not allowed" },
    });
  }

  try {
    const body = req.body || {};
    console.log("Supabase Send SMS Hook payload:", JSON.stringify(body, null, 2));

    const phone = body?.user?.phone || "";
    const otp = body?.sms?.otp || "";

    if (!phone || !otp) {
      console.error("Invalid hook payload:", body);
      return res.status(400).json({
        error: {
          http_code: 400,
          message: "Missing phone or otp",
        },
      });
    }

    const text = `Your KunThai verification code is ${otp}`;

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
              from: process.env.INFOBIP_SENDER || "KunThai",
              text,
            },
          ],
        }),
      }
    );

    const data = await infobipRes.json();
    console.log("Infobip response:", JSON.stringify(data, null, 2));

    if (!infobipRes.ok) {
      console.error("Infobip send failed:", data);
      return res.status(500).json({
        error: {
          http_code: 500,
          message: "Infobip SMS send failed",
        },
      });
    }

    // Supabase Send SMS Hook does not require a response body.
    return res.status(200).end();
  } catch (error) {
    console.error("Send SMS hook error:", error);
    return res.status(500).json({
      error: {
        http_code: 500,
        message: "Internal server error",
      },
    });
  }
}