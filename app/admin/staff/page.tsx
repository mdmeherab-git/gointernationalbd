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
  TextInput,
  useToast,
} from "@/components/admin/widgets";
import {
  PERMISSION_LABELS,
  PERMISSION_PRESETS,
  STAFF_PERMISSIONS,
  type StaffPermission,
} from "@/lib/staff-permissions";

type Staff = {
  id: string;
  name: string;
  username: string;
  permissions: StaffPermission[];
  status: "active" | "disabled";
  created_at: string;
  last_login_at: string | null;
};

type Form = {
  id: string | null; // null = creating
  name: string;
  username: string;
  password: string;
  permissions: StaffPermission[];
  status: "active" | "disabled";
};

const EMPTY: Form = {
  id: null,
  name: "",
  username: "",
  password: "",
  permissions: [],
  status: "active",
};

// No look-alike characters, so it can be read out or typed from a message.
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generatePassword(length = 10) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

function formatTime(value: string | null) {
  if (!value) return "—";
  const d = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

export default function StaffPage() {
  const { t, isBn } = useAdminLang();
  const toast = useToast();

  const [items, setItems] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const d = await apiGet<{ staff: Staff[] }>("/api/admin/staff");
      setItems(d.staff);
    } catch (e) {
      if ((e as Error).message !== "unauthorized") toast.push((e as Error).message, "err");
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function togglePermission(p: StaffPermission) {
    setForm((f) =>
      f
        ? {
            ...f,
            permissions: f.permissions.includes(p)
              ? f.permissions.filter((x) => x !== p)
              : STAFF_PERMISSIONS.filter((x) => x === p || f.permissions.includes(x)),
          }
        : f,
    );
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      if (form.id === null) {
        await apiSend("/api/admin/staff", "POST", {
          name: form.name,
          username: form.username,
          password: form.password,
          permissions: form.permissions,
        });
        toast.push(t("সহকারী যোগ হয়েছে", "Staff added"));
      } else {
        await apiSend(`/api/admin/staff/${form.id}`, "PATCH", {
          name: form.name,
          permissions: form.permissions,
          status: form.status,
          ...(form.password ? { password: form.password } : {}),
        });
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

  async function remove() {
    if (!form || form.id === null) return;
    if (
      !confirm(
        t(
          `"${form.name}" অ্যাকাউন্টটি স্থায়ীভাবে মুছবেন? সে সাথে সাথে আর ঢুকতে পারবে না।`,
          `Permanently delete "${form.name}"? They lose access immediately.`,
        ),
      )
    )
      return;
    try {
      await apiSend(`/api/admin/staff/${form.id}`, "DELETE");
      toast.push(t("মুছে ফেলা হয়েছে", "Deleted"));
      setForm(null);
      await load();
    } catch (e) {
      toast.push((e as Error).message, "err");
    }
  }

  const creating = form?.id === null;
  const canSave =
    !!form &&
    !saving &&
    form.name.trim().length >= 2 &&
    form.permissions.length > 0 &&
    (creating ? form.username.trim().length >= 3 && form.password.length >= 8 : true);

  return (
    <>
      <PageHeader
        title={t("সহকারী ও অনুমতি", "Staff & Access")}
        subtitle={t(
          "কর্মচারীদের আলাদা লগইন দিন এবং শুধু যে সেকশনগুলো দরকার সেগুলোর অনুমতি দিন। সেটিংস, নিরাপত্তা লগ, ইউজার মোছা ও পাসওয়ার্ড রিসেট শুধু আপনার (মালিকের) হাতে থাকবে।",
          "Give employees their own login and only the sections they need. Settings, the security log, deleting users and password resets stay with you (the owner).",
        )}
        action={
          <Btn onClick={() => setForm({ ...EMPTY, password: generatePassword() })}>
            + {t("নতুন সহকারী", "Add staff")}
          </Btn>
        }
      />

      <Card className="overflow-hidden">
        {loading ? (
          <EmptyState text={t("লোড হচ্ছে...", "Loading...")} />
        ) : items.length === 0 ? (
          <EmptyState text={t("এখনো কোনো সহকারী নেই", "No staff yet")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-5 py-3">{t("নাম", "Name")}</th>
                  <th className="px-5 py-3">{t("ইউজারনেম", "Username")}</th>
                  <th className="px-5 py-3">{t("অনুমতি", "Access")}</th>
                  <th className="px-5 py-3">{t("সর্বশেষ লগইন", "Last login")}</th>
                  <th className="px-5 py-3">{t("অবস্থা", "Status")}</th>
                  <th className="px-5 py-3 text-right">{t("অ্যাকশন", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((s) => (
                  <tr key={s.id}>
                    <td className="px-5 py-3 font-semibold">{s.name}</td>
                    <td className="px-5 py-3 font-mono text-xs">{s.username}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {s.permissions.map((p) => (
                          <span
                            key={p}
                            className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700"
                          >
                            {PERMISSION_LABELS[p].icon} {isBn ? PERMISSION_LABELS[p].bn : PERMISSION_LABELS[p].en}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-500">
                      {formatTime(s.last_login_at)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          s.status === "active"
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {s.status === "active" ? t("সক্রিয়", "Active") : t("বন্ধ", "Disabled")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            id: s.id,
                            name: s.name,
                            username: s.username,
                            password: "",
                            permissions: s.permissions,
                            status: s.status,
                          })
                        }
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:text-blue-600"
                      >
                        {t("সম্পাদনা", "Edit")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Drawer
        open={!!form}
        onClose={() => setForm(null)}
        title={creating ? t("নতুন সহকারী", "New staff member") : t("সহকারী সম্পাদনা", "Edit staff member")}
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
            <Field label={t("নাম", "Name")}>
              <TextInput
                value={form.name}
                maxLength={60}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>

            <Field
              label={t("ইউজারনেম", "Username")}
              hint={
                creating
                  ? t(
                      "লগইনের সময় লাগবে। ইংরেজি ছোট হাতের অক্ষর, সংখ্যা, . _ - (৩-৩০ অক্ষর)। পরে বদলানো যাবে না।",
                      "Used to sign in. Lowercase letters, digits, . _ - (3-30 chars). Cannot be changed later.",
                    )
                  : undefined
              }
            >
              <TextInput
                value={form.username}
                disabled={!creating}
                autoCapitalize="none"
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "") })
                }
              />
            </Field>

            <Field
              label={creating ? t("পাসওয়ার্ড", "Password") : t("নতুন পাসওয়ার্ড (বদলাতে চাইলে)", "New password (to change it)")}
              hint={t(
                "কমপক্ষে ৮ অক্ষর। সহকারীকে এটা জানিয়ে দিন; সে পরে নিজে বদলাতে পারবে না, দরকারে আপনি এখানে বদলে দেবেন।",
                "At least 8 characters. Tell it to the staff member; they cannot change it themselves, you can set a new one here.",
              )}
            >
              <div className="flex gap-2">
                <TextInput
                  value={form.password}
                  autoComplete="off"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <Btn variant="ghost" onClick={() => setForm({ ...form, password: generatePassword() })}>
                  {t("তৈরি", "Generate")}
                </Btn>
              </div>
            </Field>

            <div className="pt-2">
              <p className="mb-1.5 text-xs font-bold text-gray-600">{t("দ্রুত বাছাই", "Quick presets")}</p>
              <div className="flex flex-wrap gap-2">
                {PERMISSION_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setForm({ ...form, permissions: p.permissions })}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:border-blue-300 hover:text-blue-600"
                  >
                    {isBn ? p.bn : p.en}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3">
              <p className="mb-1.5 text-xs font-bold text-gray-600">{t("কোন কোন সেকশনে ঢুকতে পারবে", "Sections they can use")}</p>
              <div className="space-y-1.5">
                {STAFF_PERMISSIONS.map((p) => (
                  <label
                    key={p}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={form.permissions.includes(p)}
                      onChange={() => togglePermission(p)}
                      className="h-4 w-4"
                    />
                    <span className="text-base">{PERMISSION_LABELS[p].icon}</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {isBn ? PERMISSION_LABELS[p].bn : PERMISSION_LABELS[p].en}
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-gray-500">
                {t(
                  "সেটিংস, নিরাপত্তা লগ, সহকারী ব্যবস্থাপনা, ইউজার মোছা ও ইউজারের পাসওয়ার্ড রিসেট কখনোই সহকারীকে দেওয়া হয় না।",
                  "Settings, the security log, staff management, deleting users and resetting user passwords are never given to staff.",
                )}
              </p>
            </div>

            {!creating && (
              <div className="pt-3">
                <p className="mb-1.5 text-xs font-bold text-gray-600">{t("অ্যাকাউন্টের অবস্থা", "Account status")}</p>
                <div className="flex gap-2">
                  {(["active", "disabled"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, status: s })}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                        form.status === s
                          ? "bg-[#0B4DBB] text-white"
                          : "border border-gray-200 bg-white text-gray-600"
                      }`}
                    >
                      {s === "active" ? t("সক্রিয়", "Active") : t("বন্ধ (ঢুকতে পারবে না)", "Disabled (cannot sign in)")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {creating && (
              <p className="pt-3 text-[11px] text-gray-500">
                {t(
                  "সহকারী লগইন পাতায় (/admin/login) \"সহকারী হিসেবে লগইন করুন\" চেপে ইউজারনেম ও পাসওয়ার্ড দিয়ে ঢুকবে।",
                  "The staff member signs in at /admin/login with \"Sign in as staff\", using this username and password.",
                )}
              </p>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
}
