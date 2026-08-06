import { saveModuleUpload } from "@/lib/upload/save-module-upload";

/** อัปโหลดรูป ecommerce — มาตรฐานกลาง module-user */
export async function saveEcommerceUploadImage(
  file: File,
  subdir: string,
  ownerUserId: string,
): Promise<{ ok: true; imageUrl: string } | { ok: false; error: string; status: number }> {
  const saved = await saveModuleUpload({
    file,
    moduleSlug: "ecommerce-store",
    ownerUserId,
    accept: "image",
    subdir,
    kind: subdir,
    maxImageBytes: 6 * 1024 * 1024,
  });
  if (!saved.ok) return saved;
  return { ok: true, imageUrl: saved.imageUrl };
}
