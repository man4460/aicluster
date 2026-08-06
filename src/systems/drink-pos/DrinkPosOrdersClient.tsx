"use client";

import { DrinkPosOrderBoardClient } from "@/systems/drink-pos/components/DrinkPosOrderBoardClient";
import { drinkPosContentStackClass } from "@/systems/drink-pos/lib/ui-tokens";

/** กระดานคิวออเดอร์ — ลิงก์แผนกอยู่ที่เมนู «ลิงก์» (สมาชิก) */
export function DrinkPosOrdersClient() {
  return (
    <div className={drinkPosContentStackClass}>
      <DrinkPosOrderBoardClient mode="dashboard" />
    </div>
  );
}
