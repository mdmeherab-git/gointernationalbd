"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  Textarea,
  TextInput,
  Toggle,
  useToast,
} from "@/components/admin/widgets";

type Circular = {
  id: string;
  country: string;
  countryCode: string;
  flag: string;
  category: string;
  title: string;
  sponsor: string;
  salary: string;
  vacancy: number;
  duty: string;
  accommodation: string;
  deadline: string;
  posted: string;
  description: string;
  requirements: string[];
  circularUrl: string | null;
  circularType: "image" | "pdf" | null;
  isFeatured: boolean;
  featuredImageUrl: string | null;
  status: "active" | "inactive";
  sortOrder: number;
};

const BLANK: Circular = {
  id: "",
  country: "",
  countryCode: "",
  flag: "",
  category: "",
  title: "",
  sponsor: "MCL Overseas",
  salary: "",
  vacancy: 0,
  duty: "8 Hours",
  accommodation: "Provided",
  deadline: "",
  posted: "",
  description: "",
  requirements: [],
  circularUrl: null,
  circularType: null,
  isFeatured: false,
  featuredImageUrl: null,
  status: "active",
  sortOrder: 0,
};

function toPayload(c: Circular) {
  return {
    country: c.country,
    country_code: c.countryCode,
    flag: c.flag,
    category: c.category,
    title: c.title,
    sponsor: c.sponsor,
    salary: c.salary,
    vacancy: c.vacancy,
    duty: c.duty,
    accommodation: c.accommodation,
    deadline: c.deadline,
    posted: c.posted,
    description: c.description,
    requirements: c.requirements,
    circular_url: c.circularUrl,
    circular_type: c.circularType,
    is_featured: c.isFeatured,
    featured_image_url: c.featuredImageUrl,
    status: c.status,
    sort_order: c.sortOrder,
  };
}

