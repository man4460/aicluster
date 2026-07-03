import { NextResponse } from "next/server";
import { z } from "zod";
import { getModuleShopBranding, updateModuleShopBranding } from "@/lib/module-shop/branding-store";
import { moduleShopPaymentPatchSchema } from "@/lib/module-shop/payment";
import { resolveModuleShopOwnerContext } from "@/lib/module-shop/resolve-owner";
import { isModuleShopBrandingSlug } from "@/lib/module-shop/slugs";

const patchSchema = z
  .object({
    displayName: z.string().max(200).optional().nullable(),
    tagline: z.string().max(300).optional().nullable(),
    contactPhone: z.string().max(32).optional().nullable(),
    logoUrl: z.string().max(512).optional().nullable(),
  })
  .merge(moduleShopPaymentPatchSchema);

type RouteCtx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const { slug } = await ctx.params;
  if (!isModuleShopBrandingSlug(slug)) {
    return NextResponse.json({ error: "โมดูลไม่รองรับ" }, { status: 404 });
  }
  const auth = await resolveModuleShopOwnerContext(slug);
  if (!auth.ok) return auth.res;
  const profile = await getModuleShopBranding(
    auth.ctx.ownerUserId,
    auth.ctx.trialSessionId,
    slug,
  );
  return NextResponse.json({ profile });
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  const { slug } = await ctx.params;
  if (!isModuleShopBrandingSlug(slug)) {
    return NextResponse.json({ error: "โมดูลไม่รองรับ" }, { status: 404 });
  }
  const auth = await resolveModuleShopOwnerContext(slug);
  if (!auth.ok) return auth.res;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const profile = await updateModuleShopBranding(
    auth.ctx.ownerUserId,
    auth.ctx.trialSessionId,
    slug,
    parsed.data,
  );
  return NextResponse.json({ profile });
}
