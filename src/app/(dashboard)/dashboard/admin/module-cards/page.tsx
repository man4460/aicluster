import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ModuleCardImagesAdmin } from "@/systems/admin/components/ModuleCardImagesAdmin";

export const metadata: Metadata = {
  title: "รูปการ์ดระบบ | MAWELL PLATFORM",
};

export default async function AdminModuleCardsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  return <ModuleCardImagesAdmin />;
}
