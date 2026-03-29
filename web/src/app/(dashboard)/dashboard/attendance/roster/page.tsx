import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-container";
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
    <div className="space-y-6">
      <PageHeader
        title="รายชื่อพนักงาน"
        description="เพิ่มชื่อ เบอร์โทร และกะที่ปฏิบัติงาน — ตอนเช็คเข้าระบบคำนวณมาสาย/ออกก่อนเวลาตามกะนั้น (บุคคลภายนอกระบบเลือกกะให้อัตโนมัติจากเวลาปัจจุบัน)"
      />
      <AttendanceRosterClient />
    </div>
  );
}
