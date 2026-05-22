import { redirect } from "next/navigation";

export default function AppointmentQueueServicesRedirect() {
  redirect("/dashboard/appointment-queue?tab=services");
}
