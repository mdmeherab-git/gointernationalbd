import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // tesseract.js resolves its worker script relative to its own package
  // directory at runtime; bundling it breaks that resolution, so it must
  // run as native Node require instead (see /api/extract-mrz).
  serverExternalPackages: ["tesseract.js"],
};

export default nextConfig;
