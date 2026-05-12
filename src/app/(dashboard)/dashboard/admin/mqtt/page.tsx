import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { MqttHealthClient } from "@/systems/admin/components/MqttHealthClient";

export const metadata: Metadata = {
  title: "สถานะ MQTT | MAWELL Buffet",
};

export default async function AdminMqttPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  return <MqttHealthClient />;
}
