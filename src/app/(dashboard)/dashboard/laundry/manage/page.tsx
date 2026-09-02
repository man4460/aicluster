import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LaundryManageHubClient } from "@/systems/laundry/components/LaundryManageHubClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "การจัดการ · รับฝากซักผ้า | MAWELL",
};

export default async function LaundryManagePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <LaundryManageHubClient />;
}
