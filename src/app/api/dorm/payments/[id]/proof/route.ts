import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { saveDormPaymentProofImage } from "@/lib/dormitory/payment-proof-file";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: idRaw } = await ctx.params;
  const paymentId = parseId(idRaw);
  if (paymentId === null) {
    return NextResponse.json({ error: "ไม่ถูกต้อง" }, { status: 400 });
  }

  const scope = await getDormitoryDataScope(auth.session.sub);
  const payment = await prisma.splitBillPayment.findFirst({
    where: {
      id: paymentId,
      paymentStatus: "PENDING",
      tenant: { room: { ownerUserId: auth.session.sub, trialSessionId: scope.trialSessionId } },
    },
  });
  if (!payment) {
    return NextResponse.json({ error: "ไม่พบรายการค้างชำระ" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  let url: string;
  try {
    url = await saveDormPaymentProofImage(paymentId, buf, file.type);
  } catch (e) {
    const msg = e instanceof Error && e.message === "too_large" ? "ไฟล์ใหญ่เกิน 3MB" : "รองรับเฉพาะ JPG PNG WEBP";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const updated = await prisma.splitBillPayment.update({
    where: { id: paymentId },
    data: { proofSlipUrl: url, proofUploadedAt: new Date() },
  });

  return NextResponse.json({
    proofSlipUrl: updated.proofSlipUrl,
    proofUploadedAt: updated.proofUploadedAt?.toISOString() ?? null,
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: idRaw } = await ctx.params;
  const paymentId = parseId(idRaw);
  if (paymentId === null) {
    return NextResponse.json({ error: "ไม่ถูกต้อง" }, { status: 400 });
  }

  const scope = await getDormitoryDataScope(auth.session.sub);
  const payment = await prisma.splitBillPayment.findFirst({
    where: {
      id: paymentId,
      paymentStatus: "PENDING",
      tenant: { room: { ownerUserId: auth.session.sub, trialSessionId: scope.trialSessionId } },
    },
  });
  if (!payment) {
    return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
  }

  await prisma.splitBillPayment.update({
    where: { id: paymentId },
    data: { proofSlipUrl: null, proofUploadedAt: null },
  });

  return NextResponse.json({ ok: true });
}
