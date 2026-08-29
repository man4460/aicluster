import { redirect } from "next/navigation";

/** ย้ายไปการจัดการ → แพ็กเกจ / สมาชิก */
export default async function MassagePackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  if (sp.tab === "members") {
    redirect("/dashboard/massage/manage?tab=members");
  }
  redirect("/dashboard/massage/manage?tab=packages");
}
