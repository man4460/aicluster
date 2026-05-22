import { redirect } from "next/navigation";

export default function MassagePurchasesPage() {
  redirect("/dashboard/massage/packages?tab=members");
}
