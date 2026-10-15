"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/components/admin/api";
import { useAdminLang } from "@/components/admin/AdminShell";
import { Btn, Card, EmptyState, PageHeader, useToast } from "@/components/admin/widgets";

type Summary = {
  range: "24h" | "7d";
  totals: { pageViews: number; visitors: number; newVisitors: number; registered: number };
  buckets: { bucket: string; pageViews: number; visitors: number }[];
  topPages: { path: string; pageViews: number; visitors: number }[];
  countries: { name: string; visitors: number }[];
  devices: { name: string; visitors: number }[];
  browsers: { name: string; visitors: number }[];
  referrers: { name: string; visitors: number }[];
  visitors: {
    vid: string;
    userName: string | null;
    lastSeen: string;
    firstSeen: string;
    pages: number;
    country: string;
    city: string;
    device: string;
    browser: string;
    os: string;
    lastPath: string;
    isNew: number;
  }[];
};

function flag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function countryName(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return code || "?";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}

function timeAgo(iso: string, bn: boolean) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return bn ? "এইমাত্র" : "just now";
  if (m < 60) return bn ? `${m} মিনিট আগে` : `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return bn ? `${h} ঘণ্টা আগে` : `${h} h ago`;
  const d = Math.floor(h / 24);
  return bn ? `${d} দিন আগে` : `${d} d ago`;
}

export default function VisitorsPage() {
  const { t, isBn } = useAdminLang();
  const toast = useToast();

  const [range, setRange] = useState<"24h" | "7d">("24h");
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(r = range) {
    try {
      setData(await apiGet<Summary>(`/api/admin/visitors?range=${r}`));
    } catch (e) {
      if ((e as Error).message !== "unauthorized") toast.push((e as Error).message, "err");
    }
  }

  useEffect(() => {
    setLoading(true);
    load(range).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  // Fill the empty hours/days so the chart always shows the whole period.
  const chart = useMemo(() => {
    if (!data) return [];
    const byKey = new Map(data.buckets.map((b) => [b.bucket, b]));
    const out: { label: string; pageViews: number; visitors: number }[] = [];
    const now = new Date();
    if (data.range === "24h") {
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 3600_000);
        const key = d.toISOString().slice(0, 13);
        const b = byKey.get(key);
        out.push({
          label: `${String(d.getHours()).padStart(2, "0")}:00`,
          pageViews: b?.pageViews ?? 0,
          visitors: b?.visitors ?? 0,
        });
      }
    } else {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400_000);
        const key = d.toISOString().slice(0, 10);
        const b = byKey.get(key);
        out.push({
          label: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
          pageViews: b?.pageViews ?? 0,
          visitors: b?.visitors ?? 0,
        });
      }
    }
    return out;
  }, [data]);

  const maxPv = Math.max(1, ...chart.map((c) => c.pageViews));
  const totals = data?.totals;
  const returning = totals ? Math.max(0, totals.visitors - totals.newVisitors) : 0;

  return (
    <>
      <PageHeader
        title={t("ভিজিটর", "Visitors")}
        subtitle={t(
          "সাইটে কারা এল, কোথা থেকে, কোন ডিভাইসে, কী দেখল। বট ও আপনাদের নিজেদের অ্যাডমিন-ভিজিট গোনা হয় না। কাঁচা IP জমা রাখা হয় না।",
          "Who visited, from where, on what device, and what they viewed. Bots and your own admin visits are not counted. Raw IP addresses are not stored.",
        )}
        action={
          <div className="flex gap-2">
            {(["24h", "7d"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  range === r ? "bg-[#0B4DBB] text-white" : "border border-gray-200 bg-white text-gray-600"
                }`}
              >
                {r === "24h" ? t("গত ২৪ ঘণ্টা", "Last 24 hours") : t("গত ৭ দিন", "Last 7 days")}
              </button>
            ))}
            <Btn variant="ghost" onClick={() => load()}>
              ↻
            </Btn>
          </div>
        }
      />

      {loading && !data ? (
        <EmptyState text={t("লোড হচ্ছে...", "Loading...")} />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Stat label={t("ভিজিটর", "Visitors")} value={totals?.visitors} />
            <Stat label={t("পেজ ভিউ", "Page views")} value={totals?.pageViews} />
            <Stat label={t("নতুন", "New")} value={totals?.newVisitors} />
            <Stat label={t("আগে এসেছে", "Returning")} value={totals ? returning : undefined} />
            <Stat label={t("রেজিস্টার্ড ইউজার", "Registered users")} value={totals?.registered} />
          </div>

          <Card className="mb-5 p-5">
            <h3 className="mb-4 text-sm font-extrabold text-[#0B2A55]">
              {data?.range === "7d" ? t("দিন অনুযায়ী", "By day") : t("ঘণ্টা অনুযায়ী পেজ ভিউ", "Page views by hour")}
            </h3>
            <div className="flex h-36 items-end gap-1">
              {chart.map((c, i) => (
                <div key={i} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t bg-[#0B4DBB]/80 transition group-hover:bg-[#0B4DBB]"
                    style={{ height: `${Math.max(c.pageViews ? 4 : 1, (c.pageViews / maxPv) * 100)}%` }}
                  />
                  <span className="pointer-events-none absolute -top-9 z-10 hidden whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-[10px] text-white group-hover:block">
                    {c.label}: {c.pageViews} {t("ভিউ", "views")}, {c.visitors} {t("জন", "visitors")}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-1 flex gap-1 text-[9px] text-gray-400">
              {chart.map((c, i) => (
                <span key={i} className="flex-1 text-center">
                  {chart.length > 12 && i % 3 !== 0 ? "" : c.label}
                </span>
              ))}
            </div>
          </Card>

          <div className="mb-5 grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-extrabold text-[#0B2A55]">{t("জনপ্রিয় পাতা", "Top pages")}</h3>
              <Bars
                rows={(data?.topPages ?? []).map((p) => ({ name: p.path, value: p.pageViews, note: `${p.visitors}` }))}
                empty={t("এখনো কোনো ডাটা নেই", "No data yet")}
              />
            </Card>
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-extrabold text-[#0B2A55]">{t("দেশ", "Countries")}</h3>
              <Bars
                rows={(data?.countries ?? []).map((c) => ({
                  name: `${flag(c.name)} ${countryName(c.name)}`,
                  value: c.visitors,
                }))}
                empty={t("এখনো কোনো ডাটা নেই", "No data yet")}
              />
            </Card>
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-extrabold text-[#0B2A55]">{t("ডিভাইস ও ব্রাউজার", "Devices & browsers")}</h3>
              <Bars
                rows={[
                  ...(data?.devices ?? []).map((d) => ({
                    name: `${d.name === "mobile" ? "📱" : d.name === "tablet" ? "📲" : "💻"} ${d.name}`,
                    value: d.visitors,
                  })),
                  ...(data?.browsers ?? []).map((b) => ({ name: `🌐 ${b.name}`, value: b.visitors })),
                ]}
                empty={t("এখনো কোনো ডাটা নেই", "No data yet")}
              />
            </Card>
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-extrabold text-[#0B2A55]">{t("কোথা থেকে এল", "Where they came from")}</h3>
              <Bars
                rows={(data?.referrers ?? []).map((r) => ({
                  name: r.name === "direct" ? t("সরাসরি / অজানা", "Direct / unknown") : r.name,
                  value: r.visitors,
                }))}
                empty={t("এখনো কোনো ডাটা নেই", "No data yet")}
              />
            </Card>
          </div>

          <Card className="overflow-hidden">
            <h3 className="border-b border-gray-100 px-5 py-4 text-sm font-extrabold text-[#0B2A55]">
              {t("ভিজিটরদের তালিকা (সর্বশেষ আগে)", "Visitor list (latest first)")}
            </h3>
            {!data || data.visitors.length === 0 ? (
              <EmptyState text={t("এই সময়ে কোনো ভিজিটর নেই", "No visitors in this period")} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="px-5 py-3">{t("কে", "Who")}</th>
                      <th className="px-5 py-3">{t("কোথা থেকে", "From")}</th>
                      <th className="px-5 py-3">{t("ডিভাইস", "Device")}</th>
                      <th className="px-5 py-3">{t("পাতা", "Pages")}</th>
                      <th className="px-5 py-3">{t("শেষ পাতা", "Last page")}</th>
                      <th className="px-5 py-3">{t("শেষ দেখা", "Last seen")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.visitors.map((v) => (
                      <tr key={v.vid}>
                        <td className="px-5 py-3">
                          {v.userName ? (
                            <span className="font-semibold text-[#0B2A55]">👤 {v.userName}</span>
                          ) : (
                            <span className="font-mono text-xs text-gray-500">#{v.vid.slice(2, 8)}</span>
                          )}
                          {v.isNew ? (
                            <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                              {t("নতুন", "new")}
                            </span>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-xs">
                          {flag(v.country)} {v.city ? `${v.city}, ` : ""}
                          {countryName(v.country)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-600">
                          {v.device === "mobile" ? "📱" : v.device === "tablet" ? "📲" : "💻"} {v.browser} · {v.os}
                        </td>
                        <td className="px-5 py-3 text-xs">{v.pages}</td>
                        <td className="max-w-[200px] truncate px-5 py-3 font-mono text-xs text-gray-600">{v.lastPath}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-500">
                          {timeAgo(v.lastSeen, isBn)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-[#0B2A55]">{value ?? "—"}</p>
    </div>
  );
}

function Bars({ rows, empty }: { rows: { name: string; value: number; note?: string }[]; empty: string }) {
  if (rows.length === 0) return <p className="text-xs text-gray-400">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2">
      {rows.map((r, i) => (
        <li key={`${r.name}-${i}`}>
          <div className="mb-0.5 flex items-center justify-between gap-3 text-xs">
            <span className="min-w-0 truncate font-semibold text-gray-700">{r.name}</span>
            <span className="shrink-0 text-gray-500">{r.value}</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100">
            <div className="h-1.5 rounded-full bg-[#0B4DBB]" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
