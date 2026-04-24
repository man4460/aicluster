/**
 * รูปแบบ id เดียวกันสำหรับส่ง/รับจาก Telegram (เทียบ pending กับ update)
 */
export function normalizeTelegramChatId(id: string | number | bigint): string {
  if (typeof id === "bigint") return id.toString();
  if (typeof id === "string") {
    const n = Number(id.trim());
    if (!Number.isFinite(n)) return id.trim();
    return String(Math.trunc(n));
  }
  if (!Number.isFinite(id)) return String(id);
  return String(Math.trunc(id));
}

/** แชทปลายทางสำหรับส่งรูปสลิปจาก Chat UI (เดียวกับ forward จาก webhook ได้) */
export function getTelegramSlipForwardChatId(): string | null {
  const raw =
    process.env.TELEGRAM_CHAT_UI_SLIP_CHAT_ID?.trim() ||
    process.env.TELEGRAM_MAVEL_FORWARD_CHAT_ID?.trim() ||
    process.env.TELEGRAM_FORWARD_SLIPS_TO_CHAT_ID?.trim() ||
    "";
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return String(Math.trunc(n));
}
