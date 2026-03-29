export function maskPhoneNumber(phone = "") {
  if (!phone) {
    return "";
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.length <= 4) {
    return phone;
  }

  const visibleStart = digits.slice(0, 3);
  const visibleEnd = digits.slice(-2);
  const hiddenLength = Math.max(digits.length - 5, 0);

  return `+${visibleStart}${" *".repeat(hiddenLength)} ${visibleEnd}`.trim();
}
