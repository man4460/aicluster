"use client";

import { FormModal } from "@/components/ui/FormModal";

type AppUsageGuideSection = {
  title: string;
  content: React.ReactNode;
};

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
 * กฎ: `.cursor/rules/app-usage-guide-modal.mdc`
 */
export function AppUsageGuideModal({
  open,
  onClose,
  title,
  subtitle,
  sections,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  sections: AppUsageGuideSection[];
}) {
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
        {sections.map((section) => (
          <Section key={section.title} title={section.title} content={section.content} />
        ))}
      </div>
    </FormModal>
  );
}
