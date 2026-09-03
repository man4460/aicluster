"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppDashboardSection } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { HomeFinanceListHeading } from "@/systems/home-finance/components/HomeFinanceUi";
import { laundryPackageTabListGridClass } from "@/systems/laundry/laundry-dashboard-layout";
import { LaundryPackageCard } from "@/systems/laundry/components/LaundryPackageCard";
import { LaundryPackageEditorModal } from "@/systems/laundry/components/LaundryPackageEditorModal";
import { LaundryPackageViewModal } from "@/systems/laundry/components/LaundryPackageViewModal";
import {
  createLaundrySessionApiRepository,
  type LaundryPackage,
  type LaundryRepository,
} from "@/systems/laundry/laundry-service";
import {
  laundryFieldClass,
  laundryMutedLoadingNoticeClass,
  laundryDashboardSegmentBtnClass,
  laundryDashboardSegmentShellClass,
  laundryOffersEmptyStateClass,
  laundryPrimaryButtonClass,
  laundrySectionFirstClass,
  laundrySectionNextClass,
} from "@/systems/laundry/lib/ui-tokens";

type PackageStatusFilterKey = "ALL" | "ACTIVE" | "INACTIVE";

function IconFilterFunnel({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}

export type LaundryPackagesEmbeddedToolbarApi = {
  openAddModal: () => void;
  filterOpen: boolean;
  hasActiveFilters: boolean;
  toggleFilter: () => void;
};

type Props = {
  embedded?: boolean;
  onEmbeddedToolbar?: (api: LaundryPackagesEmbeddedToolbarApi | null) => void;
  repo?: LaundryRepository;
};

export function LaundryPackagesClient({
  embedded = false,
  onEmbeddedToolbar,
  repo: repoProp,
}: Props = {}) {
  const repo = useMemo(() => repoProp ?? createLaundrySessionApiRepository(), [repoProp]);
  const [packages, setPackages] = useState<LaundryPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [packageModal, setPackageModal] = useState<null | "create" | LaundryPackage>(null);
  const [viewPackage, setViewPackage] = useState<LaundryPackage | null>(null);
  const [filterOpen, setFilterOpen] = useState(true);
  const [filterKeyword, setFilterKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<PackageStatusFilterKey>("ALL");

  const packageStats = useMemo(() => {
    const countActive = packages.filter((p) => p.is_active).length;
    const countInactive = packages.filter((p) => !p.is_active).length;
    return { countTotal: packages.length, countActive, countInactive };
  }, [packages]);

  const filteredPackages = useMemo(() => {
    const q = filterKeyword.trim().toLowerCase();
    return packages.filter((p) => {
      if (statusFilter === "ACTIVE" && !p.is_active) return false;
      if (statusFilter === "INACTIVE" && p.is_active) return false;
      if (q.length > 0) {
        const hay = [p.name, p.description].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [packages, filterKeyword, statusFilter]);

  const hasActiveFilters = statusFilter !== "ALL" || filterKeyword.trim().length > 0;

  const statusChipOptions: { key: PackageStatusFilterKey; label: string; count: number }[] = [
    { key: "ALL", label: "ทั้งหมด", count: packageStats.countTotal },
    { key: "ACTIVE", label: "เปิดใช้", count: packageStats.countActive },
    { key: "INACTIVE", label: "ปิด", count: packageStats.countInactive },
  ];

  const toggleFilter = useCallback(() => {
    setFilterOpen((o) => !o);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPackages(await repo.listPackages());
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAddModal = useCallback(() => {
    setPackageModal("create");
  }, []);

  useEffect(() => {
    if (!embedded || !onEmbeddedToolbar) return;
    onEmbeddedToolbar({
      openAddModal,
      filterOpen,
      hasActiveFilters,
      toggleFilter,
    });
    return () => onEmbeddedToolbar(null);
  }, [embedded, onEmbeddedToolbar, openAddModal, filterOpen, hasActiveFilters, toggleFilter]);

  async function deletePackageRow(p: LaundryPackage) {
    if (!confirm(`ลบแพ็กเกจ "${p.name}" ?`)) return;
    await repo.deletePackage(p.id);
    await load();
  }

  const body = (
    <>
      {!embedded ? (
        <div className="min-w-0">
          <div className="flex flex-row items-center justify-between gap-2">
            <HomeFinanceListHeading className="mb-0 min-w-0">ราคา / แพ็กเกจ</HomeFinanceListHeading>
            <button
              type="button"
              onClick={openAddModal}
              className={laundryPrimaryButtonClass}
              aria-label="เพิ่มแพ็กเกจ"
            >
              <svg className="h-4 w-4 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              <span className="hidden sm:inline">+ เพิ่มแพ็กเกจ</span>
            </button>
          </div>
          <p className="mt-2 hidden text-xs text-[#66638c] sm:block">
            1 ครั้ง = รายครั้ง · มากกว่า 1 = แพ็กเหมาขายเป็นสมาชิก
          </p>
        </div>
      ) : null}

      <div className={embedded ? "min-w-0 space-y-2.5" : "mt-3 space-y-3"}>
        {loading ? <p className={laundryMutedLoadingNoticeClass}>กำลังโหลด…</p> : null}
        {!loading && packages.length === 0 ? (
          <p className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/80 px-3 py-8 text-center text-xs text-slate-600 sm:text-sm">
            ยังไม่มีแพ็กเกจ — กด &quot;เพิ่มแพ็กเกจ&quot; เพื่อสร้างรายการแรก
          </p>
        ) : null}
        {!loading && packages.length > 0 ? (
          <>
            <section className={cn(embedded ? "min-w-0 space-y-2.5" : laundrySectionNextClass)} aria-label="กรองแพ็กเกจ">
              <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-2.5">
                  {!embedded ?
                    <div className={cn(laundryDashboardSegmentShellClass, "max-w-full")} role="group" aria-label="เครื่องมือกรองแพ็กเกจ">
                      <button
                        type="button"
                        onClick={toggleFilter}
                        aria-expanded={filterOpen}
                        aria-controls="laundry-packages-filter-panel"
                        aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                        title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                        className={cn(
                          laundryDashboardSegmentBtnClass(filterOpen),
                          "relative min-h-[40px] min-w-[40px] sm:min-w-0",
                          hasActiveFilters && !filterOpen && "ring-1 ring-amber-300/80",
                        )}
                      >
                        <IconFilterFunnel className="h-3.5 w-3.5 shrink-0" />
                        <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                        {hasActiveFilters ?
                          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white" aria-hidden />
                        : null}
                      </button>
                    </div>
                  : null}
                  <p className="min-w-0 text-sm font-black tabular-nums text-[#2e2a58]">
                    {hasActiveFilters ? `${filteredPackages.length}/${packages.length}` : packages.length} รายการ
                  </p>
                </div>
              </div>

              <div id="laundry-packages-filter-panel" className={cn("space-y-3", filterOpen ? "block" : "hidden")}>
                <div className={cn(laundryDashboardSegmentShellClass, "w-full flex-wrap justify-start")} role="tablist" aria-label="กรองตามสถานะ">
                  {statusChipOptions.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      role="tab"
                      aria-selected={statusFilter === opt.key}
                      onClick={() => setStatusFilter(opt.key)}
                      className={laundryDashboardSegmentBtnClass(statusFilter === opt.key)}
                    >
                      {opt.label} ({opt.count})
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                  <label className="min-w-0 flex-1 sm:max-w-[20rem]" htmlFor="laundry-package-filter-keyword">
                    <span className="text-xs font-bold text-[#4d47b6]">ค้นหาแพ็กเกจ</span>
                    <input
                      id="laundry-package-filter-keyword"
                      className={cn(laundryFieldClass, "mt-1")}
                      placeholder="ชื่อหรือคำอธิบาย"
                      value={filterKeyword}
                      onChange={(e) => setFilterKeyword(e.target.value)}
                    />
                  </label>
                  {hasActiveFilters ?
                    <button
                      type="button"
                      onClick={() => {
                        setFilterKeyword("");
                        setStatusFilter("ALL");
                      }}
                      className={cn(laundryDashboardSegmentBtnClass(false), "h-11 min-h-[44px] px-4")}
                    >
                      ล้างกรอง
                    </button>
                  : null}
                </div>
              </div>
            </section>

            {filteredPackages.length === 0 ?
              <p className={cn(laundryOffersEmptyStateClass, "py-8 text-center text-sm text-amber-950")}>
                ไม่พบแพ็กเกจ — ปรับตัวกรอง
              </p>
            : <ul className={cn(laundryPackageTabListGridClass, "list-none p-0")} aria-label="รายการแพ็กเกจซักผ้า">
                {filteredPackages.map((p) => (
                  <li key={p.id} className="min-w-0">
                    <LaundryPackageCard
                      packagesTabRowLayout
                      pkg={p}
                      onView={() => setViewPackage(p)}
                      onEdit={() => setPackageModal(p)}
                      onDelete={() => void deletePackageRow(p)}
                    />
                  </li>
                ))}
              </ul>
            }
          </>
        ) : null}
      </div>

      <LaundryPackageEditorModal
        open={packageModal !== null}
        onClose={() => setPackageModal(null)}
        editingPackage={packageModal === "create" ? null : packageModal}
        repo={repo}
        onSaved={() => void load()}
      />
      <LaundryPackageViewModal pkg={viewPackage} onClose={() => setViewPackage(null)} />
    </>
  );

  if (embedded) {
    return <div className={laundrySectionFirstClass}>{body}</div>;
  }

  return (
    <AppDashboardSection tone="slate">
      {body}
    </AppDashboardSection>
  );
}
