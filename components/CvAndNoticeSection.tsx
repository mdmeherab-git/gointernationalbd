"use client";

import NoticeBoardList from "./NoticeBoardList";

/* =========================================================
   Notice Board — full section width, matching the rest of
   the site's content sections (mx-[165px] px-6). The CV
   builder that used to sit beside it now opens from the
   "সিভি তৈরি করুন" card in Quick Services.
========================================================= */

export default function CvAndNoticeSection({ isBangla }: { isBangla: boolean }) {
  return (
    <section className="mx-[165px] px-6 py-10 max-md:mx-0">
      <NoticeBoardList isBangla={isBangla} />
    </section>
  );
}
