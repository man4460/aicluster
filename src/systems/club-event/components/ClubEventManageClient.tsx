"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Upload } from "lucide-react";
import {
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  prepareImageFileForUpload,
  useAppImageLightbox,
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
  CLUB_EVENT_MANAGE_TAB_ITEMS,
  clubEventManageHref,
  parseClubEventManageTab,
  type ClubEventManageTabKey,
} from "@/systems/club-event/club-event-module-nav";
import { ClubEventPageSubNav } from "@/systems/club-event/components/ClubEventPageSubNav";
import type {
  ClubEventAssetDto,
  ClubEventMemberDto,
  ClubMemberCustomField,
} from "@/systems/club-event/lib/mappers";
import { CLUB_EVENT_ASSET_STATUS_LABELS } from "@/systems/club-event/lib/mappers";
import {
  CLUB_EVENT_MEMBER_GENDER_OPTIONS,
  clubEventMemberGenderLabel,
} from "@/systems/club-event/lib/member-excel";
import {
  clubEventFieldClass,
  clubEventFixedBottomActionClass,
  clubEventInlineSubNavBtnClass,
  clubEventInlineSubNavShellClass,
  clubEventOutlineButtonClass,
  clubEventPrimaryButtonClass,
  clubEventRowCardClass,
  clubEventTextareaClass,
} from "@/systems/club-event/lib/ui-tokens";

function IconPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}

const labelClass = "block space-y-1";
const labelText = "text-xs font-bold text-[#4d47b6]";

type MemberFormState = {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  gender: string;
  phone: string;
  photoUrl: string | null;
  position: string;
  email: string;
  social: string;
  memberCode: string;
  dataConsent: boolean;
  isActive: boolean;
  customFields: ClubMemberCustomField[];
};

function emptyMemberForm(): MemberFormState {
  return {
    id: "",
    firstName: "",
    lastName: "",
    nickname: "",
    gender: "",
    phone: "",
    photoUrl: null,
    position: "",
    email: "",
    social: "",
    memberCode: "",
    dataConsent: false,
    isActive: true,
    customFields: [],
  };
}

