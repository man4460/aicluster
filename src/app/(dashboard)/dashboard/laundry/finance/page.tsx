import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { LaundryFinancePageClient } from "@/systems/laundry/components/LaundryFinancePageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "การเงิน · รับฝากซักผ้า | MAWELL",
};

export default async function LaundryFinancePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const baseUrl = await getRequestBaseUrl();
  return <LaundryFinancePageClient baseUrl={baseUrl} />;
}
