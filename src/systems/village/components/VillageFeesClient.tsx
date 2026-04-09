"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-container";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import {
  createVillageSessionApiRepository,
  villageFeeCycleLabelTh,
  type VillageFeeRow,
} from "@/systems/village/village-service";
import { villageBtnPrimary, villageBtnSecondary, villageField, villageTableWrap, villageToolbar } from "@/systems/village/village-ui";

type FeeStatus = "PENDING" | "PARTIAL" | "PAID" | "WAIVED";

const STATUS_OPTIONS: FeeStatus[] = ["PENDING", "PARTIAL", "PAID", "WAIVED"];

function FeeEditModal({
  api,
  row,
  onClose,
  onSave,
}: {
  api: ReturnType<typeof createVillageSessionApiRepository>;
  row: VillageFeeRow;
  onClose: () => void;
  onSave: () => void;
}) {
  const [due, setDue] = useState(String(row.amount_due));
  const [paid, setPaid] = useState(String(row.amount_paid));
  const [status, setStatus] = useState<FeeStatus>((row.status as FeeStatus) || "PENDING");
  const [note, setNote] = useState(row.note ?? "");
  const [busy, setBusy] = useState(false);

  return (
    <FormModal
      open
      title={`แก้บิล ${row.house_no}`}
      description={`เดือน ${row.year_month}`}
      onClose={onClose}
      size="md"
      footer={
        <FormModalFooterActions
          cancelLabel="ยกเลิก"
          onCancel={onClose}
          submitLabel="บันทึก"
          submitDisabled={busy}
          loading={busy}
          onSubmit={async () => {
            const d = Number.parseInt(due, 10);
            const p = Number.parseInt(paid, 10);
            if (!Number.isFinite(d) || d < 0 || !Number.isFinite(p) || p < 0) {
              alert("กรอกยอดเป็นตัวเลขเท่านั้น");
              return;
            }
            setBusy(true);
            try {
              await api.patchFeeRow(row.id, {
                amount_due: d,
                amount_paid: p,
                status,
                note: note.trim() || null,
              });
              onSave();
            } catch (e) {
              alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
            } finally {
              setBusy(false);
            }
          }}
        />
      }
    >
      <div className="space-y-4 text-sm">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">ยอดเรียกเก็บ (บาท)</span>
          <input
            className={`mt-1.5 ${villageField}`}
            value={due}
            onChange={(e) => setDue(e.target.value)}
            inputMode="numeric"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">ยอดรับแล้ว (บาท)</span>
          <input
            className={`mt-1.5 ${villageField}`}
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            inputMode="numeric"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">สถานะ</span>
          <select
            className={`mt-1.5 ${villageField}`}
            value={status}
            onChange={(e) => setStatus(e.target.value as FeeStatus)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">หมายเหตุ (ถ้ามี)</span>
          <input className={`mt-1.5 ${villageField}`} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      </div>
    </FormModal>
  );
}

export function VillageFeesClient({ initialYm }: { initialYm: string }) {
  const api = useMemo(() => createVillageSessionApiRepository(), []);
  const [ym, setYm] = useState(initialYm);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [rows, setRows] = useState<VillageFeeRow[]>([]);
  const [defaultFee, setDefaultFee] = useState(0);
  const [dueDay, setDueDay] = useState(5);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<VillageFeeRow | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const r = await api.getFeeRows(ym, statusFilter ?? undefined);
      setRows(r.fee_rows);
      setDefaultFee(r.default_monthly_fee);
      setDueDay(r.due_day_of_month);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [api, ym, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="ค่าส่วนกลาง"
        description="เลือกเดือน โหลดบิล หรือสร้าง/เติมทุกหลัง — ยอดตามรอบและอัตราต่อเดือนของแต่ละบ้าน"
      />
      <div className={villageToolbar}>
        <label className="text-sm font-medium text-slate-700">
          เดือน
          <input
            type="month"
            className={`mt-1.5 block font-mono ${villageField}`}
            value={ym}
            onChange={(e) => setYm(e.target.value)}
          />
        </label>
        <button type="button" className={villageBtnSecondary} onClick={() => void load()}>
          โหลด
        </button>
        <button
          type="button"
          className={villageBtnPrimary}
          onClick={async () => {
            try {
              await api.generateFeeRows(ym);
              void load();
            } catch (e) {
              alert(e instanceof Error ? e.message : "สร้างรายการไม่สำเร็จ");
            }
          }}
        >
          สร้าง/เติมทุกหลัง
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm">
        <span className="text-xs font-medium text-slate-500">กรองสถานะ</span>
        <button
          type="button"
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusFilter == null ? "bg-[#0000BF] text-white" : "bg-slate-100 text-slate-600"}`}
          onClick={() => setStatusFilter(null)}
        >
          ทั้งหมด
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusFilter === s ? "bg-[#0000BF] text-white" : "bg-slate-100 text-slate-600"}`}
            onClick={() => setStatusFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-slate-500">
        อัตราต่อเดือนจากตั้งค่า {defaultFee.toLocaleString("th-TH")} บาท · ครบกำหนดวันที่ {dueDay} · รอบเรียกเก็บตั้งที่ลูกบ้าน
      </p>
      {err ? <p className="text-sm text-rose-600">{err}</p> : null}
      {loading ? <p className="text-sm text-slate-500">กำลังโหลด…</p> : null}
      <div className={villageTableWrap}>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50/90 text-xs font-semibold text-slate-600">
            <tr>
              <th className="px-3 py-2">บ้าน</th>
              <th className="px-3 py-2">เจ้าบ้าน</th>
              <th className="px-3 py-2">รอบ</th>
              <th className="px-3 py-2">เรียกเก็บ</th>
              <th className="px-3 py-2">รับแล้ว</th>
              <th className="px-3 py-2">สถานะ</th>
              <th className="px-3 py-2">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium">{r.house_no}</td>
                <td className="px-3 py-2 text-slate-600">{r.owner_name ?? "—"}</td>
                <td className="px-3 py-2 text-xs text-slate-600">{villageFeeCycleLabelTh(r.fee_cycle)}</td>
                <td className="px-3 py-2">{r.amount_due.toLocaleString("th-TH")}</td>
                <td className="px-3 py-2">{r.amount_paid.toLocaleString("th-TH")}</td>
                <td className="px-3 py-2">{r.status}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="text-[#0000BF] hover:underline" onClick={() => setEditRow(r)}>
                      แก้ยอด
                    </button>
                    <button
                      type="button"
                      className="text-xs text-emerald-700 hover:underline"
                      onClick={async () => {
                        try {
                          await api.patchFeeRow(r.id, { amount_paid: r.amount_due, status: "PAID" });
                          void load();
                        } catch (e) {
                          alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
                        }
                      }}
                    >
                      ชำระครบ
                    </button>
                    <button
                      type="button"
                      className="text-xs text-slate-600 hover:underline"
                      onClick={async () => {
                        try {
                          await api.patchFeeRow(r.id, { status: "WAIVED" });
                          void load();
                        } catch (e) {
                          alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
                        }
                      }}
                    >
                      ยกเว้น
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !loading ? (
          <p className="p-4 text-center text-sm text-slate-500">ยังไม่มีรายการ — กดสร้าง/เติมรายการทุกบ้าน</p>
        ) : null}
      </div>
      {editRow ? (
        <FeeEditModal
          api={api}
          row={editRow}
          onClose={() => setEditRow(null)}
          onSave={() => {
            setEditRow(null);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
