import { prisma } from "@/lib/prisma";
import { getBusinessProfile } from "@/lib/profile/business-profile";

/** รวมโปรไฟล์หอพัก + โปรไฟล์ผู้ใช้ (โลโก้จาก avatar / dorm logo) สำหรับใบแจ้งหนี้ */
export async function resolveDormInvoiceBranding(
  ownerUserId: string,
  trialSessionId: string,
): Promise<{
  displayName: string;
  logoUrl: string | null;
  taxId: string | null;
  address: string | null;
  caretakerPhone: string | null;
  promptPayPhone: string | null;
  paymentChannelsNote: string | null;
}> {
  const [profile, business] = await Promise.all([
    prisma.dormitoryProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: { ownerUserId, trialSessionId },
      },
    }),
    getBusinessProfile(ownerUserId),
  ]);

  const dormName =
    business?.name?.trim() || profile?.displayName?.trim() || "หอพัก";

  return {
    displayName: dormName,
    /** avatar / โปรไฟล์ผู้ใช้ก่อน — การอัปโหลดโลโก้หอเขียนที่ users.avatar_url; คอลัมน์ dorm อาจค้างค่าเก่าเสีย */
    logoUrl: business?.logoUrl?.trim() || profile?.logoUrl?.trim() || null,
    taxId: profile?.taxId?.trim() || business?.taxId?.trim() || null,
    address: profile?.address?.trim() || business?.address?.trim() || null,
    caretakerPhone:
      profile?.caretakerPhone?.trim() || business?.contactPhone?.trim() || null,
    promptPayPhone: profile?.promptPayPhone ?? null,
    paymentChannelsNote: profile?.paymentChannelsNote ?? null,
  };
}
