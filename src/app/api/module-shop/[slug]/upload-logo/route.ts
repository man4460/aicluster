import { NextResponse } from "next/server";
import { setModuleShopLogoUrl } from "@/lib/module-shop/branding-store";
import { resolveModuleShopOwnerContext } from "@/lib/module-shop/resolve-owner";
import { isModuleShopBrandingSlug } from "@/lib/module-shop/slugs";
import { saveOwnerModuleUploadImage } from "@/lib/upload/save-owner-module-image";

type RouteCtx = { params: Promise<{ slug: string }> };

export async function POST(req: Request, ctx: RouteCtx) {
  const { slug } = await ctx.params;
  if (!isModuleShopBrandingSlug(slug)) {
    return NextResponse.json({ error: "โมดูลไม่รองรับ" }, { status: 404 });
  }
  const auth = await resolveModuleShopOwnerContext(slug);
  if (!auth.ok) return auth.res;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
  }

  const saved = await saveOwnerModuleUploadImage(
    file,
    `module-shop-${slug}`,
    "logos",
    auth.ctx.ownerUserId,
  );
  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  await setModuleShopLogoUrl(
    auth.ctx.ownerUserId,
    auth.ctx.trialSessionId,
    slug,
    saved.imageUrl,
  );

  return NextResponse.json({ imageUrl: saved.imageUrl });
}
