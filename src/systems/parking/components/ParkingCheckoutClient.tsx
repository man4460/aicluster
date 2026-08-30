"use client";

import { useCallback, useEffect, useState } from "react";
import { AppEmptyState } from "@/components/app-templates";
import { formatBangkokDateTimeLong } from "@/lib/time/bangkok";
import { ParkingCheckoutButton } from "@/systems/parking/components/ParkingCheckoutButton";
import { ParkingPageStack, ParkingPanelCard } from "@/systems/parking/components/ParkingPageChrome";
import { useParkingApiFetch } from "@/systems/parking/lib/staff-api-fetch";
import { cn } from "@/lib/cn";
import { parkingValetInnerCardClass } from "@/systems/parking/parking-ui-tokens";

type ActiveSession = {
  id: number;
  checkInAt: string;
  licensePlate: string;
  customerName: string | null;
  spotCode: string;
  zoneLabel: string | null;
  currentAmountDueBaht: number | null;
};

function durationLabel(checkInAt: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(checkInAt).getTime()) / 60_000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  return [days ? `${days} วัน` : "", hours ? `${hours} ชม.` : "", `${mins} นาที`].filter(Boolean).join(" ");
}

export function ParkingCheckoutClient({ refreshNonce = 0 }: { refreshNonce?: number }) {
  const apiFetch = useParkingApiFetch();
  const [rows, setRows] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/parking/sessions?status=ACTIVE");
      const data = (await response.json().catch(() => ({}))) as { sessions?: ActiveSession[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "โหลดรายการไม่สำเร็จ");
      setRows(data.sessions ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "โหลดรายการไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void load();
  }, [load, refreshNonce]);

  return (
    <ParkingPageStack>
      <ParkingPanelCard title="เช็คเอาต์" description="รถที่กำลังจอด · รับชำระ · พิมพ์ใบเสร็จ">
        {error ? <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : rows.length === 0 ? (
          <AppEmptyState tone="glass">ไม่มีรถรอเช็คเอาต์</AppEmptyState>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.id} className={cn(parkingValetInnerCardClass, "flex flex-wrap items-center justify-between gap-3")}>
                <div className="min-w-0">
                  <p className="text-lg font-black tabular-nums text-[#1e1b4b]">{row.licensePlate}</p>
                  <p className="text-xs font-semibold text-[#66638c]">
                    ช่อง {row.spotCode}{row.zoneLabel ? ` · ${row.zoneLabel}` : ""}{row.customerName ? ` · ${row.customerName}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-[#5f5a8a]">
                    เข้า {formatBangkokDateTimeLong(row.checkInAt)} · {durationLabel(row.checkInAt)}
                  </p>
                  <p className="mt-1 text-sm font-black text-emerald-700">
                    ยอดปัจจุบัน ฿{Number(row.currentAmountDueBaht ?? 0).toLocaleString("th-TH")}
                  </p>
                </div>
                <ParkingCheckoutButton sessionId={row.id} label="รับชำระ / เช็คเอาต์" onComplete={() => void load()} />
              </li>
            ))}
          </ul>
        )}
      </ParkingPanelCard>
    </ParkingPageStack>
  );
}
