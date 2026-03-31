import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-container";
import {
  ATTENDANCE_MODULE_SLUG,
  BARBER_MODULE_SLUG,
  BUILDING_POS_MODULE_SLUG,
  DORMITORY_MODULE_SLUG,
  HOME_FINANCE_BASIC_MODULE_SLUG,
  MQTT_SERVICE_MODULE_SLUG,
  MODULE_GROUP_TIER_NAME,
} from "@/lib/modules/config";
import { requireModulePage } from "@/lib/modules/guard";

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
    redirect("/dashboard/mqtt-service");
  }
  if (slug === BUILDING_POS_MODULE_SLUG) {
    redirect("/dashboard/building-pos");
  }
  const { module: mod } = await requireModulePage(slug);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={mod.title}
        description={mod.description ?? undefined}
        action={
          <Link
            href="/dashboard"
            className="text-sm font-medium text-[#0000BF] hover:underline"
          >
            ← กลับแดชบอร์ด
          </Link>
        }
      />
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          กลุ่ม {mod.groupId}
          {MODULE_GROUP_TIER_NAME[mod.groupId]
            ? ` (${MODULE_GROUP_TIER_NAME[mod.groupId]})`
            : ""}
        </p>
        {mod.description ? (
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{mod.description}</p>
        ) : null}
        <p className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          พื้นที่เนื้อหาโมดูลจริง — เชื่อมฟีเจอร์ของระบบที่นี่ได้ภายหลัง
        </p>
      </div>
    </div>
  );
}
