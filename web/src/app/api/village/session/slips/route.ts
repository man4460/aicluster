import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { villageOwnerFromAuth } from "@/lib/village/api-owner";
import { getVillageDataScope } from "@/lib/trial/module-scopes";
import { saveVillageSlipImage } from "@/lib/village/slip-file";

const ymRegex = /^\d{4}-\d{2}$/;

export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getVillageDataScope(own.ownerId);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status")?.trim().toUpperCase() ?? "";
  const yearMonth = searchParams.get("year_month")?.trim() ?? "";

  const where: {
    ownerUserId: string;
    trialSessionId: string;
    status?: "PENDING" | "APPROVED" | "REJECTED";
    yearMonth?: string;
  } = { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId };

  if (status === "PENDING" || status === "APPROVED" || status === "REJECTED") {
    where.status = status;
  }
  if (yearMonth && ymRegex.test(yearMonth)) where.yearMonth = yearMonth;

  const rows = await prisma.villageSlipSubmission.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    take: 200,
    include: { house: { select: { houseNo: true, ownerName: true } } },
  });

  return NextResponse.json({
    slips: rows.map((s) => ({
      id: s.id,
      house_id: s.houseId,
      house_no: s.house.houseNo,
      owner_name: s.house.ownerName,
      year_month: s.yearMonth,
      amount: s.amount,
      slip_image_url: s.slipImageUrl,
      status: s.status,
      reviewer_note: s.reviewerNote,
      submitted_at: s.submittedAt.toISOString(),
      reviewed_at: s.reviewedAt?.toISOString() ?? null,
      fee_row_id: s.feeRowId,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await villageOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getVillageDataScope(own.ownerId);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const houseIdRaw = form.get("house_id");
  const yearMonth = String(form.get("year_month") ?? "").trim();
  const amountRaw = form.get("amount");
  const file = form.get("file");

  const houseId = typeof houseIdRaw === "string" ? Number.parseInt(houseIdRaw, 10) : NaN;
  const amount = typeof amountRaw === "string" ? Number.parseInt(amountRaw, 10) : NaN;

  if (!Number.isInteger(houseId) || houseId < 1) {
    return NextResponse.json({ error: "house_id ไม่ถูกต้อง" }, { status: 400 });
  }
  if (!ymRegex.test(yearMonth)) {
    return NextResponse.json({ error: "year_month ต้องเป็น YYYY-MM" }, { status: 400 });
  }
  if (!Number.isInteger(amount) || amount < 1 || amount > 9_999_999) {
    return NextResponse.json({ error: "จำนวนเงินไม่ถูกต้อง" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size < 1) {
    return NextResponse.json({ error: "แนบรูปสลิป" }, { status: 400 });
  }

  const house = await prisma.villageHouse.findFirst({
    where: { id: houseId, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    select: { id: true },
  });
  if (!house) return NextResponse.json({ error: "ไม่พบบ้าน" }, { status: 404 });

  const buf = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "application/octet-stream";
  let slipImageUrl: string;
  try {
    slipImageUrl = await saveVillageSlipImage(own.ownerId, buf, mime);
  } catch {
    return NextResponse.json({ error: "ไฟล์รูปไม่รองรับหรือใหญ่เกินไป" }, { status: 400 });
  }

  const row = await prisma.villageSlipSubmission.create({
    data: {
      ownerUserId: own.ownerId,
      trialSessionId: scope.trialSessionId,
      houseId,
      yearMonth,
      amount,
      slipImageUrl,
      status: "PENDING",
    },
  });

  return NextResponse.json({
    slip: {
      id: row.id,
      house_id: row.houseId,
      year_month: row.yearMonth,
      amount: row.amount,
      slip_image_url: row.slipImageUrl,
      status: row.status,
      submitted_at: row.submittedAt.toISOString(),
    },
  });
}
