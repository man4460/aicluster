import type { Metadata } from "next";
import { InventoryItemsClient } from "@/systems/inventory/components/InventoryItemsClient";

export const metadata: Metadata = {
  title: "สินค้า · คลังสต๊อก",
};

export default function InventoryItemsPage() {
  return <InventoryItemsClient />;
}
