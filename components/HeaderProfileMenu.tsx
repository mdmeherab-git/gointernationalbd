"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  profilePhotoKey: string;
};

/**
 * Profile icon + dropdown for page headers that don't carry their own
 * (the home page has an inline copy of the same menu).
 * Guests: Login / Registration buttons and what registering gives them.
 * Signed in: the account links and Logout.
 */
export default function HeaderProfileMenu({ isBangla }: { isBangla: boolean }) {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json().catch(() => ({})))
      .then((d: { authenticated?: boolean; user?: User | null }) => {
        if (!cancelled) setUser(d.authenticated && d.user ? d.user : null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const close = () => setOpen(false);
  const item =
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50";

  async function logout() {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Logout failed");
      setUser(null);
      setOpen(false);
      window.location.href = "/";
    } catch {
      alert("Logout করা যায়নি। আবার চেষ্টা করুন।");
    }
  }

  const avatar = (text: string) =>
    user?.profilePhotoKey ? (
      <img
        src="/api/auth/profile-photo"
        alt={user.name}
        className="h-full w-full object-cover object-top"
      />
    ) : (
      <span className={text}>👤</span>
    );

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Profile"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-gray-300 bg-gray-100 text-gray-600 hover:border-blue-400 hover:bg-gray-50 max-md:h-9 max-md:w-9"
      >
        {avatar("text-2xl max-md:text-xl")}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close profile menu"
            onClick={close}
            className="fixed inset-0 z-40"
          />

          <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            {user ? (
              <>
                <div className="border-b border-gray-100 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-2xl">
                      {avatar("")}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#0B2A55]">{user.name}</p>
                      <p className="truncate text-xs text-gray-500">{user.email || user.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <Link href="/account/profile" onClick={close} className={item}>
                    <span>👤</span>
                    {isBangla ? "আমার প্রোফাইল" : "My Profile"}
                  </Link>
                  <Link href="/account/cv" onClick={close} className={item}>
                    <span>📄</span>
                    {isBangla ? "আমার CV" : "My CV"}
                  </Link>
                  <Link href="/account/applications" onClick={close} className={item}>
                    <span>💼</span>
                    {isBangla ? "আমার আবেদন" : "My Applications"}
                  </Link>
                  <Link href="/account/visa-status" onClick={close} className={item}>
                    <span>🌍</span>
                    {isBangla ? "ভিসা স্ট্যাটাস" : "Visa Status"}
                  </Link>
                  <Link href="/account/documents" onClick={close} className={item}>
                    <span>📋</span>
                    {isBangla ? "আমার ডকুমেন্টস" : "My Documents"}
                  </Link>
                  <Link href="/account/notifications" onClick={close} className={item}>
                    <span>🔔</span>
                    {isBangla ? "নোটিফিকেশন" : "Notifications"}
                  </Link>
                  <Link href="/account/settings" onClick={close} className={item}>
                    <span>⚙️</span>
                    {isBangla ? "অ্যাকাউন্ট সেটিংস" : "Account Settings"}
                  </Link>
                </div>

                <div className="border-t border-gray-100 p-2">
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <span>🚪</span>
                    {isBangla ? "লগআউট" : "Logout"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="border-b border-gray-100 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-2xl">
                      👤
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#0B2A55]">
                        {isBangla ? "অতিথি ব্যবহারকারী" : "Guest User"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isBangla ? "লগইন বা রেজিস্ট্রেশন করুন" : "Login or register"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/account/login"
                      onClick={close}
                      className="rounded-lg border border-[#0B4DBB] px-3 py-2 text-center text-sm font-semibold text-[#0B4DBB] hover:bg-blue-50"
                    >
                      {isBangla ? "লগইন" : "Login"}
                    </Link>
                    <Link
                      href="/register"
                      onClick={close}
                      className="rounded-lg bg-[#0B4DBB] px-3 py-2 text-center text-sm font-semibold text-white hover:bg-[#093f98]"
                    >
                      {isBangla ? "রেজিস্ট্রেশন" : "Register"}
                    </Link>
                  </div>

                  <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2.5">
                    <p className="mb-1.5 text-xs font-bold text-[#0B2A55]">
                      {isBangla ? "রেজিস্ট্রেশন করলে যা পাবেন" : "What you get when you register"}
                    </p>
                    <ul className="space-y-1 text-xs text-gray-700">
                      <li>📋 {isBangla ? "আবেদনের অবস্থা ট্র্যাকিং" : "Application tracking"}</li>
                      <li>🛂 {isBangla ? "ভিসা স্ট্যাটাস আপডেট" : "Visa status updates"}</li>
                      <li>📄 {isBangla ? "সিভি তৈরি ও ডাউনলোড" : "Build and download your CV"}</li>
                      <li>📁 {isBangla ? "ডকুমেন্ট নিরাপদে সংরক্ষণ" : "Keep documents safe"}</li>
                      <li>🔔 {isBangla ? "গুরুত্বপূর্ণ নোটিফিকেশন" : "Important notifications"}</li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
