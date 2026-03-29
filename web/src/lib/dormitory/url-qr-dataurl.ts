import QRCode from "qrcode";

/** Data URL ของ QR ที่ชี้ไป URL (เช่น หน้าแนบสลิปสาธารณะ) */
export async function buildUrlQrDataUrl(url: string, width = 128): Promise<string | null> {
  const u = url.trim();
  if (!u) return null;
  try {
    return await QRCode.toDataURL(u, {
      width,
      margin: 1,
      errorCorrectionLevel: "M",
    });
  } catch {
    return null;
  }
}
