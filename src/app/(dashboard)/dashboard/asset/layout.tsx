import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { ASSET_MODULE_SLUG } from "@/lib/modules/config";
import { getActiveTrialBanner } from "@/lib/modules/trial-store";
import { AssetShell } from "@/systems/asset/components/AssetShell";
import { requireAssetSection } from "@/systems/asset/lib/guard";

export default async function AssetLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAssetSection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[asset layout] requireAssetSection", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูลบริหารทรัพย์สินไม่สำเร็จ — ตรวจสอบการเชื่อมต่อฐานข้อมูลและสิทธิ์บัญชี" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  try {
    await getActiveTrialBanner(session.sub, ASSET_MODULE_SLUG);
  } catch (e) {
    unstable_rethrow(e);
    console.error("[asset layout] getActiveTrialBanner", e);
  }

  return <AssetShell>{children}</AssetShell>;
}
