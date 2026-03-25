import { PageHeader } from "@/components/ui/page-container";
import { ActivityLogsClient } from "@/systems/activity-logs/components/ActivityLogsClient";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ActivityLogsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <PageHeader
        title="ความเคลื่อนไหวระบบ (ข้อมูลกลาง)"
        description="บันทึกการเพิ่ม แก้ไข ลบ ข้อมูลของผู้ใช้งานแบบแก้ไขย้อนหลังไม่ได้ และลบอัตโนมัติเมื่อเกิน 3 เดือน"
      />
      <ActivityLogsClient />
    </div>
  );
}
