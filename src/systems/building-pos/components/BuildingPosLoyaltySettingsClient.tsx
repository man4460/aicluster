"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppSectionHeader,
  appDashboardBrandCtaPillButtonClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  formatBuildingPosLoyaltyEarnRule,
  type BuildingPosLoyaltyRewardDto,
  type BuildingPosLoyaltySettingsDto,
} from "@/systems/building-pos/lib/loyalty-rule";
import type { PosMenuItem } from "@/systems/building-pos/building-pos-service";

const fieldClass =
  "min-h-[44px] w-full rounded-xl border border-white/50 bg-white/70 px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] shadow-inner outline-none ring-1 ring-inset ring-white/40 backdrop-blur-sm focus:border-[#5b61ff]/40 focus:ring-2 focus:ring-[#5b61ff]/20";

export function BuildingPosLoyaltySettingsClient() {
  const [settings, setSettings] = useState<BuildingPosLoyaltySettingsDto | null>(null);
  const [rewards, setRewards] = useState<BuildingPosLoyaltyRewardDto[]>([]);
  const [menuItems, setMenuItems] = useState<PosMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(false);
  const [bahtPerPoint, setBahtPerPoint] = useState(100);
  const [pointsPerUnit, setPointsPerUnit] = useState(1);

  const [rewardForm, setRewardForm] = useState({
    title: "",
    menu_item_id: "",
    points_cost: "10",
    sort_order: "100",
    is_active: true,
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [rewardSaving, setRewardSaving] = useState(false);

  const rulePreview = useMemo(
    () => formatBuildingPosLoyaltyEarnRule(bahtPerPoint, pointsPerUnit),
    [bahtPerPoint, pointsPerUnit],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [loyRes, menuRes] = await Promise.all([
        fetch("/api/building-pos/session/loyalty", { credentials: "include", cache: "no-store" }),
        fetch("/api/building-pos/session/menu-items", { credentials: "include", cache: "no-store" }),
      ]);
      const loy = (await loyRes.json().catch(() => ({}))) as {
        settings?: BuildingPosLoyaltySettingsDto;
        rewards?: BuildingPosLoyaltyRewardDto[];
        error?: string;
      };
      const menu = (await menuRes.json().catch(() => ({}))) as { menu_items?: PosMenuItem[]; error?: string };
      if (!loyRes.ok) throw new Error(loy.error ?? "โหลดตั้งค่าคะแนนไม่สำเร็จ");
      if (!loy.settings) throw new Error("ไม่พบตั้งค่าคะแนน");
      setSettings(loy.settings);
      setEnabled(loy.settings.enabled);
      setBahtPerPoint(loy.settings.baht_per_point);
      setPointsPerUnit(loy.settings.points_per_unit);
      setRewards(Array.isArray(loy.rewards) ? loy.rewards : []);
      setMenuItems(Array.isArray(menu.menu_items) ? menu.menu_items : []);
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
      const res = await fetch("/api/building-pos/session/loyalty", {
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
        settings?: BuildingPosLoyaltySettingsDto;
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "บันทึกไม่สำเร็จ");
      if (!j.settings) throw new Error("บันทึกไม่สำเร็จ");
      setSettings(j.settings);
      setOkMsg("บันทึกกฎสะสมคะแนนแล้ว");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  function startEditReward(r: BuildingPosLoyaltyRewardDto) {
    setEditingId(r.id);
    setRewardForm({
      title: r.title,
      menu_item_id: r.menu_item_id != null ? String(r.menu_item_id) : "",
      points_cost: String(r.points_cost),
      sort_order: String(r.sort_order),
      is_active: r.is_active,
    });
  }

  function resetRewardForm() {
    setEditingId(null);
    setRewardForm({
      title: "",
      menu_item_id: "",
      points_cost: "10",
      sort_order: String(rewards.length + 1),
      is_active: true,
    });
  }

  async function saveReward() {
    if (!rewardForm.title.trim()) return;
    const cost = Number(rewardForm.points_cost);
    if (!Number.isFinite(cost) || cost < 1) return;
    setRewardSaving(true);
    setErr(null);
    try {
      const menuIdRaw = rewardForm.menu_item_id.trim();
      const menu_item_id =
        menuIdRaw && Number.isFinite(Number(menuIdRaw)) && Number(menuIdRaw) > 0
          ? Number(menuIdRaw)
          : null;
      const payload = {
        title: rewardForm.title.trim(),
        menu_item_id,
        points_cost: cost,
        sort_order: Number(rewardForm.sort_order) || 100,
        is_active: rewardForm.is_active,
      };
      const res = editingId
        ? await fetch(`/api/building-pos/session/loyalty/rewards?id=${editingId}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/building-pos/session/loyalty/rewards", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "บันทึกรายการแลกไม่สำเร็จ");
      resetRewardForm();
      await load();
      setOkMsg(editingId ? "แก้ไขรายการแลกแล้ว" : "เพิ่มรายการแลกแล้ว");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setRewardSaving(false);
    }
  }

  async function deleteReward(r: BuildingPosLoyaltyRewardDto) {
    if (!window.confirm(`ลบรายการแลก "${r.title}" ?`)) return;
    try {
      const res = await fetch(`/api/building-pos/session/loyalty/rewards?id=${r.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "ลบไม่สำเร็จ");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  function fillTitleFromMenu(menuId: string) {
    const id = Number(menuId);
    const m = menuItems.find((x) => x.id === id);
    if (!m) return;
    setRewardForm((s) => ({
      ...s,
      menu_item_id: menuId,
      title: s.title.trim() ? s.title : m.name,
    }));
  }

  const dirty =
    !!settings &&
    (settings.enabled !== enabled ||
      settings.baht_per_point !== bahtPerPoint ||
      settings.points_per_unit !== pointsPerUnit);

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection tone="violet" className="space-y-4">
        <AppSectionHeader
          title="สะสมคะแนน"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <button
              type="button"
              className={cn(appDashboardBrandCtaPillButtonClass, "min-h-[40px] rounded-xl px-4 text-xs font-black disabled:opacity-50")}
              disabled={!dirty || saving || loading}
              onClick={() => void saveSettings()}
            >
              {saving ? "กำลังบันทึก…" : "บันทึกกฎ"}
            </button>
          }
        />
        <p className="text-sm font-medium text-[#66638c]">
          ตั้งอัตราคะแนน เช่น ทุกๆ 100 บาท ได้ 1 คะแนน — และเพิ่มรายการที่แลกด้วยคะแนนได้
        </p>

        {err ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800" role="alert">
            {err}
          </p>
        ) : null}
        {okMsg ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800" role="status">
            {okMsg}
          </p>
        ) : null}

        {loading || !settings ? (
          <div className="h-28 animate-pulse rounded-[1.25rem] bg-[#ecebff]/50" aria-hidden />
        ) : (
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[1.25rem] border border-white/60 bg-white/70 p-4 shadow-sm">
              <span className="text-sm font-black text-[#1e1b4b]">เปิดระบบสะสมคะแนน</span>
              <input
                type="checkbox"
                className="h-5 w-5 accent-[#5b61ff]"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
            </label>

            <div className={cn("grid gap-3 sm:grid-cols-2", !enabled && "opacity-55")}>
              <label className="block text-xs font-black uppercase tracking-wide text-[#66638c]">
                ทุกๆ (บาท)
                <input
                  type="number"
                  min={1}
                  className={cn(fieldClass, "mt-1.5 tabular-nums")}
                  value={bahtPerPoint}
                  disabled={!enabled || saving}
                  onChange={(e) => setBahtPerPoint(Number(e.target.value) || 1)}
                />
              </label>
              <label className="block text-xs font-black uppercase tracking-wide text-[#66638c]">
                ได้คะแนน
                <input
                  type="number"
                  min={1}
                  className={cn(fieldClass, "mt-1.5 tabular-nums")}
                  value={pointsPerUnit}
                  disabled={!enabled || saving}
                  onChange={(e) => setPointsPerUnit(Number(e.target.value) || 1)}
                />
              </label>
            </div>

            <div className="rounded-2xl border border-[#0000BF]/20 bg-gradient-to-r from-[#0000BF]/8 via-[#8b5cf6]/8 to-[#ec4899]/8 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">ตัวอย่างกฎ</p>
              <p className="mt-1 text-sm font-black text-[#1e1b4b]">{rulePreview}</p>
              <p className="mt-1 text-[11px] font-semibold text-[#66638c]">
                ให้คะแนนเมื่อเปลี่ยนสถานะออเดอร์เป็น «ชำระแล้ว» และมีเบอร์สมาชิก
              </p>
            </div>
          </div>
        )}
      </AppDashboardSection>

      <AppDashboardSection tone="violet" className="space-y-4">
        <AppSectionHeader title="รายการแลกคะแนน" />
        <p className="text-sm font-medium text-[#66638c]">
          เช่น เมนูกะเพราไก่ แลก 10 คะแนน — เลือกจากเมนูหรือตั้งชื่อเอง
        </p>

        <div className="space-y-3 rounded-[1.25rem] border border-white/60 bg-white/55 p-4">
          <label className="block text-xs font-bold text-[#4d47b6]">
            เลือกเมนู (ไม่บังคับ)
            <select
              className={cn(fieldClass, "mt-1")}
              value={rewardForm.menu_item_id}
              onChange={(e) => fillTitleFromMenu(e.target.value)}
            >
              <option value="">— กำหนดชื่อเอง —</option>
              {menuItems.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-bold text-[#4d47b6]">
            ชื่อรายการแลก
            <input
              className={cn(fieldClass, "mt-1")}
              placeholder="เช่น กะเพราไก่"
              value={rewardForm.title}
              onChange={(e) => setRewardForm((s) => ({ ...s, title: e.target.value }))}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-bold text-[#4d47b6]">
              คะแนนที่ใช้
              <input
                type="number"
                min={1}
                className={cn(fieldClass, "mt-1 tabular-nums")}
                value={rewardForm.points_cost}
                onChange={(e) => setRewardForm((s) => ({ ...s, points_cost: e.target.value }))}
              />
            </label>
            <label className="block text-xs font-bold text-[#4d47b6]">
              ลำดับ
              <input
                type="number"
                className={cn(fieldClass, "mt-1 tabular-nums")}
                value={rewardForm.sort_order}
                onChange={(e) => setRewardForm((s) => ({ ...s, sort_order: e.target.value }))}
              />
            </label>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#4d47b6]">
            <input
              type="checkbox"
              checked={rewardForm.is_active}
              onChange={(e) => setRewardForm((s) => ({ ...s, is_active: e.target.checked }))}
            />
            เปิดใช้งาน
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={rewardSaving || !rewardForm.title.trim()}
              className={cn(appDashboardBrandCtaPillButtonClass, "min-h-[40px] rounded-xl px-4 text-xs font-black disabled:opacity-50")}
              onClick={() => void saveReward()}
            >
              {rewardSaving ? "กำลังบันทึก…" : editingId ? "บันทึกการแก้ไข" : "เพิ่มรายการแลก"}
            </button>
            {editingId ? (
              <button
                type="button"
                className={cn(appTemplateOutlineButtonClass, "min-h-[40px] rounded-xl px-4 text-xs font-black")}
                onClick={() => resetRewardForm()}
              >
                ยกเลิกแก้ไข
              </button>
            ) : null}
          </div>
        </div>

        {rewards.length === 0 ? (
          <p className="rounded-[1.25rem] border border-dashed border-[#d8d6ec] px-3 py-8 text-center text-sm font-semibold text-[#66638c]">
            ยังไม่มีรายการแลกคะแนน
          </p>
        ) : (
          <ul className="space-y-2">
            {rewards.map((r) => (
              <li
                key={r.id}
                className="flex min-h-[56px] items-center gap-3 rounded-[1.25rem] border border-[#e8e6f4]/90 bg-white/80 px-3 py-2.5"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-violet-50 ring-1 ring-[#e8e6f4]">
                  {r.image_url ?
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image_url} alt="" className="h-full w-full object-cover object-center" />
                  : <div className="flex h-full w-full items-center justify-center text-slate-300" aria-hidden>
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path d="M4 16l4.5-4.5a2 2 0 012.8 0L16 16M14 14l1.5-1.5a2 2 0 012.8 0L20 14" strokeLinecap="round" />
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                      </svg>
                    </div>
                  }
                </div>
                <span className="min-w-0 flex-1 text-sm font-semibold text-[#1e1b4b]">
                  {r.title}
                  <span className="mt-0.5 block text-xs font-medium text-[#66638c]">
                    แลก {r.points_cost.toLocaleString("th-TH")} คะแนน
                    {!r.is_active ? " · ปิดใช้งาน" : ""}
                  </span>
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไข ${r.title}`}
                    title="แก้ไข"
                    onClick={() => startEditReward(r)}
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบ ${r.title}`}
                    title="ลบ"
                    onClick={() => void deleteReward(r)}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppDashboardSection>
    </div>
  );
}
