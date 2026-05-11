import type { Metadata } from "next";
import { InventoryWarehousesClient } from "@/systems/inventory/components/InventoryWarehousesClient";

export const metadata: Metadata = {
  title: "คลัง · หมวด · คลังสต๊อก",
};

export default function InventoryWarehousesPage() {
  return <InventoryWarehousesClient />;
}
