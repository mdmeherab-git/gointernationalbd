"use client";

import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/components/admin/api";
import { useAdminLang } from "@/components/admin/AdminShell";
import {
  Btn,
  Card,
  Drawer,
  EmptyState,
  Field,
  PageHeader,
  Textarea,
  TextInput,
  useToast,
} from "@/components/admin/widgets";

type Service = {
  id: string;
  title_bn: string;
  title_en: string;
  desc_bn: string;
  desc_en: string;
  icon: string;
  link_url: string;
  button_bn: string;
  button_en: string;
  status: "active" | "inactive";
  sort_order: number;
};

type Form = Omit<Service, "sort_order" | "id"> & { id: string | null };

const EMPTY: Form = {
  id: null,
  title_bn: "",
  title_en: "",
  desc_bn: "",
  desc_en: "",
  icon: "⭐",
  link_url: "",
  button_bn: "",
  button_en: "",
  status: "active",
};

const ICONS = ["🛂", "💼", "📄", "📋", "🤖", "💬", "🏥", "✈️", "🎓", "🏠", "💰", "🌍", "📞", "🛠️", "⭐", "✅"];

const LINK_PRESETS: { bn: string; en: string; value: string }[] = [
  { bn: "চাকরির সার্কুলার", en: "Jobs", value: "/jobs" },
  { bn: "ভিসা চেক", en: "Visa check", value: "/#visa-check" },
  { bn: "AI সহকারী", en: "AI assistant", value: "/#ai-assistant" },
  { bn: "সিভি তৈরি", en: "CV builder", value: "/account/cv" },
  { bn: "আবেদন ট্র্যাকিং", en: "Track application", value: "/account/applications" },
  { bn: "যোগাযোগ", en: "Contact", value: "/#contact" },
  { bn: "WhatsApp", en: "WhatsApp", value: "whatsapp" },
];

