"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AppDashboardSection,
  AppGalleryCameraFileInputs,
  AppImagePickCameraButtons,
  AppSectionHeader,
  LoyaltyRewardMenuCard,
  appTemplateOutlineButtonClass,
  prepareImageFileForUpload,
  useAppCameraCapture,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  formatFootballTurfLoyaltyEarnRule,
  type FootballTurfLoyaltyRewardDto,
  type FootballTurfLoyaltySettingsDto,
} from "@/systems/football-turf/lib/loyalty-rule";
import { footballTurfInteractiveButtonClass, footballTurfPanelCardClass, footballTurfSectionEyebrowClass } from "@/systems/football-turf/lib/ui-tokens";

const fieldClass =
  "min-h-[44px] w-full rounded-xl border border-white/50 bg-white/70 px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] shadow-inner outline-none ring-1 ring-inset ring-white/40 backdrop-blur-sm focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/20";

const emptyRewardForm = {
  title: "",
  points_cost: "10",
  sort_order: "100",
  is_active: true,
  image_url: "",
};

export function FootballTurfLoyaltySettingsPanel({
  embedded = false,
}: {
  /** อยู่ในแท็บตั้งค่าแล้ว — ไม่ห่อ AppDashboardSection ซ้ำ */
  embedded?: boolean;
}) {
  const [settings, setSettings] = useState<FootballTurfLoyaltySettingsDto | null>(null);
  const [rewards, setRewards] = useState<FootballTurfLoyaltyRewardDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [bahtPerPoint, setBahtPerPoint] = useState(100);
  const [pointsPerUnit, setPointsPerUnit] = useState(1);

  const [rewardForm, setRewardForm] = useState(emptyRewardForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [rewardSaving, setRewardSaving] = useState(false);
  const [imageUploadBusy, setImageUploadBusy] = useState(false);

  const rewardGalleryRef = useRef<HTMLInputElement>(null);
  const rewardCameraInputRef = useRef<HTMLInputElement>(null);
  const { openCamera: openRewardCamera, cameraModal: rewardCameraModal } = useAppCameraCapture();

  const rulePreview = useMemo(
    () => formatFootballTurfLoyaltyEarnRule(bahtPerPoint, pointsPerUnit),
    [bahtPerPoint, pointsPerUnit],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/football-turf/session/loyalty", {
        credentials: "include",
        cache: "no-store",
      });
      const j = (await res.json().catch(() => ({}))) as {
        settings?: FootballTurfLoyaltySettingsDto;
        rewards?: FootballTurfLoyaltyRewardDto[];
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "โหลดตั้งค่าคะแนนไม่สำเร็จ");
      if (!j.settings) throw new Error("ไม่พบตั้งค่าคะแนน");
      setSettings(j.settings);
      setEnabled(j.settings.enabled);
      setBahtPerPoint(j.settings.baht_per_point);
      setPointsPerUnit(j.settings.points_per_unit);
      setRewards(Array.isArray(j.rewards) ? j.rewards : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveSettings() {
    setSaving(true);
    setErr(null);
    setOkMsg(null);
    try {
      const res = await fetch("/api/football-turf/session/loyalty", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          baht_per_point: bahtPerPoint,
          points_per_unit: pointsPerUnit,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        settings?: FootballTurfLoyaltySettingsDto;
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "บันทึกไม่สำเร็จ");
      if (j.settings) {
        setSettings(j.settings);
        setEnabled(j.settings.enabled);
        setBahtPerPoint(j.settings.baht_per_point);
        setPointsPerUnit(j.settings.points_per_unit);
      }
      setOkMsg("บันทึกกฎแล้ว");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(r: FootballTurfLoyaltyRewardDto) {
    setEditingId(r.id);
    setRewardForm({
      title: r.title,
      points_cost: String(r.points_cost),
      sort_order: String(r.sort_order),
      is_active: r.is_active,
      image_url: r.image_url ?? "",
    });
  }

  function resetRewardForm() {
    setEditingId(null);
    setRewardForm(emptyRewardForm);
  }

  async function uploadRewardImage(file: File) {
    const prepared = await prepareImageFileForUpload(file);
    const fd = new FormData();
    fd.append("file", prepared);
    const res = await fetch("/api/football-turf/upload", {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    const j = (await res.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;
    if (!res.ok || typeof j?.imageUrl !== "string") {
      throw new Error(typeof j?.error === "string" ? j.error : "อัปโหลดไม่สำเร็จ");
    }
    return j.imageUrl;
  }

  async function applyRewardImage(file: File) {
    setErr(null);
    setImageUploadBusy(true);
    try {
      const url = await uploadRewardImage(file);
      setRewardForm((s) => ({ ...s, image_url: url }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setImageUploadBusy(false);
    }
  }

  async function onRewardImageFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    await applyRewardImage(f);
  }

  async function saveReward() {
    setRewardSaving(true);
    setErr(null);
    setOkMsg(null);
    try {
      const res = await fetch("/api/football-turf/session/loyalty", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editingId != null ? "update_reward" : "create_reward",
          id: editingId ?? undefined,
          title: rewardForm.title,
          points_cost: Number(rewardForm.points_cost),
          sort_order: Number(rewardForm.sort_order),
          is_active: rewardForm.is_active,
          image_url: rewardForm.image_url.trim() || null,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "บันทึกรางวัลไม่สำเร็จ");
      resetRewardForm();
      await load();
      setOkMsg(editingId != null ? "อัปเดตรางวัลแล้ว" : "เพิ่มรางวัลแล้ว");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกรางวัลไม่สำเร็จ");
    } finally {
      setRewardSaving(false);
    }
  }

  async function deleteReward(id: number, title: string) {
    if (!window.confirm(`ลบรางวัล «${title}» ?`)) return;
    setErr(null);
    try {
      const res = await fetch("/api/football-turf/session/loyalty", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_reward", id }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "ลบไม่สำเร็จ");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  const body = loading && !settings ? (
        <p className="mt-4 text-sm font-semibold text-[#66638c]">กำลังโหลด…</p>
      ) : (
        <div className={cn(embedded ? "mt-0" : "mt-4", "space-y-4")}>
          <div className={footballTurfPanelCardClass}>
            <label className="flex items-center gap-2 text-sm font-bold text-[#4d47b6]">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 accent-[#5b61ff]"
              />
              เปิดระบบสะสมคะแนน
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-bold text-slate-700">
                ทุกกี่บาท
                <input
                  type="number"
                  min={1}
                  className={fieldClass}
                  value={bahtPerPoint}
                  onChange={(e) => setBahtPerPoint(Number(e.target.value) || 100)}
                />
              </label>
              <label className="space-y-1.5 text-sm font-bold text-slate-700">
                ได้กี่คะแนน
                <input
                  type="number"
                  min={1}
                  className={fieldClass}
                  value={pointsPerUnit}
                  onChange={(e) => setPointsPerUnit(Number(e.target.value) || 1)}
                />
              </label>
            </div>
            <p className="mt-2 text-xs font-semibold text-[#4d47b6]">{rulePreview}</p>
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveSettings()}
              className={cn(
                "app-btn-primary mt-3 rounded-xl px-4 py-2.5 text-sm font-black",
                footballTurfInteractiveButtonClass,
              )}
            >
              {saving ? "กำลังบันทึก…" : "บันทึกกฎ"}
            </button>
          </div>

          <div className={footballTurfPanelCardClass}>
            <p className={footballTurfSectionEyebrowClass}>
              {editingId != null ? "แก้ไขรางวัล" : "เพิ่มรางวัล"}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                ชื่อรางวัล
                <input
                  className={fieldClass}
                  value={rewardForm.title}
                  onChange={(e) => setRewardForm((s) => ({ ...s, title: e.target.value }))}
                  placeholder="เช่น น้ำดื่มฟรี · ส่วนลด 1 ชั่วโมง"
                />
              </label>
              <label className="space-y-1.5 text-sm font-bold text-slate-700">
                คะแนนที่ใช้
                <input
                  type="number"
                  min={1}
                  className={fieldClass}
                  value={rewardForm.points_cost}
                  onChange={(e) => setRewardForm((s) => ({ ...s, points_cost: e.target.value }))}
                />
              </label>
              <label className="flex items-end gap-2 pb-2 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={rewardForm.is_active}
                  onChange={(e) => setRewardForm((s) => ({ ...s, is_active: e.target.checked }))}
                  className="h-4 w-4 accent-[#5b61ff]"
                />
                เปิดใช้งาน
              </label>
            </div>

            <div className="mt-3 space-y-2 sm:col-span-2">
              <p className="text-xs font-bold text-[#4d47b6]">รูปของรางวัล</p>
              <AppGalleryCameraFileInputs
                galleryInputRef={rewardGalleryRef}
                cameraInputRef={rewardCameraInputRef}
                onChange={(e) => void onRewardImageFileChange(e)}
              />
              <div className="flex flex-wrap items-center gap-2">
                <AppImagePickCameraButtons
                  onPickGallery={() => rewardGalleryRef.current?.click()}
                  onPickCamera={() => openRewardCamera((file) => void applyRewardImage(file))}
                  disabled={rewardSaving || imageUploadBusy}
                  busy={imageUploadBusy}
                  labels={{ busy: "กำลังอัปโหลด…", gallery: "แนบรูป", camera: "ถ่ายรูป" }}
                  className="justify-start"
                />
                {rewardForm.image_url.trim() ? (
                  <button
                    type="button"
                    className={cn(
                      appTemplateOutlineButtonClass,
                      footballTurfInteractiveButtonClass,
                      "min-h-[40px] rounded-xl px-3 text-xs font-black",
                    )}
                    onClick={() => setRewardForm((s) => ({ ...s, image_url: "" }))}
                  >
                    ลบรูป
                  </button>
                ) : null}
              </div>
              {rewardCameraModal}
              {rewardForm.image_url.trim() ? (
                <div className="h-28 w-28 overflow-hidden rounded-2xl border border-white/60 bg-[#0000BF]/08 ring-1 ring-inset ring-white/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={rewardForm.image_url.trim()}
                    alt=""
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={rewardSaving || imageUploadBusy || !rewardForm.title.trim()}
                onClick={() => void saveReward()}
                className={cn(
                  "app-btn-primary rounded-xl px-4 py-2.5 text-sm font-black",
                  footballTurfInteractiveButtonClass,
                )}
              >
                {rewardSaving ? "กำลังบันทึก…" : editingId != null ? "อัปเดตรางวัล" : "เพิ่มรางวัล"}
              </button>
              {editingId != null ? (
                <button
                  type="button"
                  onClick={resetRewardForm}
                  className={cn(appTemplateOutlineButtonClass, footballTurfInteractiveButtonClass, "rounded-xl px-4")}
                >
                  ยกเลิกแก้ไข
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            {rewards.length === 0 ? (
              <p className="text-sm font-semibold text-[#8b87b8]">ยังไม่มีรายการแลก</p>
            ) : (
              rewards.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <LoyaltyRewardMenuCard
                      title={r.title}
                      pointsCost={r.points_cost}
                      imageUrl={r.image_url}
                      className={!r.is_active ? "opacity-50" : undefined}
                    />
                  </div>
                  <button
                    type="button"
                    className={cn(assetRowEditIconButtonClass, footballTurfInteractiveButtonClass)}
                    aria-label={`แก้ไข ${r.title}`}
                    title="แก้ไข"
                    onClick={() => startEdit(r)}
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={cn(assetRowRemoveIconButtonClass, footballTurfInteractiveButtonClass)}
                    aria-label={`ลบ ${r.title}`}
                    title="ลบ"
                    onClick={() => void deleteReward(r.id, r.title)}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {err ? <p className="text-sm font-semibold text-rose-600">{err}</p> : null}
          {okMsg ? <p className="text-sm font-semibold text-emerald-700">{okMsg}</p> : null}
        </div>
      );

  if (embedded) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-black tracking-tight text-[#1e1b4b]">สะสมคะแนน / แลกรางวัล</p>
        {body}
      </div>
    );
  }

  return (
    <AppDashboardSection tone="violet">
      <AppSectionHeader tone="violet" title="สะสมคะแนน / แลกรางวัล" />
      {body}
    </AppDashboardSection>
  );
}
