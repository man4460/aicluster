"use client";

import { useEffect } from "react";

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
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[min(92dvh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[#ecebff] bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#ecebff] bg-[#faf9ff] px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[#2e2a58]">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-[#66638c]">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-[#66638c] hover:bg-white hover:text-[#2e2a58]"
            aria-label="ปิดคู่มือ"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-5 sm:py-5">
          <div className="space-y-5">
            {sections.map((section) => (
              <Section key={section.title} title={section.title} content={section.content} />
            ))}
          </div>
        </div>
        <div className="shrink-0 border-t border-[#ecebff] bg-white px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="app-btn-primary min-h-[48px] w-full rounded-xl px-4 py-3 text-sm font-semibold text-white sm:w-auto"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
