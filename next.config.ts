import type { NextConfig } from "next";

// Browser-side hardening applied to every response. A Content-Security-
// Policy is intentionally NOT set here: the Meta Pixel, inline Next.js
// scripts and the R2 direct uploads would each need careful allow-listing,
// and a wrong CSP breaks the site.
const securityHeaders = [
  // Stop other sites from embedding this site in a frame (clickjacking).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Stop browsers from guessing a file's type (MIME sniffing).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full page URLs to other sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Always use HTTPS for a year.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // The chat's voice recording needs the microphone; nothing else needs
  // camera, location or payment APIs.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

// Local `next dev` only: expose the Cloudflare bindings from wrangler.jsonc
// (D1 `DB`, R2 `UPLOADS`) via getCloudflareContext(). Skipped entirely in
// production builds (Vercel included) — there the app talks to D1 / R2 over
// their HTTP APIs, see lib/cf.ts. Guarded + non-fatal so a missing or broken
// @opennextjs/cloudflare can never fail the build.
if (process.env.NODE_ENV === "development") {
  import("@opennextjs/cloudflare")
    .then((mod) => mod.initOpenNextCloudflareForDev())
    .catch(() => {});
}
