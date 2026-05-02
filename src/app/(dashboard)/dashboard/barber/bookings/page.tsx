import { redirect } from "next/navigation";

export default function BarberBookingsPage() {
  redirect("/dashboard/barber?tab=queue");
}
