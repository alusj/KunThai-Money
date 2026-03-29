import { ecowasCountries } from "./ecowasCountries";

export const countryMap = Object.fromEntries(
  ecowasCountries.map((country) => [
    country.code,
    { country: country.name, currency: country.currency },
  ])
);
