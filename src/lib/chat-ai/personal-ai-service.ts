import { createClient } from "openclaw-sdk";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getTelegramSlipForwardChatId, normalizeTelegramChatId } from "@/lib/telegram/slip-forward-chat";
import { ollamaCallVisionText } from "@/lib/ollama/ollama-vision";
import { sendTelegramPhotoFromDataUrl } from "@/lib/telegram/send-photo-from-data-url";
import { dataUrlToBase64Raw, readSlipWithKimiThenGlmOcr, type GlmOcrSlipResult } from "@/lib/vision/glm-ocr-service";
import {
  createHomeFinanceQuickEntry,
  parseFinanceIncomeDigestEntries,
  parseFinanceRecordCommand,
  todayYmdBangkok,
  type ParsedFinanceChatCommand,
} from "@/lib/home-finance/quick-entry";
import {
  OLLAMA_DEFAULT_SLIP_VISION_MODEL,
  SLIP_ANALYSIS_CHECKLIST_LINES,
  SLIP_CAPTION_COMMANDS_SUMMARY_HEADER,
  SLIP_POST_READ_CAPTION_LINE,
  SLIP_ASK_WHETHER_TO_SAVE_LINE,
  SLIP_SEND_RESULT_TO_CHAT_UI_LINE,
  SLIP_UNCERTAINTY_RULE_LINE,
  THAI_SLIP_VISION_OCR_BLOCK,
  withThaiSlipOcrPreamble,
} from "@/lib/home-finance/slip-vision-prompts";
import {
  formatHitsForPrompt,
  formatThaiDateHeader,
  searchWithGoogleApi,
  type GoogleSearchHit,
} from "@/lib/chat-ai/google-search";

type MemoryMessage = { role: "user" | "assistant"; content: string };
type ChatProviderResult = {
  reply: string;
  provider: "openclaw-agent" | "ollama" | "local-tools" | "telegram-forward";
  model: string;
};
type ToolExecutionResult = { used: boolean; summary: string };

/** คอลัมน์ `pending_slip_draft` มีใน DB — ถ้า TS ยังไม่รู้จักหลังแก้ schema ให้รัน `npx prisma generate` */
function personalSessionPendingDraftData(
  data: { pendingSlipDraft: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | null },
): Prisma.PersonalChatSessionUpdateInput {
  return data as Prisma.PersonalChatSessionUpdateInput;
}

function personalSessionPendingDraftDataMany(
  data: { pendingSlipDraft: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | null },
): Prisma.PersonalChatSessionUpdateManyMutationInput {
  return data as Prisma.PersonalChatSessionUpdateManyMutationInput;
}

/** ร่างรายการสลิปที่เก็บใน chat_sessions.pending_slip_draft */
type PendingSlipDraftV1 = {
  v: 1;
  entryDateYmd: string;
  amountBaht: number;
  type: "INCOME" | "EXPENSE";
  categoryLabel: string;
  title: string;
  note?: string | null;
  billNumber?: string | null;
  paymentMethod?: string | null;
};

function parsePendingSlipDraft(raw: unknown): PendingSlipDraftV1 | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const ymd = typeof o.entryDateYmd === "string" ? o.entryDateYmd.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const amtRaw = o.amountBaht;
  const amt = typeof amtRaw === "number" ? amtRaw : Number(amtRaw);
  if (!Number.isFinite(amt) || amt <= 0) return null;
  if (o.type !== "INCOME" && o.type !== "EXPENSE") return null;
  const categoryLabel =
    typeof o.categoryLabel === "string" && o.categoryLabel.trim()
      ? o.categoryLabel.trim().slice(0, 100)
      : "อื่นๆ";
  const title =
    typeof o.title === "string" && o.title.trim()
      ? o.title.trim().slice(0, 160)
      : o.type === "INCOME"
        ? "รายรับ"
        : "รายจ่าย";
  const note = typeof o.note === "string" && o.note.trim() ? o.note.trim().slice(0, 600) : null;
  const billNumber =
    typeof o.billNumber === "string" && o.billNumber.trim() ? o.billNumber.trim().slice(0, 100) : null;
  const paymentMethod =
    typeof o.paymentMethod === "string" && o.paymentMethod.trim() ? o.paymentMethod.trim().slice(0, 40) : null;
  return {
    v: 1,
    entryDateYmd: ymd,
    amountBaht: amt,
    type: o.type,
    categoryLabel,
    title,
    note,
    billNumber,
    paymentMethod,
  };
}

function pendingDraftFromSlipResult(slip: GlmOcrSlipResult): PendingSlipDraftV1 | null {
  if (slip.amountBaht == null || !Number.isFinite(slip.amountBaht) || slip.amountBaht <= 0) return null;
  const ymdRaw = slip.entryDateYmd?.trim() ?? "";
  const entryDateYmd = /^\d{4}-\d{2}-\d{2}$/.test(ymdRaw) ? ymdRaw : todayYmdBangkok();
  const type: "INCOME" | "EXPENSE" =
    slip.directionGuess === "in" ? "INCOME" : slip.directionGuess === "out" ? "EXPENSE" : "EXPENSE";
  const parts = [
    slip.slipNote?.trim(),
    slip.transferFrom && `ผู้โอน: ${slip.transferFrom}`,
    slip.transferTo && `ผู้รับ: ${slip.transferTo}`,
  ].filter(Boolean) as string[];
  let note = parts.join("\n").slice(0, 600);
  if (slip.entryTime?.trim()) {
    const t = `เวลา: ${slip.entryTime.trim()}`;
    note = note ? `${note}\n${t}`.slice(0, 600) : t;
  }
  const title =
    (slip.transferTo || slip.bankName || "รายการจากสลิป").trim().slice(0, 160) || "รายการจากสลิป";
  return {
    v: 1,
    entryDateYmd,
    amountBaht: slip.amountBaht,
    type,
    categoryLabel: "อื่นๆ",
    title,
    note: note || null,
    billNumber: slip.reference?.trim() ? slip.reference.trim().slice(0, 100) : null,
    paymentMethod: slip.bankName?.trim() ? slip.bankName.trim().slice(0, 40) : null,
  };
}

/** ผู้ใช้ตอบสั้นๆ ว่าต้องการบันทึกรายการจากสลิปล่าสุดลงบัญชี */
function isSlipSaveConfirmation(raw: string): boolean {
  const m = raw.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (!m || m.length > 80) return false;
  if (/ไม่\s*(ยืนยัน|ต้องการ|เอา|บันทึก)/u.test(m)) return false;
  if (parseFinanceRecordCommand(m)) return false;
  if (extractQuickNoteContent(m)) return false;
  const normalized = m.replace(/\s+/g, " ").trim();
  if (
    /^(ยืนยัน(ค่ะ|ครับ|นะ)?|ตกลง(ค่ะ|ครับ)?|บันทึก(เลย|รายการ|เข้าบัญชี)?|จด(เลย)?|โอเค(ค่ะ|ครับ)?|ok|okay|เยี่ยม|ช่วยบันทึก(ให้หน่อย)?)[\s!.。]*$/iu.test(
      normalized,
    )
  ) {
    return true;
  }
  return /^ยืนยัน(?:ค่ะ|ครับ|นะ)?\s*ให้\s*(?:บันทึก|จด)(?:\s*เลย)?(?:\s*(?:ค่ะ|ครับ|นะ)?)?[\s!.。]*$/iu.test(
    normalized,
  );
}

/** ตัดโน้ตผู้ใช้ที่บันทึกใน DB (ไม่รวมบล็อกผลเครื่องมือ / คำบอกแนบรูป) — คงข้อความหลายบรรทัดไว้ให้แมตช์สรุปรายรับ/รายจ่าย */
function stripStoredUserMessageForFinanceParse(content: string): string {
  let base = content.split(/\n\n\[ผลการเรียกเครื่องมือ\]/u)[0] ?? content;
  base = base.replace(/\n\n\[ผู้ใช้แนบรูปภาพ[^\]]*\]/u, "").trim();
  return base;
}

/** ข้อความ user รอบก่อนมี [ผลการเรียกเครื่องมือ] ที่บันทึกบัญชีสำเร็จแล้ว */
function storedUserMessageAlreadySavedFinanceFromTool(content: string): boolean {
  if (!/\[\s*ผลการเรียกเครื่องมือ\s*\]/u.test(content)) return false;
  if (/\[\s*ผลการเรียกเครื่องมือ\s*\][\s\S]*บันทึกไม่สำเร็จ/u.test(content)) return false;
  if (/\[\s*ผลการเรียกเครื่องมือ\s*\][\s\S]*ไม่สำเร็จ/u.test(content)) return false;
  return /\[\s*ผลการเรียกเครื่องมือ\s*\][\s\S]*รายการ\s*#\d+/u.test(content);
}

