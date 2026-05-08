import { redirect } from "next/navigation";
import { AppDashboardSection, AppSectionHeader } from "@/components/app-templates";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AttendanceRosterClient } from "@/systems/attendance/components/AttendanceRosterClient";

export default async function AttendanceRosterPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { employerUserId: true },
  });
  if (user?.employerUserId) redirect("/dashboard/attendance/check");

  return (
    <AppDashboardSection tone="violet">
      <AppSectionHeader
        tone="violet"
        title="รายชื่อพนักงาน"
        description="เพิ่มชื่อ เบอร์โทร และกะที่ปฏิบัติงาน — ตอนเช็คเข้าระบบคำนวณมาสาย/ออกก่อนเวลาตามกะนั้น (บุคคลภายนอกระบบเลือกกะให้อัตโนมัติจากเวลาปัจจุบัน)"
      />
      <AttendanceRosterClient />
    </AppDashboardSection>
  );
}
