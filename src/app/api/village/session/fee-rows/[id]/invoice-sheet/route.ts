import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { isPrismaSchemaMismatchError, PRISMA_SYNC_HINT_TH } from "@/lib/prisma-errors";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageInvoiceSheetDto } from "@/lib/village/village-invoice-sheet";

type Ctx = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  try {
    const baseUrl = await getRequestBaseUrl();
    const sheet = await getVillageInvoiceSheetDto(id, own.ownerId, baseUrl);
    if (!sheet) return NextResponse.json({ error: "ไม่พบบิลค้างชำระรายการนี้" }, { status: 404 });
    return NextResponse.json({ sheet });
  } catch (e) {
    if (isPrismaSchemaMismatchError(e)) {
      return NextResponse.json({ error: PRISMA_SYNC_HINT_TH }, { status: 503 });
    }
    console.error("village invoice-sheet GET", e);
    return NextResponse.json({ error: "โหลดใบแจ้งหนี้ไม่สำเร็จ" }, { status: 500 });
  }
}
