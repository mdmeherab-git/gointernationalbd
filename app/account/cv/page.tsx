"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CvBuilder from "@/components/CvBuilder";
import type { CvData } from "@/types/cv";

export default function AccountCvPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savedData, setSavedData] = useState<CvData | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "build">("view");
  const [downloading, setDownloading] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/account/cv", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/account/login");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { data?: CvData | null; updatedAt?: string | null };
      setSavedData(data.data ?? null);
      setUpdatedAt(data.updatedAt ?? null);
      setMode(data.data ? "view" : "build");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function downloadSavedPdf() {
    if (!savedData) return;
    setDownloading(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { default: CvPdfDocument } = await import("@/components/CvPdfDocument");
      const blob = await pdf(<CvPdfDocument data={savedData} showWatermark={true} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${savedData.fullName || "cv"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
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
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/account" className="mb-4 inline-block text-sm font-semibold text-gray-500 hover:text-blue-600">
          ← ড্যাশবোর্ড / Dashboard
        </Link>

        {mode === "view" && savedData && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <h1 className="mb-1 text-xl font-extrabold text-[#0B2A55]">আমার CV / My CV</h1>
            {updatedAt && (
              <p className="mb-6 text-xs text-gray-400">
                সর্বশেষ আপডেট / Last updated: {updatedAt.slice(0, 19).replace("T", " ")}
              </p>
            )}

            <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white text-2xl text-gray-400">
                {savedData.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={savedData.photo} alt={savedData.fullName} className="h-full w-full object-cover" />
                ) : (
                  "📄"
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-[#0B2A55]">{savedData.fullName || "—"}</p>
                <p className="truncate text-sm text-gray-500">{savedData.jobTitle || "—"}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={downloading}
                onClick={downloadSavedPdf}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0B4DBB] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#093f98] disabled:opacity-60"
              >
                {downloading ? "তৈরি হচ্ছে... / Generating..." : "📄 Download PDF"}
              </button>
              <button
                type="button"
                onClick={() => setMode("build")}
                className="flex-1 rounded-xl border border-gray-300 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                ✏️ Edit CV / রিবিল্ড করুন
              </button>
            </div>
          </div>
        )}

        {mode === "view" && !savedData && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-4xl">📄</p>
            <h1 className="mt-3 text-lg font-extrabold text-[#0B2A55]">এখনো কোনো CV তৈরি হয়নি</h1>
            <p className="mt-1 text-sm text-gray-500">You haven&apos;t built a CV yet.</p>
            <button
              type="button"
              onClick={() => setMode("build")}
              className="mt-6 rounded-xl bg-[#0B4DBB] px-6 py-3 text-sm font-bold text-white hover:bg-[#093f98]"
            >
              📄 CV তৈরি করুন / Build CV
            </button>
          </div>
        )}

        {mode === "build" && (
          <div className="mt-4">
            <CvBuilder
              isBangla={true}
              initialData={savedData ?? undefined}
              onSaved={async () => {
                await load();
                setMode("view");
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
