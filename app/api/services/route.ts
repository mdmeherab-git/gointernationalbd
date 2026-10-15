import { listServices } from "@/lib/services";

export const dynamic = "force-dynamic";

/* Public: the active service cards for the home page, in display order.
   Fails soft (empty list) so a database hiccup never breaks the home page. */
export async function GET() {
  try {
    const rows = await listServices(true);
    return Response.json({
      services: rows.map((r) => ({
        id: r.id,
        icon: r.icon,
        titleBn: r.title_bn,
        titleEn: r.title_en,
        descBn: r.desc_bn,
        descEn: r.desc_en,
        link: r.link_url,
        buttonBn: r.button_bn,
        buttonEn: r.button_en,
      })),
    });
  } catch {
    return Response.json({ services: [] });
  }
}
