import { PageHeader } from "@/components/ui/page-container";
import { DormSettingsClient } from "@/systems/dormitory/components/DormSettingsClient";

export default function DormitorySettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="ตั้งค่าหอพัก"
        description="ใช้หน้านี้เป็นทางลัดไปโปรไฟล์ส่วนกลางสำหรับตั้งค่าบิล ใบเสร็จ และข้อมูลบริษัท/ร้าน"
      />
      <DormSettingsClient />
    </div>
  );
}
