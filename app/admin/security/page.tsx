"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/components/admin/api";
import { useAdminLang } from "@/components/admin/AdminShell";
import {
  Btn,
  Card,
  EmptyState,
  PageHeader,
  useToast,
} from "@/components/admin/widgets";

type EventType =
  | "login_failed"
  | "login_success"
  | "lockout"
  | "blocked"
  | "user_password_reset"
  | "staff_change"
  | "backup";

type SecEvent = {
  id: string;
  type: EventType;
  ip: string;
  detail: string;
  created_at: string;
};

type Summary = {
  failed24h: number;
  lockouts24h: number;
  success24h: number;
  uniqueIps24h: number;
};

const BADGE: Record<EventType, { cls: string; bn: string; en: string }> = {
  login_failed: {
    cls: "bg-amber-50 text-amber-700",
    bn: "ভুল পাসওয়ার্ড",
    en: "Wrong password",
  },
  lockout: {
    cls: "bg-red-50 text-red-700",
    bn: "আটকানো হয়েছে",
    en: "Locked out",
  },
  blocked: {
    cls: "bg-red-50 text-red-600",
    bn: "আটকানো অবস্থায় চেষ্টা",
    en: "Tried while locked",
  },
  login_success: {
    cls: "bg-green-50 text-green-700",
    bn: "সফল লগইন",
    en: "Login success",
  },
  user_password_reset: {
    cls: "bg-blue-50 text-blue-700",
    bn: "ইউজারের পাসওয়ার্ড রিসেট",
    en: "User password reset",
  },
  staff_change: {
    cls: "bg-purple-50 text-purple-700",
    bn: "সহকারী পরিবর্তন",
    en: "Staff change",
  },
  backup: {
    cls: "bg-teal-50 text-teal-700",
    bn: "ব্যাকআপ",
    en: "Backup",
  },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function SecurityLogPage() {
  const { t } = useAdminLang();
  const toast = useToast();
  const [events, setEvents] = useState<SecEvent[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | EventType>("all");

  async function load() {
    try {
      const d = await apiGet<{ events: SecEvent[]; summary: Summary | null }>(
        "/api/admin/security-log",
      );
      setEvents(d.events);
      setSummary(d.summary);
    } catch (e) {
      if ((e as Error).message !== "unauthorized")
        toast.push((e as Error).message, "err");
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = filter === "all" ? events : events.filter((e) => e.type === filter);

  const danger = (summary?.lockouts24h ?? 0) >= 3;
  const warn = !danger && ((summary?.failed24h ?? 0) > 0 || (summary?.lockouts24h ?? 0) > 0);

  return (
    <>
      <PageHeader
        title={t("নিরাপত্তা লগ", "Security log")}
        subtitle={t(
          "admin লগইনের ভুল চেষ্টা, আটকানো এবং সফল লগইনের তালিকা (গত ৯০ দিন)।",
          "Failed and successful admin logins and lockouts (last 90 days).",
        )}
        action={
          <Btn variant="ghost" onClick={() => load()}>
            ↻ {t("রিফ্রেশ", "Refresh")}
          </Btn>
        }
      />

      {danger && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          🚨{" "}
          {t(
            `গত ২৪ ঘণ্টায় ${summary?.lockouts24h} বার লগইন আটকানো হয়েছে। কেউ পাসওয়ার্ড অনুমান করার চেষ্টা করছে হতে পারে। পাসওয়ার্ড বদলে ফেলুন।`,
            `${summary?.lockouts24h} lockouts in the last 24 hours. Someone may be guessing the password. Consider changing it.`,
          )}
        </div>
      )}
      {warn && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
          ⚠️{" "}
          {t(
            `গত ২৪ ঘণ্টায় ${summary?.failed24h} টি ভুল পাসওয়ার্ডের চেষ্টা হয়েছে। এগুলো আপনার নিজের না হলে সতর্ক থাকুন।`,
            `${summary?.failed24h} wrong-password attempts in the last 24 hours. Be careful if they were not yours.`,
          )}
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t("ভুল চেষ্টা (২৪ঘ)", "Failed (24h)")} value={summary?.failed24h} />
        <Stat label={t("আটকানো (২৪ঘ)", "Lockouts (24h)")} value={summary?.lockouts24h} />
        <Stat label={t("সফল লগইন (২৪ঘ)", "Logins (24h)")} value={summary?.success24h} />
        <Stat label={t("ভিন্ন IP (২৪ঘ)", "Unique IPs (24h)")} value={summary?.uniqueIps24h} />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {(["all", "login_failed", "lockout", "blocked", "login_success", "user_password_reset", "staff_change", "backup"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              filter === f
                ? "bg-[#0B4DBB] text-white"
                : "border border-gray-200 bg-white text-gray-600"
            }`}
          >
            {f === "all" ? t("সব", "All") : t(BADGE[f].bn, BADGE[f].en)}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <EmptyState text={t("লোড হচ্ছে...", "Loading...")} />
        ) : shown.length === 0 ? (
          <EmptyState text={t("কোনো ঘটনা নেই", "No events")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-5 py-3">{t("সময়", "Time")}</th>
                  <th className="px-5 py-3">{t("ঘটনা", "Event")}</th>
                  <th className="px-5 py-3">IP</th>
                  <th className="px-5 py-3">{t("বিবরণ", "Detail")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shown.map((e) => {
                  const b = BADGE[e.type];
                  return (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap px-5 py-3 text-gray-600">
                        {formatTime(e.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${b.cls}`}>
                          {t(b.bn, b.en)}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs">{e.ip}</td>
                      <td className="max-w-[320px] truncate px-5 py-3 text-xs text-gray-500">
                        {e.detail || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
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
