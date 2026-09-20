"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const INPUT_CLASS =
  "w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

type Profile = { name: string; email: string | null; phone: string };
type Settings = {
  notify_application: number;
  notify_visa: number;
  notify_medical: number;
  notify_general: number;
  language_pref: string;
};

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between py-2.5 text-left">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-blue-600" : "bg-gray-300"}`}>
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [settings, setSettings] = useState<Settings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const [message, setMessage] = useState<{ text: string; kind: "ok" | "err" } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profileRes, settingsRes] = await Promise.all([
          fetch("/api/auth/profile", { cache: "no-store" }),
          fetch("/api/account/settings", { cache: "no-store" }),
        ]);
        if (profileRes.status === 401) {
          router.replace("/account/login");
          return;
        }
        const profileData = (await profileRes.json().catch(() => ({}))) as { user?: Profile };
        const settingsData = (await settingsRes.json().catch(() => ({}))) as { settings?: Settings };
        if (!cancelled) {
          if (profileData.user) {
            setProfile(profileData.user);
            setName(profileData.user.name);
          }
          if (settingsData.settings) setSettings(settingsData.settings);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function notify(text: string, kind: "ok" | "err" = "ok") {
    setMessage({ text, kind });
    setTimeout(() => setMessage(null), 4000);
  }

  async function saveAccountInfo(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email: profile?.email ?? "" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        notify(data.error || "আপডেট করা যায়নি / Could not update", "err");
        return;
      }
      notify("তথ্য আপডেট হয়েছে / Updated");
    } finally {
      setSavingProfile(false);
    }
  }

  async function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    if (!settings) return;
    const prev = settings;
    setSettings({ ...settings, [key]: value });
    setSavingSettings(true);
    try {
      const res = await fetch("/api/account/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) {
        setSettings(prev);
        notify("সেটিংস সংরক্ষণ করা যায়নি / Could not save setting", "err");
      }
    } finally {
      setSavingSettings(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPassword(true);
    try {
      const res = await fetch("/api/account/settings/password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        notify(data.error || "Password পরিবর্তন করা যায়নি / Could not change password", "err");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notify("Password পরিবর্তন হয়েছে / Password changed");
    } finally {
      setSavingPassword(false);
    }
  }

  async function deactivateAccount() {
    setDeactivating(true);
    try {
      const res = await fetch("/api/account/settings/deactivate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: deactivatePassword }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        notify(data.error || "করা যায়নি / Could not deactivate", "err");
        return;
      }
      window.location.href = "/";
    } finally {
      setDeactivating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb]">
        <p className="text-sm text-gray-500">লোড হচ্ছে... / Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Link href="/account" className="inline-block text-sm font-semibold text-gray-500 hover:text-blue-600">
          ← ড্যাশবোর্ড / Dashboard
        </Link>

        <h1 className="text-xl font-extrabold text-[#0B2A55]">⚙️ অ্যাকাউন্ট সেটিংস / Account Settings</h1>

        {message && (
          <p
            className={`rounded-lg px-4 py-3 text-sm font-semibold ${
              message.kind === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}

        {/* ACCOUNT INFORMATION */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-gray-500">Account Information</h2>
          <form onSubmit={saveAccountInfo} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">নাম / Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={INPUT_CLASS} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">মোবাইল / Phone</label>
              <input value={profile?.phone ?? ""} disabled className={`${INPUT_CLASS} bg-gray-100 text-gray-500`} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Gmail</label>
              <input value={profile?.email ?? ""} disabled className={`${INPUT_CLASS} bg-gray-100 text-gray-500`} />
              <p className="mt-1 text-xs text-gray-400">
                Email পরিবর্তন করতে{" "}
                <Link href="/account/profile" className="text-blue-600 hover:underline">
                  আমার প্রোফাইল
                </Link>{" "}
                পাতায় যান।
              </p>
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-xl bg-[#0B4DBB] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#093f98] disabled:opacity-60"
            >
              {savingProfile ? "..." : "Save"}
            </button>
          </form>
        </div>

        {/* SECURITY */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-gray-500">Security — Change Password</h2>
          <form onSubmit={changePassword} className="space-y-4">
            <input
              type="password"
              placeholder="বর্তমান Password / Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={INPUT_CLASS}
            />
            <input
              type="password"
              placeholder="নতুন Password / New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={INPUT_CLASS}
            />
            <input
              type="password"
              placeholder="নতুন Password নিশ্চিত করুন / Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={INPUT_CLASS}
            />
            <button
              type="submit"
              disabled={savingPassword}
              className="rounded-xl bg-[#0B4DBB] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#093f98] disabled:opacity-60"
            >
              {savingPassword ? "..." : "Change Password"}
            </button>
          </form>
        </div>

        {/* NOTIFICATION SETTINGS */}
        {settings && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-gray-500">Notification Settings</h2>
            <div className="divide-y divide-gray-100">
              <Toggle
                checked={!!settings.notify_application}
                onChange={(v) => updateSetting("notify_application", v ? 1 : 0)}
                label="আবেদন আপডেট / Application updates"
              />
              <Toggle
                checked={!!settings.notify_visa}
                onChange={(v) => updateSetting("notify_visa", v ? 1 : 0)}
                label="ভিসা আপডেট / Visa updates"
              />
              <Toggle
                checked={!!settings.notify_medical}
                onChange={(v) => updateSetting("notify_medical", v ? 1 : 0)}
                label="মেডিকেল আপডেট / Medical updates"
              />
              <Toggle
                checked={!!settings.notify_general}
                onChange={(v) => updateSetting("notify_general", v ? 1 : 0)}
                label="সাধারণ নোটিফিকেশন / General notifications"
              />
            </div>
            {savingSettings && <p className="mt-2 text-xs text-gray-400">সংরক্ষণ হচ্ছে... / Saving...</p>}
          </div>
        )}

        {/* LANGUAGE */}
        {settings && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-gray-500">Language</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateSetting("language_pref", "bn")}
                className={`rounded-xl px-4 py-2 text-sm font-bold ${
                  settings.language_pref === "bn" ? "bg-[#0B4DBB] text-white" : "border border-gray-200 text-gray-600"
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => updateSetting("language_pref", "en")}
                className={`rounded-xl px-4 py-2 text-sm font-bold ${
                  settings.language_pref === "en" ? "bg-[#0B4DBB] text-white" : "border border-gray-200 text-gray-600"
                }`}
              >
                English
              </button>
            </div>
          </div>
        )}

        {/* PRIVACY */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-gray-500">Privacy</h2>
          <button
            type="button"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
              window.location.href = "/";
            }}
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            🚪 বর্তমান সেশন থেকে লগআউট / Logout this session
          </button>
        </div>

        {/* DANGER ZONE */}
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm md:p-8">
          <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-red-600">Danger Zone</h2>
          <p className="mb-4 text-sm text-red-700">
            অ্যাকাউন্ট নিষ্ক্রিয় করলে আপনি আর লগইন করতে পারবেন না। প্রয়োজনে আমাদের সাথে যোগাযোগ করুন।
          </p>

          {!deactivateOpen ? (
            <button
              type="button"
              onClick={() => setDeactivateOpen(true)}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            >
              Delete Account / অ্যাকাউন্ট নিষ্ক্রিয় করুন
            </button>
          ) : (
            <div className="space-y-3">
              <input
                type="password"
                placeholder="নিশ্চিত করতে Password দিন / Enter password to confirm"
                value={deactivatePassword}
                onChange={(e) => setDeactivatePassword(e.target.value)}
                className={`${INPUT_CLASS} border-red-300`}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeactivateOpen(false);
                    setDeactivatePassword("");
                  }}
                  className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-600"
                >
                  বাতিল / Cancel
                </button>
                <button
                  type="button"
                  disabled={deactivating || !deactivatePassword}
                  onClick={deactivateAccount}
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {deactivating ? "..." : "নিশ্চিত করুন / Confirm"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
