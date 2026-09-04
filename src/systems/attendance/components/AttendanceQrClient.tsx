"use client";

import { Suspense, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  AppDashboardSection,
  AppSectionHeader,
} from "@/components/app-templates";
import { ModuleQrMonthlyGate } from "@/components/qr/ModuleQrMonthlyGate";
import { cn } from "@/lib/cn";
import { ATTENDANCE_MODULE_SLUG } from "@/lib/modules/config";
import { AttendanceQrPosterClient } from "@/systems/attendance/components/AttendanceQrPosterClient";
import {
  attendanceMobileSelectClass,
  attendancePrimaryTabPillClass,
  attendancePrimaryTabShellClass,
  attendanceSectionRadiusClass,
} from "@/systems/attendance/lib/ui-tokens";

type LocRow = { id: number; name: string };
type BranchRow = { id: number; name: string; code: string; locations: LocRow[] };

type QrMode = "classic" | "face";

const MODE_TABS: { id: QrMode; label: string; description: string }[] = [
  { id: "classic", label: "เช็คอินแบบเดิม", description: "เบอร์โทร · บุคคลภายนอก" },
  { id: "face", label: "สแกนใบหน้า", description: "วาง iPad ที่จุดเช็ค" },
];

type Props = {
  ownerId: string;
  sandboxTrialSessionId: string | null;
  orgLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  branches: BranchRow[];
};

function parseIndex(raw: string | null, count: number): number {
  if (!raw || count === 0) return 0;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n >= count) return 0;
  return n;
}

function parseMode(raw: string | null): QrMode {
  return raw === "face" ? "face" : "classic";
}

function QrTabDivider() {
  return <span className="hidden h-5 w-px shrink-0 bg-[#e8e6fc] sm:inline-block" aria-hidden />;
}

