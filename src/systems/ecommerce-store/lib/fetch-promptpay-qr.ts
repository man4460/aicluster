/** เรียก API สร้าง QR พร้อมเพย์ของร้าน (หน้าลูกค้า) */
export async function fetchEcommercePromptPayQr(
  storeId: string,
  amountBaht: number,
): Promise<{ qrDataUrl: string | null; error: string | null }> {
  const amount = Math.round(amountBaht * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) {
    return { qrDataUrl: null, error: "จำนวนเงินไม่ถูกต้อง" };
  }

  try {
    const res = await fetch(`/api/ecommerce-store/public/${storeId}/promptpay-qr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountBaht: amount, amount }),
    });
    const j = (await res.json()) as { qrDataUrl?: string | null; error?: string; configured?: boolean };
    if (!res.ok) {
      return { qrDataUrl: null, error: j.error ?? "สร้าง QR ไม่สำเร็จ" };
    }
    if (j.configured === false || !j.qrDataUrl) {
      return { qrDataUrl: null, error: "ร้านยังไม่ได้ตั้งเบอร์พร้อมเพย์" };
    }
    return { qrDataUrl: j.qrDataUrl, error: null };
  } catch {
    return { qrDataUrl: null, error: "เชื่อมต่อไม่สำเร็จ" };
  }
}
