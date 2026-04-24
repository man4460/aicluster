import { normalizeTelegramChatId } from "@/lib/telegram/slip-forward-chat";

/**
 * ส่งรูปจาก data URL ไป Telegram ด้วย sendPhoto (multipart — ไม่รองรับ JSON+base64)
 */
export async function sendTelegramPhotoFromDataUrl(args: {
  imageDataUrl: string;
  caption: string;
  chatId: string;
}): Promise<
  { ok: true; messageId: number; chatId: string } | { ok: false; error: string }
> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return { ok: false, error: "missing TELEGRAM_BOT_TOKEN" };

  const m = args.imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) return { ok: false, error: "invalid image data URL" };
  const mime = m[1];
  const b64 = m[2];
  const lowerMime = mime.toLowerCase();
  let ext = "jpg";
  if (lowerMime.includes("png")) ext = "png";
  else if (lowerMime.includes("webp")) ext = "webp";
  else if (lowerMime.includes("gif")) ext = "gif";

  const apiBase = process.env.TELEGRAM_API_URL?.trim() || `https://api.telegram.org/bot${token}`;
  const caption = args.caption.trim().slice(0, 1024);

  const buf = Buffer.from(b64, "base64");
  const blob = new Blob([buf], { type: mime });
  const form = new FormData();
  form.set("chat_id", args.chatId);
  form.set("caption", caption);
  form.set("photo", blob, `slip-chat-ui.${ext}`);

  try {
    const res = await fetch(`${apiBase}/sendPhoto`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(90_000),
    });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      description?: string;
      result?: { message_id?: number; chat?: { id?: number } };
    };
    if (!res.ok || json.ok !== true) {
      const msg = typeof json.description === "string" ? json.description : `HTTP ${res.status}`;
      return { ok: false, error: msg };
    }
    const messageId = json.result?.message_id;
    const rawChatId = json.result?.chat?.id;
    if (messageId == null || rawChatId == null) {
      return { ok: false, error: "sendPhoto: missing message_id or chat id in response" };
    }
    return { ok: true, messageId, chatId: normalizeTelegramChatId(rawChatId) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "sendPhoto failed";
    return { ok: false, error: msg };
  }
}
