import { redirect, unstable_rethrow } from "next/navigation";
import { DashboardDataLoadError } from "@/components/dashboard/DashboardDataLoadError";
import { getSession } from "@/lib/auth/session";
import { APPOINTMENT_QUEUE_MODULE_SLUG } from "@/lib/modules/config";
import { getActiveTrialBanner } from "@/lib/modules/trial-store";
import { AppointmentQueueModuleShell } from "@/systems/appointment-queue/components/AppointmentQueueModuleShell";
import { requireAppointmentQueueSection } from "@/systems/appointment-queue/lib/guard";

export default async function AppointmentQueueLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAppointmentQueueSection();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[appointment-queue layout]", e);
    return (
      <DashboardDataLoadError message="โหลดโมดูลจองคิวไม่สำเร็จ — ตรวจสอบฐานข้อมูลและสิทธิ์บัญชี" />
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  try {
    await getActiveTrialBanner(session.sub, APPOINTMENT_QUEUE_MODULE_SLUG);
  } catch (e) {
    unstable_rethrow(e);
  }

  return <AppointmentQueueModuleShell>{children}</AppointmentQueueModuleShell>;
}
