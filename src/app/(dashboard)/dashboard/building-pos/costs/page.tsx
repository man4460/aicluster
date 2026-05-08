import { redirect } from "next/navigation";

export const metadata = {
  title: "ต้นทุน / รายจ่าย | POS ร้านอาหาร",
};

export default function BuildingPosCostsPage() {
  redirect("/dashboard/building-pos?tab=finance&fin=costs");
}
