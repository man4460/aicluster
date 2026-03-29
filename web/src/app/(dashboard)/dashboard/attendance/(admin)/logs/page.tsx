import { PageHeader } from "@/components/ui/page-container";
import { AttendanceLogsClient } from "@/systems/attendance/components/AttendanceLogsClient";

export default function AttendanceLogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="รายงานเช็คชื่อ"
        description="ค้นหาตามช่วงวันที่หรือคำค้น — ส่งออก CSV"
      />
      <AttendanceLogsClient />
    </div>
  );
}
