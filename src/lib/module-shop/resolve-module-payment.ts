import { prisma } from "@/lib/prisma";
import {
  APPOINTMENT_QUEUE_MODULE_SLUG,
  BARBER_MODULE_SLUG,
  BUILDING_POS_MODULE_SLUG,
  CAR_WASH_MODULE_SLUG,
  DRINK_POS_MODULE_SLUG,
  HOTEL_RESORT_MODULE_SLUG,
  LAUNDRY_MODULE_SLUG,
  LOYALTY_STAMP_MODULE_SLUG,
  MASSAGE_MODULE_SLUG,
} from "@/lib/modules/config";
import { appointmentQueuePaymentFromRow } from "@/lib/module-shop/appointment-queue-payment";
import {
  formatModuleBankTransferNote,
  MODULE_SHOP_PAYMENT_SELECT,
  paymentRowToDto,
} from "@/lib/module-shop/payment";import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

export type ResolvedModulePayment = {
  promptPayPhone: string | null;
  paymentChannelsNote: string | null;
  taxId: string | null;
};

async function dormitoryPaymentFallback(
  ownerUserId: string,
  trialSessionId: string,
): Promise<ResolvedModulePayment> {
  const dorm = await prisma.dormitoryProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    select: { promptPayPhone: true, paymentChannelsNote: true, taxId: true },
  });
  if (!dorm && trialSessionId !== TRIAL_PROD_SCOPE) {
    const prod = await prisma.dormitoryProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE },
      },
      select: { promptPayPhone: true, paymentChannelsNote: true, taxId: true },
    });
    return {
      promptPayPhone: prod?.promptPayPhone?.trim() || null,
      paymentChannelsNote: prod?.paymentChannelsNote?.trim() || null,
      taxId: prod?.taxId?.trim() || null,
    };
  }
  return {
    promptPayPhone: dorm?.promptPayPhone?.trim() || null,
    paymentChannelsNote: dorm?.paymentChannelsNote?.trim() || null,
    taxId: dorm?.taxId?.trim() || null,
  };
}

function fromPaymentDto(dto: ReturnType<typeof paymentRowToDto>): ResolvedModulePayment {
  const bankNote = formatModuleBankTransferNote(dto);
  return {
    promptPayPhone: dto.promptPayPhone?.trim() || null,
    paymentChannelsNote: bankNote,
    taxId: dto.taxId?.trim() || null,
  };
}

function mergeWithFallback(
  modulePayment: ResolvedModulePayment,
  fallback: ResolvedModulePayment,
): ResolvedModulePayment {
  return {
    promptPayPhone: modulePayment.promptPayPhone || fallback.promptPayPhone,
    paymentChannelsNote: modulePayment.paymentChannelsNote || fallback.paymentChannelsNote,
    taxId: modulePayment.taxId || fallback.taxId,
  };
}

/** อ่านช่องทางชำระของโมดูล — ใช้ค่าตั้งค่าโมดูลก่อน แล้ว fallback โปรไฟล์หอพัก (prod) */
export async function resolveModulePayment(
  ownerUserId: string,
  trialSessionId: string,
  moduleSlug: string,
): Promise<ResolvedModulePayment> {
  const fallback = await dormitoryPaymentFallback(ownerUserId, trialSessionId);

  if (
    moduleSlug === CAR_WASH_MODULE_SLUG ||
    moduleSlug === LAUNDRY_MODULE_SLUG ||
    moduleSlug === BUILDING_POS_MODULE_SLUG
  ) {
    const row = await prisma.moduleShopBranding.findUnique({
      where: {
        ownerUserId_trialSessionId_moduleSlug: { ownerUserId, trialSessionId, moduleSlug },
      },
      select: MODULE_SHOP_PAYMENT_SELECT,
    });
    return mergeWithFallback(fromPaymentDto(paymentRowToDto(row)), fallback);
  }

  if (moduleSlug === HOTEL_RESORT_MODULE_SLUG) {
    const row = await prisma.hotelResortProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
      select: MODULE_SHOP_PAYMENT_SELECT,
    });
    return mergeWithFallback(fromPaymentDto(paymentRowToDto(row)), fallback);
  }

  if (moduleSlug === DRINK_POS_MODULE_SLUG) {
    const row = await prisma.drinkPosShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
      select: MODULE_SHOP_PAYMENT_SELECT,
    });
    return mergeWithFallback(fromPaymentDto(paymentRowToDto(row)), fallback);
  }

  if (moduleSlug === BARBER_MODULE_SLUG) {
    const row = await prisma.barberShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
      select: MODULE_SHOP_PAYMENT_SELECT,
    });
    return mergeWithFallback(fromPaymentDto(paymentRowToDto(row)), fallback);
  }

  if (moduleSlug === MASSAGE_MODULE_SLUG) {
    const row = await prisma.massageShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
      select: MODULE_SHOP_PAYMENT_SELECT,
    });
    return mergeWithFallback(fromPaymentDto(paymentRowToDto(row)), fallback);
  }

  if (moduleSlug === APPOINTMENT_QUEUE_MODULE_SLUG) {
    const row = await prisma.appointmentQueueShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
      select: {
        ...MODULE_SHOP_PAYMENT_SELECT,
        promptPayId: true,
        promptPayName: true,
        bankAccountNote: true,
      },
    });
    const payment = appointmentQueuePaymentFromRow(row);
    return mergeWithFallback(
      {
        promptPayPhone: payment.promptPayPhone,
        paymentChannelsNote:
          formatModuleBankTransferNote(payment) || row?.bankAccountNote?.trim() || null,
        taxId: payment.taxId,
      },
      fallback,
    );
  }

  if (moduleSlug === LOYALTY_STAMP_MODULE_SLUG) {
    const row = await prisma.loyaltyStampShopProfile.findUnique({
      where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
      select: MODULE_SHOP_PAYMENT_SELECT,
    });
    return mergeWithFallback(fromPaymentDto(paymentRowToDto(row)), fallback);
  }

  return fallback;
}