import { PageHeader } from "@/components/ui/page-container";
import { AttendanceSettingsClient } from "@/systems/attendance/components/AttendanceSettingsClient";

export default function AttendanceSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="ตั้งค่าเช็คชื่อ"
        description="หนึ่งจุดเช็ค สูงสุด 5 กะ — กำหนดพิกัดและรัศมีสำหรับเช็คอินตามตำแหน่ง ลิงก์และ QR ใช้ ?loc= คงที่เมื่อแก้ชื่อจุด"
      />
      <AttendanceSettingsClient />
    </div>
  );
}
