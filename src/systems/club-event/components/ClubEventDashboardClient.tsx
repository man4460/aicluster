"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, ClipboardCheck, Images, Play, Plus, UserCog } from "lucide-react";
import { AppEmptyState, useAppNoticePopup } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { formatBangkokDateTimeLong } from "@/lib/time/bangkok";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  CLUB_EVENT_DASHBOARD_TAB_ITEMS,
  clubEventDashboardTabHref,
  clubEventEventDeskHref,
  clubEventEventEditHref,
  clubEventEventHref,
  clubEventNewEventHref,
  parseClubEventDashboardTab,
  type ClubEventDashboardTabKey,
} from "@/systems/club-event/club-event-module-nav";
import { ClubEventPageSubNav } from "@/systems/club-event/components/ClubEventPageSubNav";
import {
  clubEventCardIconTileClass,
  clubEventTonedRowCardClass,
} from "@/systems/club-event/lib/card-tones";
import type { ClubCommitteeMember, ClubEventProfileDto, ClubEventRecordDto } from "@/systems/club-event/lib/mappers";
import {
  clubEventDashboardTabIcon,
  clubEventPageTitleIcon,
  clubEventPageTitleTone,
} from "@/systems/club-event/lib/page-menu-icons";
import {
  clubEventFieldClass,
  clubEventOutlineButtonClass,
  clubEventPrimaryButtonClass,
} from "@/systems/club-event/lib/ui-tokens";

const DASHBOARD_TAB_ITEMS = CLUB_EVENT_DASHBOARD_TAB_ITEMS.map((item) => ({
  ...item,
  icon: clubEventDashboardTabIcon(item.key),
}));

