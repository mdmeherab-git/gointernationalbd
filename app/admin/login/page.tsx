"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "ভুল পাসওয়ার্ড / Wrong password");
        return;
      }
      const next = params.get("next");
      router.replace(next && next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch {
      setError("সংযোগে সমস্যা / Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
        <div className="mb-6 text-center">
          <img src="/logo.svg" alt="" className="mx-auto h-10 w-auto" />
          <h1 className="mt-3 text-lg font-extrabold text-[#0B2A55]">
            অ্যাডমিন লগইন
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            ড্যাশবোর্ডে ঢুকতে পাসওয়ার্ড দিন
          </p>
        </div>

        <form onSubmit={submit}>
          <input
            type="password"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="পাসওয়ার্ড / Password"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-4 w-full rounded-xl bg-[#0B4DBB] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#093f98] disabled:opacity-60"
          >
            {busy ? "..." : "লগইন করুন"}
          </button>
        </form>

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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
