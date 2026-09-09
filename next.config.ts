import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

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
