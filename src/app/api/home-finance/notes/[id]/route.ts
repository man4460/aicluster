import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";

type Ctx = { params: Promise<{ id: string }> };

const NOTE_CONTENT_MAX = 20_000;

async function requireHomeFinanceNotesUser() {
  const auth = await requireSession();
  if (!auth.ok) {
    return { ok: false as const, res: NextResponse.json({ error: "ต้องเข้าสู่ระบบ" }, { status: 401 }) };
  }
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) {
    return { ok: false as const, res: NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 }) };
  }
  return { ok: true as const, userId: auth.session.sub };
}

export async function PATCH(req: Request, ctx: Ctx) {
  const guard = await requireHomeFinanceNotesUser();
  if (!guard.ok) return guard.res;

  const id = (await ctx.params).id?.trim();
  if (!id) return NextResponse.json({ error: "ไม่พบรหัสโน้ต" }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบคำขอไม่ถูกต้อง" }, { status: 400 });
  }
  if (body === null || typeof body !== "object") {
    return NextResponse.json({ error: "รูปแบบคำขอไม่ถูกต้อง" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const patch: { content?: string; hiddenFromDigest?: boolean } = {};
  if ("content" in o) {
    if (typeof o.content !== "string") {
      return NextResponse.json({ error: "เนื้อหาโน้ตไม่ถูกต้อง" }, { status: 400 });
    }
    const t = o.content.trim();
    if (!t) return NextResponse.json({ error: "เนื้อหาโน้ตว่างไม่ได้" }, { status: 400 });
    if (t.length > NOTE_CONTENT_MAX) {
      return NextResponse.json({ error: `เนื้อหายาวเกิน ${NOTE_CONTENT_MAX} ตัวอักษร` }, { status: 400 });
    }
    patch.content = t;
  }
  if ("hiddenFromDigest" in o) {
    if (typeof o.hiddenFromDigest !== "boolean") {
      return NextResponse.json({ error: "ค่า hiddenFromDigest ไม่ถูกต้อง" }, { status: 400 });
    }
    patch.hiddenFromDigest = o.hiddenFromDigest;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลที่จะอัปเดต" }, { status: 400 });
  }

  const result = await prisma.personalAiNote.updateMany({
    where: { id, userId: guard.userId },
    data: patch as never,
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "ไม่พบโน้ตหรือไม่มีสิทธิ์แก้ไข" }, { status: 404 });
  }

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const guard = await requireHomeFinanceNotesUser();
  if (!guard.ok) return guard.res;

  const id = (await ctx.params).id?.trim();
  if (!id) return NextResponse.json({ error: "ไม่พบรหัสโน้ต" }, { status: 400 });

  const result = await prisma.personalAiNote.deleteMany({
    where: { id, userId: guard.userId },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "ไม่พบโน้ตหรือไม่มีสิทธิ์ลบ" }, { status: 404 });
  }

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
