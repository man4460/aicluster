import { redirect } from "next/navigation";

/** ย้ายไปการจัดการ → ช่าง / แพ็กเกจ / สมาชิก */
export default async function BarberPackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  if (sp.tab === "members") {
    redirect("/dashboard/barber/manage?tab=members");
  }
  if (sp.tab === "stylists") {
    redirect("/dashboard/barber/manage?tab=stylists");
  }
  redirect("/dashboard/barber/manage?tab=packages");
}
