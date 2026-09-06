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
  Select,
  StatusBadge,
  TextInput,
  Textarea,
  useToast,
} from "@/components/admin/widgets";

type Notice = {
  id: string;
  title_bn: string;
  title_en: string;
  notice_date: string;
  tag_type: "new" | "general" | "report";
  tag_label_bn: string;
  tag_label_en: string;
  status: "active" | "inactive";
  sort_order: number;
};

const TAG_PRESET: Record<Notice["tag_type"], { bn: string; en: string }> = {
  new: { bn: "নতুন", en: "New" },
  general: { bn: "সাধারণ", en: "General" },
  report: { bn: "বিভিন্ন প্রতিবেদন", en: "Reports" },
};

function blank(order: number): Notice {
  return {
    id: "",
    title_bn: "",
    title_en: "",
    notice_date: new Date().toISOString().slice(0, 10),
    tag_type: "new",
    tag_label_bn: "নতুন",
    tag_label_en: "New",
    status: "active",
    sort_order: order,
  };
}

export default function NoticesPage() {
  const { t } = useAdminLang();
  const toast = useToast();
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const d = await apiGet<{ notices: Notice[] }>("/api/admin/notices");
      setItems(d.notices);
    } catch (e) {
      if ((e as Error).message !== "unauthorized")
        toast.push((e as Error).message, "err");
    }
  };

  useEffect(() => {
    apiGet<{ notices: Notice[] }>("/api/admin/notices")
      .then((d) => setItems(d.notices))
      .catch((e) => {
        if ((e as Error).message !== "unauthorized")
          toast.push((e as Error).message, "err");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof Notice>(k: K, v: Notice[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  async function save() {
    if (!draft) return;
    if (!draft.title_bn.trim() && !draft.title_en.trim()) {
      toast.push(t("অন্তত একটি ভাষায় লেখা দিন", "Enter text in at least one language"), "err");
      return;
    }
    setSaving(true);
    const payload = {
      title_bn: draft.title_bn,
      title_en: draft.title_en,
      notice_date: draft.notice_date,
      tag_type: draft.tag_type,
      tag_label_bn: draft.tag_label_bn,
      tag_label_en: draft.tag_label_en,
      status: draft.status,
      sort_order: draft.sort_order,
    };
    try {
      if (draft.id) {
        await apiSend(`/api/admin/notices/${draft.id}`, "PATCH", payload);
        toast.push(t("আপডেট হয়েছে", "Updated"));
      } else {
        await apiSend("/api/admin/notices", "POST", payload);
        toast.push(t("যোগ হয়েছে", "Created"));
      }
      setDraft(null);
      await load();
    } catch (e) {
      toast.push((e as Error).message, "err");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(n: Notice) {
    const next = n.status === "active" ? "inactive" : "active";
    setItems((l) => l.map((x) => (x.id === n.id ? { ...x, status: next } : x)));
    try {
      await apiSend(`/api/admin/notices/${n.id}`, "PATCH", { status: next });
    } catch (e) {
      toast.push((e as Error).message, "err");
      await load();
    }
  }

  async function remove(n: Notice) {
    if (!confirm(t("এই নোটিশটি মুছে ফেলবেন?", "Delete this notice?"))) return;
    try {
      await apiSend(`/api/admin/notices/${n.id}`, "DELETE");
      setItems((l) => l.filter((x) => x.id !== n.id));
      toast.push(t("মুছে ফেলা হয়েছে", "Deleted"));
    } catch (e) {
      toast.push((e as Error).message, "err");
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const a = items[index];
    const b = items[j];
    const next = [...items];
    next[index] = b;
    next[j] = a;
    setItems(next);
    try {
      await Promise.all([
        apiSend(`/api/admin/notices/${a.id}`, "PATCH", { sort_order: b.sort_order }),
        apiSend(`/api/admin/notices/${b.id}`, "PATCH", { sort_order: a.sort_order }),
      ]);
    } catch (e) {
      toast.push((e as Error).message, "err");
      await load();
    }
  }

  return (
    <>
      <PageHeader
        title={t("নোটিশ বোর্ড", "Notice Board")}
        subtitle={t(
          "ওয়েবসাইটে দেখানো নোটিশসমূহ পরিচালনা করুন।",
          "Manage the notices shown on the website.",
        )}
        action={
          <Btn onClick={() => setDraft(blank((items.at(-1)?.sort_order ?? 0) + 1))}>
            + {t("নতুন নোটিশ", "New Notice")}
          </Btn>
        }
      />

      <Card className="overflow-hidden">
        <div className="divide-y divide-gray-100">
          {items.map((n, i) => (
            <div key={n.id} className="flex items-start gap-3 px-5 py-4">
              <div className="flex flex-col gap-1 pt-0.5">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="text-xs text-gray-400 hover:text-blue-600 disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  className="text-xs text-gray-400 hover:text-blue-600 disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800">{n.title_bn || n.title_en}</p>
                <p className="truncate text-[12px] text-gray-400">{n.title_en}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                  <span>📅 {n.notice_date}</span>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                    {n.tag_label_bn}
                  </span>
                  <button type="button" onClick={() => toggleStatus(n)}>
                    <StatusBadge status={n.status} />
                  </button>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setDraft({ ...n })}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:text-blue-600"
                >
                  {t("এডিট", "Edit")}
                </button>
                <button
                  type="button"
                  onClick={() => remove(n)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                >
                  {t("মুছুন", "Delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
        {loading && <EmptyState text={t("লোড হচ্ছে...", "Loading...")} />}
        {!loading && items.length === 0 && (
          <EmptyState text={t("কোনো নোটিশ নেই", "No notices yet")} />
        )}
      </Card>

      <Drawer
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? t("নোটিশ এডিট", "Edit Notice") : t("নতুন নোটিশ", "New Notice")}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setDraft(null)}>
              {t("বাতিল", "Cancel")}
            </Btn>
            <Btn onClick={save} disabled={saving}>
              {saving ? "..." : t("সেভ করুন", "Save")}
            </Btn>
          </>
        }
      >
        {draft && (
          <div>
            <Field label={t("বাংলা লেখা", "Bangla text")}>
              <Textarea
                rows={3}
                value={draft.title_bn}
                onChange={(e) => set("title_bn", e.target.value)}
              />
            </Field>
            <Field label={t("ইংরেজি লেখা", "English text")}>
              <Textarea
                rows={3}
                value={draft.title_en}
                onChange={(e) => set("title_en", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-x-3">
              <Field label={t("তারিখ", "Date")}>
                <TextInput
                  type="date"
                  value={draft.notice_date}
                  onChange={(e) => set("notice_date", e.target.value)}
                />
              </Field>
              <Field label={t("ট্যাগ", "Tag")}>
                <Select
                  value={draft.tag_type}
                  onChange={(e) => {
                    const tag = e.target.value as Notice["tag_type"];
                    set("tag_type", tag);
                    set("tag_label_bn", TAG_PRESET[tag].bn);
                    set("tag_label_en", TAG_PRESET[tag].en);
                  }}
                >
                  <option value="new">{t("নতুন", "New")}</option>
                  <option value="general">{t("সাধারণ", "General")}</option>
                  <option value="report">{t("প্রতিবেদন", "Reports")}</option>
                </Select>
              </Field>
              <Field label={t("স্ট্যাটাস", "Status")}>
                <Select
                  value={draft.status}
                  onChange={(e) => set("status", e.target.value as Notice["status"])}
                >
                  <option value="active">{t("সক্রিয়", "Active")}</option>
                  <option value="inactive">{t("নিষ্ক্রিয়", "Inactive")}</option>
                </Select>
              </Field>
              <Field label={t("সিরিয়াল", "Sort order")}>
                <TextInput
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
                />
              </Field>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
