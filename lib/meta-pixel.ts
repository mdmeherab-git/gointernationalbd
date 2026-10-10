/* Meta (Facebook) Pixel helpers.
   The ID can be overridden with NEXT_PUBLIC_META_PIXEL_ID. */

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || "1808428893381298";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  push?: unknown;
  loaded?: boolean;
  version?: string;
};

/** Meta's standard base-code loader, run once in the browser. */
export function initMetaPixel() {
  if (typeof window === "undefined") return;

  const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };

  if (w.fbq) return;

  const fbq: Fbq = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue?.push(args);
    }
  };

  w.fbq = fbq;
  if (!w._fbq) w._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  fbq("init", META_PIXEL_ID);
}

function getFbq(): Fbq | null {
  if (typeof window === "undefined") return null;

  const fbq = (window as unknown as { fbq?: Fbq }).fbq;

  return typeof fbq === "function" ? fbq : null;
}

/** Standard Meta event, e.g. Lead, Search, CompleteRegistration, Contact. */
export function trackPixel(event: string, params?: Record<string, unknown>) {
  try {
    getFbq()?.("track", event, params);
  } catch {
    // Tracking must never break the page.
  }
}

/** Custom event for actions with no matching standard event. */
export function trackPixelCustom(
  event: string,
  params?: Record<string, unknown>,
) {
  try {
    getFbq()?.("trackCustom", event, params);
  } catch {
    // Tracking must never break the page.
  }
}
