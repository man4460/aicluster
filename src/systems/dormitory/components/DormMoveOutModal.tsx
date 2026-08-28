"use client";

import { useEffect, useMemo, useState } from "react";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { formatDormAmountStable } from "@/lib/dormitory/format-display-stable";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { dormFieldClass, dormFormLabelClass } from "@/systems/dormitory/lib/ui-tokens";
import { dormPaymentMethodLabel } from "@/systems/dormitory/lib/payment-method";
import { useDormitoryApiFetch } from "@/systems/dormitory/lib/staff-api-fetch";

export type DormMoveOutTenant = {
  id: string;
  name: string;
  bookingDepositBaht: number;
  securityDepositBaht: number;
  depositPaymentMethod?: string | null;
  checkInDate: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  tenant: DormMoveOutTenant | null;
  roomNumber: string;
  onSuccess?: () => void;
};

function moneyInput(raw: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

export function DormMoveOutModal({ open, onClose, tenant, roomNumber, onSuccess }: Props) {
  const apiFetch = useDormitoryApiFetch();
  const [checkOutDate, setCheckOutDate] = useState("");
  const [damageStr, setDamageStr] = useState("0");
  const [refundStr, setRefundStr] = useState("0");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [refundTouched, setRefundTouched] = useState(false);

  const security = tenant?.securityDepositBaht ?? 0;
  const damage = moneyInput(damageStr);
  const autoRefund = Math.max(0, Math.round((security - damage) * 100) / 100);

  useEffect(() => {
    if (!open || !tenant) return;
    setCheckOutDate(bangkokDateKey());
    setDamageStr("0");
    setRefundStr(String(tenant.securityDepositBaht || 0));
    setNote("");
    setErr(null);
    setRefundTouched(false);
  }, [open, tenant]);

  useEffect(() => {
    if (!open || !tenant || refundTouched) return;
    setRefundStr(String(autoRefund));
  }, [autoRefund, open, refundTouched, tenant]);

  const refund = moneyInput(refundStr);
  const summary = useMemo(() => {
    const held = security;
    return { held, damage, refund, leftover: Math.round((held - damage - refund) * 100) / 100 };
  }, [damage, refund, security]);

  async function submitMoveOut() {
    if (!tenant) return;
    setErr(null);
    if (damage > security + 0.005) {
      setErr("ยอดหักเสียหายต้องไม่เกินประกันห้องที่รับไว้");
      return;
    }
    if (refund > security - damage + 0.005) {
      setErr("ยอดคืนประกันต้องไม่เกินประกันหลังหักเสียหาย");
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch(`/api/dorm/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "MOVED_OUT",
          checkOutDate: checkOutDate.trim() || bangkokDateKey(),
          damageDeductionBaht: damage,
          securityRefundBaht: refund,
          moveOutNote: note.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "บันทึกย้ายออกไม่สำเร็จ");
        return;
      }
      onSuccess?.();
      onClose();
    } catch {
      setErr("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormModal
      open={open}
      onClose={onClose}
      size="lg"
      title="ย้ายออก / คืนประกัน"
      description={
        tenant ? `${tenant.name} · ห้อง ${roomNumber} · เข้าพัก ${tenant.checkInDate}` : undefined
      }
      footer={
        <FormModalFooterActions
          onCancel={onClose}
          onSubmit={() => void submitMoveOut()}
          submitLabel={busy ? "กำลังบันทึก…" : "ยืนยันย้ายออก"}
          submitDisabled={busy || !tenant}
        />
      }
    >
      {!tenant ? null : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm">
            <p className="font-black text-[#1e1b4b]">{tenant.name}</p>
            <p className="mt-2 text-xs font-semibold text-[#66638c]">
              มัดจำแรกเข้า {formatDormAmountStable(tenant.bookingDepositBaht, 2)} บาท
            </p>
            <p className="mt-1 text-sm font-black text-emerald-800">
              ประกันห้องที่รับไว้ {formatDormAmountStable(tenant.securityDepositBaht, 2)} บาท
            </p>
            {tenant.depositPaymentMethod ? (
              <p className="mt-1 text-[11px] font-semibold text-[#8b87b8]">
                ช่องทางรับตอนเข้า: {dormPaymentMethodLabel(tenant.depositPaymentMethod)}
              </p>
            ) : null}
          </div>

          <div>
            <label className={dormFormLabelClass} htmlFor="dorm-moveout-date">
              วันย้ายออก
            </label>
            <input
              id="dorm-moveout-date"
              type="date"
              className={dormFieldClass}
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={dormFormLabelClass} htmlFor="dorm-moveout-damage">
                หักค่าประกันความเสียหาย (บาท)
              </label>
              <input
                id="dorm-moveout-damage"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                className={dormFieldClass}
                value={damageStr}
                onChange={(e) => {
                  setDamageStr(e.target.value);
                  setRefundTouched(false);
                }}
                disabled={busy}
              />
            </div>
            <div>
              <label className={dormFormLabelClass} htmlFor="dorm-moveout-refund">
                คืนประกันลูกค้า (บาท)
              </label>
              <input
                id="dorm-moveout-refund"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                className={dormFieldClass}
                value={refundStr}
                onChange={(e) => {
                  setRefundTouched(true);
                  setRefundStr(e.target.value);
                }}
                disabled={busy}
              />
              <p className="mt-1 text-[11px] font-semibold text-[#8b87b8]">
                ค่าแนะนำ: {formatDormAmountStable(autoRefund, 2)} บาท (ประกัน − หักเสียหาย)
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 px-3 py-2.5 text-xs font-semibold text-emerald-950">
            <p>สรุป: หักเสียหาย {formatDormAmountStable(summary.damage, 2)} บาท</p>
            <p className="mt-0.5">คืนลูกค้า {formatDormAmountStable(summary.refund, 2)} บาท</p>
            {summary.leftover > 0.005 ? (
              <p className="mt-0.5 text-amber-900">
                คงเหลือในระบบ {formatDormAmountStable(summary.leftover, 2)} บาท (ยังไม่ได้คืน/หักครบ)
              </p>
            ) : null}
          </div>

          <div>
            <label className={dormFormLabelClass} htmlFor="dorm-moveout-note">
              หมายเหตุ <span className="font-normal text-[#8b87b8]">(ไม่บังคับ)</span>
            </label>
            <input
              id="dorm-moveout-note"
              className={dormFieldClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น รอยขีดผนัง · คืนเงินสด"
              disabled={busy}
            />
          </div>

          {err ? <p className="text-sm font-semibold text-rose-600">{err}</p> : null}
        </div>
      )}
    </FormModal>
  );
}
