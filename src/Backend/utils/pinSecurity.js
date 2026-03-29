const encoder = new TextEncoder();
const PIN_HASH_ITERATIONS = 150000;

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPin(pin, userId, phone = "") {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("Secure PIN hashing is not available in this browser.");
  }

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(`${userId}:${phone}:kuntai-pin`),
      iterations: PIN_HASH_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return toHex(derivedBits);
}
