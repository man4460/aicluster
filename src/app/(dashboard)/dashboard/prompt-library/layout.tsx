import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { PROMPT_LIBRARY_MODULE_SLUG } from "@/lib/modules/config";
import { getActiveTrialBanner } from "@/lib/modules/trial-store";
import { PromptShell } from "@/systems/prompt-library/components/PromptShell";
import { requirePromptLibrarySection } from "@/systems/prompt-library/lib/guard";

export default async function PromptLibraryLayout({ children }: { children: React.ReactNode }) {
  try {
    await requirePromptLibrarySection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[prompt-library layout]", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูลคลังคำสั่ง AI ไม่สำเร็จ — ตรวจสอบการเชื่อมต่อและสิทธิ์โมดูล" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  try {
    await getActiveTrialBanner(session.sub, PROMPT_LIBRARY_MODULE_SLUG);
  } catch (e) {
    unstable_rethrow(e);
    console.error("[prompt-library layout] getActiveTrialBanner", e);
  }

  return <PromptShell>{children}</PromptShell>;
}
