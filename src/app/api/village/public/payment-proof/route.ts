import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveVillageSlipImage } from "@/lib/village/slip-file";
import { villageUnpaidFeeRowStatusFilter } from "@/lib/village/village-invoice-sheet";

/**
 * แนบสลิปโดยไม่ล็อกอิน — ใช้โทเคนจากลิงก์ในใบแจ้งหนี้ค่าส่วนกลาง
 * สร้างรายการสลิปสถานะ PENDING เท่านั้น — แอดมินตรวจอนุมัติที่หน้าสลิปโอนเงิน
 */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const token = String(form.get("token") ?? "").trim();
  if (token.length < 16) {
    return NextResponse.json({ error: "ลิงก์ไม่ถูกต้อง" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size < 1) {
    return NextResponse.json({ error: "แนบรูปสลิป" }, { status: 400 });
  }

  const feeRow = await prisma.villageCommonFeeRow.findFirst({
    where: { publicProofToken: token, ...villageUnpaidFeeRowStatusFilter() },
  });
  if (!feeRow) {
    return NextResponse.json({ error: "ไม่พบรายการหรือชำระแล้ว" }, { status: 404 });
  }

  const balance = feeRow.amountDue - feeRow.amountPaid;
  if (balance <= 0) {
    return NextResponse.json({ error: "ไม่พบรายการหรือชำระแล้ว" }, { status: 404 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  let slipImageUrl: string;
  try {
    slipImageUrl = await saveVillageSlipImage(feeRow.ownerUserId, buf, file.type || "application/octet-stream");
  } catch (e) {
    const msg = e instanceof Error && e.message === "too_large" ? "ไฟล์ใหญ่เกิน 4MB" : "รองรับเฉพาะ JPG PNG WEBP";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  await prisma.villageSlipSubmission.create({
    data: {
      ownerUserId: feeRow.ownerUserId,
      trialSessionId: feeRow.trialSessionId,
      houseId: feeRow.houseId,
      feeRowId: feeRow.id,
      yearMonth: feeRow.yearMonth,
      amount: balance,
      slipImageUrl,
      status: "PENDING",
    },
  });

  return NextResponse.json({ ok: true, status: "PENDING" });
}
