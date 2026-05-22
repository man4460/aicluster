import { redirect } from "next/navigation";

export default function AppointmentQueueScheduleRedirect() {
  redirect("/dashboard/appointment-queue?tab=schedule");
}
