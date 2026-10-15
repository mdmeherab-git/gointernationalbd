"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildWhatsappUrl } from "@/lib/whatsapp";

export default function ForgotPasswordPage() {
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");

  // The WhatsApp number / office phone are managed from /admin -> Settings.
  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/site-settings", { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const st = d?.settings;
        if (!st) return;
        setWhatsapp(String(st.contactWhatsapp || ""));
        setPhone(String(st.contactPhone || ""));
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);

  const waUrl = buildWhatsappUrl(
    whatsapp,
    "হ্যালো, আমি আমার GO International BD অ্যাকাউন্টের Password ভুলে গেছি। আমার নাম: ... , মোবাইল নম্বর: ...",
  );
  const telDigits = phone.replace(/[^\d+]/g, "");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
        <div className="mb-6 text-center">
          <img src="/logo.svg" alt="GO International BD" className="mx-auto h-12 w-auto" />
          <h1 className="mt-4 text-xl font-extrabold text-[#0B2A55]">Password ভুলে গেছেন?</h1>
          <p className="mt-1 text-xs text-gray-500">চিন্তা নেই, আমরা নতুন Password দিয়ে দেব।</p>
        </div>

        <ol className="space-y-3 text-sm text-gray-700">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-blue-700">
              ১
            </span>
            <span>
              WhatsApp বা ফোনে আমাদের জানান। আপনার <b>নাম</b> ও <b>রেজিস্ট্রেশনের মোবাইল নম্বর</b> বলুন।
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-blue-700">
              ২
            </span>
            <span>আপনার পরিচয় নিশ্চিত করে আমরা একটি অস্থায়ী Password পাঠাব।</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-blue-700">
              ৩
            </span>
            <span>
              সেই Password দিয়ে Login করুন। তারপর নিজের জন্য নতুন Password বেছে নিতে বলা হবে।
            </span>
          </li>
        </ol>

        <div className="mt-6 space-y-3">
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-xl bg-[#25D366] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#1fb857]"
            >
              WhatsApp-এ জানান
            </a>
          )}
          {telDigits && (
            <a
              href={`tel:${telDigits}`}
              className="block w-full rounded-xl border border-gray-300 px-5 py-3 text-center text-sm font-bold text-gray-700 transition hover:bg-gray-50"
            >
              ফোন করুন {phone}
            </a>
          )}
          {!waUrl && !telDigits && (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-center text-xs text-gray-500">
              আমাদের অফিসে যোগাযোগ করুন।
            </p>
          )}
        </div>

        <p className="mt-3 text-center text-[11px] text-gray-400">
          নিরাপত্তার জন্য আপনার বর্তমান Password কাউকে বলবেন না।
        </p>

        <Link
          href="/account/login"
          className="mt-5 block text-center text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Login-এ ফিরে যান
        </Link>
      </div>
    </div>
  );
}
