"use client";

import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/components/admin/api";
import { useAdminLang } from "@/components/admin/AdminShell";
import { Btn, Card, EmptyState, PageHeader, useToast } from "@/components/admin/widgets";

type Entry = {
  key: string;
  size: number;
  createdAt: string;
  tables: number;
  rows: number;
  trigger: "auto" | "manual";
};

type Overview = {
  backups: Entry[];
  dbReady: boolean;
  storageReady: boolean;
  autoConfigured: boolean;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BackupPage() {
  const { t } = useAdminLang();
  const toast = useToast();

  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  async function load() {
    try {
      setData(await apiGet<Overview>("/api/admin/backup"));
    } catch (e) {
      if ((e as Error).message !== "unauthorized") toast.push((e as Error).message, "err");
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runNow() {
    setRunning(true);
    try {
      await apiSend("/api/admin/backup", "POST");
      toast.push(t("ক্লাউডে ব্যাকআপ রাখা হয়েছে", "Backup saved to the cloud"));
      await load();
    } catch (e) {
      toast.push((e as Error).message, "err");
    } finally {
      setRunning(false);
    }
  }

  const latest = data?.backups[0];
  const ageHours = latest ? (Date.now() - new Date(latest.createdAt).getTime()) / 3_600_000 : null;
  const stale = ageHours === null || ageHours > 36;

  return (
    <>
      <PageHeader
        title={t("ডাটা ব্যাকআপ", "Data backup")}
        subtitle={t(
          "ইউজার, আবেদন, চ্যাট, নোটিশ, সেটিংস ইত্যাদি সব ডাটাবেস-ডাটার কপি। শুধু মালিক দেখতে পারেন।",
          "A copy of all database data: users, applications, chats, notices, settings. Owner only.",
        )}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-2 text-sm font-extrabold text-[#0B2A55]">
            ⬇️ {t("নিজের কম্পিউটারে নামান", "Download to this computer")}
          </h3>
          <p className="mb-4 text-xs leading-5 text-gray-600">
            {t(
              "এখনই পুরো ডাটাবেসের একটা কপি এই কম্পিউটারে নামবে। মাসে অন্তত একবার করে নিরাপদ জায়গায় (পেনড্রাইভ বা অন্য ড্রাইভে) রাখুন। ফাইলে ইউজারের নাম, ফোন ও পাসপোর্ট নম্বর থাকে, তাই কাউকে পাঠাবেন না।",
              "Downloads a copy of the whole database to this computer right now. Keep one somewhere safe at least once a month. The file contains users' names, phones and passport numbers, so never send it to anyone.",
            )}
          </p>
          <a
            href="/api/admin/backup/download"
            className="inline-block rounded-xl bg-[#0B4DBB] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#093f98]"
          >
            {t("ডাউনলোড করুন", "Download backup")}
          </a>
          <p className="mt-3 text-[11px] text-gray-500">
            {t(
              "পাসওয়ার্ড, লগইন সেশন ও এককালীন কোড ফাইলে থাকে না।",
              "Passwords, login sessions and one-time codes are not in the file.",
            )}
          </p>
        </Card>

        <Card className="p-5">
          <h3 className="mb-2 text-sm font-extrabold text-[#0B2A55]">
            ☁️ {t("ক্লাউডে স্বয়ংক্রিয় ব্যাকআপ", "Automatic cloud backup")}
          </h3>

          {loading ? (
            <p className="text-xs text-gray-400">{t("লোড হচ্ছে...", "Loading...")}</p>
          ) : (
            <>
              {!data?.storageReady && (
                <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {t(
                    "ফাইল স্টোরেজ (R2) যুক্ত নেই, তাই ক্লাউডে ব্যাকআপ রাখা যাচ্ছে না।",
                    "File storage (R2) is not connected, so backups cannot be kept in the cloud.",
                  )}
                </p>
              )}
              {data?.storageReady && !data.autoConfigured && (
                <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                  {t(
                    "প্রতিদিনের স্বয়ংক্রিয় ব্যাকআপ চালু হয়নি। Vercel-এ CRON_SECRET নামে একটা পরিবেশ-মান (Environment Variable) যোগ করে সাইট আবার ডিপ্লয় করতে হবে। নিচের বোতামে হাতে ব্যাকআপ নেওয়া যাবে।",
                    "The daily automatic backup is not switched on. Add an Environment Variable named CRON_SECRET in Vercel and redeploy. You can still take a backup by hand below.",
                  )}
                </p>
              )}
              {data?.storageReady && data.autoConfigured && stale && (
                <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                  {latest
                    ? t(
                        "শেষ ব্যাকআপ ৩৬ ঘণ্টার বেশি আগের। স্বয়ংক্রিয় ব্যাকআপ ঠিকমতো চলছে না কি না দেখুন।",
                        "The last backup is over 36 hours old. Check that the automatic backup is running.",
                      )
                    : t(
                        "এখনো কোনো ব্যাকআপ নেই। প্রথমবার চলতে এক দিন লাগতে পারে, অথবা নিচের বোতামে এখনই নিন।",
                        "No backup yet. The first automatic run can take up to a day, or take one now below.",
                      )}
                </p>
              )}
              {data?.storageReady && data.autoConfigured && !stale && latest && (
                <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                  ✅ {t("স্বয়ংক্রিয় ব্যাকআপ চালু আছে। শেষ ব্যাকআপ:", "Automatic backup is on. Last backup:")}{" "}
                  {new Date(latest.createdAt).toLocaleString()}
                </p>
              )}

              <p className="mb-4 text-xs leading-5 text-gray-600">
                {t(
                  "প্রতিদিন রাত ৩টায় (বাংলাদেশ সময়) নিজে থেকে একটা কপি আপনার Cloudflare-এ জমে। সর্বশেষ ৩০টা রাখা হয়, পুরনোগুলো নিজে মুছে যায়।",
                  "Every day at 3 AM (Bangladesh time) a copy is saved in your Cloudflare. The latest 30 are kept; older ones are removed automatically.",
                )}
              </p>

              <Btn onClick={runNow} disabled={running || !data?.storageReady}>
                {running ? "..." : t("এখনই ক্লাউডে ব্যাকআপ নিন", "Back up to the cloud now")}
              </Btn>
            </>
          )}
        </Card>
      </div>

      <Card className="mt-5 overflow-hidden">
        <h3 className="border-b border-gray-100 px-5 py-4 text-sm font-extrabold text-[#0B2A55]">
          {t("ক্লাউডে রাখা ব্যাকআপ", "Backups kept in the cloud")}
        </h3>
        {loading ? (
          <EmptyState text={t("লোড হচ্ছে...", "Loading...")} />
        ) : !data || data.backups.length === 0 ? (
          <EmptyState text={t("এখনো কোনো ব্যাকআপ নেই", "No backups yet")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-5 py-3">{t("সময়", "Time")}</th>
                  <th className="px-5 py-3">{t("ধরন", "Type")}</th>
                  <th className="px-5 py-3">{t("তথ্য", "Rows")}</th>
                  <th className="px-5 py-3">{t("আকার", "Size")}</th>
                  <th className="px-5 py-3 text-right">{t("নামান", "Download")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.backups.map((b) => (
                  <tr key={b.key}>
                    <td className="whitespace-nowrap px-5 py-3">{new Date(b.createdAt).toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          b.trigger === "auto" ? "bg-teal-50 text-teal-700" : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {b.trigger === "auto" ? t("স্বয়ংক্রিয়", "Automatic") : t("হাতে", "Manual")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-600">
                      {b.rows} {t("সারি,", "rows,")} {b.tables} {t("টেবিল", "tables")}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-600">{formatSize(b.size)}</td>
                    <td className="px-5 py-3 text-right">
                      <a
                        href={`/api/admin/backup/file?key=${encodeURIComponent(b.key)}`}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:text-blue-600"
                      >
                        ⬇️
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-5 p-5">
        <h3 className="mb-2 text-sm font-extrabold text-[#0B2A55]">
          {t("ব্যাকআপ থেকে ডাটা ফেরানো", "Restoring from a backup")}
        </h3>
        <p className="text-xs leading-5 text-gray-600">
          {t(
            "ফেরানোর দরকার হলে এই ফাইলটা আমাকে (Claude Code-এ) দিন, আমি নিরাপদে ফিরিয়ে দেব। নিজে ফাইল খুলে কিছু বদলাবেন না। মনে রাখবেন, পাসওয়ার্ড ব্যাকআপে থাকে না, ফেরানোর পর ইউজারদের \"Password ভুলে গেছি\" দিয়ে নতুন পাসওয়ার্ড নিতে হবে। ছবি ও পাসপোর্টের ফাইল এই ব্যাকআপে নেই, সেগুলো আলাদা।",
            "To restore, give the file to Claude Code and it will be restored safely. Do not edit the file yourself. Note that passwords are not in backups, so users would have to reset them afterwards. Photo and passport files are not part of this backup; they are separate.",
          )}
        </p>
      </Card>
    </>
  );
}
