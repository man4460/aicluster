import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { isPrismaSchemaMismatchError, PRISMA_SYNC_HINT_TH } from "@/lib/prisma-errors";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { listVillageInvoiceSheetsForYearMonth } from "@/lib/village/village-invoice-sheet";

const ymRegex = /^\d{4}-\d{2}$/;

/** GET ?year_month=YYYY-MM — ใบแจ้งหนี้ทุกบิลค้างของเดือน (พิมพ์พร้อมกัน) */
export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const yearMonth = new URL(req.url).searchParams.get("year_month")?.trim() ?? "";
  if (!ymRegex.test(yearMonth)) {
    return NextResponse.json({ error: "ระบุ year_month เป็น YYYY-MM" }, { status: 400 });
  }

  try {
    const baseUrl = await getRequestBaseUrl();
    const sheets = await listVillageInvoiceSheetsForYearMonth(own.ownerId, yearMonth, baseUrl);
    return NextResponse.json({ sheets, count: sheets.length });
  } catch (e) {
    if (isPrismaSchemaMismatchError(e)) {
      return NextResponse.json({ error: PRISMA_SYNC_HINT_TH }, { status: 503 });
    }
    console.error("village invoice-sheets GET", e);
    return NextResponse.json({ error: "โหลดใบแจ้งหนี้ไม่สำเร็จ" }, { status: 500 });
  }
}
