"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  MapPin,
  Package,
  Phone,
  Route,
  Shield,
  CalendarClock,
} from "lucide-react";
import {
  AppEmptyState,
  AppImageThumb,
  AppLabeledImageThumb,
  AppImageLightbox,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  smartGuardTourCardIconTileClass,
  smartGuardTourTonedRowCardClass,
  type SmartGuardTourCardTone,
} from "@/systems/smart-guard-tour/lib/card-tones";
import {
  EMPTY_CATALOG,
  type CatalogAsset,
  type CatalogCheckpoint,
  type CatalogContact,
  type CatalogIncident,
  type CatalogLedger,
  type CatalogSchedule,
  type CatalogShift,
  type CatalogTourLog,
  type SmartGuardCatalog,
} from "@/systems/smart-guard-tour/lib/catalog-types";
import { formatMinutesHm } from "@/systems/smart-guard-tour/lib/wage-engine";
import {
  smartGuardTourFieldClass,
  smartGuardTourFilterChipClass,
  smartGuardTourFilterChipShellClass,
  smartGuardTourFinanceStatsGridClass,
  smartGuardTourOutlineButtonClass,
  smartGuardTourStatInlineClass,
} from "@/systems/smart-guard-tour/lib/ui-tokens";

function IconFilterFunnel({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}

function baht(n: number): string {
  return n.toLocaleString("th-TH");
}

function formatHm(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    });
  } catch {
    return "—";
  }
}

const TOUR_STATUS_TH: Record<string, string> = {
  CHECKED_OK: "ตรวจครบ",
  CHECKED_ISSUE: "พบปัญหา",
  OVERDUE: "เลยเวลา",
  MISSED: "พลาด",
  PENDING: "รอตรวจ",
};

const INCIDENT_STATUS_TH: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  IN_PROGRESS: "กำลังจัดการ",
  RESOLVED: "แก้แล้ว",
  CLOSED: "ปิด",
};

const ASSET_STATUS_TH: Record<string, string> = {
  AVAILABLE: "ว่าง",
  IN_USE: "ใช้งาน",
  MAINTENANCE: "ซ่อม",
  RETIRED: "เลิกใช้",
};

export function useSmartGuardCatalog() {
  const notice = useAppNoticePopup();
  const [data, setData] = useState<SmartGuardCatalog>(EMPTY_CATALOG);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/smart-guard-tour/session/catalog", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "โหลดไม่สำเร็จ");
      setData({ ...EMPTY_CATALOG, ...json });
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [notice]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, reload: load, notice };
}

type FilterChip = { key: string; label: string; count: number };

function ListShell({
  title,
  description,
  filterOpen,
  setFilterOpen,
  filtersActive,
  filterId,
  chips,
  activeChip,
  onChip,
  q,
  setQ,
  searchPlaceholder,
  onClear,
  summary,
  children,
}: {
  title: string;
  description?: string;
  filterOpen: boolean;
  setFilterOpen: (v: boolean | ((o: boolean) => boolean)) => void;
  filtersActive: boolean;
  filterId: string;
  chips: FilterChip[];
  activeChip: string;
  onChip: (key: string) => void;
  q: string;
  setQ: (v: string) => void;
  searchPlaceholder: string;
  onClear: () => void;
  summary: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-black tracking-tight text-[#1e1b4b] sm:text-base">{title}</h3>
          {description ? (
            <p className="mt-0.5 hidden text-xs font-medium text-[#66638c] sm:block">{description}</p>
          ) : null}
        </div>
        <button
          type="button"
          aria-expanded={filterOpen}
          aria-controls={filterId}
          aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
          title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
          className={cn(
            smartGuardTourOutlineButtonClass,
            "relative min-w-[40px] sm:min-w-0",
            filterOpen && "border-[#0000BF]/45 bg-[#0000BF]/10 ring-2 ring-[#0000BF]/20",
            filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
          )}
          onClick={() => setFilterOpen((o) => !o)}
        >
          <IconFilterFunnel className="h-4 w-4" />
          <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
          {filtersActive ? (
            <span
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white"
              aria-hidden
            />
          ) : null}
        </button>
      </div>

      <div id={filterId} className={cn("space-y-2.5", filterOpen ? "block" : "hidden")}>
        <div className={smartGuardTourFilterChipShellClass} role="tablist" aria-label="กรองสถานะ">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={activeChip === c.key}
              className={smartGuardTourFilterChipClass(activeChip === c.key)}
              onClick={() => onChip(c.key)}
            >
              {c.label} ({c.count})
            </button>
          ))}
        </div>
        <input
          className={smartGuardTourFieldClass}
          placeholder={searchPlaceholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={searchPlaceholder}
        />
        {filtersActive ? (
          <button type="button" className={cn(smartGuardTourOutlineButtonClass, "text-xs")} onClick={onClear}>
            ล้างกรอง
          </button>
        ) : null}
        <p className="text-xs font-bold tabular-nums text-[#2e2a58]">{summary}</p>
      </div>

      {children}
    </div>
  );
}

