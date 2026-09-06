import { dbAll, getDb } from "@/lib/cf";
import { FALLBACK_NOTICES, type NoticeRow } from "@/lib/data";

export const dynamic = "force-dynamic";

type PublicNotice = {
  id: string;
  title_bn: string;
  title_en: string;
  notice_date: string;
  tag_type: string;
  tag_label_bn: string;
  tag_label_en: string;
};

function toPublic(row: NoticeRow | (typeof FALLBACK_NOTICES)[number]): PublicNotice {
  return {
    id: String(row.id),
    title_bn: row.title_bn,
    title_en: row.title_en,
    notice_date: row.notice_date,
    tag_type: row.tag_type,
    tag_label_bn: row.tag_label_bn,
    tag_label_en: row.tag_label_en,
  };
}

export async function GET() {
  const db = await getDb();

  if (!db) {
    return Response.json({ notices: FALLBACK_NOTICES.map(toPublic), source: "fallback" });
  }

  const rows = await dbAll<NoticeRow>(
    "SELECT * FROM notices WHERE status = 'active' ORDER BY sort_order ASC, notice_date DESC",
  );
  return Response.json({ notices: rows.map(toPublic), source: "db" });
}
