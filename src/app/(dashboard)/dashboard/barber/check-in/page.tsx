import { redirect } from "next/navigation";

export default function BarberCheckInPage() {
  redirect("/dashboard/barber?tab=checkin");
}
