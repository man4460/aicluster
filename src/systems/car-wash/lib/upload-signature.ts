import {
  type CarWashStaffAuth,
  uploadCarWashSignatureViaSession,
} from "@/systems/car-wash/car-wash-service";

/** อัปโหลดลายเซ็นจาก canvas blob → คืน URL สำหรับบันทึกกับ visit ตอนหักแพ็กเหมา */
export async function uploadCarWashSignatureBlob(
  blob: Blob,
  opts?: { ownerId?: string; publicPortal?: boolean; staffAuth?: CarWashStaffAuth | null },
): Promise<string> {
  const file = new File([blob], `signature-${Date.now()}.png`, { type: "image/png" });
  if (opts?.publicPortal) {
    if (!opts.ownerId) throw new Error("ไม่พบข้อมูลเจ้าของร้าน");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("ownerId", opts.ownerId);
    const res = await fetch("/api/car-wash/public/portal/upload-signature", {
      method: "POST",
      body: fd,
      credentials: "omit",
    });
    const j = (await res.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;
    if (!res.ok || typeof j?.imageUrl !== "string") {
      throw new Error(typeof j?.error === "string" ? j.error : "อัปโหลดลายเซ็นไม่สำเร็จ");
    }
    return j.imageUrl;
  }
  return uploadCarWashSignatureViaSession(file, opts?.staffAuth ?? null);
}
