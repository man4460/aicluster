import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/dashboard/ProfileEditor";
import { PageHeader } from "@/components/ui/page-container";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { getBarberDataScope } from "@/lib/trial/module-scopes";

export const metadata: Metadata = {
  title: "โปรไฟล์ | MAWELL Buffet",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, prodDorm, barberScope] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        email: true,
        username: true,
        subscriptionTier: true,
        subscriptionType: true,
        fullName: true,
        phone: true,
        address: true,
        latitude: true,
        longitude: true,
        avatarUrl: true,
        tokens: true,
      },
    }),
    prisma.dormitoryProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: session.sub,
          trialSessionId: TRIAL_PROD_SCOPE,
        },
      },
      select: { promptPayPhone: true, paymentChannelsNote: true, defaultPaperSize: true },
    }),
    getBarberDataScope(session.sub),
  ]);

  if (!user) redirect("/login");

  const business = await getBusinessProfile(session.sub, {
    barberTrialSessionId: barberScope.trialSessionId,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="โปรไฟล์"
        description="ตั้งค่าบริษัท/ร้านส่วนกลาง: รูปโปรไฟล์ (โลโก้) ชื่อร้าน ที่อยู่ เบอร์ติดต่อ โลเคชั่น และเลขกำกับภาษี — ใช้ร่วมทุกระบบ รวมโมดูลร้านตัดผม เช่น โปสเตอร์ QR"
      />
      <ProfileEditor
        initial={{
          ...user,
          taxId: business?.taxId ?? null,
          promptPayPhone: prodDorm?.promptPayPhone ?? null,
          paymentChannelsNote: prodDorm?.paymentChannelsNote ?? null,
          defaultPaperSize: prodDorm?.defaultPaperSize ?? "SLIP_58",
        }}
      />
    </div>
  );
}