function QrModeTabNav({
  mode,
  onSelect,
  className,
}: {
  mode: QrMode;
  onSelect: (m: QrMode) => void;
  className?: string;
}) {
  return (
    <nav className={cn(attendancePrimaryTabShellClass, className)} role="tablist" aria-label="ประเภท QR">
      {MODE_TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={mode === t.id}
          className={attendancePrimaryTabPillClass(mode === t.id)}
          onClick={() => onSelect(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

export function AttendanceQrClient(props: Props) {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-[1.25rem] bg-white/30" aria-busy />}>
      <AttendanceQrClientInner {...props} />
    </Suspense>
  );
}

function AttendanceQrClientInner({
  ownerId,
  sandboxTrialSessionId,
  orgLabel,
  logoUrl,
  baseUrl,
  branches,
}: Props) {
  const searchParams = useSearchParams();
  const [branchIndex, setBranchIndex] = useState(() =>
    parseIndex(searchParams.get("branchIndex"), branches.length),
  );
  const branch = branches[branchIndex] ?? branches[0];
  const branchLocs = branch?.locations ?? [];
  const [locIndex, setLocIndex] = useState(() => parseIndex(searchParams.get("locIndex"), branchLocs.length));
  const [mode, setMode] = useState<QrMode>(() => parseMode(searchParams.get("mode")));

  const loc = branchLocs[locIndex] ?? branchLocs[0];
  const hasAnyLoc = useMemo(
    () => branches.some((b) => b.locations.length > 0),
    [branches],
  );

  if (!hasAnyLoc || !loc) {
    return (
      <AppDashboardSection tone="violet" className={attendanceSectionRadiusClass}>
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ยังไม่มีจุดเช็ค — ไปที่{" "}
          <a href="/dashboard/attendance/settings" className="font-semibold underline">
            ตั้งค่าเช็คอิน
          </a>{" "}
          แล้วบันทึกอย่างน้อยหนึ่งจุด
        </p>
      </AppDashboardSection>
    );
  }

  const branchLabel = branch.name.trim() || branch.code;
  const locLabel = loc.name.trim() || `จุดเช็ค #${loc.id}`;

  const syncUrl = (nextBranch: number, nextLoc: number, nextMode: QrMode) => {
    const url = new URL(window.location.href);
    url.searchParams.set("branchIndex", String(nextBranch));
    url.searchParams.set("locIndex", String(nextLoc));
    url.searchParams.set("mode", nextMode);
    window.history.replaceState({}, "", url.toString());
  };

  const selectBranch = (i: number) => {
    setBranchIndex(i);
    setLocIndex(0);
    syncUrl(i, 0, mode);
  };

  const selectLoc = (i: number) => {
    setLocIndex(i);
    syncUrl(branchIndex, i, mode);
  };

  const selectMode = (m: QrMode) => {
    setMode(m);
    syncUrl(branchIndex, locIndex, m);
  };

  const desktopTabGroups: ReactNode[] = [];
  if (branches.length > 1) {
    desktopTabGroups.push(
      <nav key="branch" className={attendancePrimaryTabShellClass} role="tablist" aria-label="สาขา">
        {branches.map((b, i) => (
          <button
            key={b.id}
            type="button"
            role="tab"
            aria-selected={branchIndex === i}
            className={attendancePrimaryTabPillClass(branchIndex === i)}
            onClick={() => selectBranch(i)}
          >
            {b.name.trim() || b.code}
          </button>
        ))}
      </nav>,
    );
  }
  if (branchLocs.length > 1) {
    desktopTabGroups.push(
      <nav key="loc" className={attendancePrimaryTabShellClass} role="tablist" aria-label="จุดเช็คอิน">
        {branchLocs.map((L, i) => (
          <button
            key={L.id}
            type="button"
            role="tab"
            aria-selected={locIndex === i}
            className={attendancePrimaryTabPillClass(locIndex === i)}
            onClick={() => selectLoc(i)}
          >
            {L.name.trim() || `จุด ${i + 1}`}
          </button>
        ))}
      </nav>,
    );
  }
  desktopTabGroups.push(
    <QrModeTabNav key="mode" mode={mode} onSelect={selectMode} className="sm:shrink-0" />,
  );

  return (
    <AppDashboardSection tone="violet" className={cn(attendanceSectionRadiusClass, "!rounded-[1.25rem]")}>
      <AppSectionHeader
        tone="violet"
        title="QR จุดเช็คอิน"
        description="เลือกสาขา · จุดเช็ค · ประเภท QR"
      />

      {branches.length > 1 || branchLocs.length > 1 ? (
        <div className="mt-3 space-y-2 sm:hidden">
          {branches.length > 1 ? (
            <>
              <label className="block text-xs font-bold text-[#4d47b6]" htmlFor="attendance-qr-branch">
                เลือกสาขา
              </label>
              <select
                id="attendance-qr-branch"
                className={attendanceMobileSelectClass}
                value={branchIndex}
                onChange={(e) => selectBranch(Number(e.target.value))}
              >
                {branches.map((b, i) => (
                  <option key={b.id} value={i}>
                    {b.name.trim() || b.code}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          {branchLocs.length > 1 ? (
            <>
              <label className="block text-xs font-bold text-[#4d47b6]" htmlFor="attendance-qr-loc">
                เลือกจุดเช็ค
              </label>
              <select
                id="attendance-qr-loc"
                className={attendanceMobileSelectClass}
                value={locIndex}
                onChange={(e) => selectLoc(Number(e.target.value))}
              >
                {branchLocs.map((L, i) => (
                  <option key={L.id} value={i}>
                    {L.name.trim() || `จุด #${L.id}`}
                  </option>
                ))}
              </select>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 hidden sm:flex sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-1.5">
        {desktopTabGroups.map((group, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 ? <QrTabDivider /> : null}
            {group}
          </div>
        ))}
      </div>

      <div className="mt-3 sm:hidden">
        <QrModeTabNav mode={mode} onSelect={selectMode} />
      </div>

      <p className="mt-2 text-xs font-medium text-[#66638c]">
        {branches.length > 1 ? `${branchLabel} · ` : ""}
        {locLabel} · {MODE_TABS.find((t) => t.id === mode)?.description}
      </p>

      <div className="mt-4 rounded-[1.25rem] border border-white/60 bg-white/55 p-3 sm:p-4" role="tabpanel">
        <ModuleQrMonthlyGate moduleSlug={ATTENDANCE_MODULE_SLUG}>
          <AttendanceQrPosterClient
            ownerId={ownerId}
            sandboxTrialSessionId={sandboxTrialSessionId}
            orgLabel={orgLabel}
            logoUrl={logoUrl}
            baseUrl={baseUrl}
            locationId={loc.id}
            locationName={loc.name}
            faceKiosk={mode === "face"}
          />
        </ModuleQrMonthlyGate>
      </div>
    </AppDashboardSection>
  );
}
