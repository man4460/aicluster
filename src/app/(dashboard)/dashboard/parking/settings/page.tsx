import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-container";
import { parkingBtnSecondary, parkingCard } from "@/systems/parking/parking-ui";
import { ParkingSiteSettingsForm } from "@/systems/parking/components/ParkingSiteSettingsForm";
import { requireParkingPage } from "@/systems/parking/lib/parking-page-auth";

export const metadata: Metadata = {
  title: "ตั้งค่าลานจอด | ระบบเช่าที่จอดรถ",
};

export default async function ParkingSettingsPage() {
  const { site } = await requireParkingPage();

  return (
    <div className="space-y-8">
      <PageHeader
        title="ตั้งค่าลานจอด"
        description="ชื่อลาน โหมดคิดเงิน (รายชั่วโมงหรือเหมาวัน) และราคา — ใช้ตอนเช็คอินเป็นต้นไป"
        action={
          <Link href="/dashboard/parking" className={parkingBtnSecondary}>
            ← ผังที่จอด
          </Link>
        }
      />
      <section className={`${parkingCard} p-5`}>
        <ParkingSiteSettingsForm
          initialName={site.name}
          initialMode={site.pricingMode}
          initialHourly={site.hourlyRateBaht != null ? Number(site.hourlyRateBaht) : null}
          initialDaily={site.dailyRateBaht != null ? Number(site.dailyRateBaht) : null}
        />
      </section>
    </div>
  );
}
