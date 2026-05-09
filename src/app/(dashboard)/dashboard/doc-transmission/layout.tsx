import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { DOC_TRANSMISSION_MODULE_SLUG } from "@/lib/modules/config";
import { getActiveTrialBanner } from "@/lib/modules/trial-store";
import { DocShell } from "@/systems/doc-transmission/components/DocShell";
import { requireDocTransmissionSection } from "@/systems/doc-transmission/lib/guard";

export default async function DocTransmissionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireDocTransmissionSection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[doc-transmission layout] requireDocTransmissionSection", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูลสารบรรณดิจิทัลไม่สำเร็จ — ตรวจสอบการเชื่อมต่อฐานข้อมูลและสิทธิ์บัญชี" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  try {
    await getActiveTrialBanner(session.sub, DOC_TRANSMISSION_MODULE_SLUG);
  } catch (e) {
    unstable_rethrow(e);
    console.error("[doc-transmission layout] getActiveTrialBanner", e);
  }

  return <DocShell>{children}</DocShell>;
}
