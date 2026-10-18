"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppEmptyState } from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import type { SmartPoliceOfficerDto, SmartPoliceProfileDto } from "@/lib/smart-police/types";
import { SmartPoliceChargesPanel } from "@/systems/smart-police/components/SmartPoliceChargesPanel";
import {
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  smartPoliceCardHeaderRowClass,
  smartPoliceCardTitleClass,
  smartPoliceCardTitleRowClass,
  smartPoliceFieldClass,
  smartPoliceHeaderActionShellClass,
  smartPoliceLabelClass,
  smartPoliceListRowAccentClass,
  smartPoliceMutedTextClass,
  smartPoliceFillPanelClass,
  smartPolicePageStackClass,
  smartPolicePanelClass,
  smartPolicePanelSectionClass,
  smartPolicePrimaryButtonClass,
  smartPolicePrimaryTabPillClass,
  smartPoliceRowIconButtonClass,
  smartPoliceRowRemoveIconButtonClass,
  smartPoliceTextareaClass,
  smartPoliceToastSuccessClass,
} from "@/systems/smart-police/lib/ui-tokens";

/** เส้นบางคั่นกลุ่มปุ่มในแถบหัว */
const settingsToolbarDividerClass =
  "mx-0.5 inline-block h-5 w-px shrink-0 self-center bg-slate-300/90";

type SettingsTab = "agency" | "officers" | "charges";

