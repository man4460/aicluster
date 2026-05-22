"use client";

import { useEffect, useState } from "react";
import { AppDashboardSection, AppSectionHeader } from "@/components/app-templates";
import { ecommerceListRowCardClass } from "@/systems/ecommerce-store/components/ecommerce-ui-tokens";

type Customer = {
  id: string;
  name: string;
  phone: string;
  totalSpendBaht: string;
  orderCount: number;
  lastOrderAt: string | null;
};

export function EcommerceCrmClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    void fetch("/api/ecommerce-store/session/customers")
      .then((r) => r.json())
      .then((j) => setCustomers(j.customers ?? []));
  }, []);

  return (
    <AppDashboardSection className="appDashboardSectionVioletClass">
      <AppSectionHeader title="ลูกค้า (CRM)" description="ยอดซื้อสะสมต่อเบอร์โทร" />
      <ul className="space-y-2">
        {customers.map((c) => (
          <li
            key={c.id}
            className={ecommerceListRowCardClass}
          >
            <div>
              <p className="font-bold text-[#1e1b4b]">{c.name}</p>
              <p className="text-xs text-[#66638c]">{c.phone}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-black text-[#4d47b6]">
                ฿{Number(c.totalSpendBaht).toLocaleString("th-TH")}
              </p>
              <p className="text-xs text-[#8b87b8]">{c.orderCount} ออเดอร์</p>
            </div>
          </li>
        ))}
        {customers.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#66638c]">ยังไม่มีลูกค้า</p>
        ) : null}
      </ul>
    </AppDashboardSection>
  );
}
