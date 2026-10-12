"use client";

import { useEffect, useMemo, useState } from "react";
import { countries } from "@/app/countries";
import { apiGet, apiSend } from "@/components/admin/api";
import { useAdminLang } from "@/components/admin/AdminShell";
import {
  Btn,
  Card,
  PageHeader,
  TextInput,
  useToast,
} from "@/components/admin/widgets";
import {
  countryNameBnAuto,
  flagEmoji,
  setCountryNameOverrides,
} from "@/lib/country-names";

/* Bangla country names are filled in automatically. Here the admin can type
   a different Bangla name for any country; it is used on the whole site. */

export default function CountryNamesPage() {
  const { t } = useAdminLang();
  const toast = useToast();
  const [names, setNames] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [q, setQ] = useState("");
  const [onlyCustom, setOnlyCustom] = useState(false);

  useEffect(() => {
    apiGet<{ names: Record<string, string> }>("/api/admin/country-names")
      .then((d) => {
        setNames(d.names);
        setCountryNameOverrides(d.names);
      })
      .catch((e) => {
        if ((e as Error).message !== "unauthorized")
          toast.push((e as Error).message, "err");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return countries
      .filter((c) => {
        if (onlyCustom && !names[c.code]) return false;
        if (!needle) return true;
        return (
          c.name.toLowerCase().includes(needle) ||
          countryNameBnAuto(c).toLowerCase().includes(needle) ||
          (names[c.code] || "").toLowerCase().includes(needle) ||
          c.code === needle
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [q, onlyCustom, names]);

  async function save(code: string, value: string) {
    setBusy(code);
    try {
      const d = await apiSend<{ names: Record<string, string> }>(
        "/api/admin/country-names",
        "PUT",
        { code, nameBn: value },
      );
      setNames(d.names);
      setCountryNameOverrides(d.names);
      setDrafts((cur) => {
        const next = { ...cur };
        delete next[code];
        return next;
      });
      toast.push(value.trim() ? t("সেভ হয়েছে", "Saved") : t("অটো নামে ফিরেছে", "Reset to automatic"));
    } catch (e) {
      toast.push((e as Error).message, "err");
    } finally {
      setBusy("");
    }
  }

  return (
    <>
      <PageHeader
        title={t("দেশের বাংলা নাম", "Country Bangla names")}
        subtitle={t(
          "বাংলা নাম নিজে থেকেই বসে যায়। কোনো দেশের নাম অন্যভাবে লিখতে চাইলে এখানে বদলান — পুরো সাইটে সেটাই দেখাবে।",
          "Bangla names are filled in automatically. Type a different one here to change how a country is shown across the whole site.",
        )}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <TextInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("দেশ খুঁজুন…", "Search a country…")}
          className="max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={onlyCustom}
            onChange={(e) => setOnlyCustom(e.target.checked)}
          />
          {t("শুধু কাস্টম নাম", "Customised only")}
        </label>
        <span className="text-xs text-gray-400">
          {Object.keys(names).length} {t("টি কাস্টম", "customised")}
        </span>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-gray-400">...</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">—</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {rows.map((c) => {
              const saved = names[c.code] || "";
              const value = drafts[c.code] ?? saved;
              const changed = value.trim() !== saved;
              return (
                <div
                  key={c.code}
                  className="flex flex-wrap items-center gap-3 px-4 py-3"
                >
                  <span className="w-8 text-xl">{flagEmoji(c.code)}</span>
                  <div className="w-44 min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {c.name}
                    </div>
                    <div className="truncate text-xs text-gray-400">
                      {t("অটো", "Auto")}: {countryNameBnAuto(c)}
                    </div>
                  </div>
                  <TextInput
                    value={value}
                    onChange={(e) =>
                      setDrafts((cur) => ({ ...cur, [c.code]: e.target.value }))
                    }
                    placeholder={countryNameBnAuto(c)}
                    className="min-w-[180px] flex-1"
                  />
                  <Btn
                    onClick={() => save(c.code, value)}
                    disabled={!changed || busy === c.code}
                  >
                    {t("সেভ", "Save")}
                  </Btn>
                  {saved && (
                    <Btn
                      variant="ghost"
                      onClick={() => save(c.code, "")}
                      disabled={busy === c.code}
                    >
                      {t("অটো নামে ফেরান", "Reset")}
                    </Btn>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
