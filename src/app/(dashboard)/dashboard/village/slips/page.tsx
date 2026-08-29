import { redirect } from "next/navigation";

/** สลิปรวมอยู่ในการ์ดบิลค่าส่วนกลางแล้ว */
export default function VillageSlipsPage() {
  redirect("/dashboard/village/fees");
}
