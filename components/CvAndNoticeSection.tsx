"use client";

import NoticeBoardList from "./NoticeBoardList";

/* =========================================================
   Notice Board — shown on its own, centred, at a comfortable
   reading width. (The CV builder used to sit beside it; it now
   opens from the "সিভি তৈরি করুন" card in Quick Services.)
========================================================= */

export default function CvAndNoticeSection({ isBangla }: { isBangla: boolean }) {
  return (
    <section className="mx-[192px] py-10 max-md:mx-4">
      <div className="mx-auto max-w-2xl">
        <NoticeBoardList isBangla={isBangla} />
      </div>
    </section>
  );
}
