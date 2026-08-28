"use client";

import {
  AppIconImage,
  AppIconPower,
  AppIconToolbarButton,
  AppIconTrash,
  AppIconUpload,
  AppImageThumb,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  attendanceIconToolbarGroupClass,
  attendanceLabelMutedClass,
  attendanceListRowCardClass,
  attendanceRosterFooterRowClass,
  attendanceRosterInactiveBadgeClass,
  attendanceRosterSelectClass,
  attendanceZoneChipFaceClass,
  attendanceZoneChipFaceIdleClass,
  attendanceZoneChipFpClass,
} from "@/systems/attendance/attendance-ui";

type ShiftSlot = { index: number; label: string };
type BranchOption = { id: number; name: string; code: string };

export type AttendanceRosterEntryRow = {
  id: number;
  displayName: string;
  phone: string;
  isActive: boolean;
  rosterShiftIndex: number;
  homeBranchId: number | null;
  homeBranchName: string | null;
  homeBranchCode: string | null;
  photoUrl: string | null;
  faceEnrolled: boolean;
  faceSampleCount: number;
  fingerprintSlot: number | null;
};

function IconFaceScan({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="10" r="4" strokeLinecap="round" />
      <path d="M6 20c1.2-2.5 3.4-4 6-4s4.8 1.5 6 4" strokeLinecap="round" />
    </svg>
  );
}

