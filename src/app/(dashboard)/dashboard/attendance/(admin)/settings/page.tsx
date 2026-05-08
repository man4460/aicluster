import { AppDashboardSection, AppSectionHeader } from "@/components/app-templates";
import { AttendanceSettingsClient } from "@/systems/attendance/components/AttendanceSettingsClient";

export default function AttendanceSettingsPage() {
  return (
    <AppDashboardSection tone="violet">
      <AppSectionHeader
        tone="violet"
        title="ตั้งค่าเช็คอิน"
        description="หนึ่งจุดเช็ค สูงสุด 5 กะ — กำหนดพิกัดและรัศมีสำหรับเช็คอินตามตำแหน่ง ลิงก์และ QR ใช้ ?loc= คงที่เมื่อแก้ชื่อจุด"
      />
      <AttendanceSettingsClient />
    </AppDashboardSection>
  );
}