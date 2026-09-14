import { dbFirst, dbRun, getUploads, newId } from "@/lib/cf";
import { requireUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Sniffs the first bytes of the file for a known image signature, so a
 *  request can't get through just by spoofing the Content-Type header. */
function looksLikeImage(bytes: Uint8Array, contentType: string): boolean {
  if (bytes.length < 12) return false;

  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png =
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const webp =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;

  if (contentType === "image/jpeg") return jpeg;
  if (contentType === "image/png") return png;
  if (contentType === "image/webp") return webp;
  return false;
}

type PhotoRow = { profile_photo_key: string };

/* =========================================================
   POST /api/auth/profile-photo

   Uploads a new profile photo for the CURRENT session user.
   The R2 key always embeds the session's own user id — a
   caller can never choose another user's key.
========================================================= */

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const bucket = await getUploads();
  if (!bucket) {
    return Response.json(
      { error: "ছবি আপলোড এখন কাজ করছে না / Photo upload is not configured" },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Invalid upload" }, { status: 400 });
  }

  const file = form.get("photo");
  if (!(file instanceof File)) {
    return Response.json({ error: "কোনো ছবি পাওয়া যায়নি / No photo provided" }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return Response.json(
      { error: "শুধু JPG, PNG অথবা WebP ছবি দিন / Only JPG, PNG, or WebP images are allowed" },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "ছবির সাইজ ৫ MB-এর বেশি হতে পারবে না / Image must be under 5 MB" },
      { status: 413 },
    );
  }

  const buffer = await file.arrayBuffer();
  if (!looksLikeImage(new Uint8Array(buffer), file.type)) {
    return Response.json(
      { error: "ফাইলটি বৈধ ছবি নয় / File is not a valid image" },
      { status: 415 },
    );
  }

  const key = `users/${user.id}/profile/profile-photo-${newId()}.${ext}`;

  try {
    await bucket.put(key, buffer, { httpMetadata: { contentType: file.type } });
  } catch (error) {
    console.error("Profile photo R2 upload error:", error);
    return Response.json(
      { error: "ছবি আপলোড করা যায়নি / Could not upload photo" },
      { status: 500 },
    );
  }

  let oldKey = "";
  try {
    const row = await dbFirst<PhotoRow>(
      `SELECT profile_photo_key FROM users WHERE id = ? LIMIT 1`,
      user.id,
    );
    oldKey = row?.profile_photo_key || "";

    await dbRun(
      `UPDATE users SET profile_photo_key = ?, updated_at = datetime('now') WHERE id = ?`,
      key,
      user.id,
    );
  } catch (error) {
    console.error("Profile photo D1 update error:", error);
    return Response.json(
      { error: "ছবি সংরক্ষণ করা যায়নি / Could not save photo" },
      { status: 500 },
    );
  }

  if (oldKey && oldKey !== key) {
    try {
      await bucket.delete(oldKey);
    } catch (error) {
      // Non-fatal — the new photo is already saved and active.
      console.error("Old profile photo cleanup failed:", error);
    }
  }

  return Response.json({ ok: true, profilePhotoKey: key });
}

/* =========================================================
   GET /api/auth/profile-photo

   Streams back the CURRENT session user's own photo. There is
   no key parameter of any kind, so there is no way to request
   another user's image through this endpoint.
========================================================= */

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  if (!user.profilePhotoKey) {
    return new Response("No profile photo", { status: 404 });
  }

  const bucket = await getUploads();
  if (!bucket) {
    return new Response("Not found", { status: 404 });
  }

  const object = await bucket.get(user.profilePhotoKey);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(object.body as ReadableStream, {
    headers: {
      "content-type": object.httpMetadata?.contentType || "application/octet-stream",
      // Private, per-user, mutable content — never cache across sessions
      // or serve a stale photo after an update.
      "cache-control": "private, no-store",
    },
  });
}

/* =========================================================
   DELETE /api/auth/profile-photo

   Removes the CURRENT session user's own photo from R2 and
   clears the pointer in D1.
========================================================= */

export async function DELETE(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  if (!user.profilePhotoKey) {
    return Response.json({ ok: true });
  }

  const bucket = await getUploads();
  if (bucket) {
    try {
      await bucket.delete(user.profilePhotoKey);
    } catch (error) {
      // Non-fatal — still clear the D1 pointer so the UI recovers.
      console.error("Profile photo delete (R2) error:", error);
    }
  }

  try {
    await dbRun(
      `UPDATE users SET profile_photo_key = '', updated_at = datetime('now') WHERE id = ?`,
      user.id,
    );
  } catch (error) {
    console.error("Profile photo delete (D1) error:", error);
    return Response.json(
      { error: "ছবি মুছে ফেলা যায়নি / Could not delete photo" },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
