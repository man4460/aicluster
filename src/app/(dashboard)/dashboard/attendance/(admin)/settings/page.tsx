import { AttendanceSettingsClient } from "@/systems/attendance/components/AttendanceSettingsClient";
import { HomeFinancePageSection, HomeFinanceSectionHeader } from "@/systems/home-finance/components/HomeFinanceUi";

export default function AttendanceSettingsPage() {
  return (
    <HomeFinancePageSection>
      <HomeFinanceSectionHeader
        title="ตั้งค่าเช็คอิน"
        description="หนึ่งจุดเช็ค สูงสุด 5 กะ — กำหนดพิกัดและรัศมีสำหรับเช็คอินตามตำแหน่ง ลิงก์และ QR ใช้ ?loc= คงที่เมื่อแก้ชื่อจุด"
      />
      <AttendanceSettingsClient />
    </HomeFinancePageSection>
  );
}