"use client";

import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/components/admin/api";
import { useAdminLang } from "@/components/admin/AdminShell";
import {
  Btn,
  Card,
  EmptyState,
  Field,
  PageHeader,
  Select,
  Textarea,
  useToast,
} from "@/components/admin/widgets";

type CountryCount = { country: string; count: number };
type HistoryRow = {
  id: string;
  message: string;
  audience: "all" | "country";
  country: string;
  recipients: number;
  created_at: string;
};
type Overview = { total: number; countries: CountryCount[]; history: HistoryRow[] };

const MAX_LENGTH = 2000;

export default function BroadcastPage() {
  const { t } = useAdminLang();
  const toast = useToast();

  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [audience, setAudience] = useState<"all" | "country">("all");
  const [country, setCountry] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    try {
      const d = await apiGet<Overview>("/api/admin/chat/broadcast");
      setData(d);
      setCountry((cur) => cur || d.countries[0]?.country || "");
    } catch (e) {
      if ((e as Error).message !== "unauthorized") toast.push((e as Error).message, "err");
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recipients =
    audience === "all"
      ? (data?.total ?? 0)
      : (data?.countries.find((c) => c.country === country)?.count ?? 0);

  const canSend = !!message.trim() && recipients > 0 && !sending && (audience === "all" || !!country);

  async function send() {
    if (!canSend) return;
    const who =
      audience === "all"
        ? t("সব ইউজার", "all users")
        : t(`${country}-এর আবেদনকারী`, `applicants for ${country}`);
    if (
      !confirm(
        t(
          `${recipients} জন ইউজারকে (${who}) এই বার্তা পাঠাবেন? পাঠানোর পর ফেরত নেওয়া যাবে না।`,
          `Send this message to ${recipients} users (${who})? It cannot be taken back.`,
        ),
      )
    )
      return;

    setSending(true);
    try {
      const r = await apiSend<{ recipients: number }>("/api/admin/chat/broadcast", "POST", {
        message,
        audience,
        country: audience === "country" ? country : "",
      });
      toast.push(t(`${r.recipients} জনকে পাঠানো হয়েছে`, `Sent to ${r.recipients} users`));
      setMessage("");
      await load();
    } catch (e) {
      toast.push((e as Error).message, "err");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader
        title={t("ইউজারদের বার্তা পাঠান", "Message users")}
        subtitle={t(
          "রেজিস্টার্ড ইউজারদের মেসেজ আইকনে নোটিফিকেশন যাবে। তারা চ্যাট খুলে আপনার বার্তা পড়বে।",
          "Registered users get a notification on their chat icon and read your message in the chat.",
        )}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-extrabold text-[#0B2A55]">
            {t("নতুন বার্তা", "New message")}
          </h3>

          <Field label={t("কাদের পাঠাবেন", "Send to")}>
            <Select
              value={audience}
              onChange={(e) => setAudience(e.target.value === "country" ? "country" : "all")}
            >
              <option value="all">
                {t(`সব ইউজার (${data?.total ?? 0} জন)`, `All users (${data?.total ?? 0})`)}
              </option>
              <option value="country">
                {t("নির্দিষ্ট দেশের আবেদনকারী", "Applicants for a specific country")}
              </option>
            </Select>
          </Field>

          {audience === "country" && (
            <Field
              label={t("দেশ", "Country")}
              hint={t(
                "যারা ওই দেশের কোনো চাকরিতে আবেদন করেছে।",
                "Users who applied for a job in that country.",
              )}
            >
              {data && data.countries.length > 0 ? (
                <Select value={country} onChange={(e) => setCountry(e.target.value)}>
                  {data.countries.map((c) => (
                    <option key={c.country} value={c.country}>
                      {c.country} ({c.count})
                    </option>
                  ))}
                </Select>
              ) : (
                <p className="text-xs text-gray-500">
                  {t("এখনো কোনো ইউজার কোনো দেশে আবেদন করেননি।", "No user has applied for any country yet.")}
                </p>
              )}
            </Field>
          )}

          <Field label={t("বার্তা", "Message")}>
            <Textarea
              rows={6}
              maxLength={MAX_LENGTH}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("এখানে আপনার বার্তা লিখুন...", "Write your message here...")}
            />
            <p className="mt-1 text-right text-[11px] text-gray-400">
              {message.length}/{MAX_LENGTH}
            </p>
          </Field>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-gray-600">
              {t(`${recipients} জন ইউজার পাবে`, `${recipients} users will receive it`)}
            </p>
            <Btn onClick={send} disabled={!canSend}>
              {sending ? "..." : `📣 ${t("পাঠান", "Send")}`}
            </Btn>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <h3 className="border-b border-gray-100 px-5 py-4 text-sm font-extrabold text-[#0B2A55]">
            {t("সর্বশেষ পাঠানো বার্তা", "Recently sent")}
          </h3>
          {loading ? (
            <EmptyState text={t("লোড হচ্ছে...", "Loading...")} />
          ) : !data || data.history.length === 0 ? (
            <EmptyState text={t("এখনো কোনো বার্তা পাঠানো হয়নি", "Nothing sent yet")} />
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.history.map((h) => (
                <li key={h.id} className="px-5 py-3">
                  <p className="whitespace-pre-wrap text-sm text-gray-800">{h.message}</p>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {new Date(h.created_at.replace(" ", "T") + "Z").toLocaleString()} ·{" "}
                    {h.audience === "all"
                      ? t("সব ইউজার", "All users")
                      : t(`${h.country}-এর আবেদনকারী`, `Applicants for ${h.country}`)}{" "}
                    · {h.recipients} {t("জন", "users")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
