import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { canAccessAppModule } from "@/lib/modules/access";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { STAFF_ALLOWED_MODULE_SLUGS } from "@/lib/modules/staff-policy";
import {
  getModuleResubscribeCooldown,
  listActiveResubscribeCooldowns,
  listSubscribedModuleIds,
  subscribeModule,
} from "@/lib/modules/subscriptions-store";

const bodySchema = z.object({
  moduleId: z.string().min(1),
});

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [moduleIds, cooldowns] = await Promise.all([
    listSubscribedModuleIds(auth.session.sub),
    listActiveResubscribeCooldowns(auth.session.sub),
  ]);
  return NextResponse.json({ moduleIds, cooldowns });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "moduleId ไม่ถูกต้อง" }, { status: 400 });

  const mod = await prisma.appModule.findUnique({
    where: { id: parsed.data.moduleId },
    select: { id: true, slug: true, groupId: true, isActive: true },
  });
  if (!mod || !mod.isActive) return NextResponse.json({ error: "ไม่พบระบบ" }, { status: 404 });

  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.isStaff && !STAFF_ALLOWED_MODULE_SLUGS.has(mod.slug)) {
    return NextResponse.json({ error: "สิทธิ์พนักงานไม่รองรับระบบนี้" }, { status: 403 });
  }
  if (!canAccessAppModule(ctx.access, { slug: mod.slug, groupId: mod.groupId })) {
    return NextResponse.json({ error: "แพ็กเกจปัจจุบันยังเข้าใช้ระบบนี้ไม่ได้" }, { status: 403 });
  }
  if (ctx.access.role !== "ADMIN" && ctx.access.subscriptionType !== "BUFFET") {
    const current = await listSubscribedModuleIds(auth.session.sub);
    const alreadyHasThisModule = current.includes(mod.id);
    if (!alreadyHasThisModule && current.length >= 1) {
      return NextResponse.json(
        { error: "สายรายวันเลือกได้เพียง 1 ระบบ กรุณาเปลี่ยนแพ็กเกจเพื่อเพิ่มระบบ" },
        { status: 403 },
      );
    }
  }

  const cd = await getModuleResubscribeCooldown(auth.session.sub, mod.id);
  if (cd.locked && cd.unlockAt) {
    return NextResponse.json(
      {
        error:
          "ยังอยู่ในช่วงหลังยกเลิก Subscribe ไม่สามารถ Subscribe ระบบนี้ได้จนกว่าจะครบ 1 เดือน กรุณารอจนถึงวันที่ปลดล็อค",
        unlockAt: cd.unlockAt.toISOString(),
      },
      { status: 403 },
    );
  }

  await subscribeModule(auth.session.sub, mod.id);
  return NextResponse.json({ ok: true });
}

