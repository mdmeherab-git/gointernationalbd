"use client";

import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/components/admin/api";
import { useAdminLang } from "@/components/admin/AdminShell";
import {
  Btn,
  Card,
  Field,
  PageHeader,
  Select,
  Textarea,
  TextInput,
  Toggle,
  useToast,
} from "@/components/admin/widgets";

type Settings = {
  contactPhone: string;
  contactWhatsapp: string;
  contactEmail: string;
  officeAddress: string;
  noticeEnabled: boolean;
  noticeBn: string;
  noticeEn: string;
  noticeSpeed: number;
  noticeDirection: "left" | "right";
};

export default function SettingsPage() {
  const { t } = useAdminLang();
  const toast = useToast();
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<{ settings: Settings }>("/api/admin/settings")
      .then((d) => setS(d.settings))
      .catch((e) => {
        if ((e as Error).message !== "unauthorized")
          toast.push((e as Error).message, "err");
      });
  }, [toast]);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setS((cur) => (cur ? { ...cur, [k]: v } : cur));

  async function save() {
    if (!s) return;
    setSaving(true);
    try {
      await apiSend("/api/admin/settings", "PATCH", {
        contact_phone: s.contactPhone,
        contact_whatsapp: s.contactWhatsapp,
        contact_email: s.contactEmail,
        office_address: s.officeAddress,
        notice_enabled: s.noticeEnabled,
        notice_bn: s.noticeBn,
        notice_en: s.noticeEn,
        notice_speed: s.noticeSpeed,
        notice_direction: s.noticeDirection,
      });
      toast.push(t("সেভ হয়েছে", "Saved"));
    } catch (e) {
      toast.push((e as Error).message, "err");
    } finally {
      setSaving(false);
    }
  }

  if (!s) {
    return (
      <>
        <PageHeader title={t("সেটিংস", "Settings")} />
        <p className="text-sm text-gray-400">{t("লোড হচ্ছে...", "Loading...")}</p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={t("সেটিংস", "Settings")}
        subtitle={t(
          "যোগাযোগের তথ্য ও হোম পেজের স্ক্রলিং নোটিশ।",
          "Contact details and the home page scrolling notice.",
        )}
        action={
          <Btn onClick={save} disabled={saving}>
            {saving ? "..." : t("সেভ করুন", "Save")}
          </Btn>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-extrabold text-[#0B2A55]">
            {t("যোগাযোগের তথ্য", "Contact information")}
          </h3>
          <Field label={t("ফোন নম্বর", "Phone number")}>
            <TextInput
              value={s.contactPhone}
              onChange={(e) => set("contactPhone", e.target.value)}
            />
          </Field>
          <Field label={t("হোয়াটসঅ্যাপ নম্বর", "WhatsApp number")}>
            <TextInput
              value={s.contactWhatsapp}
              onChange={(e) => set("contactWhatsapp", e.target.value)}
            />
          </Field>
          <Field label={t("ইমেইল", "Email")}>
            <TextInput
              value={s.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
            />
          </Field>
          <Field label={t("অফিসের ঠিকানা", "Office address")}>
            <Textarea
              rows={3}
              value={s.officeAddress}
              onChange={(e) => set("officeAddress", e.target.value)}
            />
          </Field>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-extrabold text-[#0B2A55]">
            {t("স্ক্রলিং নোটিশ (হোম পেজ)", "Scrolling notice (home page)")}
          </h3>
          <div className="mb-3.5">
            <Toggle
              checked={s.noticeEnabled}
              onChange={(v) => set("noticeEnabled", v)}
              label={t("নোটিশ চালু আছে", "Notice enabled")}
            />
          </div>
          <Field label={t("বাংলা লেখা", "Bangla text")}>
            <Textarea
              rows={2}
              value={s.noticeBn}
              onChange={(e) => set("noticeBn", e.target.value)}
            />
          </Field>
          <Field label={t("ইংরেজি লেখা", "English text")}>
            <Textarea
              rows={2}
              value={s.noticeEn}
              onChange={(e) => set("noticeEn", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-x-3">
            <Field label={t("গতি (সেকেন্ড)", "Speed (seconds)")} hint={t("কম = দ্রুত", "lower = faster")}>
              <TextInput
                type="number"
                value={s.noticeSpeed}
                onChange={(e) => set("noticeSpeed", Number(e.target.value) || 25)}
              />
            </Field>
            <Field label={t("দিক", "Direction")}>
              <Select
                value={s.noticeDirection}
                onChange={(e) => set("noticeDirection", e.target.value as "left" | "right")}
              >
                <option value="left">{t("বাম দিকে", "Left")}</option>
                <option value="right">{t("ডান দিকে", "Right")}</option>
              </Select>
            </Field>
          </div>
        </Card>
      </div>

      <Card className="mt-5 p-5">
        <h3 className="mb-2 text-sm font-extrabold text-[#0B2A55]">
          {t("লগইন পাসওয়ার্ড", "Login password")}
        </h3>
        <p className="text-xs leading-5 text-gray-500">
          {t(
            "অ্যাডমিন পাসওয়ার্ড কোডে বা ডেটাবেসে নয় — এটি .dev.vars ফাইলে (লোকাল) বা Cloudflare secret-এ রাখা হয়। বদলাতে: ",
            "The admin password is not stored in code or the database — it lives in .dev.vars (local) or as a Cloudflare secret. To change it: ",
          )}
          <code className="rounded bg-gray-100 px-1.5 py-0.5">
            npx wrangler secret put ADMIN_PASSWORD
          </code>
        </p>
      </Card>
    </>
  );
}
