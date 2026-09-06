import { isAdminRequest } from "@/lib/admin";
import { getEnv } from "@/lib/cf";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { ADMIN_PASSWORD, ADMIN_SESSION_SECRET } = await getEnv();
  return Response.json({
    authenticated: await isAdminRequest(req),
    configured: Boolean(ADMIN_PASSWORD && ADMIN_SESSION_SECRET),
  });
}
