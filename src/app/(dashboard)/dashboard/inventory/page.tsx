import type { Metadata } from "next";
import { InventoryDashboardClient } from "@/systems/inventory/components/InventoryDashboardClient";

export const metadata: Metadata = {
  title: "คลัง · สต๊อกสินค้า",
};

export default function InventoryDashboardPage() {
  return <InventoryDashboardClient />;
}