export default function ServicesAdminPage() {
  const { t, isBn } = useAdminLang();
  const toast = useToast();

  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const d = await apiGet<{ services: Service[] }>("/api/admin/services");
      setItems(d.services);
    } catch (e) {
      if ((e as Error).message !== "unauthorized") toast.push((e as Error).message, "err");
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      const { id, ...fields } = form;
      if (id === null) {
        await apiSend("/api/admin/services", "POST", fields);
        toast.push(t("সেবা যোগ হয়েছে", "Service added"));
      } else {
        await apiSend(`/api/admin/services/${id}`, "PATCH", fields);
        toast.push(t("সংরক্ষণ হয়েছে", "Saved"));
      }
      setForm(null);
      await load();
    } catch (e) {
      toast.push((e as Error).message, "err");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(s: Service) {
    const next = s.status === "active" ? "inactive" : "active";
    setItems((l) => l.map((x) => (x.id === s.id ? { ...x, status: next } : x)));
    try {
      await apiSend(`/api/admin/services/${s.id}`, "PATCH", { status: next });
    } catch (e) {
      toast.push((e as Error).message, "err");
      await load();
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    try {
      await apiSend("/api/admin/services/reorder", "POST", { ids: next.map((x) => x.id) });
    } catch (e) {
      toast.push((e as Error).message, "err");
      await load();
    }
  }

  async function remove() {
    if (!form || form.id === null) return;
    if (
      !confirm(
        t(
          "এই সেবাটি স্থায়ীভাবে মুছবেন? (শুধু লুকাতে চাইলে 'বন্ধ' করুন)",
          "Delete this service permanently? (To just hide it, switch it off instead.)",
        ),
      )
    )
      return;
    try {
      await apiSend(`/api/admin/services/${form.id}`, "DELETE");
      toast.push(t("মুছে ফেলা হয়েছে", "Deleted"));
      setForm(null);
      await load();
    } catch (e) {
      toast.push((e as Error).message, "err");
    }
  }

  const creating = form?.id === null;
  const canSave = !!form && !saving && (form.title_bn.trim() !== "" || form.title_en.trim() !== "");

  return (
    <>
      <PageHeader
        title={t("সেবা", "Services")}
        subtitle={t(
          "হোম পাতার \"আমাদের সেবাসমূহ\" কার্ডগুলো এখান থেকে যোগ, বদল, সাজানো ও বন্ধ করুন। হেডারের \"সেবা\" লিংক এই অংশে নিয়ে যায়।",
          "Add, edit, reorder and switch off the cards in the home page's \"Our Services\" section. The header's \"Services\" link jumps here.",
        )}
        action={<Btn onClick={() => setForm({ ...EMPTY })}>+ {t("নতুন সেবা", "Add service")}</Btn>}
      />

      <Card className="overflow-hidden">
        {loading ? (
          <EmptyState text={t("লোড হচ্ছে...", "Loading...")} />
        ) : items.length === 0 ? (
          <EmptyState text={t("কোনো সেবা নেই", "No services yet")} />
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((s, index) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <div className="flex flex-col">
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="rounded px-1.5 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={index === items.length - 1}
                    onClick={() => move(index, 1)}
                    className="rounded px-1.5 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>

                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                  {s.icon}
                </span>

                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-bold ${s.status === "active" ? "text-[#0B2A55]" : "text-gray-400"}`}>
                    {isBn ? s.title_bn : s.title_en}
                  </p>
                  <p className="truncate text-xs text-gray-500">{isBn ? s.desc_bn : s.desc_en}</p>
                </div>

                <button
                  type="button"
                  onClick={() => toggle(s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    s.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {s.status === "active" ? t("চালু", "On") : t("বন্ধ", "Off")}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const { sort_order: _sort, ...rest } = s;
                    void _sort;
                    setForm({ ...rest });
                  }}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:text-blue-600"
                >
                  {t("সম্পাদনা", "Edit")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Drawer
        open={!!form}
        onClose={() => setForm(null)}
        title={creating ? t("নতুন সেবা", "New service") : t("সেবা সম্পাদনা", "Edit service")}
        footer={
          form && (
            <div className="flex w-full items-center justify-between gap-2">
              {!creating ? (
                <Btn variant="danger" onClick={remove}>
                  {t("মুছুন", "Delete")}
                </Btn>
              ) : (
                <span />
              )}
              <Btn onClick={save} disabled={!canSave}>
                {saving ? "..." : t("সংরক্ষণ করুন", "Save")}
              </Btn>
            </div>
          )
        }
      >
        {form && (
          <div className="space-y-1 text-sm">
            <div>
              <p className="mb-1.5 text-xs font-bold text-gray-600">{t("আইকন", "Icon")}</p>
              <div className="flex flex-wrap gap-1.5">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm({ ...form, icon })}
                    className={`h-10 w-10 rounded-xl border text-xl ${
                      form.icon === icon ? "border-[#0B4DBB] bg-blue-50" : "border-gray-200 bg-white"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <div className="mt-2 max-w-[160px]">
                <TextInput
                  value={form.icon}
                  maxLength={8}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder={t("বা নিজের ইমোজি", "or your own emoji")}
                />
              </div>
            </div>

            <Field label={t("নাম (বাংলা)", "Title (Bangla)")}>
              <TextInput
                value={form.title_bn}
                maxLength={80}
                onChange={(e) => setForm({ ...form, title_bn: e.target.value })}
              />
            </Field>
            <Field label={t("নাম (English)", "Title (English)")}>
              <TextInput
                value={form.title_en}
                maxLength={80}
                onChange={(e) => setForm({ ...form, title_en: e.target.value })}
              />
            </Field>

            <Field label={t("বিবরণ (বাংলা)", "Description (Bangla)")} hint={t("১-২ লাইন, সর্বোচ্চ ২৪০ অক্ষর", "1-2 lines, max 240 characters")}>
              <Textarea
                rows={3}
                maxLength={240}
                value={form.desc_bn}
                onChange={(e) => setForm({ ...form, desc_bn: e.target.value })}
              />
            </Field>
            <Field label={t("বিবরণ (English)", "Description (English)")}>
              <Textarea
                rows={3}
                maxLength={240}
                value={form.desc_en}
                onChange={(e) => setForm({ ...form, desc_en: e.target.value })}
              />
            </Field>

            <Field
              label={t("বোতামের লিংক", "Button link")}
              hint={t(
                "পাতার পথ (যেমন /jobs), https://..., tel:+880..., অথবা শুধু whatsapp (সেটিংসের নম্বরে WhatsApp খুলবে)। খালি রাখলে বোতাম থাকবে না।",
                "A site path (e.g. /jobs), https://..., tel:+880..., or just whatsapp (opens WhatsApp on the Settings number). Leave empty for no button.",
              )}
            >
              <TextInput
                value={form.link_url}
                maxLength={300}
                onChange={(e) => setForm({ ...form, link_url: e.target.value.trim() })}
                placeholder="/jobs"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {LINK_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setForm({ ...form, link_url: p.value })}
                    className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:border-blue-300 hover:text-blue-600"
                  >
                    {isBn ? p.bn : p.en}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t("বোতামের লেখা (বাংলা)", "Button text (Bangla)")}>
                <TextInput
                  value={form.button_bn}
                  maxLength={40}
                  onChange={(e) => setForm({ ...form, button_bn: e.target.value })}
                  placeholder="বিস্তারিত দেখুন"
                />
              </Field>
              <Field label={t("বোতামের লেখা (English)", "Button text (English)")}>
                <TextInput
                  value={form.button_en}
                  maxLength={40}
                  onChange={(e) => setForm({ ...form, button_en: e.target.value })}
                  placeholder="View details"
                />
              </Field>
            </div>

            <div className="pt-2">
              <p className="mb-1.5 text-xs font-bold text-gray-600">{t("সাইটে দেখাবে?", "Show on the site?")}</p>
              <div className="flex gap-2">
                {(["active", "inactive"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, status: s })}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      form.status === s ? "bg-[#0B4DBB] text-white" : "border border-gray-200 bg-white text-gray-600"
                    }`}
                  >
                    {s === "active" ? t("চালু", "On") : t("বন্ধ (লুকানো)", "Off (hidden)")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
