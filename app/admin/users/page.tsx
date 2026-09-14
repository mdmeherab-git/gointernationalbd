"use client";

import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/components/admin/api";
import { useAdminLang } from "@/components/admin/AdminShell";
import {
  Btn,
  Card,
  Drawer,
  EmptyState,
  PageHeader,
  StatusBadge,
  TextInput,
  UserAvatar,
  useToast,
} from "@/components/admin/widgets";

type AdminUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  profile_photo_key: string;
  passport_number: string;
  passport_issue: string;
  passport_expiry: string;
  status: string;
  phone_verified: number;
  created_at: string;
  updated_at: string;
};

const STATUSES = ["active", "disabled"] as const;
const LIMIT = 20;

export default function AdminUsersPage() {
  const { t } = useAdminLang();
  const toast = useToast();

  const [items, setItems] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"all" | "active" | "disabled">("all");
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AdminUser | null>(null);

  // Debounce the search box so we don't hit the API on every keystroke.
  // Resetting to page 1 here (inside the timeout callback, not the effect
  // body itself) keeps a stale page number from being combined with a new
  // search term.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function changeStatus(next: "all" | "active" | "disabled") {
    setStatus(next);
    setPage(1);
  }

  useEffect(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(LIMIT),
      status,
    });
    if (q) params.set("q", q);

    apiGet<{ users: AdminUser[]; total: number }>(`/api/admin/users?${params}`)
      .then((d) => {
        setItems(d.users);
        setTotal(d.total);
      })
      .catch((e) => {
        if ((e as Error).message !== "unauthorized") toast.push((e as Error).message, "err");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, q]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  async function setUserStatus(user: AdminUser, next: string) {
    setItems((l) => l.map((u) => (u.id === user.id ? { ...u, status: next } : u)));
    setDetail((d) => (d && d.id === user.id ? { ...d, status: next } : d));
    try {
      await apiSend(`/api/admin/users/${user.id}`, "PATCH", { status: next });
      toast.push(
        next === "active" ? t("সক্রিয় করা হয়েছে", "Activated") : t("নিষ্ক্রিয় করা হয়েছে", "Disabled"),
      );
    } catch (e) {
      toast.push((e as Error).message, "err");
      setItems((l) => l.map((u) => (u.id === user.id ? { ...u, status: user.status } : u)));
      setDetail((d) => (d && d.id === user.id ? { ...d, status: user.status } : d));
    }
  }

  async function removeUser(user: AdminUser) {
    if (
      !confirm(
        t(
          "আপনি কি এই ইউজার অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলতে চান?",
          "Are you sure you want to permanently delete this user?",
        ),
      )
    )
      return;
    try {
      await apiSend(`/api/admin/users/${user.id}`, "DELETE");
      setItems((l) => l.filter((u) => u.id !== user.id));
      setTotal((n) => Math.max(0, n - 1));
      setDetail(null);
      toast.push(t("ইউজার মুছে ফেলা হয়েছে", "User deleted"));
    } catch (e) {
      toast.push((e as Error).message, "err");
    }
  }

  return (
    <>
      <PageHeader
        title={t("রেজিস্টার্ড ইউজার", "Registered Users")}
        subtitle={t(
          "ওয়েবসাইটে নিবন্ধিত সকল ইউজার।",
          "All users registered on the website.",
        )}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TextInput
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t(
            "নাম, মোবাইল, Gmail বা Passport দিয়ে খুঁজুন...",
            "Search by name, mobile, Gmail or passport...",
          )}
          className="sm:max-w-xs"
        />

        <div className="flex flex-wrap gap-2">
          {(["all", "active", "disabled"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => changeStatus(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                status === s ? "bg-[#0B4DBB] text-white" : "border border-gray-200 bg-white text-gray-600"
              }`}
            >
              {s === "all" && t("সব", "All")}
              {s === "active" && t("সক্রিয়", "Active")}
              {s === "disabled" && t("নিষ্ক্রিয়", "Disabled")}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">{t("প্রোফাইল", "Profile")}</th>
                <th className="px-5 py-3">{t("নাম", "Name")}</th>
                <th className="px-5 py-3">{t("মোবাইল", "Mobile")}</th>
                <th className="px-5 py-3">Gmail</th>
                <th className="px-5 py-3">{t("পাসপোর্ট", "Passport")}</th>
                <th className="px-5 py-3">{t("নিবন্ধনের তারিখ", "Registration Date")}</th>
                <th className="px-5 py-3">{t("স্ট্যাটাস", "Status")}</th>
                <th className="px-5 py-3 text-right">{t("অ্যাকশন", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <UserAvatar user={u} />
                  </td>
                  <td className="px-5 py-3 font-semibold">{u.name}</td>
                  <td className="px-5 py-3">{u.phone}</td>
                  <td className="px-5 py-3">{u.email || "—"}</td>
                  <td className="px-5 py-3">{u.passport_number || "—"}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {(u.created_at || "").slice(0, 10)}
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={u.status}
                      onChange={(e) => setUserStatus(u, e.target.value)}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold capitalize"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s === "active" ? t("সক্রিয়", "Active") : t("নিষ্ক্রিয়", "Disabled")}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setDetail(u)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:text-blue-600"
                      >
                        {t("দেখুন", "View")}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeUser(u)}
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
        {!loading && items.length === 0 && (
          <EmptyState text={t("কোনো ইউজার পাওয়া যায়নি", "No users found")} />
        )}

        {!loading && total > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
            <span>
              {t(`পৃষ্ঠা ${page} / ${totalPages}`, `Page ${page} of ${totalPages}`)} · {total}{" "}
              {t("জন ইউজার", "users")}
            </span>
            <div className="flex gap-2">
              <Btn
                variant="ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← {t("আগের", "Previous")}
              </Btn>
              <Btn
                variant="ghost"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                {t("পরের", "Next")} →
              </Btn>
            </div>
          </div>
        )}
      </Card>

      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={t("ইউজারের বিস্তারিত", "User detail")}
        footer={
          detail && (
            <Btn variant="danger" onClick={() => removeUser(detail)}>
              {t("মুছে ফেলুন", "Delete")}
            </Btn>
          )
        }
      >
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="mb-4 flex items-center gap-3">
              <UserAvatar user={detail} size={64} />
              <div>
                <p className="font-extrabold text-[#0B2A55]">{detail.name}</p>
                <StatusBadge status={detail.status} />
              </div>
            </div>

            <Row label={t("মোবাইল", "Mobile")} value={detail.phone} />
            <Row label="Gmail" value={detail.email || "—"} />
            <Row label={t("পাসপোর্ট নম্বর", "Passport Number")} value={detail.passport_number || "—"} />
            <Row
              label={t("পাসপোর্ট ইস্যুর তারিখ", "Passport Issue Date")}
              value={detail.passport_issue || "—"}
            />
            <Row
              label={t("পাসপোর্ট মেয়াদ শেষের তারিখ", "Passport Expiry Date")}
              value={detail.passport_expiry || "—"}
            />
            <Row
              label={t("মোবাইল যাচাই", "Phone Verified")}
              value={detail.phone_verified ? t("হ্যাঁ", "Yes") : t("না", "No")}
            />
            <Row
              label={t("নিবন্ধনের তারিখ", "Registration Date")}
              value={(detail.created_at || "").slice(0, 19).replace("T", " ")}
            />
            <Row
              label={t("সর্বশেষ আপডেট", "Last Updated")}
              value={(detail.updated_at || "").slice(0, 19).replace("T", " ")}
            />

            <div className="pt-2">
              <p className="mb-1.5 text-xs font-bold text-gray-600">{t("অ্যাকাউন্ট স্ট্যাটাস", "Account Status")}</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setUserStatus(detail, s)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      detail.status === s
                        ? "bg-[#0B4DBB] text-white"
                        : "border border-gray-200 bg-white text-gray-600"
                    }`}
                  >
                    {s === "active" ? t("সক্রিয়", "Active") : t("নিষ্ক্রিয়", "Disabled")}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
      <span className="text-xs font-bold text-gray-500">{label}</span>
      <span className="text-right text-sm text-gray-800">{value}</span>
    </div>
  );
}
