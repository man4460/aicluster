import type { ModuleOwnerAccountDto } from "@/lib/module-shop/owner-account";
import { AppDashboardSection } from "./AppDashboardSection";
import { AppSectionHeader } from "./AppSectionHeader";
import { appDashboardSectionSlateClass } from "./dashboard-tokens";

export function AppModuleOwnerAccountSection({ account }: { account: ModuleOwnerAccountDto }) {
  return (
    <AppDashboardSection className={appDashboardSectionSlateClass}>
      <AppSectionHeader
        title="โปรไฟล์เจ้าของบัญชี"
        description="ข้อมูลบัญชี MAWELL ที่สมัครใช้บริการ — อ่านอย่างเดียว"
      />
      <dl className="grid gap-3 text-left sm:grid-cols-2">
        <div className="rounded-xl border border-white/60 bg-white/50 px-4 py-3">
          <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">ชื่อเจ้าของบัญชี</dt>
          <dd className="mt-1 text-sm font-bold text-[#1e1b4b]">{account.ownerName}</dd>
        </div>
        <div className="rounded-xl border border-white/60 bg-white/50 px-4 py-3">
          <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">อีเมลที่สมัคร</dt>
          <dd className="mt-1 break-all text-sm font-bold text-[#1e1b4b]">{account.ownerEmail}</dd>
        </div>
      </dl>
    </AppDashboardSection>
  );
}
