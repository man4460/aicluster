import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-container";
import { bangkokMonthStartYmd, bangkokTodayYmd } from "@/lib/dates/bangkok-calendar";
import { ActivityLogsClient } from "@/systems/activity-logs/components/ActivityLogsClient";

export const metadata: Metadata = {
  title: "ความเคลื่อนไหวระบบ | ศูนย์แอดมิน",
};

export default function AdminActivityLogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="ความเคลื่อนไหวระบบ (ข้อมูลกลาง)"
        description="บันทึกการเพิ่ม แก้ไข ลบ ข้อมูลของผู้ใช้งานแบบแก้ไขย้อนหลังไม่ได้ และลบอัตโนมัติเมื่อเกิน 3 เดือน"
      />
      <ActivityLogsClient initialFrom={bangkokMonthStartYmd()} initialTo={bangkokTodayYmd()} />
    </div>
  );
}
