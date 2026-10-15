"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/* Sends one small "page view" note to /api/track on every page change, so the
   admin can see recent visitors. Sends only the path (never the query string)
   and does nothing in the admin panel or for visitors with "Do Not Track". */
export default function VisitorTracker() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (typeof navigator !== "undefined" && navigator.doNotTrack === "1") return;

    // The referrer is only meaningful for the very first page of a visit.
    const referrer = first.current ? document.referrer : "";
    first.current = false;

    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer }),
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {
      /* tracking must never bother the visitor */
    });
  }, [pathname]);

  return null;
}
