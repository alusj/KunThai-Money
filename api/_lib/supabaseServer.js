import { createClient } from "@supabase/supabase-js";

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }

  return value;
}

export function getSupabaseEnv() {
  return {
    url: requireEnv("SUPABASE_URL"),
    anonKey: requireEnv("SUPABASE_ANON_KEY"),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function createAnonClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createClient(url, anonKey);
}

export function createServiceClient() {
  const { url, serviceRoleKey } = getSupabaseEnv();
  return createClient(url, serviceRoleKey);
}

export async function requireAuthorizedUser(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: {
        status: 401,
        body: { error: "Missing authorization bearer token." },
      },
    };
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    return {
      error: {
        status: 401,
        body: { error: "Authorization token is empty." },
      },
    };
  }

  const anonClient = createAnonClient();
  const {
    data: { user },
    error,
  } = await anonClient.auth.getUser(token);

  if (error || !user) {
    return {
      error: {
        status: 401,
        body: {
          error: "Invalid JWT",
          details: error?.message || "Unable to resolve signed-in user.",
        },
      },
    };
  }

  return { user, token };
}
