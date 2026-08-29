import { redirect } from "next/navigation";

/** ย้ายไปการจัดการ → สมาชิก */
export default function MassagePurchasesPage() {
  redirect("/dashboard/massage/manage?tab=members");
}
