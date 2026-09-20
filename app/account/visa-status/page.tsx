"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type VisaStatus = {
  medical_status: string;
  visa_status: string;
  flight_status: string;
  flight_date: string;
  flight_airline: string;
  flight_pnr: string;
  remarks: string;
  updated_at: string | null;
};

const MEDICAL_LABEL: Record<string, string> = {
  not_started: "শুরু হয়নি",
  in_progress: "চলমান",
  fit: "ফিট",
  unfit: "আনফিট",
  completed: "সম্পন্ন",
};
const VISA_LABEL: Record<string, string> = {
  not_started: "শুরু হয়নি",
  processing: "প্রসেসিং চলছে",
  running: "চলমান",
  issued: "ইস্যু হয়েছে",
  rejected: "প্রত্যাখ্যাত",
  completed: "সম্পন্ন",
};
const FLIGHT_LABEL: Record<string, string> = {
  not_scheduled: "নির্ধারিত হয়নি",
  pending: "পেন্ডিং",
  confirmed: "কনফার্ম হয়েছে",
  completed: "সম্পন্ন",
  cancelled: "বাতিল",
};

/* Determines which timeline step is "current" from the three status
   fields, so the whole page has one coherent progress indicator instead
   of three independent ones the user has to reconcile themselves. */
function currentStep(s: VisaStatus): number {
  if (s.flight_status === "completed") return 5;
  if (s.flight_status === "confirmed" || s.flight_status === "pending") return 4;
  if (s.visa_status === "issued" || s.visa_status === "completed") return 3;
  if (s.visa_status === "processing" || s.visa_status === "running") return 2;
  if (s.medical_status === "fit" || s.medical_status === "completed") return 2;
  if (s.medical_status === "in_progress") return 1;
  return 0;
}

const STEPS = [
  { label: "আবেদন", en: "Application" },
  { label: "মেডিকেল", en: "Medical" },
  { label: "মেডিকেল ফিট", en: "Medical Fit" },
  { label: "ভিসা প্রসেসিং", en: "Visa Processing" },
  { label: "ভিসা ইস্যু", en: "Visa Issued" },
  { label: "ফ্লাইট কনফার্ম", en: "Flight Confirmed" },
];

export default function AccountVisaStatusPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<VisaStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/account/visa-status", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/account/login");
          return;
        }
        const data = (await res.json().catch(() => ({}))) as { status?: VisaStatus };
        if (!cancelled) setStatus(data.status ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb]">
        <p className="text-sm text-gray-500">লোড হচ্ছে... / Loading...</p>
      </div>
    );
  }
  if (!status) return null;

  const step = currentStep(status);

  return (
    <div className="min-h-screen bg-[#f5f7fb] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/account" className="mb-4 inline-block text-sm font-semibold text-gray-500 hover:text-blue-600">
          ← ড্যাশবোর্ড / Dashboard
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <h1 className="mb-6 text-xl font-extrabold text-[#0B2A55]">ভিসা স্ট্যাটাস / Visa Status</h1>

          {/* TIMELINE */}
          <div className="mb-8">
            {STEPS.map((s, i) => {
              const done = i <= step;
              return (
                <div key={s.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        done ? "bg-[#0B4DBB] text-white" : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`h-8 w-0.5 ${i < step ? "bg-[#0B4DBB]" : "bg-gray-200"}`} />
                    )}
                  </div>
                  <div className={`pb-8 ${done ? "text-[#0B2A55]" : "text-gray-400"}`}>
                    <p className="text-sm font-bold">{s.label}</p>
                    <p className="text-xs">{s.en}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* STATUS CARDS */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-500">🩺 Medical</p>
              <p className="mt-1 text-sm font-bold text-[#0B2A55]">
                {MEDICAL_LABEL[status.medical_status] ?? status.medical_status}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-500">🛂 Visa Processing</p>
              <p className="mt-1 text-sm font-bold text-[#0B2A55]">
                {VISA_LABEL[status.visa_status] ?? status.visa_status}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-500">✈️ Flight</p>
              <p className="mt-1 text-sm font-bold text-[#0B2A55]">
                {FLIGHT_LABEL[status.flight_status] ?? status.flight_status}
              </p>
            </div>
          </div>

          {(status.flight_date || status.flight_airline || status.flight_pnr) && (
            <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
              {status.flight_airline && <p>Airline: {status.flight_airline}</p>}
              {status.flight_date && <p>Flight Date: {status.flight_date}</p>}
              {status.flight_pnr && <p>PNR: {status.flight_pnr}</p>}
            </div>
          )}

          {status.remarks && (
            <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              <p className="mb-1 font-bold">📝 Remarks (Admin)</p>
              <p>{status.remarks}</p>
            </div>
          )}

          {status.updated_at && (
            <p className="mt-4 text-xs text-gray-400">
              সর্বশেষ আপডেট / Last Updated: {status.updated_at.slice(0, 19).replace("T", " ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
