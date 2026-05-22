import { redirect } from "next/navigation";

/** รวมเข้าเมนูการเงิน — แท็บต้นทุน / รายจ่าย */
export default function MassageCostsRedirectPage() {
  redirect("/dashboard/massage/finance?tab=costs");
}
