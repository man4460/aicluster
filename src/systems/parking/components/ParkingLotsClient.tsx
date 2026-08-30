"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AppEmptyState,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  IconRowEdit,
  IconRowRemove,
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
} from "@/systems/asset/components/AssetRowActionIcons";
import { ParkingPageStack, ParkingPanelCard } from "@/systems/parking/components/ParkingPageChrome";
import { ParkingSpotsGridList } from "@/systems/parking/components/ParkingSpotsGridList";
import {
  parkingPricingModeLabel,
  type ParkingPricingMode,
} from "@/systems/parking/parking-module-nav";
import { parkingBtnPrimary, parkingField } from "@/systems/parking/parking-ui";
import {
  parkingFilterChipClass,
  parkingValetInnerCardClass,
} from "@/systems/parking/parking-ui-tokens";

type LotCard = {
  id: number;
  name: string;
  pricingMode: ParkingPricingMode;
  hourlyRateBaht: number | null;
  dailyRateBaht: number | null;
  monthlyRateBaht: number | null;
  note: string;
  isActive: boolean;
  spotCount: number;
  activeSessions: number;
};

type SpotRow = {
  id: number;
  siteId: number;
  siteName: string;
  spotCode: string;
  zoneLabel: string | null;
  checkInToken: string;
  activeSession: { licensePlate: string; checkInAt: string } | null;
};

const emptyLotForm = {
  name: "",
  pricingMode: "HOURLY" as ParkingPricingMode,
  hourly: "20",
  daily: "150",
  monthly: "2500",
  note: "",
};

