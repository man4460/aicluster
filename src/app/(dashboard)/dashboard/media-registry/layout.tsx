import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { MEDIA_REGISTRY_MODULE_SLUG } from "@/lib/modules/config";
import { getActiveTrialBanner } from "@/lib/modules/trial-store";
import { MediaRegistryShell } from "@/systems/media-registry/components/MediaRegistryShell";
import { requireMediaRegistrySection } from "@/systems/media-registry/lib/guard";

export default async function MediaRegistryLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireMediaRegistrySection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[media-registry layout]", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูลทะเบียนคุมสื่อไม่สำเร็จ — ตรวจสอบการเชื่อมต่อและสิทธิ์โมดูล" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  try {
    await getActiveTrialBanner(session.sub, MEDIA_REGISTRY_MODULE_SLUG);
  } catch (e) {
    unstable_rethrow(e);
    console.error("[media-registry layout] getActiveTrialBanner", e);
  }

  return <MediaRegistryShell>{children}</MediaRegistryShell>;
}
