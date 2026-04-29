import { createClient } from "openclaw-sdk";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@/generated/prisma/client";
import { POST as applySyncEventsPost } from "@/app/api/sync/openclaw/events/route";
import { prisma } from "@/lib/prisma";
import { getTelegramSlipForwardChatId, normalizeTelegramChatId } from "@/lib/telegram/slip-forward-chat";
import { ollamaCallVisionText } from "@/lib/ollama/ollama-vision";
import { sendTelegramPhotoFromDataUrl } from "@/lib/telegram/send-photo-from-data-url";
import {
  buildGlmOcrResultFromModelText,
  dataUrlToBase64Raw,
  readSlipWithKimiThenGlmOcr,
  type GlmOcrSlipResult,
} from "@/lib/vision/glm-ocr-service";
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
type OpenClawSyncEventInput = {
  type: "note" | "plan" | "finance";
  externalId: string;
  op?: "upsert" | "delete";
} & Record<string, unknown>;

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
  slipImageUrl?: string | null;
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
  const slipImageUrl =
    typeof o.slipImageUrl === "string" && o.slipImageUrl.trim() ? o.slipImageUrl.trim().slice(0, 2048) : null;
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
    slipImageUrl,
  };
}

function pendingDraftFromSlipResult(slip: GlmOcrSlipResult, slipImageUrl?: string | null): PendingSlipDraftV1 | null {
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
    slipImageUrl: slipImageUrl?.trim() ? slipImageUrl.trim().slice(0, 2048) : null,
  };
}

