import { redirect } from "next/navigation";

export const metadata = {
  title: "ยอดขาย | POS ร้านอาหาร",
};

export default function BuildingPosSalesPage() {
  redirect("/dashboard/building-pos?tab=finance&fin=sales");
}
