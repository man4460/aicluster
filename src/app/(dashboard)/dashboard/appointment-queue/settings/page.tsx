import { redirect } from "next/navigation";

export default function AppointmentQueueSettingsRedirect() {
  redirect("/dashboard/appointment-queue?tab=settings");
}
