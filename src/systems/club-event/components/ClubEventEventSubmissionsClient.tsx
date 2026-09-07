"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Filter, RefreshCw } from "lucide-react";
import { AppEmptyState, useAppNoticePopup } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  clubEventEventEditHref,
  clubEventEventHref,
} from "@/systems/club-event/club-event-module-nav";
import { ClubEventPageSubNav } from "@/systems/club-event/components/ClubEventPageSubNav";
import {
  ClubEventLinkSubmissionsView,
  type ClubEventSubmissionsTab,
} from "@/systems/club-event/components/ClubEventLinkSubmissionsView";
import type { ClubDynamicLinkField, ClubEventDynamicLinkDto } from "@/systems/club-event/lib/mappers";
import {
  clubEventPageTitleIcon,
  clubEventPageTitleTone,
} from "@/systems/club-event/lib/page-menu-icons";
import type { ClubSubmissionRow } from "@/systems/club-event/lib/submission-summary";
import {
  clubEventFieldClass,
  clubEventFilterChipClass,
  clubEventFilterChipShellClass,
  clubEventIconButtonClass,
  clubEventInlineSubNavBtnClass,
  clubEventOutlineButtonClass,
  clubEventPrimaryTabPillClass,
  clubEventPrimaryTabShellClass,
} from "@/systems/club-event/lib/ui-tokens";

type LinkRow = ClubEventDynamicLinkDto & { submissionsCount?: number };

