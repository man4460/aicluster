import { NextResponse } from "next/server";
import { readLmsLearnerSession } from "@/lib/lms/learner-session";
import { findLmsPublicProfile } from "@/lib/lms/public-profile";
import { saveModuleUpload } from "@/lib/upload/save-module-upload";

type Ctx = { params: Promise<{ slug: string }> };

/** อัปโหลดสลิปซื้อคอร์สจากผู้เรียนที่ล็อกอิน */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    const url = new URL(req.url);
    const session = await readLmsLearnerSession();
    if (!session || session.slug !== slug) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const profile = await findLmsPublicProfile(slug, url.searchParams.get("t"));
    if (!profile || profile.id !== session.profileId) {
      return NextResponse.json({ error: "ไม่พบสถาบัน" }, { status: 404 });
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
    }

    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
    }

    const saved = await saveModuleUpload({
      file,
      moduleSlug: "lms",
      ownerUserId: profile.ownerUserId,
      accept: "image",
      kind: "slip",
      maxImageBytes: 6 * 1024 * 1024,
    });

    if (!saved.ok) {
      return NextResponse.json({ error: saved.error }, { status: saved.status });
    }

    return NextResponse.json({ imageUrl: saved.imageUrl });
  } catch (e) {
    console.error("[lms/public/[slug]/upload-slip POST]", e);
    return NextResponse.json({ error: "อัปโหลดสลิปไม่สำเร็จ" }, { status: 500 });
  }
}
