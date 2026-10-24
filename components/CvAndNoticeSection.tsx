"use client";

import NoticeBoardList from "./NoticeBoardList";

/* =========================================================
   Notice Board — full section width, matching the rest of
   the site's content sections (site-x). The CV
   builder that used to sit beside it now opens from the
   "সিভি তৈরি করুন" card in Quick Services.
========================================================= */

export default function CvAndNoticeSection({ isBangla }: { isBangla: boolean }) {
  return (
    <section id="news" className="site-x py-10 max-md:mx-0 max-md:px-6">
      <NoticeBoardList isBangla={isBangla} />
    </section>
  );
}
