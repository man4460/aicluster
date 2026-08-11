"use client";

import { BarberBookingsClient } from "@/systems/barber/components/BarberBookingsClient";

/** คิววันนี้บนภาพรวมแดชบอร์ด — เช็กอิน (หักแพ็ก/รับชำระ) + เพิ่มคิว + อัปเดตสถานะ */
export function BarberTodayBookings({ initialDateKey }: { initialDateKey: string }) {
  return (
    <BarberBookingsClient
      initialDateKey={initialDateKey}
      showDashboardBackLink={false}
      todayOverview
    />
  );
}
