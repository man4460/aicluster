import type { PrismaClient } from "@/generated/prisma/client";
import {
  APPOINTMENT_QUEUE_MODULE_SLUG,
  ASSET_MODULE_SLUG,
  ATTENDANCE_MODULE_SLUG,
  BARBER_MODULE_SLUG,
  BUILDING_POS_MODULE_SLUG,
  CAR_WASH_MODULE_SLUG,
  COMMUNITY_COOP_MODULE_SLUG,
  DOC_TRANSMISSION_MODULE_SLUG,
  DRINK_POS_MODULE_SLUG,
  DORMITORY_MODULE_SLUG,
  ECOMMERCE_STORE_MODULE_SLUG,
  EDUCARE_MODULE_SLUG,
  FOOTBALL_TURF_MODULE_SLUG,
  HOTEL_RESORT_MODULE_SLUG,
  LAUNDRY_MODULE_SLUG,
  CLUB_EVENT_MODULE_SLUG,
  LMS_MODULE_SLUG,
  PRO_RESUME_MODULE_SLUG,
  LOYALTY_STAMP_MODULE_SLUG,
  MASSAGE_MODULE_SLUG,
  PARKING_MODULE_SLUG,
  SCHOOL_BANK_MODULE_SLUG,
  SMART_POLICE_MODULE_SLUG,
  VILLAGE_MODULE_SLUG,
  WAIT_QUEUE_MODULE_SLUG,
} from "@/lib/modules/config";
import {
  MODULE_SHOP_BRANDING_FALLBACK_LABELS,
  type ModuleShopBrandingSlug,
} from "@/lib/module-shop/slugs";
import { defaultThaiAcademicYear } from "@/systems/doc-transmission/lib/doc-types";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import {
  DEMO_MODULE_CONTACT,
  DEMO_MODULE_LOGO_URL,
  DEMO_MODULE_PAYMENT,
  trialDemoDisplayName,
} from "@/lib/trial/demo-module-settings";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

async function upsertModuleShopBranding(
  tx: Tx,
  ownerUserId: string,
  trialSessionId: string,
  moduleSlug: ModuleShopBrandingSlug,
) {
  const fallback = MODULE_SHOP_BRANDING_FALLBACK_LABELS[moduleSlug];
  await tx.moduleShopBranding.upsert({
    where: {
      ownerUserId_trialSessionId_moduleSlug: {
        ownerUserId,
        trialSessionId,
        moduleSlug,
      },
    },
    create: {
      ownerUserId,
      trialSessionId,
      moduleSlug,
      displayName: trialDemoDisplayName(fallback),
      tagline: "ชุดข้อมูลทดลอง — แก้ไขในเมนูตั้งค่าได้",
      logoUrl: DEMO_MODULE_LOGO_URL,
      contactPhone: DEMO_MODULE_CONTACT.contactPhone,
      ...DEMO_MODULE_PAYMENT,
    },
    update: {
      displayName: trialDemoDisplayName(fallback),
      tagline: "ชุดข้อมูลทดลอง — แก้ไขในเมนูตั้งค่าได้",
      contactPhone: DEMO_MODULE_CONTACT.contactPhone,
      ...DEMO_MODULE_PAYMENT,
    },
  });
}

/**
 * เติมข้อมูลหน้าตั้งค่า (โปรไฟล์ร้าน / ชำระเงิน / องค์กร) สำหรับ sandbox ทดลอง
 * เรียกทุกครั้งหลัง startTrial — idempotent upsert
 */
