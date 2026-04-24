import { prisma } from "@/lib/prisma";
import { getTelegramSlipForwardChatId, normalizeTelegramChatId } from "@/lib/telegram/slip-forward-chat";

/**
 * ถ้าข้อความในกลุ่ม Mavel เป็นการ reply ต่อรูปสลิปที่บอทส่งจาก Chat UI
 * → ฝังเป็นข้อความผู้ช่วยใน personal chat แล้วลบแถว pending
 */
export async function tryDeliverMavelSlipReplyToChatUi(args: {
  chatId: number;
  replyToMessageId: number | undefined;
  text: string;
  senderUsername?: string;
  senderIsBot?: boolean;
}): Promise<boolean> {
  const forwardEnv = getTelegramSlipForwardChatId();
  if (!forwardEnv) return false;
  const chatIdStr = normalizeTelegramChatId(args.chatId);
  if (chatIdStr !== forwardEnv) return false;
  if (args.replyToMessageId == null) return false;
  const text = args.text.trim();
  if (!text) return false;
  if (args.senderIsBot === false) return false;
  const expectedBotUsername = (process.env.TELEGRAM_SLIP_REPLY_BOT_USERNAME?.trim() || "mawellltp_bot")
    .replace(/^@/, "")
    .toLowerCase();
  const sender = (args.senderUsername || "").replace(/^@/, "").toLowerCase();
  if (!sender || sender !== expectedBotUsername) return false;
  if (!looksLikeSlipAnalysisReply(text)) return false;

  const pending = await prisma.personalChatMavelSlipPending.findUnique({
    where: {
      mavelChatId_mavelMessageId: {
        mavelChatId: chatIdStr,
        mavelMessageId: args.replyToMessageId,
      },
    },
  });
  if (!pending) return false;

  const content = text.length > 120_000 ? `${text.slice(0, 120_000)}\n\n…` : text;

  await prisma.$transaction(async (tx) => {
    await tx.personalChatMessage.create({
      data: {
        sessionId: pending.sessionId,
        userId: pending.userId,
        role: "ASSISTANT",
        content,
      },
    });
    await tx.personalChatMavelSlipPending.delete({ where: { id: pending.id } });
    await tx.personalChatSession.update({
      where: { id: pending.sessionId },
      data: { lastMessageAt: new Date() },
    });
  });

  return true;
}

function looksLikeSlipAnalysisReply(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (t.length < 24) return false;
  if (/^(สวัสดี|hello|hi|มีอะไรให้ช่วย|มีอะไรให้ช่วยไหม|ช่วยอะไรได้บ้าง)/iu.test(t)) return false;
  const scoreWords = [
    "ยอด",
    "จำนวนเงิน",
    "บาท",
    "วันที่",
    "เวลา",
    "ผู้โอน",
    "ผู้รับ",
    "ธนาคาร",
    "สถานะ",
    "อ้างอิง",
    "ref",
    "อ่านไม่ชัด",
    "บันทึก",
  ];
  let hit = 0;
  const lower = t.toLowerCase();
  for (const w of scoreWords) {
    if (lower.includes(w.toLowerCase())) hit += 1;
    if (hit >= 2) return true;
  }
  return false;
}
