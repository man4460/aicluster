import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/dashboard/ProfileEditor";
import { PageHeader } from "@/components/ui/page-container";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";

export const metadata: Metadata = {
  title: "โปรไฟล์ | MAWELL Buffet",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [user, prodBarber, prodDorm] = await Promise.all([
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
    prisma.barberShopProfile.findUnique({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: session.sub,
          trialSessionId: TRIAL_PROD_SCOPE,
        },
      },
      select: { taxId: true },
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
  ]);

  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader
        title="โปรไฟล์"
        description="ตั้งค่าบริษัท/ร้านส่วนกลาง: รูป ชื่อ ที่อยู่ เบอร์ติดต่อ โลเคชั่น และเลขกำกับภาษี (ใช้ร่วมทุกระบบ)"
      />
      <ProfileEditor
        initial={{
          ...user,
          taxId: prodBarber?.taxId ?? null,
          promptPayPhone: prodDorm?.promptPayPhone ?? null,
          paymentChannelsNote: prodDorm?.paymentChannelsNote ?? null,
          defaultPaperSize: prodDorm?.defaultPaperSize ?? "SLIP_58",
        }}
      />
    </div>
  );
}
