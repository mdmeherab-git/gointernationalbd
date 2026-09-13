"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserLoginPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
      };

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
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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