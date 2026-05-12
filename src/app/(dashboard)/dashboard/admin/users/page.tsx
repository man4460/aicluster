import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UsersAdmin } from "@/systems/admin/components/UsersAdmin";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "จัดการผู้ใช้ | MAWELL Buffet",
};

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  return <UsersAdmin />;
}
