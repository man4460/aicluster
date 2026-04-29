import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-container";
import { appDashboardBrandGradientFillClass, appTemplateOutlineButtonClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  ATTENDANCE_MODULE_SLUG,
  BARBER_MODULE_SLUG,
  BUILDING_POS_MODULE_SLUG,
  CAR_WASH_MODULE_SLUG,
  DORMITORY_MODULE_SLUG,
  HOME_FINANCE_BASIC_MODULE_SLUG,
  LAUNDRY_MODULE_SLUG,
  MQTT_SERVICE_MODULE_SLUG,
  PARKING_MODULE_SLUG,
  VILLAGE_MODULE_SLUG,
  MODULE_GROUP_TIER_NAME,
  displayAppModuleTitle,
} from "@/lib/modules/config";
import { requireModulePage } from "@/lib/modules/guard";
import { isMqttServiceModuleEnabled } from "@/lib/modules/mqtt-feature";

type Props = { params: Promise<{ slug: string }> };

export default async function ModuleEntryPage({ params }: Props) {
  const { slug } = await params;
  if (slug === DORMITORY_MODULE_SLUG) {
    redirect("/dashboard/dormitory");
  }
  if (slug === BARBER_MODULE_SLUG) {
    redirect("/dashboard/barber");
  }
  if (slug === ATTENDANCE_MODULE_SLUG) {
    redirect("/dashboard/attendance");
  }
  if (slug === HOME_FINANCE_BASIC_MODULE_SLUG) {
    redirect("/dashboard/home-finance");
  }
  if (slug === MQTT_SERVICE_MODULE_SLUG) {
    if (!isMqttServiceModuleEnabled()) redirect("/dashboard/modules");
    redirect("/dashboard/mqtt-service");
  }
  if (slug === BUILDING_POS_MODULE_SLUG) {
    redirect("/dashboard/building-pos");
  }
  if (slug === CAR_WASH_MODULE_SLUG) {
    redirect("/dashboard/car-wash");
  }
  if (slug === VILLAGE_MODULE_SLUG) {
    redirect("/dashboard/village");
  }
  if (slug === LAUNDRY_MODULE_SLUG) {
    redirect("/dashboard/laundry");
  }
  if (slug === PARKING_MODULE_SLUG) {
    redirect("/dashboard/parking");
  }
  const { module: mod } = await requireModulePage(slug);

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      <PageHeader
        title={displayAppModuleTitle(mod.slug, mod.title)}
        description={mod.description ?? undefined}
        className="rounded-3xl border border-white/80 bg-gradient-to-r from-white via-[#f8f7ff] to-[#fff3fb] p-4 shadow-sm sm:p-6"
        action={
          <Link
            href="/dashboard"
            className={cn(
              appTemplateOutlineButtonClass,
              "inline-flex min-h-[40px] items-center rounded-2xl border-[#0000BF]/20 bg-white/85 px-3 text-xs font-semibold text-[#0000BF] hover:border-[#0000BF]/35 hover:bg-white sm:min-h-[42px] sm:px-4 sm:text-sm",
            )}
            aria-label="กลับแดชบอร์ด"
          >
            <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">กลับแดชบอร์ด</span>
          </Link>
        }
      />
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:p-6">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
          กลุ่ม {mod.groupId}
          {MODULE_GROUP_TIER_NAME[mod.groupId]
            ? ` (${MODULE_GROUP_TIER_NAME[mod.groupId]})`
            : ""}
        </p>
        {mod.description ? (
          <p className="mt-2.5 text-xs leading-relaxed text-slate-600 sm:mt-3 sm:text-sm">{mod.description}</p>
        ) : null}
        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600 sm:mt-6 sm:px-4 sm:py-3 sm:text-sm">
          พื้นที่เนื้อหาโมดูลจริง — เชื่อมฟีเจอร์ของระบบที่นี่ได้ภายหลัง
        </p>
        <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
          <Link
            href="/dashboard/modules"
            className={cn(
              appTemplateOutlineButtonClass,
              "inline-flex min-h-[40px] items-center rounded-xl px-3 text-xs font-semibold sm:min-h-[42px] sm:text-sm",
            )}
          >
            <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">ระบบทั้งหมด</span>
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              "inline-flex min-h-[40px] items-center rounded-xl px-3 text-xs font-semibold text-white shadow-sm sm:min-h-[42px] sm:text-sm",
              appDashboardBrandGradientFillClass,
            )}
          >
            <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 10l9-7 9 7M5 9v11h14V9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">หน้าแดชบอร์ด</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
