"use client";

import { useMemo, useState } from "react";
import { AppEmptyState } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  SMART_POLICE_BLANK_FORMS,
  SMART_POLICE_BLANK_FORM_CATEGORY_ORDER,
  smartPoliceBlankFormHref,
  type SmartPoliceBlankFormItem,
} from "@/lib/smart-police/blank-forms-catalog";
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
  smartPoliceOutlineButtonClass,
  smartPolicePageStackClass,
  smartPolicePanelClass,
  smartPolicePanelSectionClass,
  smartPolicePrimaryButtonClass,
  smartPoliceScrollListClass,
} from "@/systems/smart-police/lib/ui-tokens";

type FileKind = "" | "pdf" | "docx";

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

export function SmartPoliceFormsClient() {
  const [filterOpen, setFilterOpen] = useState(true);
  const [category, setCategory] = useState("");
  const [fileKind, setFileKind] = useState<FileKind>("");
  const [q, setQ] = useState("");

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of SMART_POLICE_BLANK_FORMS) {
      map.set(f.category, (map.get(f.category) ?? 0) + 1);
    }
    return map;
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return SMART_POLICE_BLANK_FORMS.filter((item) => {
      if (category && item.category !== category) return false;
      if (fileKind && fileKindOf(item.fileName) !== fileKind) return false;
      if (!needle) return true;
      return (
        item.title.toLowerCase().includes(needle) ||
        item.category.toLowerCase().includes(needle) ||
        item.fileName.toLowerCase().includes(needle)
      );
    }).slice().sort((a, b) => {
      const ca = SMART_POLICE_BLANK_FORM_CATEGORY_ORDER.indexOf(
        a.category as (typeof SMART_POLICE_BLANK_FORM_CATEGORY_ORDER)[number],
      );
      const cb = SMART_POLICE_BLANK_FORM_CATEGORY_ORDER.indexOf(
        b.category as (typeof SMART_POLICE_BLANK_FORM_CATEGORY_ORDER)[number],
      );
      const c = (ca < 0 ? 999 : ca) - (cb < 0 ? 999 : cb);
      if (c !== 0) return c;
      return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "th");
    });
  }, [category, fileKind, q]);

  const total = SMART_POLICE_BLANK_FORMS.length;
  const filtersActive = Boolean(category || fileKind || q.trim());

  function clearFilters() {
    setCategory("");
    setFileKind("");
    setQ("");
  }

  return (
    <div className={smartPolicePageStackClass}>
      <section className={cn(smartPolicePanelClass, smartPolicePanelSectionClass)}>
        <div className={smartPoliceCardHeaderRowClass}>
          <div className={smartPoliceCardTitleRowClass}>
            <h2 className={smartPoliceCardTitleClass}>แบบฟอร์ม</h2>
            <span className="text-[11px] font-semibold tabular-nums text-[#66638c]">
              {filtered.length}/{total}
            </span>
          </div>
          <div className={smartPoliceHeaderActionShellClass}>
            <button
              type="button"
              aria-expanded={filterOpen}
              aria-controls="sp-forms-filter-panel"
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
          id="sp-forms-filter-panel"
          className={cn("mt-2 space-y-1.5", filterOpen ? "block" : "hidden")}
        >
          <input
            className={smartPoliceFieldClass}
            placeholder="ค้นหาชื่อแบบฟอร์ม / หมวด / ชื่อไฟล์"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="ค้นหาแบบฟอร์ม"
          />
          <div className={smartPoliceFilterTextRowClass} role="tablist" aria-label="กรองแบบฟอร์ม">
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

        <div className="mt-1.5">
          {filtered.length === 0 ? (
            <AppEmptyState tone="violet">
              {filtersActive ? "ไม่พบแบบฟอร์มที่ตรงเงื่อนไข" : "ยังไม่มีแบบฟอร์ม"}
            </AppEmptyState>
          ) : (
            <ul className={cn(smartPoliceScrollListClass, "space-y-2")}>
              {filtered.map((item) => (
                <FormRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function FormRow({ item }: { item: SmartPoliceBlankFormItem }) {
  const href = smartPoliceBlankFormHref(item.fileName);
  const kind = fileKindOf(item.fileName);
  const tone = kind === "pdf" ? "rose" : "emerald";

  return (
    <li className={smartPoliceListRowAccentClass(tone)}>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[10px] font-bold text-[#4d47b6]">{item.category}</p>
        <p className="text-[13px] font-semibold text-[#1e1b4b]">{item.title}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[10px] font-bold",
            kind === "pdf" ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800",
          )}
        >
          {extLabel(item.fileName)}
        </span>
        <a
          href={href}
          download={item.fileName}
          className={smartPolicePrimaryButtonClass}
          aria-label={`ดาวน์โหลด ${item.title}`}
        >
          ดาวน์โหลด
        </a>
      </div>
    </li>
  );
}
