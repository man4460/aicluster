"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  ImagePlus,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import {
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
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
  parseClubEventDashboardTab,
  type ClubEventDashboardTabKey,
} from "@/systems/club-event/club-event-module-nav";
import { ClubEventPageSubNav } from "@/systems/club-event/components/ClubEventPageSubNav";
import { ClubEventSlideshow } from "@/systems/club-event/components/ClubEventSlideshow";
import { ClubEventYoutubePlayer } from "@/systems/club-event/components/ClubEventYoutubePlayer";
import { prepareClubEventGalleryWebp } from "@/systems/club-event/lib/gallery-image";
import type { ClubCommitteeMember, ClubEventProfileDto, ClubEventRecordDto } from "@/systems/club-event/lib/mappers";
import { clubEventYoutubeWatchUrlFromStored } from "@/systems/club-event/lib/youtube";
import {
  clubEventFieldClass,
  clubEventFixedBottomActionClass,
  clubEventOutlineButtonClass,
  clubEventPrimaryButtonClass,
  clubEventRowCardClass,
  clubEventTextareaClass,
} from "@/systems/club-event/lib/ui-tokens";

type GalleryItem = { id: string; imageUrl: string; fileName: string; sortOrder: number };

export function ClubEventDashboardClient({ initialProfile }: { initialProfile: ClubEventProfileDto }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseClubEventDashboardTab(searchParams.get("tab"));
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();

  const [profile, setProfile] = useState(initialProfile);
  const [events, setEvents] = useState<ClubEventRecordDto[]>([]);
  const [committee, setCommittee] = useState<ClubCommitteeMember[]>(initialProfile.committee);
  const [loading, setLoading] = useState(true);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [eventForm, setEventForm] = useState({
    id: "",
    title: "",
    eventDate: "",
    description: "",
    youtubeEmbedUrl: "",
    status: "UPCOMING" as "UPCOMING" | "PAST",
  });

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

  const openCreateEvent = () => {
    setEventForm({
      id: "",
      title: "",
      eventDate: new Date().toISOString().slice(0, 16),
      description: "",
      youtubeEmbedUrl: "",
      status: tab === "past" ? "PAST" : "UPCOMING",
    });
    setEventModalOpen(true);
  };

  const openEditEvent = (ev: ClubEventRecordDto) => {
    setEventForm({
      id: ev.id,
      title: ev.title,
      eventDate: ev.eventDate.slice(0, 16),
      description: ev.description,
      youtubeEmbedUrl: clubEventYoutubeWatchUrlFromStored(ev.youtubeEmbedUrl) ?? ev.youtubeEmbedUrl ?? "",
      status: ev.status,
    });
    setEventModalOpen(true);
  };

  const saveEvent = async () => {
    if (!eventForm.title.trim()) {
      notice.error("กรอกชื่อกิจกรรม");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: eventForm.title,
        eventDate: new Date(eventForm.eventDate).toISOString(),
        description: eventForm.description,
        youtubeEmbedUrl: eventForm.youtubeEmbedUrl || null,
        status: eventForm.status,
      };
      const res = await fetch(
        eventForm.id ? `/api/club-event/session/events/${eventForm.id}` : "/api/club-event/session/events",
        {
          method: eventForm.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      setEventModalOpen(false);
      await loadEvents();
      notice.success("บันทึกกิจกรรมแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (id: string, title: string) => {
    const ok = await notice.confirm(`ลบกิจกรรม «${title}» ใช่หรือไม่?`);
    if (!ok) return;
    try {
      const res = await fetch(`/api/club-event/session/events/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "ลบไม่สำเร็จ");
      if (detailId === id) setDetailId(null);
      await loadEvents();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  };

  const loadDetail = async (id: string) => {
    setDetailId(id);
    try {
      const res = await fetch(`/api/club-event/session/events/${id}`);
      const data = (await res.json()) as { gallery?: GalleryItem[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
      setGallery(data.gallery ?? []);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    }
  };

  const uploadGallery = async (file: File) => {
    if (!detailId) return;
    try {
      const webp = await prepareClubEventGalleryWebp(file);
      const form = new FormData();
      form.set("file", webp);
      const res = await fetch(`/api/club-event/session/events/${detailId}/gallery`, {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { image?: GalleryItem; error?: string };
      if (!res.ok) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
      if (data.image) setGallery((g) => [...g, data.image!]);
      notice.success("อัปโหลดรูปแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    }
  };

  const removeGalleryImage = async (imageId: string) => {
    if (!detailId) return;
    try {
      const res = await fetch(
        `/api/club-event/session/events/${detailId}/gallery?imageId=${encodeURIComponent(imageId)}`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "ลบไม่สำเร็จ");
      setGallery((g) => g.filter((x) => x.id !== imageId));
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

  const selectedEvent = events.find((e) => e.id === detailId);

  return (
    <>
      {notice.popup}
      <ClubEventPageSubNav
        title="แดชบอร์ด"
        items={CLUB_EVENT_DASHBOARD_TAB_ITEMS}
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
            <button
              type="button"
              className={clubEventPrimaryButtonClass}
              aria-label="เพิ่มกิจกรรม"
              onClick={openCreateEvent}
            >
              <Plus className="h-5 w-5 sm:hidden" aria-hidden />
              <span className="hidden sm:inline">+ เพิ่มกิจกรรม</span>
            </button>
          )
        }
      >
        {tab === "committee" ? (
          <div>
            <div className="space-y-2">
              {committee.map((row, idx) => (
                <div key={idx} className="grid gap-2 rounded-lg border border-slate-200/90 p-3 sm:grid-cols-3">
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
                {events.map((ev) => (
                  <li key={ev.id} className={clubEventRowCardClass}>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#1e1b4b]">{ev.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-[#66638c]">
                        <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                        {formatBangkokDateTimeLong(ev.eventDate)}
                      </p>
                      {ev.galleryCount > 0 ? (
                        <p className="mt-1 text-xs text-[#5f5a8a]">รูป {ev.galleryCount} รายการ</p>
                      ) : null}
                      {ev.youtubeEmbedUrl ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#0000BF]">
                          <Play className="h-3.5 w-3.5" aria-hidden />
                          มีวิดีโอ YouTube
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
                      <button
                        type="button"
                        className={clubEventOutlineButtonClass}
                        onClick={() => void loadDetail(ev.id)}
                      >
                        รายละเอียด
                      </button>
                      <button
                        type="button"
                        className={assetRowEditIconButtonClass}
                        aria-label={`แก้ไข ${ev.title}`}
                        title="แก้ไข"
                        onClick={() => openEditEvent(ev)}
                      >
                        <IconRowEdit className="h-4 w-4" />
                      </button>
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
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </ClubEventPageSubNav>

      <FormModal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        title={eventForm.id ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรม"}
        mobileCentered
        footer={
          <div className={clubEventFixedBottomActionClass}>
            <button type="button" className={cn(clubEventPrimaryButtonClass, "w-full sm:w-auto sm:px-6")} disabled={saving} onClick={() => void saveEvent()}>
              บันทึก
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-[#1e1b4b]">ชื่อกิจกรรม</span>
            <input className={clubEventFieldClass} value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-[#1e1b4b]">วันเวลา</span>
            <input type="datetime-local" className={clubEventFieldClass} value={eventForm.eventDate} onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-[#1e1b4b]">ลิงก์วิดีโอ YouTube</span>
            <input
              className={clubEventFieldClass}
              value={eventForm.youtubeEmbedUrl}
              onChange={(e) => setEventForm({ ...eventForm, youtubeEmbedUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=... หรือ youtu.be/..."
              autoComplete="off"
              spellCheck={false}
            />
            <span className="block text-xs text-[#66638c]">
              วางลิงก์จาก YouTube ได้เลย — ระบบจะเปิดเล่นในหน้ารายละเอียด (ไม่มีปุ่มคัดลอกลิงก์)
            </span>
          </label>
          {eventForm.youtubeEmbedUrl.trim() ? (
            <ClubEventYoutubePlayer youtubeEmbedUrl={eventForm.youtubeEmbedUrl} title={eventForm.title || "ตัวอย่างวิดีโอ"} />
          ) : null}
          <label className="block space-y-1">
            <span className="text-sm font-semibold text-[#1e1b4b]">รายละเอียด</span>
            <textarea className={clubEventTextareaClass} value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
          </label>
        </div>
      </FormModal>

      <FormModal
        open={Boolean(detailId && selectedEvent)}
        onClose={() => setDetailId(null)}
        title={selectedEvent?.title ?? "รายละเอียดกิจกรรม"}
        mobileCentered
        footer={
          gallery.length > 0 ? (
            <div className={clubEventFixedBottomActionClass}>
              <button
                type="button"
                className={cn(clubEventPrimaryButtonClass, "inline-flex w-full items-center justify-center gap-2 sm:w-auto sm:px-6")}
                onClick={() => setSlideshowOpen(true)}
              >
                <Play className="h-5 w-5" aria-hidden />
                Play Slideshow
              </button>
            </div>
          ) : undefined
        }
      >
        {selectedEvent ? (
          <div className="space-y-4">
            <p className="text-sm text-[#66638c]">{formatBangkokDateTimeLong(selectedEvent.eventDate)}</p>
            {selectedEvent.description ? <p className="whitespace-pre-wrap text-sm text-[#1e1b4b]">{selectedEvent.description}</p> : null}
            {selectedEvent.youtubeEmbedUrl ? (
              <div>
                <h3 className="mb-2 text-sm font-bold text-[#1e1b4b]">วิดีโอ</h3>
                <ClubEventYoutubePlayer youtubeEmbedUrl={selectedEvent.youtubeEmbedUrl} title={selectedEvent.title} />
              </div>
            ) : null}
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[#1e1b4b]">แกลเลอรี</h3>
                <label className={cn(clubEventOutlineButtonClass, "inline-flex cursor-pointer items-center gap-1.5")}>
                  <ImagePlus className="h-4 w-4" aria-hidden />
                  <span>เพิ่มรูป</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadGallery(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {gallery.length === 0 ? (
                <AppEmptyState>ยังไม่มีรูป — อัปโหลดรูปกิจกรรม (แปลง WebP อัตโนมัติ)</AppEmptyState>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {gallery.map((g) => (
                    <div key={g.id} className="relative">
                      <AppImageThumb src={g.imageUrl} alt={g.fileName} onOpen={() => lb.open(g.imageUrl)} />
                      <button
                        type="button"
                        className="absolute -right-1 -top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white"
                        aria-label={`ลบรูป ${g.fileName}`}
                        onClick={() => void removeGalleryImage(g.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </FormModal>

      <ClubEventSlideshow
        open={slideshowOpen}
        onClose={() => setSlideshowOpen(false)}
        slides={gallery}
        title={selectedEvent?.title}
      />
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปกิจกรรม" />
    </>
  );
}
