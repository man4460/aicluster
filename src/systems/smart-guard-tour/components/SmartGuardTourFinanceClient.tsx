"use client";

import { AppEmptyState } from "@/components/app-templates";
import { SmartGuardTourPageSubNav } from "@/systems/smart-guard-tour/components/SmartGuardTourPageSubNav";
import type { SmartGuardShopDto } from "@/systems/smart-guard-tour/lib/mappers";
import {
  smartGuardTourPageTitleIcon,
  smartGuardTourPageTitleTone,
} from "@/systems/smart-guard-tour/lib/page-menu-icons";
import { smartGuardTourPageStackClass } from "@/systems/smart-guard-tour/lib/ui-tokens";

export function SmartGuardTourFinanceClient({ initialShop }: { initialShop: SmartGuardShopDto }) {
  return (
    <div className={smartGuardTourPageStackClass}>
      <SmartGuardTourPageSubNav
        title="การเงิน"
        titleIcon={smartGuardTourPageTitleIcon("finance")}
        titleTone={smartGuardTourPageTitleTone("finance")}
      >
        <p className="mb-3 text-xs font-semibold text-[#66638c]">{initialShop.displayName}</p>
        <AppEmptyState>
          การเงิน — เฟส E
          <span className="mt-1 block text-xs">
            หมวดเริ่มต้นถูกสร้างตอนเปิดร้านแล้ว: รายรับ «ค่าบริการรักษาความปลอดภัย» · รายจ่าย
            «ค่าแรง รปภ.» · «ค่า OT / เบี้ยขยัน» · «อุปกรณ์สายตรวจ» · «อื่นๆ» — แผงรายรับ/รายจ่าย
            กราฟ และสลิปจะเปิดในเฟส E
          </span>
        </AppEmptyState>
      </SmartGuardTourPageSubNav>
    </div>
  );
}
