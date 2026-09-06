"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { ClubEventPortalSection } from "@/systems/club-event/components/ClubEventPortalSection";
import {
  CLUB_EVENT_PORTAL_GALLERY_PAGE_SIZE_DESKTOP,
  CLUB_EVENT_PORTAL_GALLERY_PAGE_SIZE_MOBILE,
  CLUB_EVENT_PORTAL_GALLERY_PAGE_SIZE_TABLET,
} from "@/systems/club-event/lib/portal-media";
import {
  clubEventGalleryCardGridClass,
  clubEventOutlineButtonClass,
  clubEventPrimaryButtonClass,
} from "@/systems/club-event/lib/ui-tokens";

function useClubGalleryPageSize(): number {
  const [size, setSize] = useState(CLUB_EVENT_PORTAL_GALLERY_PAGE_SIZE_DESKTOP);

  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 639px)");
    const mqTablet = window.matchMedia("(min-width: 640px) and (max-width: 1023px)");
    const sync = () => {
      if (mqMobile.matches) setSize(CLUB_EVENT_PORTAL_GALLERY_PAGE_SIZE_MOBILE);
      else if (mqTablet.matches) setSize(CLUB_EVENT_PORTAL_GALLERY_PAGE_SIZE_TABLET);
      else setSize(CLUB_EVENT_PORTAL_GALLERY_PAGE_SIZE_DESKTOP);
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

export function ClubEventPortalGallery({
  urls,
  onOpenAt,
}: {
  urls: string[];
  onOpenAt: (index: number) => void;
}) {
  const pageSize = useClubGalleryPageSize();
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(urls.length / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, pageCount - 1)));
  }, [pageCount, pageSize]);

  const slice = useMemo(() => {
    const start = page * pageSize;
    return urls.slice(start, start + pageSize).map((url, i) => ({ url, index: start + i }));
  }, [urls, page, pageSize]);

  if (urls.length === 0) return null;

  return (
    <ClubEventPortalSection id="gallery" title="แกลเลอรี" titleIcon="gallery">
      <ul className={cn(clubEventGalleryCardGridClass, "list-none p-0")}>
        {slice.map(({ url, index }) => (
          <li key={`${url}-${index}`} className="min-w-0">
            <button
              type="button"
              onClick={() => onOpenAt(index)}
              className="relative block aspect-square w-full overflow-hidden rounded-lg ring-2 ring-slate-100 transition hover:ring-[#0000BF]/30"
              aria-label={`ดูภาพชมรม ${index + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover object-center" loading="lazy" />
            </button>
          </li>
        ))}
      </ul>

      {pageCount > 1 ? (
        <nav className="flex flex-wrap items-center justify-between gap-3 pt-2" aria-label="หน้าแกลเลอรี">
          <p className="text-xs font-semibold text-[#66638c]">
            หน้า {page + 1} / {pageCount}
            <span className="text-slate-400"> · {urls.length} รูป</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={clubEventOutlineButtonClass}
              disabled={page <= 0}
              aria-label="หน้าก่อนหน้า"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ก่อนหน้า
            </button>
            <button
              type="button"
              className={cn(page >= pageCount - 1 ? clubEventOutlineButtonClass : clubEventPrimaryButtonClass)}
              disabled={page >= pageCount - 1}
              aria-label="หน้าถัดไป"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              ถัดไป
            </button>
          </div>
        </nav>
      ) : null}
    </ClubEventPortalSection>
  );
}
