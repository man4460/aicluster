import type { Metadata } from "next";
import { InventoryMovementsClient } from "@/systems/inventory/components/InventoryMovementsClient";

export const metadata: Metadata = {
  title: "การเคลื่อนไหวสต๊อก",
};

export default function InventoryMovementsPage() {
  return <InventoryMovementsClient />;
}
