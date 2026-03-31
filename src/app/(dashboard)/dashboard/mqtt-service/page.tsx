import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-container";
import { getSession } from "@/lib/auth/session";
import { requireModulePage } from "@/lib/modules/guard";
import { MQTT_SERVICE_MODULE_SLUG } from "@/lib/modules/config";
import { MqttServiceClient } from "@/systems/mqtt/MqttServiceClient";

export default async function MqttServicePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  await requireModulePage(MQTT_SERVICE_MODULE_SLUG);

  return (
    <div className="space-y-6">
      <PageHeader
        title="ระบบบริการ MQTT"
        description="กลุ่ม 1 (Basic): จัดการ credentials, ACL, และสถานะการเชื่อมต่ออุปกรณ์"
      />
      <MqttServiceClient />
    </div>
  );
}
