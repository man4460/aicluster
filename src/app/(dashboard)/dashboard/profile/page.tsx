import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/dashboard/ProfileEditor";
import { PageHeader } from "@/components/ui/page-container";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "โปรไฟล์ | MAWELL Buffet",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      email: true,
      username: true,
      fullName: true,
      phone: true,
      address: true,
      latitude: true,
      longitude: true,
      avatarUrl: true,
      barberShopProfile: { select: { taxId: true } },
      dormitoryProfile: {
        select: { promptPayPhone: true, paymentChannelsNote: true, defaultPaperSize: true },
      },
      tokens: true,
    },
  });

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
          taxId: user.barberShopProfile?.taxId ?? null,
          promptPayPhone: user.dormitoryProfile?.promptPayPhone ?? null,
          paymentChannelsNote: user.dormitoryProfile?.paymentChannelsNote ?? null,
          defaultPaperSize: user.dormitoryProfile?.defaultPaperSize ?? "SLIP_58",
        }}
      />
    </div>
  );
}