function RowCard({
  tone,
  icon,
  title,
  lines,
  thumb,
}: {
  tone: SmartGuardTourCardTone;
  icon: ReactNode;
  title: string;
  lines: string[];
  thumb?: ReactNode;
}) {
  return (
    <div className={smartGuardTourTonedRowCardClass(tone)}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {thumb ?? <span className={smartGuardTourCardIconTileClass(tone)}>{icon}</span>}
        <div className="min-w-0 flex-1 pr-1">
          <p className="line-clamp-2 text-balance text-sm font-black text-[#1e1b4b]">{title}</p>
          {lines.map((line, i) => (
            <p key={i} className="truncate text-xs font-medium text-[#66638c]" title={line}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SmartGuardTourCheckpointsList({ rows }: { rows: CatalogCheckpoint[] }) {
  const lb = useAppImageLightbox();
  const [filterOpen, setFilterOpen] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const filtersActive = Boolean(q.trim()) || status !== "all";
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (status === "active" && !r.isActive) return false;
      if (status === "inactive" && r.isActive) return false;
      const needle = q.trim().toLowerCase();
      if (!needle) return true;
      return (
        r.name.toLowerCase().includes(needle) ||
        (r.zoneLabel ?? "").toLowerCase().includes(needle) ||
        (r.buildingLabel ?? "").toLowerCase().includes(needle)
      );
    });
  }, [rows, q, status]);

  return (
    <>
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="จุดตรวจ" />
      <ListShell
        title="จุดตรวจ"
        filterOpen={filterOpen}
        setFilterOpen={setFilterOpen}
        filtersActive={filtersActive}
        filterId="sgt-cp-filter"
        chips={[
          { key: "all", label: "ทั้งหมด", count: rows.length },
          { key: "active", label: "ใช้งาน", count: rows.filter((r) => r.isActive).length },
          { key: "inactive", label: "ปิด", count: rows.filter((r) => !r.isActive).length },
        ]}
        activeChip={status}
        onChip={(k) => setStatus(k as typeof status)}
        q={q}
        setQ={setQ}
        searchPlaceholder="ค้นหาชื่อ / โซน / อาคาร"
        onClear={() => {
          setQ("");
          setStatus("all");
        }}
        summary={filtersActive ? `${filtered.length}/${rows.length} รายการ` : `${rows.length} รายการ`}
      >
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <AppEmptyState>{rows.length === 0 ? "ยังไม่มีจุดตรวจ" : "ไม่พบตามตัวกรอง"}</AppEmptyState>
          ) : (
            filtered.map((r) => (
              <RowCard
                key={r.id}
                tone={r.isActive ? "sky" : "slate"}
                icon={<MapPin className="h-5 w-5" strokeWidth={2.25} />}
                thumb={
                  r.coverImageUrl ? (
                    <AppImageThumb
                      src={r.coverImageUrl}
                      alt={r.name}
                      className="h-10 w-10 shrink-0 sm:h-12 sm:w-12"
                      onOpen={() => lb.open(r.coverImageUrl!)}
                    />
                  ) : undefined
                }
                title={r.name}
                lines={[
                  [r.zoneLabel, r.buildingLabel, r.floorLabel ? `ชั้น ${r.floorLabel}` : null]
                    .filter(Boolean)
                    .join(" · ") || "—",
                  `รัศมี ${r.geofenceRadiusM} ม.${r.videoCount ? ` · วิดีโอ ${r.videoCount}` : ""} · ${r.isActive ? "ใช้งาน" : "ปิด"}`,
                ]}
              />
            ))
          )}
        </div>
      </ListShell>
    </>
  );
}

