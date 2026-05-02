import { redirect } from "next/navigation";

/** รวมเข้าเมนูการเงิน — แท็บยอดขาย */
export default function BarberHistoryRedirectPage() {
  redirect("/dashboard/barber/finance");
}
