import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-container";
import { getSession } from "@/lib/auth/session";
import { MqttHealthClient } from "@/systems/admin/components/MqttHealthClient";

export const metadata: Metadata = {
  title: "สถานะ MQTT | MAWELL Buffet",
};

export default async function AdminMqttPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <PageHeader
        title="สถานะ MQTT"
        description="สำหรับแอดมินตรวจสอบว่า backend ฟัง MQTT อยู่หรือไม่ และกำลังฟัง topic อะไร"
      />
      <MqttHealthClient />
    </div>
  );
}

