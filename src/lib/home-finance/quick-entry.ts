import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import type { HomeFinanceEntryType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { writeSystemActivityLog } from "@/lib/audit-log";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { parseYmdToDbDate } from "@/lib/home-finance/entry-date";

/** คีย์หมวดสั้นๆ จากชื่อหมวด (ไม่ซ้ำกับคีย์ระบบแบบ UTILITIES_*) */
function categoryKeyFromLabel(label: string): string {
  const t = label.trim().slice(0, 100) || "อื่นๆ";
  const h = createHash("sha256").update(t, "utf8").digest("hex").slice(0, 20);
  return `CHAT_${h}`;
}

export type HomeFinanceQuickEntryResult =
  | { ok: true; entryId: number }
  | { ok: false; error: string; status: 400 | 403 | 500 };

/**
 * บันทึกรายรับ/รายจ่ายแบบย่อ (ใช้จาก Chat AI หรือ POST /api/personal-finance)
 * ใช้ billing user เดียวกับ home-finance — บัญชีพนักงานไม่สามารถบันทึกได้
 */
export async function createHomeFinanceQuickEntry(args: {
  actorUserId: string;
  entryDateYmd: string;
  amount: number;
  title: string;
  type: HomeFinanceEntryType;
  categoryLabel: string;
  note?: string | null;
  billNumber?: string | null;
  paymentMethod?: string | null;
}): Promise<HomeFinanceQuickEntryResult> {
  console.log("📊 createHomeFinanceQuickEntry called:", {
    actorUserId: args.actorUserId,
    amount: args.amount,
    title: args.title,
    type: args.type,
  });

  const ctx = await getModuleBillingContext(args.actorUserId);
  console.log("📊 getModuleBillingContext result:", {
    hasCtx: Boolean(ctx),
    isStaff: ctx?.isStaff ?? null,
    billingUserId: ctx ? `${ctx.billingUserId.slice(0, 8)}…` : null,
  });

  if (!ctx || ctx.isStaff) {
    return {
      ok: false,
      status: 403,
      error: ctx?.isStaff
        ? "บัญชีพนักงานไม่สามารถใช้รายรับ-รายจ่ายได้ — โปรดเข้าด้วยบัญชีเจ้าของ"
        : "ไม่มีสิทธิ์เข้าใช้",
    };
  }

  const entryDate = parseYmdToDbDate(args.entryDateYmd);
  if (!entryDate) {
    return { ok: false, status: 400, error: "รูปแบบวันที่ไม่ถูกต้อง (ใช้ YYYY-MM-DD)" };
  }
  if (!Number.isFinite(args.amount) || args.amount <= 0) {
    return { ok: false, status: 400, error: "จำนวนเงินต้องเป็นตัวเลขบวก" };
  }

  const title = args.title.trim().slice(0, 160) || (args.type === "INCOME" ? "รายรับ" : "รายจ่าย");
  const categoryLabel = (args.categoryLabel.trim().slice(0, 100) || "อื่นๆ").trim();
  const categoryKey = categoryKeyFromLabel(categoryLabel);
  const attachmentJson: Prisma.InputJsonValue = [];
  const noteRaw = args.note?.trim() ?? "";
  const note = noteRaw ? noteRaw.slice(0, 600) : null;
  const billNumber = args.billNumber?.trim() ? args.billNumber.trim().slice(0, 100) : null;
  const paymentMethod = args.paymentMethod?.trim() ? args.paymentMethod.trim().slice(0, 40) : null;

  try {
    console.log("📊 creating HomeFinanceEntry for owner:", `${ctx.billingUserId.slice(0, 8)}…`);

    const row = await prisma.homeFinanceEntry.create({
      data: {
        ownerUserId: ctx.billingUserId,
        entryDate,
        type: args.type,
        categoryKey,
        categoryLabel,
        title,
        amount: args.amount,
        dueDate: null,
        billNumber,
        vehicleType: null,
        serviceCenter: null,
        paymentMethod,
        note,
        slipImageUrl: null,
        attachmentUrls: attachmentJson,
        linkedUtilityId: null,
        linkedVehicleId: null,
      },
      select: { id: true, title: true, amount: true },
    });

    await writeSystemActivityLog({
      actorUserId: ctx.actorUserId,
      action: "CREATE",
      modelName: "HomeFinanceEntry",
      payload: { id: row.id, ownerUserId: ctx.billingUserId, title: row.title, amount: Number(row.amount), source: "personal-finance" },
    });

    console.log("📊 createHomeFinanceQuickEntry ok, entryId:", row.id);
    return { ok: true, entryId: row.id };
  } catch (e) {
    console.error("createHomeFinanceQuickEntry", e);
    return { ok: false, status: 500, error: "บันทึกลงฐานข้อมูลไม่สำเร็จ — ลองใหม่หรือตรวจสอบการเชื่อมต่อ" };
  }
}

export type ParsedFinanceChatCommand = {
  isIncome: boolean;
  amount: number;
  title: string;
  categoryLabel: string;
};

/** แยกคำสั่งแชท เช่น "บันทึกรายจ่าย 500 บาท ค่ากาแฟ" หรือ "บันทึก 100 บาท" (รูปแบบสั้น) */
export function parseFinanceRecordCommand(raw: string): ParsedFinanceChatCommand | null {
  const message = raw.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");

  // รูปแบบสั้น: "บันทึก 100 บาท" / "บันทึก 1,200 บาท ค่ากาแฟ" (มีตัวเลข + บาท ชัดเจน — ต้องอยู่ก่อน "บันทึก ..." แบบโน้ตใน maybeRunPersonalTool)
  const short = message.match(/^บันทึก\s+(?!ว่า)([\d,]+(?:\.\d+)?)\s*(?:บาท|บ\.?)(?:\s*(.*))?$/iu);
  if (short?.[1]) {
    const amount = Number(short[1].replace(/,/g, ""));
    if (Number.isFinite(amount) && amount > 0) {
      let rest = (short[2] ?? "").trim();
      let categoryLabel = "อื่นๆ";
      const catM = rest.match(/\s+(?:หมวด|#)\s*[:：]?\s*(.+)$/u);
      if (catM?.[1] != null && catM.index != null) {
        categoryLabel = catM[1].trim().slice(0, 100) || categoryLabel;
        rest = rest.slice(0, catM.index).trim();
      }
      const hasIncome = /รายรับ/u.test(message);
      const hasExpense = /รายจ่าย/u.test(message);
      const isIncome = hasIncome && !hasExpense;
      const title = rest || (isIncome ? "รายรับ" : "รายจ่าย");
      return { isIncome, amount, title, categoryLabel };
    }
  }

  const prefixRe = /^(บันทึกรายรับ|บันทึกรายจ่าย|เพิ่มรายรับ|เพิ่มรายจ่าย|จดรายรับ|จดรายจ่าย)\s+/u;
  const prefixMatch = message.match(prefixRe);
  if (!prefixMatch?.[1]) return null;
  const isIncome = /รายรับ/u.test(prefixMatch[1]);
  let rest = message.slice(prefixMatch[0].length).trim();

  let categoryLabel = "อื่นๆ";
  const catM = rest.match(/\s+(?:หมวด|#)\s*[:：]?\s*(.+)$/u);
  if (catM?.[1] != null && catM.index != null) {
    categoryLabel = catM[1].trim().slice(0, 100) || categoryLabel;
    rest = rest.slice(0, catM.index).trim();
  }

  const leadingAmount = rest.match(/^([\d,]+(?:\.\d+)?)\s*(?:บาท|บ\.?)?(?:\s+(.*))?$/iu);
  let amountStr: string | undefined;
  let titlePart: string;

  if (leadingAmount?.[1]) {
    amountStr = leadingAmount[1].replace(/,/g, "");
    titlePart = (leadingAmount[2] ?? "").trim();
  } else {
    const anyAmount = rest.match(/([\d,]+(?:\.\d+)?)\s*(?:บาท|บ\.?)/iu);
    if (!anyAmount?.[1] || anyAmount.index == null) return null;
    amountStr = anyAmount[1].replace(/,/g, "");
    const before = rest.slice(0, anyAmount.index).trim();
    const after = rest.slice(anyAmount.index + anyAmount[0].length).trim();
    titlePart = `${before} ${after}`.trim();
  }

  const amount = Number(amountStr);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const title = titlePart || (isIncome ? "รายรับ" : "รายจ่าย");
  return { isIncome, amount, title, categoryLabel };
}

export function todayYmdBangkok(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  if (!y || !m || !d) return new Date().toISOString().slice(0, 10);
  return `${y}-${m}-${d}`;
}
