import { redirect } from "next/navigation";

export default function MassageBookingsPage() {
  redirect("/dashboard/massage?tab=queue");
}