export function SmartGuardTourSchedulesList({ rows }: { rows: CatalogSchedule[] }) {
  const [filterOpen, setFilterOpen] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const filtersActive = Boolean(q.trim()) || status !== "all";
  const filtered = rows.filter((r) => {
    if (status === "active" && !r.isActive) return false;
    if (status === "inactive" && r.isActive) return false;
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return r.name.toLowerCase().includes(needle);
  });

  return (
    <ListShell
      title="ตารางสายตรวจ"
      filterOpen={filterOpen}
      setFilterOpen={setFilterOpen}
      filtersActive={filtersActive}
      filterId="sgt-sched-filter"
      chips={[
        { key: "all", label: "ทั้งหมด", count: rows.length },
        { key: "active", label: "ใช้งาน", count: rows.filter((r) => r.isActive).length },
        { key: "inactive", label: "พัก", count: rows.filter((r) => !r.isActive).length },
      ]}
      activeChip={status}
      onChip={(k) => setStatus(k as typeof status)}
      q={q}
      setQ={setQ}
      searchPlaceholder="ค้นหาชื่อตาราง"
      onClear={() => {
        setQ("");
        setStatus("all");
      }}
      summary={filtersActive ? `${filtered.length}/${rows.length} รายการ` : `${rows.length} รายการ`}
    >
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <AppEmptyState>{rows.length === 0 ? "ยังไม่มีตาราง" : "ไม่พบตามตัวกรอง"}</AppEmptyState>
        ) : (
          filtered.map((r) => (
            <RowCard
              key={r.id}
              tone={r.isActive ? "amber" : "slate"}
              icon={<CalendarClock className="h-5 w-5" strokeWidth={2.25} />}
              title={r.name}
              lines={[
                `${r.routeMode === "SEQUENTIAL" ? "ตามลำดับ" : "อิสระ"} · ทุก ${r.intervalMinutes} นาที`,
                `${r.checkpointCount} จุดตรวจ · ${r.isActive ? "ใช้งาน" : "พักใช้"}`,
              ]}
            />
          ))
        )}
      </div>
    </ListShell>
  );
}

export function SmartGuardTourIncidentsList({ rows }: { rows: CatalogIncident[] }) {
  const [filterOpen, setFilterOpen] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "open" | "done">("all");
  const filtersActive = Boolean(q.trim()) || status !== "all";
  const isOpen = (s: string) => s === "PENDING" || s === "IN_PROGRESS";
  const filtered = rows.filter((r) => {
    if (status === "open" && !isOpen(r.status)) return false;
    if (status === "done" && isOpen(r.status)) return false;
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (
      r.title.toLowerCase().includes(needle) ||
      (r.checkpointName ?? "").toLowerCase().includes(needle) ||
      (r.staffName ?? "").toLowerCase().includes(needle)
    );
  });

  return (
    <ListShell
      title="เหตุการณ์"
      filterOpen={filterOpen}
      setFilterOpen={setFilterOpen}
      filtersActive={filtersActive}
      filterId="sgt-inc-filter"
      chips={[
        { key: "all", label: "ทั้งหมด", count: rows.length },
        { key: "open", label: "เปิดอยู่", count: rows.filter((r) => isOpen(r.status)).length },
        { key: "done", label: "ปิดแล้ว", count: rows.filter((r) => !isOpen(r.status)).length },
      ]}
      activeChip={status}
      onChip={(k) => setStatus(k as typeof status)}
      q={q}
      setQ={setQ}
      searchPlaceholder="ค้นหาหัวข้อ / จุด / พนักงาน"
      onClear={() => {
        setQ("");
        setStatus("all");
      }}
      summary={filtersActive ? `${filtered.length}/${rows.length} รายการ` : `${rows.length} รายการ`}
    >
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <AppEmptyState>{rows.length === 0 ? "ยังไม่มีเหตุการณ์" : "ไม่พบตามตัวกรอง"}</AppEmptyState>
        ) : (
          filtered.map((r) => {
            const tone: SmartGuardTourCardTone =
              r.severity === "CRITICAL" || r.kind === "SOS_URGENT"
                ? "rose"
                : isOpen(r.status)
                  ? "orange"
                  : "emerald";
            return (
              <RowCard
                key={r.id}
                tone={tone}
                icon={<AlertTriangle className="h-5 w-5" strokeWidth={2.25} />}
                title={r.title}
                lines={[
                  `${INCIDENT_STATUS_TH[r.status] ?? r.status} · ${r.severity}${r.imageCount ? ` · รูป ${r.imageCount}` : ""}`,
                  [r.checkpointName, r.staffName, r.contactName].filter(Boolean).join(" · ") || "—",
                ]}
              />
            );
          })
        )}
      </div>
    </ListShell>
  );
}

