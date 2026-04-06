import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { writeSystemActivityLog } from "@/lib/audit-log";
import {
  isPrismaSchemaMismatch,
  THAI_PRISMA_SCHEMA_MISMATCH,
} from "@/lib/prisma-schema-mismatch";

const STYLIST_PHOTO_PREFIX = "/uploads/barber-stylists/";

function normalizeStylistPhotoUrl(raw: string | null): string | null {
  if (raw == null || raw.trim() === "") return null;
  let t = raw.trim();
  if (t.startsWith("http://") || t.startsWith("https://")) {
    try {
      t = new URL(t).pathname;
    } catch {
      return "__invalid__";
    }
  }
  t = t.replace(/\/{2,}/g, "/");
  if (!t.startsWith("/")) t = `/${t}`;
  if (!t.startsWith(STYLIST_PHOTO_PREFIX) || t.includes("..") || t.length > 512) return "__invalid__";
  return t;
}

/** Zod 4 — ไม่ chain trim กับ optional เพื่อลด edge case; trim ใน handler */
const patchSchema = z.object({
  name: z.string().max(100).optional(),
  phone: z.union([z.string().max(20), z.null()]).optional(),
  isActive: z.boolean().optional(),
  photoUrl: z.union([z.string().max(512), z.null()]).optional(),
});

function phoneOrNull(raw: string | null): string | null {
  if (raw == null || raw.trim() === "") return null;
  const d = raw.replace(/\D/g, "").slice(0, 20);
  return d.length > 0 ? d : null;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const scope = await getBarberDataScope(own.ownerId);

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "ไม่ถูกต้อง" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ? `ข้อมูลไม่ถูกต้อง: ${first.message}` : "ข้อมูลไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const existing = await prisma.barberStylist.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
  });
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบช่าง" }, { status: 404 });
  }

  const data: {
    name?: string;
    phone?: string | null;
    isActive?: boolean;
    photoUrl?: string | null;
  } = {};
  if (parsed.data.name !== undefined) {
    const n = parsed.data.name.trim();
    if (n.length === 0) {
      return NextResponse.json({ error: "กรอกชื่อช่าง" }, { status: 400 });
    }
    data.name = n;
  }
  if (parsed.data.phone !== undefined) data.phone = phoneOrNull(parsed.data.phone?.trim() ?? null);
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
  if (parsed.data.photoUrl !== undefined) {
    const norm = normalizeStylistPhotoUrl(parsed.data.photoUrl);
    if (norm === "__invalid__") {
      return NextResponse.json({ error: "ลิงก์รูปไม่ถูกต้อง" }, { status: 400 });
    }
    data.photoUrl = norm;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลที่จะอัปเดต" }, { status: 400 });
  }

  let s;
  try {
    /** ใช้ `update` ตาม `id` เท่านั้น — `id` เป็น PK; สิทธิ์ตรวจแล้วจาก `existing` ด้านบน
     * (บางชุด Prisma/Turbopack ทำให้ `updateMany` ไม่รับ `photoUrl` ใน `data`) */
    s = await prisma.barberStylist.update({
      where: { id },
      data,
    });
  } catch (e) {
    console.error("[barber/stylists PATCH]", e);
    if (isPrismaSchemaMismatch(e)) {
      return NextResponse.json({ error: THAI_PRISMA_SCHEMA_MISMATCH }, { status: 503 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return NextResponse.json({ error: "ไม่พบข้อมูลช่าง — ลองรีเฟรชหน้า" }, { status: 404 });
      }
    }
    const hint =
      process.env.NODE_ENV === "development" && e instanceof Error ? e.message : undefined;
    return NextResponse.json(
      { error: "อัปเดตไม่สำเร็จ", ...(hint ? { hint } : {}) },
      { status: 500 },
    );
  }

  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "UPDATE",
    modelName: "BarberStylist",
    payload: { id, ownerUserId: own.ownerId, changes: data },
  });

  return NextResponse.json({
    stylist: {
      id: s.id,
      name: s.name,
      phone: s.phone,
      photoUrl: s.photoUrl ?? null,
      isActive: s.isActive,
    },
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getBarberDataScope(own.ownerId);
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "ไม่ถูกต้อง" }, { status: 400 });
  }
  const existing = await prisma.barberStylist.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "ไม่พบช่าง" }, { status: 404 });
  await prisma.barberStylist.delete({ where: { id } });
  await writeSystemActivityLog({
    actorUserId: auth.session.sub,
    action: "DELETE",
    modelName: "BarberStylist",
    payload: { id, ownerUserId: own.ownerId },
  });
  return NextResponse.json({ ok: true });
}
