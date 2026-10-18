"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  smartPoliceBlankFormHref,
  smartPoliceBlankFormsGrouped,
  type SmartPoliceBlankFormItem,
} from "@/lib/smart-police/blank-forms-catalog";
import {
  smartPoliceCardHeaderRowClass,
  smartPoliceCardMetaClass,
  smartPoliceCardTitleClass,
  smartPoliceFieldClass,
  smartPoliceFilterGroupDividerClass,
  smartPoliceFilterTextClass,
  smartPoliceFilterTextRowClass,
  smartPoliceMutedTextClass,
  smartPolicePageStackClass,
  smartPolicePanelClass,
  smartPolicePanelSectionClass,
  smartPoliceSectionHeadingClass,
} from "@/systems/smart-police/lib/ui-tokens";

function extLabel(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "PDF";
  if (ext === "docx" || ext === "doc") return "Word";
  return (ext ?? "").toUpperCase();
}

export function SmartPoliceFormsClient() {
  const groups = useMemo(() => smartPoliceBlankFormsGrouped(), []);
  const [category, setCategory] = useState<string>("");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return groups
      .filter((g) => !category || g.category === category)
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => {
          if (!needle) return true;
          return item.title.toLowerCase().includes(needle) || item.category.toLowerCase().includes(needle);
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, category, q]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);
  const shown = filtered.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className={smartPolicePageStackClass}>
      <section className={cn(smartPolicePanelClass, smartPolicePanelSectionClass)}>
        <div className={smartPoliceCardHeaderRowClass}>
          <div className="min-w-0">
            <h2 className={smartPoliceCardTitleClass}>แบบฟอร์ม</h2>
            <p className={smartPoliceCardMetaClass}>
              แบบฟอร์มเปล่า {total} รายการ · ดาวน์โหลด Word/PDF ไปใช้กรอกนอกระบบ
            </p>
          </div>
          <p className={cn(smartPoliceMutedTextClass, "shrink-0 text-[11px] tabular-nums")}>
            แสดง {shown}/{total}
          </p>
        </div>

        <div className="mt-2 space-y-2">
          <input
            className={smartPoliceFieldClass}
            placeholder="ค้นหาชื่อแบบฟอร์ม"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="ค้นหาแบบฟอร์ม"
          />
          <div className={smartPoliceFilterTextRowClass} role="tablist" aria-label="หมวดแบบฟอร์ม">
            <button
              type="button"
              role="tab"
              aria-selected={!category}
              className={smartPoliceFilterTextClass(!category)}
              onClick={() => setCategory("")}
            >
              ทั้งหมด
            </button>
            {groups.map((g) => (
              <span key={g.category} className="inline-flex items-center gap-x-2">
                <span className={smartPoliceFilterGroupDividerClass} aria-hidden />
                <button
                  type="button"
                  role="tab"
                  aria-selected={category === g.category}
                  className={smartPoliceFilterTextClass(category === g.category)}
                  onClick={() => setCategory(g.category)}
                >
                  {g.category}
                  <span className="ml-0.5 tabular-nums opacity-70">{g.items.length}</span>
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-5">
          {filtered.length === 0 ? (
            <p className={smartPoliceMutedTextClass}>ไม่พบแบบฟอร์มที่ตรงเงื่อนไข</p>
          ) : (
            filtered.map((g) => (
              <div key={g.category}>
                <h3 className={cn(smartPoliceSectionHeadingClass, "mb-2")}>{g.category}</h3>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {g.items.map((item) => (
                    <li key={item.id} className="min-w-0">
                      <FormDownloadLink item={item} />
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function FormDownloadLink({ item }: { item: SmartPoliceBlankFormItem }) {
  const href = smartPoliceBlankFormHref(item.fileName);
  return (
    <a
      href={href}
      download={item.fileName}
      className={cn(
        "flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-emerald-300/80 bg-white px-3 py-2",
        "text-[12px] font-semibold text-[#1e1b4b] shadow-sm transition",
        "hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-900",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
      <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
        {extLabel(item.fileName)}
      </span>
    </a>
  );
}
