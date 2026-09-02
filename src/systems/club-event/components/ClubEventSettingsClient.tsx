"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  AppSlipPaperSizeSettingsField,
  appTemplateOutlineButtonClass,
  parseAppSlipPaperSize,
  prepareImageFileForUpload,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  assetRowRemoveIconButtonClass,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  CLUB_EVENT_SETTINGS_PATH,
  parseClubEventSettingsTab,
} from "@/systems/club-event/club-event-module-nav";
import { ClubEventPageSubNav } from "@/systems/club-event/components/ClubEventPageSubNav";
import type { ClubEventDynamicLinkDto, ClubEventProfileDto } from "@/systems/club-event/lib/mappers";
import { CLUB_EVENT_LINK_TYPE_LABELS } from "@/systems/club-event/lib/mappers";
import {
  clubEventFieldClass,
  clubEventFixedBottomActionClass,
  clubEventPanelClass,
  clubEventRowCardClass,
} from "@/systems/club-event/lib/ui-tokens";

const SETTINGS_TABS = [
  { key: "basic", label: "ข้อมูลชมรม", href: CLUB_EVENT_SETTINGS_PATH },
  { key: "finance", label: "การเงิน", href: `${CLUB_EVENT_SETTINGS_PATH}?tab=finance` },
  { key: "links", label: "Link Hub", href: `${CLUB_EVENT_SETTINGS_PATH}?tab=links` },
] as const;

