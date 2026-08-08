import { z } from "zod";
import {
  DEFAULT_APP_SLIP_PAPER_SIZE,
  parseAppSlipPaperSize,
  type AppSlipPaperSize,
} from "@/components/app-templates/slip-print";

export const appSlipPaperSizeZod = z.enum(["SLIP_58", "SLIP_80", "A4"]);

export function normalizeModuleSlipPaperSize(raw: unknown): AppSlipPaperSize {
  return parseAppSlipPaperSize(raw ?? DEFAULT_APP_SLIP_PAPER_SIZE);
}

/** สร้างข้อความชำระเข้าบัญชีสำหรับท้ายใบเสร็จ */
export function buildAppSlipBankPaymentNote(parts: {
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
}): string | null {
  const bank = parts.bankName?.trim() || "";
  const no = parts.accountNumber?.trim() || "";
  const name = parts.accountName?.trim() || "";
  if (!bank && !no && !name) return null;
  const bits: string[] = [];
  if (bank) bits.push(`ธ.${bank.replace(/^ธ\./, "")}`);
  if (no) bits.push(`เลขที่ ${no}`);
  if (name) bits.push(`ชื่อ ${name}`);
  return `** กรุณาชำระเงินเข้าบัญชี ${bits.join(" ")} **`;
}
