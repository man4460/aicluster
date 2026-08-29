import { NextResponse } from "next/server";
import { getVillagePublicInvoiceDto } from "@/lib/village/village-invoice-sheet";

type Ctx = { params: Promise<{ token: string }> };

/** ข้อมูลใบแจ้งหนี้ค่าส่วนกลางสำหรับหน้าแนบสลิปสาธารณะ — ไม่ต้องล็อกอิน */
export async function GET(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const invoice = await getVillagePublicInvoiceDto(token ?? "");
  if (!invoice) return NextResponse.json({ error: "ลิงก์ไม่ถูกต้อง" }, { status: 404 });
  return NextResponse.json({ invoice });
}
