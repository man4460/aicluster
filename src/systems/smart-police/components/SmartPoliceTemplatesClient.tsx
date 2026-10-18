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
            ในคดี ไปที่ <strong className="text-[#1e1b4b]">บุคคล</strong> แล้วกด{" "}
            <strong className="text-[#1e1b4b]">คำให้การ</strong> — ระบบเปิดแบบจำลองฟอร์ม
            เติมชื่อ·ข้อหา·สถานีจากคดี แล้วให้พนักงานสอบสวน{" "}
            <strong className="text-[#1e1b4b]">พิมพ์ถาม–ตอบ</strong> ได้เลย จากนั้นบันทึกและพิมพ์ลงลายเซ็น
          </p>
          <p>
            ดาวน์โหลดไฟล์เปล่าอยู่ที่เมนู{" "}
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
              {SMART_POLICE_STATEMENT_TEMPLATES.map((t) => (
                <li key={t.slug} className={smartPoliceListRowAccentClass(TONE_BY_SLUG[t.slug])}>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-[10px] font-bold text-[#4d47b6]">ใช้ในคดี · ถาม/ตอบ</p>
                    <p className="text-[13px] font-semibold text-[#1e1b4b]">{t.title}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-[#66638c]">{t.description}</p>
                  </div>
                  <Link
                    href="/dashboard/smart-police/cases"
                    className={cn(smartPoliceOutlineButtonClass, "shrink-0")}
                  >
                    ไปที่คดี
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
