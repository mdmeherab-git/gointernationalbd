# Admin Dashboard — setup

The `/admin` dashboard stores everything in **Cloudflare D1** (SQLite) and uploads
files to **Cloudflare R2**. The public site (home + `/jobs`) reads from the same
data through `/api/*`. Until D1 is configured everything still renders using the
bundled sample data, and `/admin` shows an amber "not configured" banner.

## One-time setup

```bash
# 1. install (uses --legacy-peer-deps because next 16.3.0 is one patch below
#    the range @opennextjs/cloudflare declares; the runtime APIs are compatible)
npm install --legacy-peer-deps

# 2. log in to Cloudflare
npx wrangler login

# 3. create the database, then paste the printed database_id into wrangler.jsonc
#    (replace "REPLACE_WITH_D1_DATABASE_ID")
npx wrangler d1 create gib-db

# 4. create the R2 buckets
npx wrangler r2 bucket create gib-uploads
npx wrangler r2 bucket create gib-cache

# 5. create the tables + seed data (local dev copy, then the real one)
npm run db:migrate:local
npm run db:migrate:remote

# 6. secrets
cp .dev.vars.example .dev.vars       # then edit ADMIN_PASSWORD + ADMIN_SESSION_SECRET
npx wrangler secret put ADMIN_PASSWORD        # for production
npx wrangler secret put ADMIN_SESSION_SECRET  # for production
```

## Run locally

```bash
npm run dev
```

Open <http://localhost:3000/admin> → you are redirected to `/admin/login`.
Log in with the `ADMIN_PASSWORD` from `.dev.vars`.

## Deploy to Cloudflare Workers

```bash
npm run deploy
```

(`npm run preview` runs the same production build locally on `workerd`.)

## What the dashboard controls

| Page | Public effect |
|---|---|
| Circulars | `/jobs` list, home "Latest Jobs", home "Featured" (when marked featured) |
| Notices | home Notice Board list |
| Applications | inbox for the `/jobs` "Apply" form; status + CSV export |
| Popular Countries | order / visibility of the home "Popular Countries" strip (first 15 lead) |
| Settings | contact info + the home scrolling notice bar |

## Notes

- The login password is **not** in code or the database — change it with
  `npx wrangler secret put ADMIN_PASSWORD` (or edit `.dev.vars` for local).
- Uploaded images/PDFs are served back through `/api/files/<key>` — no public R2
  domain needs to be configured.
- `app/api/extract-mrz` (passport OCR via `tesseract.js`) is unrelated to this
  work and may need separate attention to run on the Workers runtime.
- Re-generate binding types after changing `wrangler.jsonc`: `npm run cf-typegen`.
