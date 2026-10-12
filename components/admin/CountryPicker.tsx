"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { countries, type Country } from "@/app/countries";
import {
  countryNameBn,
  flagEmoji,
  loadCountryNameOverrides,
  resolveCountry,
} from "@/lib/country-names";

/* Searchable country dropdown for the admin forms. Type any letters (English
   or Bangla) and the matching countries appear; picking one fills the
   country name, code and flag so they can never be typed inconsistently. */

export type PickedCountry = {
  country: string;
  countryCode: string;
  flag: string;
};

export default function CountryPicker({
  label,
  value,
  code,
  placeholder,
  legacyHint,
  onPick,
}: {
  label: string;
  value: string;
  code: string;
  placeholder: string;
  legacyHint: string;
  onPick: (picked: PickedCountry) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const [, setNamesVersion] = useState(0);

  useEffect(() => {
    loadCountryNameOverrides().then((ok) => ok && setNamesVersion((v) => v + 1));
  }, []);

  // The country the saved value stands for (also understands old typed text).
  const current = useMemo(() => resolveCountry(value, code), [value, code]);
  const isLegacy = !!value.trim() && !current;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    const starts: Country[] = [];
    const rest: Country[] = [];
    for (const c of countries) {
      const en = c.name.toLowerCase();
      const bn = countryNameBn(c).toLowerCase();
      if (en.startsWith(q) || bn.startsWith(q)) starts.push(c);
      else if (en.includes(q) || bn.includes(q) || c.code === q) rest.push(c);
    }
    return [...starts, ...rest];
  }, [query]);

  const pick = (c: Country) => {
    onPick({
      country: c.name,
      countryCode: c.code,
      flag: flagEmoji(c.code),
    });
    setQuery("");
    setOpen(false);
  };

  const shown = open
    ? query
    : current
      ? `${flagEmoji(current.code)} ${current.name} · ${countryNameBn(current)}`
      : value;

  return (
    <div className="mb-3.5" ref={boxRef}>
      <span className="mb-1.5 block text-xs font-bold text-gray-600">
        {label}
      </span>

      <div className="relative">
        <input
          value={shown}
          placeholder={placeholder}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (matches[0]) pick(matches[0]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          autoComplete="off"
        />

        {open && (
          <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
            {matches.length === 0 && (
              <li className="px-3.5 py-2 text-sm text-gray-400">—</li>
            )}

            {matches.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(c)}
                  className={`flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm hover:bg-blue-50 ${
                    current?.code === c.code ? "bg-blue-50 font-semibold" : ""
                  }`}
                >
                  <span className="text-lg">{flagEmoji(c.code)}</span>
                  <span>{c.name}</span>
                  <span className="text-gray-400">· {countryNameBn(c)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isLegacy && (
        <span className="mt-1 block text-[11px] text-amber-600">
          {legacyHint}
        </span>
      )}
    </div>
  );
}
