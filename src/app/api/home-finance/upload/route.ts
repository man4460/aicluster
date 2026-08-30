import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { saveModuleUpload } from "@/lib/upload/save-module-upload";

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getModuleBillingContext(auth.session.sub);
  if (!ctx || ctx.isStaff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

  const displayNameRaw = form.get("displayName");
  const displayName = typeof displayNameRaw === "string" ? displayNameRaw : null;

  const kindRaw = form.get("kind");
  const kindStr = typeof kindRaw === "string" ? kindRaw.trim().toLowerCase() : "attach";
  const kind = kindStr === "slip" || kindStr === "cover" ? kindStr : "attach";

  const saved = await saveModuleUpload({
    file,
    moduleSlug: "home-finance",
    ownerUserId: ctx.billingUserId,
    accept: "image-or-pdf",
    kind,
    displayName,
    maxImageBytes: 3 * 1024 * 1024,
    maxPdfBytes: 5 * 1024 * 1024,
  });

  if (!saved.ok) {
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }

  return NextResponse.json({
    imageUrl: saved.imageUrl,
    fileUrl: saved.fileUrl,
    storedFileName: saved.storedFileName,
    displayName: saved.displayName,
    mimeType: saved.mimeType,
    fileSize: saved.fileSize,
  });
}
