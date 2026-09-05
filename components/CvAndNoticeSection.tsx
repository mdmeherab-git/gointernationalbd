"use client";

import NoticeBoardList from "./NoticeBoardList";
import CvBuilder from "./CvBuilder";

/* =========================================================
   Places the Notice Board (left) and CV Builder (right)
   side by side, together spanning the same width as the
   rest of the site's sections (mx-[192px]).
   Stacks vertically on mobile.
========================================================= */

export default function CvAndNoticeSection({ isBangla }: { isBangla: boolean }) {
  return (
    <section className="mx-[192px] py-10 max-md:mx-4">
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <NoticeBoardList isBangla={isBangla} />
        <CvBuilder isBangla={isBangla} />
      </div>
    </section>
  );
}