export function SmartGuardTourContactsList({ rows }: { rows: CatalogContact[] }) {
  const [filterOpen, setFilterOpen] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const filtersActive = Boolean(q.trim()) || status !== "all";
  const filtered = rows.filter((r) => {
    if (status === "active" && !r.isActive) return false;
    if (status === "inactive" && r.isActive) return false;
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (
      r.displayName.toLowerCase().includes(needle) ||
      (r.phone ?? "").includes(needle) ||
      (r.lineId ?? "").toLowerCase().includes(needle)
    );
  });

  return (
    <ListShell
      title="ผู้ติดต่อฉุกเฉิน"
      filterOpen={filterOpen}
      setFilterOpen={setFilterOpen}
      filtersActive={filtersActive}
      filterId="sgt-contact-filter"
      chips={[
        { key: "all", label: "ทั้งหมด", count: rows.length },
        { key: "active", label: "ใช้งาน", count: rows.filter((r) => r.isActive).length },
        { key: "inactive", label: "ปิด", count: rows.filter((r) => !r.isActive).length },
      ]}
      activeChip={status}
      onChip={(k) => setStatus(k as typeof status)}
      q={q}
      setQ={setQ}
      searchPlaceholder="ค้นหาชื่อ / เบอร์ / LINE"
      onClear={() => {
        setQ("");
        setStatus("all");
      }}
      summary={filtersActive ? `${filtered.length}/${rows.length} รายการ` : `${rows.length} รายการ`}
    >
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <AppEmptyState>{rows.length === 0 ? "ยังไม่มีผู้ติดต่อ" : "ไม่พบตามตัวกรอง"}</AppEmptyState>
        ) : (
          filtered.map((r) => (
            <RowCard
              key={r.id}
              tone={r.isActive ? "violet" : "slate"}
              icon={<Phone className="h-5 w-5" strokeWidth={2.25} />}
              title={r.displayName}
              lines={[r.phone || "ไม่มีเบอร์", r.lineId ? `LINE ${r.lineId}` : "—"]}
            />
          ))
        )}
      </div>
    </ListShell>
  );
}

export function SmartGuardTourAssetsList({ rows }: { rows: CatalogAsset[] }) {
  const [filterOpen, setFilterOpen] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "AVAILABLE" | "IN_USE" | "other">("all");
  const filtersActive = Boolean(q.trim()) || status !== "all";
  const filtered = rows.filter((r) => {
    if (status === "AVAILABLE" && r.status !== "AVAILABLE") return false;
    if (status === "IN_USE" && r.status !== "IN_USE") return false;
    if (status === "other" && (r.status === "AVAILABLE" || r.status === "IN_USE")) return false;
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (
      r.name.toLowerCase().includes(needle) ||
      (r.assetCode ?? "").toLowerCase().includes(needle) ||
      r.kind.toLowerCase().includes(needle)
    );
  });

  return (
    <ListShell
      title="อุปกรณ์"
      filterOpen={filterOpen}
      setFilterOpen={setFilterOpen}
      filtersActive={filtersActive}
      filterId="sgt-asset-filter"
      chips={[
        { key: "all", label: "ทั้งหมด", count: rows.length },
        { key: "AVAILABLE", label: "ว่าง", count: rows.filter((r) => r.status === "AVAILABLE").length },
        { key: "IN_USE", label: "ใช้งาน", count: rows.filter((r) => r.status === "IN_USE").length },
        {
          key: "other",
          label: "อื่น",
          count: rows.filter((r) => r.status !== "AVAILABLE" && r.status !== "IN_USE").length,
        },
      ]}
      activeChip={status}
      onChip={(k) => setStatus(k as typeof status)}
      q={q}
      setQ={setQ}
      searchPlaceholder="ค้นหาชื่อ / รหัส"
      onClear={() => {
        setQ("");
        setStatus("all");
      }}
      summary={filtersActive ? `${filtered.length}/${rows.length} รายการ` : `${rows.length} รายการ`}
    >
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <AppEmptyState>{rows.length === 0 ? "ยังไม่มีอุปกรณ์" : "ไม่พบตามตัวกรอง"}</AppEmptyState>
        ) : (
          filtered.map((r) => {
            const tone: SmartGuardTourCardTone =
              r.status === "AVAILABLE" ? "emerald" : r.status === "IN_USE" ? "orange" : "slate";
            return (
              <RowCard
                key={r.id}
                tone={tone}
                icon={<Package className="h-5 w-5" strokeWidth={2.25} />}
                title={r.name}
                lines={[
                  `${r.kind}${r.assetCode ? ` · ${r.assetCode}` : ""}`,
                  ASSET_STATUS_TH[r.status] ?? r.status,
                ]}
              />
            );
          })
        )}
      </div>
    </ListShell>
  );
}

