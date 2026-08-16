import { z } from "zod";

export type ModuleShopPaymentDto = {
  promptPayPhone: string | null;
  /** รูป QR พร้อมเพย์ที่อัปโหลดเอง (ทางเลือก — ใช้แทนการสร้างจากเบอร์) */
  promptPayQrImageUrl: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  taxId: string | null;
};

export const EMPTY_MODULE_SHOP_PAYMENT: ModuleShopPaymentDto = {
  promptPayPhone: null,
  promptPayQrImageUrl: null,
  bankName: null,
  bankAccountNumber: null,
  bankAccountName: null,
  taxId: null,
};

export const moduleShopPaymentPatchSchema = z.object({
  promptPayPhone: z.string().max(20).optional().nullable(),
  promptPayQrImageUrl: z.string().max(512).optional().nullable(),
  bankName: z.string().max(120).optional().nullable(),
  bankAccountNumber: z.string().max(32).optional().nullable(),
  bankAccountName: z.string().max(200).optional().nullable(),
  taxId: z.string().max(30).optional().nullable(),
});

export function normalizePromptPayPhone(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "").slice(0, 15);
  return digits.length > 0 ? digits : null;
}

export function formatModuleBankTransferNote(data: {
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
}): string | null {
  const lines: string[] = [];
  const bank = data.bankName?.trim();
  const acct = data.bankAccountNumber?.trim();
  const name = data.bankAccountName?.trim();
  if (bank) lines.push(`ธนาคาร: ${bank}`);
  if (acct) lines.push(`เลขบัญชี: ${acct}`);
  if (name) lines.push(`ชื่อบัญชี: ${name}`);
  if (lines.length === 0) return null;
  lines.push("กรุณาแนบสลิปหลังโอน");
  return lines.join("\n");
}

export function paymentRowToDto(row: {
  promptPayPhone?: string | null;
  promptPayQrImageUrl?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  taxId?: string | null;
} | null | undefined): ModuleShopPaymentDto {
  if (!row) return { ...EMPTY_MODULE_SHOP_PAYMENT };
  return {
    promptPayPhone: row.promptPayPhone ?? null,
    promptPayQrImageUrl: row.promptPayQrImageUrl ?? null,
    bankName: row.bankName ?? null,
    bankAccountNumber: row.bankAccountNumber ?? null,
    bankAccountName: row.bankAccountName ?? null,
    taxId: row.taxId ?? null,
  };
}

export const MODULE_SHOP_PAYMENT_SELECT = {
  promptPayPhone: true,
  promptPayQrImageUrl: true,
  bankName: true,
  bankAccountNumber: true,
  bankAccountName: true,
  taxId: true,
} as const;

export function moduleShopPaymentPatchData(
  data: Partial<ModuleShopPaymentDto>,
): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  if (data.promptPayPhone !== undefined) {
    out.promptPayPhone = normalizePromptPayPhone(data.promptPayPhone);
  }
  if (data.promptPayQrImageUrl !== undefined) {
    out.promptPayQrImageUrl = data.promptPayQrImageUrl?.trim() || null;
  }
  if (data.bankName !== undefined) out.bankName = data.bankName?.trim() || null;
  if (data.bankAccountNumber !== undefined) {
    out.bankAccountNumber = data.bankAccountNumber?.trim() || null;
  }
  if (data.bankAccountName !== undefined) out.bankAccountName = data.bankAccountName?.trim() || null;
  if (data.taxId !== undefined) out.taxId = data.taxId?.trim() || null;
  return out;
}
