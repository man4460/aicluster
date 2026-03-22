import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { UsersAdmin } from "@/components/admin/UsersAdmin";

export const metadata: Metadata = {
  title: "จัดการผู้ใช้ | MAWELL Buffet",
};

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">จัดการผู้ใช้</h1>
        <p className="mt-1 text-sm text-slate-600">สร้าง ดู แก้ไข และลบข้อมูลผู้ใช้ในฐานข้อมูล</p>
      </div>
      <UsersAdmin />
    </div>
  );
}
