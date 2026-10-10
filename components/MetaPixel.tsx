"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initMetaPixel, trackPixel } from "../lib/meta-pixel";

/* Loads the Meta Pixel once and reports a PageView on every route change.
   The admin dashboard is never tracked. */
export default function MetaPixel() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (isAdmin) return;

    initMetaPixel();
    trackPixel("PageView");
  }, [pathname, isAdmin]);

  return null;
}