export function ClubEventManageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseClubEventManageTab(searchParams.get("tab"));
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [filterOpen, setFilterOpen] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [members, setMembers] = useState<ClubEventMemberDto[]>([]);
  const [assets, setAssets] = useState<ClubEventAssetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importBusy, setImportBusy] = useState(false);

  const [memberForm, setMemberForm] = useState<MemberFormState>(emptyMemberForm);
  const [assetForm, setAssetForm] = useState({
    id: "",
    name: "",
    quantity: "1",
    status: "AVAILABLE" as ClubEventAssetDto["status"],
    note: "",
    imageUrl: "" as string | null,
  });

  const setTab = useCallback(
    (next: string) => {
      router.replace(clubEventManageHref(next as ClubEventManageTabKey), { scroll: false });
    },
    [router],
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
  }, [tab, notice.error]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredMembers = members.filter((m) => {
    if (!keyword.trim()) return true;
    const q = keyword.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.nickname.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      m.memberCode.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.position.toLowerCase().includes(q)
    );
  });

  const uploadImage = async (file: File, kind: "member" | "asset") => {
    try {
      const prepared = await prepareImageFileForUpload(file);
      const formData = new FormData();
      formData.set("file", prepared);
      const res = await fetch("/api/club-event/session/images/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { imageUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
      if (kind === "member") {
        setMemberForm((f) => ({ ...f, photoUrl: data.imageUrl ?? null }));
      } else {
        setAssetForm((f) => ({ ...f, imageUrl: data.imageUrl ?? null }));
      }
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    }
  };

  const openMemberCreate = () => {
    setMemberForm(emptyMemberForm());
    setModalOpen(true);
  };

  const openMemberEdit = (m: ClubEventMemberDto) => {
    setMemberForm({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      nickname: m.nickname,
      gender: m.gender,
      phone: m.phone,
      photoUrl: m.photoUrl,
      position: m.position,
      email: m.email,
      social: m.social,
      memberCode: m.memberCode,
      dataConsent: m.dataConsent,
      isActive: m.isActive,
      customFields: m.customFields.length
        ? m.customFields.map((cf) => ({ ...cf }))
        : [],
    });
    setModalOpen(true);
  };

  const saveMember = async () => {
    if (!memberForm.firstName.trim()) {
      notice.error("กรอกชื่อ");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        firstName: memberForm.firstName.trim(),
        lastName: memberForm.lastName.trim(),
        nickname: memberForm.nickname.trim(),
        gender: memberForm.gender,
        phone: memberForm.phone,
        photoUrl: memberForm.photoUrl,
        position: memberForm.position.trim(),
        email: memberForm.email.trim(),
        social: memberForm.social.trim(),
        memberCode: memberForm.memberCode.trim(),
        dataConsent: memberForm.dataConsent,
        isActive: memberForm.isActive,
        customFields: memberForm.customFields
          .filter((cf) => cf.label.trim())
          .map((cf, i) => ({
            key: cf.key || `custom_${i + 1}`,
            label: cf.label.trim(),
            value: cf.value ?? "",
          })),
      };
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
      notice.success("บันทึกสมาชิกแล้ว");
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const downloadExcel = async (mode: "template" | "export") => {
    try {
      const q = mode === "export" ? "?mode=export" : "";
      const res = await fetch(`/api/club-event/session/members/excel${q}`);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "ดาวน์โหลดไม่สำเร็จ");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        mode === "export"
          ? `club-event-members-${new Date().toISOString().slice(0, 10)}.xls`
          : "club-event-members-template.xls";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      notice.success(mode === "export" ? "ดาวน์โหลดรายชื่อแล้ว" : "ดาวน์โหลดแบบฟอร์มแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ดาวน์โหลดไม่สำเร็จ");
    }
  };

  const importExcel = async (file: File) => {
    setImportBusy(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/club-event/session/members/import", { method: "POST", body: fd });
      const data = (await res.json()) as {
        error?: string;
        created?: number;
        updated?: number;
        errors?: string[];
      };
      if (!res.ok) throw new Error(data.error ?? "นำเข้าไม่สำเร็จ");
      const extra =
        data.errors && data.errors.length > 0 ? ` · คำเตือน ${data.errors.length} รายการ` : "";
      notice.success(`นำเข้าแล้ว สร้าง ${data.created ?? 0} · อัปเดต ${data.updated ?? 0}${extra}`);
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "นำเข้าไม่สำเร็จ");
    } finally {
      setImportBusy(false);
    }
  };

  const openAssetCreate = () => {
    setAssetForm({ id: "", name: "", quantity: "1", status: "AVAILABLE", note: "", imageUrl: null });
    setModalOpen(true);
  };

  const openAssetEdit = (a: ClubEventAssetDto) => {
    setAssetForm({
      id: a.id,
      name: a.name,
      quantity: String(a.quantity),
      status: a.status,
      note: a.note,
      imageUrl: a.imageUrl,
    });
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
        imageUrl: assetForm.imageUrl,
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
    const ok = await notice.confirm("ลบรายการนี้ใช่หรือไม่?");
    if (!ok) return;
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
    <>
      {notice.popup}
      <input
        ref={excelInputRef}
        type="file"
        accept=".xls,.csv,text/csv,application/vnd.ms-excel"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void importExcel(f);
        }}
      />
      <ClubEventPageSubNav
        title="การจัดการ"
        items={CLUB_EVENT_MANAGE_TAB_ITEMS}
        activeKey={tab}
        onSelect={setTab}
        ariaLabel="แท็บการจัดการ"
        action={
          <div className={clubEventInlineSubNavShellClass}>
            {tab === "members" ? (
              <>
                <button
                  type="button"
                  aria-expanded={filterOpen}
                  aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                  title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
                  className={cn(clubEventInlineSubNavBtnClass(filterOpen), "relative")}
                  onClick={() => setFilterOpen((o) => !o)}
                >
                  <IconFilter className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                </button>
                <button
                  type="button"
                  className={clubEventInlineSubNavBtnClass(false)}
                  aria-label="ดาวน์โหลดแบบฟอร์ม Excel"
                  title="ดาวน์โหลดแบบฟอร์ม"
                  onClick={() => void downloadExcel("template")}
                >
                  <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="hidden lg:inline">แบบฟอร์ม</span>
                </button>
                <button
                  type="button"
                  className={clubEventInlineSubNavBtnClass(false)}
                  aria-label="ส่งออกรายชื่อ Excel"
                  title="ส่งออกรายชื่อ"
                  onClick={() => void downloadExcel("export")}
                >
                  <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="hidden lg:inline">ส่งออก</span>
                </button>
                <button
                  type="button"
                  className={clubEventInlineSubNavBtnClass(false)}
                  aria-label="อัปโหลดแบบฟอร์ม Excel"
                  title="อัปโหลด Excel"
                  disabled={importBusy}
                  onClick={() => excelInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="hidden lg:inline">{importBusy ? "กำลังนำเข้า…" : "นำเข้า"}</span>
                </button>
              </>
            ) : null}
            <button
              type="button"
              className={clubEventInlineSubNavBtnClass(false)}
              aria-label={tab === "members" ? "เพิ่มสมาชิก" : "เพิ่มทรัพย์สิน"}
              title={tab === "members" ? "เพิ่มสมาชิก" : "เพิ่มทรัพย์สิน"}
              onClick={tab === "members" ? openMemberCreate : openAssetCreate}
            >
              <IconPlus className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">เพิ่ม{tab === "members" ? "สมาชิก" : "ทรัพย์สิน"}</span>
            </button>
          </div>
        }
      >
        {tab === "members" && filterOpen ? (
          <input
            className={cn(clubEventFieldClass, "mb-3")}
            placeholder="ค้นหาชื่อ · ชื่อเล่น · เบอร์ · รหัส · อีเมล · ตำแหน่ง"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        ) : null}

        {loading ? (
          <p className="py-6 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : tab === "members" ? (
          filteredMembers.length === 0 ? (
            <AppEmptyState>ยังไม่มีสมาชิก — เพิ่มทีละคนหรือนำเข้าจากแบบฟอร์ม Excel</AppEmptyState>
          ) : (
            <ul className="space-y-2">
              {filteredMembers.map((m) => (
                <li key={m.id} className={clubEventRowCardClass}>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {m.photoUrl ? (
                      <AppImageThumb src={m.photoUrl} alt={m.name} onOpen={() => lb.open(m.photoUrl!)} />
                    ) : (
                      <div
                        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-400"
                        aria-hidden
                      >
                        ไม่มีรูป
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-[#1e1b4b]">
                        {m.name}
                        {m.nickname ? (
                          <span className="ml-1 font-semibold text-[#66638c]">({m.nickname})</span>
                        ) : null}
                      </p>
                      <p className="text-sm text-[#66638c]">
                        {[
                          m.memberCode ? `รหัส ${m.memberCode}` : null,
                          m.position || null,
                          clubEventMemberGenderLabel(m.gender) !== "ไม่ระบุ"
                            ? clubEventMemberGenderLabel(m.gender)
                            : null,
                          m.phone || null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <p className="mt-0.5 text-xs text-[#5f5a8a]">
                        {m.dataConsent ? "ยินยอมเก็บข้อมูล" : "ยังไม่ยินยอมเก็บข้อมูล"}
                        {!m.isActive ? " · ปิดใช้งาน" : ""}
                      </p>
                      {m.customFields.map((cf) => (
                        <p key={cf.key} className="text-xs text-[#5f5a8a]">
                          {cf.label}: {cf.value}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1 self-end sm:self-center">
                    <button
                      type="button"
                      className={assetRowEditIconButtonClass}
                      aria-label={`แก้ไข ${m.name}`}
                      onClick={() => openMemberEdit(m)}
                    >
                      <IconRowEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ลบ ${m.name}`}
                      onClick={() => void removeItem("members", m.id)}
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : assets.length === 0 ? (
          <AppEmptyState>ยังไม่มีทรัพย์สิน</AppEmptyState>
        ) : (
          <ul className="space-y-2">
            {assets.map((a) => (
              <li key={a.id} className={clubEventRowCardClass}>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {a.imageUrl ? (
                    <AppImageThumb src={a.imageUrl} alt={a.name} onOpen={() => lb.open(a.imageUrl!)} />
                  ) : (
                    <div
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-400"
                      aria-hidden
                    >
                      ไม่มีรูป
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-[#1e1b4b]">{a.name}</p>
                    <p className="text-sm text-[#66638c]">
                      จำนวน {a.quantity} · {CLUB_EVENT_ASSET_STATUS_LABELS[a.status]}
                    </p>
                    {a.note ? <p className="text-xs text-[#5f5a8a]">{a.note}</p> : null}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 self-end sm:self-center">
                  <button
                    type="button"
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไข ${a.name}`}
                    onClick={() => openAssetEdit(a)}
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบ ${a.name}`}
                    onClick={() => void removeItem("assets", a.id)}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ClubEventPageSubNav>

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          tab === "members"
            ? memberForm.id
              ? "แก้ไขสมาชิก"
              : "เพิ่มสมาชิก"
            : assetForm.id
              ? "แก้ไขทรัพย์สิน"
              : "เพิ่มทรัพย์สิน"
        }
        mobileCentered
        footer={
          <div className={clubEventFixedBottomActionClass}>
            <button
              type="button"
              className={cn(clubEventPrimaryButtonClass, "w-full sm:w-auto sm:px-6")}
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
            <div className="flex items-center gap-3">
              {memberForm.photoUrl ? (
                <AppImageThumb
                  src={memberForm.photoUrl}
                  alt="รูปโปรไฟล์"
                  onOpen={() => lb.open(memberForm.photoUrl!)}
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-[10px] text-slate-400">
                  รูปโปรไฟล์
                </div>
              )}
              <label className={cn(clubEventOutlineButtonClass, "inline-flex cursor-pointer")}>
                อัปโหลดรูปโปรไฟล์
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadImage(f, "member");
                    e.target.value = "";
                  }}
                />
              </label>
              {memberForm.photoUrl ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-rose-600"
                  onClick={() => setMemberForm((f) => ({ ...f, photoUrl: null }))}
                >
                  ลบรูป
                </button>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                <span className={labelText}>ชื่อ *</span>
                <input
                  className={cn(clubEventFieldClass, "mt-1")}
                  value={memberForm.firstName}
                  onChange={(e) => setMemberForm({ ...memberForm, firstName: e.target.value })}
                  placeholder="ชื่อจริง"
                />
              </label>
              <label className={labelClass}>
                <span className={labelText}>นามสกุล</span>
                <input
                  className={cn(clubEventFieldClass, "mt-1")}
                  value={memberForm.lastName}
                  onChange={(e) => setMemberForm({ ...memberForm, lastName: e.target.value })}
                  placeholder="นามสกุล"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                <span className={labelText}>ชื่อเล่น</span>
                <input
                  className={cn(clubEventFieldClass, "mt-1")}
                  value={memberForm.nickname}
                  onChange={(e) => setMemberForm({ ...memberForm, nickname: e.target.value })}
                />
              </label>
              <label className={labelClass}>
                <span className={labelText}>เพศ</span>
                <select
                  className={cn(clubEventFieldClass, "mt-1")}
                  value={memberForm.gender}
                  onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value })}
                >
                  {CLUB_EVENT_MEMBER_GENDER_OPTIONS.map((opt) => (
                    <option key={opt.value || "none"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                <span className={labelText}>โทรศัพท์</span>
                <input
                  className={cn(clubEventFieldClass, "mt-1")}
                  value={memberForm.phone}
                  onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                  inputMode="tel"
                  placeholder="08x-xxx-xxxx"
                />
              </label>
              <label className={labelClass}>
                <span className={labelText}>ตำแหน่ง</span>
                <input
                  className={cn(clubEventFieldClass, "mt-1")}
                  value={memberForm.position}
                  onChange={(e) => setMemberForm({ ...memberForm, position: e.target.value })}
                  placeholder="เช่น สมาชิก · กรรมการ"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                <span className={labelText}>อีเมล</span>
                <input
                  className={cn(clubEventFieldClass, "mt-1")}
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                  inputMode="email"
                  placeholder="name@email.com"
                />
              </label>
              <label className={labelClass}>
                <span className={labelText}>โซเชียล</span>
                <input
                  className={cn(clubEventFieldClass, "mt-1")}
                  value={memberForm.social}
                  onChange={(e) => setMemberForm({ ...memberForm, social: e.target.value })}
                  placeholder="LINE / Facebook / IG"
                />
              </label>
            </div>

            <label className={labelClass}>
              <span className={labelText}>รหัสสมาชิก</span>
              <input
                className={cn(clubEventFieldClass, "mt-1")}
                value={memberForm.memberCode}
                onChange={(e) => setMemberForm({ ...memberForm, memberCode: e.target.value })}
                placeholder="เช่น M001"
              />
            </label>

            <div className="flex flex-wrap gap-4 rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-2.5">
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#1e1b4b]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={memberForm.dataConsent}
                  onChange={(e) => setMemberForm({ ...memberForm, dataConsent: e.target.checked })}
                />
                ยินยอมเก็บข้อมูลส่วนบุคคล
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#1e1b4b]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={memberForm.isActive}
                  onChange={(e) => setMemberForm({ ...memberForm, isActive: e.target.checked })}
                />
                เปิดใช้งาน
              </label>
            </div>

            <div className="space-y-2 rounded-lg border border-slate-200/90 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-black text-[#4d47b6]">ช่องกรอกเพิ่มเติม</p>
                <button
                  type="button"
                  className={clubEventOutlineButtonClass}
                  onClick={() =>
                    setMemberForm((f) => ({
                      ...f,
                      customFields: [
                        ...f.customFields,
                        {
                          key: `custom_${f.customFields.length + 1}`,
                          label: "",
                          value: "",
                        },
                      ],
                    }))
                  }
                >
                  + เพิ่มช่อง
                </button>
              </div>
              {memberForm.customFields.length === 0 ? (
                <p className="text-xs text-[#8b87b8]">ยังไม่มีช่องเพิ่ม — กด «เพิ่มช่อง» เพื่อกำหนดป้ายและค่า</p>
              ) : (
                <ul className="space-y-2">
                  {memberForm.customFields.map((cf, idx) => (
                    <li key={`${cf.key}-${idx}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <input
                        className={clubEventFieldClass}
                        placeholder="ป้ายช่อง (เช่น ไซส์เสื้อ)"
                        value={cf.label}
                        onChange={(e) => {
                          const next = [...memberForm.customFields];
                          next[idx] = { ...cf, label: e.target.value };
                          setMemberForm({ ...memberForm, customFields: next });
                        }}
                      />
                      <input
                        className={clubEventFieldClass}
                        placeholder="ค่า"
                        value={cf.value}
                        onChange={(e) => {
                          const next = [...memberForm.customFields];
                          next[idx] = { ...cf, value: e.target.value };
                          setMemberForm({ ...memberForm, customFields: next });
                        }}
                      />
                      <button
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        aria-label={`ลบช่อง ${cf.label || idx + 1}`}
                        onClick={() =>
                          setMemberForm({
                            ...memberForm,
                            customFields: memberForm.customFields.filter((_, i) => i !== idx),
                          })
                        }
                      >
                        <IconRowRemove className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {assetForm.imageUrl ? (
                <AppImageThumb src={assetForm.imageUrl} alt="รูปทรัพย์สิน" onOpen={() => lb.open(assetForm.imageUrl!)} />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-[10px] text-slate-400">
                  รูป
                </div>
              )}
              <label className={cn(clubEventOutlineButtonClass, "inline-flex cursor-pointer")}>
                อัปโหลดรูป
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadImage(f, "asset");
                    e.target.value = "";
                  }}
                />
              </label>
              {assetForm.imageUrl ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-rose-600"
                  onClick={() => setAssetForm((f) => ({ ...f, imageUrl: null }))}
                >
                  ลบรูป
                </button>
              ) : null}
            </div>
            <input
              className={clubEventFieldClass}
              placeholder="ชื่อทรัพย์สิน"
              value={assetForm.name}
              onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
            />
            <input
              className={clubEventFieldClass}
              placeholder="จำนวน"
              inputMode="numeric"
              value={assetForm.quantity}
              onChange={(e) => setAssetForm({ ...assetForm, quantity: e.target.value })}
            />
            <select
              className={clubEventFieldClass}
              value={assetForm.status}
              onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value as ClubEventAssetDto["status"] })}
            >
              {(Object.keys(CLUB_EVENT_ASSET_STATUS_LABELS) as ClubEventAssetDto["status"][]).map((s) => (
                <option key={s} value={s}>
                  {CLUB_EVENT_ASSET_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <textarea
              className={clubEventTextareaClass}
              placeholder="หมายเหตุ"
              value={assetForm.note}
              onChange={(e) => setAssetForm({ ...assetForm, note: e.target.value })}
            />
          </div>
        )}
      </FormModal>
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูป" />
    </>
  );
}
