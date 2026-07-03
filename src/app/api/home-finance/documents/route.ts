import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { isAllowedHomeFinanceUploadPath } from "@/lib/home-finance/attachments";

const postSchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: z.string().trim().max(80).optional().nullable(),
  fileUrl: z
    .string()
    .max(512)
    .refine((s) => isAllowedHomeFinanceUploadPath(s), "เส้นทางไฟล์ไม่ถูกต้อง"),
  mimeType: z.string().trim().max(80).optional().nullable(),
  note: z.string().trim().max(600).optional().nullable(),
});

function mapRow(r: {
  id: number;
  title: string;
  category: string | null;
  fileUrl: string;
  mimeType: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    fileUrl: r.fileUrl,
    mimeType: r.mimeType,
    note: r.note,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ — ล็อกอินใหม่" }, { status: 401 });
  }
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) {
    return NextResponse.json(
      {
        error:
          ctx?.isStaff === true
            ? "บัญชีพนักงานไม่สามารถใช้รายรับ-รายจ่ายได้ — โปรดเข้าด้วยบัญชีเจ้าของ"
            : "ไม่มีสิทธิ์เข้าใช้ — ตรวจสอบการสมัครโมดูลรายรับ–รายจ่าย",
      },
      { status: 403 },
    );
  }

  try {
    const rows = await prisma.homeFinancePersonalDocument.findMany({
      where: { ownerUserId: ctx.billingUserId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    return NextResponse.json({ items: rows.map(mapRow) });
  } catch (e) {
    console.error("home-finance/documents GET", e);
    return NextResponse.json({ error: "โหลดเอกสารไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  try {
    const row = await prisma.homeFinancePersonalDocument.create({
      data: {
        ownerUserId: ctx.billingUserId,
        title: parsed.data.title,
        category: parsed.data.category?.trim() || null,
        fileUrl: parsed.data.fileUrl,
        mimeType: parsed.data.mimeType?.trim() || null,
        note: parsed.data.note?.trim() || null,
      },
    });
    return NextResponse.json({ item: mapRow(row) });
  } catch (e) {
    console.error("home-finance/documents POST", e);
    return NextResponse.json({ error: "บันทึกเอกสารไม่สำเร็จ" }, { status: 500 });
  }
}
