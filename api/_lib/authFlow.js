import crypto from "node:crypto";

import { createServiceClient } from "./supabaseServer.js";

const DEFAULT_TICKET_TTL_SECONDS = 10 * 60;

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }

  return value;
}

function toBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4 || 4)) % 4;
  return Buffer.from(`${normalized}${"=".repeat(padLength)}`, "base64").toString("utf8");
}

function getTicketSecret() {
  return requireEnv("AUTH_FLOW_SECRET");
}

export function createVerificationTicket({ phone, intent, ttlSeconds = DEFAULT_TICKET_TTL_SECONDS } = {}) {
  const payload = {
    phone,
    intent,
    exp: Date.now() + ttlSeconds * 1000,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", getTicketSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifyVerificationTicket(ticket, expectedIntent, expectedPhone) {
  if (!ticket || typeof ticket !== "string" || !ticket.includes(".")) {
    throw new Error("Verification session is missing. Request a new code and try again.");
  }

  const [encodedPayload, providedSignature] = ticket.split(".");
  const expectedSignature = crypto
    .createHmac("sha256", getTicketSecret())
    .update(encodedPayload)
    .digest("base64url");

  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error("Verification session is invalid. Request a new code and try again.");
  }

  const payload = JSON.parse(fromBase64Url(encodedPayload));

  if (!payload?.phone || !payload?.intent || !payload?.exp) {
    throw new Error("Verification session is incomplete. Request a new code and try again.");
  }

  if (payload.exp < Date.now()) {
    throw new Error("Verification session expired. Request a new code and try again.");
  }

  if (expectedIntent && payload.intent !== expectedIntent) {
    throw new Error("Verification session does not match this action.");
  }

  if (expectedPhone && payload.phone !== expectedPhone) {
    throw new Error("Verification session does not match this phone number.");
  }

  return payload;
}

function getTwilioAuthHeader() {
  const accountSid = requireEnv("TWILIO_ACCOUNT_SID");
  const authToken = requireEnv("TWILIO_AUTH_TOKEN");
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

function getVerifyServiceSid() {
  return requireEnv("TWILIO_VERIFY_SERVICE_SID");
}

async function readTwilioResponse(response) {
  const rawText = await response.text();

  try {
    return rawText ? JSON.parse(rawText) : {};
  } catch {
    return { message: rawText };
  }
}

function extractTwilioErrorMessage(payload, fallback) {
  return (
    payload?.message ||
    payload?.detail ||
    payload?.details ||
    payload?.error ||
    fallback
  );
}

export async function startTwilioVerification({ phone, channel = "sms" } = {}) {
  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${getVerifyServiceSid()}/Verifications`,
    {
      method: "POST",
      headers: {
        Authorization: getTwilioAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phone,
        Channel: channel,
      }),
    }
  );

  const payload = await readTwilioResponse(response);

  if (!response.ok) {
    throw new Error(extractTwilioErrorMessage(payload, "Unable to send verification code."));
  }

  return payload;
}

export async function checkTwilioVerification({ phone, code } = {}) {
  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${getVerifyServiceSid()}/VerificationCheck`,
    {
      method: "POST",
      headers: {
        Authorization: getTwilioAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phone,
        Code: code,
      }),
    }
  );

  const payload = await readTwilioResponse(response);

  if (!response.ok) {
    throw new Error(extractTwilioErrorMessage(payload, "Verification could not be completed."));
  }

  if (payload?.status !== "approved" || !payload?.valid) {
    throw new Error("Invalid or expired verification code.");
  }

  return payload;
}

export async function findUserByPhone(phone) {
  const supabase = createServiceClient();
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const users = data?.users || [];
    const matchedUser = users.find((user) => user.phone === phone);

    if (matchedUser) {
      return matchedUser;
    }

    if (users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

export function normalizeApiError(error, fallbackMessage) {
  return {
    error: error instanceof Error ? error.message : fallbackMessage,
  };
}
