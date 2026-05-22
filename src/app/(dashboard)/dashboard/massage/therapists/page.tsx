import { redirect } from "next/navigation";

export default function MassageTherapistsPage() {
  redirect("/dashboard/massage?tab=therapists");
}
