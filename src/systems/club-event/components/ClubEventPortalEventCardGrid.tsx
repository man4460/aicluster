"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { AppEmptyState } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import type { ClubPublicPortalEvent } from "@/lib/club-event/load-public-portal";
import {
  CLUB_EVENT_PORTAL_EVENT_COLS_DESKTOP,
  CLUB_EVENT_PORTAL_EVENT_COLS_MOBILE,
  CLUB_EVENT_PORTAL_EVENT_COLS_TABLET,
  CLUB_EVENT_PORTAL_EVENT_ROWS,
} from "@/systems/club-event/lib/portal-media";
import {
  clubEventOutlineButtonClass,
  clubEventPortalEventCardGridClass,
} from "@/systems/club-event/lib/ui-tokens";

export type ClubPortalLinkChip = {
  id: string;
  type: string;
  title: string;
  config: { eventId?: string };
  publicPath: string;
};

function pageSizeForWidth(width: number): number {
  if (width >= 1024) return CLUB_EVENT_PORTAL_EVENT_COLS_DESKTOP * CLUB_EVENT_PORTAL_EVENT_ROWS;
  if (width >= 640) return CLUB_EVENT_PORTAL_EVENT_COLS_TABLET * CLUB_EVENT_PORTAL_EVENT_ROWS;
  return CLUB_EVENT_PORTAL_EVENT_COLS_MOBILE * CLUB_EVENT_PORTAL_EVENT_ROWS;
}

function formatEventWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ClubEventPortalEventCardGrid({
  events,
  eventHref,
  linkHref,
  links = [],
  emptyLabel,
  ariaLabel,
}: {
  events: ClubPublicPortalEvent[];
  eventHref: (eventId: string) => string;
  linkHref: (path: string) => string;
  links?: ClubPortalLinkChip[];
  emptyLabel: string;
  ariaLabel: string;
}) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(
    () => CLUB_EVENT_PORTAL_EVENT_COLS_MOBILE * CLUB_EVENT_PORTAL_EVENT_ROWS,
  );

  useEffect(() => {
    const sync = () => setPageSize(pageSizeForWidth(window.innerWidth));
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const totalPages = Math.max(1, Math.ceil(events.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const slice = events.slice(safePage * pageSize, safePage * pageSize + pageSize);

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, totalPages - 1)));
  }, [totalPages, pageSize]);

  if (events.length === 0) {
    return <AppEmptyState tone="violet">{emptyLabel}</AppEmptyState>;
  }

  return (
    <div className="space-y-3" aria-label={ariaLabel}>
      <ul className={clubEventPortalEventCardGridClass}>
        {slice.map((ev) => {
          const chips = links.filter((l) => l.config?.eventId === ev.id);
          const cover = ev.coverImageUrl?.trim() || null;
          return (
            <li key={ev.id} className="flex min-w-0 flex-col gap-1.5">
              <Link
                href={eventHref(ev.id)}
                className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm transition hover:border-[#5b61ff]/35 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-slate-100">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt=""
                      className="h-full w-full object-cover object-center"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-50 to-sky-50">
                      <CalendarDays className="h-8 w-8 text-[#8b87b8]" strokeWidth={1.75} aria-hidden />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-0.5 p-2 sm:p-2.5">
                  <p className="line-clamp-2 text-[11px] font-black leading-snug text-[#1e1b4b] sm:text-xs">
                    {ev.title}
                  </p>
                  <p className="text-[10px] font-semibold text-[#66638c]">{formatEventWhen(ev.eventDate)}</p>
                </div>
              </Link>
              {chips.length > 0 ? (
                <div className="flex flex-wrap gap-1 px-0.5">
                  {chips.map((c) => (
                    <Link
                      key={c.id}
                      href={linkHref(c.publicPath)}
                      className="rounded-md border border-[#5b61ff]/25 bg-[#5b61ff]/8 px-1.5 py-0.5 text-[10px] font-bold text-[#4d47b6] transition hover:bg-[#5b61ff]/15"
                    >
                      {c.title}
                    </Link>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className={cn(clubEventOutlineButtonClass, "min-h-9")}
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            ก่อนหน้า
          </button>
          <p className="text-xs font-semibold text-[#66638c]">
            {safePage + 1} / {totalPages}
          </p>
          <button
            type="button"
            className={cn(clubEventOutlineButtonClass, "min-h-9")}
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            ถัดไป
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ClubEventPortalStandaloneLinks({
  links,
  linkHref,
}: {
  links: ClubPortalLinkChip[];
  linkHref: (path: string) => string;
}) {
  if (links.length === 0) return null;
  return (
    <ul className="mt-3 space-y-2">
      {links.map((l) => (
        <li key={l.id}>
          <Link href={linkHref(l.publicPath)} className="text-sm font-bold text-[#4d47b6] underline">
            {l.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
