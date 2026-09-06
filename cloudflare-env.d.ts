// Hand-written stub — regenerate any time with `npm run cf-typegen`.
// Describes the bindings declared in wrangler.jsonc + the admin secrets.

interface CloudflareEnv {
  DB: import("./lib/cf").D1Database;
  UPLOADS: import("./lib/cf").R2Bucket;
  ADMIN_PASSWORD: string;
  ADMIN_SESSION_SECRET: string;
}
