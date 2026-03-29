export const MAIN_ACCOUNT_SYSTEM_CODE = "543";

export const ACCOUNT_NUMBER_LENGTHS = {
  main: 8,
  foreign: 9,
  other: 8,
};

function normalizeCountryCode(countryCode = "") {
  return countryCode.replace("+", "").trim();
}

export function padAccountSequence(sequenceNumber, length) {
  return String(sequenceNumber).padStart(length, "0");
}

export function generateMainAccountNumber(countryCode, lastNumber = 0) {
  const cleanCode = normalizeCountryCode(countryCode);
  const nextSequence = padAccountSequence(lastNumber + 1, ACCOUNT_NUMBER_LENGTHS.main);
  return `${cleanCode}${MAIN_ACCOUNT_SYSTEM_CODE}${nextSequence}`;
}

export function generateOtherAccountNumber(countryCode, lastNumber = 0) {
  const cleanCode = normalizeCountryCode(countryCode);
  const nextSequence = padAccountSequence(lastNumber + 1, ACCOUNT_NUMBER_LENGTHS.other);
  return `${cleanCode}${nextSequence}`;
}

export function generateForeignAccountNumber(countryCode, lastNumber = 0) {
  const cleanCode = normalizeCountryCode(countryCode);
  const nextSequence = padAccountSequence(lastNumber + 1, ACCOUNT_NUMBER_LENGTHS.foreign);
  return `${cleanCode}${nextSequence}`;
}

export function generateAccountNumber(countryCode, lastNumber = 0) {
  return generateMainAccountNumber(countryCode, lastNumber);
}
