"use client";

import { useEffect, useMemo, useState } from "react";
import { countries as ALL_COUNTRIES } from "@/app/countries";
import { apiGet, apiSend } from "@/components/admin/api";
import { useAdminLang } from "@/components/admin/AdminShell";
import { Btn, Card, EmptyState, PageHeader, useToast } from "@/components/admin/widgets";

type Row = { id: string; code: string; name: string; visible: boolean };

export default function PopularCountriesPage() {
  const { t } = useAdminLang();
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [picker, setPicker] = useState("");

  type PcRow = { id: string; code: string; name: string; visible: number };

  const applyRows = (list: PcRow[]) => {
    setRows(
      list.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        visible: !!c.visible,
      })),
    );
    setDirty(false);
  };

  const load = async () => {
    try {
      const d = await apiGet<{ countries: PcRow[] }>("/api/admin/popular-countries");
      applyRows(d.countries);
    } catch (e) {
      if ((e as Error).message !== "unauthorized")
        toast.push((e as Error).message, "err");
    }
  };

  useEffect(() => {
    apiGet<{ countries: PcRow[] }>("/api/admin/popular-countries")
      .then((d) => applyRows(d.countries))
      .catch((e) => {
        if ((e as Error).message !== "unauthorized")
          toast.push((e as Error).message, "err");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usedCodes = useMemo(() => new Set(rows.map((r) => r.code)), [rows]);
  const available = useMemo(
    () => ALL_COUNTRIES.filter((c) => !usedCodes.has(c.code)),
    [usedCodes],
  );

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
    setDirty(true);
  }
  function toggle(i: number) {
    setRows((r) => r.map((x, idx) => (idx === i ? { ...x, visible: !x.visible } : x)));
    setDirty(true);
  }
  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
    setDirty(true);
  }
  function add() {
    const c = ALL_COUNTRIES.find((x) => x.code === picker);
    if (!c) return;
    setRows((r) => [...r, { id: "", code: c.code, name: c.name, visible: true }]);
    setPicker("");
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    try {
      await apiSend("/api/admin/popular-countries", "PUT", {
        countries: rows.map((r, i) => ({
          id: r.id || undefined,
          code: r.code,
          name: r.name,
          sortOrder: i + 1,
          visible: r.visible,
        })),
      });
      toast.push(t("সেভ হয়েছে", "Saved"));
      await load();
    } catch (e) {
      toast.push((e as Error).message, "err");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title={t("জনপ্রিয় দেশ", "Popular Countries")}
        subtitle={t(
          "এই দেশগুলো হোম পেজের “জনপ্রিয় দেশসমূহ” সারিতে সবার প্রথমে দেখানো হবে। বাকি সব দেশ এর পরে স্বাভাবিক ক্রমে থাকবে।",
          "These countries lead the home page 'Popular Countries' strip. Every other country follows after them in the default order.",
        )}
        action={
          <Btn onClick={save} disabled={saving || !dirty}>
            {saving ? "..." : dirty ? t("সেভ করুন", "Save changes") : t("সেভড", "Saved")}
          </Btn>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={picker}
          onChange={(e) => setPicker(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">{t("দেশ যোগ করুন...", "Add a country...")}</option>
          {available.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <Btn variant="ghost" onClick={add} disabled={!picker}>
          + {t("যোগ", "Add")}
        </Btn>
      </div>

      <Card className="overflow-hidden">
        <div className="divide-y divide-gray-100">
          {rows.map((r, i) => (
            <div key={r.code} className="flex items-center gap-3 px-4 py-3">
              <span className="w-6 text-center text-xs font-bold text-gray-400">{i + 1}</span>
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-[11px] text-gray-400 hover:text-blue-600 disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === rows.length - 1}
                  className="text-[11px] text-gray-400 hover:text-blue-600 disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              <img
                src={`/flags/${r.code}.svg`}
                alt=""
                className="h-6 w-9 rounded border border-gray-200 object-cover"
              />
              <span className="flex-1 text-sm font-semibold text-gray-800">
                {r.name}
                <span className="ml-2 text-[11px] font-normal text-gray-400">{r.code}</span>
              </span>
              <button
                type="button"
                onClick={() => toggle(i)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  r.visible ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {r.visible ? t("দৃশ্যমান", "Visible") : t("লুকানো", "Hidden")}
              </button>
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {loading && <EmptyState text={t("লোড হচ্ছে...", "Loading...")} />}
        {!loading && rows.length === 0 && (
          <EmptyState text={t("তালিকা খালি", "List is empty")} />
        )}
      </Card>

      <p className="mt-3 text-xs text-gray-400">
        {t(
          "টিপ: এখানে যত খুশি দেশ যোগ করুন — এরা সারির শুরুতে থাকবে, বাকি সব দেশ (২৫০+) নিজে থেকেই এর পরে দেখাবে। “লুকানো” করলে সেই দেশ আর প্রথমে থাকবে না, তবে বাকিদের সাথে থেকে যাবে।",
          "Tip: add as many as you like — they sit at the start of the strip, and every other country (250+) shows automatically after them. Marking one “hidden” just un-pins it; it still appears with the rest.",
        )}
      </p>
    </>
  );
}