export function ClubEventSettingsClient({ initialProfile }: { initialProfile: ClubEventProfileDto }) {
  const searchParams = useSearchParams();
  const tab = parseClubEventSettingsTab(searchParams.get("tab"));
  const notice = useAppNoticePopup();
  const [profile, setProfile] = useState(initialProfile);
  const [links, setLinks] = useState<ClubEventDynamicLinkDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkForm, setLinkForm] = useState({
    id: "",
    type: "URL" as ClubEventDynamicLinkDto["type"],
    title: "",
    url: "",
    amountBaht: "",
  });

  const subTabs = useMemo(
    () => SETTINGS_TABS.map((t) => ({ key: t.key, label: t.label, href: t.href })),
    [],
  );

  const loadLinks = useCallback(async () => {
    const res = await fetch("/api/club-event/session/links");
    const data = (await res.json()) as { links?: ClubEventDynamicLinkDto[] };
    setLinks(data.links ?? []);
  }, []);

  useEffect(() => {
    if (tab === "links") void loadLinks();
  }, [tab, loadLinks]);

  const saveProfile = async (patch: Partial<ClubEventProfileDto> & Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/club-event/session/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as { profile?: ClubEventProfileDto; error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      if (data.profile) setProfile(data.profile);
      notice.success("บันทึกแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    try {
      const prepared = await prepareImageFileForUpload(file);
      const form = new FormData();
      form.set("file", prepared);
      const res = await fetch("/api/club-event/session/images/upload", { method: "POST", body: form });
      const data = (await res.json()) as { imageUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
      setProfile((p) => ({ ...p, logoUrl: data.imageUrl ?? p.logoUrl }));
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    }
  };

  const saveLink = async () => {
    if (!linkForm.title.trim()) {
      notice.error("กรอกชื่อลิงก์");
      return;
    }
    setSaving(true);
    try {
      const config =
        linkForm.type === "PAYMENT"
          ? { amountBaht: Number(linkForm.amountBaht) || 0 }
          : linkForm.type === "URL"
            ? { url: linkForm.url }
            : { fields: [{ key: "answer", label: "คำตอบ", type: "text" }] };
      const payload = { type: linkForm.type, title: linkForm.title, config };
      const res = await fetch(
        linkForm.id ? `/api/club-event/session/links/${linkForm.id}` : "/api/club-event/session/links",
        {
          method: linkForm.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      setLinkModalOpen(false);
      await loadLinks();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const deleteLink = async (id: string) => {
    if (!window.confirm("ลบลิงก์นี้?")) return;
    const res = await fetch(`/api/club-event/session/links/${id}`, { method: "DELETE" });
    if (res.ok) await loadLinks();
  };

  return (
    <div className="space-y-3">
      {notice.popup}
      <ClubEventPageSubNav tabs={[...subTabs]} ariaLabel="แท็บตั้งค่า" />

      {tab === "basic" ? (
        <AppDashboardSection className={clubEventPanelClass}>
          <AppSectionHeader title="ข้อมูลชมรม" />
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-sm font-semibold">ชื่อชมรม</span>
              <input className={clubEventFieldClass} value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-semibold">Slug (URL)</span>
              <input className={clubEventFieldClass} value={profile.slug} onChange={(e) => setProfile({ ...profile, slug: e.target.value })} />
              <p className="text-xs text-[#5f5a8a]">พอร์ทัล: {profile.publicUrl}</p>
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-semibold">Tagline</span>
              <input className={clubEventFieldClass} value={profile.tagline ?? ""} onChange={(e) => setProfile({ ...profile, tagline: e.target.value })} />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-semibold">กฎระเบียบ</span>
              <textarea className={cn(clubEventFieldClass, "min-h-[120px]")} value={profile.rulesMarkdown} onChange={(e) => setProfile({ ...profile, rulesMarkdown: e.target.value })} />
            </label>
            <label className={cn(appTemplateOutlineButtonClass, "inline-flex cursor-pointer items-center gap-2")}>
              อัปโหลดโลโก้
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadLogo(f); e.target.value = ""; }} />
            </label>
            <div className={clubEventFixedBottomActionClass}>
              <button type="button" className="app-btn-primary w-full min-h-[48px] rounded-xl sm:w-auto sm:px-6" disabled={saving} onClick={() => void saveProfile(profile)}>
                บันทึก
              </button>
            </div>
          </div>
        </AppDashboardSection>
      ) : null}

      {tab === "finance" ? (
        <AppDashboardSection className={clubEventPanelClass}>
          <AppSectionHeader title="ตั้งค่าการเงิน" />
          <div className="space-y-3">
            <input className={clubEventFieldClass} placeholder="PromptPay" value={profile.promptPayPhone ?? ""} onChange={(e) => setProfile({ ...profile, promptPayPhone: e.target.value })} />
            <input className={clubEventFieldClass} placeholder="ธนาคาร" value={profile.bankName ?? ""} onChange={(e) => setProfile({ ...profile, bankName: e.target.value })} />
            <input className={clubEventFieldClass} placeholder="เลขบัญชี" value={profile.bankAccountNumber ?? ""} onChange={(e) => setProfile({ ...profile, bankAccountNumber: e.target.value })} />
            <input className={clubEventFieldClass} placeholder="ชื่อบัญชี" value={profile.bankAccountName ?? ""} onChange={(e) => setProfile({ ...profile, bankAccountName: e.target.value })} />
            <AppSlipPaperSizeSettingsField value={parseAppSlipPaperSize(profile.slipPaperSize)} onChange={(v) => setProfile({ ...profile, slipPaperSize: v })} />
            <div className={clubEventFixedBottomActionClass}>
              <button type="button" className="app-btn-primary w-full min-h-[48px] rounded-xl sm:w-auto sm:px-6" disabled={saving} onClick={() => void saveProfile(profile)}>
                บันทึก
              </button>
            </div>
          </div>
        </AppDashboardSection>
      ) : null}

      {tab === "links" ? (
        <AppDashboardSection className={clubEventPanelClass}>
          <AppSectionHeader
            title="Link Hub"
            className="flex flex-row items-start justify-between gap-3 sm:items-center"
            actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
            action={
              <button type="button" className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center sm:min-w-0 sm:px-4" aria-label="เพิ่มลิงก์" onClick={() => { setLinkForm({ id: "", type: "URL", title: "", url: "", amountBaht: "" }); setLinkModalOpen(true); }}>
                <Plus className="h-5 w-5 sm:hidden" aria-hidden />
                <span className="hidden sm:inline">+ เพิ่มลิงก์</span>
              </button>
            }
          />
          {links.length === 0 ? (
            <AppEmptyState tone="violet">
              ยังไม่มีลิงก์
              <span className="mt-1 block text-xs">สร้างแบบสำรวจ RSVP เก็บเงิน หรือ URL</span>
            </AppEmptyState>
          ) : (
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.id} className={clubEventRowCardClass}>
                  <div className="min-w-0">
                    <p className="font-black text-[#1e1b4b]">{l.title}</p>
                    <p className="text-sm text-[#66638c]">{CLUB_EVENT_LINK_TYPE_LABELS[l.type]}</p>
                    <a href={l.publicPath} className="text-xs text-[#0000BF] underline" target="_blank" rel="noreferrer">
                      {l.publicPath}
                    </a>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" className={assetRowRemoveIconButtonClass} aria-label={`ลบ ${l.title}`} onClick={() => void deleteLink(l.id)}>
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AppDashboardSection>
      ) : null}

      <FormModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        title="เพิ่มลิงก์"
        footer={
          <div className={clubEventFixedBottomActionClass}>
            <button type="button" className="app-btn-primary w-full min-h-[48px] rounded-xl sm:w-auto sm:px-6" disabled={saving} onClick={() => void saveLink()}>
              บันทึก
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <select className={clubEventFieldClass} value={linkForm.type} onChange={(e) => setLinkForm({ ...linkForm, type: e.target.value as ClubEventDynamicLinkDto["type"] })}>
            {(Object.keys(CLUB_EVENT_LINK_TYPE_LABELS) as ClubEventDynamicLinkDto["type"][]).map((t) => (
              <option key={t} value={t}>
                {CLUB_EVENT_LINK_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <input className={clubEventFieldClass} placeholder="ชื่อลิงก์" value={linkForm.title} onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })} />
          {linkForm.type === "URL" ? (
            <input className={clubEventFieldClass} placeholder="https://..." value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} />
          ) : null}
          {linkForm.type === "PAYMENT" ? (
            <input className={clubEventFieldClass} placeholder="จำนวนเงิน (บาท)" value={linkForm.amountBaht} onChange={(e) => setLinkForm({ ...linkForm, amountBaht: e.target.value })} />
          ) : null}
        </div>
      </FormModal>
    </div>
  );
}
