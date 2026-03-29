import type { ReactNode } from "react";

/** หน้าชำระ/แนบสลิปสาธารณะ — ไม่ใช้เลย์เอาต์แดชบอร์ด */
export default function PayLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 antialiased">
      <main>{children}</main>
    </div>
  );
}
