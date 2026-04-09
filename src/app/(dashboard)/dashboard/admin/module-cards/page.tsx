import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-container";
import { getSession } from "@/lib/auth/session";
import { ModuleCardImagesAdmin } from "@/systems/admin/components/ModuleCardImagesAdmin";

export const metadata: Metadata = {
  title: "รูปการ์ดระบบ | MAWELL Buffet",
};

export default async function AdminModuleCardsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <PageHeader
        title="รูปการ์ดระบบ"
        description="อัปโหลดภาพประกอบการ์ดแต่ละโมดูล — แสดงบนการ์ดแดชบอร์ด หน้าระบบทั้งหมด และแผนผังระบบ"
      />
      <ModuleCardImagesAdmin />
    </div>
  );
}