function IconCamera({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 8h4l2-2h4l2 2h4v10H4V8z" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function clampShift(idx: number, slotCount: number): number {
  if (slotCount <= 0) return 0;
  return Math.max(0, Math.min(idx, slotCount - 1));
}

type Props = {
  entry: AttendanceRosterEntryRow;
  shiftSlots: ShiftSlot[];
  branches: BranchOption[];
  photoBusy: boolean;
  photoBusyThis: boolean;
  shiftLabel: string;
  onViewPhoto: () => void;
  onUploadPhoto: () => void;
  onCameraPhoto: () => void;
  onFaceEnroll: () => void;
  onToggleActive: () => void;
  onRemove: () => void;
  onShiftChange: (index: number) => void;
  onBranchChange: (homeBranchId: number | null) => void;
  onFingerprintBlur: (slot: number | null) => void;
};

export function AttendanceRosterEntryCard({
  entry: r,
  shiftSlots,
  branches,
  photoBusy,
  photoBusyThis,
  shiftLabel,
  onViewPhoto,
  onUploadPhoto,
  onCameraPhoto,
  onFaceEnroll,
  onToggleActive,
  onRemove,
  onShiftChange,
  onBranchChange,
  onFingerprintBlur,
}: Props) {
  const branchLabel = r.homeBranchName ?? r.homeBranchCode;

  return (
    <li className={attendanceListRowCardClass}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <AppImageThumb
            src={r.photoUrl}
            alt=""
            emptyLabel={r.displayName.trim().charAt(0) || "?"}
            className="h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white"
            onOpen={onViewPhoto}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-balance line-clamp-2 text-sm font-semibold leading-snug text-[#2e2a58]">
                {r.displayName}
              </p>
              {!r.isActive ? (
                <span className={attendanceRosterInactiveBadgeClass}>ปิดใช้งาน</span>
              ) : null}
            </div>
            <p className="mt-0.5 truncate font-mono text-xs tabular-nums text-[#7a7699]" title={r.phone}>
              {r.phone}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-[#8b87b8]">
              {shiftLabel}
              {branchLabel ? (
                <>
                  <span className="mx-1 text-[#c4c0e0]" aria-hidden>
                    ·
                  </span>
                  {branchLabel}
                </>
              ) : (
                <>
                  <span className="mx-1 text-[#c4c0e0]" aria-hidden>
                    ·
                  </span>
                  ทุกสาขา
                </>
              )}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <span className={r.faceEnrolled ? attendanceZoneChipFaceClass : attendanceZoneChipFaceIdleClass}>
                {r.faceEnrolled
                  ? `ใบหน้า${r.faceSampleCount > 0 ? ` · ${r.faceSampleCount} มุม` : ""}`
                  : "ยังไม่ลงทะเบียนใบหน้า"}
              </span>
              <span className={r.fingerprintSlot != null ? attendanceZoneChipFpClass : attendanceZoneChipFaceIdleClass}>
                {r.fingerprintSlot != null ? `นิ้วมือ · slot ${r.fingerprintSlot}` : "ยังไม่ผูกนิ้วมือ"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 self-stretch sm:self-start">
          <div className={attendanceIconToolbarGroupClass} role="group" aria-label={`รูป ${r.displayName}`}>
            <AppIconToolbarButton
              title="อัปโหลดรูป"
              ariaLabel={`อัปโหลดรูป ${r.displayName}`}
              disabled={photoBusy}
              onClick={onUploadPhoto}
            >
              <AppIconUpload className="h-3.5 w-3.5" />
            </AppIconToolbarButton>
            <AppIconToolbarButton
              title="ถ่ายรูป"
              ariaLabel={`ถ่ายรูป ${r.displayName}`}
              disabled={photoBusy}
              onClick={onCameraPhoto}
            >
              <IconCamera className="h-3.5 w-3.5" />
            </AppIconToolbarButton>
            <AppIconToolbarButton
              title="ดูรูป"
              ariaLabel={`ดูรูป ${r.displayName}`}
              disabled={!r.photoUrl}
              onClick={onViewPhoto}
            >
              <AppIconImage className="h-3.5 w-3.5" />
            </AppIconToolbarButton>
          </div>
          <div className={attendanceIconToolbarGroupClass} role="group" aria-label={`จัดการ ${r.displayName}`}>
            <AppIconToolbarButton
              title={r.faceEnrolled ? "แก้ไขใบหน้า" : "ลงทะเบียนใบหน้า"}
              ariaLabel={r.faceEnrolled ? `แก้ไขใบหน้า ${r.displayName}` : `ลงทะเบียนใบหน้า ${r.displayName}`}
              onClick={onFaceEnroll}
              className={r.faceEnrolled ? "text-emerald-700 hover:text-emerald-800" : undefined}
            >
              <IconFaceScan className="h-3.5 w-3.5" />
            </AppIconToolbarButton>
            <AppIconToolbarButton
              title={r.isActive ? "ปิดการใช้งาน" : "เปิดการใช้งาน"}
              ariaLabel={r.isActive ? `ปิดการใช้งาน ${r.displayName}` : `เปิดการใช้งาน ${r.displayName}`}
              onClick={onToggleActive}
              className={r.isActive ? "text-emerald-700 hover:text-emerald-800" : "text-amber-700 hover:text-amber-800"}
            >
              <AppIconPower className="h-3.5 w-3.5" />
            </AppIconToolbarButton>
            <AppIconToolbarButton
              title="ลบรายชื่อ"
              ariaLabel={`ลบรายชื่อ ${r.displayName}`}
              onClick={onRemove}
              className="text-[#9b97b8] hover:bg-red-50 hover:text-red-600"
            >
              <AppIconTrash className="h-3.5 w-3.5" />
            </AppIconToolbarButton>
          </div>
          {photoBusyThis ? (
            <span className="text-[10px] font-semibold text-[#66638c]" aria-live="polite">
              กำลังอัปโหลด…
            </span>
          ) : null}
        </div>
      </div>

      <div className={attendanceRosterFooterRowClass}>
        <label className={cn("min-w-0 flex-1 sm:max-w-[14rem]", attendanceLabelMutedClass)}>
          <span className="text-[10px]">กะ</span>
          <select
            className={attendanceRosterSelectClass}
            value={clampShift(r.rosterShiftIndex, shiftSlots.length)}
            onChange={(e) => onShiftChange(Number(e.target.value))}
            aria-label={`กะของ ${r.displayName}`}
          >
            {shiftSlots.map((s) => (
              <option key={s.index} value={s.index}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        {branches.length > 0 ? (
          <label className={cn("min-w-0 flex-1 sm:max-w-[14rem]", attendanceLabelMutedClass)}>
            <span className="text-[10px]">สาขา</span>
            <select
              className={attendanceRosterSelectClass}
              value={r.homeBranchId ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                onBranchChange(v === "" ? null : Number(v));
              }}
              aria-label={`สาขาประจำ ${r.displayName}`}
            >
              <option value="">ทุกสาขา</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name.trim() || b.code}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className={cn("shrink-0", attendanceLabelMutedClass)}>
          <span className="text-[10px]">slot นิ้วมือ</span>
          <input
            type="number"
            min={1}
            max={1000}
            placeholder="—"
            aria-label={`slot ลายนิ้วมือ ${r.displayName}`}
            defaultValue={r.fingerprintSlot ?? ""}
            key={`fp-${r.id}-${r.fingerprintSlot ?? "x"}`}
            className={cn(
              attendanceRosterSelectClass,
              "w-full min-w-[4.25rem] max-w-[5.5rem] text-center tabular-nums",
            )}
            onBlur={(e) => {
              const raw = e.target.value.trim();
              const next = raw === "" ? null : Number(raw);
              if (next === r.fingerprintSlot) return;
              if (next != null && (!Number.isInteger(next) || next < 1 || next > 1000)) {
                window.alert("slot ต้องเป็นจำนวนเต็ม 1–1000");
                e.target.value = r.fingerprintSlot != null ? String(r.fingerprintSlot) : "";
                return;
              }
              onFingerprintBlur(next);
            }}
          />
        </label>
      </div>
    </li>
  );
}
