import { redirect } from "next/navigation";
import { VILLAGE_FINANCE_HREF } from "@/systems/village/village-nav";

/** รายปีรวมเข้าหน้าการเงินแล้ว — กรอง «ปีนี้» + เปิดกราฟ */
export default function VillageAnnualPage() {
  redirect(`${VILLAGE_FINANCE_HREF}?range=YEAR`);
}
