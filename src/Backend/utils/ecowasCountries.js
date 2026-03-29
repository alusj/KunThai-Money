export const ecowasCountries = [
  {
    name: "Sierra Leone",
    flag: "SL",
    code: "+232",
    format: "00 000 000",
    currency: "SLE",
    nationalNumberRegex: /^\d{8}$/,
    readiness: "frontend-ready",
  },
  {
    name: "Nigeria",
    flag: "NG",
    code: "+234",
    format: "000 000 0000",
    currency: "NGN",
    nationalNumberRegex: /^\d{10}$/,
    readiness: "frontend-ready",
  },
  {
    name: "Ghana",
    flag: "GH",
    code: "+233",
    format: "00 000 0000",
    currency: "GHS",
    nationalNumberRegex: /^\d{9}$/,
    readiness: "frontend-ready",
  },
  {
    name: "Liberia",
    flag: "LR",
    code: "+231",
    format: "00 000 000",
    currency: "LRD",
    nationalNumberRegex: /^\d{8}$/,
    readiness: "frontend-ready",
  },
  {
    name: "Guinea",
    flag: "GN",
    code: "+224",
    format: "000 00 00 00",
    currency: "GNF",
    nationalNumberRegex: /^\d{9}$/,
    readiness: "frontend-ready",
  },
  {
    name: "Ivory Coast",
    flag: "CI",
    code: "+225",
    format: "00 00 00 00 00",
    currency: "XOF",
    nationalNumberRegex: /^\d{10}$/,
    readiness: "frontend-ready",
  },
  {
    name: "Senegal",
    flag: "SN",
    code: "+221",
    format: "00 000 00 00",
    currency: "XOF",
    nationalNumberRegex: /^\d{9}$/,
    readiness: "frontend-ready",
  },
  {
    name: "Gambia",
    flag: "GM",
    code: "+220",
    format: "000 0000",
    currency: "GMD",
    nationalNumberRegex: /^\d{7}$/,
    readiness: "frontend-ready",
  },
  {
    name: "Benin",
    flag: "BJ",
    code: "+229",
    format: "00 00 00 00",
    currency: "XOF",
    nationalNumberRegex: /^\d{8}$/,
    readiness: "frontend-ready",
  },
  {
    name: "Togo",
    flag: "TG",
    code: "+228",
    format: "00 00 00 00",
    currency: "XOF",
    nationalNumberRegex: /^\d{8}$/,
    readiness: "frontend-ready",
  },
  {
    name: "Mali",
    flag: "ML",
    code: "+223",
    format: "00 00 00 00",
    currency: "XOF",
    nationalNumberRegex: /^\d{8}$/,
    readiness: "frontend-ready",
  },
  {
    name: "Burkina Faso",
    flag: "BF",
    code: "+226",
    format: "00 00 00 00",
    currency: "XOF",
    nationalNumberRegex: /^\d{8}$/,
    readiness: "frontend-ready",
  },
  {
    name: "Niger",
    flag: "NE",
    code: "+227",
    format: "00 00 00 00",
    currency: "XOF",
    nationalNumberRegex: /^\d{8}$/,
    readiness: "frontend-ready",
  },
  {
    name: "Guinea-Bissau",
    flag: "GW",
    code: "+245",
    format: "000 000 000",
    currency: "XOF",
    nationalNumberRegex: /^\d{9}$/,
    readiness: "frontend-ready",
  },
  {
    name: "Cape Verde",
    flag: "CV",
    code: "+238",
    format: "000 00 00",
    currency: "CVE",
    nationalNumberRegex: /^\d{7}$/,
    readiness: "frontend-ready",
  },
];

export function formatPhoneInput(value, format) {
  const digits = value.replace(/\D/g, "");
  let result = "";
  let digitIndex = 0;

  for (let index = 0; index < format.length; index += 1) {
    if (format[index] === " ") {
      if (digits[digitIndex]) {
        result += " ";
      }
    } else if (digits[digitIndex]) {
      result += digits[digitIndex];
      digitIndex += 1;
    }
  }

  return result;
}

export function getExpectedDigits(country) {
  return country.format.replace(/\s/g, "").length;
}

export function validateNationalPhone(country, rawValue) {
  const digits = rawValue.replace(/\D/g, "");

  if (!digits) {
    return { valid: false, reason: "Enter your phone number" };
  }

  if (!country.nationalNumberRegex.test(digits)) {
    return {
      valid: false,
      reason: `Enter a valid ${country.name} mobile number using the shown format.`,
    };
  }

  return { valid: true, digits };
}

export function buildInternationalPhone(country, rawValue) {
  return `${country.code}${rawValue.replace(/\D/g, "")}`;
}

export function getCountryByCode(code) {
  return ecowasCountries.find((country) => country.code === code) ?? null;
}
