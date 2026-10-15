"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserLoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Set after an admin reset: the typed password is a temporary one and a new
  // one must be chosen before the account can be used.
  const [mustChange, setMustChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("নতুন Password মিলছে না / Passwords do not match");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, tempPassword: password, newPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "করা যায়নি / Could not set password");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("সংযোগে সমস্যা / Network error");
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setBusy(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          phone,
          password,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        mustChangePassword?: boolean;
      };

      if (res.status === 403 && data.mustChangePassword) {
        setMustChange(true);
        return;
      }

      if (!res.ok) {
        setError(
          data.error ||
            "Login করা যায়নি / Login failed",
        );
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("সংযোগে সমস্যা / Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4">

      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">

        {/* LOGO */}
        <div className="mb-7 text-center">
          <img
            src="/logo.svg"
            alt="GO International BD"
            className="mx-auto h-12 w-auto"
          />

          <h1 className="mt-4 text-xl font-extrabold text-[#0B2A55]">
            Login
          </h1>

          <p className="mt-1 text-xs text-gray-500">
            আপনার Account-এ Login করুন
          </p>
        </div>

        {mustChange ? (
          <form onSubmit={submitNewPassword} className="space-y-4">
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
              আপনার Password অ্যাডমিন রিসেট করেছেন। চালিয়ে যেতে নিজের জন্য একটি নতুন Password দিন (কমপক্ষে ৮ অক্ষর)।
            </p>

            <input
              type="password"
              required
              minLength={8}
              maxLength={128}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="নতুন Password / New Password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 opacity-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="password"
              required
              minLength={8}
              maxLength={128}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="নতুন Password নিশ্চিত করুন / Confirm"
              autoComplete="new-password"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 opacity-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-[#0B4DBB] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#093f98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "..." : "Password সেট করে Login করুন"}
            </button>
          </form>
        ) : (
        <form onSubmit={submit} className="space-y-4">

          {/* PHONE */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              মোবাইল নম্বর / Phone Number
            </label>

            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              maxLength={11}
              inputMode="numeric"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 opacity-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              পাসওয়ার্ড / Password
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="আপনার Password"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 opacity-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* ERROR */}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              {error}
            </p>
          )}

          {/* LOGIN */}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#0B4DBB] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#093f98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "..." : "Login করুন"}
          </button>
        </form>
        )}

        {/* REGISTER */}
        <p className="mt-5 text-center text-sm text-gray-500">
          Account নেই?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Create Account
          </Link>
        </p>

        {/* FORGOT */}
        <Link
          href="/account/forgot-password"
          className="mt-3 block text-center text-xs font-semibold text-gray-400 hover:text-blue-600"
        >
          Password ভুলে গেছেন?
        </Link>

        {/* HOME */}
        <Link
          href="/"
          className="mt-4 block text-center text-xs font-semibold text-gray-400 hover:text-blue-600"
        >
          ← ওয়েবসাইটে ফিরে যান
        </Link>

      </div>
    </div>
  );
}