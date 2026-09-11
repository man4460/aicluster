import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { usedCarShowroomOwnerFromAuth } from "@/lib/used-car-showroom/api-owner";
import { USED_CAR_SHOWROOM_MODULE_SLUG } from "@/lib/modules/config";
import { saveOwnerModuleUploadImage } from "@/lib/upload/save-owner-module-image";

const ALLOWED_KIND = new Set([
  "logo",
  "logos",
  "slip",
  "slips",
  "docs",
  "documents",
  "banner",
  "banners",
  "gallery",
  "promptpay-qr",
  "images",
]);

function normalizeKind(raw: string): string {
  const k = raw.trim().toLowerCase();
  if (k === "logo") return "logos";
  if (k === "slip") return "slips";
  if (k === "doc" || k === "document" || k === "documents") return "docs";
  if (k === "banner") return "banners";
  return k;
}

/** อัปโหลดรูปทั่วไป (โลโก้ · สลิป · เอกสาร · แบนเนอร์) */
export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await usedCarShowroomOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
    }

    const file = form.get("file");
    const kindRaw = typeof form.get("kind") === "string" ? String(form.get("kind")) : "images";
    if (!ALLOWED_KIND.has(kindRaw.trim().toLowerCase()) && !ALLOWED_KIND.has(normalizeKind(kindRaw))) {
      return NextResponse.json({ error: "kind ไม่ถูกต้อง" }, { status: 400 });
    }
    const kind = normalizeKind(kindRaw);
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
    }

    const saved = await saveOwnerModuleUploadImage(
      file,
      USED_CAR_SHOWROOM_MODULE_SLUG,
      kind,
      own.ownerId,
    );
    if (!saved.ok) {
      return NextResponse.json({ error: saved.error }, { status: saved.status });
    }
    return NextResponse.json({ imageUrl: saved.imageUrl, url: saved.imageUrl });
  } catch (e) {
    console.error("[used-car-showroom/session/upload]", e);
    return NextResponse.json({ error: "อัปโหลดไม่สำเร็จ" }, { status: 500 });
  }
}
