import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-container";
import { getSession } from "@/lib/auth/session";
import { ModuleCooldownAdminClient } from "@/systems/admin/components/ModuleCooldownAdminClient";

export const metadata: Metadata = {
  title: "ปลดล็อค Subscribe หลัง Unsubscribe | MAWELL Buffet",
};

export default async function AdminModuleCooldownsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <PageHeader
        title="ปลดล็อค Subscribe (หลัง Unsubscribe)"
        description="แอดมินสามารถลบระยะรอ 1 เดือน เพื่อให้ผู้ใช้กด Subscribe ระบบเดิมได้ทันที"
      />
      <ModuleCooldownAdminClient />
    </div>
  );
}