export default function CircularsPage() {
  const { t } = useAdminLang();
  const toast = useToast();

  const [items, setItems] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [draft, setDraft] = useState<Circular | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"circular" | "featured" | null>(null);
  const circularFileRef = useRef<HTMLInputElement>(null);
  const featuredFileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const d = await apiGet<{ circulars: Circular[] }>("/api/admin/circulars");
      setItems(d.circulars);
    } catch (e) {
      if ((e as Error).message !== "unauthorized")
        toast.push((e as Error).message, "err");
    }
  };

  useEffect(() => {
    apiGet<{ circulars: Circular[] }>("/api/admin/circulars")
      .then((d) => setItems(d.circulars))
      .catch((e) => {
        if ((e as Error).message !== "unauthorized")
          toast.push((e as Error).message, "err");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return items.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!needle) return true;
      return [c.country, c.title, c.category, c.sponsor]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [items, q, statusFilter]);

  const set = <K extends keyof Circular>(k: K, v: Circular[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  async function save() {
    if (!draft) return;
    if (!draft.country.trim() || !draft.title.trim()) {
      toast.push(t("দেশ ও পদের নাম দিন", "Country and title are required"), "err");
      return;
    }
    setSaving(true);
    try {
      if (draft.id) {
        await apiSend(`/api/admin/circulars/${draft.id}`, "PATCH", toPayload(draft));
        toast.push(t("আপডেট হয়েছে", "Updated"));
      } else {
        await apiSend("/api/admin/circulars", "POST", toPayload(draft));
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

  async function toggleStatus(c: Circular) {
    const next = c.status === "active" ? "inactive" : "active";
    setItems((list) => list.map((x) => (x.id === c.id ? { ...x, status: next } : x)));
    try {
      await apiSend(`/api/admin/circulars/${c.id}`, "PATCH", { status: next });
    } catch (e) {
      toast.push((e as Error).message, "err");
      await load();
    }
  }

  async function remove(c: Circular) {
    if (!confirm(t(`"${c.title}" মুছে ফেলবেন?`, `Delete "${c.title}"?`))) return;
    try {
      await apiSend(`/api/admin/circulars/${c.id}`, "DELETE");
      setItems((list) => list.filter((x) => x.id !== c.id));
      toast.push(t("মুছে ফেলা হয়েছে", "Deleted"));
    } catch (e) {
      toast.push((e as Error).message, "err");
    }
  }

  async function upload(kind: "circular" | "featured", file: File) {
    setUploading(kind);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const d = await apiSend<{ url: string; type: "image" | "pdf" }>(
        "/api/admin/upload",
        "POST",
        fd,
      );
      if (kind === "circular") {
        set("circularUrl", d.url);
        set("circularType", d.type);
      } else {
        set("featuredImageUrl", d.url);
      }
      toast.push(t("আপলোড হয়েছে", "Uploaded"));
    } catch (e) {
      toast.push((e as Error).message, "err");
    } finally {
      setUploading(null);
    }
  }

  return (
    <>
      <PageHeader
        title={t("সার্কুলার পরিচালনা", "Manage Circulars")}
        subtitle={t(
          "নতুন চাকরির সার্কুলার যোগ, এডিট বা মুছে ফেলুন।",
          "Add, edit or remove job circulars.",
        )}
        action={
          <Btn onClick={() => setDraft({ ...BLANK })}>
            + {t("নতুন সার্কুলার", "New Circular")}
          </Btn>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("খুঁজুন...", "Search...")}
          className="w-full max-w-xs rounded-xl border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="all">{t("সব স্ট্যাটাস", "All statuses")}</option>
          <option value="active">{t("সক্রিয়", "Active")}</option>
          <option value="inactive">{t("নিষ্ক্রিয়", "Inactive")}</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">{t("দেশ / পদ", "Country / Position")}</th>
                <th className="px-5 py-3">{t("বেতন", "Salary")}</th>
                <th className="px-5 py-3">{t("পদসংখ্যা", "Vacancy")}</th>
                <th className="px-5 py-3">{t("ফিচার্ড", "Featured")}</th>
                <th className="px-5 py-3">{t("স্ট্যাটাস", "Status")}</th>
                <th className="px-5 py-3 text-right">{t("অ্যাকশন", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{c.flag || "🌍"}</span>
                      <div>
                        <p className="font-bold">{c.title}</p>
                        <p className="text-[11px] text-gray-500">
                          {c.country} · {c.category || "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">{c.salary || "—"}</td>
                  <td className="px-5 py-3">{c.vacancy}</td>
                  <td className="px-5 py-3">{c.isFeatured ? "⭐" : "—"}</td>
                  <td className="px-5 py-3">
                    <button type="button" onClick={() => toggleStatus(c)} title="Toggle status">
                      <StatusBadge status={c.status} />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setDraft({ ...c })}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:border-blue-200 hover:text-blue-600"
                      >
                        {t("এডিট", "Edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(c)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:border-red-200 hover:bg-red-50"
                      >
                        {t("মুছুন", "Delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && <EmptyState text={t("লোড হচ্ছে...", "Loading...")} />}
        {!loading && filtered.length === 0 && (
          <EmptyState text={t("কোনো সার্কুলার পাওয়া যায়নি", "No circulars found")} />
        )}
      </Card>

      <Drawer
        open={!!draft}
        onClose={() => setDraft(null)}
        title={
          draft?.id
            ? t("সার্কুলার এডিট", "Edit Circular")
            : t("নতুন সার্কুলার", "New Circular")
        }
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
            <div className="grid grid-cols-2 gap-x-3">
              <Field label={t("দেশ", "Country")}>
                <TextInput
                  value={draft.country}
                  onChange={(e) => set("country", e.target.value)}
                />
              </Field>
              <Field label={t("দেশের কোড (flag)", "Country code (flag)")} hint="e.g. sa, my, ae">
                <TextInput
                  value={draft.countryCode}
                  onChange={(e) => set("countryCode", e.target.value.toLowerCase())}
                />
              </Field>
              <Field label={t("পতাকা ইমোজি", "Flag emoji")}>
                <TextInput value={draft.flag} onChange={(e) => set("flag", e.target.value)} />
              </Field>
              <Field label={t("ক্যাটাগরি", "Category")}>
                <TextInput
                  value={draft.category}
                  onChange={(e) => set("category", e.target.value)}
                />
              </Field>
              <Field label={t("পদের নাম", "Position title")}>
                <TextInput value={draft.title} onChange={(e) => set("title", e.target.value)} />
              </Field>
              <Field label={t("স্পনসর", "Sponsor")}>
                <TextInput
                  value={draft.sponsor}
                  onChange={(e) => set("sponsor", e.target.value)}
                />
              </Field>
              <Field label={t("বেতন", "Salary")}>
                <TextInput value={draft.salary} onChange={(e) => set("salary", e.target.value)} />
              </Field>
              <Field label={t("পদসংখ্যা", "Vacancy")}>
                <TextInput
                  type="number"
                  value={draft.vacancy}
                  onChange={(e) => set("vacancy", Number(e.target.value) || 0)}
                />
              </Field>
              <Field label={t("ডিউটি", "Duty hours")}>
                <TextInput value={draft.duty} onChange={(e) => set("duty", e.target.value)} />
              </Field>
              <Field label={t("থাকা-খাওয়া", "Accommodation")}>
                <TextInput
                  value={draft.accommodation}
                  onChange={(e) => set("accommodation", e.target.value)}
                />
              </Field>
              <Field label={t("ডেডলাইন", "Deadline")} hint="e.g. 30 Sep 2026">
                <TextInput
                  value={draft.deadline}
                  onChange={(e) => set("deadline", e.target.value)}
                />
              </Field>
              <Field label={t("প্রকাশের তারিখ", "Posted date")} hint="e.g. 19 Aug 2026">
                <TextInput value={draft.posted} onChange={(e) => set("posted", e.target.value)} />
              </Field>
            </div>

            <Field label={t("বিবরণ", "Description")}>
              <Textarea
                rows={3}
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
            <Field
              label={t("শর্তসমূহ", "Requirements")}
              hint={t("প্রতি লাইনে একটি", "one per line")}
            >
              <Textarea
                rows={4}
                value={draft.requirements.join("\n")}
                onChange={(e) =>
                  set(
                    "requirements",
                    e.target.value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
                  )
                }
              />
            </Field>

            <div className="grid grid-cols-2 gap-x-3">
              <Field label={t("স্ট্যাটাস", "Status")}>
                <Select
                  value={draft.status}
                  onChange={(e) => set("status", e.target.value as Circular["status"])}
                >
                  <option value="active">{t("সক্রিয়", "Active")}</option>
                  <option value="inactive">{t("নিষ্ক্রিয়", "Inactive")}</option>
                </Select>
              </Field>
              <Field label={t("সিরিয়াল (কম আগে)", "Sort order (lower first)")}>
                <TextInput
                  type="number"
                  value={draft.sortOrder}
                  onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
                />
              </Field>
            </div>

            <div className="mb-3.5 mt-1">
              <Toggle
                checked={draft.isFeatured}
                onChange={(v) => set("isFeatured", v)}
                label={t("হোম পেজে ফিচার্ড দেখান", "Show as featured on home page")}
              />
            </div>

            <Field label={t("ফিচার্ড ছবি", "Featured image")}>
              <div className="flex items-center gap-2">
                <input
                  ref={featuredFileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void upload("featured", f);
                    e.target.value = "";
                  }}
                />
                <Btn variant="ghost" onClick={() => featuredFileRef.current?.click()}>
                  {uploading === "featured" ? "..." : t("ছবি আপলোড", "Upload image")}
                </Btn>
                {draft.featuredImageUrl && (
                  <a
                    href={draft.featuredImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-blue-600 underline"
                  >
                    {t("দেখুন", "View")}
                  </a>
                )}
              </div>
            </Field>

            <Field label={t("সার্কুলার ফাইল (ছবি/PDF)", "Circular file (image / PDF)")}>
              <div className="flex items-center gap-2">
                <input
                  ref={circularFileRef}
                  type="file"
                  accept="image/*,application/pdf"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void upload("circular", f);
                    e.target.value = "";
                  }}
                />
                <Btn variant="ghost" onClick={() => circularFileRef.current?.click()}>
                  {uploading === "circular" ? "..." : t("ফাইল আপলোড", "Upload file")}
                </Btn>
                {draft.circularUrl && (
                  <a
                    href={draft.circularUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-blue-600 underline"
                  >
                    {draft.circularType?.toUpperCase()} · {t("দেখুন", "View")}
                  </a>
                )}
              </div>
            </Field>
          </div>
        )}
      </Drawer>
    </>
  );
}
