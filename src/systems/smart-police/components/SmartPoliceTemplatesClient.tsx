"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppEmptyState } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { SMART_POLICE_BLANK_FORM_CATEGORY_ORDER } from "@/lib/smart-police/blank-forms-catalog";
import {
  smartPoliceCardHeaderRowClass,
  smartPoliceCardTitleClass,
  smartPoliceCardTitleRowClass,
  smartPoliceFieldClass,
  smartPoliceFilterGroupDividerClass,
  smartPoliceFilterTextClass,
  smartPoliceFilterTextRowClass,
  smartPoliceHeaderActionShellClass,
  smartPoliceListRowAccentClass,
  smartPoliceMutedTextClass,
  smartPoliceFillPanelClass,
  smartPoliceFillScrollBodyClass,
  smartPoliceOutlineButtonClass,
  smartPolicePageStackClass,
  smartPolicePanelClass,
  smartPolicePanelSectionClass,
  smartPolicePrimaryIconButtonClass,
  smartPoliceScrollListClass,
} from "@/systems/smart-police/lib/ui-tokens";

type FileKindFilter = "" | "pdf" | "docx";

type FormTemplateListItem = {
  id: string;
  category: string;
  title: string;
  originalTitle: string;
  fileName: string;
  fileKind: "pdf" | "docx" | "other";
  sortOrder: number;
  hasOverride: boolean;
  isActive: boolean;
  updatedAt: string | null;
};

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 5h16M7 12h10M10 19h4" strokeLinecap="round" />
    </svg>
  );
}

