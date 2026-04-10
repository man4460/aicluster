import { DormPageStack, DormPanelCard } from "@/systems/dormitory/components/DormPageChrome";
import { DormSettingsClient } from "@/systems/dormitory/components/DormSettingsClient";

export default function DormitorySettingsPage() {
  return (
    <DormPageStack>
      <DormPanelCard
        title="ตั้งค่า"
        description="บิล ใบเสร็จ และข้อมูลร้าน — ตั้งค่าหลักอยู่ที่โปรไฟล์ส่วนกลาง"
      >
        <DormSettingsClient />
      </DormPanelCard>
    </DormPageStack>
  );
}
