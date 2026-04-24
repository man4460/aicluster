import { NextResponse } from "next/server";
import { z } from "zod";
import { runPersonalAiChat } from "@/lib/chat-ai/personal-ai-service";
import { tryDeliverMavelSlipReplyToChatUi } from "@/lib/telegram/mavel-slip-reply-to-chat-ui";
import { prisma } from "@/lib/prisma";

const telegramUpdateSchema = z.object({
  message: z
    .object({
      message_id: z.number(),
      text: z.string().optional(),
      caption: z.string().optional(),
      reply_to_message: z
        .object({
          message_id: z.number(),
        })
        .passthrough()
        .optional(),
      photo: z
        .array(
          z.object({
            file_id: z.string(),
            width: z.number().optional(),
            height: z.number().optional(),
            file_size: z.number().optional(),
          }),
        )
        .optional(),
      from: z
        .object({
          id: z.number(),
        })
        .passthrough(),
      chat: z
        .object({
          id: z.coerce.number(),
        })
        .passthrough(),
    })
    .passthrough()
    .optional(),
});

function readWebhookSecret(req: Request): string {
  return req.headers.get("x-telegram-bot-api-secret-token")?.trim() || "";
}

function getTelegramApiBase(): string | null {
  const custom = process.env.TELEGRAM_API_URL?.trim();
  if (custom) return custom;
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return null;
  return `https://api.telegram.org/bot${token}`;
}

function getTelegramBotToken(): string | null {
  const direct = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (direct) return direct;
  const custom = process.env.TELEGRAM_API_URL?.trim();
  if (!custom) return null;
  const m = custom.match(/\/bot([^/]+)\/?$/i);
  return m?.[1]?.trim() || null;
}

function guessImageMimeFromFilePath(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

async function telegramPhotoToDataUrl(args: { apiBase: string; fileId: string }): Promise<string | null> {
  const token = getTelegramBotToken();
  if (!token) return null;

  const fileMetaUrl = new URL(`${args.apiBase}/getFile`);
  fileMetaUrl.searchParams.set("file_id", args.fileId);
  const metaRes = await fetch(fileMetaUrl.toString(), { signal: AbortSignal.timeout(20_000) });
  const metaJson = (await metaRes.json()) as {
    ok?: boolean;
    result?: { file_path?: string };
    description?: string;
  };
  if (!metaRes.ok || !metaJson.ok || !metaJson.result?.file_path) {
    return null;
  }

  const filePath = metaJson.result.file_path;
  const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
  const imgRes = await fetch(downloadUrl, { signal: AbortSignal.timeout(30_000) });
  if (!imgRes.ok) return null;

  const contentType = imgRes.headers.get("content-type")?.split(";")[0]?.trim();
  const arrayBuffer = await imgRes.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mime = contentType && contentType.startsWith("image/") ? contentType : guessImageMimeFromFilePath(filePath);
  return `data:${mime};base64,${base64}`;
}

async function sendTelegramMessage(args: { apiBase: string; chatId: number; text: string }) {
  await fetch(`${args.apiBase}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: args.chatId,
      text: args.text,
    }),
    signal: AbortSignal.timeout(20_000),
  });
}

async function copyTelegramMessage(args: {
  apiBase: string;
  toChatId: number;
  fromChatId: number;
  messageId: number;
}) {
  await fetch(`${args.apiBase}/copyMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: args.toChatId,
      from_chat_id: args.fromChatId,
      message_id: args.messageId,
    }),
    signal: AbortSignal.timeout(30_000),
  });
}

function parseForwardTargetChatId(): number | null {
  const raw =
    process.env.TELEGRAM_MAVEL_FORWARD_CHAT_ID?.trim() ||
    process.env.TELEGRAM_FORWARD_SLIPS_TO_CHAT_ID?.trim() ||
    "";
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return n;
}

export async function POST(req: Request) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (expectedSecret && expectedSecret !== readWebhookSecret(req)) {
    return NextResponse.json({ error: "invalid webhook secret" }, { status: 401 });
  }

  const apiBase = getTelegramApiBase();
  if (!apiBase) {
    return NextResponse.json({ error: "missing TELEGRAM_BOT_TOKEN or TELEGRAM_API_URL" }, { status: 500 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const parsed = telegramUpdateSchema.safeParse(raw);
  if (!parsed.success || !parsed.data.message) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const message = parsed.data.message;
  const mavelDelivered = await tryDeliverMavelSlipReplyToChatUi({
    chatId: message.chat.id,
    replyToMessageId: message.reply_to_message?.message_id,
    text: (message.text ?? message.caption ?? "").trim(),
    senderUsername: typeof message.from.username === "string" ? message.from.username : undefined,
    senderIsBot: typeof message.from.is_bot === "boolean" ? message.from.is_bot : undefined,
  });
  if (mavelDelivered) {
    return NextResponse.json({ ok: true, mavelSlipReplyToChatUi: true });
  }

  const chatId = String(message.from.id);
  const hasPhoto = Boolean(message.photo && message.photo.length > 0);
  const text = (message.text ?? message.caption ?? "").trim();
  if (!text && !hasPhoto) {
    return NextResponse.json({ ok: true, ignored: true, reason: "no text or photo" });
  }

  const user = await prisma.user.findFirst({
    where: { telegramChatId: chatId },
    select: { id: true, username: true, fullName: true },
  });
  if (!user) {
    await sendTelegramMessage({
      apiBase,
      chatId: message.chat.id,
      text: "ยังไม่พบบัญชีที่เชื่อมกับ Telegram นี้ กรุณาเชื่อมบัญชีก่อนใช้งาน",
    });
    return NextResponse.json({ ok: true, linked: false });
  }

  const forwardTo = parseForwardTargetChatId();
  if (hasPhoto && forwardTo) {
    await copyTelegramMessage({
      apiBase,
      toChatId: forwardTo,
      fromChatId: message.chat.id,
      messageId: message.message_id,
    });
    await sendTelegramMessage({
      apiBase,
      chatId: message.chat.id,
      text: "📸 ได้รับรูปสลิปแล้ว — ส่งต่อให้น้องมาเวลวิเคราะห์ผ่าน Telegram แล้ว",
    });
  }

  const largestPhoto = message.photo?.length ? message.photo[message.photo.length - 1] : null;
  const imageDataUrl =
    largestPhoto?.file_id != null
      ? await telegramPhotoToDataUrl({ apiBase, fileId: largestPhoto.file_id })
      : null;

  if (hasPhoto && !imageDataUrl) {
    await sendTelegramMessage({
      apiBase,
      chatId: message.chat.id,
      text: "ได้รับรูปแล้ว แต่ดึงไฟล์จาก Telegram ไม่สำเร็จ กรุณาลองส่งรูปใหม่อีกครั้ง",
    });
    return NextResponse.json({ ok: true, photoFetchFailed: true });
  }

  const reply = await runPersonalAiChat({
    userId: user.id,
    username: user.username,
    displayName: user.fullName?.trim() || user.username,
    message: text || "อ่านสลิปนี้",
    ...(imageDataUrl ? { imageDataUrl } : {}),
  });

  const replyText = reply.ok
    ? "reply" in reply
      ? reply.reply
      : reply.message
    : `ขออภัย เกิดข้อผิดพลาด: ${reply.error}`;

  await sendTelegramMessage({
    apiBase,
    chatId: message.chat.id,
    text: replyText.slice(0, 3900),
  });

  return NextResponse.json({ ok: true, forwardedPhoto: Boolean(hasPhoto && forwardTo) });
}
