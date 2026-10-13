"use client";

import { useEffect, useRef, useState } from "react";
import type { CvData } from "../types/cv";

/* =========================================================
   CV LIVE PREVIEW

   Shows the real CV PDF as an image that refreshes shortly after the
   user stops typing, so what they see is exactly what the download
   will contain. The part of the page that just changed is briefly
   highlighted so it is obvious where each field lands.
========================================================= */

const DEBOUNCE_MS = 700;
const HIGHLIGHT_MS = 1800;

type Box = { x: number; y: number; w: number; h: number };

export default function CvLivePreview({
  data,
  showWatermark = true,
  isBangla,
  className = "",
}: {
  data: CvData;
  showWatermark?: boolean;
  isBangla: boolean;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevRef = useRef<ImageData | null>(null);
  const runRef = useRef(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [refreshing, setRefreshing] = useState(false);
  const [box, setBox] = useState<Box | null>(null);
  const [width, setWidth] = useState(0);

  // Track the available width so the page is drawn at a readable size.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!width) return;
    const run = ++runRef.current;
    setRefreshing(true);

    const timer = setTimeout(async () => {
      try {
        const [{ pdf }, { default: CvPdfDocument }, pdfjs] = await Promise.all([
          import("@react-pdf/renderer"),
          import("./CvPdfDocument"),
          import("pdfjs-dist/legacy/build/pdf.mjs"),
        ]);
        if (run !== runRef.current) return;

        pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

        const blob = await pdf(
          <CvPdfDocument data={data} showWatermark={showWatermark} />,
        ).toBlob();
        const bytes = new Uint8Array(await blob.arrayBuffer());
        if (run !== runRef.current) return;

        const doc = await pdfjs.getDocument({ data: bytes }).promise;
        const page = await doc.getPage(1);
        if (run !== runRef.current) return;

        const base = page.getViewport({ scale: 1 });
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const scale = (width / base.width) * dpr;
        const viewport = page.getViewport({ scale });

        const off = document.createElement("canvas");
        off.width = Math.floor(viewport.width);
        off.height = Math.floor(viewport.height);
        const offCtx = off.getContext("2d", { willReadFrequently: true });
        if (!offCtx) throw new Error("no canvas");
        await page.render({ canvasContext: offCtx, viewport }).promise;
        if (run !== runRef.current) return;

        const next = offCtx.getImageData(0, 0, off.width, off.height);
        const prev = prevRef.current;
        prevRef.current = next;

        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = off.width;
        canvas.height = off.height;
        canvas.style.width = `${Math.floor(off.width / dpr)}px`;
        canvas.style.height = `${Math.floor(off.height / dpr)}px`;
        canvas.getContext("2d")?.drawImage(off, 0, 0);

        setStatus("ready");
        setRefreshing(false);

        // Highlight what changed since the previous render.
        if (prev && prev.width === next.width && prev.height === next.height) {
          const changed = changedBox(prev, next);
          if (changed) {
            setBox(changed);
            setTimeout(() => {
              if (run === runRef.current) setBox(null);
            }, HIGHLIGHT_MS);
          }
        }
      } catch {
        if (run === runRef.current) {
          setStatus("error");
          setRefreshing(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [data, showWatermark, width]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-gray-200 bg-[#eef1f5] ${className}`}
    >
      <div ref={scrollRef} className="h-full w-full overflow-auto">
        <div className="relative inline-block align-top">
          <canvas ref={canvasRef} className="block bg-white" />
          {box && (
            <div
              className="pointer-events-none absolute rounded-sm bg-yellow-300/40 ring-2 ring-yellow-400"
              style={{
                left: `${box.x * 100}%`,
                top: `${box.y * 100}%`,
                width: `${box.w * 100}%`,
                height: `${box.h * 100}%`,
              }}
            />
          )}
        </div>
      </div>

      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#eef1f5] text-xs font-semibold text-gray-500">
          {isBangla ? "প্রিভিউ তৈরি হচ্ছে..." : "Preparing preview..."}
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#eef1f5] px-4 text-center text-xs font-semibold text-red-500">
          {isBangla ? "প্রিভিউ দেখানো যায়নি" : "Could not show the preview"}
        </div>
      )}
      {status === "ready" && refreshing && (
        <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-teal-600 shadow">
          {isBangla ? "হালনাগাদ হচ্ছে…" : "Updating…"}
        </span>
      )}
    </div>
  );
}

/* Bounding box (as 0–1 fractions of the page) of every pixel that differs
   between two renders, or null when nothing changed / almost everything did. */
function changedBox(a: ImageData, b: ImageData): Box | null {
  const { width, height } = a;
  const da = a.data;
  const db = b.data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      const i = row + x * 4;
      if (
        Math.abs(da[i] - db[i]) > 24 ||
        Math.abs(da[i + 1] - db[i + 1]) > 24 ||
        Math.abs(da[i + 2] - db[i + 2]) > 24
      ) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) return null;
  const pad = 4;
  const x0 = Math.max(0, minX - pad);
  const y0 = Math.max(0, minY - pad);
  const x1 = Math.min(width, maxX + pad);
  const y1 = Math.min(height, maxY + pad);
  const w = (x1 - x0) / width;
  const h = (y1 - y0) / height;
  // Skip when most of the page changed (e.g. the first photo upload).
  if (w * h > 0.6) return null;
  return { x: x0 / width, y: y0 / height, w, h };
}
