import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ModuleCooldownAdminClient } from "@/systems/admin/components/ModuleCooldownAdminClient";

export const metadata: Metadata = {
  title: "ปลดล็อค Subscribe หลัง Unsubscribe | MAWELL Buffet",
};

export default async function AdminModuleCooldownsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  return <ModuleCooldownAdminClient />;
}
