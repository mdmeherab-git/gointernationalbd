import { countries, type Country } from "@/app/countries";

/* Shared country helpers (client-safe).
   - English names + codes come from app/countries.ts (the same list the
     Popular Countries section uses).
   - Bangla names come from the browser/Node ICU data, so no hand-typed
     translation table is needed.
   - resolveCountry() recognises the loose text admins typed into the old
     free-text "Country" field ("সৌদি নিয়োগ বিজ্ঞপ্তি", "Qatar নিয়োগ…")
     so the Jobs page can group those circulars under one country. */

const bnNames = new Map<string, string>();
let bnDisplay: Intl.DisplayNames | null | undefined;

function getBnDisplay(): Intl.DisplayNames | null {
  if (bnDisplay !== undefined) return bnDisplay;
  try {
    bnDisplay = new Intl.DisplayNames(["bn"], { type: "region" });
  } catch {
    bnDisplay = null;
  }
  return bnDisplay;
}

/* Bangla names customised by the admin (/admin/country-names). They win over
   the automatic ICU name. Loaded from /api/country-names. */
let bnOverrides: Record<string, string> = {};

export function setCountryNameOverrides(map: Record<string, string>) {
  bnOverrides = {};
  for (const [code, name] of Object.entries(map || {})) {
    if (name && name.trim()) bnOverrides[code.toLowerCase()] = name.trim();
  }
  terms = null;
}

/** Fetch the admin's custom Bangla names (silently ignores failures). */
export async function loadCountryNameOverrides(): Promise<boolean> {
  try {
    const res = await fetch("/api/country-names", { cache: "no-store" });
    if (!res.ok) return false;
    const d = (await res.json()) as { names?: Record<string, string> };
    setCountryNameOverrides(d.names ?? {});
    return true;
  } catch {
    return false;
  }
}

/** The automatic (ICU) Bangla name, ignoring any admin customisation. */
export function countryNameBnAuto(country: Country): string {
  const cached = bnNames.get(country.code);
  if (cached) return cached;
  let name = country.name;
  try {
    const v = getBnDisplay()?.of(country.code.toUpperCase());
    if (v && v !== country.code.toUpperCase()) name = v;
  } catch {
    /* keep English */
  }
  bnNames.set(country.code, name);
  return name;
}

/** Bangla name of a country: admin's custom name, else automatic. */
export function countryNameBn(country: Country): string {
  return bnOverrides[country.code.toLowerCase()] || countryNameBnAuto(country);
}

export function countryName(country: Country, bangla: boolean): string {
  return bangla ? countryNameBn(country) : country.name;
}

export function flagEmoji(code: string): string {
  const c = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return "";
  return String.fromCodePoint(
    ...[...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65),
  );
}

const byCode = new Map(countries.map((c) => [c.code.toLowerCase(), c]));
const byName = new Map(countries.map((c) => [c.name.toLowerCase(), c]));

export function findCountryByCode(code: string): Country | undefined {
  return byCode.get(code.trim().toLowerCase());
}

export function findCountryByName(name: string): Country | undefined {
  return byName.get(name.trim().toLowerCase());
}

/* Common spellings / city names used in circular titles. */
const ALIASES: Record<string, string[]> = {
  sa: ["সৌদি", "saudi", "ksa"],
  ae: ["দুবাই", "dubai", "আবুধাবি", "abu dhabi", "আমিরাত", "emirates"],
  my: ["malaysia", "মালয়েশিয়া", "মালেশিয়া"],
  qa: ["কাতার", "qatar"],
  om: ["ওমান", "oman"],
  kw: ["কুয়েত", "kuwait"],
  bh: ["বাহরাইন", "bahrain"],
  vn: ["ভিয়েতনাম", "vietnam", "viet nam"],
  rs: ["সার্বিয়া", "serbia"],
  mu: ["মরিশাস", "মরিসাস", "mauritius"],
  md: ["মালদোভা", "মোলদোভা", "মলদোভা", "maldova", "moldova"],
  ro: ["রোমানিয়া", "romania"],
  pl: ["পোল্যান্ড", "poland"],
  hr: ["ক্রোয়েশিয়া", "croatia"],
  sg: ["সিঙ্গাপুর", "singapore"],
  jo: ["জর্ডান", "jordan"],
  mv: ["মালদ্বীপ", "মালদ্বিপ", "maldives"],
  lb: ["লেবানন", "lebanon"],
  gb: ["যুক্তরাজ্য", "ইউকে", "uk", "britain", "england"],
  us: ["যুক্তরাষ্ট্র", "আমেরিকা", "usa", "america"],
};

type Term = { text: string; ascii: boolean; country: Country };
let terms: Term[] | null = null;

function getTerms(): Term[] {
  if (terms) return terms;
  const out: Term[] = [];
  const add = (text: string, country: Country) => {
    const t = text.trim().toLowerCase();
    if (t.length < 2) return;
    out.push({ text: t, ascii: /^[\x00-\x7f]+$/.test(t), country });
  };
  for (const c of countries) {
    add(c.name, c);
    add(countryNameBnAuto(c), c);
    const custom = bnOverrides[c.code.toLowerCase()];
    if (custom) add(custom, c);
    for (const a of ALIASES[c.code.toLowerCase()] ?? []) add(a, c);
  }
  // Longest term first so "south africa" wins over "africa", etc.
  out.sort((a, b) => b.text.length - a.text.length);
  terms = out;
  return out;
}

function containsWord(text: string, term: string): boolean {
  let from = 0;
  for (;;) {
    const i = text.indexOf(term, from);
    if (i < 0) return false;
    const before = i === 0 ? "" : text[i - 1];
    const after = text[i + term.length] ?? "";
    if (!/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after)) return true;
    from = i + 1;
  }
}

/** Work out which country a circular belongs to. */
export function resolveCountry(
  text: string,
  code?: string | null,
): Country | null {
  if (code) {
    const byC = findCountryByCode(code);
    if (byC) return byC;
  }
  const raw = (text || "").trim();
  if (!raw) return null;

  const exact = findCountryByName(raw);
  if (exact) return exact;

  const lower = raw.toLowerCase();
  for (const t of getTerms()) {
    if (t.ascii ? containsWord(lower, t.text) : lower.includes(t.text)) {
      return t.country;
    }
  }
  return null;
}