async function persistChatSlipImage(imageDataUrl: string, userId: string): Promise<string | null> {
  const m = imageDataUrl.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m?.[2]) return null;
  const subtype = (m[1] ?? "jpeg").toLowerCase();
  const ext = subtype.includes("png")
    ? "png"
    : subtype.includes("webp")
      ? "webp"
      : subtype.includes("gif")
        ? "gif"
        : "jpg";
  const dir = path.join(process.cwd(), "public", "uploads", "home-finance");
  await mkdir(dir, { recursive: true });
  const filename = `${userId.slice(0, 12)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buf = Buffer.from(m[2], "base64");
  await writeFile(path.join(dir, filename), buf);
  return `/uploads/home-finance/${filename}`;
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

function parseQuickExpensePairs(message: string): ParsedFinanceChatCommand[] {
  // รองรับรูปแบบสั้นหลายรายการในบรรทัดเดียว เช่น "ค่ากาแฟ 50 ค่ารถ 20 ค่าดูหนัง 150"
  const out: ParsedFinanceChatCommand[] = [];
  const re = /(ค่า[^\d\n]{1,80}?)\s*([\d,]+(?:\.\d+)?)(?:\s*(?:บาท|บ\.?))?(?=\s+ค่า|$)/giu;
  let m: RegExpExecArray | null = null;
  while ((m = re.exec(message)) !== null) {
    const title = (m[1] ?? "").trim().slice(0, 160);
    const amount = Number((m[2] ?? "").replace(/,/g, ""));
    if (!title || !Number.isFinite(amount) || amount <= 0) continue;
    out.push({ isIncome: false, amount, title, categoryLabel: "อื่นๆ" });
  }
  return out;
}

function financeCommandsFromUserMessage(message: string): ParsedFinanceChatCommand[] {
  const digest = parseFinanceIncomeDigestEntries(message);
  if (digest.length > 0) return digest;
  const quickPairs = parseQuickExpensePairs(message);
  if (quickPairs.length > 0) return quickPairs;
  const one = parseFinanceRecordCommand(message);
  return one ? [one] : [];
}

function isDeleteNoteCommand(message: string): boolean {
  return /(?:^|\s)ลบ(?:โน้ต|บันทึก)(?:\s|$)/u.test(message);
}

function isDeletePlanCommand(message: string): boolean {
  return /(?:^|\s)ลบ(?:แผน|เตือน|นัดหมาย|ตาราง)(?:\s|$)/u.test(message);
}

function isDeleteFinanceCommand(message: string): boolean {
  return /(?:^|\s)ลบ(?:รายจ่าย|รายรับ|บัญชี|ค่า|รายการ)(?:\s|$)/u.test(message);
}

async function deleteLatestNoteForUser(userId: string): Promise<ToolExecutionResult> {
  const row = await prisma.personalAiNote.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, content: true },
  });
  if (!row) return { used: true, summary: "ยังไม่มีโน้ตให้ลบค่ะ" };
  await prisma.personalAiNote.deleteMany({ where: { id: row.id, userId } });
  return { used: true, summary: `ลบโน้ตล่าสุดแล้วค่ะ ✅ ("${row.content.slice(0, 80)}")` };
}

async function deleteLatestPlanForUser(userId: string): Promise<ToolExecutionResult> {
  const row = await prisma.personalAiPlan.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });
  if (!row) return { used: true, summary: "ยังไม่มีแผนให้ลบค่ะ" };
  await prisma.personalAiPlan.deleteMany({ where: { id: row.id, userId } });
  return { used: true, summary: `ลบแผนล่าสุดแล้วค่ะ ✅ ("${row.title.slice(0, 80)}")` };
}

async function deleteFinanceEntriesForUser(args: {
  userId: string;
  message: string;
}): Promise<ToolExecutionResult> {
  const parsed = financeCommandsFromUserMessage(args.message);
  const first = parsed[0] ?? null;
  if (first) {
    const found = await prisma.homeFinanceEntry.findMany({
      where: {
        ownerUserId: args.userId,
        amount: first.amount,
        title: { contains: first.title.slice(0, 80) },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, amount: true },
    });
    if (!found.length) return { used: true, summary: "ไม่พบรายการรายรับ-รายจ่ายที่ต้องการลบค่ะ" };
    await prisma.homeFinanceEntry.deleteMany({
      where: { id: { in: found.map((x) => x.id) }, ownerUserId: args.userId },
    });
    return {
      used: true,
      summary: `ลบรายการรายรับ-รายจ่ายแล้ว ${found.length} รายการ ✅ (${first.title} ${first.amount.toLocaleString("th-TH")} บาท)`,
    };
  }

  const latest = await prisma.homeFinanceEntry.findFirst({
    where: { ownerUserId: args.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, amount: true, type: true },
  });
  if (!latest) return { used: true, summary: "ยังไม่มีรายการรายรับ-รายจ่ายให้ลบค่ะ" };
  await prisma.homeFinanceEntry.deleteMany({
    where: { id: latest.id, ownerUserId: args.userId },
  });
  const kind = latest.type === "INCOME" ? "รายรับ" : "รายจ่าย";
  return {
    used: true,
    summary: `ลบ${kind}ล่าสุดแล้วค่ะ ✅ ("${latest.title}" ${Number(latest.amount).toLocaleString("th-TH")} บาท)`,
  };
}

function extractSavedEntryDateYmdFromToolSummary(summary: string): string | null {
  const m = summary.match(/วันที่\s*(\d{4}-\d{2}-\d{2})/u);
  return m?.[1] ?? null;
}

function buildConciseNoteSavedReply(summary: string): string | null {
  const m = summary.match(/^บันทึกโน้ตแล้ว\s*\(#([^)]+)\):\s*([\s\S]+)$/u);
  if (!m?.[2]) return null;
  const content = m[2].trim().replace(/\s+/g, " ");
  if (!content) return null;
  return `ได้ค่ะ — บันทึกโน้ตว่า "${content}" เสร็จเรียบร้อยแล้วค่ะ ✅`;
}

function buildConciseScheduleSavedReply(summary: string): string | null {
  const m = summary.match(/^ตั้งเตือนแล้ว:\s*([\s\S]+)$/u);
  if (!m?.[1]) return null;
  return `ได้ค่ะ — ${m[1].trim()} ✅`;
}

function replyClaimsDataSaved(reply: string): boolean {
  const t = reply.trim();
  if (!t) return false;
  return /(จดไว้แล้ว|บันทึกไว้แล้ว|บันทึกแล้ว|ตั้งเตือน(?:ไว้)?แล้ว|ลงบัญชีแล้ว|บันทึกราย(?:รับ|จ่าย))/u.test(t);
}

function inferExpectedSyncKind(args: {
  incomingMessage: string;
  parsedFinanceCount: number;
  reply: string;
}): "note" | "plan" | "finance" | null {
  if (args.parsedFinanceCount > 0) return "finance";
  if (isImplicitScheduleNote(args.incomingMessage)) return "plan";
  if (extractQuickNoteContent(args.incomingMessage)) return "note";
  const r = args.reply;
  if (/ลงบัญชีแล้ว|บันทึกราย(?:รับ|จ่าย)/u.test(r)) return "finance";
  if (/ตั้งเตือน(?:ไว้)?แล้ว/u.test(r)) return "plan";
  if (/จดไว้แล้ว|บันทึกไว้แล้ว/u.test(r)) return "note";
  return null;
}

async function hasRecentOpenClawSyncEvidence(args: {
  userId: string;
  kind: "note" | "plan" | "finance";
  incomingMessage: string;
  parsedFinanceFromMessage: ParsedFinanceChatCommand[];
}): Promise<boolean> {
  const since = new Date(Date.now() - 3 * 60 * 1000);
  if (args.kind === "note") {
    const quick = extractQuickNoteContent(args.incomingMessage);
    const n = await prisma.personalAiNote.count({
      where: {
        userId: args.userId,
        externalSource: "openclaw",
        lastSyncedAt: { gte: since },
        ...(quick ? { content: { contains: quick.slice(0, 40) } } : {}),
      },
    });
    return n > 0;
  }
  if (args.kind === "plan") {
    const parsed = parseScheduleIntent(args.incomingMessage);
    const n = await prisma.personalAiPlan.count({
      where: {
        userId: args.userId,
        externalSource: "openclaw",
        lastSyncedAt: { gte: since },
        ...(parsed?.title ? { title: { contains: parsed.title.slice(0, 40) } } : {}),
      },
    });
    return n > 0;
  }
  const first = args.parsedFinanceFromMessage[0] ?? null;
  const n = await prisma.homeFinanceEntry.count({
    where: {
      ownerUserId: args.userId,
      externalSource: "openclaw",
      lastSyncedAt: { gte: since },
      ...(first?.amount != null ? { amount: first.amount } : {}),
      ...(first?.title ? { title: { contains: first.title.slice(0, 40) } } : {}),
    },
  });
  return n > 0;
}

function buildPendingSyncReply(kind: "note" | "plan" | "finance"): string {
  if (kind === "note") {
    return "รับคำขอแล้วค่ะ — ตอนนี้ยังไม่พบผลซิงก์โน้ตจาก OpenClaw ในระบบ รอสักครู่แล้วลองใหม่อีกครั้งนะคะ";
  }
  if (kind === "plan") {
    return "รับคำขอแล้วค่ะ — ตอนนี้ยังไม่พบผลซิงก์ตารางนัดหมายจาก OpenClaw ในระบบ รอสักครู่แล้วลองใหม่อีกครั้งนะคะ";
  }
  return "รับคำขอแล้วค่ะ — ตอนนี้ยังไม่พบผลซิงก์รายรับ-รายจ่ายจาก OpenClaw ในระบบ รอสักครู่แล้วลองใหม่อีกครั้งนะคะ";
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

/** ข้อความสั้นเชิงเตือน/นัดหมาย เช่น "พรุ่งนี้ 10.00 ออกเดินทาง..." ให้บันทึกเป็นโน้ตอัตโนมัติ */
function isImplicitScheduleNote(raw: string): boolean {
  const m = raw.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (!m || m.length > 220) return false;
  if (/[?？]$/.test(m)) return false;
  if (extractQuickNoteContent(m)) return false;
  if (parseFinanceRecordCommand(m)) return false;
  if (isNewsDigestRequest(m) || isWebSearchRequest(m)) return false;
  const hasDateCue = /(วันนี้|พรุ่งนี้|มะรืน|เช้านี้|เย็นนี้|พรุ่งนี้เช้า|พรุ่งนี้เย็น)/u.test(m);
  const hasTimeCue = /(?:^|\s)([01]?\d|2[0-3])[:.][0-5]\d(?:\s*น\.?)?/u.test(m);
  const hasActionCue = /(ไป|เดินทาง|นัด|ประชุม|โทร|พบ|ออก|ทำ|ซื้อ|จ่าย|รับ|ส่ง|ถึง)/u.test(m);
  return (hasDateCue && hasActionCue) || (hasDateCue && hasTimeCue);
}

function parseScheduleIntent(raw: string): { title: string; dueDate: Date } | null {
  const m = raw.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (!isImplicitScheduleNote(m)) return null;
  const todayYmd = todayYmdBangkok();
  const baseYmd = /พรุ่งนี้/u.test(m)
    ? (() => {
        const [y, mo, d] = todayYmd.split("-").map((x) => Number(x));
        const dt = new Date(Date.UTC(y, (mo || 1) - 1, d || 1));
        dt.setUTCDate(dt.getUTCDate() + 1);
        return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
      })()
    : todayYmd;

  const t = m.match(/([01]?\d|2[0-3])[:. ]([0-5]\d)\s*(?:น\.?)?/u);
  let hh = "09";
  let mm = "00";
  if (t?.[1] && t?.[2]) {
    hh = String(Number(t[1])).padStart(2, "0");
    mm = String(Number(t[2])).padStart(2, "0");
  } else if (/ข้าวเย็น|เย็นนี้|ตอนเย็น/u.test(m)) {
    hh = "18";
    mm = "00";
  }

  let title = m
    .replace(/^(วันนี้|พรุ่งนี้|มะรืน)\s*/u, "")
    .replace(/^(ช่วย)?\s*(เตือน|ปลุก)\s*/u, "")
    .replace(/([01]?\d|2[0-3])[:. ]([0-5]\d)\s*(?:น\.?)?/u, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!title) title = m;
  if (!/^เตือน/u.test(title)) title = `เตือน: ${title}`;
  title = title.slice(0, 200);

  return { title, dueDate: new Date(`${baseYmd}T${hh}:${mm}:00+07:00`) };
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

function shouldRouteAllToOpenClaw(): boolean {
  const raw = process.env.OPENCLAW_ROUTE_ALL?.trim().toLowerCase();
  if (!raw) return true;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
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
      slipImageUrl: draft.slipImageUrl ?? null,
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
        summary: `บันทึก${kind}จากสลิป ${amt} บาท — ${draft.title} ลงบัญชีแล้วค่ะ ✅ (วันที่ ${draft.entryDateYmd}, รายการ #${created.entryId})`,
      };
    }
    return { used: true, summary: `บันทึกลงบัญชีไม่สำเร็จ: ${created.error}` };
  }

  const textForTools = stripStoredUserMessageForFinanceParse(message).trim();
  const lower = textForTools.toLowerCase();

  if (isDeleteNoteCommand(textForTools)) {
    return await deleteLatestNoteForUser(args.userId);
  }
  if (isDeletePlanCommand(textForTools)) {
    return await deleteLatestPlanForUser(args.userId);
  }
  if (isDeleteFinanceCommand(textForTools)) {
    return await deleteFinanceEntriesForUser({ userId: args.userId, message: textForTools });
  }

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

  if (isImplicitScheduleNote(textForTools)) {
    const parsed = parseScheduleIntent(textForTools);
    if (parsed) {
      const plan = await prisma.personalAiPlan.create({
        data: {
          userId: args.userId,
          title: parsed.title,
          steps: [textForTools],
          dueDate: parsed.dueDate,
        },
        select: { id: true, title: true, dueDate: true },
      });
      const dueYmd = plan.dueDate
        ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(plan.dueDate)
        : "";
      const dueHm = plan.dueDate
        ? new Intl.DateTimeFormat("th-TH", {
            timeZone: "Asia/Bangkok",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(plan.dueDate)
        : "";
      return {
        used: true,
        summary: `ตั้งเตือนแล้ว: ${plan.title}${dueYmd ? ` (${dueYmd}${dueHm ? ` ${dueHm}` : ""})` : ""}`,
      };
    }
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
  if (typeof obj.result === "string") return obj.result.trim();
  if (typeof obj.content === "string" && obj.content.trim()) return obj.content.trim();
  if (obj.result && typeof obj.result === "object") {
    const r = obj.result as Record<string, unknown>;
    if (typeof r.text === "string" && r.text.trim()) return r.text.trim();
    if (typeof r.content === "string" && r.content.trim()) return r.content.trim();
    if (typeof r.message === "string" && r.message.trim()) return r.message.trim();
  }
  if (Array.isArray(obj.result)) {
    const joined = obj.result
      .map((x) => (typeof x === "string" ? x : x && typeof x === "object" && "text" in x ? String((x as { text?: unknown }).text ?? "") : ""))
      .join("\n")
      .trim();
    if (joined) return joined;
  }
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
  try {
    const compact = JSON.stringify(obj);
    if (compact && compact !== "{}") return compact.slice(0, 1500);
  } catch {
    // ignore
  }
  return "";
}

function extractOpenClawSyncEvents(payload: unknown): OpenClawSyncEventInput[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const candidates: unknown[] = [];
  if (Array.isArray(root.events)) candidates.push(root.events);
  if (root.result && typeof root.result === "object" && !Array.isArray(root.result)) {
    const resultObj = root.result as Record<string, unknown>;
    if (Array.isArray(resultObj.events)) candidates.push(resultObj.events);
  }
  if (root.data && typeof root.data === "object" && !Array.isArray(root.data)) {
    const dataObj = root.data as Record<string, unknown>;
    if (Array.isArray(dataObj.events)) candidates.push(dataObj.events);
  }
  for (const c of candidates) {
    if (!Array.isArray(c)) continue;
    const mapped = c
      .filter((x): x is Record<string, unknown> => Boolean(x && typeof x === "object" && !Array.isArray(x)))
      .map((x) => {
        const type = typeof x.type === "string" ? x.type.trim().toLowerCase() : "";
        const externalId = typeof x.externalId === "string" ? x.externalId.trim() : "";
        const opRaw = typeof x.op === "string" ? x.op.trim().toLowerCase() : "upsert";
        if (!externalId) return null;
        if (type !== "note" && type !== "plan" && type !== "finance") return null;
        const op: "upsert" | "delete" = opRaw === "delete" ? "delete" : "upsert";
        return { ...x, type, externalId, op } as OpenClawSyncEventInput;
      })
      .filter((x): x is OpenClawSyncEventInput => Boolean(x));
    if (mapped.length > 0) return mapped;
  }
  return [];
}

function stripMarkdownAndEmojiPrefix(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[•\-*]\s*/u, "")
    .replace(/^[\p{Extended_Pictographic}\uFE0F]+\s*/u, "")
    .trim();
}

function tinyStableId(input: string): string {
  let h = 5381;
  for (const ch of input) h = (h * 33) ^ ch.charCodeAt(0);
  return Math.abs(h >>> 0).toString(36);
}

function extractOpenClawEventsFromReplyText(reply: string): OpenClawSyncEventInput[] {
  const text = reply.trim();
  if (!text) return [];
  const lines = text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const events: OpenClawSyncEventInput[] = [];
  const normalized = lines.map((line) => stripMarkdownAndEmojiPrefix(line));

  // NOTE marker: e.g. "📝 NOTE: ..." or "NOTE: ..."
  for (const line of normalized) {
    const m = line.match(/^(?:NOTE|โน้ต)\s*:\s*(.+)$/iu);
    if (!m?.[1]) continue;
    const content = m[1].trim();
    if (!content) continue;
    events.push({
      type: "note",
      externalId: `chat-note-${tinyStableId(`note|${content}`)}`,
      op: "upsert",
      content,
      tags: ["openclaw-chat"],
      hiddenFromDigest: false,
      syncedAt: new Date().toISOString(),
    });
  }

  // PLAN marker/date block: e.g. "📅 30 เมษายน 2569" + bullet line "• 📦 ภารกิจ..."
  const dateHeaderIndex = normalized.findIndex((line) => /^📅|^วัน(?:ที่)?\s*\d|^\d{1,2}\s+[ก-๙A-Za-z]+/u.test(line));
  if (dateHeaderIndex >= 0) {
    const rawAfterDate = lines.slice(dateHeaderIndex + 1);
    const afterDate = normalized.slice(dateHeaderIndex + 1);
    const explicitTask = afterDate.find((line) => /^(?:📦\s*)?(?:ภารกิจ|งาน|นัดหมาย|เตือน)/u.test(line));
    const genericBullet = afterDate.find((line, idx) => rawAfterDate[idx]?.includes("•") && line.length >= 8);
    const candidate = (explicitTask ?? genericBullet ?? "").replace(/^📦\s*/u, "").trim();
    if (candidate) {
      const title = candidate.slice(0, 180);
      events.push({
        type: "plan",
        externalId: `chat-plan-${tinyStableId(`plan|${title}`)}`,
        op: "upsert",
        title,
        steps: [title],
        status: "TODO",
        syncedAt: new Date().toISOString(),
      });
    }
  }

  return events;
}

async function syncEventsFromOpenClawPayload(args: {
  userId: string;
  payload: unknown;
}): Promise<void> {
  const events = extractOpenClawSyncEvents(args.payload);
  if (!events.length) return;
  const root = args.payload && typeof args.payload === "object" ? (args.payload as Record<string, unknown>) : {};
  const requestIdRaw =
    (typeof root.requestId === "string" && root.requestId.trim()) ||
    `chat-agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const sourceRaw = typeof root.source === "string" && root.source.trim() ? root.source.trim() : "openclaw";
  const localReq = new Request("http://127.0.0.1/api/sync/openclaw/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.OPENCLAW_SYNC_SECRET?.trim()
        ? { "x-openclaw-sync-secret": process.env.OPENCLAW_SYNC_SECRET.trim() }
        : {}),
    },
    body: JSON.stringify({
      source: sourceRaw,
      ownerUserId: args.userId,
      requestId: requestIdRaw,
      events,
    }),
  });
  try {
    const res = await applySyncEventsPost(localReq);
    if (!res.ok) {
      const body = await res.text();
      console.warn("openclaw payload sync failed:", body.slice(0, 300));
    }
  } catch (error) {
    console.warn("openclaw payload sync failed:", error);
  }
}

async function callOpenClawAgent(args: {
  history: MemoryMessage[];
  prompt: string;
  assistantId: string;
  userId: string;
}): Promise<ChatProviderResult | null> {
  const httpEndpoint = process.env.OPENCLAW_API_URL?.trim() || process.env.OPENCLAW_URL?.trim() || "";
  const apiKey = process.env.OPENCLAW_API_KEY?.trim() || process.env.OPENCLAW_AGENT_API_KEY?.trim() || "";
  if (httpEndpoint) {
    const model = process.env.OPENCLAW_AGENT_MODEL?.trim() || "openclaw";
    const useMessageJsonPayload =
      process.env.OPENCLAW_HTTP_MESSAGE_PAYLOAD === "1" ||
      process.env.OPENCLAW_HTTP_MESSAGE_PAYLOAD?.toLowerCase() === "true" ||
      /\/api\/openclaw\/ocr\b/i.test(httpEndpoint);
    const httpBody = useMessageJsonPayload
      ? { message: args.prompt, ownerUserId: args.userId }
      : {
          task: "chat" as const,
          assistantId: args.assistantId,
          ownerUserId: args.userId,
          model,
          prompt: args.prompt,
          messages: args.history.map((m) => ({ role: m.role, content: m.content })),
        };
    const res = await fetch(httpEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(httpBody),
      signal: AbortSignal.timeout(Number(process.env.OPENCLAW_REQUEST_TIMEOUT_MS ?? "90000")),
    });
    const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const msg = typeof payload.error === "string" ? payload.error : `HTTP ${res.status}`;
      throw new Error(`เรียก OpenClaw HTTP ไม่สำเร็จ (${msg})`);
    }
    const reply = pickReplyFromPayload(payload);
    if (!reply) {
      throw new Error("OpenClaw HTTP ไม่ได้ส่งข้อความตอบกลับ");
    }
    const replyEvents = extractOpenClawEventsFromReplyText(reply);
    void syncEventsFromOpenClawPayload({ userId: args.userId, payload }).catch((error) => {
      console.warn("openclaw payload sync failed:", error);
    });
    if (replyEvents.length > 0) {
      void syncEventsFromOpenClawPayload({
        userId: args.userId,
        payload: {
          source: "openclaw",
          requestId: `chat-reply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          events: replyEvents,
        },
      }).catch((error) => {
        console.warn("openclaw reply-text sync failed:", error);
      });
    }
    return { reply, provider: "openclaw-agent", model };
  }

  const wsUrl =
    process.env.OPENCLAW_AGENT_WS_URL?.trim() ||
    process.env.OPENCLAW_GATEWAY_WS_URL?.trim() ||
    process.env.OPENCLAW_WS_URL?.trim() ||
    "ws://127.0.0.1:18789";
  if (!wsUrl) return null;
  const apiKeyWs = process.env.OPENCLAW_API_KEY?.trim() || process.env.OPENCLAW_AGENT_API_KEY?.trim() || "";
  if (!apiKeyWs) return null;
  const model = process.env.OPENCLAW_AGENT_MODEL?.trim() || "openclaw-agent";
  const method = process.env.OPENCLAW_AGENT_METHOD?.trim() || "chat.completions";
  const clientId = process.env.OPENCLAW_CLIENT_ID?.trim() || "aicluster-chat-ai";
  const requestTimeoutMs = Number(process.env.OPENCLAW_REQUEST_TIMEOUT_MS ?? "90000");

  const client = createClient({
    url: wsUrl,
    clientId,
    auth: { token: apiKeyWs },
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
      ownerUserId: args.userId,
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
  const replyEvents = extractOpenClawEventsFromReplyText(reply);
  void syncEventsFromOpenClawPayload({ userId: args.userId, payload }).catch((error) => {
    console.warn("openclaw payload sync failed:", error);
  });
  if (replyEvents.length > 0) {
    void syncEventsFromOpenClawPayload({
      userId: args.userId,
      payload: {
        source: "openclaw",
        requestId: `chat-reply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        events: replyEvents,
      },
    }).catch((error) => {
      console.warn("openclaw reply-text sync failed:", error);
    });
  }
  return { reply, provider: "openclaw-agent", model };
}

function toOllamaBase64Image(imageDataUrl: string | undefined): string | null {
  if (!imageDataUrl) return null;
  const m = imageDataUrl.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  if (!m) return null;
  return m[1] ?? null;
}

function normalizeOpenClawYmd(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const slash = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!slash) return null;
  const d = slash[1]!.padStart(2, "0");
  const m = slash[2]!.padStart(2, "0");
  return `${slash[3]}-${m}-${d}`;
}

function parseOpenClawAmount(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) && raw > 0 ? raw : null;
  if (typeof raw !== "string") return null;
  const n = Number(raw.replace(/[,\s฿]/g, "").replace(/บาท/gi, "").trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseOpenClawDirection(raw: unknown): "out" | "in" | "unknown" {
  if (typeof raw !== "string") return "unknown";
  const t = raw.trim().toUpperCase();
  if (t === "INCOME" || t === "IN" || t === "INBOUND") return "in";
  if (t === "EXPENSE" || t === "OUT" || t === "OUTBOUND") return "out";
  if (t === "UNKNOWN") return "unknown";
  return "unknown";
}

function parseOpenClawResultTextFields(raw: string): {
  entryDateYmd: string | null;
  entryTime: string | null;
  amountBaht: number | null;
  transferFrom: string | null;
  transferTo: string | null;
  bankName: string | null;
  reference: string | null;
} {
  const clean = raw.replace(/\r/g, "");
  const noMd = clean.replace(/[*_`]/g, "");
  const lines = noMd.split("\n").map((s) => s.trim());
  const tableMap = new Map<string, string>();
  for (const line of lines) {
    if (!line.includes("|")) continue;
    const cols = line
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    if (cols.length < 2) continue;
    const key = cols[0]!.replace(/[：:]/g, "").trim().toLowerCase();
    const val = cols[1]!.trim();
    if (key && val && !/^[-]+$/.test(key)) {
      tableMap.set(key, val);
    }
  }
  const pickFromTable = (keys: string[]): string | null => {
    for (const k of keys) {
      const v = tableMap.get(k.toLowerCase());
      if (v) return v;
    }
    return null;
  };
  const pickFromRegex = (re: RegExp): string | null => {
    const m = noMd.match(re);
    return m?.[1]?.trim() ? m[1].trim() : null;
  };

  const dateRaw =
    pickFromTable(["วันที่", "date"]) ?? pickFromRegex(/(?:วันที่|date)\s*[:|]\s*([^\n|]+)/iu);
  const timeRaw =
    pickFromTable(["เวลา", "time"]) ?? pickFromRegex(/(?:เวลา|time)\s*[:|]\s*([^\n|]+)/iu);
  const amountRaw =
    pickFromTable(["จำนวนเงิน", "ยอดเงิน", "amount"]) ??
    pickFromRegex(/(?:จำนวนเงิน|ยอดเงิน|amount)\s*[:|]\s*([^\n|]+)/iu);
  const fromRaw =
    pickFromTable(["ผู้โอน", "from", "sender"]) ??
    pickFromRegex(/(?:ผู้โอน|from|sender)\s*[:|]\s*([^\n|]+)/iu);
  const toRaw =
    pickFromTable(["ผู้รับ", "to", "receiver"]) ??
    pickFromRegex(/(?:ผู้รับ|to|receiver)\s*[:|]\s*([^\n|]+)/iu);
  const bankRaw =
    pickFromTable(["ธนาคาร", "ช่องทาง", "bank"]) ??
    pickFromRegex(/(?:ธนาคาร|ช่องทาง|bank)\s*[:|]\s*([^\n|]+)/iu);
  const refRaw =
    pickFromTable(["รหัสอ้างอิง", "เลขอ้างอิง", "reference", "ref"]) ??
    pickFromRegex(/(?:รหัสอ้างอิง|เลขอ้างอิง|reference|ref)\s*[:|]\s*([^\n|]+)/iu);

  const parseThaiDateToYmd = (v: string | null): string | null => {
    if (!v) return null;
    const t = v.replace(/\s+/g, " ").trim();
    const normalized = t.replace(/,/g, " ").replace(/\./g, "").replace(/\s+/g, " ").trim();
    const m = normalized.match(
      /^(\d{1,2})\s+(มกราคม|มกรา(?:คม)?|มค|กุมภาพันธ์|กุมภา(?:พันธ์)?|กพ|มีนาคม|มีนา(?:คม)?|มีค|เมษายน|เมษา(?:ยน)?|เมย|พฤษภาคม|พฤษภา(?:คม)?|พค|มิถุนายน|มิถุนา(?:ยน)?|มิย|กรกฎาคม|กรกฎา(?:คม)?|กค|สิงหาคม|สิงหา(?:คม)?|สค|กันยายน|กันยา(?:ยน)?|กย|ตุลาคม|ตุลา(?:คม)?|ตค|พฤศจิกายน|พฤศจิกา(?:ยน)?|พย|ธันวาคม|ธันวา(?:คม)?|ธค)\s+(\d{2,4})$/u,
    );
    if (!m) return null;
    const monthMap: Record<string, string> = {
      มกราคม: "01",
      มกรา: "01",
      มค: "01",
      กุมภาพันธ์: "02",
      กุมภา: "02",
      กพ: "02",
      มีนาคม: "03",
      มีนา: "03",
      มีค: "03",
      เมษายน: "04",
      เมษา: "04",
      เมย: "04",
      พฤษภาคม: "05",
      พฤษภา: "05",
      พค: "05",
      มิถุนายน: "06",
      มิถุนา: "06",
      มิย: "06",
      กรกฎาคม: "07",
      กรกฎา: "07",
      กค: "07",
      สิงหาคม: "08",
      สิงหา: "08",
      สค: "08",
      กันยายน: "09",
      กันยา: "09",
      กย: "09",
      ตุลาคม: "10",
      ตุลา: "10",
      ตค: "10",
      พฤศจิกายน: "11",
      พฤศจิกา: "11",
      พย: "11",
      ธันวาคม: "12",
      ธันวา: "12",
      ธค: "12",
    };
    const dd = m[1]!.padStart(2, "0");
    const mm = monthMap[m[2]!] ?? null;
    if (!mm) return null;
    let yy = Number(m[3]);
    if (!Number.isFinite(yy)) return null;
    if (yy < 100) yy += 2500;
    if (yy >= 2400) yy -= 543;
    if (yy < 1990 || yy > 2110) return null;
    return `${yy}-${mm}-${dd}`;
  };

  const amountBaht = parseOpenClawAmount(amountRaw ?? null);
  const entryDateYmd = normalizeOpenClawYmd(dateRaw) ?? parseThaiDateToYmd(dateRaw);
  const entryTime = (() => {
    if (!timeRaw) return null;
    const m = timeRaw.match(/([01]?\d|2[0-3]):([0-5]\d)/);
    return m ? `${m[1]!.padStart(2, "0")}:${m[2]}` : null;
  })();
  const normalizeText = (v: string | null, max: number): string | null => {
    if (!v) return null;
    const t = v
      .replace(/[*_`|]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return t && !/^ไม่ชัด|ไม่พบ|unknown|null$/iu.test(t) ? t.slice(0, max) : null;
  };

  return {
    entryDateYmd,
    entryTime,
    amountBaht,
    transferFrom: normalizeText(fromRaw, 200),
    transferTo: normalizeText(toRaw, 200),
    bankName: normalizeText(bankRaw, 100),
    reference: normalizeText(refRaw, 100),
  };
}

async function readSlipWithOpenClaw(imageDataUrl: string): Promise<GlmOcrSlipResult | null> {
  const endpoint = process.env.OPENCLAW_URL?.trim() || process.env.OPENCLAW_API_URL?.trim() || "";
  if (!endpoint) return null;
  const imageBase64 = dataUrlToBase64Raw(imageDataUrl);
  if (!imageBase64) throw new Error("รูปแบบรูปภาพไม่ถูกต้อง (base64)");
  const encodedImage = imageBase64;
  const mimeTypeMatch = imageDataUrl.match(/^data:([^;]+);base64,/i);
  const mimeType = mimeTypeMatch?.[1]?.trim() || "image/jpeg";
  const apiKey = process.env.OPENCLAW_API_KEY?.trim() || "";
  const prompt = "อ่านข้อความสลิปและสรุปข้อมูลสำคัญเป็นโครงสร้าง เช่น วันที่ เวลา จำนวนเงิน ผู้โอน ผู้รับ ธนาคาร และรหัสอ้างอิง";

  const OCR_TIMEOUT_MS = Number(process.env.OPENCLAW_OCR_TIMEOUT_MS ?? "90000");

  async function postJson(payload: Record<string, unknown>): Promise<{ ok: boolean; raw: Record<string, unknown>; status: number }> {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(OCR_TIMEOUT_MS),
    });
    const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, raw, status: res.status };
  }

  async function postMultipart(): Promise<{ ok: boolean; raw: Record<string, unknown>; status: number }> {
    const form = new FormData();
    form.set("message", prompt);
    form.set("prompt", prompt);
    // endpoint รับได้ทั้งไฟล์หรือ base64 string
    const imageBytes = Uint8Array.from(Buffer.from(encodedImage, "base64"));
    form.set("image", new Blob([imageBytes], { type: mimeType }), "slip-image");
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: form,
      signal: AbortSignal.timeout(OCR_TIMEOUT_MS),
    });
    const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, raw, status: res.status };
  }

  const hasUsefulPayload = (r: Record<string, unknown>): boolean =>
    typeof r.rawText === "string" && r.rawText.trim().length > 0
      ? true
      : Boolean(
          r.result ||
            r.content ||
            r.fields ||
            r.text ||
            r.ocrText ||
            r.entryDateYmd ||
            r.amountBaht ||
            r.reference ||
            r.transferFrom ||
            r.transferTo,
        );

  let probe = await postJson({ message: prompt, image: encodedImage });
  if (!probe.ok || !hasUsefulPayload(probe.raw)) {
    probe = await postJson({ prompt, imageDataUrl });
  }
  if (!probe.ok || !hasUsefulPayload(probe.raw)) {
    probe = await postJson({ prompt, image: encodedImage, mimeType });
  }
  if (!probe.ok || !hasUsefulPayload(probe.raw)) {
    probe = await postMultipart();
  }
  const raw = probe.raw;
  if (!probe.ok) {
    const msg = typeof raw.error === "string" ? raw.error : `HTTP ${probe.status}`;
    throw new Error(`OpenClaw OCR: ${msg}`);
  }
  const fields =
    raw.fields && typeof raw.fields === "object" ? (raw.fields as Record<string, unknown>) : raw;
  const resultText =
    typeof raw.result === "string" ? raw.result : typeof raw.content === "string" ? raw.content : "";
  const parsedFromText = resultText ? buildGlmOcrResultFromModelText(resultText) : null;
  const parsedFromResultLabels = resultText ? parseOpenClawResultTextFields(resultText) : null;
  const entryDateYmd = normalizeOpenClawYmd(fields.entryDateYmd ?? fields.entryDate ?? fields.date);
  const amountBaht = parseOpenClawAmount(fields.amountBaht ?? fields.amount ?? fields.total);
  const entryTime = typeof fields.entryTime === "string" && fields.entryTime.trim() ? fields.entryTime.trim().slice(0, 5) : null;
  const transferFrom = typeof fields.transferFrom === "string" && fields.transferFrom.trim() ? fields.transferFrom.trim().slice(0, 200) : null;
  const transferTo = typeof fields.transferTo === "string" && fields.transferTo.trim() ? fields.transferTo.trim().slice(0, 200) : null;
  const bankName = typeof fields.bankName === "string" && fields.bankName.trim() ? fields.bankName.trim().slice(0, 100) : null;
  const reference = typeof fields.referenceNo === "string"
    ? fields.referenceNo.trim().slice(0, 100)
    : typeof fields.reference === "string" && fields.reference.trim()
      ? fields.reference.trim().slice(0, 100)
      : null;
  const slipNote =
    typeof fields.slipNote === "string" && fields.slipNote.trim()
      ? fields.slipNote.trim().slice(0, 500)
      : typeof fields.note === "string" && fields.note.trim()
        ? fields.note.trim().slice(0, 500)
        : null;
  const rawText =
    typeof raw.text === "string"
      ? raw.text
      : typeof raw.ocrText === "string"
        ? raw.ocrText
        : typeof raw.rawText === "string"
          ? raw.rawText
          : resultText;
  const directionGuess = parseOpenClawDirection(fields.directionGuess ?? fields.type);
  const mergedEntryDateYmd =
    entryDateYmd ?? parsedFromResultLabels?.entryDateYmd ?? parsedFromText?.entryDateYmd ?? null;
  const mergedAmountBaht =
    amountBaht ?? parsedFromResultLabels?.amountBaht ?? parsedFromText?.amountBaht ?? null;
  const mergedEntryTime =
    entryTime ?? parsedFromResultLabels?.entryTime ?? parsedFromText?.entryTime ?? null;
  const mergedTransferFrom =
    transferFrom ?? parsedFromResultLabels?.transferFrom ?? parsedFromText?.transferFrom ?? null;
  const mergedTransferTo =
    transferTo ?? parsedFromResultLabels?.transferTo ?? parsedFromText?.transferTo ?? null;
  const mergedBankName = bankName ?? parsedFromResultLabels?.bankName ?? parsedFromText?.bankName ?? null;
  const mergedReference =
    reference ?? parsedFromResultLabels?.reference ?? parsedFromText?.reference ?? null;
  const mergedSlipNote = slipNote ?? parsedFromText?.slipNote ?? null;
  const mergedDirectionGuess =
    directionGuess === "unknown" ? (parsedFromText?.directionGuess ?? "unknown") : directionGuess;

  return {
    entryDateYmd: mergedEntryDateYmd,
    entryTime: mergedEntryTime,
    amountBaht: mergedAmountBaht,
    transferFrom: mergedTransferFrom,
    transferTo: mergedTransferTo,
    bankName: mergedBankName,
    reference: mergedReference,
    slipNote: mergedSlipNote,
    directionGuess: mergedDirectionGuess,
    rawText,
    parseWarning:
      mergedAmountBaht == null &&
      !mergedEntryDateYmd &&
      !mergedReference &&
      !mergedBankName &&
      !mergedTransferFrom &&
      !mergedTransferTo
        ? "OpenClaw อ่านข้อมูลสำคัญยังไม่ครบ"
        : undefined,
    readPipeline: {
      primaryModel: "openclaw-slip-ocr",
      usedGlmFallback: false,
    },
  };
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
    process.env.OPENCLAW_API_URL?.trim() ||
      process.env.OPENCLAW_URL?.trim() ||
      ((process.env.OPENCLAW_AGENT_WS_URL?.trim() ||
        process.env.OPENCLAW_GATEWAY_WS_URL?.trim() ||
        process.env.OPENCLAW_WS_URL?.trim()) &&
        (process.env.OPENCLAW_API_KEY?.trim() || process.env.OPENCLAW_AGENT_API_KEY?.trim())),
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
  const routeAllToOpenClaw = shouldRouteAllToOpenClaw() && hasOpenClaw;

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
    const incomingMessage = (message ?? "").trim();
    const parsedFinanceFromMessage = financeCommandsFromUserMessage(
      stripStoredUserMessageForFinanceParse(incomingMessage),
    );
    const shouldForceLocalFinanceTool =
      Boolean(incomingMessage) &&
      (
        isSlipSaveConfirmation(incomingMessage) ||
        parsedFinanceFromMessage.length > 0 ||
        isImplicitScheduleNote(incomingMessage)
      );
    const toolResult =
      routeAllToOpenClaw && !shouldForceLocalFinanceTool
        ? { used: false, summary: "" }
        : await maybeRunPersonalTool({
            userId: input.userId,
            message: message ?? "",
            imageDataUrl,
            sessionId: activeSessionId,
          });
    const conciseNoteReply =
      toolResult.used && toolResult.summary.trim().startsWith("บันทึกโน้ตแล้ว")
        ? buildConciseNoteSavedReply(toolResult.summary.trim())
        : null;
    const conciseScheduleReply =
      toolResult.used && toolResult.summary.trim().startsWith("ตั้งเตือนแล้ว:")
        ? buildConciseScheduleSavedReply(toolResult.summary.trim())
        : null;
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
    let result: ChatProviderResult | null =
      conciseNoteReply != null
        ? {
            reply: conciseNoteReply,
            provider: "local-tools",
            model: "note-save-ack",
          }
        : conciseScheduleReply != null
          ? {
              reply: conciseScheduleReply,
              provider: "local-tools",
              model: "schedule-save-ack",
            }
          : null;
    let lastError = "";

    // รูปแนบสลิป: เรียก OpenClaw OCR ก่อน แล้ว fallback Kimi/GLM-OCR (ถ้าไม่ได้บังคับ route-all)
    if (imageDataUrl) {
      let openClawError = "";
      try {
        const slipViaOpenClaw = await readSlipWithOpenClaw(imageDataUrl);
        if (slipViaOpenClaw) {
          let slipImageUrl: string | null = null;
          try {
            slipImageUrl = await persistChatSlipImage(imageDataUrl, input.userId);
          } catch (e) {
            console.warn("persistChatSlipImage failed:", e);
          }
          const slipDraft = pendingDraftFromSlipResult(slipViaOpenClaw, slipImageUrl);
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
              amountBaht: slipViaOpenClaw.amountBaht,
              entryDateYmd: slipViaOpenClaw.entryDateYmd,
              entryTime: slipViaOpenClaw.entryTime,
              transferFrom: slipViaOpenClaw.transferFrom,
              transferTo: slipViaOpenClaw.transferTo,
              bankName: slipViaOpenClaw.bankName,
              reference: slipViaOpenClaw.reference,
              slipNote: slipViaOpenClaw.slipNote,
              rawModelText: slipViaOpenClaw.rawText,
              parseWarning: slipViaOpenClaw.parseWarning,
              usedGlmFallback: false,
              primaryModel: "openclaw-slip-ocr",
            }),
            provider: "openclaw-agent",
            model: "openclaw-slip-ocr",
          };
        }
      } catch (e) {
        openClawError = e instanceof Error ? e.message : "OpenClaw OCR error";
      }

      try {
        if (!result && !routeAllToOpenClaw) {
          const imageBase64Raw = dataUrlToBase64Raw(imageDataUrl);
          if (!imageBase64Raw) {
            throw new Error("รูปแบบรูปภาพไม่ถูกต้อง (base64)");
          }
          const slip = await readSlipWithKimiThenGlmOcr(imageBase64Raw, AbortSignal.timeout(85_000));
          let slipImageUrl: string | null = null;
          try {
            slipImageUrl = await persistChatSlipImage(imageDataUrl, input.userId);
          } catch (e) {
            console.warn("persistChatSlipImage failed:", e);
          }
          const slipDraft = pendingDraftFromSlipResult(slip, slipImageUrl);
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
        }
      } catch (e) {
        const fallbackError = e instanceof Error ? e.message : "Slip OCR error";
        lastError = [openClawError, fallbackError].filter(Boolean).join(" | ") || fallbackError;
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

    // ข้อความเท่านั้น: route-all จะใช้ OpenClaw ก่อนทุกครั้ง
    if (!result && hasOpenClaw && !imageDataUrl) {
      try {
        result = await callOpenClawAgent({
          history: nextHistory,
          prompt,
          assistantId,
          userId: input.userId,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("OpenClaw SDK Error:", msg);
        lastError = `OpenClaw: ${msg}`;
      }
    }
    if (!result && hasOllama && !imageDataUrl && !routeAllToOpenClaw) {
      try {
        result = await callOllama(prompt, undefined);
      } catch (e) {
        lastError = e instanceof Error ? e.message : "Ollama error";
      }
    }
    if (!result && hasOpenClaw && !imageDataUrl && !routeAllToOpenClaw) {
      try {
        result = await callOpenClawAgent({
          history: nextHistory,
          prompt,
          assistantId,
          userId: input.userId,
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
      } else if (imageDataUrl) {
        const reason = lastError?.trim() || "ยังอ่านข้อมูลจากรูปไม่ได้";
        result = {
          reply: [
            "อ่านสลิปไม่สำเร็จในรอบนี้ครับ",
            "",
            `สาเหตุ: ${reason}`,
            "",
            "แนะนำให้ลองอีกครั้งโดย:",
            "- ส่งรูปเดิมซ้ำอีกครั้ง (บางครั้งรอบถัดไปอ่านผ่าน)",
            "- ใช้ภาพที่คมชัดขึ้น/ครอปเฉพาะสลิป/แสงไม่สะท้อน",
            "- หากรีบ สามารถพิมพ์สั้นๆ เช่น \"ค่าน้ำ 450 บาท\" แล้วผมบันทึกให้ได้ทันที",
          ].join("\n"),
          provider: "local-tools",
          model: "slip-ocr-failed",
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
    if (!toolResult.used && message && replyClaimsDataSaved(reply)) {
      const expectedKind = inferExpectedSyncKind({
        incomingMessage,
        parsedFinanceCount: parsedFinanceFromMessage.length,
        reply,
      });
      if (expectedKind) {
        const hasProof = await hasRecentOpenClawSyncEvidence({
          userId: input.userId,
          kind: expectedKind,
          incomingMessage,
          parsedFinanceFromMessage,
        });
        if (!hasProof) {
          reply = buildPendingSyncReply(expectedKind);
        }
      }
    }
    /** บันทึกลง home finance สำเร็จ (สลิปยืนยัน / คำสั่งบันทึก…บาท) — ให้ตอบชัด + บอกแถบสรุป */
    const homeFinanceToolSaved =
      toolResult.used &&
      /รายการ\s*#\d+/u.test(toolResult.summary) &&
      (/ลงบัญชีแล้วค่ะ/u.test(toolResult.summary) ||
        /บันทึกราย(รับ|จ่าย)/u.test(toolResult.summary));
    if (homeFinanceToolSaved && message) {
      const toolLine = toolResult.summary.trim();
      reply = `ได้ค่ะ — ${toolLine}`;
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
