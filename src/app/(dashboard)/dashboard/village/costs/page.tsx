import { redirect } from "next/navigation";

/** ต้นทุน / รายจ่ายย้ายไปเป็นแท็บ «รายจ่าย» ในหน้าการเงิน */
export default function VillageCostsPage() {
  redirect("/dashboard/village/finance?panel=expenses");
}
