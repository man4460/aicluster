import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api-auth";
import { isSafeModuleCardImageUrl } from "@/lib/module-card-image";
import { prisma } from "@/lib/prisma";

const patchBody = z.object({
  cardImageUrl: z.union([z.string().max(512), z.null()]),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const { id } = await ctx.params;
  let body: z.infer<typeof patchBody>;
  try {
    body = patchBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  if (body.cardImageUrl !== null && !isSafeModuleCardImageUrl(body.cardImageUrl)) {
    return NextResponse.json(
      { error: "URL รูปต้องขึ้นต้นด้วย /uploads/module-cards/ หรือ /images/module-cards/" },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.appModule.update({
      where: { id },
      data: { cardImageUrl: body.cardImageUrl },
      select: { id: true, slug: true, cardImageUrl: true },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "ไม่พบโมดูล" }, { status: 404 });
  }
}
