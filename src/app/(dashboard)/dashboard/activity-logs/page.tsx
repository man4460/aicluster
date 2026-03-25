import { PageHeader } from "@/components/ui/page-container";
import { ActivityLogsClient } from "@/systems/activity-logs/components/ActivityLogsClient";

export default function ActivityLogsPage() {
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
