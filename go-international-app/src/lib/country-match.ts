import { countries } from './countries';

const byName = new Map(countries.map((c) => [c.name.toLowerCase(), c.code]));

/**
 * Circulars/applications store `country` as free text typed by an admin
 * (e.g. "Saudi Arabia"), not a code, and `countryCode`/`flag` are often left
 * blank. This resolves a real flag from that free text where possible
 * instead of showing nothing or a random placeholder emoji.
 */
export function guessCountryCode(countryName: string | null | undefined): string | undefined {
  if (!countryName) return undefined;
  const direct = byName.get(countryName.trim().toLowerCase());
  if (direct) return direct;

  // Loose contains-match for slightly-off admin input (e.g. "UAE - Dubai").
  const needle = countryName.trim().toLowerCase();
  const partial = countries.find((c) => needle.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(needle));
  return partial?.code;
}