export function SmartGuardTourTourLogsList({ rows }: { rows: CatalogTourLog[] }) {
  const lb = useAppImageLightbox();
  const [filterOpen, setFilterOpen] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "ok" | "issue" | "pending">("all");
  const filtersActive = Boolean(q.trim()) || status !== "all";
  const filtered = rows.filter((r) => {
    if (status === "ok" && r.status !== "CHECKED_OK") return false;
    if (status === "issue" && r.status !== "CHECKED_ISSUE" && r.status !== "OVERDUE" && r.status !== "MISSED")
      return false;
    if (status === "pending" && r.status !== "PENDING") return false;
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (
      r.checkpointName.toLowerCase().includes(needle) ||
      (r.staffName ?? "").toLowerCase().includes(needle) ||
      r.entryOn.includes(needle)
    );
  });

  return (
    <>
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปสายตรวจ" />
      <ListShell
        title="บันทึกสายตรวจ"
        filterOpen={filterOpen}
        setFilterOpen={setFilterOpen}
        filtersActive={filtersActive}
        filterId="sgt-tour-filter"
        chips={[
          { key: "all", label: "ทั้งหมด", count: rows.length },
          { key: "ok", label: "ครบ", count: rows.filter((r) => r.status === "CHECKED_OK").length },
          {
            key: "issue",
            label: "ปัญหา",
            count: rows.filter((r) =>
              ["CHECKED_ISSUE", "OVERDUE", "MISSED"].includes(r.status),
            ).length,
          },
          { key: "pending", label: "รอ", count: rows.filter((r) => r.status === "PENDING").length },
        ]}
        activeChip={status}
        onChip={(k) => setStatus(k as typeof status)}
        q={q}
        setQ={setQ}
        searchPlaceholder="ค้นหาจุด / พนักงาน / วัน"
        onClear={() => {
          setQ("");
          setStatus("all");
        }}
        summary={filtersActive ? `${filtered.length}/${rows.length} รายการ` : `${rows.length} รายการ`}
      >
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <AppEmptyState>{rows.length === 0 ? "ยังไม่มีบันทึก" : "ไม่พบตามตัวกรอง"}</AppEmptyState>
          ) : (
            filtered.map((r) => {
              const tone: SmartGuardTourCardTone =
                r.status === "CHECKED_OK"
                  ? "emerald"
                  : r.status === "PENDING"
                    ? "slate"
                    : "rose";
              return (
                <RowCard
                  key={r.id}
                  tone={tone}
                  icon={<Route className="h-5 w-5" strokeWidth={2.25} />}
                  thumb={
                    r.photoUrl ? (
                      <AppImageThumb
                        src={r.photoUrl}
                        alt={r.checkpointName}
                        className="h-10 w-10 shrink-0 sm:h-12 sm:w-12"
                        onOpen={() => lb.open(r.photoUrl!)}
                      />
                    ) : undefined
                  }
                  title={r.checkpointName}
                  lines={[
                    `${TOUR_STATUS_TH[r.status] ?? r.status} · ${r.entryOn}`,
                    [r.staffName, r.scheduleName, formatHm(r.scannedAt)].filter(Boolean).join(" · "),
                  ]}
                />
              );
            })
          )}
        </div>
      </ListShell>
    </>
  );
}