export function ClubEventDashboardClient({ initialProfile }: { initialProfile: ClubEventProfileDto }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseClubEventDashboardTab(searchParams.get("tab"));
  const notice = useAppNoticePopup();

  const [profile, setProfile] = useState(initialProfile);
  const [events, setEvents] = useState<ClubEventRecordDto[]>([]);
  const [committee, setCommittee] = useState<ClubCommitteeMember[]>(initialProfile.committee);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const setTab = useCallback(
    (next: string) => {
      router.replace(clubEventDashboardTabHref(next as ClubEventDashboardTabKey), { scroll: false });
    },
    [router],
  );

  const loadEvents = useCallback(async () => {
    if (tab === "committee") {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const status = tab === "past" ? "PAST" : "UPCOMING";
      const res = await fetch(`/api/club-event/session/events?status=${status}`);
      const data = (await res.json()) as { events?: ClubEventRecordDto[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
      setEvents(data.events ?? []);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [tab, notice.error]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const deleteEvent = async (id: string, title: string) => {
    const ok = await notice.confirm(`ลบกิจกรรม «${title}» ใช่หรือไม่?`);
    if (!ok) return;
    try {
      const res = await fetch(`/api/club-event/session/events/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "ลบไม่สำเร็จ");
      await loadEvents();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  };

  const saveCommittee = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/club-event/session/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ committee }),
      });
      const data = (await res.json()) as { profile?: ClubEventProfileDto; error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      if (data.profile) setProfile(data.profile);
      notice.success("บันทึกกรรมการแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {notice.popup}
      <ClubEventPageSubNav
        title="แดชบอร์ด"
        titleIcon={clubEventPageTitleIcon("dashboard")}
        titleTone={clubEventPageTitleTone("dashboard")}
        items={DASHBOARD_TAB_ITEMS}
        activeKey={tab}
        onSelect={setTab}
        ariaLabel="แท็บแดชบอร์ด"
        action={
          tab === "committee" ? (
            <button
              type="button"
              className={clubEventPrimaryButtonClass}
              disabled={saving}
              onClick={() => void saveCommittee()}
            >
              บันทึก
            </button>
          ) : (
            <Link
              href={clubEventNewEventHref()}
              className={clubEventPrimaryButtonClass}
              aria-label="เพิ่มกิจกรรม"
            >
              <Plus className="h-5 w-5 sm:hidden" aria-hidden />
              <span className="hidden sm:inline">+ เพิ่มกิจกรรม</span>
            </Link>
          )
        }
      >
        {tab === "committee" ? (
          <div>
            <div className="space-y-2">
              {committee.map((row, idx) => (
                <div
                  key={idx}
                  className={cn(clubEventTonedRowCardClass("indigo"), "sm:items-stretch")}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className={clubEventCardIconTileClass("indigo")} aria-hidden>
                      <UserCog className="h-5 w-5" strokeWidth={2.25} />
                    </span>
                    <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-3">
                      <input
                        className={clubEventFieldClass}
                        placeholder="ตำแหน่ง"
                        value={row.role}
                        onChange={(e) => {
                          const next = [...committee];
                          next[idx] = { ...row, role: e.target.value };
                          setCommittee(next);
                        }}
                      />
                      <input
                        className={clubEventFieldClass}
                        placeholder="ชื่อ"
                        value={row.name}
                        onChange={(e) => {
                          const next = [...committee];
                          next[idx] = { ...row, name: e.target.value };
                          setCommittee(next);
                        }}
                      />
                      <input
                        className={clubEventFieldClass}
                        placeholder="เบอร์โทร"
                        value={row.phone ?? ""}
                        onChange={(e) => {
                          const next = [...committee];
                          next[idx] = { ...row, phone: e.target.value };
                          setCommittee(next);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className={cn(clubEventOutlineButtonClass, "w-full")}
                onClick={() => setCommittee([...committee, { role: "", name: "" }])}
              >
                + เพิ่มตำแหน่ง
              </button>
            </div>
            <p className="mt-3 text-xs text-[#5f5a8a]">
              พอร์ทัลสาธารณะ:{" "}
              <a href={profile.publicUrl} className="font-semibold text-[#0000BF] underline" target="_blank" rel="noreferrer">
                {profile.publicUrl}
              </a>
            </p>
          </div>
        ) : (
          <>
            {loading ? (
              <p className="py-8 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
            ) : events.length === 0 ? (
              <AppEmptyState>ยังไม่มีกิจกรรม — กดเพิ่มกิจกรรมเพื่อเริ่มต้น</AppEmptyState>
            ) : (
              <ul className="space-y-2">
                {events.map((ev, i) => {
                  const tone = tab === "past" ? "slate" : (["sky", "violet", "fuchsia", "cyan"] as const)[i % 4];
                  return (
                    <li key={ev.id}>
                      <div
                        className={cn(
                          clubEventTonedRowCardClass(tone),
                          "relative transition hover:brightness-[0.99]",
                        )}
                      >
                        <Link
                          href={clubEventEventHref(ev.id)}
                          className="absolute inset-0 z-0 rounded-[inherit]"
                          aria-label={`ดูรายละเอียด ${ev.title}`}
                        />
                        <div className="relative z-[1] flex min-w-0 flex-1 items-start gap-3 pointer-events-none">
                          <span className={clubEventCardIconTileClass(tone, "lg")} aria-hidden>
                            <Calendar className="h-7 w-7" strokeWidth={2.1} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-[#1e1b4b]">{ev.title}</p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-[#66638c]">
                              <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                              {formatBangkokDateTimeLong(ev.eventDate)}
                            </p>
                            {ev.galleryCount > 0 ? (
                              <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#5f5a8a]">
                                <Images className="h-3.5 w-3.5" aria-hidden />
                                รูป {ev.galleryCount} รายการ
                              </p>
                            ) : null}
                            {ev.checkInCount > 0 ? (
                              <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                <ClipboardCheck className="h-3.5 w-3.5" aria-hidden />
                                เช็กอิน {ev.checkInCount} คน
                              </p>
                            ) : null}
                            {(ev.youtubeVideos?.length ?? ev.youtubeUrls?.length ?? 0) > 0 ||
                            ev.youtubeEmbedUrl ? (
                              <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#0000BF]">
                                <Play className="h-3.5 w-3.5" aria-hidden />
                                วิดีโอ{" "}
                                {ev.youtubeVideos?.length ||
                                  ev.youtubeUrls?.length ||
                                  (ev.youtubeEmbedUrl ? 1 : 0)}{" "}
                                รายการ
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="relative z-[1] flex shrink-0 items-center gap-1 self-end sm:self-center">
                          <Link
                            href={clubEventEventDeskHref(ev.id)}
                            className={cn(
                              assetRowEditIconButtonClass,
                              "border-emerald-200 bg-emerald-50 text-emerald-700",
                            )}
                            aria-label={`จุดลงทะเบียน ${ev.title}`}
                            title="จุดลงทะเบียนวันงาน"
                          >
                            <ClipboardCheck className="h-4 w-4" aria-hidden />
                          </Link>
                          <Link
                            href={clubEventEventEditHref(ev.id)}
                            className={assetRowEditIconButtonClass}
                            aria-label={`แก้ไข ${ev.title}`}
                            title="แก้ไข"
                          >
                            <IconRowEdit className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            className={assetRowRemoveIconButtonClass}
                            aria-label={`ลบ ${ev.title}`}
                            title="ลบ"
                            onClick={() => void deleteEvent(ev.id, ev.title)}
                          >
                            <IconRowRemove className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </ClubEventPageSubNav>
    </>
  );
}
