export default async function handler(req, res) {
  try {
    const body = req.body || {};
    console.log("HOOK BODY:", body);

    const phone =
      body?.user?.phone ||
      body?.phone ||
      "";

    const otp =
      body?.sms?.otp ||
      body?.otp ||
      "";

    const message =
      body?.sms?.message ||
      `Your KunThai verification code is ${otp}`;

    if (!phone || !message) {
      return res.status(400).json({
        error: "Missing phone or message",
      });
    }

    const infobipRes = await fetch(
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
              from: "InfoSMS",
              destinations: [{ to: phone }],
              text: message,
            },
          ],
        }),
      }
    );

    const data = await infobipRes.json();
    console.log("INFOBIP RESPONSE:", data);

    if (!infobipRes.ok) {
      return res.status(500).json({ error: data });
    }

    return res.status(200).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}