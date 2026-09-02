"use client";

import { cn } from "@/lib/cn";
import { laundryPortalPackagePickCardClass } from "@/systems/laundry/lib/ui-tokens";

export type LaundryPortalPackageItem = {
  id: number;
  name: string;
  base_price: number;
  description: string;
  image_url: string | null;
  basket_tiers: { label: string; price: number }[] | null;
};

/** กริดแพ็กเกจพอร์ทัล — มือถือ 2 · คอม (`lg+`) 6 คอลัมน์ */
export const laundryPortalPackageGridClass = "grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-6";

/** พื้นที่เลื่อนเมื่อแพ็กเกจเยอะ — ขั้นตอนเลือกบริการ */
export const laundryPortalPackageGridScrollClass =
  "max-h-[min(36rem,72vh)] overflow-y-auto pb-1 sm:max-h-[min(38rem,74vh)]";

export function laundryPortalPackagePriceLabel(pkg: LaundryPortalPackageItem): string {
  const tiers = pkg.basket_tiers?.filter((t) => t.label.trim()) ?? [];
  if (tiers.length) {
    const prices = tiers.map((t) => t.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ?
        `฿${min.toLocaleString("th-TH")}`
      : `฿${min.toLocaleString("th-TH")} – ฿${max.toLocaleString("th-TH")}`;
  }
  return `฿${pkg.base_price.toLocaleString("th-TH")}`;
}

function PackageImage({ imageUrl, selected }: { imageUrl: string | null; selected?: boolean }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-sky-50 to-indigo-100">
      {imageUrl ?
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
      : <div className="flex h-full items-center justify-center text-indigo-300">
          <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-10 sm:w-10" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
            <path d="M4 7h16v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
            <path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
          </svg>
        </div>
      }
      {selected ?
        <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/20">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4" aria-hidden>
              <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      : null}
    </div>
  );
}

function PackageCardBody({ pkg }: { pkg: LaundryPortalPackageItem }) {
  return (
    <div className="space-y-0.5 p-2.5 sm:p-3">
      <p className="line-clamp-2 text-xs font-black text-[#2e2a58] sm:text-sm">{pkg.name}</p>
      {pkg.description?.trim() ?
        <p className="line-clamp-2 text-[10px] font-semibold leading-snug text-[#66638c] sm:text-[11px]">
          {pkg.description}
        </p>
      : null}
      <p className="text-[11px] font-bold text-indigo-600 sm:text-xs">{laundryPortalPackagePriceLabel(pkg)}</p>
    </div>
  );
}

/** การ์ดแพ็กเกจบนเว็บลูกค้า — คลิกเปิด popup รายละเอียด */
export function LaundryPortalPackageLinkCard({
  pkg,
  onOpenDetail,
}: {
  pkg: LaundryPortalPackageItem;
  onOpenDetail: (pkg: LaundryPortalPackageItem) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpenDetail(pkg)}
        className={laundryPortalPackagePickCardClass(false)}
        aria-label={`ดูรายละเอียด ${pkg.name}`}
      >
        <PackageImage imageUrl={pkg.image_url} />
        <PackageCardBody pkg={pkg} />
      </button>
    </li>
  );
}

/** การ์ดแพ็กเกจแบบเลือกในขั้นตอนขอรับผ้า — คลิกทั้งการ์ด (แบบ POS แดชบอร์ด) */
export function LaundryPortalPackageSelectCard({
  pkg,
  selected,
  onSelect,
}: {
  pkg: LaundryPortalPackageItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={selected ? `เลือก ${pkg.name} แล้ว` : `เลือกแพ็ก ${pkg.name}`}
        className={laundryPortalPackagePickCardClass(selected)}
      >
        <PackageImage imageUrl={pkg.image_url} selected={selected} />
        <PackageCardBody pkg={pkg} />
      </button>
    </li>
  );
}
