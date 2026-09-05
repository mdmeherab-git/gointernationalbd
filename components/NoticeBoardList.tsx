"use client";

import { useEffect, useState } from "react";

/* =========================================================
   NOTICE BOARD LIST — now data-driven from Supabase
   Fetches from /api/notices (public, read-only) instead of
   a hardcoded array. Managed from /admin/notices.
========================================================= */

type Notice = {
  id: number;
  title_bn: string;
  title_en: string;
  notice_date: string;
  tag_type: "new" | "general" | "report";
  tag_label_bn: string;
  tag_label_en: string;
};

const TAG_STYLES: Record<string, string> = {
  new: "bg-red-50 text-red-600",
  general: "bg-amber-50 text-amber-700",
  report: "bg-amber-50 text-amber-700",
};

const FALLBACK_NOTICES: Notice[] = [
  {
    id: 1,
    title_bn: "সম্প্রতি সংযুক্ত আরব আমিরাতে ভিসা বাতিল হওয়া প্রবাসী বাংলাদেশি নাগরিকদের তথ্য নিম্নে দেখুন",
    title_en: "Information on Bangladeshi nationals whose UAE visas were recently cancelled",
    notice_date: "2026-09-01",
    tag_type: "new",
    tag_label_bn: "নতুন",
    tag_label_en: "New",
  },
  {
    id: 2,
    title_bn: "৩ ক্যাটাগরিতে বাণিজ্যিক গুরুত্বপূর্ণ ব্যক্তি (অনিবাসী বাংলাদেশি)-২০২৭ নির্বাচন সংক্রান্ত বিজ্ঞপ্তি",
    title_en: "Notice on the 2027 selection of commercially important persons (NRB) in 3 categories",
    notice_date: "2026-08-30",
    tag_type: "new",
    tag_label_bn: "নতুন",
    tag_label_en: "New",
  },
  {
    id: 3,
    title_bn: "বার্ষিক ক্রয় পরিকল্পনা ২০২৬-২৭",
    title_en: "Annual procurement plan 2026-27",
    notice_date: "2026-08-17",
    tag_type: "report",
    tag_label_bn: "বিভিন্ন প্রতিবেদন",
    tag_label_en: "Reports",
  },
];

export default function NoticeBoardList({ isBangla }: { isBangla: boolean }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notices")
      .then((res) => {
        if (!res.ok) throw new Error("not ready");
        return res.json();
      })
      .then((json) => {
        setNotices(json.notices && json.notices.length > 0 ? json.notices : FALLBACK_NOTICES);
      })
      .catch(() => {
        // Database/API not set up yet — show sample notices so the
        // design is still visible and reviewable.
        setNotices(FALLBACK_NOTICES);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-xl md:p-8">

      <div className="mb-4 flex items-center gap-2">
        <span className="text-lg text-green-600">📋</span>
        <h2 className="text-lg font-bold text-[#0B2A55]">
          {isBangla ? "নোটিশ বোর্ড" : "Notice Board"}
        </h2>
      </div>

      {loading && (
        <p className="py-6 text-center text-sm text-gray-400">
          {isBangla ? "লোড হচ্ছে..." : "Loading..."}
        </p>
      )}

      {!loading && notices.length === 0 && (
        <p className="py-6 text-center text-sm text-gray-400">
          {isBangla ? "এখন কোনো নোটিস নেই" : "No notices right now"}
        </p>
      )}

      <div className="flex-1 divide-y divide-gray-100">
        {notices.map((notice) => (
          <div key={notice.id} className="flex items-start gap-2 py-3 first:pt-0">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />

            <div className="flex-1">
              <p className="text-sm leading-6 text-gray-800">
                {isBangla ? notice.title_bn : notice.title_en}
              </p>

              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span>📅 {notice.notice_date}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TAG_STYLES[notice.tag_type]}`}>
                  {isBangla ? notice.tag_label_bn : notice.tag_label_en}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mt-4 w-full rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700"
      >
        {isBangla ? "সকল নোটিশ দেখুন →" : "View All Notices →"}
      </button>
    </div>
  );
}
