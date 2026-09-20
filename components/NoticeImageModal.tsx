"use client";

import { useEffect } from "react";

type Notice = {
  id: number | string;
  title_bn: string;
  title_en: string;
  image_url?: string | null;
};

/* =========================================================
   NOTICE IMAGE MODAL — full-size JPG popup for a notice.
   Rendered by NoticeBoardList; only ever opened for notices
   that actually have an image_url (see hasImage check there),
   so there is nothing to guard against a missing image here.
========================================================= */

function safeFilename(notice: Notice) {
  const base = (notice.title_en || notice.title_bn || `notice-${notice.id}`)
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 60);
  return `${base || `notice-${notice.id}`}.jpg`;
}

export default function NoticeImageModal({
  notice,
  isBangla,
  onClose,
}: {
  notice: Notice | null;
  isBangla: boolean;
  onClose: () => void;
}) {
  const open = Boolean(notice?.image_url);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !notice) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h3 className="truncate pr-3 text-sm font-bold text-[#0B2A55]">
            {isBangla ? "নোটিশ দেখুন" : "View Notice"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={isBangla ? "বন্ধ করুন" : "Close"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={notice.image_url ?? undefined}
            alt={isBangla ? notice.title_bn : notice.title_en}
            className="mx-auto max-w-full object-contain"
          />
        </div>

        <div className="border-t border-gray-100 p-4">
          <a
            href={notice.image_url ?? undefined}
            download={safeFilename(notice)}
            className="block w-full rounded-xl bg-[#0B4DBB] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#093f98]"
          >
            ⬇ {isBangla ? "ডাউনলোড করুন" : "Download"}
          </a>
        </div>
      </div>
    </div>
  );
}