export function ParkingLotsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notice = useAppNoticePopup();

  const [lots, setLots] = useState<LotCard[]>([]);
  const [spots, setSpots] = useState<SpotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lotFilter, setLotFilter] = useState<string>(() => searchParams.get("lot") ?? "");

  const [lotModal, setLotModal] = useState(false);
  const [editingLot, setEditingLot] = useState<LotCard | null>(null);
  const [lotForm, setLotForm] = useState(emptyLotForm);
  const [lotBusy, setLotBusy] = useState(false);
  const [lotErr, setLotErr] = useState<string | null>(null);

  const [spotModal, setSpotModal] = useState(false);
  const [editingSpot, setEditingSpot] = useState<SpotRow | null>(null);
  const [spotForm, setSpotForm] = useState({ siteId: "", spotCode: "", zoneLabel: "" });
  const [spotBusy, setSpotBusy] = useState(false);
  const [spotErr, setSpotErr] = useState<string | null>(null);

  const [loadErr, setLoadErr] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadErr(null);
    try {
      const [lotRes, spotRes] = await Promise.all([
        fetch("/api/parking/site", { cache: "no-store" }),
        fetch("/api/parking/spots", { cache: "no-store" }),
      ]);
      const lotData = (await lotRes.json()) as { sites?: LotCard[]; error?: string };
      const spotData = (await spotRes.json()) as { spots?: SpotRow[]; error?: string };
      if (!lotRes.ok) throw new Error(lotData.error ?? "โหลดลานไม่สำเร็จ");
      if (!spotRes.ok) throw new Error(spotData.error ?? "โหลดช่องไม่สำเร็จ");
      setLots(lotData.sites ?? []);
      setSpots(spotData.spots ?? []);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const q = searchParams.get("lot");
    if (q) setLotFilter(q);
  }, [searchParams]);

  const activeLots = useMemo(() => lots.filter((l) => l.isActive), [lots]);

  const filteredSpots = useMemo(() => {
    if (!lotFilter) return spots;
    const id = Number(lotFilter);
    return spots.filter((s) => s.siteId === id);
  }, [spots, lotFilter]);

  function openCreateLot() {
    setEditingLot(null);
    setLotForm(emptyLotForm);
    setLotErr(null);
    setLotModal(true);
  }

  function openEditLot(lot: LotCard) {
    setEditingLot(lot);
    setLotForm({
      name: lot.name,
      pricingMode: lot.pricingMode,
      hourly: lot.hourlyRateBaht?.toString() ?? "",
      daily: lot.dailyRateBaht?.toString() ?? "",
      monthly: lot.monthlyRateBaht?.toString() ?? "",
      note: lot.note ?? "",
    });
    setLotErr(null);
    setLotModal(true);
  }

  async function saveLot() {
    setLotBusy(true);
    setLotErr(null);
    try {
      const body = {
        ...(editingLot ? { siteId: editingLot.id } : {}),
        name: lotForm.name.trim(),
        pricingMode: lotForm.pricingMode,
        hourlyRateBaht: lotForm.hourly.trim() === "" ? null : Number(lotForm.hourly),
        dailyRateBaht: lotForm.daily.trim() === "" ? null : Number(lotForm.daily),
        monthlyRateBaht: lotForm.monthly.trim() === "" ? null : Number(lotForm.monthly),
        note: lotForm.note.trim(),
      };
      const res = await fetch("/api/parking/site", {
        method: editingLot ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string; site?: { id: number } };
      if (!res.ok) {
        setLotErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setLotModal(false);
      await reload();
      if (!editingLot && data.site?.id) {
        setLotFilter(String(data.site.id));
        router.replace(`/dashboard/parking/lots?lot=${data.site.id}`, { scroll: false });
      }
      router.refresh();
    } catch {
      setLotErr("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setLotBusy(false);
    }
  }

  async function deactivateLot(lot: LotCard) {
    const ok = await notice.confirm(`ปิดใช้งานลาน「${lot.name}」?`, {
      title: "ปิดลานจอด",
      confirmLabel: "ปิดใช้งาน",
      tone: "error",
    });
    if (!ok) return;
    const res = await fetch("/api/parking/site", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId: lot.id, isActive: false }),
    });
    if (res.ok) {
      if (lotFilter === String(lot.id)) {
        setLotFilter("");
        router.replace("/dashboard/parking/lots", { scroll: false });
      }
      await reload();
      router.refresh();
    }
  }

  function openCreateSpot() {
    const preferred =
      lotFilter && activeLots.some((l) => String(l.id) === lotFilter)
        ? lotFilter
        : activeLots[0]
          ? String(activeLots[0].id)
          : "";
    setEditingSpot(null);
    setSpotForm({ siteId: preferred, spotCode: "", zoneLabel: "" });
    setSpotErr(null);
    setSpotModal(true);
  }

  function openEditSpot(spot: SpotRow) {
    setEditingSpot(spot);
    setSpotForm({
      siteId: String(spot.siteId),
      spotCode: spot.spotCode,
      zoneLabel: spot.zoneLabel ?? "",
    });
    setSpotErr(null);
    setSpotModal(true);
  }

  async function deleteSpot(spot: SpotRow) {
    const ok = await notice.confirm(`ลบช่อง「${spot.spotCode}」?`, {
      title: "ลบช่องจอด",
      confirmLabel: "ลบ",
      tone: "error",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/parking/spots/${spot.id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        await notice.show(data.error ?? "ลบไม่สำเร็จ", "error");
        return;
      }
      await reload();
      router.refresh();
    } catch {
      await notice.show("เชื่อมต่อไม่สำเร็จ", "error");
    }
  }

  async function saveSpot() {
    setSpotBusy(true);
    setSpotErr(null);
    try {
      const siteId = Number(spotForm.siteId);
      if (!Number.isInteger(siteId) || siteId < 1) {
        setSpotErr("เลือกลานจอด");
        return;
      }
      const res = await fetch(editingSpot ? `/api/parking/spots/${editingSpot.id}` : "/api/parking/spots", {
        method: editingSpot ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          spotCode: spotForm.spotCode.trim(),
          zoneLabel: spotForm.zoneLabel.trim() || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSpotErr(data.error ?? (editingSpot ? "บันทึกไม่สำเร็จ" : "เพิ่มช่องไม่สำเร็จ"));
        return;
      }
      setSpotModal(false);
      setEditingSpot(null);
      if (!editingSpot) {
        setLotFilter(String(siteId));
        router.replace(`/dashboard/parking/lots?lot=${siteId}`, { scroll: false });
      }
      await reload();
      router.refresh();
    } catch {
      setSpotErr("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setSpotBusy(false);
    }
  }

  function selectLotFilter(id: string) {
    setLotFilter(id);
    const href = id ? `/dashboard/parking/lots?lot=${id}` : "/dashboard/parking/lots";
    router.replace(href, { scroll: false });
  }

  const addSpotDisabled = activeLots.length === 0;

  return (
    <ParkingPageStack>
      {/* —— ลานจอด (= อาคารของโรงแรม) —— */}
      <ParkingPanelCard
        title="ลานจอด"
        headerClassName="flex flex-row items-start justify-between gap-3 sm:items-center"
        action={
          <button
            type="button"
            onClick={openCreateLot}
            aria-label="เพิ่มลานจอด"
            className={cn(
              parkingBtnPrimary,
              "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 sm:min-w-0 sm:px-4",
            )}
          >
            <span className="text-lg leading-none sm:hidden">+</span>
            <span className="hidden sm:inline">+ เพิ่มลาน</span>
          </button>
        }
      >
        {loading ? (
          <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : loadErr ? (
          <p className="text-sm text-rose-700">{loadErr}</p>
        ) : lots.length === 0 ? (
          <AppEmptyState tone="glass">ยังไม่มีลานจอด — กด「เพิ่มลาน」เพื่อเริ่มต้น</AppEmptyState>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            {lots.map((lot) => (
              <li key={lot.id} className={cn(parkingValetInnerCardClass, !lot.isActive && "opacity-60")}>
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => selectLotFilter(String(lot.id))}
                    aria-label={`กรองช่องของ ${lot.name}`}
                  >
                    <p className="text-lg font-black tracking-tight text-[#1e1b4b]">{lot.name}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#66638c]">
                      {parkingPricingModeLabel(lot.pricingMode)}
                      {!lot.isActive ? " · ปิดใช้งาน" : ""}
                    </p>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      className={assetRowEditIconButtonClass}
                      aria-label={`แก้ไข ${lot.name}`}
                      title="แก้ไข"
                      onClick={() => openEditLot(lot)}
                    >
                      <IconRowEdit className="h-4 w-4" />
                    </button>
                    {lot.isActive ? (
                      <button
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        aria-label={`ปิดใช้งาน ${lot.name}`}
                        title="ปิดใช้งาน"
                        onClick={() => void deactivateLot(lot)}
                      >
                        <IconRowRemove className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-white/55 px-2 py-2 ring-1 ring-white/70">
                    <dt className="text-[10px] font-bold text-[#66638c]">ชม.</dt>
                    <dd className="text-sm font-black tabular-nums text-[#1e1b4b]">
                      {lot.hourlyRateBaht != null ? lot.hourlyRateBaht.toLocaleString("th-TH") : "—"}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-white/55 px-2 py-2 ring-1 ring-white/70">
                    <dt className="text-[10px] font-bold text-[#66638c]">วัน</dt>
                    <dd className="text-sm font-black tabular-nums text-[#1e1b4b]">
                      {lot.dailyRateBaht != null ? lot.dailyRateBaht.toLocaleString("th-TH") : "—"}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-white/55 px-2 py-2 ring-1 ring-white/70">
                    <dt className="text-[10px] font-bold text-[#66638c]">เดือน</dt>
                    <dd className="text-sm font-black tabular-nums text-[#1e1b4b]">
                      {lot.monthlyRateBaht != null ? lot.monthlyRateBaht.toLocaleString("th-TH") : "—"}
                    </dd>
                  </div>
                </dl>
                {lot.note ? <p className="mt-2 line-clamp-2 text-xs text-[#66638c]">{lot.note}</p> : null}
                <p className="mt-3 border-t border-white/50 pt-3 text-xs font-semibold text-[#5f5a8a]">
                  ช่อง {lot.spotCount} · จอดอยู่ {lot.activeSessions}
                </p>
              </li>
            ))}
          </ul>
        )}
      </ParkingPanelCard>

      {/* —— ช่องจอด (= ห้องของโรงแรม) —— */}
      <ParkingPanelCard
        title="ช่องจอด"
        headerClassName="flex flex-row items-start justify-between gap-3 sm:items-center"
        action={
          <button
            type="button"
            onClick={openCreateSpot}
            disabled={addSpotDisabled}
            aria-label="เพิ่มช่องจอด"
            title={addSpotDisabled ? "เพิ่มลานก่อน" : "เพิ่มช่องจอด"}
            className={cn(
              parkingBtnPrimary,
              "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 sm:min-w-0 sm:px-4",
              addSpotDisabled && "pointer-events-none opacity-45",
            )}
          >
            <span className="text-lg leading-none sm:hidden">+</span>
            <span className="hidden sm:inline">+ เพิ่มช่อง</span>
          </button>
        }
      >
        {activeLots.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="กรองตามลาน">
            <button
              type="button"
              role="tab"
              aria-selected={!lotFilter}
              className={parkingFilterChipClass(!lotFilter)}
              onClick={() => selectLotFilter("")}
            >
              ทั้งหมด
            </button>
            {activeLots.map((l) => (
              <button
                key={l.id}
                type="button"
                role="tab"
                aria-selected={lotFilter === String(l.id)}
                className={parkingFilterChipClass(lotFilter === String(l.id))}
                onClick={() => selectLotFilter(String(l.id))}
              >
                {l.name}
              </button>
            ))}
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : addSpotDisabled ? (
          <AppEmptyState tone="glass">เพิ่มลานจอดก่อน แล้วค่อยเพิ่มช่องจอดของลาน</AppEmptyState>
        ) : (
          <ParkingSpotsGridList
            emptyLabel={
              lotFilter
                ? "ลานนี้ยังไม่มีช่อง — กด「เพิ่มช่อง」"
                : "ยังไม่มีช่องจอด — กด「เพิ่มช่อง」"
            }
            spots={filteredSpots.map((s) => ({
              id: s.id,
              spotCode: s.spotCode,
              zoneLabel: !lotFilter
                ? [s.siteName, s.zoneLabel].filter(Boolean).join(" · ") || null
                : s.zoneLabel,
              activeSession: s.activeSession
                ? {
                    licensePlate: s.activeSession.licensePlate,
                    checkInAt: new Date(s.activeSession.checkInAt),
                  }
                : null,
            }))}
            onEdit={(spotId) => {
              const spot = spots.find((s) => s.id === spotId);
              if (spot) openEditSpot(spot);
            }}
            onDelete={(spotId) => {
              const spot = spots.find((s) => s.id === spotId);
              if (spot) void deleteSpot(spot);
            }}
          />
        )}
      </ParkingPanelCard>

      <FormModal
        open={lotModal}
        onClose={() => setLotModal(false)}
        title={editingLot ? "แก้ไขลานจอด" : "เพิ่มลานจอด"}
        description="ตั้งชื่อ · โหมดคิดเงิน · ราคาชม./วัน/เดือน"
        size="md"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setLotModal(false)}
            onSubmit={() => void saveLot()}
            submitLabel={editingLot ? "บันทึก" : "เพิ่มลาน"}
            submitDisabled={!lotForm.name.trim() || lotBusy}
            loading={lotBusy}
          />
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#5f5a8a]">ชื่อลาน</label>
            <input
              className={`${parkingField} mt-1`}
              value={lotForm.name}
              onChange={(e) => setLotForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={120}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5f5a8a]">โหมดคิดเงินหลัก</label>
            <select
              className={`${parkingField} mt-1`}
              value={lotForm.pricingMode}
              onChange={(e) => setLotForm((f) => ({ ...f, pricingMode: e.target.value as ParkingPricingMode }))}
            >
              <option value="HOURLY">รายชั่วโมง</option>
              <option value="DAILY">รายวัน</option>
              <option value="MONTHLY">รายเดือน</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-[#5f5a8a]">บาท/ชม.</label>
              <input
                type="number"
                min={0}
                className={`${parkingField} mt-1 tabular-nums`}
                value={lotForm.hourly}
                onChange={(e) => setLotForm((f) => ({ ...f, hourly: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5f5a8a]">บาท/วัน</label>
              <input
                type="number"
                min={0}
                className={`${parkingField} mt-1 tabular-nums`}
                value={lotForm.daily}
                onChange={(e) => setLotForm((f) => ({ ...f, daily: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5f5a8a]">บาท/เดือน</label>
              <input
                type="number"
                min={0}
                className={`${parkingField} mt-1 tabular-nums`}
                value={lotForm.monthly}
                onChange={(e) => setLotForm((f) => ({ ...f, monthly: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5f5a8a]">รายละเอียด</label>
            <textarea
              className={`${parkingField} mt-1 min-h-[72px]`}
              value={lotForm.note}
              onChange={(e) => setLotForm((f) => ({ ...f, note: e.target.value }))}
              maxLength={500}
            />
          </div>
          {lotErr ? <p className="text-sm text-rose-700">{lotErr}</p> : null}
        </div>
      </FormModal>

      <FormModal
        open={spotModal}
        onClose={() => {
          setSpotModal(false);
          setEditingSpot(null);
        }}
        title={editingSpot ? "แก้ไขช่องจอด" : "เพิ่มช่องจอด"}
        description="เลือกลาน · รหัสช่อง · โซน (ไม่บังคับ)"
        size="md"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => {
              setSpotModal(false);
              setEditingSpot(null);
            }}
            onSubmit={() => void saveSpot()}
            submitLabel={editingSpot ? "บันทึก" : "เพิ่มช่อง"}
            submitDisabled={!spotForm.siteId || !spotForm.spotCode.trim() || spotBusy}
            loading={spotBusy}
          />
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#5f5a8a]">ลานจอด</label>
            <select
              className={`${parkingField} mt-1`}
              value={spotForm.siteId}
              onChange={(e) => setSpotForm((f) => ({ ...f, siteId: e.target.value }))}
            >
              <option value="">— เลือกลาน —</option>
              {activeLots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5f5a8a]">รหัสช่อง</label>
            <input
              className={`${parkingField} mt-1`}
              value={spotForm.spotCode}
              onChange={(e) => setSpotForm((f) => ({ ...f, spotCode: e.target.value }))}
              placeholder="เช่น A-01"
              maxLength={24}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5f5a8a]">โซน (ไม่บังคับ)</label>
            <input
              className={`${parkingField} mt-1`}
              value={spotForm.zoneLabel}
              onChange={(e) => setSpotForm((f) => ({ ...f, zoneLabel: e.target.value }))}
              placeholder="โซน A"
              maxLength={80}
            />
          </div>
          {spotErr ? <p className="text-sm text-rose-700">{spotErr}</p> : null}
        </div>
      </FormModal>

      {notice.popup}
    </ParkingPageStack>
  );
}
