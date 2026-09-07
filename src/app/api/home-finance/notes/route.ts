import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";

const NOTE_CONTENT_MAX = 4000;

const postSchema = z.object({
  content: z.string().trim().min(1).max(NOTE_CONTENT_MAX),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
});

async function requireHomeFinanceNotesUser() {
  const auth = await requireSession();
  if (!auth.ok) {
    return { ok: false as const, res: NextResponse.json({ error: "ต้องเข้าสู่ระบบ" }, { status: 401 }) };
  }
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) {
    return {
      ok: false as const,
      res: NextResponse.json(
        {
          error:
            ctx?.isStaff === true
              ? "บัญชีพนักงานไม่สามารถใช้โน้ตส่วนตัวในบันทึกส่วนตัวได้"
              : "ไม่มีสิทธิ์ — ตรวจสอบการสมัครโมดูลบันทึกส่วนตัว",
        },
        { status: 403 },
      ),
    };
  }
  return { ok: true as const, userId: auth.session.sub };
}

function mapNote(r: {
  id: string;
  content: string;
  tags: unknown;
  createdAt: Date;
  hiddenFromDigest: boolean;
}) {
  const tagsRaw = r.tags;
  const tags = Array.isArray(tagsRaw) ? tagsRaw.filter((t): t is string => typeof t === "string") : [];
  return {
    id: r.id,
    content: r.content,
    tags,
    hiddenFromDigest: Boolean(r.hiddenFromDigest),
    createdAt: r.createdAt.toISOString(),
  };
}

export async function GET(req: Request) {
  const guard = await requireHomeFinanceNotesUser();
  if (!guard.ok) return guard.res;

  const { searchParams } = new URL(req.url);
  const raw = Number(searchParams.get("limit") ?? "300");
  const limit = Number.isFinite(raw) ? Math.min(500, Math.max(1, Math.floor(raw))) : 300;

  const rows = await prisma.personalAiNote.findMany({
    where: { userId: guard.userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, content: true, tags: true, createdAt: true, hiddenFromDigest: true },
  });

  return NextResponse.json(
    { notes: rows.map(mapNote) },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}

export async function POST(req: Request) {
  const guard = await requireHomeFinanceNotesUser();
  if (!guard.ok) return guard.res;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "กรอกข้อความโน้ตก่อนบันทึก" }, { status: 400 });
  }

  const note = await prisma.personalAiNote.create({
    data: {
      userId: guard.userId,
      content: parsed.data.content,
      tags: parsed.data.tags ?? [],
    },
    select: { id: true, content: true, tags: true, createdAt: true, hiddenFromDigest: true },
  });

  return NextResponse.json(
    { ok: true, note: mapNote(note) },
    { status: 201, headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
