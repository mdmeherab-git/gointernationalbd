"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Application = {
  id: string;
  circular_id: string | null;
  job_title: string;
  job_country: string;
  applicant_name: string;
  phone: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
};

const STATUS_LABEL: Record<string, { bn: string; cls: string }> = {
  new: { bn: "নতুন", cls: "bg-blue-50 text-blue-700" },
  reviewing: { bn: "পর্যালোচনাধীন", cls: "bg-amber-50 text-amber-700" },
  shortlisted: { bn: "শর্টলিস্টেড", cls: "bg-purple-50 text-purple-700" },
  rejected: { bn: "প্রত্যাখ্যাত", cls: "bg-red-50 text-red-600" },
  hired: { bn: "নিয়োগপ্রাপ্ত", cls: "bg-green-50 text-green-700" },
};

export default function AccountApplicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/account/applications", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/account/login");
          return;
        }
        const data = (await res.json().catch(() => ({}))) as { applications?: Application[] };
        if (!cancelled) setApplications(data.applications ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f5f7fb] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/account" className="mb-4 inline-block text-sm font-semibold text-gray-500 hover:text-blue-600">
          ← ড্যাশবোর্ড / Dashboard
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <h1 className="mb-6 text-xl font-extrabold text-[#0B2A55]">আমার আবেদন / My Applications</h1>

          {loading && <p className="py-6 text-center text-sm text-gray-400">লোড হচ্ছে... / Loading...</p>}

          {!loading && applications.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-4xl">💼</p>
              <p className="mt-3 text-sm text-gray-500">
                আপনি এখনো কোনো চাকরিতে আবেদন করেননি। / You haven&apos;t applied to any job yet.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {applications.map((app) => {
              const status = STATUS_LABEL[app.status] ?? { bn: app.status, cls: "bg-gray-100 text-gray-600" };
              return (
                <div key={app.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#0B2A55]">{app.job_title || "—"}</p>
                      <p className="truncate text-sm text-gray-500">{app.job_country}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.cls}`}>
                      {status.bn}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                    <span>আবেদন নম্বর / ID: {app.id}</span>
                    <span>আবেদনের তারিখ / Applied: {app.created_at?.slice(0, 10)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
