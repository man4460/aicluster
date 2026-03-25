import type { Metadata } from "next";
import { UsersAdmin } from "@/systems/admin/components/UsersAdmin";
import { PageHeader } from "@/components/ui/page-container";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "จัดการผู้ใช้ | MAWELL Buffet",
};

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <PageHeader
        title="จัดการผู้ใช้"
        description="สร้าง ดู แก้ไข และลบข้อมูลผู้ใช้ในฐานข้อมูล"
      />
      <UsersAdmin />
    </div>
  );
}
