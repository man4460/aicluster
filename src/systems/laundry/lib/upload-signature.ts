/** อัปโหลดลายเซ็นจาก canvas blob → คืน URL สำหรับบันทึกกับ service log */
export async function uploadLaundrySignatureBlob(blob: Blob): Promise<string> {
  const file = new File([blob], `signature-${Date.now()}.png`, { type: "image/png" });
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/laundry/signature/upload", {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  const j = (await res.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;
  if (!res.ok || typeof j?.imageUrl !== "string") {
    throw new Error(typeof j?.error === "string" ? j.error : "อัปโหลดลายเซ็นไม่สำเร็จ");
  }
  return j.imageUrl;
}
