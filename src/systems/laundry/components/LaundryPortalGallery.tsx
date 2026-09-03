"use client";

import { useEffect, useMemo, useState } from "react";
import { AppImageThumb } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { LaundryPortalSection } from "@/systems/laundry/components/LaundryPortalSection";
import {
  LAUNDRY_PORTAL_GALLERY_PAGE_SIZE_DESKTOP,
  LAUNDRY_PORTAL_GALLERY_PAGE_SIZE_MOBILE,
  LAUNDRY_PORTAL_GALLERY_PAGE_SIZE_TABLET,
} from "@/systems/laundry/lib/portal-media";
import {
  laundryOutlineButtonClass,
  laundryPairedBtnClass,
  laundryPrimaryButtonClass,
} from "@/systems/laundry/lib/ui-tokens";

function useLaundryGalleryPageSize(): number {
  const [size, setSize] = useState(LAUNDRY_PORTAL_GALLERY_PAGE_SIZE_DESKTOP);

  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 639px)");
    const mqTablet = window.matchMedia("(min-width: 640px) and (max-width: 1023px)");
    const sync = () => {
      if (mqMobile.matches) setSize(LAUNDRY_PORTAL_GALLERY_PAGE_SIZE_MOBILE);
      else if (mqTablet.matches) setSize(LAUNDRY_PORTAL_GALLERY_PAGE_SIZE_TABLET);
      else setSize(LAUNDRY_PORTAL_GALLERY_PAGE_SIZE_DESKTOP);
    };
    sync();
    mqMobile.addEventListener("change", sync);
    mqTablet.addEventListener("change", sync);
    return () => {
      mqMobile.removeEventListener("change", sync);
      mqTablet.removeEventListener("change", sync);
    };
  }, []);

  return size;
}

export function LaundryPortalGallery({
  urls,
  onOpenAt,
}: {
  urls: string[];
  onOpenAt: (index: number) => void;
}) {
  const pageSize = useLaundryGalleryPageSize();
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(urls.length / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, pageCount - 1)));
  }, [pageCount, pageSize]);

  const slice = useMemo(() => {
    const start = page * pageSize;
    return urls.slice(start, start + pageSize).map((url, i) => ({ url, index: start + i }));
  }, [urls, page, pageSize]);

  if (urls.length === 0) {
    return (
      <LaundryPortalSection id="gallery" title="แกลเลอรี">
        <p className="text-sm font-semibold text-[#66638c]">ยังไม่มีรูป</p>
      </LaundryPortalSection>
    );
  }

  return (
    <LaundryPortalSection id="gallery" title="แกลเลอรี">
      <ul className="grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 lg:grid-cols-4">
        {slice.map(({ url, index }) => (
          <li key={`${url}-${index}`}>
            <AppImageThumb
              src={url}
              alt={`ภาพร้าน ${index + 1}`}
              onOpen={() => onOpenAt(index)}
              className="h-36 w-full sm:h-40"
            />
          </li>
        ))}
      </ul>

      {pageCount > 1 ?
        <nav
          className="flex flex-wrap items-center justify-between gap-3 pt-2"
          aria-label="หน้าแกลเลอรี"
        >
          <p className="text-xs font-semibold text-[#66638c]">
            หน้า {page + 1} / {pageCount}
            <span className="text-slate-400"> · {urls.length} รูป</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cn(laundryOutlineButtonClass, laundryPairedBtnClass)}
              disabled={page <= 0}
              aria-label="หน้าก่อนหน้า"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ก่อนหน้า
            </button>
            <button
              type="button"
              className={cn(
                page >= pageCount - 1 ? laundryOutlineButtonClass : laundryPrimaryButtonClass,
                laundryPairedBtnClass,
              )}
              disabled={page >= pageCount - 1}
              aria-label="หน้าถัดไป"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              ถัดไป
            </button>
          </div>
        </nav>
      : null}
    </LaundryPortalSection>
  );
}
