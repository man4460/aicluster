import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { InventoryShell } from "@/systems/inventory/components/InventoryShell";
import { requireInventorySection } from "@/systems/inventory/lib/guard";

export default async function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireInventorySection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[inventory layout] requireInventorySection", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูลคลังสต๊อกสินค้าไม่สำเร็จ — ตรวจสอบการเชื่อมต่อและสิทธิ์โมดูล" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  return <InventoryShell>{children}</InventoryShell>;
}
