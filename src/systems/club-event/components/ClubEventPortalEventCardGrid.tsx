"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppEmptyState } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  CLUB_EVENT_PORTAL_EVENT_COLS_DESKTOP,
  CLUB_EVENT_PORTAL_EVENT_COLS_MOBILE,
  CLUB_EVENT_PORTAL_EVENT_COLS_TABLET,
  CLUB_EVENT_PORTAL_EVENT_ROWS,
} from "@/systems/club-event/lib/portal-media";
import type { ClubEventRecordDto } from "@/systems/club-event/lib/mappers";
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
  events: ClubEventRecordDto[];
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

  useMemo(() => {
    if (typeof window === "undefined") return;
    const sync = () => setPageSize(pageSizeForWidth(window.innerWidth));
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const totalPages = Math.max(1, Math.ceil(events.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const slice = events.slice(safePage * pageSize, safePage * pageSize + pageSize);

  if (events.length === 0) {
    return <AppEmptyState tone="violet">{emptyLabel}</AppEmptyState>;
  }

  return (
    <div className="space-y-3" aria-label={ariaLabel}>
      <ul className={clubEventPortalEventCardGridClass}>
        {slice.map((ev) => {
          const chips = links.filter((l) => l.config?.eventId === ev.id);
          return (
            <li key={ev.id} className="min-w-0">
              <Link
                href={eventHref(ev.id)}
                className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 shadow-sm transition hover:border-[#5b61ff]/35 hover:shadow-md"
              >
                <div className="flex flex-1 flex-col gap-1.5 p-3">
                  <p className="line-clamp-2 text-sm font-black leading-snug text-[#1e1b4b]">{ev.title}</p>
                  <p className="text-[11px] font-semibold text-[#66638c]">{formatEventWhen(ev.eventDate)}</p>
                  {chips.length > 0 ? (
                    <div className="mt-auto flex flex-wrap gap-1 pt-1">
                      {chips.map((c) => (
                        <span
                          key={c.id}
                          className="rounded-md border border-[#5b61ff]/25 bg-[#5b61ff]/8 px-1.5 py-0.5 text-[10px] font-bold text-[#4d47b6]"
                        >
                          {c.title}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Link>
              {chips.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {chips.map((c) => (
                    <Link
                      key={`${c.id}-a`}
                      href={linkHref(c.publicPath)}
                      className="text-[10px] font-bold text-[#4d47b6] underline"
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
