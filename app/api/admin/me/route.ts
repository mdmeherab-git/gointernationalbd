import { getAdminAccess } from "@/lib/admin";
import { STAFF_PERMISSIONS } from "@/lib/staff-permissions";

export const dynamic = "force-dynamic";

/* Who is signed in and what they may open. The admin UI uses this to build the
   menu; the real enforcement is in requireAdmin on every API route. */
export async function GET(req: Request) {
  const access = await getAdminAccess(req);
  if (!access) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (access.role === "owner") {
    return Response.json({ role: "owner", name: "", permissions: [...STAFF_PERMISSIONS] });
  }
  return Response.json({
    role: "staff",
    name: access.name,
    permissions: access.permissions,
  });
}
