"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAppNoticePopup } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import type { SmartGuardShopDto } from "@/systems/smart-guard-tour/lib/mappers";
import {
  smartGuardTourFieldClass,
  smartGuardTourOutlineButtonClass,
  smartGuardTourPrimaryButtonClass,
} from "@/systems/smart-guard-tour/lib/ui-tokens";

type BranchOpt = {
  id: number;
  name: string;
  code: string;
  locations: { id: number; name: string }[];
};

type StaffOpt = { id: string; displayName: string; phone: string | null };
type RosterOpt = { id: number; displayName: string; phone: string; homeBranchId: number | null };

type LinksPayload = {
  hasAttendance: boolean;
  guardStaff: StaffOpt[];
  roster: RosterOpt[];
  branches: BranchOpt[];
  links: { guardStaffId: string; rosterEntryId: number }[];
};

export function SmartGuardTourIntegrationsPanel({
  shop,
  onShopPatched,
}: {
  shop: SmartGuardShopDto;
  onShopPatched: (next: SmartGuardShopDto) => void;
}) {
  const notice = useAppNoticePopup();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasAttendance, setHasAttendance] = useState(false);
  const [branches, setBranches] = useState<BranchOpt[]>([]);
  const [guardStaff, setGuardStaff] = useState<StaffOpt[]>([]);
  const [roster, setRoster] = useState<RosterOpt[]>([]);
  /** map guardStaffId → rosterEntryId | "" */
  const [pairMap, setPairMap] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/smart-guard-tour/session/attendance-links", {
        credentials: "include",
      });
      const data = (await res.json()) as LinksPayload & { error?: string };
      if (!res.ok) throw new Error(data.error || "โหลดไม่สำเร็จ");
      setHasAttendance(Boolean(data.hasAttendance));
      setBranches(data.branches ?? []);
      setGuardStaff(data.guardStaff ?? []);
      setRoster(data.roster ?? []);
      const next: Record<string, string> = {};
      for (const l of data.links ?? []) {
        next[l.guardStaffId] = String(l.rosterEntryId);
      }
      setPairMap(next);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [notice]);

  useEffect(() => {
    void load();
  }, [load]);

  const locationOptions =
    shop.attendanceBranchId != null
      ? (branches.find((b) => b.id === shop.attendanceBranchId)?.locations ?? [])
      : branches.flatMap((b) => b.locations);

  async function saveIntegrationSettings() {
    setBusy(true);
    try {
      const res = await fetch("/api/smart-guard-tour/session/shop", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceLinkEnabled: shop.attendanceLinkEnabled,
          attendanceBranchId: shop.attendanceBranchId,
          attendanceLocationId: shop.attendanceLocationId,
          attendanceRequireMatch: shop.attendanceRequireMatch,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      if (data.shop) onShopPatched(data.shop as SmartGuardShopDto);

      const links = Object.entries(pairMap)
        .filter(([, rid]) => rid && Number.isFinite(Number(rid)))
        .map(([guardStaffId, rid]) => ({
          guardStaffId,
          rosterEntryId: Number(rid),
        }));
      const linkRes = await fetch("/api/smart-guard-tour/session/attendance-links", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      });
      const linkData = await linkRes.json();
      if (!linkRes.ok) throw new Error(linkData.error || "บันทึกแม็ปไม่สำเร็จ");
      notice.success("บันทึกการเชื่อมระบบแล้ว");
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function autoMatch() {
    setBusy(true);
    try {
      const res = await fetch("/api/smart-guard-tour/session/attendance-links", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoMatch: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "จับคู่ไม่สำเร็จ");
      notice.success(`จับคู่ตามเบอร์แล้ว ${data.matched ?? 0} คน`);
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "จับคู่ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm font-medium text-[#66638c]">กำลังโหลดการเชื่อมระบบ…</p>;
  }

  if (!hasAttendance) {
    return (
      <div className="space-y-3 rounded-[1.25rem] border border-dashed border-[#c4b5fd]/60 bg-violet-50/40 p-4">
        {notice.popup}
        <p className="text-sm font-bold text-[#1e1b4b]">ยังไม่ได้สมัครเช็คอินอัจฉริยะ</p>
        <p className="text-xs text-[#66638c]">
          สมัครโมดูลเช็คอินอัจฉริยะเพื่อเปิดลิงก์เข้ากะจาก GPS / ใบหน้า / QR ไปยังกะจุดตรวจ
        </p>
        <Link
          href="/dashboard/modules"
          className={cn(smartGuardTourPrimaryButtonClass, "inline-flex")}
        >
          ไปหน้าสมัครโมดูล
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notice.popup}
      <label className="flex items-start gap-3 rounded-[1.25rem] border border-white/50 bg-white/70 p-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4"
          checked={shop.attendanceLinkEnabled}
          disabled={busy}
          onChange={(e) =>
            onShopPatched({ ...shop, attendanceLinkEnabled: e.target.checked })
          }
        />
        <span>
          <span className="block text-sm font-black text-[#1e1b4b]">เชื่อมเข้ากะจากเช็คอิน</span>
          <span className="mt-0.5 block text-xs text-[#66638c]">
            เมื่อพนักงานเช็คอิน/เอาต์ในเช็คอินอัจฉริยะ ระบบจะเปิด/ปิดกะในจุดตรวจอัตโนมัติ (ไม่ต้องเข้ากะซ้ำ)
          </span>
        </span>
      </label>

      <div className={cn("grid gap-3 sm:grid-cols-2", !shop.attendanceLinkEnabled && "opacity-60")}>
        <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
          สาขาเช็คอิน (ว่าง = ทุกสาขา)
          <select
            className={smartGuardTourFieldClass}
            disabled={busy || !shop.attendanceLinkEnabled}
            value={shop.attendanceBranchId ?? ""}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : null;
              onShopPatched({
                ...shop,
                attendanceBranchId: v,
                attendanceLocationId: null,
              });
            }}
          >
            <option value="">ทุกสาขา</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
          จุดเช็คอินที่นับเป็นเข้ากะ (ว่าง = ทุกจุด)
          <select
            className={smartGuardTourFieldClass}
            disabled={busy || !shop.attendanceLinkEnabled}
            value={shop.attendanceLocationId ?? ""}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : null;
              onShopPatched({ ...shop, attendanceLocationId: v });
            }}
          >
            <option value="">ทุกจุด</option>
            {locationOptions.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4"
          checked={shop.attendanceRequireMatch}
          disabled={busy || !shop.attendanceLinkEnabled}
          onChange={(e) =>
            onShopPatched({ ...shop, attendanceRequireMatch: e.target.checked })
          }
        />
        <span className="text-xs text-[#5f5a8a]">
          <span className="font-bold text-[#1e1b4b]">ต้องมีแม็ปพนักงานถึงจะซิงก์</span>
          {" — "}
          ถ้าปิด จะจับคู่เบอร์โทรอัตโนมัติเมื่อไม่มีแม็ป
        </span>
      </label>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-black text-[#1e1b4b]">จับคู่พนักงาน</p>
          <button
            type="button"
            className={smartGuardTourOutlineButtonClass}
            disabled={busy || !shop.attendanceLinkEnabled || roster.length === 0}
            onClick={() => void autoMatch()}
          >
            จับคู่ตามเบอร์อัตโนมัติ
          </button>
        </div>
        {guardStaff.length === 0 ? (
          <p className="text-xs text-[#66638c]">ยังไม่มีรายชื่อ รปภ. — เพิ่มที่เมนูจัดการ → พนักงาน</p>
        ) : (
          <ul className="space-y-2">
            {guardStaff.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-2 rounded-xl border border-white/50 bg-white/60 p-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#1e1b4b]">{s.displayName}</p>
                  <p className="text-[11px] text-[#66638c]">{s.phone || "ไม่มีเบอร์"}</p>
                </div>
                <select
                  className={cn(smartGuardTourFieldClass, "sm:max-w-xs")}
                  disabled={busy || !shop.attendanceLinkEnabled}
                  value={pairMap[s.id] ?? ""}
                  onChange={(e) =>
                    setPairMap((m) => ({ ...m, [s.id]: e.target.value }))
                  }
                >
                  <option value="">— ไม่แม็ป —</option>
                  {roster.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.displayName} · {r.phone}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className={smartGuardTourPrimaryButtonClass}
          disabled={busy}
          onClick={() => void saveIntegrationSettings()}
        >
          บันทึกการเชื่อมระบบ
        </button>
      </div>
    </div>
  );
}
