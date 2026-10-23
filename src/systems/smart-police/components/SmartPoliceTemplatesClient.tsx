"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppEmptyState } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  SMART_POLICE_BLANK_FORMS,
  SMART_POLICE_BLANK_FORM_CATEGORY_ORDER,
} from "@/lib/smart-police/blank-forms-catalog";
import {
  SMART_POLICE_OFFICIAL_FORM_TEMPLATES,
  type OfficialFormTemplateMeta,
} from "@/lib/smart-police/form-templates";
import {
  smartPoliceCardHeaderRowClass,
  smartPoliceCardMetaClass,
  smartPoliceCardTitleClass,
  smartPoliceCardTitleRowClass,
  smartPoliceFieldClass,
  smartPoliceFilterGroupDividerClass,
  smartPoliceFilterTextClass,
  smartPoliceFilterTextRowClass,
  smartPoliceHeaderActionShellClass,
  smartPoliceListRowAccentClass,
  smartPoliceFillBodyClass,
  smartPoliceFillPanelClass,
  smartPoliceOutlineButtonClass,
  smartPolicePageStackClass,
  smartPolicePanelClass,
  smartPolicePanelSectionClass,
  smartPolicePrimaryButtonClass,
  smartPoliceScrollListClass,
} from "@/systems/smart-police/lib/ui-tokens";

type FileKind = "" | "pdf" | "docx";

const TONE_BY_SLUG: Record<string, "violet" | "rose" | "sky" | "amber"> = {
  "statement-complainant": "violet",
  "statement-suspect": "rose",
  "statement-witness": "sky",
  "property-damaged": "amber",
  "property-damaged-recovered": "amber",
  "property-damaged-unrecovered": "amber",
  "exhibit-list": "amber",
  "scene-map": "sky",
  "withdraw-complaint": "violet",
  "compensation-settlement": "amber",
  "victim-rights": "sky",
  "oral-plea": "rose",
  "arrest-record": "rose",
  "charge-notice": "rose",
  "rights-notice": "rose",
  "case-photo": "sky",
  "photo-id": "sky",
  "lineup-id": "sky",
  "case-cover": "violet",
  "inquiry-report": "violet",
  "inquiry-memo": "violet",
  "inquiry-docket": "violet",
  "scene-inspect": "sky",
  "case-progress": "violet",
  "injury-referral": "sky",
  "forensic-request": "amber",
  "custody-log": "rose",
  "bail-bond": "amber",
  "investigate-notice": "sky",
  "official-memo": "violet",
};

type TemplateRow = OfficialFormTemplateMeta & {
  category: string;
  fileName: string;
};

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 5h16M7 12h10M10 19h4" strokeLinecap="round" />
    </svg>
  );
}

function fileKindOf(fileName: string): "pdf" | "docx" | "other" {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "docx" || ext === "doc") return "docx";
  return "other";
}

function extLabel(fileName: string): string {
  const kind = fileKindOf(fileName);
  if (kind === "pdf") return "PDF";
  if (kind === "docx") return "Word";
  return (fileName.split(".").pop() ?? "").toUpperCase();
}

function templateRows(): TemplateRow[] {
  return SMART_POLICE_OFFICIAL_FORM_TEMPLATES.map((t) => {
    const blank = SMART_POLICE_BLANK_FORMS.find((f) => f.id === t.blankFormId);
    return {
      ...t,
      category: blank?.category ?? "เอกสารทั่วไป",
      fileName: blank?.fileName ?? "",
    };
  });
}

