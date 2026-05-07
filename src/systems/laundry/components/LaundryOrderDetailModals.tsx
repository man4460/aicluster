"use client";

import { useEffect, useState } from "react";
import { FormModal } from "@/components/ui/FormModal";
import { isLaundryOrderFromCustomerPickupPortal } from "@/systems/laundry/laundry-customer-pickup-request";
import {
  LAUNDRY_ORDER_STATUSES,
  laundryOrderStatusLabelTh,
  type LaundryOrder,
  type LaundryOrderStatus,
} from "@/systems/laundry/laundry-service";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 py-2 last:border-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm text-slate-800">{value || "-"}</p>
    </div>
  );
}

export function LaundryOrderViewModal({
  order,
  onClose,
}: {
  order: LaundryOrder | null;
  onClose: () => void;
}) {
  const open = order != null;
  const o = order;

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={o ? `รายละเอียด #${o.id}` : "รายละเอียด"}
      description="ข้อมูลอ่านอย่างเดียว"
      mobileCentered
      size="md"
      footer={
        <button type="button" className="app-btn-soft rounded-xl px-4 py-2.5 text-sm font-semibold" onClick={onClose}>
          ปิด
        </button>
      }
    >
      {o ?
        <div className="space-y-1 px-1">
          <Row label="ลูกค้า" value={o.customer_name} />
          <Row label="โทรศัพท์" value={o.customer_phone} />
          <Row label="สถานะ" value={laundryOrderStatusLabelTh(o.status)} />
          <Row
            label="เวลารับงาน"
            value={new Date(o.order_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
          />
          <Row label="รับผ้า" value={o.pickup_address} />
          <Row label="ส่งคืน" value={o.dropoff_address} />
          <Row label="บริการ" value={o.service_type} />
          <Row label="แพ็กเกจ" value={o.package_name || "-"} />
          <Row label="น้ำหนัก (กก.)" value={String(o.weight_kg)} />
          <Row label="จำนวนชิ้น" value={String(o.item_count)} />
          <Row label="ราคารวม" value={`฿${o.final_price.toLocaleString("th-TH")}`} />
          <Row label="บันทึกโดย" value={o.recorded_by_name} />
          <Row label="หมายเหตุ" value={o.note} />
        </div>
      : null}
    </FormModal>
  );
}

export function LaundryOrderEditModal({
  order,
  onClose,
  onSaved,
  onUpdate,
}: {
  order: LaundryOrder | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  onUpdate: (
    id: number,
    patch: Partial<Omit<LaundryOrder, "id" | "order_at">>,
  ) => Promise<LaundryOrder | null>;
}) {
  const open = order != null;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<LaundryOrderStatus>("PENDING_PICKUP");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!order) return;
    setName(order.customer_name);
    setPhone(order.customer_phone);
    setStatus(order.status);
    setNote(order.note);
    setErr("");
  }, [order]);

  async function submit() {
    if (!order) return;
    const trimmedName = name.trim() || "ลูกค้า";
    setSaving(true);
    setErr("");
    try {
      const res = await onUpdate(order.id, {
        customer_name: trimmedName,
        customer_phone: phone.trim() || "-",
        status,
        note: note.trim(),
      });
      if (!res) {
        setErr("บันทึกไม่สำเร็จ");
        return;
      }
      await onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={order ? `แก้ไข #${order.id}` : "แก้ไข"}
      description="ชื่อ · เบอร์ · สถานะ · หมายเหตุ"
      mobileCentered
      size="md"
      footer={
        <div className="flex w-full flex-wrap justify-end gap-2">
          <button
            type="button"
            className="app-btn-soft rounded-xl px-4 py-2.5 text-sm font-semibold"
            disabled={saving}
            onClick={onClose}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            className="app-btn-primary rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50"
            disabled={saving || !order}
            onClick={() => void submit()}
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      }
    >
      {order ?
        <div className="space-y-3 px-1">
          {err ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{err}</p> : null}
          {isLaundryOrderFromCustomerPickupPortal(order.recorded_by_name) ?
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs font-semibold leading-snug text-sky-950">
              คำขอจากลูกค้า (QR) — แก้สถานะ/ข้อมูลเพื่อดำเนินการตามปกติ
            </div>
          : null}
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">ชื่อลูกค้า</span>
            <input
              className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">เบอร์โทร</span>
            <input
              className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">สถานะ</span>
            <select
              className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as LaundryOrderStatus)}
            >
              {LAUNDRY_ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {laundryOrderStatusLabelTh(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">หมายเหตุ</span>
            <textarea
              className="app-input mt-1 min-h-[88px] w-full rounded-xl px-3 py-2 text-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </label>
        </div>
      : null}
    </FormModal>
  );
}
