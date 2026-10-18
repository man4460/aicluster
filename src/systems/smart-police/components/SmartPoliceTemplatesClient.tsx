"use client";

import Link from "next/link";
import { AppEmptyState } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { SMART_POLICE_STATEMENT_TEMPLATES } from "@/lib/smart-police/form-templates";
import {
  smartPoliceCardHeaderRowClass,
  smartPoliceCardTitleClass,
  smartPoliceCardTitleRowClass,
  smartPoliceListRowAccentClass,
  smartPoliceMutedTextClass,
  smartPoliceFillPanelClass,
  smartPoliceFillScrollBodyClass,
  smartPoliceOutlineButtonClass,
  smartPolicePageStackClass,
  smartPolicePanelClass,
  smartPolicePanelSectionClass,
  smartPolicePrimaryButtonClass,
  smartPoliceScrollListClass,
} from "@/systems/smart-police/lib/ui-tokens";

const TONE_BY_SLUG = {
  "statement-complainant": "violet",
  "statement-suspect": "rose",
  "statement-witness": "sky",
} as const;

export function SmartPoliceTemplatesClient() {
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
            <h2 className={smartPoliceCardTitleClass}>แม่แบบคำให้การ</h2>
            <span className="text-[11px] font-semibold tabular-nums text-[#66638c]">
              {SMART_POLICE_STATEMENT_TEMPLATES.length}
            </span>
          </div>
        </div>

        <div className={cn(smartPoliceMutedTextClass, "mt-2 shrink-0 space-y-1")}>
          <p>
            กด <strong className="text-[#1e1b4b]">ดูแม่แบบ / ทดลองพิมพ์</strong> เพื่อเปิดฟอร์มราชการจริงแล้วพิมพ์ทดสอบได้ —
            ใช้ในคดีจริงให้ไปที่บุคคลในคดีแล้วกด «คำให้การ»
          </p>
          <p>
            คลังไฟล์เปล่าทั้งหมดอยู่ที่{" "}
            <Link href="/dashboard/smart-police/forms" className="font-semibold text-[#5b61ff] underline">
              แบบฟอร์ม
            </Link>
          </p>
        </div>

        <div className={cn(smartPoliceFillScrollBodyClass, "mt-3")}>
          {SMART_POLICE_STATEMENT_TEMPLATES.length === 0 ? (
            <AppEmptyState tone="violet">ยังไม่มีแม่แบบ</AppEmptyState>
          ) : (
            <ul className={cn(smartPoliceScrollListClass, "space-y-2")}>
              {SMART_POLICE_STATEMENT_TEMPLATES.map((t) => {
                const previewHref = `/dashboard/smart-police/templates/preview/${t.slug}`;
                const fileHref = `/dashboard/smart-police/templates/${t.blankFormId}`;
                return (
                  <li key={t.slug} className={cn(smartPoliceListRowAccentClass(TONE_BY_SLUG[t.slug]), "gap-2")}>
                    <Link href={previewHref} className="min-w-0 flex-1 text-left outline-none">
                      <p className="text-[10px] font-bold text-[#4d47b6]">แม่แบบราชการ · กดเพื่อดูและพิมพ์ทดลอง</p>
                      <p className="text-[13px] font-semibold text-[#1e1b4b] underline-offset-2 group-hover:underline">
                        {t.title}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-snug text-[#66638c]">{t.description}</p>
                    </Link>
                    <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-center">
                      <Link
                        href={previewHref}
                        className={cn(smartPolicePrimaryButtonClass, "min-h-8 whitespace-nowrap")}
                      >
                        ดูแม่แบบ
                      </Link>
                      <Link
                        href={fileHref}
                        className={cn(smartPoliceOutlineButtonClass, "min-h-8 whitespace-nowrap")}
                      >
                        ไฟล์ต้นฉบับ
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
