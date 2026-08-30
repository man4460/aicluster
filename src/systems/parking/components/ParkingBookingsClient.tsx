"use client";

import { useCallback, useEffect, useState } from "react";
import { AppEmptyState, useAppNoticePopup } from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  IconRowRemove,
  assetRowRemoveIconButtonClass,
} from "@/systems/asset/components/AssetRowActionIcons";
import { ParkingPageStack, ParkingPanelCard } from "@/systems/parking/components/ParkingPageChrome";
import type { ParkingPricingMode } from "@/systems/parking/parking-module-nav";
import { parkingBtnPrimary, parkingField } from "@/systems/parking/parking-ui";
import { parkingValetInnerCardClass } from "@/systems/parking/parking-ui-tokens";

type LotOpt = { id: number; name: string; pricingMode: ParkingPricingMode };
type SpotOpt = { id: number; spotCode: string; siteId: number };

type Booking = {
  id: number;
  site_id: number;
  site_name: string;
  spot_id: number | null;
  license_plate: string;
  customer_name: string | null;
  customer_phone: string | null;
  package_name: string;
  scheduled_start: string;
  scheduled_end: string | null;
  pricing_mode: ParkingPricingMode;
  amount_baht: number;
  status: string;
  note: string | null;
};

const STATUS_TH: Record<string, string> = {
  SCHEDULED: "รอเช็คอิน",
  CHECKED_IN: "เช็คอินแล้ว",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
  NO_SHOW: "ไม่มา",
};