const SETTINGS_TABS: { key: SettingsTab; label: string }[] = [
  { key: "agency", label: "หน่วยงาน" },
  { key: "officers", label: "พนักงานสอบสวน" },
  { key: "charges", label: "คลังข้อหา" },
];

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
  const openAddChargeRef = useRef<(() => void) | null>(null);

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

  const registerOpenAddCharge = useCallback((open: () => void) => {
    openAddChargeRef.current = open;
  }, []);

  if (!profile) return <p className={smartPoliceMutedTextClass}>กำลังโหลด…</p>;

  return (
    <div className={smartPolicePageStackClass}>
      {toast ? <p className={smartPoliceToastSuccessClass}>{toast}</p> : null}

      <section
        className={cn(
          smartPolicePanelClass,
          smartPolicePanelSectionClass,
          smartPoliceFillPanelClass,
        )}
      >
        <div className={cn(smartPoliceCardHeaderRowClass, "shrink-0")}>
          <div className={smartPoliceCardTitleRowClass}>
            <h2 className={smartPoliceCardTitleClass}>ตั้งค่า</h2>
          </div>

          <div
            className={cn(smartPoliceHeaderActionShellClass, "max-w-full justify-end")}
            role="toolbar"
            aria-label="หมวดตั้งค่าและแอ็กชัน"
          >
            <nav className="inline-flex flex-wrap items-center gap-0.5" role="tablist" aria-label="หมวดตั้งค่า">
              {SETTINGS_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  className={smartPolicePrimaryTabPillClass(tab === t.key)}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            <span className={settingsToolbarDividerClass} aria-hidden />

            {tab === "agency" ? (
              <button
                type="button"
                className={smartPolicePrimaryButtonClass}
                disabled={saving}
                onClick={() => void saveProfile()}
              >
                {saving ? "…" : "บันทึก"}
              </button>
            ) : tab === "officers" ? (
              <button type="button" className={smartPolicePrimaryButtonClass} onClick={openAddOfficer}>
                + เพิ่มพงส.
              </button>
            ) : (
              <button
                type="button"
                className={smartPolicePrimaryButtonClass}
                onClick={() => openAddChargeRef.current?.()}
              >
                + เพิ่มข้อหา
              </button>
            )}
          </div>
        </div>

        <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          {tab === "charges" ? (
            <div role="tabpanel" aria-label="คลังข้อหา" className="flex min-h-0 flex-1 flex-col">
              <SmartPoliceChargesPanel
                onToast={showToast}
                hideAddButton
                registerOpenAdd={registerOpenAddCharge}
              />
            </div>
          ) : null}

          {tab === "agency" ? (
            <div
              role="tabpanel"
              aria-label="หน่วยงาน"
              className="grid gap-3 text-left sm:grid-cols-2 xl:grid-cols-3"
            >
              <label className={cn(smartPoliceLabelClass, "sm:col-span-2 xl:col-span-3")}>
                ชื่อสถานี *
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={profile.stationName}
                  onChange={(e) => setProfile((p) => (p ? { ...p, stationName: e.target.value } : p))}
                />
              </label>
              <label className={cn(smartPoliceLabelClass, "sm:col-span-2 xl:col-span-3")}>
                ที่อยู่สถานี
                <textarea
                  className={cn(smartPoliceTextareaClass, "mt-1")}
                  value={profile.stationAddress ?? ""}
                  onChange={(e) =>
                    setProfile((p) => (p ? { ...p, stationAddress: e.target.value } : p))
                  }
                />
              </label>
              <label className={smartPoliceLabelClass}>
                จังหวัด
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={profile.province ?? ""}
                  onChange={(e) => setProfile((p) => (p ? { ...p, province: e.target.value } : p))}
                />
              </label>
              <label className={smartPoliceLabelClass}>
                คำนำหน้าเลขคดี
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={profile.caseNumberPrefix}
                  onChange={(e) =>
                    setProfile((p) => (p ? { ...p, caseNumberPrefix: e.target.value } : p))
                  }
                />
              </label>
              <label className={smartPoliceLabelClass}>
                ยศหัวหน้าหน่วย
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={profile.commanderRank ?? ""}
                  onChange={(e) =>
                    setProfile((p) => (p ? { ...p, commanderRank: e.target.value } : p))
                  }
                />
              </label>
              <label className={smartPoliceLabelClass}>
                ชื่อหัวหน้าหน่วย
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={profile.commanderName ?? ""}
                  onChange={(e) =>
                    setProfile((p) => (p ? { ...p, commanderName: e.target.value } : p))
                  }
                />
              </label>
              <label className={smartPoliceLabelClass}>
                ตำแหน่งหัวหน้าหน่วย
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={profile.commanderTitle ?? ""}
                  onChange={(e) =>
                    setProfile((p) => (p ? { ...p, commanderTitle: e.target.value } : p))
                  }
                />
              </label>
              <label className={smartPoliceLabelClass}>
                ยศหัวหน้างาน
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={profile.headOfWorkRank ?? ""}
                  onChange={(e) =>
                    setProfile((p) => (p ? { ...p, headOfWorkRank: e.target.value } : p))
                  }
                />
              </label>
              <label className={smartPoliceLabelClass}>
                ชื่อหัวหน้างาน
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={profile.headOfWorkName ?? ""}
                  onChange={(e) =>
                    setProfile((p) => (p ? { ...p, headOfWorkName: e.target.value } : p))
                  }
                />
              </label>
              <label className={cn(smartPoliceLabelClass, "sm:col-span-2 xl:col-span-3")}>
                พนักงานสอบสวน (ค่าเริ่มต้นในเอกสาร — ซิงก์จากพงส.ที่ตั้งเป็นค่าเริ่มได้)
                <input
                  className={cn(smartPoliceFieldClass, "mt-1")}
                  value={profile.investigatorDefault ?? ""}
                  onChange={(e) =>
                    setProfile((p) => (p ? { ...p, investigatorDefault: e.target.value } : p))
                  }
                />
              </label>
              <label className={cn(smartPoliceLabelClass, "sm:col-span-2 xl:col-span-3")}>
                ท้ายกระดาษพิมพ์
                <textarea
                  className={cn(smartPoliceTextareaClass, "mt-1")}
                  value={profile.printFooter ?? ""}
                  onChange={(e) => setProfile((p) => (p ? { ...p, printFooter: e.target.value } : p))}
                />
              </label>
            </div>
          ) : tab === "officers" ? (
            <div role="tabpanel" aria-label="พนักงานสอบสวน" className="space-y-2">
              {officers.length === 0 ? (
                <AppEmptyState tone="violet">
                  ยังไม่มีพนักงานสอบสวน —{" "}
                  <button
                    type="button"
                    className="font-semibold text-[#5b61ff] underline"
                    onClick={openAddOfficer}
                  >
                    เพิ่มพงส.
                  </button>
                </AppEmptyState>
              ) : (
                <ul className="space-y-2">
                  {officers.map((o) => (
                    <li key={o.id} className={smartPoliceListRowAccentClass("indigo")}>
                      <div className="min-w-0 flex-1 text-left">
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
                          className={smartPoliceRowIconButtonClass}
                          aria-label={`แก้ไข ${o.fullName}`}
                          title="แก้ไข"
                          onClick={() => openEditOfficer(o)}
                        >
                          <IconRowEdit className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className={smartPoliceRowRemoveIconButtonClass}
                          aria-label={`ลบ ${o.fullName}`}
                          title="ลบ"
                          onClick={() => void deleteOfficer(o.id, o.fullName)}
                        >
                          <IconRowRemove className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </section>

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
          <label className={smartPoliceLabelClass}>
            ชื่อ *
            <input
              className={cn(smartPoliceFieldClass, "mt-1")}
              value={officerForm.fullName}
              onChange={(e) => setOfficerForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </label>
          <label className={smartPoliceLabelClass}>
            ยศ
            <input
              className={cn(smartPoliceFieldClass, "mt-1")}
              value={officerForm.rankTitle}
              onChange={(e) => setOfficerForm((f) => ({ ...f, rankTitle: e.target.value }))}
            />
          </label>
          <label className={smartPoliceLabelClass}>
            ตำแหน่ง
            <input
              className={cn(smartPoliceFieldClass, "mt-1")}
              value={officerForm.position}
              onChange={(e) => setOfficerForm((f) => ({ ...f, position: e.target.value }))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-[#2e2a58]">
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
