import { redirect } from "next/navigation";

/** รวมเข้าเมนูการเงิน — แท็บต้นทุน / รายจ่าย */
export default function BarberCostsRedirectPage() {
  redirect("/dashboard/barber/finance?tab=costs");
}
