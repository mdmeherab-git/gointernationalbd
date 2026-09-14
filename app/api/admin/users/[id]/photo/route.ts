import { requireAdmin } from "@/lib/admin";
import { dbFirst, getUploads } from "@/lib/cf";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/* =========================================================
   GET /api/admin/users/[id]/photo

   Admin-side counterpart to the user-facing
   /api/auth/profile-photo route: that route only ever serves
   the CURRENT SESSION user's own photo (no id parameter at
   all), so it can't be reused here — an admin authenticates
   via a completely separate cookie and isn't a `users` row.

   This route streams a SPECIFIC user's photo from R2 the same
   way (same bucket, same proxy-not-raw-URL approach), gated by
   requireAdmin instead of the user session. Not part of the
   original "possible" API list, but required to satisfy
   "display the user's actual profile photo without exposing
   the private R2 URL."
========================================================= */

export async function GET(req: Request, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const row = await dbFirst<{ profile_photo_key: string }>(
    "SELECT profile_photo_key FROM users WHERE id = ? LIMIT 1",
    id,
  );

  if (!row?.profile_photo_key) {
    return new Response("No profile photo", { status: 404 });
  }

  const bucket = await getUploads();
  if (!bucket) return new Response("Not found", { status: 404 });

  const object = await bucket.get(row.profile_photo_key);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body as ReadableStream, {
    headers: {
      "content-type": object.httpMetadata?.contentType || "application/octet-stream",
      "cache-control": "private, no-store",
    },
  });
}
