import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveDormPaymentProofImage } from "@/lib/dormitory/payment-proof-file";

/**
 * อัปโหลดสลิปโดยไม่ล็อกอิน — ใช้โทเคนจากลิงก์ในใบแจ้งหนี้ (แยก path จาก /payments/[id] เพื่อไม่ให้ dynamic กลืน segment)
 */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const token = String(form.get("token") ?? "").trim();
  if (token.length < 16) {
    return NextResponse.json({ error: "ลิงก์ไม่ถูกต้อง" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
  }

  const payment = await prisma.splitBillPayment.findFirst({
    where: { publicProofToken: token, paymentStatus: "PENDING" },
  });
  if (!payment) {
    return NextResponse.json({ error: "ไม่พบรายการหรือชำระแล้ว" }, { status: 404 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  let url: string;
  try {
    url = await saveDormPaymentProofImage(payment.id, buf, file.type);
  } catch (e) {
    const msg = e instanceof Error && e.message === "too_large" ? "ไฟล์ใหญ่เกิน 3MB" : "รองรับเฉพาะ JPG PNG WEBP";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  await prisma.splitBillPayment.update({
    where: { id: payment.id },
    data: { proofSlipUrl: url, proofUploadedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
