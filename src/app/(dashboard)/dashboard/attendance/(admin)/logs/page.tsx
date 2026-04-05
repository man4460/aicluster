import { AttendanceLogsClient } from "@/systems/attendance/components/AttendanceLogsClient";
import { HomeFinancePageSection, HomeFinanceSectionHeader } from "@/systems/home-finance/components/HomeFinanceUi";

export default function AttendanceLogsPage() {
  return (
    <HomeFinancePageSection>
      <HomeFinanceSectionHeader
        title="รายงานเช็คอิน"
        description="ค้นหาตามช่วงวันที่หรือคำค้น — ส่งออก CSV"
      />
      <AttendanceLogsClient />
    </HomeFinancePageSection>
  );
}