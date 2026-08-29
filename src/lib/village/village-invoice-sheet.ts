import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { buildUrlQrDataUrl } from "@/lib/dormitory/url-qr-dataurl";
import { prisma } from "@/lib/prisma";
import { getVillageDataScope } from "@/lib/trial/module-scopes";
import { ensureFeeRowPublicProofToken } from "@/lib/village/proof-token";

export const VILLAGE_INVOICE_FALLBACK_NAME = "โครงการหมู่บ้าน";

/** สถานะบิลค่าส่วนกลางที่ยังออกใบแจ้งหนี้ / แนบสลิปได้ */
export const VILLAGE_UNPAID_FEE_STATUSES = ["PENDING", "PARTIAL"] as const;

/** ใช้ใน Prisma `where` */
export function villageUnpaidFeeRowStatusFilter() {
  return { status: { in: [...VILLAGE_UNPAID_FEE_STATUSES] } };
}

export type VillageInvoiceSheetDto = {
  feeRowId: number;
  houseId: number;
  villageName: string;
  address: string | null;
  contactPhone: string | null;
  houseNo: string;
  residentName: string;
  residentPhone: string;
  periodMonth: string;
  amountDue: number;
  amountPaid: number;
  /** ยอดคงเหลือที่ต้องชำระ */
  amount: number;
  paymentChannelsNote: string | null;
  promptPayQrDataUrl: string | null;
  slipUploadQrDataUrl: string | null;
  uploadPagePath: string;
  uploadPageAbs: string;
};

function absoluteUploadUrl(baseUrl: string, path: string): string {
  const base = baseUrl.trim().replace(/\/$/, "");
  return base ? `${base}${path}` : path;
}

/** ข้อมูลใบแจ้งหนี้ค่าส่วนกลาง + QR (เฉพาะบิลค้างของเจ้าของที่ล็อกอิน) */
export async function getVillageInvoiceSheetDto(
  feeRowId: number,
  ownerUserId: string,
  baseUrl: string,
): Promise<VillageInvoiceSheetDto | null> {
  const scope = await getVillageDataScope(ownerUserId);
  const row = await prisma.villageCommonFeeRow.findFirst({
    where: {
      id: feeRowId,
      ownerUserId,
      trialSessionId: scope.trialSessionId,
      ...villageUnpaidFeeRowStatusFilter(),
    },
    include: {
      house: {
        include: {
          residents: {
            where: { isActive: true },
            orderBy: [{ isPrimary: "desc" }, { id: "asc" }],
            take: 1,
          },
        },
      },
    },
  });
  if (!row) return null;

  const amount = row.amountDue - row.amountPaid;
  if (amount <= 0) return null;

  const profile = await prisma.villageProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: { ownerUserId, trialSessionId: scope.trialSessionId },
    },
  });

  const token = await ensureFeeRowPublicProofToken(row.id);
  const uploadPagePath = `/pay/village/${token}`;
  const uploadPageAbs = absoluteUploadUrl(baseUrl, uploadPagePath);

  const slipUploadQrDataUrl =
    uploadPageAbs.startsWith("http://") || uploadPageAbs.startsWith("https://")
      ? await buildUrlQrDataUrl(uploadPageAbs, 108)
      : null;

  const promptPayPhone = profile?.promptPayPhone ?? null;
  const promptPayQrDataUrl =
    promptPayPhone && promptPayPhone.replace(/\D/g, "").length >= 9
      ? await buildPromptPayQrDataUrl(promptPayPhone, amount)
      : null;

  const primaryResident = row.house.residents[0] ?? null;
  const residentName = row.house.ownerName?.trim() || primaryResident?.name?.trim() || "—";
  const residentPhone = row.house.phone?.trim() || primaryResident?.phone?.trim() || "—";

  return {
    feeRowId: row.id,
    houseId: row.houseId,
    villageName: profile?.displayName?.trim() || VILLAGE_INVOICE_FALLBACK_NAME,
    address: profile?.address?.trim() || null,
    contactPhone: profile?.contactPhone?.trim() || null,
    houseNo: row.house.houseNo,
    residentName,
    residentPhone,
    periodMonth: row.yearMonth,
    amountDue: row.amountDue,
    amountPaid: row.amountPaid,
    amount,
    paymentChannelsNote: profile?.paymentChannelsNote?.trim() || null,
    promptPayQrDataUrl,
    slipUploadQrDataUrl,
    uploadPagePath,
    uploadPageAbs,
  };
}

export type VillagePublicInvoiceDto = {
  villageName: string;
  contactPhone: string | null;
  houseNo: string;
  residentName: string;
  periodMonth: string;
  amount: number;
  paymentChannelsNote: string | null;
  promptPayQrDataUrl: string | null;
  /** true = บิลนี้เก็บครบ/ยกเว้นแล้ว ลิงก์ใช้ไม่ได้ */
  alreadyPaid: boolean;
  /** มีสลิปรอแอดมินตรวจอยู่แล้ว */
  hasPendingSlip: boolean;
};

/** ข้อมูลใบแจ้งหนี้สำหรับหน้าแนบสลิปสาธารณะ (ไม่ต้องล็อกอิน) */
export async function getVillagePublicInvoiceDto(token: string): Promise<VillagePublicInvoiceDto | null> {
  const t = token.trim();
  if (t.length < 16) return null;

  const row = await prisma.villageCommonFeeRow.findFirst({
    where: { publicProofToken: t },
    include: {
      house: {
        include: {
          residents: {
            where: { isActive: true },
            orderBy: [{ isPrimary: "desc" }, { id: "asc" }],
            take: 1,
          },
        },
      },
    },
  });
  if (!row) return null;

  const amount = row.amountDue - row.amountPaid;
  const alreadyPaid = amount <= 0 || row.status === "PAID" || row.status === "WAIVED";

  const profile = await prisma.villageProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: row.ownerUserId,
        trialSessionId: row.trialSessionId,
      },
    },
  });

  const promptPayPhone = profile?.promptPayPhone ?? null;
  const promptPayQrDataUrl =
    !alreadyPaid && promptPayPhone && promptPayPhone.replace(/\D/g, "").length >= 9
      ? await buildPromptPayQrDataUrl(promptPayPhone, amount)
      : null;

  const pendingSlips = await prisma.villageSlipSubmission.count({
    where: { feeRowId: row.id, status: "PENDING" },
  });

  const primaryResident = row.house.residents[0] ?? null;

  return {
    villageName: profile?.displayName?.trim() || VILLAGE_INVOICE_FALLBACK_NAME,
    contactPhone: profile?.contactPhone?.trim() || null,
    houseNo: row.house.houseNo,
    residentName: row.house.ownerName?.trim() || primaryResident?.name?.trim() || "—",
    periodMonth: row.yearMonth,
    amount: Math.max(0, amount),
    paymentChannelsNote: profile?.paymentChannelsNote?.trim() || null,
    promptPayQrDataUrl,
    alreadyPaid,
    hasPendingSlip: pendingSlips > 0,
  };
}
