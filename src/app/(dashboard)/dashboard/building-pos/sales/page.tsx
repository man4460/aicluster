import { BuildingPosSalesHistoryPageClient } from "@/systems/building-pos/BuildingPosSalesHistoryPageClient";

export const metadata = {
  title: "ยอดขาย | POS ร้านอาหาร",
};

export default function BuildingPosSalesPage() {
  return <BuildingPosSalesHistoryPageClient />;
}