export function SmartPoliceTemplatesClient() {
  const all = useMemo(() => templateRows(), []);
  const [filterOpen, setFilterOpen] = useState(true);
  const [category, setCategory] = useState("");
  const [fileKind, setFileKind] = useState<FileKind>("");
  const [q, setQ] = useState("");

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of all) {
      map.set(t.category, (map.get(t.category) ?? 0) + 1);
    }
    return map;
  }, [all]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all
      .filter((item) => {
        if (category && item.category !== category) return false;
        if (fileKind && fileKindOf(item.fileName) !== fileKind) return false;
        if (!needle) return true;
        return (
          item.title.toLowerCase().includes(needle) ||
          item.category.toLowerCase().includes(needle) ||
          item.fileName.toLowerCase().includes(needle)
        );
      })
      .slice()
      .sort((a, b) => {
        const ca = SMART_POLICE_BLANK_FORM_CATEGORY_ORDER.indexOf(
          a.category as (typeof SMART_POLICE_BLANK_FORM_CATEGORY_ORDER)[number],
        );
        const cb = SMART_POLICE_BLANK_FORM_CATEGORY_ORDER.indexOf(
          b.category as (typeof SMART_POLICE_BLANK_FORM_CATEGORY_ORDER)[number],
        );
        const c = (ca < 0 ? 999 : ca) - (cb < 0 ? 999 : cb);
        if (c !== 0) return c;
        return a.title.localeCompare(b.title, "th");
      });
  }, [all, category, fileKind, q]);

  const total = all.length;
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
            <span className={smartPoliceCardMetaClass}>
              {filtered.length}/{total}
            </span>
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
            placeholder="ค้นหาชื่อแม่แบบ / หมวด / ชื่อไฟล์"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="ค้นหาแม่แบบ"
          />
          <div className={smartPoliceFilterTextRowClass} role="tablist" aria-label="กรองแม่แบบ">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1" role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={!category}
                className={smartPoliceFilterTextClass(!category)}
                onClick={() => setCategory("")}
              >
                หมวดทั้งหมด
              </button>
              {SMART_POLICE_BLANK_FORM_CATEGORY_ORDER.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={category === cat}
                  className={smartPoliceFilterTextClass(category === cat)}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                  <span className="ml-0.5 tabular-nums opacity-70">{categoryCounts.get(cat) ?? 0}</span>
                </button>
              ))}
            </div>
            <span className={smartPoliceFilterGroupDividerClass} aria-hidden />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1" role="presentation">
              {(
                [
                  { key: "" as const, label: "ทุกไฟล์" },
                  { key: "docx" as const, label: "Word" },
                  { key: "pdf" as const, label: "PDF" },
                ] as { key: FileKind; label: string }[]
              ).map((chip) => (
                <button
                  key={`fk-${chip.key || "all"}`}
                  type="button"
                  role="tab"
                  aria-selected={fileKind === chip.key}
                  className={smartPoliceFilterTextClass(fileKind === chip.key)}
                  onClick={() => setFileKind(chip.key)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            {filtersActive ? (
              <>
                <span className={smartPoliceFilterGroupDividerClass} aria-hidden />
                <button
                  type="button"
                  className={cn(smartPoliceFilterTextClass(false), "text-rose-600 hover:text-rose-700")}
                  onClick={clearFilters}
                >
                  ล้างกรอง
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className={smartPoliceFillBodyClass}>
          {filtered.length === 0 ? (
            <AppEmptyState tone="violet">
              {filtersActive ? "ไม่พบแม่แบบที่ตรงเงื่อนไข" : "ยังไม่มีแม่แบบ"}
            </AppEmptyState>
          ) : (
            <ul className={cn(smartPoliceScrollListClass, "space-y-2")}>
              {filtered.map((t) => {
                const previewHref = `/dashboard/smart-police/templates/preview/${t.slug}`;
                const kind = fileKindOf(t.fileName);
                return (
                  <li key={t.slug} className={cn(smartPoliceListRowAccentClass(TONE_BY_SLUG[t.slug] ?? "violet"), "gap-2")}>
                    <Link href={previewHref} className="min-w-0 flex-1 text-left outline-none">
                      <p className="text-[10px] font-bold text-[#4d47b6]">{t.category}</p>
                      <p className="text-[13px] font-semibold text-[#1e1b4b] underline-offset-2 hover:underline">
                        {t.title}
                      </p>
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      {t.fileName ? (
                        <span
                          className={cn(
                            "inline-flex items-center text-[11px] font-bold",
                            kind === "pdf" ? "text-rose-600" : "text-emerald-600",
                          )}
                        >
                          {extLabel(t.fileName)}
                        </span>
                      ) : null}
                      <Link
                        href={previewHref}
                        className={cn(smartPolicePrimaryButtonClass, "min-h-8 whitespace-nowrap")}
                      >
                        ดูแม่แบบ
                      </Link>
                    </div>
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
