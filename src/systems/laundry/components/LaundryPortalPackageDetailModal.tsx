"use client";

import { useEffect } from "react";
import { cn } from "@/lib/cn";
import {
  laundryPortalPackagePriceLabel,
  type LaundryPortalPackageItem,
} from "@/systems/laundry/components/LaundryPortalPackageCard";
import {
  laundryCardSurfaceRadiusClass,
  laundryCompactOutlineButtonClass,
  laundryPortalPrimaryBtnClass,
  laundryPortalSectionDividerClass,
} from "@/systems/laundry/lib/ui-tokens";

export function LaundryPortalPackageDetailModal({
  pkg,
  onClose,
  onRequestPickup,
}: {
  pkg: LaundryPortalPackageItem | null;
  onClose: () => void;
  onRequestPickup: (pkg: LaundryPortalPackageItem) => void;
}) {
  useEffect(() => {
    if (!pkg) return;
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
  }, [onClose, pkg]);

  if (!pkg) return null;

  const tiers = pkg.basket_tiers?.filter((t) => t.label.trim()) ?? [];

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-[#1e1b4b]/40 p-3 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="ปิด"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="laundry-portal-pkg-detail-title"
        className={cn(
          laundryCardSurfaceRadiusClass,
          "relative z-10 flex max-h-[min(90dvh,640px)] w-full max-w-md flex-col overflow-hidden border border-slate-200/90 bg-white shadow-xl sm:max-w-lg",
        )}
      >
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-gradient-to-br from-sky-50 to-indigo-100">
          {pkg.image_url ?
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pkg.image_url} alt="" className="h-full w-full object-cover" />
          : <div className="flex h-full items-center justify-center text-indigo-300">
              <svg viewBox="0 0 24 24" className="h-14 w-14" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path d="M4 7h16v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
                <path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
          }
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/70 bg-white/90 text-lg font-bold text-[#4d47b6] shadow-sm"
            aria-label="ปิด"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
          <h2 id="laundry-portal-pkg-detail-title" className="text-lg font-black leading-snug text-[#1e1b4b] sm:text-xl">
            {pkg.name}
          </h2>
          <p className="mt-2 text-base font-bold tabular-nums text-indigo-600">{laundryPortalPackagePriceLabel(pkg)}</p>

          {pkg.description?.trim() ?
            <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-[#66638c]">
              {pkg.description.trim()}
            </p>
          : null}

          {tiers.length > 0 ?
            <div className={cn("mt-4", laundryPortalSectionDividerClass, "pt-4")}>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#66638c]">ขนาด / ราคา</p>
              <ul className="mt-2 space-y-1.5">
                {tiers.map((t, i) => (
                  <li
                    key={`${t.label}-${i}`}
                    className="flex items-center justify-between gap-2 text-sm font-semibold text-[#2e2a58]"
                  >
                    <span>{t.label}</span>
                    <span className="tabular-nums text-indigo-600">฿{t.price.toLocaleString("th-TH")}</span>
                  </li>
                ))}
              </ul>
            </div>
          : null}
        </div>

        <div className="flex shrink-0 gap-2 border-t border-slate-200/80 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          <button type="button" onClick={onClose} className={cn(laundryCompactOutlineButtonClass, "flex-1")}>
            ปิด
          </button>
          <button
            type="button"
            onClick={() => onRequestPickup(pkg)}
            className={cn(laundryPortalPrimaryBtnClass, "flex-1")}
          >
            ขอบริการรับ-ส่งแพ็กนี้
          </button>
        </div>
      </div>
    </div>
  );
}
