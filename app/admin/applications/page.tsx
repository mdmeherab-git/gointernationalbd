"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "@/components/admin/api";
import { useAdminLang } from "@/components/admin/AdminShell";
import {
  Btn,
  Card,
  Drawer,
  EmptyState,
  PageHeader,
  StatusBadge,
  useToast,
} from "@/components/admin/widgets";

type Application = {
  id: string;
  circular_id: string | null;
  job_title: string;
  job_country: string;
  applicant_name: string;
  phone: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
};

const STATUSES = ["new", "reviewing", "shortlisted", "rejected", "hired"] as const;

export default function ApplicationsPage() {
  const { t } = useAdminLang();
  const toast = useToast();
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState<Application | null>(null);

  const load = async () => {
    try {
      const d = await apiGet<{ applications: Application[] }>("/api/admin/applications");
      setItems(d.applications);
    } catch (e) {
      if ((e as Error).message !== "unauthorized")
        toast.push((e as Error).message, "err");
    }
  };

  useEffect(() => {
    apiGet<{ applications: Application[] }>("/api/admin/applications")
      .then((d) => setItems(d.applications))
      .catch((e) => {
        if ((e as Error).message !== "unauthorized")
          toast.push((e as Error).message, "err");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((a) => a.status === filter)),
    [items, filter],
  );

  async function setStatus(a: Application, status: string) {
    setItems((l) => l.map((x) => (x.id === a.id ? { ...x, status } : x)));
    setDetail((d) => (d && d.id === a.id ? { ...d, status } : d));
    try {
      await apiSend(`/api/admin/applications/${a.id}`, "PATCH", { status });
    } catch (e) {
      toast.push((e as Error).message, "err");
      await load();
    }
  }

  async function remove(a: Application) {
    if (!confirm(t("এই আবেদনটি মুছে ফেলবেন?", "Delete this application?"))) return;
    try {
      await apiSend(`/api/admin/applications/${a.id}`, "DELETE");
      setItems((l) => l.filter((x) => x.id !== a.id));
      setDetail(null);
      toast.push(t("মুছে ফেলা হয়েছে", "Deleted"));
    } catch (e) {
      toast.push((e as Error).message, "err");
    }
  }

  function exportCsv() {
    const head = [
      "Name",
      "Phone",
      "Email",
      "Position",
      "Country",
      "Status",
      "Date",
      "Message",
    ];
    const rows = filtered.map((a) => [
      a.applicant_name,
      a.phone,
      a.email,
      a.job_title,
      a.job_country,
      a.status,
      (a.created_at || "").slice(0, 19),
      (a.message || "").replace(/\s+/g, " "),
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `applications-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title={t("আবেদনসমূহ", "Applications")}
        subtitle={t(
          "ওয়েবসাইট থেকে আসা চাকরির আবেদন।",
          "Job applications submitted from the website.",
        )}
        action={
          <Btn variant="ghost" onClick={exportCsv}>
            ⬇ {t("CSV ডাউনলোড", "Export CSV")}
          </Btn>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            filter === "all" ? "bg-[#0B4DBB] text-white" : "bg-white text-gray-600 border border-gray-200"
          }`}
        >
          {t("সব", "All")} ({items.length})
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
              filter === s ? "bg-[#0B4DBB] text-white" : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            {s} ({items.filter((a) => a.status === s).length})
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">{t("আবেদনকারী", "Applicant")}</th>
                <th className="px-5 py-3">{t("পদ / দেশ", "Position / Country")}</th>
                <th className="px-5 py-3">{t("তারিখ", "Date")}</th>
                <th className="px-5 py-3">{t("স্ট্যাটাস", "Status")}</th>
                <th className="px-5 py-3 text-right">{t("অ্যাকশন", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-bold">{a.applicant_name}</p>
                    <p className="text-[11px] text-gray-500">{a.phone}</p>
                  </td>
                  <td className="px-5 py-3">
                    {a.job_title || "—"}
                    <span className="text-[11px] text-gray-500"> · {a.job_country || "—"}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {(a.created_at || "").slice(0, 10)}
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={a.status}
                      onChange={(e) => setStatus(a, e.target.value)}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold capitalize"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setDetail(a)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:text-blue-600"
                      >
                        {t("দেখুন", "View")}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(a)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
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
          <EmptyState text={t("কোনো আবেদন নেই", "No applications")} />
        )}
      </Card>

      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={t("আবেদনের বিস্তারিত", "Application detail")}
        footer={
          detail && (
            <Btn variant="danger" onClick={() => remove(detail)}>
              {t("মুছে ফেলুন", "Delete")}
            </Btn>
          )
        }
      >
        {detail && (
          <div className="space-y-3 text-sm">
            <Row label={t("নাম", "Name")} value={detail.applicant_name} />
            <Row label={t("মোবাইল", "Phone")} value={detail.phone} />
            <Row label={t("ইমেইল", "Email")} value={detail.email || "—"} />
            <Row label={t("পদ", "Position")} value={detail.job_title || "—"} />
            <Row label={t("দেশ", "Country")} value={detail.job_country || "—"} />
            <Row
              label={t("তারিখ", "Submitted")}
              value={(detail.created_at || "").slice(0, 19).replace("T", " ")}
            />
            <div>
              <p className="mb-1 text-xs font-bold text-gray-600">{t("বার্তা", "Message")}</p>
              <p className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                {detail.message || "—"}
              </p>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-bold text-gray-600">{t("স্ট্যাটাস", "Status")}</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(detail, s)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
                      detail.status === s
                        ? "bg-[#0B4DBB] text-white"
                        : "border border-gray-200 bg-white text-gray-600"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-2">
              <StatusBadge status={detail.status} />
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
      <span className="text-xs font-bold text-gray-500">{label}</span>
      <span className="text-right text-sm text-gray-800">{value}</span>
    </div>
  );
}
