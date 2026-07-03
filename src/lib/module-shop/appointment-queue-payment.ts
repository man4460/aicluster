import type { ModuleShopPaymentDto } from "@/lib/module-shop/payment";
import { formatModuleBankTransferNote } from "@/lib/module-shop/payment";

/** อ่านช่องทางชำระ — รองรับคอลัมน์เก่าของจองคิว */
export function appointmentQueuePaymentFromRow(row: {
  promptPayPhone?: string | null;
  promptPayId?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  promptPayName?: string | null;
  taxId?: string | null;
} | null | undefined): ModuleShopPaymentDto {
  if (!row) {
    return {
      promptPayPhone: null,
      bankName: null,
      bankAccountNumber: null,
      bankAccountName: null,
      taxId: null,
    };
  }
  return {
    promptPayPhone: row.promptPayPhone?.trim() || row.promptPayId?.trim() || null,
    bankName: row.bankName?.trim() || null,
    bankAccountNumber: row.bankAccountNumber?.trim() || null,
    bankAccountName: row.bankAccountName?.trim() || row.promptPayName?.trim() || null,
    taxId: row.taxId?.trim() || null,
  };
}

/** เขียนลง DB + sync คอลัมน์เก่าให้พอร์ทัลเดิมยังอ่านได้ */
export function appointmentQueuePaymentWriteData(payment: Partial<ModuleShopPaymentDto>) {
  const promptPayPhone =
    payment.promptPayPhone !== undefined ?
      payment.promptPayPhone?.replace(/\D/g, "").slice(0, 15) || null
    : undefined;
  const bankName = payment.bankName !== undefined ? payment.bankName?.trim() || null : undefined;
  const bankAccountNumber =
    payment.bankAccountNumber !== undefined ? payment.bankAccountNumber?.trim() || null : undefined;
  const bankAccountName =
    payment.bankAccountName !== undefined ? payment.bankAccountName?.trim() || null : undefined;
  const taxId = payment.taxId !== undefined ? payment.taxId?.trim() || null : undefined;

  const merged: ModuleShopPaymentDto = {
    promptPayPhone: promptPayPhone ?? null,
    bankName: bankName ?? null,
    bankAccountNumber: bankAccountNumber ?? null,
    bankAccountName: bankAccountName ?? null,
    taxId: taxId ?? null,
  };

  const note = formatModuleBankTransferNote(merged);

  return {
    ...(promptPayPhone !== undefined ? { promptPayPhone, promptPayId: promptPayPhone } : {}),
    ...(bankName !== undefined ? { bankName } : {}),
    ...(bankAccountNumber !== undefined ? { bankAccountNumber } : {}),
    ...(bankAccountName !== undefined ? { bankAccountName, promptPayName: bankAccountName } : {}),
    ...(taxId !== undefined ? { taxId } : {}),
    ...(note !== undefined && (bankName !== undefined || bankAccountNumber !== undefined || bankAccountName !== undefined) ?
      { bankAccountNote: note }
    : {}),
  };
}

export function formatPortalPaymentLines(payment: ModuleShopPaymentDto): string[] {
  const lines: string[] = [];
  if (payment.promptPayPhone) lines.push(`พร้อมเพย์: ${payment.promptPayPhone}`);
  if (payment.bankName) lines.push(`ธนาคาร: ${payment.bankName}`);
  if (payment.bankAccountNumber) lines.push(`เลขบัญชี: ${payment.bankAccountNumber}`);
  if (payment.bankAccountName) lines.push(`ชื่อบัญชี: ${payment.bankAccountName}`);
  if (payment.taxId) lines.push(`เลขผู้เสียภาษี: ${payment.taxId}`);
  return lines;
}
