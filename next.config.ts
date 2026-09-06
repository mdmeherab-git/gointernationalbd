import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // tesseract.js resolves its worker script relative to its own package
  // directory at runtime; bundling it breaks that resolution, so it must
  // run as native Node require instead (see /api/extract-mrz).
  serverExternalPackages: ["tesseract.js"],
};

export default nextConfig;

// In local `next dev`, this exposes the Cloudflare bindings from wrangler.jsonc
// (D1 `DB`, R2 `UPLOADS`) via getCloudflareContext(). It is an internal no-op in
// production builds (Vercel included) — there the app talks to D1 / R2 over
// their HTTP APIs instead, see lib/cf.ts.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();