export function SmartGuardTourShiftsList({ rows }: { rows: CatalogShift[] }) {
  const [filterOpen, setFilterOpen] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "on" | "done" | "warn48">("all");
  const filtersActive = Boolean(q.trim()) || status !== "all";
  const warn48Count = rows.filter((r) => r.weeklyNormalExceeded).length;
  const filtered = rows.filter((r) => {
    if (status === "on" && !r.onDuty) return false;
    if (status === "done" && r.onDuty) return false;
    if (status === "warn48" && !r.weeklyNormalExceeded) return false;
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (
      r.staffName.toLowerCase().includes(needle) ||
      (r.staffPhone ?? "").includes(needle) ||
      r.shiftOn.includes(needle)
    );
  });

  return (
    <ListShell
      title="กะ / ค่าแรง"
      filterOpen={filterOpen}
      setFilterOpen={setFilterOpen}
      filtersActive={filtersActive}
      filterId="sgt-shift-filter"
      chips={[
        { key: "all", label: "ทั้งหมด", count: rows.length },
        { key: "on", label: "เข้ากะ", count: rows.filter((r) => r.onDuty).length },
        { key: "done", label: "เลิกกะ", count: rows.filter((r) => !r.onDuty).length },
        { key: "warn48", label: "เกิน 48 ชม.", count: warn48Count },
      ]}
      activeChip={status}
      onChip={(k) => setStatus(k as typeof status)}
      q={q}
      setQ={setQ}
      searchPlaceholder="ค้นหาชื่อ / เบอร์ / วัน"
      onClear={() => {
        setQ("");
        setStatus("all");
      }}
      summary={filtersActive ? `${filtered.length}/${rows.length} รายการ` : `${rows.length} รายการ`}
    >
      {warn48Count > 0 ? (
        <div
          className="mb-2 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs font-semibold text-amber-900"
          role="status"
        >
          มี {warn48Count} กะที่ชั่วโมงปกติสะสมสัปดาห์เกิน 48 ชม. (แจ้งเตือนอย่างเดียว — ไม่บล็อก)
        </div>
      ) : null}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <AppEmptyState>{rows.length === 0 ? "ยังไม่มีกะ" : "ไม่พบตามตัวกรอง"}</AppEmptyState>
        ) : (
          filtered.map((r) => {
            const wageLines: string[] = [
              `${r.shiftOn} · ${r.onDuty ? "เข้ากะอยู่" : "เลิกกะแล้ว"}`,
              `เข้า ${formatHm(r.checkInAt)} · ออก ${formatHm(r.checkOutAt)}`,
            ];
            if (r.clockMinutes != null) {
              wageLines.push(
                `นาฬิกา ${formatMinutesHm(r.clockMinutes)} · ปกติ ${formatMinutesHm(r.normalMinutes ?? 0)} · OT ${formatMinutesHm(r.otMinutes ?? 0)}`,
              );
            }
            if (r.totalBaht != null) {
              wageLines.push(`ค่าแรง ≈ ฿${r.totalBaht.toLocaleString("th-TH")}`);
            }
            if (r.weeklyNormalExceeded) wageLines.push("⚠ เกิน 48 ชม.ปกติ/สัปดาห์");
            if (r.missingHourlyRate) wageLines.push("ยังไม่ได้ตั้งเรทรายชั่วโมง");
            return (
              <RowCard
                key={r.id}
                tone={r.weeklyNormalExceeded ? "rose" : r.onDuty ? "orange" : "slate"}
                icon={<Shield className="h-5 w-5" strokeWidth={2.25} />}
                title={r.staffName}
                lines={wageLines}
              />
            );
          })
        )}
      </div>
    </ListShell>
  );
}

