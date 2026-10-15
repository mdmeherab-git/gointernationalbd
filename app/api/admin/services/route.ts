import { requireAdmin } from "@/lib/admin";
import { dbFirst, dbRun, getDb } from "@/lib/cf";
import { readJson } from "@/lib/crud";
import { getService, isValidServiceLink, listServices } from "@/lib/services";

export const dynamic = "force-dynamic";

const TEXT_LIMITS = { title: 80, desc: 240, button: 40, icon: 8, link: 300 };

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ services: [], dbReady: false });

  return Response.json({ services: await listServices(false), dbReady: true });
}

export async function POST(req: Request) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const db = await getDb();
  if (!db) return Response.json({ error: "D1 database is not configured" }, { status: 503 });

  const body = await readJson(req);
  const titleBn = text(body.title_bn, TEXT_LIMITS.title);
  const titleEn = text(body.title_en, TEXT_LIMITS.title);
  const link = text(body.link_url, TEXT_LIMITS.link);

  if (!titleBn && !titleEn) {
    return Response.json({ error: "সেবার নাম লিখুন / Enter a service name" }, { status: 400 });
  }
  if (!isValidServiceLink(link)) {
    return Response.json(
      {
        error:
          "লিংক হতে হবে / দিয়ে শুরু (যেমন /jobs), https://..., tel:..., অথবা শুধু whatsapp / Link must start with /, https://, tel: or be 'whatsapp'",
      },
      { status: 400 },
    );
  }

  const id = `svc-${crypto.randomUUID()}`;
  // Creates the table (with the starter set) on first use, before we touch it.
  await listServices(false);
  const last = await dbFirst<{ max: number | null }>("SELECT MAX(sort_order) AS max FROM site_services");

  await dbRun(
    `INSERT INTO site_services
       (id, title_bn, title_en, desc_bn, desc_en, icon, link_url, button_bn, button_en, status, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    titleBn || titleEn,
    titleEn || titleBn,
    text(body.desc_bn, TEXT_LIMITS.desc),
    text(body.desc_en, TEXT_LIMITS.desc),
    text(body.icon, TEXT_LIMITS.icon) || "⭐",
    link,
    text(body.button_bn, TEXT_LIMITS.button),
    text(body.button_en, TEXT_LIMITS.button),
    body.status === "inactive" ? "inactive" : "active",
    Number(last?.max ?? 0) + 1,
  );

  return Response.json({ ok: true, service: await getService(id) }, { status: 201 });
}
