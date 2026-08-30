"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { parkingBtnSecondary, parkingField } from "@/systems/parking/parking-ui";

export function ParkingAddSpotForm({ siteId }: { siteId?: number }) {
  const router = useRouter();
  const [spotCode, setSpotCode] = useState("");
  const [zoneLabel, setZoneLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/parking/spots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotCode: spotCode.trim(),
          zoneLabel: zoneLabel.trim() || null,
          ...(siteId != null ? { siteId } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "เพิ่มไม่สำเร็จ");
        return;
      }
      setSpotCode("");
      setZoneLabel("");
      router.refresh();
    } catch {
      setErr("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
      suppressHydrationWarning
    >
      <div className="min-w-[140px] flex-1">
        <label className="block text-xs font-semibold text-[#5f5a8a]">รหัสช่อง</label>
        <input
          suppressHydrationWarning
          className={`${parkingField} mt-1`}
          value={spotCode}
          onChange={(e) => setSpotCode(e.target.value)}
          placeholder="เช่น B-12"
          maxLength={24}
          required
        />
      </div>
      <div className="min-w-[160px] flex-1">
        <label className="block text-xs font-semibold text-[#5f5a8a]">โซน (ไม่บังคับ)</label>
        <input
          suppressHydrationWarning
          className={`${parkingField} mt-1`}
          value={zoneLabel}
          onChange={(e) => setZoneLabel(e.target.value)}
          placeholder="โซน B"
          maxLength={80}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        aria-label={loading ? "กำลังเพิ่มช่องจอด" : "เพิ่มช่องจอด"}
        title={loading ? undefined : "เพิ่มช่องจอด"}
        className={cn(
          parkingBtnSecondary,
          "min-h-[40px] min-w-[40px] shrink-0 self-end px-3 sm:min-h-0 sm:min-w-0 sm:self-auto sm:px-4",
        )}
        suppressHydrationWarning
      >
        {loading ? (
          <>
            <svg className="h-5 w-5 animate-spin sm:hidden" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="hidden sm:inline">กำลังเพิ่ม…</span>
          </>
        ) : (
          <>
            <svg className="h-5 w-5 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">+ เพิ่มช่อง</span>
          </>
        )}
      </button>
      {err ? <p className="w-full text-sm text-red-700">{err}</p> : null}
    </form>
  );
}
