import { redirect } from "next/navigation";

export default function BarberStylistsPage() {
  redirect("/dashboard/barber?tab=stylists");
}
