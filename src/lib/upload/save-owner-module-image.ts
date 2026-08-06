import { saveModuleUpload } from "@/lib/upload/save-module-upload";

/**
 * อัปโหลดรูปโลโก้/สินทรัพย์โมดูล — ใช้มาตรฐานกลาง (ชื่อไฟล์ module-user-ts-rand)
 */
export async function saveOwnerModuleUploadImage(
  file: File,
  moduleSlug: string,
  subdir: string,
  ownerUserId: string,
): Promise<{ ok: true; imageUrl: string } | { ok: false; error: string; status: number }> {
  const saved = await saveModuleUpload({
    file,
    moduleSlug,
    ownerUserId,
    accept: "image",
    subdir,
    kind: subdir,
    maxImageBytes: 6 * 1024 * 1024,
  });
  if (!saved.ok) return saved;
  return { ok: true, imageUrl: saved.imageUrl };
}
