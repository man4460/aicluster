import { redirect } from "next/navigation";

/** รวมเข้าเมนูการเงิน — แท็บยอดขาย */
export default function MassageHistoryRedirectPage() {
  redirect("/dashboard/massage/finance");
}
