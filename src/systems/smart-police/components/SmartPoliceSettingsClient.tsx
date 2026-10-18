"use client";

import { useCallback, useEffect, useState } from "react";
import { AppDashboardSection, AppEmptyState, AppSectionHeader } from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import type { SmartPoliceOfficerDto, SmartPoliceProfileDto } from "@/lib/smart-police/types";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";

type SettingsTab = "agency" | "officers";

const emptyOfficer = { fullName: "", rankTitle: "", position: "", isDefault: false };

export function SmartPoliceSettingsClient() {
  const [tab, setTab] = useState<SettingsTab>("agency");
  const [profile, setProfile] = useState<SmartPoliceProfileDto | null>(null);
  const [officers, setOfficers] = useState<SmartPoliceOfficerDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [officerModal, setOfficerModal] = useState(false);
  const [editingOfficerId, setEditingOfficerId] = useState<string | null>(null);
  const [officerForm, setOfficerForm] = useState(emptyOfficer);

  const loadProfile = useCallback(async () => {
    const res = await fetch("/api/smart-police/profile", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { profile: SmartPoliceProfileDto };
    setProfile(data.profile);
  }, []);

  const loadOfficers = useCallback(async () => {
    const res = await fetch("/api/smart-police/officers", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { officers: SmartPoliceOfficerDto[] };
    setOfficers(data.officers);
  }, []);

  useEffect(() => {
    void loadProfile();
    void loadOfficers();
  }, [loadProfile, loadOfficers]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    const res = await fetch("/api/smart-police/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    if (res.ok) showToast("บันทึกหน่วยงานแล้ว");
  }

  function openAddOfficer() {
    setEditingOfficerId(null);
    setOfficerForm(emptyOfficer);
    setOfficerModal(true);
  }

  function openEditOfficer(o: SmartPoliceOfficerDto) {
    setEditingOfficerId(o.id);
    setOfficerForm({
      fullName: o.fullName,
      rankTitle: o.rankTitle ?? "",
      position: o.position ?? "",
      isDefault: o.isDefault,
    });
    setOfficerModal(true);
  }

  async function saveOfficer() {
    if (!officerForm.fullName.trim()) return;
    setSaving(true);
    const url = editingOfficerId
      ? `/api/smart-police/officers/${editingOfficerId}`
      : "/api/smart-police/officers";
    await fetch(url, {
      method: editingOfficerId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(officerForm),
    });
    setSaving(false);
    setOfficerModal(false);
    await loadOfficers();
    await loadProfile();
    showToast("บันทึกพนักงานสอบสวนแล้ว");
  }

  async function deleteOfficer(id: string, name: string) {
    if (!window.confirm(`ลบ ${name}?`)) return;
    await fetch(`/api/smart-police/officers/${id}`, { method: "DELETE" });
    await loadOfficers();
  }

  if (!profile) return <p className="text-sm text-[#66638c]">กำลังโหลด…</p>;

  return (
    <div className="space-y-4">
      {toast ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
          {toast}
        </p>
      ) : null}

      <AppDashboardSection>
        <AppSectionHeader
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start"
          title="ตั้งค่า"
          description="ฐานข้อมูลกลาง — หน่วยงานและพนักงานสอบสวน"
          action={
            tab === "agency" ? (
              <button
                type="button"
                className="app-btn-primary min-h-[40px] rounded-xl px-4 text-sm"
                disabled={saving}
                onClick={() => void saveProfile()}
              >
                {saving ? "…" : "บันทึก"}
              </button>
            ) : (
              <button
                type="button"
                className="app-btn-primary min-h-[40px] min-w-[40px] rounded-xl px-3 text-sm sm:min-w-0 sm:px-4"
                onClick={openAddOfficer}
                aria-label="เพิ่มพนักงานสอบสวน"
              >
                <span className="sm:hidden">+</span>
                <span className="hidden sm:inline">+ เพิ่มพงส.</span>
              </button>
            )
          }
        />

        <div className="mb-3 sm:hidden">
          <label className="text-xs font-semibold text-[#66638c]">
            กรุณาเลือกหมวดตั้งค่า
            <select
              className="app-input mt-1 w-full rounded-xl"
              value={tab}
              onChange={(e) => setTab(e.target.value as SettingsTab)}
            >
              <option value="agency">หน่วยงาน</option>
              <option value="officers">พนักงานสอบสวน</option>
            </select>
          </label>
        </div>

        <div className="mb-4 hidden sm:block">
          <nav role="tablist" className="flex flex-wrap gap-2" aria-label="หมวดตั้งค่า">
            {(
              [
                { key: "agency" as const, label: "หน่วยงาน" },
                { key: "officers" as const, label: "พนักงานสอบสวน" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                className={cn(
                  "min-h-10 rounded-xl px-4 text-sm font-semibold",
                  tab === t.key
                    ? "bg-gradient-to-r from-[#4f2f9a] to-[#5b61ff] text-white"
                    : "border border-white/60 bg-white/70 text-[#4d47b6]",
                )}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {tab === "agency" ? (
          <div role="tabpanel" className="grid gap-3 text-left sm:grid-cols-2">
            <label className="text-sm font-medium text-[#2e2a58] sm:col-span-2">
              ชื่อสถานี *
              <input
                className="app-input mt-1 w-full rounded-xl"
                value={profile.stationName}
                onChange={(e) => setProfile((p) => (p ? { ...p, stationName: e.target.value } : p))}
              />
            </label>
            <label className="text-sm font-medium text-[#2e2a58] sm:col-span-2">
              ที่อยู่สถานี
              <textarea
                className="app-input mt-1 w-full rounded-xl"
                value={profile.stationAddress ?? ""}
                onChange={(e) =>
                  setProfile((p) => (p ? { ...p, stationAddress: e.target.value } : p))
                }
              />
            </label>
            <label className="text-sm font-medium text-[#2e2a58]">
              จังหวัด
              <input
                className="app-input mt-1 w-full rounded-xl"
                value={profile.province ?? ""}
                onChange={(e) => setProfile((p) => (p ? { ...p, province: e.target.value } : p))}
              />
            </label>
            <label className="text-sm font-medium text-[#2e2a58]">
              คำนำหน้าเลขคดี
              <input
                className="app-input mt-1 w-full rounded-xl"
                value={profile.caseNumberPrefix}
                onChange={(e) =>
                  setProfile((p) => (p ? { ...p, caseNumberPrefix: e.target.value } : p))
                }
              />
            </label>
            <label className="text-sm font-medium text-[#2e2a58]">
              ยศหัวหน้าหน่วย
              <input
                className="app-input mt-1 w-full rounded-xl"
                value={profile.commanderRank ?? ""}
                onChange={(e) =>
                  setProfile((p) => (p ? { ...p, commanderRank: e.target.value } : p))
                }
              />
            </label>
            <label className="text-sm font-medium text-[#2e2a58]">
              ชื่อหัวหน้าหน่วย
              <input
                className="app-input mt-1 w-full rounded-xl"
                value={profile.commanderName ?? ""}
                onChange={(e) =>
                  setProfile((p) => (p ? { ...p, commanderName: e.target.value } : p))
                }
              />
            </label>
            <label className="text-sm font-medium text-[#2e2a58]">
              ตำแหน่งหัวหน้าหน่วย
              <input
                className="app-input mt-1 w-full rounded-xl"
                value={profile.commanderTitle ?? ""}
                onChange={(e) =>
                  setProfile((p) => (p ? { ...p, commanderTitle: e.target.value } : p))
                }
              />
            </label>
            <label className="text-sm font-medium text-[#2e2a58]">
              ยศหัวหน้างาน
              <input
                className="app-input mt-1 w-full rounded-xl"
                value={profile.headOfWorkRank ?? ""}
                onChange={(e) =>
                  setProfile((p) => (p ? { ...p, headOfWorkRank: e.target.value } : p))
                }
              />
            </label>
            <label className="text-sm font-medium text-[#2e2a58]">
              ชื่อหัวหน้างาน
              <input
                className="app-input mt-1 w-full rounded-xl"
                value={profile.headOfWorkName ?? ""}
                onChange={(e) =>
                  setProfile((p) => (p ? { ...p, headOfWorkName: e.target.value } : p))
                }
              />
            </label>
            <label className="text-sm font-medium text-[#2e2a58] sm:col-span-2">
              พนักงานสอบสวน (ค่าเริ่มต้นในเอกสาร — ซิงก์จากพงส.ที่ตั้งเป็นค่าเริ่มได้)
              <input
                className="app-input mt-1 w-full rounded-xl"
                value={profile.investigatorDefault ?? ""}
                onChange={(e) =>
                  setProfile((p) => (p ? { ...p, investigatorDefault: e.target.value } : p))
                }
              />
            </label>
            <label className="text-sm font-medium text-[#2e2a58] sm:col-span-2">
              ท้ายกระดาษพิมพ์
              <textarea
                className="app-input mt-1 w-full rounded-xl"
                value={profile.printFooter ?? ""}
                onChange={(e) => setProfile((p) => (p ? { ...p, printFooter: e.target.value } : p))}
              />
            </label>
          </div>
        ) : (
          <div role="tabpanel" className="space-y-2">
            {officers.length === 0 ? (
              <AppEmptyState tone="violet">
                ยังไม่มีพนักงานสอบสวน —{" "}
                <button type="button" className="font-semibold text-[#5b61ff] underline" onClick={openAddOfficer}>
                  เพิ่มพงส.
                </button>
              </AppEmptyState>
            ) : (
              <ul className="space-y-2">
                {officers.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-start justify-between gap-2 rounded-xl border border-l-[3px] border-indigo-200 border-l-indigo-500 bg-indigo-50/50 px-3 py-2"
                  >
                    <div className="min-w-0 text-left">
                      <p className="font-semibold text-[#1e1b4b]">
                        {[o.rankTitle, o.fullName].filter(Boolean).join(" ")}
                        {o.isDefault ? (
                          <span className="ml-2 text-xs font-bold text-emerald-700">ค่าเริ่ม</span>
                        ) : null}
                      </p>
                      {o.position ? <p className="text-xs text-[#66638c]">{o.position}</p> : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        className={assetRowEditIconButtonClass}
                        aria-label={`แก้ไข ${o.fullName}`}
                        title="แก้ไข"
                        onClick={() => openEditOfficer(o)}
                      >
                        <IconRowEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        aria-label={`ลบ ${o.fullName}`}
                        title="ลบ"
                        onClick={() => void deleteOfficer(o.id, o.fullName)}
                      >
                        <IconRowRemove className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </AppDashboardSection>

      <FormModal
        open={officerModal}
        onClose={() => setOfficerModal(false)}
        title={editingOfficerId ? "แก้ไขพนักงานสอบสวน" : "เพิ่มพนักงานสอบสวน"}
        size="md"
        footer={
          <FormModalFooterActions
            onCancel={() => setOfficerModal(false)}
            onSubmit={() => void saveOfficer()}
            submitLabel="บันทึก"
            submitDisabled={!officerForm.fullName.trim()}
            loading={saving}
          />
        }
      >
        <div className="space-y-3 text-left">
          <label className="block text-sm font-medium">
            ชื่อ *
            <input
              className="app-input mt-1 w-full rounded-xl"
              value={officerForm.fullName}
              onChange={(e) => setOfficerForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </label>
          <label className="block text-sm font-medium">
            ยศ
            <input
              className="app-input mt-1 w-full rounded-xl"
              value={officerForm.rankTitle}
              onChange={(e) => setOfficerForm((f) => ({ ...f, rankTitle: e.target.value }))}
            />
          </label>
          <label className="block text-sm font-medium">
            ตำแหน่ง
            <input
              className="app-input mt-1 w-full rounded-xl"
              value={officerForm.position}
              onChange={(e) => setOfficerForm((f) => ({ ...f, position: e.target.value }))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={officerForm.isDefault}
              onChange={(e) => setOfficerForm((f) => ({ ...f, isDefault: e.target.checked }))}
            />
            ตั้งเป็นพงส. ค่าเริ่มต้น
          </label>
        </div>
      </FormModal>
    </div>
  );
}