function IconOpen({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 5h10v10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 5L9 15" strokeLinecap="round" />
      <path d="M5 9v10h10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SmartPoliceTemplatesClient() {
  const [templates, setTemplates] = useState<FormTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(true);
  const [category, setCategory] = useState("");
  const [fileKind, setFileKind] = useState<FileKindFilter>("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/smart-police/form-templates", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { templates: FormTemplateListItem[] };
    setTemplates(data.templates);
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of templates) {
      map.set(t.category, (map.get(t.category) ?? 0) + 1);
    }
    return map;
  }, [templates]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return templates.filter((item) => {
      if (category && item.category !== category) return false;
      if (fileKind && item.fileKind !== fileKind) return false;
      if (!needle) return true;
      return (
        item.title.toLowerCase().includes(needle) ||
        item.category.toLowerCase().includes(needle) ||
        item.fileName.toLowerCase().includes(needle)
      );
    });
  }, [templates, category, fileKind, q]);

  const filtersActive = Boolean(category || fileKind || q.trim());

  function clearFilters() {
    setCategory("");
    setFileKind("");
    setQ("");
  }

  return (
    <div className={smartPolicePageStackClass}>
      <section
        className={cn(
          smartPolicePanelClass,
          smartPolicePanelSectionClass,
          smartPoliceFillPanelClass,
        )}
      >
        <div className={cn(smartPoliceCardHeaderRowClass, "shrink-0")}>
          <div className={smartPoliceCardTitleRowClass}>
            <h2 className={smartPoliceCardTitleClass}>แม่แบบ</h2>
            {!loading ? (
              <span className="text-[11px] font-semibold tabular-nums text-[#66638c]">
                {filtered.length}/{templates.length}
              </span>
            ) : null}
          </div>
          <div className={smartPoliceHeaderActionShellClass}>
            <button
              type="button"
              aria-expanded={filterOpen}
              aria-controls="sp-templates-filter-panel"
              aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
              title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
              className={cn(
                smartPoliceOutlineButtonClass,
                "relative border-transparent bg-transparent shadow-none",
                filterOpen && "bg-white text-[#4d47b6] shadow-sm",
                filtersActive && !filterOpen && "bg-amber-50 text-amber-800",
              )}
              onClick={() => setFilterOpen((o) => !o)}
            >
              <FilterIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
              {filtersActive && !filterOpen ? (
                <span
                  className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500"
                  aria-hidden
                />
              ) : null}
            </button>
          </div>
        </div>

        <div
          id="sp-templates-filter-panel"
          className={cn("mt-2 shrink-0 space-y-1.5", filterOpen ? "block" : "hidden")}
        >
          <input
            className={smartPoliceFieldClass}
            placeholder="ค้นหาชื่อแม่แบบ / ไฟล์"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="ค้นหาแม่แบบ"
          />
          <div className={smartPoliceFilterTextRowClass} role="tablist" aria-label="กรองหมวด">
            <button
              type="button"
              role="tab"
              aria-selected={!category}
              className={smartPoliceFilterTextClass(!category)}
              onClick={() => setCategory("")}
            >
              ทั้งหมด
            </button>
            {SMART_POLICE_BLANK_FORM_CATEGORY_ORDER.filter((c) => (categoryCounts.get(c) ?? 0) > 0).map(
              (c) => (
                <span key={c} className="inline-flex items-center gap-x-2">
                  <span className={smartPoliceFilterGroupDividerClass} aria-hidden />
                  <button
                    type="button"
                    role="tab"
                    aria-selected={category === c}
                    className={smartPoliceFilterTextClass(category === c)}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                    <span className="ml-1 tabular-nums opacity-70">{categoryCounts.get(c)}</span>
                  </button>
                </span>
              ),
            )}
          </div>
          <div className={smartPoliceFilterTextRowClass} role="tablist" aria-label="ชนิดไฟล์">
            {(
              [
                { key: "" as const, label: "ทุกชนิด" },
                { key: "docx" as const, label: "Word" },
                { key: "pdf" as const, label: "PDF" },
              ] as const
            ).map((opt, idx) => (
              <span key={opt.key || "all"} className="inline-flex items-center gap-x-2">
                {idx > 0 ? <span className={smartPoliceFilterGroupDividerClass} aria-hidden /> : null}
                <button
                  type="button"
                  role="tab"
                  aria-selected={fileKind === opt.key}
                  className={smartPoliceFilterTextClass(fileKind === opt.key)}
                  onClick={() => setFileKind(opt.key)}
                >
                  {opt.label}
                </button>
              </span>
            ))}
            {filtersActive ? (
              <>
                <span className={smartPoliceFilterGroupDividerClass} aria-hidden />
                <button type="button" className={smartPoliceFilterTextClass(false)} onClick={clearFilters}>
                  ล้างกรอง
                </button>
              </>
            ) : null}
          </div>
          <p className={smartPoliceMutedTextClass}>
            แม่แบบมาจากแบบฟอร์มเปล่า — คลิกเปิดดู แล้วแก้เนื้อหา/หมายเหตุของสถานีได้
          </p>
        </div>

        <div className={cn(smartPoliceFillScrollBodyClass, "mt-2")}>
          {loading ? (
            <p className={smartPoliceMutedTextClass}>กำลังโหลด…</p>
          ) : filtered.length === 0 ? (
            <AppEmptyState tone="violet">
              {filtersActive ? "ไม่พบแม่แบบที่ตรงเงื่อนไข" : "ยังไม่มีแม่แบบ"}
            </AppEmptyState>
          ) : (
            <ul className={cn(smartPoliceScrollListClass, "space-y-2")}>
              {filtered.map((t) => {
                const tone =
                  t.fileKind === "pdf" ? "rose" : t.hasOverride ? "violet" : "emerald";
                return (
                  <li key={t.id}>
                    <Link
                      href={`/dashboard/smart-police/templates/${t.id}`}
                      className={cn(
                        smartPoliceListRowAccentClass(tone),
                        "no-underline transition hover:brightness-[0.98]",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-[10px] font-bold text-[#4d47b6]">
                            {t.category}
                            {t.hasOverride ? " · แก้แล้ว" : ""}
                            {!t.isActive ? " · ปิด" : ""}
                          </p>
                          <p className="text-[13px] font-semibold text-[#1e1b4b]">{t.title}</p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 text-[11px] font-bold",
                            t.fileKind === "pdf" ? "text-rose-600" : "text-emerald-600",
                          )}
                        >
                          {t.fileKind === "pdf" ? "PDF" : "Word"}
                        </span>
                        <span
                          className={smartPolicePrimaryIconButtonClass}
                          aria-hidden
                          title="เปิดดู"
                        >
                          <IconOpen className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
