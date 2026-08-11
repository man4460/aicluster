import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { VaultShell } from "@/systems/vault/components/VaultShell";
import { requireVaultPage } from "@/systems/vault/lib/guard";

export default async function VaultLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireVaultPage();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[vault layout]", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูลคลังรหัสผ่านไม่สำเร็จ — ตรวจสอบการเชื่อมต่อและสิทธิ์โมดูล" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  return <VaultShell>{children}</VaultShell>;
}