export function ParkingBookingsClient() {
  const notice = useAppNoticePopup();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [lots, setLots] = useState<LotOpt[]>([]);
  const [spots, setSpots] = useState<SpotOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [checkinFor, setCheckinFor] = useState<Booking | null>(null);
  const [checkinSpotId, setCheckinSpotId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    site_id: "",
    license_plate: "",
    customer_name: "",
    customer_phone: "",
    scheduled_start: "",
    amount_baht: "0",
    note: "",
  });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, sRes, spotRes] = await Promise.all([
        fetch("/api/parking/bookings"),
        fetch("/api/parking/site"),
        fetch("/api/parking/spots"),
      ]);
      const bData = (await bRes.json()) as { bookings?: Booking[] };
      const sData = (await sRes.json()) as { sites?: LotOpt[] };
      const spotData = (await spotRes.json()) as { spots?: SpotOpt[] };
      setBookings(bData.bookings ?? []);
      setLots(sData.sites ?? []);
      setSpots(spotData.spots ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  function openCreate() {
    const first = lots[0];
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setForm({
      site_id: first ? String(first.id) : "",
      license_plate: "",
      customer_name: "",
      customer_phone: "",
      scheduled_start: local,
      amount_baht: "0",
      note: "",
    });
    setErr(null);
    setModalOpen(true);
  }

  async function saveBooking() {
    setBusy(true);
    setErr(null);
    try {
      const siteId = Number(form.site_id);
      const lot = lots.find((l) => l.id === siteId);
      const res = await fetch("/api/parking/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: siteId,
          license_plate: form.license_plate.trim(),
          customer_name: form.customer_name.trim() || null,
          customer_phone: form.customer_phone.trim() || null,
          scheduled_start: new Date(form.scheduled_start).toISOString(),
          pricing_mode: lot?.pricingMode ?? "HOURLY",
          amount_baht: Number(form.amount_baht) || 0,
          note: form.note.trim() || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setModalOpen(false);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function cancelBooking(b: Booking) {
    const ok = await notice.confirm(`ยกเลิกจอง ${b.license_plate}?`, {
      title: "ยกเลิกการจอง",
      confirmLabel: "ยกเลิกจอง",
      tone: "error",
    });
    if (!ok) return;
    await fetch(`/api/parking/bookings/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    await reload();
  }

  async function confirmCheckin() {
    if (!checkinFor) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/parking/bookings/${checkinFor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CHECKED_IN",
          spot_id: Number(checkinSpotId),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "เช็คอินไม่สำเร็จ");
        return;
      }
      setCheckinFor(null);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  const spotsForCheckin = checkinFor
    ? spots.filter((s) => s.siteId === checkinFor.site_id)
    : [];

  return (
    <ParkingPageStack>
      <ParkingPanelCard
        title="จองที่จอด"
        description="จองล่วงหน้า · กดเข้าเช็คอินเมื่อลูกค้ามาถึง"
        headerClassName="flex flex-row items-start justify-between gap-3 sm:items-center"
        action={
          <button
            type="button"
            onClick={openCreate}
            aria-label="เพิ่มการจอง"
            className={cn(
              parkingBtnPrimary,
              "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 sm:min-w-0 sm:px-4",
            )}
          >
            <span className="sm:hidden text-lg leading-none">+</span>
            <span className="hidden sm:inline">+ เพิ่มจอง</span>
          </button>
        }
      >
        {loading ? (
          <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : bookings.length === 0 ? (
          <AppEmptyState tone="glass">ยังไม่มีการจอง</AppEmptyState>
        ) : (
          <ul className="space-y-3">
            {bookings.map((b) => (
              <li key={b.id} className={cn(parkingValetInnerCardClass, "space-y-2")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-black tabular-nums text-[#1e1b4b]">{b.license_plate}</p>
                    <p className="text-xs font-semibold text-[#66638c]">
                      {b.site_name}
                      {b.customer_name ? ` · ${b.customer_name}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-[#5f5a8a]">
                      {new Date(b.scheduled_start).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold text-[#4d47b6] ring-1 ring-white/80">
                    {STATUS_TH[b.status] ?? b.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {b.status === "SCHEDULED" ? (
                    <button
                      type="button"
                      className={cn(parkingBtnPrimary, "rounded-xl px-3 py-2 text-xs")}
                      onClick={() => {
                        setCheckinFor(b);
                        setCheckinSpotId(b.spot_id ? String(b.spot_id) : "");
                        setErr(null);
                      }}
                    >
                      เข้าเช็คอิน
                    </button>
                  ) : null}
                  {b.status === "SCHEDULED" ? (
                    <button
                      type="button"
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ยกเลิกจอง ${b.license_plate}`}
                      title="ยกเลิก"
                      onClick={() => void cancelBooking(b)}
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </ParkingPanelCard>

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="เพิ่มการจอง"
        size="md"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setModalOpen(false)}
            onSubmit={() => void saveBooking()}
            submitLabel="บันทึกจอง"
            submitDisabled={!form.site_id || !form.license_plate.trim() || !form.scheduled_start || busy}
            loading={busy}
          />
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#5f5a8a]">ลานจอด</label>
            <select className={`${parkingField} mt-1`} value={form.site_id} onChange={(e) => setForm((f) => ({ ...f, site_id: e.target.value }))}>
              {lots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5f5a8a]">ทะเบียน</label>
            <input className={`${parkingField} mt-1`} value={form.license_plate} onChange={(e) => setForm((f) => ({ ...f, license_plate: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-[#5f5a8a]">ชื่อลูกค้า</label>
              <input className={`${parkingField} mt-1`} value={form.customer_name} onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5f5a8a]">เบอร์โทร</label>
              <input className={`${parkingField} mt-1`} value={form.customer_phone} onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5f5a8a]">วันเวลาจอง (เวลาไทยบนเครื่อง)</label>
            <input
              type="datetime-local"
              className={`${parkingField} mt-1`}
              value={form.scheduled_start}
              onChange={(e) => setForm((f) => ({ ...f, scheduled_start: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5f5a8a]">ยอดประมาณ (บาท)</label>
            <input type="number" min={0} className={`${parkingField} mt-1`} value={form.amount_baht} onChange={(e) => setForm((f) => ({ ...f, amount_baht: e.target.value }))} />
          </div>
          {err ? <p className="text-sm text-rose-700">{err}</p> : null}
        </div>
      </FormModal>

      <FormModal
        open={Boolean(checkinFor)}
        onClose={() => setCheckinFor(null)}
        title="เข้าเช็คอินจากการจอง"
        description={checkinFor ? `ทะเบียน ${checkinFor.license_plate}` : undefined}
        size="md"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setCheckinFor(null)}
            onSubmit={() => void confirmCheckin()}
            submitLabel="เช็คอิน"
            submitDisabled={!checkinSpotId || busy}
            loading={busy}
          />
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#5f5a8a]">เลือกช่องจอด</label>
            <select className={`${parkingField} mt-1`} value={checkinSpotId} onChange={(e) => setCheckinSpotId(e.target.value)}>
              <option value="">— เลือกช่อง —</option>
              {spotsForCheckin.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.spotCode}
                </option>
              ))}
            </select>
          </div>
          {err ? <p className="text-sm text-rose-700">{err}</p> : null}
        </div>
      </FormModal>

      {notice.popup}
    </ParkingPageStack>
  );
}