export async function seedTrialModuleSettings(
  tx: Tx,
  ownerUserId: string,
  trialSessionId: string,
  moduleSlug: string,
): Promise<void> {
  if (!trialSessionId || trialSessionId === TRIAL_PROD_SCOPE) return;

  switch (moduleSlug) {
    case HOTEL_RESORT_MODULE_SLUG:
      await tx.hotelResortProfile.upsert({
        where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
        create: {
          ownerUserId,
          trialSessionId,
          propertyName: trialDemoDisplayName("รีสอร์ทมาเวล"),
          managerName: "คุณสมชาย ผู้จัดการ",
          tagline: "พักผ่อนใกล้ธรรมชาติ — จองออนไลน์ได้",
          logoUrl: DEMO_MODULE_LOGO_URL,
          contactPhone: DEMO_MODULE_CONTACT.contactPhone,
          address: DEMO_MODULE_CONTACT.address,
          lineId: DEMO_MODULE_CONTACT.lineId,
          facebookUrl: DEMO_MODULE_CONTACT.facebookUrl,
          mapUrl: DEMO_MODULE_CONTACT.mapUrl,
          checkInTime: "14:00",
          checkOutTime: "12:00",
          portalBookingPaymentMode: "DEPOSIT",
          depositAmountBaht: 500,
          ...DEMO_MODULE_PAYMENT,
        },
        update: {
          propertyName: trialDemoDisplayName("รีสอร์ทมาเวล"),
          managerName: "คุณสมชาย ผู้จัดการ",
          tagline: "พักผ่อนใกล้ธรรมชาติ — จองออนไลน์ได้",
          contactPhone: DEMO_MODULE_CONTACT.contactPhone,
          address: DEMO_MODULE_CONTACT.address,
          lineId: DEMO_MODULE_CONTACT.lineId,
          facebookUrl: DEMO_MODULE_CONTACT.facebookUrl,
          mapUrl: DEMO_MODULE_CONTACT.mapUrl,
          portalBookingPaymentMode: "DEPOSIT",
          depositAmountBaht: 500,
          ...DEMO_MODULE_PAYMENT,
        },
      });
      break;

    case DRINK_POS_MODULE_SLUG:
      await tx.drinkPosShopProfile.upsert({
        where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
        create: {
          ownerUserId,
          trialSessionId,
          displayName: trialDemoDisplayName("Café MAWELL"),
          tagline: "กาแฟสด · สมูทตี้ · สั่งออนไลน์",
          logoUrl: DEMO_MODULE_LOGO_URL,
          contactPhone: DEMO_MODULE_CONTACT.contactPhone,
          address: DEMO_MODULE_CONTACT.address,
          contactLine: DEMO_MODULE_CONTACT.lineId,
          facebookUrl: DEMO_MODULE_CONTACT.facebookUrl,
          mapUrl: DEMO_MODULE_CONTACT.mapUrl,
          openTime: "08:00",
          closeTime: "20:00",
          portalBookingPaymentMode: "DEPOSIT",
          depositAmountBaht: 50,
          depositPercent: 30,
          stampsPerReward: 10,
          rewardTitle: "เครื่องดื่มฟรี 1 แก้ว",
          promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
          bankName: DEMO_MODULE_PAYMENT.bankName,
          bankAccountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber,
          bankAccountName: DEMO_MODULE_PAYMENT.bankAccountName,
          taxId: DEMO_MODULE_PAYMENT.taxId,
        },
        update: {
          displayName: trialDemoDisplayName("Café MAWELL"),
          tagline: "กาแฟสด · สมูทตี้ · สั่งออนไลน์",
          contactPhone: DEMO_MODULE_CONTACT.contactPhone,
          address: DEMO_MODULE_CONTACT.address,
          portalBookingPaymentMode: "DEPOSIT",
          depositAmountBaht: 50,
          promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
          bankName: DEMO_MODULE_PAYMENT.bankName,
          bankAccountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber,
          bankAccountName: DEMO_MODULE_PAYMENT.bankAccountName,
          taxId: DEMO_MODULE_PAYMENT.taxId,
        },
      });
      break;

    case FOOTBALL_TURF_MODULE_SLUG:
      await tx.footballTurfShopProfile.upsert({
        where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
        create: {
          ownerUserId,
          trialSessionId,
          venueName: trialDemoDisplayName("สนามฟุตบอล MAWELL"),
          venueSubtitle: "สนามหญ้าเทียม",
          contactPhone: DEMO_MODULE_CONTACT.contactPhone,
          venueAddress: DEMO_MODULE_CONTACT.address,
          note: "",
          promptpayNumber: DEMO_MODULE_PAYMENT.promptPayPhone ?? "",
          bankName: DEMO_MODULE_PAYMENT.bankName ?? "",
          accountName: DEMO_MODULE_PAYMENT.bankAccountName ?? "",
          accountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber ?? "",
          taxId: DEMO_MODULE_PAYMENT.taxId ?? "",
          facebookUrl: DEMO_MODULE_CONTACT.facebookUrl,
          mapUrl: DEMO_MODULE_CONTACT.mapUrl,
          portalBookingPaymentMode: "DEPOSIT",
          depositAmountBaht: 200,
        },
        update: {
          venueName: trialDemoDisplayName("สนามฟุตบอล MAWELL"),
          contactPhone: DEMO_MODULE_CONTACT.contactPhone,
          venueAddress: DEMO_MODULE_CONTACT.address,
          promptpayNumber: DEMO_MODULE_PAYMENT.promptPayPhone ?? "",
          bankName: DEMO_MODULE_PAYMENT.bankName ?? "",
          accountName: DEMO_MODULE_PAYMENT.bankAccountName ?? "",
          accountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber ?? "",
          taxId: DEMO_MODULE_PAYMENT.taxId ?? "",
          portalBookingPaymentMode: "DEPOSIT",
          depositAmountBaht: 200,
        },
      });
      break;

    case APPOINTMENT_QUEUE_MODULE_SLUG:
      await tx.appointmentQueueShopProfile.upsert({
        where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
        create: {
          ownerUserId,
          trialSessionId,
          displayName: trialDemoDisplayName("ร้านจองคิว"),
          tagline: "สแกน QR จองเวลา — สนาม / บริการตามที่ร้านกำหนด",
          contactPhone: DEMO_MODULE_CONTACT.contactPhone,
          depositRequired: true,
          depositAmountBaht: 100,
          promptPayId: DEMO_MODULE_PAYMENT.promptPayPhone ?? "",
          promptPayName: trialDemoDisplayName("ร้านจองคิว"),
          promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
          bankName: DEMO_MODULE_PAYMENT.bankName,
          bankAccountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber,
          bankAccountName: DEMO_MODULE_PAYMENT.bankAccountName,
          taxId: DEMO_MODULE_PAYMENT.taxId,
          defaultSlotMinutes: 60,
          publicBookingEnabled: true,
        },
        update: {
          displayName: trialDemoDisplayName("ร้านจองคิว"),
          contactPhone: DEMO_MODULE_CONTACT.contactPhone,
          depositRequired: true,
          depositAmountBaht: 100,
          promptPayId: DEMO_MODULE_PAYMENT.promptPayPhone ?? "",
          promptPayName: trialDemoDisplayName("ร้านจองคิว"),
          promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
          bankName: DEMO_MODULE_PAYMENT.bankName,
          bankAccountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber,
          bankAccountName: DEMO_MODULE_PAYMENT.bankAccountName,
          taxId: DEMO_MODULE_PAYMENT.taxId,
        },
      });
      break;

    case LOYALTY_STAMP_MODULE_SLUG:
      await tx.loyaltyStampShopProfile.upsert({
        where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
        create: {
          ownerUserId,
          trialSessionId,
          displayName: trialDemoDisplayName("ร้านสะสมแต้ม"),
          tagline: "สะสมครบแลกของรางวัล — สแกน QR ที่เคาน์เตอร์",
          stampsPerReward: 10,
          rewardTitle: "เครื่องดื่มฟรี 1 แก้ว",
          rewardDescription: "เลือกเมนูใดก็ได้ในร้าน (ไม่เกิน 80 บาท)",
          stampEmoji: "☕",
          publicCardEnabled: true,
          promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
          bankName: DEMO_MODULE_PAYMENT.bankName,
          bankAccountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber,
          bankAccountName: DEMO_MODULE_PAYMENT.bankAccountName,
          taxId: DEMO_MODULE_PAYMENT.taxId,
        },
        update: {
          displayName: trialDemoDisplayName("ร้านสะสมแต้ม"),
          tagline: "สะสมครบแลกของรางวัล — สแกน QR ที่เคาน์เตอร์",
          stampsPerReward: 10,
          rewardTitle: "เครื่องดื่มฟรี 1 แก้ว",
          publicCardEnabled: true,
          promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
          bankName: DEMO_MODULE_PAYMENT.bankName,
          bankAccountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber,
          bankAccountName: DEMO_MODULE_PAYMENT.bankAccountName,
          taxId: DEMO_MODULE_PAYMENT.taxId,
        },
      });
      break;

    case PARKING_MODULE_SLUG: {
      const existing = await tx.parkingSite.findFirst({
        where: { ownerUserId, trialSessionId },
        orderBy: { id: "asc" },
      });
      if (existing) {
        await tx.parkingSite.update({
          where: { id: existing.id },
          data: {
            name: trialDemoDisplayName("ลานจอดหลัก"),
            pricingMode: "HOURLY",
            hourlyRateBaht: 20,
            dailyRateBaht: 150,
          },
        });
      } else {
        await tx.parkingSite.create({
          data: {
            ownerUserId,
            trialSessionId,
            name: trialDemoDisplayName("ลานจอดหลัก"),
            pricingMode: "HOURLY",
            hourlyRateBaht: 20,
            dailyRateBaht: 150,
          },
        });
      }
      break;
    }

    case BARBER_MODULE_SLUG:
      await tx.barberShopProfile.updateMany({
        where: { ownerUserId, trialSessionId },
        data: {
          promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
          bankName: DEMO_MODULE_PAYMENT.bankName,
          bankAccountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber,
          bankAccountName: DEMO_MODULE_PAYMENT.bankAccountName,
        },
      });
      break;

    case MASSAGE_MODULE_SLUG:
      await tx.massageShopProfile.updateMany({
        where: { ownerUserId, trialSessionId },
        data: {
          promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
          bankName: DEMO_MODULE_PAYMENT.bankName,
          bankAccountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber,
          bankAccountName: DEMO_MODULE_PAYMENT.bankAccountName,
          taxId: DEMO_MODULE_PAYMENT.taxId,
        },
      });
      break;

    case CAR_WASH_MODULE_SLUG:
      await upsertModuleShopBranding(tx, ownerUserId, trialSessionId, CAR_WASH_MODULE_SLUG);
      break;

    case LAUNDRY_MODULE_SLUG:
      await upsertModuleShopBranding(tx, ownerUserId, trialSessionId, LAUNDRY_MODULE_SLUG);
      break;

    case CLUB_EVENT_MODULE_SLUG:
      await tx.clubEventProfile.updateMany({
        where: { ownerUserId, trialSessionId },
        data: {
          displayName: trialDemoDisplayName("ชมรมตัวอย่าง"),
          tagline: "ชุดข้อมูลทดลอง — แก้ไขในเมนูตั้งค่าได้",
          logoUrl: DEMO_MODULE_LOGO_URL,
          contactPhone: DEMO_MODULE_CONTACT.contactPhone,
          contactLine: DEMO_MODULE_CONTACT.lineId,
          promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
          bankName: DEMO_MODULE_PAYMENT.bankName,
          bankAccountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber,
          bankAccountName: DEMO_MODULE_PAYMENT.bankAccountName,
        },
      });
      break;

    case LMS_MODULE_SLUG:
      await tx.lmsProfile.updateMany({
        where: { ownerUserId, trialSessionId },
        data: {
          displayName: trialDemoDisplayName("สถาบัน LMS ตัวอย่าง"),
          tagline: "ชุดข้อมูลทดลอง — แก้ไขในเมนูตั้งค่าได้",
          logoUrl: DEMO_MODULE_LOGO_URL,
          contactPhone: DEMO_MODULE_CONTACT.contactPhone,
          contactLine: DEMO_MODULE_CONTACT.lineId,
          promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
          bankName: DEMO_MODULE_PAYMENT.bankName,
          bankAccountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber,
          bankAccountName: DEMO_MODULE_PAYMENT.bankAccountName,
        },
      });
      break;

    case PRO_RESUME_MODULE_SLUG:
      await tx.resumeProfile.updateMany({
        where: { ownerUserId, trialSessionId },
        data: {
          fullName: trialDemoDisplayName("โปรไฟล์เรซูเม่ตัวอย่าง"),
          positionTitle: "นักพัฒนาระบบ (ทดลอง)",
          bio: "ชุดข้อมูลทดลอง — แก้ไขในเมนูโปรไฟล์ได้",
          profileImageUrl: DEMO_MODULE_LOGO_URL,
          contactPhone: DEMO_MODULE_CONTACT.contactPhone,
          publicEnabled: true,
        },
      });
      break;

    case BUILDING_POS_MODULE_SLUG:
      await upsertModuleShopBranding(tx, ownerUserId, trialSessionId, BUILDING_POS_MODULE_SLUG);
      break;

    case DORMITORY_MODULE_SLUG:
      await tx.dormitoryProfile.updateMany({
        where: { ownerUserId, trialSessionId },
        data: {
          paymentChannelsNote: "โอนธนาคาร / พร้อมเพย์ 081-234-5678 — ชุดทดลอง",
        },
      });
      break;

    case VILLAGE_MODULE_SLUG:
      await tx.villageProfile.updateMany({
        where: { ownerUserId, trialSessionId },
        data: {
          promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
          paymentChannelsNote: "โอนธนาคาร / พร้อมเพย์ — ชุดทดลอง",
        },
      });
      break;

    case WAIT_QUEUE_MODULE_SLUG:
      await tx.waitQueueSite.updateMany({
        where: { ownerUserId, trialSessionId },
        data: {
          name: trialDemoDisplayName("คิวหน้าร้าน"),
          callMessage: "ถึงคิวแล้ว เชิญเข้าร้าน",
        },
      });
      break;

    case SCHOOL_BANK_MODULE_SLUG:
      await tx.schoolBankSettings.upsert({
        where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
        create: {
          ownerUserId,
          trialSessionId,
          displayName: trialDemoDisplayName("ธนาคารโรงเรียน"),
        },
        update: { displayName: trialDemoDisplayName("ธนาคารโรงเรียน") },
      });
      break;

    case COMMUNITY_COOP_MODULE_SLUG:
      await tx.communityCoopSettings.upsert({
        where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
        create: {
          ownerUserId,
          trialSessionId,
          displayName: trialDemoDisplayName("สหกรณ์ชุมชน"),
        },
        update: { displayName: trialDemoDisplayName("สหกรณ์ชุมชน") },
      });
      break;

    case DOC_TRANSMISSION_MODULE_SLUG:
      await tx.docTransmissionSettings.upsert({
        where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
        create: {
          ownerUserId,
          trialSessionId,
          orgName: trialDemoDisplayName("โรงเรียนสาธิตวิทยา"),
          orgAddress: DEMO_MODULE_CONTACT.address,
          orgPhone: "02-111-0000",
          defaultYear: defaultThaiAcademicYear(),
        },
        update: {
          orgName: trialDemoDisplayName("โรงเรียนสาธิตวิทยา"),
          orgAddress: DEMO_MODULE_CONTACT.address,
          orgPhone: "02-111-0000",
        },
      });
      break;

    case EDUCARE_MODULE_SLUG:
      await tx.educareSettings.upsert({
        where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
        create: {
          ownerUserId,
          trialSessionId,
          schoolName: trialDemoDisplayName("โรงเรียนสาธิต"),
          schoolAddress: DEMO_MODULE_CONTACT.address,
          schoolPhone: "02-123-4567",
        },
        update: {
          schoolName: trialDemoDisplayName("โรงเรียนสาธิต"),
          schoolAddress: DEMO_MODULE_CONTACT.address,
          schoolPhone: "02-123-4567",
        },
      });
      break;

    case ASSET_MODULE_SLUG:
      await tx.assetSettings.upsert({
        where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
        create: {
          ownerUserId,
          trialSessionId,
          orgName: trialDemoDisplayName("บริษัท สาธิต"),
          orgAddress: DEMO_MODULE_CONTACT.address,
          orgPhone: "02-999-0000",
        },
        update: {
          orgName: trialDemoDisplayName("บริษัท สาธิต"),
          orgAddress: DEMO_MODULE_CONTACT.address,
          orgPhone: "02-999-0000",
        },
      });
      break;

    case ECOMMERCE_STORE_MODULE_SLUG:
      await tx.ecommerceStore.upsert({
        where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
        create: {
          ownerUserId,
          trialSessionId,
          storeName: trialDemoDisplayName("MAWELL Shop"),
          description: "ร้านตัวอย่าง — สกินแคร์ ของใช้ และ Gadget",
          promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
          bankName: DEMO_MODULE_PAYMENT.bankName,
          bankAccountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber,
          bankAccountName: DEMO_MODULE_PAYMENT.bankAccountName,
        },
        update: {
          storeName: trialDemoDisplayName("MAWELL Shop"),
          promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
          bankName: DEMO_MODULE_PAYMENT.bankName,
          bankAccountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber,
          bankAccountName: DEMO_MODULE_PAYMENT.bankAccountName,
        },
      });
      break;

    case SMART_POLICE_MODULE_SLUG:
      await tx.smartPoliceProfile.upsert({
        where: { ownerUserId },
        create: {
          ownerUserId,
          stationName: trialDemoDisplayName("สถานีตำรวจตัวอย่าง"),
          stationAddress: DEMO_MODULE_CONTACT.address,
          province: "กรุงเทพมหานคร",
          commanderRank: "พ.ต.อ.",
          commanderName: "ผู้กำกับการ (ตัวอย่าง)",
          investigatorDefault: "ร.ต.อ. พนักงานสอบสวน (ตัวอย่าง)",
          caseNumberPrefix: "ส.",
          printFooter: "เอกสารจากระบบ Smart Police — ชุดทดลอง",
        },
        update: {
          stationName: trialDemoDisplayName("สถานีตำรวจตัวอย่าง"),
          stationAddress: DEMO_MODULE_CONTACT.address,
        },
      });
      break;

    case ATTENDANCE_MODULE_SLUG:
      await tx.attendanceSettings.updateMany({
        where: { ownerUserId, trialSessionId },
        data: { shiftStartTime: "09:00", shiftEndTime: "18:00", faceCheckInEnabled: true },
      });
      break;

    default:
      break;
  }
}
