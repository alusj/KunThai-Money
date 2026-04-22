const STORAGE_PREFIX = "kuntai-biometric";

function toBase64Url(bytes) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4 || 4)) % 4)}`;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function randomChallenge(length = 32) {
  const challenge = new Uint8Array(length);
  window.crypto.getRandomValues(challenge);
  return challenge;
}

function encoder() {
  return new TextEncoder();
}

function getStorageKey(userId) {
  return `${STORAGE_PREFIX}:${userId}`;
}

function getStoredBiometricConfig(userId) {
  if (!userId) {
    return null;
  }

  const rawValue = window.localStorage.getItem(getStorageKey(userId));

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    window.localStorage.removeItem(getStorageKey(userId));
    return null;
  }
}

function setStoredBiometricConfig(userId, config) {
  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(config));
}

export function clearStoredBiometrics(userId) {
  if (!userId) {
    return;
  }

  window.localStorage.removeItem(getStorageKey(userId));
}

export async function canUseBiometrics() {
  if (typeof window === "undefined" || !window.PublicKeyCredential || !navigator.credentials?.create) {
    return false;
  }

  if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== "function") {
    return false;
  }

  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function getBiometricStatus(userId) {
  const config = getStoredBiometricConfig(userId);

  return {
    enabled: Boolean(config?.enabled && config?.credentialId),
    enabledAt: config?.enabledAt || null,
  };
}

export async function registerBiometrics({ userId, displayName, phone }) {
  if (!userId) {
    throw new Error("User account not available for biometric setup.");
  }

  const supported = await canUseBiometrics();

  if (!supported) {
    throw new Error("Biometrics are not available on this device or browser.");
  }

  const challenge = randomChallenge();
  const userHandle = encoder().encode(userId);
  const credential = await navigator.credentials.create({
    publicKey: {
      rp: {
    name: "KunTai Money",
        id: window.location.hostname,
      },
      challenge,
      user: {
        id: userHandle,
        name: phone || userId,
    displayName: displayName || "KunTai Money user",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      timeout: 60_000,
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "preferred",
        userVerification: "required",
      },
      attestation: "none",
    },
  });

  if (!credential?.rawId) {
    throw new Error("Biometric credential setup did not complete.");
  }

  setStoredBiometricConfig(userId, {
    enabled: true,
    credentialId: toBase64Url(new Uint8Array(credential.rawId)),
    enabledAt: new Date().toISOString(),
    phone: phone || "",
  });

  return getBiometricStatus(userId);
}

export async function verifyBiometrics(userId) {
  const config = getStoredBiometricConfig(userId);

  if (!config?.enabled || !config?.credentialId) {
    throw new Error("Biometrics are not enabled on this device yet.");
  }

  const supported = await canUseBiometrics();

  if (!supported || !navigator.credentials?.get) {
    throw new Error("Biometric verification is not available on this device or browser.");
  }

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: randomChallenge(),
      allowCredentials: [
        {
          id: fromBase64Url(config.credentialId),
          type: "public-key",
        },
      ],
      userVerification: "required",
      timeout: 60_000,
    },
  });

  if (!assertion) {
    throw new Error("Biometric verification was not completed.");
  }

  return true;
}
