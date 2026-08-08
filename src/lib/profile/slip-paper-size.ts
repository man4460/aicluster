import { prisma } from "@/lib/prisma";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import {
  DEFAULT_APP_SLIP_PAPER_SIZE,
  parseAppSlipPaperSize,
  type AppSlipPaperSize,
} from "@/components/app-templates/slip-print";

/**
 * ขนาดกระดาษสลิป/ใบเสร็จจากโปรไฟล์ส่วนกลาง (DormitoryProfile.defaultPaperSize)
 * ใช้ร่วมทุกโมดูล — ตั้งค่าที่หน้าโปรไฟล์
 */
export async function getOwnerDefaultSlipPaperSize(ownerUserId: string): Promise<AppSlipPaperSize> {
  const row = await prisma.dormitoryProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId,
        trialSessionId: TRIAL_PROD_SCOPE,
      },
    },
    select: { defaultPaperSize: true },
  });
  if (!row?.defaultPaperSize) return DEFAULT_APP_SLIP_PAPER_SIZE;
  return parseAppSlipPaperSize(row.defaultPaperSize);
}