function financeCommandsFromUserMessage(message: string): ParsedFinanceChatCommand[] {
  const digest = parseFinanceIncomeDigestEntries(message);
  if (digest.length > 0) return digest;
  const one = parseFinanceRecordCommand(message);
  return one ? [one] : [];
}

async function createHomeFinanceEntriesFromParsedCommands(args: {
  userId: string;
  sessionId: string | null | undefined;
  cmds: ParsedFinanceChatCommand[];
}): Promise<ToolExecutionResult> {
  const parts: string[] = [];
  for (const financeCmd of args.cmds) {
    const created = await createHomeFinanceQuickEntry({
      actorUserId: args.userId,
      entryDateYmd: todayYmdBangkok(),
      amount: financeCmd.amount,
      title: financeCmd.title,
      type: financeCmd.isIncome ? "INCOME" : "EXPENSE",
      categoryLabel: financeCmd.categoryLabel,
    });
    if (!created.ok) {
      return { used: true, summary: `บันทึกไม่สำเร็จ: ${created.error}` };
    }
    const kind = financeCmd.isIncome ? "รายรับ" : "รายจ่าย";
    const amt = financeCmd.amount.toLocaleString("th-TH");
    const cat =
      financeCmd.categoryLabel && financeCmd.categoryLabel !== "อื่นๆ"
        ? ` (หมวด ${financeCmd.categoryLabel})`
        : "";
    parts.push(
      `บันทึก${kind} ${amt} บาท${cat}${financeCmd.title ? ` — ${financeCmd.title}` : ""} แล้วค่ะ ✅ (รายการ #${created.entryId})`,
    );
  }
  const sidClear = args.sessionId?.trim();
  if (sidClear) {
    await prisma.personalChatSession.updateMany({
      where: { id: sidClear, userId: args.userId },
      data: personalSessionPendingDraftDataMany({ pendingSlipDraft: null }),
    });
  }
  return { used: true, summary: parts.join("\n") };
}

/** เมื่อผู้ใช้พิมพ์ยืนยันแต่ไม่มีสลิปค้าง — ลองรวบรวมรายการจากข้อความผู้ใช้ล่าสุดที่แปลงเป็นบัญชีได้ */
async function trySaveFinanceFromRecentUserMessages(args: {
  sessionId: string;
  userId: string;
}): Promise<ToolExecutionResult | null> {
  const recentUsers = await prisma.personalChatMessage.findMany({
    where: { sessionId: args.sessionId, userId: args.userId, role: "USER" },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { content: true },
  });
  for (const row of recentUsers) {
    const rawStrip = stripStoredUserMessageForFinanceParse(row.content);
    if (!rawStrip) continue;
    if (isSlipSaveConfirmation(rawStrip)) continue;
    const cmds = financeCommandsFromUserMessage(rawStrip);
    if (cmds.length === 0) continue;
    if (storedUserMessageAlreadySavedFinanceFromTool(row.content)) {
      return {
        used: true,
        summary: "รายการนี้บันทึกลงบัญชีไปแล้วในรอบข้อความก่อนหน้าแล้วค่ะ ✅",
      };
    }
    return await createHomeFinanceEntriesFromParsedCommands({
      userId: args.userId,
      sessionId: args.sessionId,
      cmds,
    });
  }
  return null;
}

export type PersonalAiRequest = {
  userId: string;
  username: string;
  /** ชื่อที่ใช้เรียกในแชท (เช่น fullName) — ถ้าไม่ส่งใช้ username */
  displayName?: string;
  sessionId?: string;
  message?: string;
  imageDataUrl?: string;
  reset?: boolean;
};

