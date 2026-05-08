import { AppDashboardSection, AppSectionHeader } from "@/components/app-templates";
import { AttendanceLogsClient } from "@/systems/attendance/components/AttendanceLogsClient";

export default function AttendanceLogsPage() {
  return (
    <AppDashboardSection tone="violet">
      <AppSectionHeader
        tone="violet"
        title="รายงานเช็คอิน"
        description="ค้นหาตามช่วงวันที่หรือคำค้น — ส่งออก CSV"
      />
      <AttendanceLogsClient />
    </AppDashboardSection>
  );
}