export function ClubEventEventSubmissionsClient({ eventId }: { eventId: string }) {
  const notice = useAppNoticePopup();
  const [loading, setLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState<string | null>(null);
  const [link, setLink] = useState<LinkRow | null>(null);
  const [rows, setRows] = useState<ClubSubmissionRow[]>([]);
  const [fields, setFields] = useState<ClubDynamicLinkField[]>([]);
  const [linkTitle, setLinkTitle] = useState("");
  const [tab, setTab] = useState<ClubEventSubmissionsTab>("summary");
  const [filterOpen, setFilterOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [slipFilter, setSlipFilter] = useState<"all" | "verified" | "pending">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const evRes = await fetch(`/api/club-event/session/events/${encodeURIComponent(eventId)}`);
      const evData = (await evRes.json()) as { event?: { id: string; title: string }; error?: string };
      if (!evRes.ok || !evData.event) throw new Error(evData.error ?? "ไม่พบกิจกรรม");
      setEventTitle(evData.event.title);

      const linksRes = await fetch("/api/club-event/session/links");
      const linksData = (await linksRes.json()) as { links?: LinkRow[]; error?: string };
      if (!linksRes.ok) throw new Error(linksData.error ?? "โหลดลิงก์ไม่สำเร็จ");
      const matched = (linksData.links ?? []).find((l) => l.config.eventId === eventId) ?? null;
      setLink(matched);
      if (!matched) {
        setRows([]);
        setFields([]);
        setLinkTitle("");
        return;
      }

      const subRes = await fetch(`/api/club-event/session/links/${encodeURIComponent(matched.id)}/submissions`);
      const subData = (await subRes.json()) as {
        submissions?: ClubSubmissionRow[];
        fields?: ClubDynamicLinkField[];
        linkTitle?: string;
        error?: string;
      };
      if (!subRes.ok) throw new Error(subData.error ?? "โหลดคำตอบไม่สำเร็จ");
      setRows(subData.submissions ?? []);
      setFields(subData.fields ?? []);
      setLinkTitle(subData.linkTitle ?? matched.title);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดคำตอบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [eventId, notice.error]);

  useEffect(() => {
    void load();
  }, [load]);

  const q = query.trim().toLowerCase();
  const slipCounts = useMemo(() => {
    let verified = 0;
    let pending = 0;
    for (const r of rows) {
      if (!r.slipUrl) continue;
      if (r.slipVerified ?? r.slipVerifiedAt) verified += 1;
      else pending += 1;
    }
    return { all: rows.length, verified, pending };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (slipFilter === "verified") {
        if (!(r.slipVerified ?? r.slipVerifiedAt)) return false;
      } else if (slipFilter === "pending") {
        if (!r.slipUrl || (r.slipVerified ?? r.slipVerifiedAt)) return false;
      }
      if (!q) return true;
      const name = (r.respondentName ?? "").toLowerCase();
      const phone = (r.respondentPhone ?? "").toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [q, rows, slipFilter]);

  const filtersActive = q.length > 0 || slipFilter !== "all";

  return (
    <>
      {notice.popup}
      <ClubEventPageSubNav
        title="คำตอบแบบสอบถาม"
        titleIcon={clubEventPageTitleIcon("eventSubmissions")}
        titleTone={clubEventPageTitleTone("eventSubmissions")}
        subtitle={eventTitle ?? undefined}
        action={
          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              href={clubEventEventHref(eventId)}
              className={clubEventIconButtonClass}
              aria-label="กลับกิจกรรม"
              title="กลับกิจกรรม"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
            <button
              type="button"
              className={cn(clubEventInlineSubNavBtnClass(filterOpen), "relative")}
              aria-expanded={filterOpen}
              aria-controls="club-event-submissions-filter"
              aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
              title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
              onClick={() => setFilterOpen((o) => !o)}
            >
              <Filter className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
              {filtersActive && !filterOpen ? (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden />
              ) : null}
            </button>
            <button
              type="button"
              className={clubEventOutlineButtonClass}
              aria-label="รีเฟรชข้อมูลคำตอบ"
              title="รีเฟรช"
              disabled={loading}
              aria-busy={loading}
              onClick={() => void load()}
            >
              <RefreshCw className={cn("h-3.5 w-3.5 shrink-0", loading && "animate-spin")} aria-hidden />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>
          </div>
        }
      >
        {loading && !eventTitle ? (
          <p className="py-8 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : !link ? (
          <AppEmptyState>
            กิจกรรมนี้ยังไม่มีลิงก์แบบสอบถาม —{" "}
            <Link href={clubEventEventEditHref(eventId)} className="font-semibold text-[#0000BF] underline">
              สร้างลิงก์ที่หน้าแก้ไข
            </Link>
          </AppEmptyState>
        ) : (
          <div className="space-y-4">
            <nav className={clubEventPrimaryTabShellClass} role="tablist" aria-label="มุมมองคำตอบ">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "summary"}
                className={clubEventPrimaryTabPillClass(tab === "summary")}
                onClick={() => setTab("summary")}
              >
                สรุปตามคำถาม
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "list"}
                className={clubEventPrimaryTabPillClass(tab === "list")}
                onClick={() => setTab("list")}
              >
                รายการรายคน
              </button>
            </nav>

            <div id="club-event-submissions-filter" className={cn("space-y-3", filterOpen ? "block" : "hidden")}>
              <div
                className={cn(clubEventFilterChipShellClass, "items-center")}
                role="group"
                aria-label="สรุปและกรองสถานะสลิป"
              >
                <span className={clubEventFilterChipClass(true)} role="status">
                  {linkTitle || link.title} · {filtered.length}/{rows.length} คน
                </span>
                {tab === "list"
                  ? (
                      [
                        { key: "all" as const, label: "ทั้งหมด", count: slipCounts.all },
                        { key: "verified" as const, label: "ตรวจแล้ว", count: slipCounts.verified },
                        { key: "pending" as const, label: "รอตรวจ", count: slipCounts.pending },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        role="tab"
                        aria-selected={slipFilter === item.key}
                        className={clubEventFilterChipClass(slipFilter === item.key)}
                        onClick={() => setSlipFilter(item.key)}
                      >
                        {item.label} ({item.count})
                      </button>
                    ))
                  : null}
              </div>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-[#4d47b6]">ค้นหาชื่อหรือเบอร์</span>
                <input
                  className={clubEventFieldClass}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ชื่อ หรือ เบอร์โทร"
                />
              </label>
              {filtersActive ? (
                <button
                  type="button"
                  className={clubEventOutlineButtonClass}
                  onClick={() => {
                    setQuery("");
                    setSlipFilter("all");
                  }}
                >
                  ล้างกรอง
                </button>
              ) : null}
            </div>

            {rows.length === 0 ? (
              <AppEmptyState>ยังไม่มีคำตอบ</AppEmptyState>
            ) : filtered.length === 0 ? (
              <AppEmptyState>ไม่พบคำตอบที่ตรงการค้นหา</AppEmptyState>
            ) : (
              <ClubEventLinkSubmissionsView
                rows={filtered}
                fields={fields}
                tab={tab}
                onPatchSubmission={(id, patch) =>
                  setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
                }
              />
            )}
          </div>
        )}
      </ClubEventPageSubNav>
    </>
  );
}
