import { PageHeader } from "@/components/ui/page-container";
import { AttendanceStaffClient } from "@/systems/attendance/components/AttendanceStaffClient";

export default function AttendanceStaffPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="พนักงาน (Sub-user)"
        description="สร้างบัญชีให้ล็อกอินแพลตฟอร์ม — ใช้สิทธิ์และโทเคนของเจ้าของ ไม่ต้องเติมโทเคนเอง"
      />
      <AttendanceStaffClient />
    </div>
  );
}