export type PersonalAiResult =
  | {
      ok: true;
      sessionId: string | null;
      reply: string;
      provider: string;
      model: string;
      assistantId: string;
      /** จำนวนข้อความใน session หลังรอบนี้ (ใช้ poll รับผลจาก Mavel) */
      sessionMessageCount: number;
      /** true ถ้ารอรับข้อความ reply ต่อรูปในกลุ่ม Telegram แล้ว (ให้ฝั่ง client poll) */
      awaitingMavelSlipReply: boolean;
    }
  | {
      ok: true;
      reset: true;
      sessionId: string | null;
      assistantId: string;
      message: string;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

function buildPrompt(messages: MemoryMessage[], userName: string): string {
  const now = new Date();
  const todayTh = now.toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeTh = now.toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const thaiInfo = `
## 📌 ข้อมูลอ้างอิง (Thailand Info 2569)

### วันหยุดไทย:
- 1 ม.ค.: วันขึ้นปีใหม่
- 13-15 เม.ย.: สงกรานต์
- 1 พ.ค.: วันแรงงาน
- 5 พ.ค.: วันพระปฏิมากร
- เดือน ส.ค.: วันเฉลิมพระชนมพรรษา ร.10
- 23 ต.ค.: วันปิยะมหาราช
- 5 ธ.ค.: วันชาติไทย
- 10 ธ.ค.: วันรัฐธรรมนูญ

### อัตราภาษีเงินได้:
- 0-150,000 บ.: ยกเว้น
- 150,001-300,000 บ.: 5%
- 300,001-500,000 บ.: 10%
- 500,001-750,000 บ.: 15%
- 750,001-1,000,000 บ.: 20%
- มากกว่า 1 ล้าน: 25-35%

### ค่าแรงขั้นต่ำ:
- กทม./ปริมณฑล: 363-400 บ./วัน
- ตจว.: 330-363 บ./วัน
`.trim();

  const calculatorGuide = `
## 🧮 วิธีคำนวณที่ควรรู้
- ดอกเบี้ย = เงินต้น × อัตรา% × ปี
- %กำไร = (ขาย-ซื้อ)/ซื้อ × 100
- ราคาหลังส่วนลด = ราคาเต็ม × (1-ส่วนลด%)
`.trim();

  const intro = [
    `คุณคือ **น้องมาเวล** (Mavel) 🤖 — เลขาส่วนตัวของ ${userName}`,
    "",
    `📅 วันนี้ (เวลาไทย): ${todayTh}`,
    `🕐 เวลาปัจจุบัน (เวลาไทย): ${timeTh}`,
    "",
    "## ลักษณะการทำงาน",
    "- ตอบภาษาไทยเท่านั้น (ห้ามใช้ภาษาอื่น เช่น จีน/อังกฤษ ยกเว้นคำเทคนิคที่จำเป็นจริง ๆ)",
    "- ถ้าผู้ใช้พิมพ์ภาษาอื่น ให้ตอบกลับเป็นภาษาไทยเท่านั้น โดยไม่สลับภาษา",
    "- มีบุคลิกผู้ช่วยอัจฉริยะ ใช้ emoji พอเหมาะ (ไม่มากเกินไป)",
    "- ถ้าไม่แน่ใจ ให้บอกตรงๆ ว่าไม่แน่ใจ — ห้ามเดา; เสนอวิธีตรวจสอบ/ขอข้อมูลเพิ่มที่จำเป็น",
    "- ถ้าคำถามเกี่ยวกับ “ตอนนี้กี่โมง/วันนี้วันอะไร” ให้ใช้ค่าเวลาไทยด้านบนเป็นหลัก",
    "",
    "## คุณสามารถทำได้",
    "1) **วิเคราะห์สลิป/ใบเสร็จ** — เน้น: วันที่/เวลา, ยอด/จำนวนเงิน (บาท), รหัสอ้างอิง, ผู้โอน-ผู้รับ/บัญชี/พร้อมเพย์, ธนาคาร/ช่องทางและสถานะ; อ่านตรงกับที่เห็น ห้ามเดา; เมื่ออ่านเสร็จ สรุปชัดและบอกจุดที่อ่านไม่ชัด (ถ้ามีรูปแนบหรือข้อความอธิบาย)",
    "2) **จดบันทึก** — จำสิ่งสำคัญที่พี่บอก และยืนยันสั้นๆ เมื่อบันทึกสำเร็จ",
    "3) **วางแผน** — ช่วยวางแผนงาน การเงิน ชีวิต แบบเป็นขั้นตอนทำต่อได้จริง",
    [
      "4) **การค้นหาข้อมูล / ข่าว (Google Custom Search):**",
      "   - ถ้าถามเรื่องข่าว/ข้อมูลปัจจุบัน ระบบจะแนบผลค้นจาก Google มาเป็น `[ผลการเรียกเครื่องมือ]`",
      "   - ให้สรุป **เฉพาะจาก** ข้อมูลในผลค้นหาที่แนบมา ห้ามแต่งข้อมูลที่ไม่มี",
      "   - **ข่าว**: ทำตามรูปแบบ news digest (หัวข้อวันที่ → หมวด+อิโมจิ → bullet \"• \" → ปิดท้ายชวนถาม)",
      "   - **เว็บทั่วไป**: ตอบตรงคำถามเป็น bullet สั้น 4-8 ข้อ พร้อมเน้น **bold** ตัวเลข/ชื่อสำคัญ",
      "   - ถ้าไม่มีบล็อก `[ผลการเรียกเครื่องมือ]` แต่ผู้ใช้ขอข่าว/ข้อมูล → บอกว่ายังค้นไม่ได้ (ตั้ง GOOGLE_CSE_ID) อย่าเดาข่าวเอง",
    ].join("\n"),
    "5) **คำนวณ** — คิดเลข เปรียบเทียบตัวเลข สรุปเป็นข้อๆ",
    "6) **แนะนำ** — ให้คำแนะนำที่มีเหตุผล และบอกข้อจำกัดเมื่อจำเป็น",
    "",
    "## เครื่องมือภายในที่ระบบเตรียมไว้",
    "- ฝั่งเซิร์ฟเวอร์จะแนบผลจริงเป็นบรรทัด `[ผลการเรียกเครื่องมือ]` ในข้อความผู้ใช้ เมื่อมีการบันทึกโน้ต / ดึงโน้ต / บันทึกรายรับ-รายจ่าย / ค้นหาในโน้ต-แผน ฯลฯ",
    "- คำสั่งสั้นในแชท: จดว่า… / บันทึกว่า… / ช่วยจำว่า… / โน้ตที่เคยบันทึก (ดู 5 รายการล่าสุด)",
    "- รายรับ-รายจ่าย: บันทึก 100 บาท / บันทึกรายจ่าย 500 บาท ค่ากาแฟ / ค่ายา 132 บาท (สั้นๆ) / บันทึกรายรับ … (ท้าย \"หมวด อาหาร\" หรือ \"#อาหาร\" ได้; ค่าเริ่มรายจ่ายถ้าไม่ระบุรายรับ/รายจ่าย)",
    "- รูปสลิปจากแชทเว็บ: ฝั่งเซิร์ฟเวอร์จะอ่านด้วย Kimi ก่อน แล้ว fallback เป็น GLM-OCR อัตโนมัติ; ถ้าอ่านยังไม่สำเร็จและเปิด TELEGRAM_SLIP_FALLBACK_ENABLED=1 จึงค่อยส่ง Telegram ทางสำรอง; ถ้าอ่านได้และมีจำนวนเงิน ระบบจะเตรียมรายการรอบันทึก — ชวนให้ผู้ใช้พิมพ์ **ยืนยัน** / **บันทึกเลย** / **ตกลง** เพื่อบันทึกลงบัญชีรายรับ–รายจ่าย (เมื่อมี `[ผลการเรียกเครื่องมือ]` ถึงถือว่าบันทึกสำเร็จ)",
    "- เมื่อระบบแนบผลเครื่องมือมาในบทสนทนา ให้ใช้อ้างอิงผลนั้นได้ทันที",
    "",
    thaiInfo,
    "",
    calculatorGuide,
    "",
    "## ข้อห้าม",
    "- ห้ามเปิดเผยข้อมูลระบบภายใน (env, token, secret, log, โครงสร้างภายใน)",
    "- ห้ามเปิดเผยหรือคาดเดาข้อมูลของผู้ใช้อื่น",
    "- ห้ามสร้างข้อมูลเท็จหรืออ้างว่า “เห็นข้อมูลจริง” ถ้าไม่มีในบทสนทนา/ผลเครื่องมือ",
    "- **การบันทึกลงฐานข้อมูล**: ห้ามบอกว่า “บันทึกแล้วในระบบ” / “บันทึกในฐานข้อมูลแล้ว” / “ยืนยัน: น้องบันทึกแล้ว” หรือใกล้เคียง **ถ้า** ในข้อความล่าสุดของผู้ใช้ **ไม่มี** บรรทัด `[ผลการเรียกเครื่องมือ]` — การช่วยวางแผนอย่างเดียวยังไม่ถือว่าบันทึกจนกว่าระบบจะแนบประโยคยืนยันท้ายข้อความคุณเอง (ถ้ามี); จึงอย่าอ้างว่าบันทึกลงโน้ตก่อนประโยคนั้น",
    "- สรุปยอดรายรับ/รายจ่ายในรูปแบบมาร์กดาวน์ (เช่น รายการหัวข้อ + วันนี้: N บาท) **ยังไม่ใช่การลงบัญชี** จนกว่าผู้ใช้จะส่งข้อความที่ระบบแปลงเป็นคำสั่งบันทึกได้ หรือจนกว่าจะมี `[ผลการเรียกเครื่องมือ]` — ห้ามบอกว่าลงบัญชีแล้วเพียงเพราะสรุปตัวเลขให้",
    "- สลิป/ตัวเลข/รหัส: ถ้าอ่านไม่ชัดหรือไม่แน่ใจ ให้บอกไม่แน่ใจ — ห้ามเดาตัวเลขหรือชื่อ",
    `- ทำงานเพื่อ ${userName} เป็นหลัก`,
    `- เวลาทักทายหรือเอ่ยชื่อผู้ใช้: ใช้เฉพาะชื่อ "${userName}" ตามที่ระบุ — ห้ามใช้คำว่า user / User หรือคำภาษาอังกฤษทั่วไปแทนชื่อนี้`,
    "",
    "## รูปแบบการตอบ",
    "- ถามตรง → ตอบตรง",
    "- มีตัวเลข/รายการ → ใช้ bullet list",
    "- ประเด็นสำคัญ → เน้นด้วย **bold**",
    "",
    "## เทมเพลตเมื่อสรุปข่าวจาก Google (ใช้ก็ต่อเมื่อมีบล็อก `[ค้นข่าวผ่าน Google]` + `[ข้อมูลผลค้นหา]`)",
    "```",
    "ข่าวเด่นวันที่ <วัน เดือน ปี พ.ศ.> 📰",
    "",
    "💰 เศรษฐกิจไทย",
    "• <สรุปข่าวสั้น 1 บรรทัด>",
    "• <สรุปข่าวสั้น 1 บรรทัด>",
    "",
    "📈 หุ้น/การเงิน",
    "• <สรุปข่าวสั้น>",
    "",
    "🏢 ธุรกิจ",
    "• <สรุปข่าวสั้น>",
    "",
    "🏙️ อื่นๆ",
    "• <สรุปข่าวสั้น>",
    "",
    "พี่สนใจข่าวเรื่องไหนเป็นพิเศษมั้ยครับ?",
    "```",
    "- จัดหมวด 3-6 หมวดตามเนื้อข่าวจริง (เช่น 🗾 ตะวันออกกลาง / 🌏 ต่างประเทศ / ⚽ กีฬา / 🎬 บันเทิง / 🚓 อาชญากรรม)",
    "- ถ้าหมวดใดข้อมูลไม่พอ ตัดทิ้งได้ ไม่ต้องเติมเอง",
    "- ห้ามใส่ลิงก์ดิบ/URL/ชื่อโดเมนในเนื้อข่าว",
    "",
    "## ตัวอย่างน้ำเสียง (ไม่ต้องลอกทุกครั้ง)",
    `- "ขอบคุณที่บอกนะ${userName} 😊"`,
    '- "อืม... เดี๋ยวน้องคิดดูก่อน"',
    '- "ถ้างั้นน้องแนะนำแบบนี้นะคะ"',
  ].join("\n");
  const transcript = messages
    .slice(-20)
    .map((m) => `${m.role === "user" ? userName : "น้องมาเวล"}: ${m.content}`)
    .join("\n");
  return `${intro}\n\nบทสนทนาก่อนหน้า:\n${transcript}\n\nน้องมาเวล:`;
}

function enforceThaiOnlyReplyText(reply: string): string {
  const text = reply.trim();
  if (!text) return text;
  const cjk = /[\u3400-\u4DBF\u4E00-\u9FFF\u3000-\u303F]/u;
  const rawIdx = text.indexOf("ข้อความดิบจากโมเดล");
  const head = rawIdx >= 0 ? text.slice(0, rawIdx) : text;
  /** สรุปสลิปควรเป็นไทย; ส่วนข้อความดิบจาก OCR อาจมีอักขระจากสลิป — ไม่บล็อกทั้งก้อน */
  if (cjk.test(head)) {
    return "ขออภัยครับ ต่อจากนี้ผมจะตอบเป็นภาษาไทยเท่านั้น หากต้องการผมสรุปข้อความเดิมเป็นภาษาไทยให้ได้ครับ";
  }
  return text;
}

/** ดึงเนื้อหาโน้ตจากคำสั่งสั้นๆ (รองรับขอบันทึก / บันทึก … นอกจาก จดว่า…) */
function extractQuickNoteContent(raw: string): string | null {
  const message = raw.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (!message) return null;
  const paired = message.match(
    /^(จดว่า|บันทึกว่า|จำว่า|ฝากจำว่า|ช่วยจำว่า|ขอ(?:ให้)?จด|ขอ(?:ให้)?บันทึก|ช่วยจด|ช่วยบันทึก)\s*(.+)$/u,
  );
  if (paired?.[2]?.trim()) return paired[2].trim();
  const single = message.match(/^(?:บันทึก(?:หน่อย|ให้หน่อย|ว่า)?|จด)\s+(.+)$/u);
  if (single?.[1]?.trim()) return single[1].trim();
  return null;
}

/** บรรทัดแรกขึ้นด้วย จดว่า/บันทึกว่า/... + เนื้อหา (ไม่รวม "บันทึก 100 บาท" แบบสั้นที่อาจเป็นบัญชี) */
function isPairedPrefixQuickNoteLine(raw: string): boolean {
  const line = (raw.split(/\r?\n/)[0] ?? "")
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (!line) return false;
  return /^(จดว่า|บันทึกว่า|จำว่า|ฝากจำว่า|ช่วยจำว่า|ขอ(?:ให้)?จด|ขอ(?:ให้)?บันทึก|ช่วยจด|ช่วยบันทึก)\s+\S/u.test(
    line,
  );
}

/** ขอความช่วยเหลือเรื่องแผน/ตาราง — ใช้บันทึกข้อความตอบของ AI ลงโน้ตอัตโนมัติ (ไม่รวมคำสั่งจดโน้ต/บัญชี/ค้นหาโน้ต) */
function isPlanningAssistRequest(raw: string): boolean {
  const m = raw.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (!m || m.length > 4000) return false;
  if (extractQuickNoteContent(m)) return false;
  if (parseFinanceRecordCommand(m)) return false;
  if (
    /(โน้ต|บันทึก).*?(ล่าสุด|ที่จด|ที่เคย|ทั้งหมด)/.test(m) ||
    /โน้ตที่เคยบันทึก/u.test(m)
  ) {
    return false;
  }
  const lower = m.toLowerCase();
  if (/^(ค้นหา|หาข้อมูล)/u.test(m) || /^search\s/.test(lower)) return false;
  const head = (m.split(/\n/)[0] ?? "").slice(0, 200);
  if (
    /(ช่วย|ขอ|อยากได้|ต้องการ|จัด|วาง|ทำ|สร้าง|คิด)(?:ให้)?(?:หน่อย|มั้ย|ไหม)?.*(แผน|แผนงาน|ตาราง)/u.test(
      head,
    )
  ) {
    return true;
  }
  if (/^(?:ช่วย|ขอ)?(?:จัด|วาง|ทำ|สร้าง)(?:แผน|แผนงาน|ตาราง)/u.test(head)) return true;
  return false;
}

/** ผู้ใช้ขอ "ข่าว…" / "ข่าววันนี้" / "หาข่าว…" → ค้น Google + จัดเป็น news digest */
function isNewsDigestRequest(raw: string): boolean {
  const m = raw.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (!m || m.length > 4000) return false;
  if (extractQuickNoteContent(m)) return false;
  if (parseFinanceRecordCommand(m)) return false;
  if (/^(ขอ|ช่วย)?(หาข่าว|สรุปข่าว|ขอข่าว|ค้นข่าว|ฟีดข่าว)/u.test(m)) return true;
  if (/^ข่าว(วันนี้|เด่น|ด่วน|ล่าสุด|เช้านี้|ในประเทศ|ต่างประเทศ|ไทย|บ้านเรา|รอบโลก|กีฬา|บันเทิง|เศรษฐกิจ|การเมือง|หุ้น|เทคโนโลยี)?/u.test(m)) {
    return true;
  }
  return false;
}

/** ผู้ใช้ขอค้นเว็บทั่วไป (ที่ไม่ใช่ข่าว/โน้ต) — ใช้ Google ก่อน แล้วให้ AI สรุป */
function isWebSearchRequest(raw: string): boolean {
  const m = raw.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (!m || m.length > 4000) return false;
  if (extractQuickNoteContent(m)) return false;
  if (parseFinanceRecordCommand(m)) return false;
  if (isNewsDigestRequest(m)) return false;
  if (
    /(โน้ต|บันทึก).*?(ล่าสุด|ที่จด|ที่เคย|ทั้งหมด)/u.test(m) ||
    /โน้ตที่เคยบันทึก/u.test(m)
  ) {
    return false;
  }
  if (/^(ค้นหา|หาข้อมูล|ค้นเว็บ|หาบนเว็บ|หาในเว็บ|หาในกูเกิล|หาในกู|หาให้หน่อย)/u.test(m)) return true;
  if (/^(google|search|web)\s+/i.test(m)) return true;
  if (/^(ใครคือ|อะไรคือ|มันคืออะไร)/u.test(m)) return true;
  return false;
}

/** ดึงคิวรีจริงออกจากข้อความ (ตัดคำสั่งนำหน้าที่ใช้ trigger) */
function extractWebSearchQuery(raw: string): string {
  let q = raw.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  q = q.replace(/^(ขอ|ช่วย|ขอให้|รบกวน)\s*/u, "");
  q = q.replace(
    /^(ค้นหา|หาข้อมูล|ค้นเว็บ|หาบนเว็บ|หาในเว็บ|หาในกูเกิล|หาในกู|หาให้หน่อย|หาข่าว|สรุปข่าว|ขอข่าว|ค้นข่าว|ฟีดข่าว)\s*/u,
    "",
  );
  q = q.replace(/^(google|search|web)\s+/i, "");
  q = q.replace(/^ข่าว(วันนี้|เด่น|ด่วน|ล่าสุด|เช้านี้)?\s*/u, "");
  q = q.replace(/^(เรื่อง|เกี่ยวกับ)\s+/u, "");
  q = q.replace(/[?.!\u0e2f]+$/u, "").trim();
  return q;
}

/** เรียก Google + สรุปเป็น tool result ใส่บริบทให้ AI สังเคราะห์ต่อ */
async function runWebSearchTool(args: {
  query: string;
  mode: "news" | "web";
}): Promise<ToolExecutionResult> {
  const baseQuery = args.query.trim();
  const isNews = args.mode === "news";
  const queryFinal = isNews
    ? (baseQuery || "ข่าวเด่นวันนี้ ประเทศไทย").includes("ข่าว")
      ? baseQuery || "ข่าวเด่นวันนี้ ประเทศไทย"
      : `${baseQuery} ข่าววันนี้ ประเทศไทย`
    : baseQuery;
  if (!queryFinal) {
    return { used: true, summary: "ไม่ทราบหัวข้อที่ต้องการค้น — บอกหัวข้อให้น้องอีกครั้งนะคะ" };
  }
  let hits: GoogleSearchHit[] = [];
  try {
    hits = await searchWithGoogleApi({
      query: queryFinal,
      num: 10,
      hl: "th",
      gl: "th",
      safe: "active",
      dateRestrict: isNews ? "d2" : undefined,
      signal: AbortSignal.timeout(15_000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Google search error";
    return { used: true, summary: `ค้นข้อมูลผ่าน Google ไม่สำเร็จ: ${msg}` };
  }
  if (hits.length === 0) {
    return {
      used: true,
      summary: `ค้น Google สำหรับ "${queryFinal}" แล้วยังไม่พบผลลัพธ์ — ลองเปลี่ยนคำค้นหรือถามเฉพาะเจาะจงขึ้นได้ค่ะ`,
    };
  }
  const block = formatHitsForPrompt(hits, 2400);
  if (isNews) {
    const dateHeader = formatThaiDateHeader();
    const formatGuide = [
      '[คำสั่งจัดรูปแบบสรุป — ใช้ "ข้อมูลผลค้นหา" ด้านล่างเท่านั้น ห้ามแต่งเพิ่ม]',
      `1) บรรทัดแรก: "ข่าวเด่นวันที่ ${dateHeader} 📰"`,
      "2) จัดเป็นหมวดหมู่ 3-6 หมวด (เช่น เศรษฐกิจไทย / ตะวันออกกลาง / หุ้น-การเงิน / ธุรกิจ / อื่นๆ ฯลฯ ปรับตามเนื้อข่าวจริง)",
      "3) แต่ละหมวดขึ้นบรรทัดด้วยอิโมจิ + ชื่อหมวด (เช่น 💰 เศรษฐกิจไทย, 📈 หุ้น/การเงิน, 🏢 ธุรกิจ, 🏙️ อื่นๆ, 🗾 ตะวันออกกลาง)",
      "4) ใต้แต่ละหมวดใช้ bullet \"• \" สรุปข่าวสั้น 1 บรรทัดต่อข่าว ไม่เกิน 2 บรรทัด",
      "5) ห้ามใส่ลิงก์ดิบหรือชื่อเว็บไซต์ในเนื้อข่าว — สรุปสาระเป็นภาษาไทยกระชับ",
      "6) ปิดท้ายด้วยประโยคชวนถาม เช่น \"พี่สนใจข่าวเรื่องไหนเป็นพิเศษมั้ยครับ?\"",
      "7) ห้ามแต่งข่าวที่ไม่มีในผลค้นหา; ถ้าหมวดไหนข้อมูลไม่พอให้ตัดทิ้ง",
    ].join("\n");
    return {
      used: true,
      summary: [
        `[ค้นข่าวผ่าน Google] คิวรี: "${queryFinal}"`,
        formatGuide,
        "",
        "[ข้อมูลผลค้นหา]",
        block,
      ].join("\n"),
    };
  }
  const formatGuide = [
    '[คำสั่งจัดรูปแบบสรุป — ใช้ "ข้อมูลผลค้นหา" ด้านล่างเท่านั้น ห้ามแต่งเพิ่ม]',
    "- สรุปสาระเป็นภาษาไทยกระชับ 4-8 bullet",
    "- ใช้ **bold** เน้นชื่อ/ตัวเลขสำคัญ",
    "- ถ้าผู้ใช้ถามเฉพาะเรื่อง ให้ตอบตรงคำถาม + ปิดท้ายด้วยข้อสรุปสั้น 1 ประโยค",
    "- ห้ามแต่งข้อมูลที่ไม่มีในผลค้นหา; ถ้าไม่มั่นใจให้บอกตรงๆ",
  ].join("\n");
  return {
    used: true,
    summary: [
      `[ค้นเว็บผ่าน Google] คิวรี: "${queryFinal}"`,
      formatGuide,
      "",
      "[ข้อมูลผลค้นหา]",
      block,
    ].join("\n"),
  };
}

async function maybeRunPersonalTool(args: {
  userId: string;
  message: string;
  imageDataUrl?: string;
  sessionId?: string | null;
}): Promise<ToolExecutionResult> {
  const message = args.message.trim();
  if (!message) return { used: false, summary: "" };

  const sessionIdTool = args.sessionId?.trim() || null;
  if (sessionIdTool && isSlipSaveConfirmation(message)) {
    const sessionRow = await prisma.personalChatSession.findFirst({
      where: { id: sessionIdTool, userId: args.userId },
    });
    const draft = parsePendingSlipDraft(
      (sessionRow as { pendingSlipDraft?: Prisma.JsonValue | null } | null)?.pendingSlipDraft ?? null,
    );
    if (!draft) {
      const fromText = await trySaveFinanceFromRecentUserMessages({
        sessionId: sessionIdTool,
        userId: args.userId,
      });
      if (fromText) return fromText;
      return {
        used: true,
        summary:
          "ยังไม่มีข้อมูลสลิปที่รอบันทึก — ส่งรูปสลิปให้ระบบอ่านก่อน (ให้มีจำนวนเงินชัด) แล้วพิมพ์ ยืนยัน หรือ บันทึกเลย อีกครั้งค่ะ — หรือพิมพ์ยอดรายจ่าย/รายรับในข้อความเดียว เช่น ค่ายา 132 บาท",
      };
    }
    const created = await createHomeFinanceQuickEntry({
      actorUserId: args.userId,
      entryDateYmd: draft.entryDateYmd,
      amount: draft.amountBaht,
      title: draft.title,
      type: draft.type,
      categoryLabel: draft.categoryLabel,
      note: draft.note ?? null,
      billNumber: draft.billNumber ?? null,
      paymentMethod: draft.paymentMethod ?? null,
    });
    if (created.ok) {
      await prisma.personalChatSession.updateMany({
        where: { id: sessionIdTool, userId: args.userId },
        data: personalSessionPendingDraftDataMany({ pendingSlipDraft: null }),
      });
      const kind = draft.type === "INCOME" ? "รายรับ" : "รายจ่าย";
      const amt = draft.amountBaht.toLocaleString("th-TH");
      return {
        used: true,
        summary: `บันทึก${kind}จากสลิป ${amt} บาท — ${draft.title} ลงบัญชีแล้วค่ะ ✅ (รายการ #${created.entryId})`,
      };
    }
    return { used: true, summary: `บันทึกลงบัญชีไม่สำเร็จ: ${created.error}` };
  }

  const textForTools = stripStoredUserMessageForFinanceParse(message).trim();
  const lower = textForTools.toLowerCase();

  // โน้ต "จดว่า/บันทึกว่า/…" ต้องบันทึกลง personal_ai_note ก่อน — รายรับ-รายจ่าย ห้ามแย่งบรรทัดที่มี ค่า… N บาท
  if (isPairedPrefixQuickNoteLine(textForTools)) {
    const quickPaired = extractQuickNoteContent(textForTools);
    if (quickPaired) {
      const note = await prisma.personalAiNote.create({
        data: { userId: args.userId, content: quickPaired, tags: ["auto"] },
        select: { id: true, content: true },
      });
      return { used: true, summary: `บันทึกโน้ตแล้ว (#${note.id.slice(0, 8)}): ${note.content}` };
    }
  }

  // รายรับ-รายจ่าย (รวม "บันทึก 100 บาท" + สรุปหลายบรรทัด รายรับ/วันนี้: …) — รันหลัง จดว่า/… แบบคู่
  const financeCmds = financeCommandsFromUserMessage(textForTools);
  if (financeCmds.length > 0) {
    return await createHomeFinanceEntriesFromParsedCommands({
      userId: args.userId,
      sessionId: args.sessionId,
      cmds: financeCmds,
    });
  }

  const quickNote = extractQuickNoteContent(textForTools);
  if (quickNote) {
    const note = await prisma.personalAiNote.create({
      data: { userId: args.userId, content: quickNote, tags: ["auto"] },
      select: { id: true, content: true },
    });
    return { used: true, summary: `บันทึกโน้ตแล้ว (#${note.id.slice(0, 8)}): ${note.content}` };
  }

  if (
    /(โน้ต|บันทึก).*?(ล่าสุด|ที่จด|ที่เคย|ทั้งหมด)/.test(textForTools) ||
    /โน้ตที่เคยบันทึก/u.test(textForTools) ||
    /^get notes/.test(lower)
  ) {
    const notes = await prisma.personalAiNote.findMany({
      where: { userId: args.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { content: true },
    });
    if (!notes.length) return { used: true, summary: "ยังไม่มีโน้ตที่บันทึกไว้" };
    return {
      used: true,
      summary: `โน้ตล่าสุด:\n${notes.map((n, i) => `${i + 1}) ${n.content}`).join("\n")}`,
    };
  }

  if (isNewsDigestRequest(textForTools)) {
    const baseQuery = extractWebSearchQuery(textForTools);
    return await runWebSearchTool({ query: baseQuery, mode: "news" });
  }

  if (isWebSearchRequest(textForTools)) {
    const q = extractWebSearchQuery(textForTools);
    if (!q) return { used: false, summary: "" };
    return await runWebSearchTool({ query: q, mode: "web" });
  }

  if (args.imageDataUrl && /(สลิป|ใบเสร็จ|อ่านรูป|อ่านสลิป)/.test(textForTools)) {
    const rec = await prisma.personalAiSlipRecord.create({
      data: {
        userId: args.userId,
        imageUrl: args.imageDataUrl.slice(0, 2048),
        parsedData: { source: "chat-ai", note: "queued for parse" },
      },
      select: { id: true },
    });
    return { used: true, summary: `รับรูปสลิปแล้ว และบันทึกข้อมูลเบื้องต้น (#${rec.id.slice(0, 8)})` };
  }

  return { used: false, summary: "" };
}

function pickReplyFromPayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const obj = payload as Record<string, unknown>;
  if (typeof obj.reply === "string") return obj.reply.trim();
  if (typeof obj.response === "string") return obj.response.trim();
  if (typeof obj.output === "string") return obj.output.trim();
  if (typeof obj.text === "string") return obj.text.trim();
  if (obj.message && typeof obj.message === "object") {
    const msg = obj.message as Record<string, unknown>;
    if (typeof msg.content === "string") return msg.content.trim();
    if (typeof msg.text === "string") return msg.text.trim();
  }
  if (Array.isArray(obj.choices) && obj.choices.length > 0) {
    const c0 = obj.choices[0];
    if (c0 && typeof c0 === "object") {
      const choice = c0 as Record<string, unknown>;
      if (typeof choice.text === "string") return choice.text.trim();
      if (choice.message && typeof choice.message === "object") {
        const msg = choice.message as Record<string, unknown>;
        if (typeof msg.content === "string") return msg.content.trim();
      }
    }
  }
  return "";
}

async function callOpenClawAgent(args: {
  history: MemoryMessage[];
  prompt: string;
  assistantId: string;
}): Promise<ChatProviderResult | null> {
  const wsUrl =
    process.env.OPENCLAW_AGENT_WS_URL?.trim() ||
    process.env.OPENCLAW_GATEWAY_WS_URL?.trim() ||
    process.env.OPENCLAW_WS_URL?.trim() ||
    "ws://127.0.0.1:18789";
  if (!wsUrl) return null;
  const apiKey = process.env.OPENCLAW_API_KEY?.trim() || process.env.OPENCLAW_AGENT_API_KEY?.trim() || "";
  if (!apiKey) return null;
  const model = process.env.OPENCLAW_AGENT_MODEL?.trim() || "openclaw-agent";
  const method = process.env.OPENCLAW_AGENT_METHOD?.trim() || "chat.completions";
  const clientId = process.env.OPENCLAW_CLIENT_ID?.trim() || "aicluster-chat-ai";
  const requestTimeoutMs = Number(process.env.OPENCLAW_REQUEST_TIMEOUT_MS ?? "90000");

  const client = createClient({
    url: wsUrl,
    clientId,
    auth: { token: apiKey },
    connectTimeoutMs: requestTimeoutMs,
    requestTimeoutMs,
    autoReconnect: false,
  });
  try {
    await client.connect();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "connect failed";
    throw new Error(`เชื่อมต่อ OpenClaw Gateway ไม่สำเร็จ (${msg})`);
  }

  let payload: unknown;
  try {
    payload = await client.request(method, {
      task: "chat",
      assistantId: args.assistantId,
      model,
      messages: args.history.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      prompt: args.prompt,
      constraints: {
        disallowSystemDataLeak: true,
        disallowCrossUserDataLeak: true,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "request failed";
    throw new Error(`เรียก OpenClaw SDK ไม่สำเร็จ (${msg})`);
  } finally {
    client.disconnect();
  }

  const reply = pickReplyFromPayload(payload);
  if (!reply) {
    throw new Error("OpenClaw Agent ไม่ได้ส่งข้อความตอบกลับ");
  }
  return { reply, provider: "openclaw-agent", model };
}

function toOllamaBase64Image(imageDataUrl: string | undefined): string | null {
  if (!imageDataUrl) return null;
  const m = imageDataUrl.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  if (!m) return null;
  return m[1] ?? null;
}

async function callOllama(prompt: string, imageDataUrl?: string): Promise<ChatProviderResult | null> {
  const baseEndpoint = process.env.OLLAMA_API_URL?.trim() || process.env.OLLAMA_URL?.trim() || "";
  const baseModel = process.env.OLLAMA_MODEL?.trim() || "qwen2.5:7b";
  const imageBase64 = toOllamaBase64Image(imageDataUrl);
  const visionOrTextApiUrl = imageBase64
    ? (process.env.OLLAMA_VISION_API_URL?.trim() || baseEndpoint)
    : baseEndpoint;
  const visionModel =
    process.env.OLLAMA_VISION_MODEL?.trim() || OLLAMA_DEFAULT_SLIP_VISION_MODEL;
  const model = imageBase64 ? visionModel : baseModel;

  /* รูป: ใช้ OLLAMA_VISION_API_URL หรือ OLLAMA_API_URL; ข้อความ: ต้องมี OLLAMA_API_URL */
  if (imageBase64) {
    if (!visionOrTextApiUrl) return null;
  } else if (!baseEndpoint) {
    return null;
  }

  if (imageBase64) {
    const ollamaPrompt = withThaiSlipOcrPreamble(THAI_SLIP_VISION_OCR_BLOCK, prompt);
    const reply = await ollamaCallVisionText({
      apiUrlFromEnv: visionOrTextApiUrl,
      model,
      userPrompt: ollamaPrompt,
      imageBase64,
      temperature: 0.4,
      signal: AbortSignal.timeout(90_000),
    });
    return { reply, provider: "ollama", model };
  }

  if (!visionOrTextApiUrl) return null;
  const res = await fetch(visionOrTextApiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      prompt,
      options: { temperature: 0.4 },
    }),
    signal: AbortSignal.timeout(90_000),
  });

  const rawText = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    data = {};
  }
  if (!res.ok) {
    throw new Error((typeof data.error === "string" && data.error) || "เรียก Ollama ไม่สำเร็จ");
  }
  const reply = typeof data.response === "string" ? data.response.trim() : "";
  if (!reply) {
    throw new Error("Ollama ไม่ได้ส่งข้อความตอบกลับ");
  }
  return { reply, provider: "ollama", model };
}

function buildSlipAnalysisReply(args: {
  amountBaht: number | null;
  entryDateYmd: string | null;
  entryTime: string | null;
  transferFrom: string | null;
  transferTo: string | null;
  bankName: string | null;
  reference: string | null;
  slipNote?: string | null;
  rawModelText?: string | null;
  parseWarning?: string;
  usedGlmFallback?: boolean;
  primaryModel?: string;
}): string {
  const lines: string[] = ["อ่านสลิปแล้วค่ะ ✅", ""];
  lines.push(`- วันที่: ${args.entryDateYmd ?? "ไม่ชัด"}`);
  lines.push(`- เวลา: ${args.entryTime ?? "ไม่ชัด"}`);
  lines.push(`- จำนวนเงิน: ${args.amountBaht != null ? `${args.amountBaht.toLocaleString("th-TH")} บาท` : "ไม่ชัด"}`);
  lines.push(`- ผู้โอน: ${args.transferFrom ?? "ไม่ชัด"}`);
  lines.push(`- ผู้รับ: ${args.transferTo ?? "ไม่ชัด"}`);
  lines.push(`- ธนาคาร/ช่องทาง: ${args.bankName ?? "ไม่ชัด"}`);
  lines.push(`- รหัสอ้างอิง: ${args.reference ?? "ไม่ชัด"}`);
  const note = args.slipNote?.trim();
  if (note) {
    lines.push(`- หมายเหตุบนสลิป: ${note.slice(0, 300)}${note.length > 300 ? "…" : ""}`);
  }
  if (args.usedGlmFallback) {
    lines.push("");
    lines.push(`หมายเหตุ: รอบแรก (${args.primaryModel ?? "primary"}) ยังไม่ชัด จึง fallback ไป GLM-OCR`);
  }
  if (args.parseWarning) {
    lines.push("");
    lines.push(`จุดที่ควรตรวจซ้ำ: ${args.parseWarning}`);
  }
  const noKeyField =
    !args.entryDateYmd &&
    args.amountBaht == null &&
    !args.reference?.trim() &&
    !args.bankName?.trim() &&
    !args.transferFrom?.trim() &&
    !args.transferTo?.trim();
  const raw = args.rawModelText?.trim();
  if (noKeyField && raw) {
    lines.push("");
    lines.push("ข้อความดิบจากโมเดล (อ้างอิง — ช่วยคัดลอกไปแก้มือได้):");
    lines.push(raw.replace(/\s+/g, " ").slice(0, 900) + (raw.length > 900 ? "…" : ""));
  }
  lines.push("");
  if (args.amountBaht != null && Number.isFinite(args.amountBaht) && args.amountBaht > 0) {
    lines.push("ถ้าข้อมูลถูกต้อง พิมพ์ **ยืนยัน** หรือ **บันทึกเลย** เพื่อบันทึกลงบัญชีรายรับ–รายจ่ายค่ะ");
  } else {
    lines.push("ต้องการให้ช่วยบันทึกรายการนี้ต่อไหม? (แก้ยอด/วันที่ให้ชัดก่อน แล้วใช้คำสั่ง บันทึกรายจ่าย … บาท … ได้ค่ะ)");
  }
  return lines.join("\n");
}

function telegramSlipFallbackEnabled(): boolean {
  const v = process.env.TELEGRAM_SLIP_FALLBACK_ENABLED?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** Caption ส่งรูปสลิปจาก Chat UI → Telegram (Mavel) — ระบุงานวิเคราะห์และบอทตอบกลับ */
function buildChatUiSlipTelegramCaption(username: string, userMessage?: string): string {
  const replyHandle = (process.env.TELEGRAM_SLIP_REPLY_BOT_USERNAME?.trim() || "mawellltp_bot").replace(/^@/, "");
  const parts = [
    `📸 สลิปจาก ${username} (Chat UI)`,
    "โหมดงาน: วิเคราะห์สลิปเท่านั้น",
    "ข้อบังคับ: ห้ามทักทาย/ห้ามคุยทั่วไป/ห้ามตอบว่า \"มีอะไรให้ช่วย\"",
    "",
    "กรุณาวิเคราะห์ข้อมูลสลิป:",
    ...SLIP_ANALYSIS_CHECKLIST_LINES.map((line) => `- ${line}`),
    "",
    SLIP_UNCERTAINTY_RULE_LINE,
    "",
    SLIP_POST_READ_CAPTION_LINE,
    "",
    "รูปแบบผลลัพธ์ที่ต้องส่ง:",
    "1) สรุปข้อมูลที่อ่านได้ (แยกหัวข้อ)",
    "2) ระบุจุดที่อ่านไม่ชัด",
    "3) ถามต่อท้ายว่า \"ต้องการให้ช่วยบันทึกรายการไหม\"",
    "",
    SLIP_CAPTION_COMMANDS_SUMMARY_HEADER,
    `แล้วส่งผลกลับมาที่ @${replyHandle} ด้วย`,
    "",
    SLIP_SEND_RESULT_TO_CHAT_UI_LINE,
    SLIP_ASK_WHETHER_TO_SAVE_LINE,
  ];
  const note = userMessage?.trim();
  if (note) parts.push("", `หมายเหตุจากผู้ใช้: ${note}`);
  return parts.join("\n").slice(0, 1024);
}

export async function runPersonalAiChat(input: PersonalAiRequest): Promise<PersonalAiResult> {
  const message = input.message?.trim();
  const imageDataUrl = input.imageDataUrl?.trim();
  const rawSessionId = input.sessionId?.trim();
  const assistantId = `ai-${input.userId.slice(0, 8)}`;
  const userLabel = input.displayName?.trim() || input.username;
  let awaitingMavelSlipReply = false;

  const existingSession =
    rawSessionId && rawSessionId.length > 0
      ? await prisma.personalChatSession.findFirst({
          where: { id: rawSessionId, userId: input.userId },
          select: { id: true },
        })
      : null;
  const sessionId = existingSession?.id ?? null;

  if (input.reset) {
    if (sessionId) {
      await prisma.personalChatMessage.deleteMany({
        where: { sessionId, userId: input.userId },
      });
      await prisma.personalChatSession.update({
        where: { id: sessionId },
        data: {
          title: "แชทใหม่",
          lastMessageAt: null,
          provider: null,
          model: null,
          ...personalSessionPendingDraftData({ pendingSlipDraft: null }),
        },
      });
    }
    return {
      ok: true,
      reset: true,
      sessionId,
      assistantId,
      message: "ล้างความจำแชท AI ของผู้ใช้คนนี้แล้ว",
    };
  }

  if (!message && !imageDataUrl) {
    return { ok: false, status: 400, error: "กรุณาระบุข้อความหรือแนบรูปภาพ" };
  }
  if (imageDataUrl && !/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(imageDataUrl)) {
    return { ok: false, status: 400, error: "รูปแบบรูปภาพไม่ถูกต้อง" };
  }

  const hasOpenClaw = Boolean(
    (process.env.OPENCLAW_AGENT_WS_URL?.trim() ||
      process.env.OPENCLAW_GATEWAY_WS_URL?.trim() ||
      process.env.OPENCLAW_WS_URL?.trim() ||
      "ws://127.0.0.1:18789") &&
      (process.env.OPENCLAW_API_KEY?.trim() || process.env.OPENCLAW_AGENT_API_KEY?.trim()),
  );
  const hasOllama = Boolean(
    process.env.OLLAMA_API_URL?.trim() ||
      process.env.OLLAMA_URL?.trim() ||
      (Boolean(imageDataUrl) && process.env.OLLAMA_VISION_API_URL?.trim()),
  );
  const slipForwardChatId = getTelegramSlipForwardChatId();
  const telegramSlipPathReady = Boolean(
    imageDataUrl && process.env.TELEGRAM_BOT_TOKEN?.trim() && slipForwardChatId,
  );
  if (!hasOpenClaw && !hasOllama && !telegramSlipPathReady) {
    return {
      ok: false,
      status: 503,
      error:
        "ยังไม่ได้ตั้งค่า OpenClaw SDK (WS URL + API key) หรือ OLLAMA_API_URL / สำหรับรูปยังใช้ได้ OLLAMA_VISION_API_URL (โมเดล: OLLAMA_VISION_MODEL)",
    };
  }

  try {
    const foundSession = sessionId ? await prisma.personalChatSession.findUnique({ where: { id: sessionId } }) : null;
    const activeSession =
      foundSession ??
      (await prisma.personalChatSession.create({
        data: {
          userId: input.userId,
          title: message ? message.slice(0, 80) : "แชทใหม่",
          assistantId,
        },
      }));
    const activeSessionId = activeSession.id;

    const recentDbMessages = await prisma.personalChatMessage.findMany({
      where: { sessionId: activeSessionId, userId: input.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { role: true, content: true },
    });
    const history: MemoryMessage[] = recentDbMessages
      .reverse()
      .map((m) => ({ role: m.role === "ASSISTANT" ? "assistant" : "user", content: m.content }));
    const composedUserMessage =
      message && imageDataUrl ? `${message}\n\n[ผู้ใช้แนบรูปภาพ 1 รูป]` : message || "[ผู้ใช้แนบรูปภาพ 1 รูป]";
    const toolResult = await maybeRunPersonalTool({
      userId: input.userId,
      message: message ?? "",
      imageDataUrl,
      sessionId: activeSessionId,
    });
    const userMessageWithTool =
      toolResult.used && toolResult.summary
        ? `${composedUserMessage}\n\n[ผลการเรียกเครื่องมือ]\n${toolResult.summary}`
        : composedUserMessage;
    const nextHistory = [...history, { role: "user" as const, content: userMessageWithTool }].slice(-20);
    await prisma.personalChatMessage.create({
      data: {
        sessionId: activeSessionId,
        userId: input.userId,
        role: "USER",
        content: userMessageWithTool,
      },
    });
    const prompt = buildPrompt(nextHistory, userLabel);
    let result: ChatProviderResult | null = null;
    let lastError = "";

    // รูปแนบสลิป: บังคับ Kimi K2.5 ก่อน แล้ว fallback GLM-OCR
    if (imageDataUrl) {
      try {
        const imageBase64Raw = dataUrlToBase64Raw(imageDataUrl);
        if (!imageBase64Raw) {
          throw new Error("รูปแบบรูปภาพไม่ถูกต้อง (base64)");
        }
        const slip = await readSlipWithKimiThenGlmOcr(imageBase64Raw, AbortSignal.timeout(85_000));
        const slipDraft = pendingDraftFromSlipResult(slip);
        try {
          await prisma.personalChatSession.update({
            where: { id: activeSessionId },
            data: personalSessionPendingDraftData({
              pendingSlipDraft: slipDraft
                ? ({ ...slipDraft } as unknown as Prisma.InputJsonValue)
                : null,
            }),
          });
        } catch (e) {
          console.warn("pendingSlipDraft update failed:", e);
        }
        result = {
          reply: buildSlipAnalysisReply({
            amountBaht: slip.amountBaht,
            entryDateYmd: slip.entryDateYmd,
            entryTime: slip.entryTime,
            transferFrom: slip.transferFrom,
            transferTo: slip.transferTo,
            bankName: slip.bankName,
            reference: slip.reference,
            slipNote: slip.slipNote,
            rawModelText: slip.rawText,
            parseWarning: slip.parseWarning,
            usedGlmFallback: slip.readPipeline?.usedGlmFallback,
            primaryModel: slip.readPipeline?.primaryModel,
          }),
          provider: "ollama",
          model: slip.readPipeline?.usedGlmFallback
            ? `${slip.readPipeline.primaryModel}->${process.env.OLLAMA_GLM_OCR_MODEL?.trim() || "glm-ocr:latest"}`
            : ((slip.readPipeline?.primaryModel ?? process.env.OLLAMA_SLIP_VISION_PRIMARY_MODEL?.trim()) || "kimi-k2.5:cloud"),
        };
      } catch (e) {
        lastError = e instanceof Error ? e.message : "Slip OCR error";
      }
    }

    // fallback Telegram: ใช้เฉพาะกรณีรูปแนบ OCR ล้มเหลวทั้งหมด
    const canTelegramSlip = Boolean(
      imageDataUrl && process.env.TELEGRAM_BOT_TOKEN?.trim() && slipForwardChatId,
    );
    const shouldUseTelegramSlip = canTelegramSlip && telegramSlipFallbackEnabled();
    if (!result && shouldUseTelegramSlip && slipForwardChatId && imageDataUrl) {
      const afterOllamaFailed = true;
      const prefixIfTelegramFallback = afterOllamaFailed
        ? "⚠️ Ollama อ่านสลิปไม่สำเร็จ — ส่งรูปไปกลุ่ม Telegram แทน; เมื่อตอบกลับรูปนี้ ระบบจะนำข้อความมาแสดงที่นี่\n\n"
        : "";
      const caption = buildChatUiSlipTelegramCaption(userLabel, message);
      const tg = await sendTelegramPhotoFromDataUrl({
        imageDataUrl,
        caption,
        chatId: slipForwardChatId,
      });
      if (tg.ok) {
        result = {
          reply: `${prefixIfTelegramFallback}📸 ได้รับรูปสลิปแล้ว — กำลังรอน้องมาเวลวิเคราะห์ใน Telegram; เมื่อตอบกลับรูปนี้ (reply) ในกลุ่ม ระบบจะส่งข้อความนั้นมาแสดงที่นี่`,
          provider: "telegram-forward",
          model: "mavel-telegram",
        };
        try {
          await prisma.personalChatMavelSlipPending.create({
            data: {
              userId: input.userId,
              sessionId: activeSessionId,
              mavelChatId: normalizeTelegramChatId(tg.chatId),
              mavelMessageId: tg.messageId,
            },
          });
          awaitingMavelSlipReply = true;
        } catch (e) {
          console.warn("personalChatMavelSlipPending create failed:", e);
        }
      } else {
        lastError = `Telegram sendPhoto: ${tg.error}`;
        console.warn("Telegram slip forward (Chat UI) failed:", tg.error);
        if (!imageDataUrl || !hasOllama) {
          result = {
            reply: `📸 ส่งรูปไป Telegram ไม่สำเร็จ (${tg.error})\n\nกรุณาตรวจ TELEGRAM_* หรือตั้ง OLLAMA_API_URL / OLLAMA_VISION_API_URL`,
            provider: "telegram-forward",
            model: "telegram-send-failed",
          };
        }
        // มีรูป + มี Ollama: เคยลอง Ollama แล้ว ไม่ซ้ำ — คง lastError
      }
    }

    // ข้อความเท่านั้น: ยังใช้ Ollama
    if (!result && hasOllama && !imageDataUrl) {
      try {
        result = await callOllama(prompt, undefined);
      } catch (e) {
        lastError = e instanceof Error ? e.message : "Ollama error";
      }
    }
    if (!result && hasOpenClaw && !imageDataUrl) {
      try {
        result = await callOpenClawAgent({
          history: nextHistory,
          prompt,
          assistantId,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("OpenClaw SDK Error:", msg);
        lastError = `OpenClaw: ${msg}`;
      }
    }
    if (!result) {
      if (toolResult.used && toolResult.summary.trim()) {
        const noAi = !hasOpenClaw && !hasOllama;
        const suffix = noAi
          ? "\n\n(ยังไม่ได้ตั้งค่า AI — ดำเนินการเฉพาะเครื่องมือในระบบให้แล้ว)"
          : lastError
            ? `\n\n⚠️ AI ตอบไม่สำเร็จ: ${lastError}`
            : "";
        result = {
          reply: `${toolResult.summary}${suffix}`.trim(),
          provider: "local-tools",
          model: "none",
        };
      } else if (!hasOpenClaw && !hasOllama) {
        if (lastError.trim()) {
          return { ok: false, status: 502, error: lastError };
        }
        return {
          ok: false,
          status: 503,
          error:
            "ยังไม่ได้ตั้งค่า OpenClaw SDK (WS URL + API key) หรือ OLLAMA_API_URL; อ่านรูป: OLLAMA_VISION_API_URL + OLLAMA_VISION_MODEL",
        };
      } else {
        return { ok: false, status: 502, error: lastError || "เรียก AI ไม่สำเร็จ" };
      }
    }

    let reply = enforceThaiOnlyReplyText(result.reply);
    /** บันทึกลง home finance สำเร็จ (สลิปยืนยัน / คำสั่งบันทึก…บาท) — ให้ตอบชัด + บอกแถบสรุป */
    const homeFinanceToolSaved =
      toolResult.used &&
      /รายการ\s*#\d+/u.test(toolResult.summary) &&
      (/ลงบัญชีแล้วค่ะ/u.test(toolResult.summary) ||
        /บันทึกราย(รับ|จ่าย)/u.test(toolResult.summary));
    if (homeFinanceToolSaved && message) {
      const toolLine = toolResult.summary.trim();
      const sidebarHint =
        "รายการนี้อยู่ใน **บัญชีวันนี้** ที่แถบสรุปรายวันซ้ายแล้ว (กด **รีเฟรช** ที่หัวสรุปถ้ายังไม่เห็น) — ถ้าวันที่รายการไม่ใช่วันนี้ (เช่น จากสลิปวันก่อน) จะไปอยู่ในหน้าบัญชีตามวันที่รายการค่ะ";
      if (!/ลงบัญชีแล้ว/u.test(reply) && !/บันทึกราย(รับ|จ่าย).*แล้ว/u.test(reply)) {
        reply = `ได้ค่ะ — ${toolLine}\n\n${sidebarHint}${reply.trim() ? `\n\n${reply.trim()}` : ""}`.trim();
      } else if (!/สรุปรายวัน|บัญชีวันนี้|รีเฟรช/u.test(reply)) {
        reply = `${reply.trim()}\n\n${sidebarHint}`.trim();
      }
    }
    const autoPlanNote =
      Boolean(message && !imageDataUrl && !toolResult.used && isPlanningAssistRequest(message));
    if (autoPlanNote && reply.trim() && message) {
      const reqSnippet = message.length > 500 ? `${message.slice(0, 500)}…` : message;
      const noteBody = `แผนงานจากแชท AI\nคำขอ: ${reqSnippet}\n\n---\n\n${reply}`;
      await prisma.personalAiNote.create({
        data: {
          userId: input.userId,
          content: noteBody,
          tags: ["plan-from-chat", "auto"],
        },
      });
      reply = `${reply.trim()}\n\n— น้องเก็บแผนนี้ใน **บันทึกล่าสุด** ให้แล้วค่ะ`;
    }
    await prisma.personalChatMessage.create({
      data: {
        sessionId: activeSessionId,
        userId: input.userId,
        role: "ASSISTANT",
        content: reply,
      },
    });
    await prisma.personalChatSession.update({
      where: { id: activeSessionId },
      data: {
        assistantId,
        provider: result.provider,
        model: result.model,
        lastMessageAt: new Date(),
        title: activeSession.title === "แชทใหม่" && message ? message.slice(0, 80) : activeSession.title,
      },
    });

    const sessionMessageCount = await prisma.personalChatMessage.count({
      where: { sessionId: activeSessionId, userId: input.userId },
    });
    return {
      ok: true,
      sessionId: activeSessionId,
      reply,
      provider: result.provider,
      model: result.model,
      assistantId,
      sessionMessageCount,
      awaitingMavelSlipReply: Boolean(awaitingMavelSlipReply),
    };
  } catch (error) {
    console.error("chat-ai/runPersonalAiChat fatal error:", error);
    const timeout = error instanceof Error && error.name === "TimeoutError";
    return { ok: false, status: 502, error: timeout ? "AI ตอบกลับช้าเกินเวลา กรุณาลองใหม่" : "เชื่อมต่อ AI ไม่สำเร็จ" };
  }
}
