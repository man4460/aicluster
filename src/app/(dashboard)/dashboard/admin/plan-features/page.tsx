import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { PlanFeaturesAdminClient } from "@/systems/admin/components/PlanFeaturesAdminClient";

export const metadata: Metadata = {
  title: "เงื่อนไขแพ็กเกจ | ศูนย์แอดมิน",
};

export default async function AdminPlanFeaturesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  return <PlanFeaturesAdminClient />;
}
