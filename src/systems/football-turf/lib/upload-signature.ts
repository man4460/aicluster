/** อัปโหลดลายเซ็นจาก canvas blob → คืน URL สำหรับบันทึกกับ booking ตอนใช้สิทธิ์โปร */
export async function uploadFootballTurfSignatureBlob(
  blob: Blob,
  opts?: { ownerId?: string; publicPortal?: boolean },
): Promise<string> {
  const file = new File([blob], `signature-${Date.now()}.png`, { type: "image/png" });
  const fd = new FormData();
  fd.append("file", file);
  if (opts?.publicPortal && opts.ownerId) {
    fd.append("ownerId", opts.ownerId);
  }
  const url =
    opts?.publicPortal
      ? "/api/football-turf/public/upload-signature"
      : "/api/football-turf/signature/upload";
  const res = await fetch(url, {
    method: "POST",
    body: fd,
    credentials: opts?.publicPortal ? "omit" : "include",
  });
  const j = (await res.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;
  if (!res.ok || typeof j?.imageUrl !== "string") {
    throw new Error(typeof j?.error === "string" ? j.error : "อัปโหลดลายเซ็นไม่สำเร็จ");
  }
  return j.imageUrl;
}