export function SmartGuardTourFinancePanel({
  ledger,
  summary,
}: {
  ledger: CatalogLedger[];
  summary: SmartGuardCatalog["financeSummary"];
}) {
  const lb = useAppImageLightbox();
  const [filterOpen, setFilterOpen] = useState(true);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | "INCOME" | "EXPENSE">("all");
  const filtersActive = Boolean(q.trim()) || kind !== "all";
  const filtered = ledger.filter((r) => {
    if (kind !== "all" && r.kind !== kind) return false;
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (
      r.title.toLowerCase().includes(needle) ||
      (r.categoryName ?? "").toLowerCase().includes(needle) ||
      r.entryOn.includes(needle)
    );
  });

  return (
    <div className="min-w-0 space-y-3">
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />
      <div className={smartGuardTourFinanceStatsGridClass}>
        <div className={cn(smartGuardTourStatInlineClass, "border-l-[3px] border-l-emerald-500")}>
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#66638c]">รายรับ</span>
          <span className="text-xl font-black tabular-nums text-emerald-700">{baht(summary.incomeBaht)}</span>
        </div>
        <div className={cn(smartGuardTourStatInlineClass, "border-l-[3px] border-l-rose-500")}>
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#66638c]">รายจ่าย</span>
          <span className="text-xl font-black tabular-nums text-rose-600">{baht(summary.expenseBaht)}</span>
        </div>
        <div
          className={cn(
            smartGuardTourStatInlineClass,
            "col-span-2 border-l-[3px] border-l-indigo-500 sm:col-span-1",
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#66638c]">สุทธิ</span>
          <span
            className={cn(
              "text-xl font-black tabular-nums",
              summary.netBaht < 0 ? "text-rose-800" : "text-[#1e1b4b]",
            )}
          >
            {baht(summary.netBaht)}
          </span>
        </div>
      </div>

      <ListShell
        title="รายการการเงิน"
        filterOpen={filterOpen}
        setFilterOpen={setFilterOpen}
        filtersActive={filtersActive}
        filterId="sgt-fin-filter"
        chips={[
          { key: "all", label: "ทั้งหมด", count: ledger.length },
          { key: "INCOME", label: "รายรับ", count: ledger.filter((r) => r.kind === "INCOME").length },
          { key: "EXPENSE", label: "รายจ่าย", count: ledger.filter((r) => r.kind === "EXPENSE").length },
        ]}
        activeChip={kind}
        onChip={(k) => setKind(k as typeof kind)}
        q={q}
        setQ={setQ}
        searchPlaceholder="ค้นหาหัวข้อ / หมวด / วัน"
        onClear={() => {
          setQ("");
          setKind("all");
        }}
        summary={filtersActive ? `${filtered.length}/${ledger.length} รายการ` : `${ledger.length} รายการ`}
      >
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <AppEmptyState>{ledger.length === 0 ? "ยังไม่มีรายการ" : "ไม่พบตามตัวกรอง"}</AppEmptyState>
          ) : (
            filtered.map((r) => (
              <div key={r.id} className={smartGuardTourTonedRowCardClass(r.kind === "INCOME" ? "emerald" : "rose")}>
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {r.slipImageUrl ? (
                    <AppLabeledImageThumb
                      src={r.slipImageUrl}
                      kind="slip"
                      alt={r.title}
                      onOpen={() => lb.open(r.slipImageUrl!)}
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-black text-[#1e1b4b]">{r.title}</p>
                    <p className="truncate text-xs font-medium text-[#66638c]">
                      {[r.entryOn, r.categoryName, r.staffName, r.assetName, r.paymentMethod]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </div>
                <p
                  className={cn(
                    "shrink-0 self-start text-lg font-black tabular-nums sm:self-center",
                    r.kind === "INCOME" ? "text-emerald-700" : "text-rose-600",
                  )}
                >
                  {baht(r.amountBaht)}
                </p>
              </div>
            ))
          )}
        </div>
      </ListShell>
    </div>
  );
}

export function SmartGuardTourMapPlaceholder({ checkpoints }: { checkpoints: CatalogCheckpoint[] }) {
  const withGps = checkpoints.filter((c) => c.lat != null && c.lng != null);
  return (
    <div className="min-w-0 space-y-3">
      <h3 className="text-sm font-black tracking-tight text-[#1e1b4b] sm:text-base">แผนที่จุดตรวจ</h3>
      <p className="text-xs font-bold tabular-nums text-[#2e2a58]">
        {withGps.length}/{checkpoints.length} จุดมีพิกัด
      </p>
      <div className="space-y-2">
        {withGps.length === 0 ? (
          <AppEmptyState>ยังไม่มีพิกัด</AppEmptyState>
        ) : (
          withGps.map((c) => (
            <RowCard
              key={c.id}
              tone="indigo"
              icon={<MapPin className="h-5 w-5" strokeWidth={2.25} />}
              title={c.name}
              lines={[`${c.lat!.toFixed(5)}, ${c.lng!.toFixed(5)}`, c.zoneLabel || "—"]}
            />
          ))
        )}
      </div>
    </div>
  );
}
