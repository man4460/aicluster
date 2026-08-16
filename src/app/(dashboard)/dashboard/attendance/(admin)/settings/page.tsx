import { AppDashboardSection, AppSectionHeader } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { AttendanceSettingsClient } from "@/systems/attendance/components/AttendanceSettingsClient";
import { attendanceSectionRadiusClass } from "@/systems/attendance/lib/ui-tokens";

export default function AttendanceSettingsPage() {
  return (
    <AppDashboardSection tone="violet" className={cn(attendanceSectionRadiusClass, "space-y-4")}>
      <AppSectionHeader
        tone="violet"
        title="ตั้งค่าเช็คอิน"
        description="จุดเช็ค · กะ · พิกัด · สแกนใบหน้า · Device API"
      />
      <AttendanceSettingsClient />
    </AppDashboardSection>
  );
}
