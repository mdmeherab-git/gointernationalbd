# Deploy to Vercel (keeping Cloudflare D1 + R2)

The site runs on Vercel while the admin data stays in **Cloudflare D1** and file
uploads in **Cloudflare R2** — both reached over their HTTP APIs (see `lib/cf.ts`).
No Cloudflare Workers deploy is needed.

`.npmrc` (`legacy-peer-deps=true`) is committed so Vercel's `npm install` succeeds.

---

## 1. One-time Cloudflare prep (dashboard)

The database `gib-db` already exists and is migrated + seeded. You still need:

1. **R2 bucket** — Cloudflare dashboard → R2 → **Create bucket** → name it `gib-uploads`.
2. **R2 API credentials** — R2 → **Manage R2 API Tokens** → *Create API token* →
   permission **Object Read & Write**, scoped to `gib-uploads` → copy the
   **Access Key ID** and **Secret Access Key**.
3. **D1 API token** — My Profile → API Tokens → *Create Token* → permission
   **Account › D1 › Edit** → copy it.
   (Rotate the token that was shared in chat and use a fresh one here.)

## 2. Environment variables (Vercel → Project → Settings → Environment Variables)

| Name | Value |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | `6ffba0ec6fb33144fb24dda86875e645` |
| `CLOUDFLARE_D1_DATABASE_ID` | `ac62c76f-ec7d-4e8f-a940-6a0b6d902a12` |
| `CLOUDFLARE_API_TOKEN` | the D1 *Edit* token from step 1.3 |
| `R2_ACCESS_KEY_ID` | from step 1.2 |
| `R2_SECRET_ACCESS_KEY` | from step 1.2 |
| `R2_BUCKET` | `gib-uploads` *(optional — this is the default)* |
| `ADMIN_PASSWORD` | the password you want for `/admin` login |
| `ADMIN_SESSION_SECRET` | any long random string (e.g. `4db1169c0370b3e3321afa1883ad602fffa0cbc8f3ac432bd6282fdcefa8ce57`) |

Set them for **Production** (and Preview if you want preview deploys to work).

## 3. Deploy

**Option A — Vercel CLI (no GitHub needed):**

```bash
npm i -g vercel
vercel            # first run: link/create the project
# add the env vars above in the dashboard, then:
vercel --prod
```

**Option B — GitHub:**

1. Fix `git push` first (GitHub needs a token, not a password):
   ```bash
   git config --global credential.helper manager
   git push        # a browser sign-in window opens
   ```
2. On vercel.com → **Add New → Project** → import `mdmeherab-git/gointernationalbd`.
3. Add the env vars from step 2, then Deploy.

## 4. After deploy

- Visit `https://<your-app>.vercel.app/admin` → log in with `ADMIN_PASSWORD`.
- The dashboard reads/writes the same D1 database, so the seed data is already there.
- Uploading a circular image/PDF writes to the `gib-uploads` R2 bucket and is served
  back through `/api/files/<key>`.

## Notes

- Local `npm run dev` still uses the local wrangler D1 (offline, no quota). Nothing
  to change for local work.
- `app/api/extract-mrz` (passport OCR, `tesseract.js`) is unrelated to this change;
  if it misbehaves on Vercel that is a separate, pre-existing issue.
- The Cloudflare Workers path (`npm run deploy`, `SETUP_ADMIN.md`) still works too —
  the code supports both targets.
