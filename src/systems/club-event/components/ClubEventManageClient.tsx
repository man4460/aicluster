"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Filter, Plus } from "lucide-react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  CLUB_EVENT_MANAGE_PATH,
  CLUB_EVENT_MANAGE_TAB_ITEMS,
  parseClubEventManageTab,
} from "@/systems/club-event/club-event-module-nav";
import { ClubEventPageSubNav } from "@/systems/club-event/components/ClubEventPageSubNav";
import type { ClubEventAssetDto, ClubEventMemberDto } from "@/systems/club-event/lib/mappers";
import { CLUB_EVENT_ASSET_STATUS_LABELS } from "@/systems/club-event/lib/mappers";
import {
  clubEventFieldClass,
  clubEventFixedBottomActionClass,
  clubEventPanelClass,
  clubEventRowCardClass,
} from "@/systems/club-event/lib/ui-tokens";

export function ClubEventManageClient() {
  const searchParams = useSearchParams();
  const tab = parseClubEventManageTab(searchParams.get("tab"));
  const notice = useAppNoticePopup();
  const [filterOpen, setFilterOpen] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [members, setMembers] = useState<ClubEventMemberDto[]>([]);
  const [assets, setAssets] = useState<ClubEventAssetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [memberForm, setMemberForm] = useState({ id: "", name: "", phone: "", customFieldLabel: "", customFieldValue: "" });
  const [assetForm, setAssetForm] = useState({ id: "", name: "", quantity: "1", status: "AVAILABLE" as ClubEventAssetDto["status"], note: "" });

  const subTabs = useMemo(
    () =>
      CLUB_EVENT_MANAGE_TAB_ITEMS.map((t) => ({
        key: t.key,
        label: t.label,
        href: t.key === "members" ? CLUB_EVENT_MANAGE_PATH : `${CLUB_EVENT_MANAGE_PATH}?tab=${t.key}`,
      })),
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "members") {
        const res = await fetch("/api/club-event/session/members");
        const data = (await res.json()) as { members?: ClubEventMemberDto[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
        setMembers(data.members ?? []);
      } else {
        const res = await fetch("/api/club-event/session/assets");
        const data = (await res.json()) as { assets?: ClubEventAssetDto[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
        setAssets(data.assets ?? []);
      }
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [tab, notice]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredMembers = members.filter((m) => {
    if (!keyword.trim()) return true;
    const q = keyword.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.phone.includes(q);
  });

  const openMemberCreate = () => {
    setMemberForm({ id: "", name: "", phone: "", customFieldLabel: "", customFieldValue: "" });
    setModalOpen(true);
  };

  const openMemberEdit = (m: ClubEventMemberDto) => {
    const cf = m.customFields[0];
    setMemberForm({
      id: m.id,
      name: m.name,
      phone: m.phone,
      customFieldLabel: cf?.label ?? "",
      customFieldValue: cf?.value ?? "",
    });
    setModalOpen(true);
  };

  const saveMember = async () => {
    if (!memberForm.name.trim()) {
      notice.error("กรอกชื่อสมาชิก");
      return;
    }
    setSaving(true);
    try {
      const customFields =
        memberForm.customFieldLabel.trim()
          ? [{ key: "custom1", label: memberForm.customFieldLabel, value: memberForm.customFieldValue }]
          : [];
      const payload = { name: memberForm.name, phone: memberForm.phone, customFields };
      const res = await fetch(
        memberForm.id ? `/api/club-event/session/members/${memberForm.id}` : "/api/club-event/session/members",
        {
          method: memberForm.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      setModalOpen(false);
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const openAssetCreate = () => {
    setAssetForm({ id: "", name: "", quantity: "1", status: "AVAILABLE", note: "" });
    setModalOpen(true);
  };

  const openAssetEdit = (a: ClubEventAssetDto) => {
    setAssetForm({ id: a.id, name: a.name, quantity: String(a.quantity), status: a.status, note: a.note });
    setModalOpen(true);
  };

  const saveAsset = async () => {
    if (!assetForm.name.trim()) {
      notice.error("กรอกชื่อทรัพย์สิน");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: assetForm.name,
        quantity: Number(assetForm.quantity) || 1,
        status: assetForm.status,
        note: assetForm.note,
      };
      const res = await fetch(
        assetForm.id ? `/api/club-event/session/assets/${assetForm.id}` : "/api/club-event/session/assets",
        {
          method: assetForm.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      setModalOpen(false);
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (kind: "members" | "assets", id: string) => {
    if (!window.confirm("ลบรายการนี้?")) return;
    try {
      const res = await fetch(`/api/club-event/session/${kind}/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "ลบไม่สำเร็จ");
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  };

  return (
    <div className="space-y-3">
      {notice.popup}
      <ClubEventPageSubNav tabs={subTabs} ariaLabel="แท็บการจัดการ" />

      <AppDashboardSection className={clubEventPanelClass}>
        <AppSectionHeader
          title={tab === "members" ? "สมาชิกชมรม" : "ทะเบียนสินทรัพย์"}
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex items-center gap-1.5">
              {tab === "members" ? (
                <button
                  type="button"
                  aria-expanded={filterOpen}
                  aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                  className={cn(appTemplateOutlineButtonClass, "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center sm:hidden")}
                  onClick={() => setFilterOpen((o) => !o)}
                >
                  <Filter className="h-5 w-5" aria-hidden />
                </button>
              ) : null}
              <button
                type="button"
                className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center sm:min-w-0 sm:px-4"
                aria-label={tab === "members" ? "เพิ่มสมาชิก" : "เพิ่มทรัพย์สิน"}
                onClick={tab === "members" ? openMemberCreate : openAssetCreate}
              >
                <Plus className="h-5 w-5 sm:hidden" aria-hidden />
                <span className="hidden sm:inline">+ เพิ่ม{tab === "members" ? "สมาชิก" : "ทรัพย์สิน"}</span>
              </button>
            </div>
          }
        />

        {tab === "members" && filterOpen ? (
          <input
            className={cn(clubEventFieldClass, "mb-3")}
            placeholder="ค้นหาชื่อหรือเบอร์"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        ) : null}

        {loading ? (
          <p className="py-6 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : tab === "members" ? (
          filteredMembers.length === 0 ? (
            <AppEmptyState title="ยังไม่มีสมาชิก" />
          ) : (
            <ul className="space-y-2">
              {filteredMembers.map((m) => (
                <li key={m.id} className={clubEventRowCardClass}>
                  <div className="min-w-0">
                    <p className="font-black text-[#1e1b4b]">{m.name}</p>
                    {m.phone ? <p className="text-sm text-[#66638c]">{m.phone}</p> : null}
                    {m.customFields.map((cf) => (
                      <p key={cf.key} className="text-xs text-[#5f5a8a]">
                        {cf.label}: {cf.value}
                      </p>
                    ))}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" className={assetRowEditIconButtonClass} aria-label={`แก้ไข ${m.name}`} onClick={() => openMemberEdit(m)}>
                      <IconRowEdit className="h-4 w-4" />
                    </button>
                    <button type="button" className={assetRowRemoveIconButtonClass} aria-label={`ลบ ${m.name}`} onClick={() => void removeItem("members", m.id)}>
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : assets.length === 0 ? (
          <AppEmptyState title="ยังไม่มีทรัพย์สิน" />
        ) : (
          <ul className="space-y-2">
            {assets.map((a) => (
              <li key={a.id} className={clubEventRowCardClass}>
                <div className="min-w-0">
                  <p className="font-black text-[#1e1b4b]">{a.name}</p>
                  <p className="text-sm text-[#66638c]">
                    จำนวน {a.quantity} · {CLUB_EVENT_ASSET_STATUS_LABELS[a.status]}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" className={assetRowEditIconButtonClass} aria-label={`แก้ไข ${a.name}`} onClick={() => openAssetEdit(a)}>
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button type="button" className={assetRowRemoveIconButtonClass} aria-label={`ลบ ${a.name}`} onClick={() => void removeItem("assets", a.id)}>
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppDashboardSection>

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={tab === "members" ? (memberForm.id ? "แก้ไขสมาชิก" : "เพิ่มสมาชิก") : assetForm.id ? "แก้ไขทรัพย์สิน" : "เพิ่มทรัพย์สิน"}
        footer={
          <div className={clubEventFixedBottomActionClass}>
            <button
              type="button"
              className="app-btn-primary w-full min-h-[48px] rounded-xl sm:w-auto sm:px-6"
              disabled={saving}
              onClick={() => void (tab === "members" ? saveMember() : saveAsset())}
            >
              บันทึก
            </button>
          </div>
        }
      >
        {tab === "members" ? (
          <div className="space-y-3">
            <input className={clubEventFieldClass} placeholder="ชื่อ" value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} />
            <input className={clubEventFieldClass} placeholder="เบอร์โทร" value={memberForm.phone} onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })} />
            <input className={clubEventFieldClass} placeholder="ฟิลด์เพิ่ม (เช่น ไซส์เสื้อ)" value={memberForm.customFieldLabel} onChange={(e) => setMemberForm({ ...memberForm, customFieldLabel: e.target.value })} />
            <input className={clubEventFieldClass} placeholder="ค่า" value={memberForm.customFieldValue} onChange={(e) => setMemberForm({ ...memberForm, customFieldValue: e.target.value })} />
          </div>
        ) : (
          <div className="space-y-3">
            <input className={clubEventFieldClass} placeholder="ชื่อทรัพย์สิน" value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} />
            <input className={clubEventFieldClass} placeholder="จำนวน" inputMode="numeric" value={assetForm.quantity} onChange={(e) => setAssetForm({ ...assetForm, quantity: e.target.value })} />
            <select className={clubEventFieldClass} value={assetForm.status} onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value as ClubEventAssetDto["status"] })}>
              {(Object.keys(CLUB_EVENT_ASSET_STATUS_LABELS) as ClubEventAssetDto["status"][]).map((s) => (
                <option key={s} value={s}>
                  {CLUB_EVENT_ASSET_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <textarea className={cn(clubEventFieldClass, "min-h-[80px]")} placeholder="หมายเหตุ" value={assetForm.note} onChange={(e) => setAssetForm({ ...assetForm, note: e.target.value })} />
          </div>
        )}
      </FormModal>
    </div>
  );
}
