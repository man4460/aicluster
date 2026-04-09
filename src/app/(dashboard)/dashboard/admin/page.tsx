import Link from "next/link";
import { ADMIN_HUB_NAV_ITEMS } from "@/lib/admin-hub-nav";

export default function AdminHubHomePage() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#66638c]">เลือกหัวข้อจากการ์ดด้านล่าง หรือจากแถบเมนูด้านบน</p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ADMIN_HUB_NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="app-surface-strong flex min-h-[4.5rem] items-center rounded-xl border border-[#e8e6f4]/60 px-4 py-3 text-sm font-semibold text-[#2e2a58] shadow-sm transition hover:-translate-y-0.5 hover:border-[#4d47b6]/25 hover:text-[#4d47b6]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
