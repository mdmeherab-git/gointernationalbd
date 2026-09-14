"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("পাসওয়ার্ড মিলছে না / Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          password,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!res.ok) {
        setError(
          data.error ||
            "রেজিস্ট্রেশন করা যায়নি / Registration failed",
        );
        return;
      }

      setSuccess(
        "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। এখন Login করুন।",
      );

      setTimeout(() => {
        router.replace("/account/login");
      }, 1000);
    } catch {
      setError("সংযোগে সমস্যা / Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">

        {/* LOGO */}
        <div className="mb-6 text-center">
          <img
            src="/logo.svg"
            alt="GO International BD"
            className="mx-auto h-12 w-auto"
          />

          <h1 className="mt-4 text-xl font-extrabold text-[#0B2A55]">
            অ্যাকাউন্ট তৈরি করুন
          </h1>

          <p className="mt-1 text-xs text-gray-500">
            Create your GO International BD account
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">

          {/* NAME */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              নাম / Full Name
            </label>

            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="আপনার পূর্ণ নাম"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 opacity-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

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

            <p className="mt-1 text-[11px] text-gray-400">
              মোবাইল নম্বর অবশ্যই দিতে হবে
            </p>
          </div>

          {/* EMAIL OPTIONAL */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              ইমেইল / Gmail{" "}
              <span className="font-normal text-gray-400">
                (Optional)
              </span>
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 opacity-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-1 text-[11px] text-gray-400">
              Password recovery-এর জন্য Gmail দেওয়া ভালো
            </p>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              পাসওয়ার্ড / Password
            </label>

            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="কমপক্ষে ৮ অক্ষর"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 opacity-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              পাসওয়ার্ড নিশ্চিত করুন / Confirm Password
            </label>

            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="পাসওয়ার্ড আবার লিখুন"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 opacity-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* ERROR */}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              {error}
            </p>
          )}

          {/* SUCCESS */}
          {success && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-600">
              {success}
            </p>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#0B4DBB] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#093f98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "..." : "অ্যাকাউন্ট তৈরি করুন"}
          </button>

        </form>

        {/* LOGIN */}
        <p className="mt-5 text-center text-sm text-gray-500">
          আগে থেকেই Account আছে?{" "}
          <Link
            href="/account/login"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Login করুন
          </Link>
        </p>

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