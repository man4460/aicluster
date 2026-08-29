import { redirect } from "next/navigation";

/** ย้ายไปการจัดการ → หมอนวด */
export default function MassageTherapistsPage() {
  redirect("/dashboard/massage/manage?tab=therapists");
}
