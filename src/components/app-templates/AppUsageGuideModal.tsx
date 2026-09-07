"use client";

import { FormModal } from "@/components/ui/FormModal";
import {
  type AppUsageGuideSection,
  withAppUsageGuideStandardSections,
} from "@/components/app-templates/app-usage-guide-shared";

function Section({ title, content }: AppUsageGuideSection) {
  return (
    <section className="scroll-mt-4 border-b border-[#ecebff] pb-5 last:border-b-0 last:pb-0">
      <h3 className="text-base font-bold text-[#2e2a58]">{title}</h3>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-[#5f5a8a]">{content}</div>
    </section>
  );
}

/**
 * คู่มือการใช้งาน — ใช้ FormModal + mobileCentered (กึ่งกลางจอบนมือถือ)
 * แนบท้ายอัตโนมัติ: มือถือ/แถบหัว + สร้างแอปหน้าจอโฮม iOS/Android
 * กฎ: `.cursor/rules/app-usage-guide-modal.mdc`
 */
export function AppUsageGuideModal({
  open,
  onClose,
  title,
  subtitle,
  sections,
  includeChromeGuide = true,
  includeHomeScreenGuide = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  sections: AppUsageGuideSection[];
  /** แนบท้ายคู่มือ dock / ยุบหัว / โทเคน (ค่าเริ่ม true) */
  includeChromeGuide?: boolean;
  /** แนบท้ายขั้นตอนติดตั้งแอปหน้าจอโฮม iOS + Android (ค่าเริ่ม true) */
  includeHomeScreenGuide?: boolean;
}) {
  const merged = withAppUsageGuideStandardSections(sections, {
    includeChrome: includeChromeGuide,
    includeHomeScreen: includeHomeScreenGuide,
  });

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={title}
      description={subtitle}
      size="lg"
      mobileCentered
      footer={
        <div className="flex w-full justify-end">
          <button
            type="button"
            onClick={onClose}
            className="app-btn-primary min-h-[48px] w-full rounded-2xl px-6 text-sm font-bold sm:w-auto"
          >
            ปิด
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {merged.map((section) => (
          <Section key={section.title} title={section.title} content={section.content} />
        ))}
      </div>
    </FormModal>
  );
}
