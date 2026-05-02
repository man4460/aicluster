import { redirect } from "next/navigation";

export default function BarberPurchasesPage() {
  redirect("/dashboard/barber/packages?tab=members");
}
