import { toAbsolutePublicUrl } from "@/lib/dormitory/invoice-asset-url";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { ensurePaymentPublicProofToken } from "@/lib/dormitory/proof-token";
import { resolveDormInvoiceBranding } from "@/lib/dormitory/resolve-dorm-invoice-branding";
import { buildUrlQrDataUrl } from "@/lib/dormitory/url-qr-dataurl";
import { prisma } from "@/lib/prisma";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";

export type DormInvoiceSheetDto = {
  roomId: string;
  dormName: string;
  logoUrl: string | null;
  taxId: string | null;
  address: string | null;
  caretakerPhone: string | null;
  roomNumber: string;
  tenantName: string;
  tenantPhone: string;
  periodMonth: string;
  amount: number;
  paymentChannelsNote: string | null;
  promptPayQrDataUrl: string | null;
  slipUploadQrDataUrl: string | null;
  uploadPageAbs: string;
};

/** ข้อมูลใบแจ้งหนี้ + QR (เฉพาะรายการค้างชำระที่เป็นของเจ้าของล็อกอิน) */
export async function getDormInvoiceSheetDto(
  paymentId: number,
  sessionUserId: string,
  baseUrl: string,
): Promise<DormInvoiceSheetDto | null> {
  const scope = await getDormitoryDataScope(sessionUserId);
  const payment = await prisma.splitBillPayment.findFirst({
    where: {
      id: paymentId,
      paymentStatus: "PENDING",
      tenant: {
        room: { ownerUserId: sessionUserId, trialSessionId: scope.trialSessionId },
      },
    },
    include: { tenant: true, bill: { include: { room: true } } },
  });
  if (!payment) return null;

  const ownerId = payment.bill.room.ownerUserId;
  const branding = await resolveDormInvoiceBranding(ownerId, scope.trialSessionId);
  const proofToken = await ensurePaymentPublicProofToken(payment.id);
  const uploadPagePath = `/pay/dorm/${proofToken}`;
  const uploadPageAbs = baseUrl ? `${baseUrl.replace(/\/$/, "")}${uploadPagePath}` : uploadPagePath;

  const slipUploadQrDataUrl =
    uploadPageAbs.startsWith("http://") || uploadPageAbs.startsWith("https://")
      ? await buildUrlQrDataUrl(uploadPageAbs, 108)
      : null;

  const amount = Number(payment.amountToPay);
  const promptPayQrDataUrl =
    branding.promptPayPhone && branding.promptPayPhone.replace(/\D/g, "").length >= 9
      ? await buildPromptPayQrDataUrl(branding.promptPayPhone, amount)
      : null;

  const periodMonth = `${payment.bill.billingYear}-${String(payment.bill.billingMonth).padStart(2, "0")}`;

  return {
    roomId: String(payment.bill.room.id),
    dormName: branding.displayName,
    logoUrl: toAbsolutePublicUrl(branding.logoUrl, baseUrl) ?? branding.logoUrl,
    taxId: branding.taxId,
    address: branding.address,
    caretakerPhone: branding.caretakerPhone,
    roomNumber: payment.bill.room.roomNumber,
    tenantName: payment.tenant.name,
    tenantPhone: payment.tenant.phone,
    periodMonth,
    amount,
    paymentChannelsNote: branding.paymentChannelsNote,
    promptPayQrDataUrl,
    slipUploadQrDataUrl,
    uploadPageAbs,
  };
}
