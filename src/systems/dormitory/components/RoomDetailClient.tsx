"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DormPaymentProofBlock } from "@/systems/dormitory/components/DormPaymentProofBlock";
import { DormRoomInvoiceSheetModal } from "@/systems/dormitory/components/DormRoomInvoiceSheetModal";
import { DormPageStack } from "@/systems/dormitory/components/DormPageChrome";
import { formatDormAmountStable, formatPeriodMonthLabelStable } from "@/lib/dormitory/format-display-stable";
import {
  rentPerTenant,
  utilityBillRoomTotal,
  type FixedCostItem,
  parseFixedCosts,
} from "@/systems/dormitory/lib/compute";

export type DormRoomDetailJson = {
  id: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  basePrice: number;
  maxOccupants: number;
  tenants: Array<{
    id: string;
    name: string;
    phone: string;
    idCard: string;
    status: "ACTIVE" | "MOVED_OUT";
    checkInDate: string;
  }>;
  utilityBills: Array<{
    id: number;
    periodMonth: string;
    waterMeterPrev: number;
    waterMeterCurr: number;
    waterPrice: number;
    electricMeterPrev: number;
    electricMeterCurr: number;
    electricPrice: number;
    fixedFees: unknown;
    totalRoomAmount: number;
    payments: Array<{
      id: number;
      tenantId: number;
      amountToPay: number;
      paymentStatus: string;
      proofSlipUrl: string | null;
      proofUploadedAt: string | null;
    }>;
  }>;
  paidPayments: Array<{
    id: string;
    tenantId: string;
    periodMonth: string;
    amountToPay: number;
    paidAt: string;
    note: string | null;
    receiptNumber: string | null;
  }>;
};

export type DormOverdueRow = {
  tenantId: string;
  tenantName: string;
  month: string;
  balance: number;
  billId: number | null;
  paymentId: number | null;
  paymentStatus: "PENDING" | "PAID" | "OVERDUE" | null;
  proofSlipUrl: string | null;
};

function bangkokYmNow(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }).slice(0, 7);
}

function paymentStatusTh(s: string) {
  if (s === "PAID") return "ชำระแล้ว";
  if (s === "PENDING") return "ค้างชำระ";
  if (s === "OVERDUE") return "เกินกำหนด";
  return s;
}

function isUnpaidStatus(s: string | null | undefined): boolean {
  return s === "PENDING" || s === "OVERDUE";
}

export function RoomDetailClient({
  room,
  overdueRows = [],
  initialPayMonth = null,
  initialBangkokYm,
}: {
  room: DormRoomDetailJson;
  overdueRows?: DormOverdueRow[];
  initialPayMonth?: string | null;
  /** snapshot จาก Server Component — กัน hydration ของช่องงวด YYYY-MM */
  initialBangkokYm: string;
}) {
  const router = useRouter();

  async function deleteRoom() {
    if (!confirm(`ลบห้อง ${room.roomNumber} และข้อมูลที่เกี่ยวข้องทั้งหมด?`)) return;
    const res = await fetch(`/api/dorm/rooms/${room.id}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard/dormitory/rooms");
  }

  const [periodMonth, setPeriodMonth] = useState(initialBangkokYm);
  const [loadingBill, setLoadingBill] = useState(false);
  const [billFeedback, setBillFeedback] = useState<{
    ok: boolean;
    title: string;
    message: string;
    details?: string[];
    hint?: string;
    httpStatus?: number;
  } | null>(null);

  const activeTenants = room.tenants.filter((t) => t.status === "ACTIVE");
  const n = activeTenants.length;

  const [liveBangkokYm, setLiveBangkokYm] = useState<string | null>(null);
  useEffect(() => {
    setLiveBangkokYm(bangkokYmNow());
  }, []);
  const dashboardYm = liveBangkokYm ?? initialBangkokYm;
  const billCurrent = useMemo(
    () => room.utilityBills.find((b) => b.periodMonth === dashboardYm),
    [room.utilityBills, dashboardYm],
  );

  const billForMonth = useMemo(
    () => room.utilityBills.find((b) => b.periodMonth === periodMonth),
    [room.utilityBills, periodMonth],
  );

  const [waterPrev, setWaterPrev] = useState(billForMonth?.waterMeterPrev ?? 0);
  const [waterCurr, setWaterCurr] = useState(billForMonth?.waterMeterCurr ?? 0);
  const [waterRate, setWaterRate] = useState(billForMonth?.waterPrice ?? 18);
  const [elecPrev, setElecPrev] = useState(billForMonth?.electricMeterPrev ?? 0);
  const [elecCurr, setElecCurr] = useState(billForMonth?.electricMeterCurr ?? 0);
  const [elecRate, setElecRate] = useState(billForMonth?.electricPrice ?? 8);
  const [fixedRows, setFixedRows] = useState<FixedCostItem[]>(() =>
    parseFixedCosts(billForMonth?.fixedFees),
  );

  useEffect(() => {
    const b = room.utilityBills.find((x) => x.periodMonth === periodMonth);
    setWaterPrev(b?.waterMeterPrev ?? 0);
    setWaterCurr(b?.waterMeterCurr ?? 0);
    setWaterRate(b?.waterPrice ?? 18);
    setElecPrev(b?.electricMeterPrev ?? 0);
    setElecCurr(b?.electricMeterCurr ?? 0);
    setElecRate(b?.electricPrice ?? 8);
    setFixedRows(parseFixedCosts(b?.fixedFees));
  }, [periodMonth, room.utilityBills]);

  const utilityTotal = utilityBillRoomTotal({
    waterPrev,
    waterCurr,
    waterRatePerUnit: waterRate,
    electricPrev: elecPrev,
    electricCurr: elecCurr,
    electricRatePerUnit: elecRate,
    fixedCostsJson: fixedRows,
  });
  const rentShare = rentPerTenant(room.basePrice, n);
  const utilShare = n > 0 ? Math.round((utilityTotal / n) * 100) / 100 : 0;
  const totalPerPerson = Math.round((rentShare + utilShare) * 100) / 100;

  async function saveBill(e: React.FormEvent) {
    e.preventDefault();
    setBillFeedback(null);
    const ymOk = /^\d{4}-\d{2}$/.test(periodMonth);
    if (!ymOk) {
      setBillFeedback({
        ok: false,
        title: "ยังบันทึกไม่ได้",
        message: "รูปแบบงวดบิลไม่ถูกต้อง",
        hint: 'เลือกเดือนในช่อง "งวด (YYYY-MM)" ให้ครบ — ต้องได้รูปแบบ เช่น 2025-03 (ห้ามเว้นว่าง)',
      });
      return;
    }
    setLoadingBill(true);
    try {
      const finite = (v: number, fallback = 0) => (Number.isFinite(v) ? v : fallback);
      const fixedCosts = fixedRows
        .map((r) => ({ label: r.label.trim(), amount: finite(r.amount, 0) }))
        .filter((r) => r.label.length > 0);
      const res = await fetch(`/api/dorm/rooms/${room.id}/bills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodMonth,
          waterMeterPrev: Math.round(finite(waterPrev)),
          waterMeterCurr: Math.round(finite(waterCurr)),
          waterPrice: finite(waterRate, 0),
          electricMeterPrev: Math.round(finite(elecPrev)),
          electricMeterCurr: Math.round(finite(elecCurr)),
          electricPrice: finite(elecRate, 0),
          fixedCosts,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        details?: string[];
      };
      if (!res.ok) {
        const message =
          typeof data.error === "string" && data.error.length > 0
            ? data.error
            : `เซิร์ฟเวอร์ตอบกลับด้วยรหัส ${res.status}`;
        let hint: string | undefined;
        if (res.status === 401) {
          hint = "ล็อกเอาท์แล้วเข้าสู่ระบบใหม่ จากนั้นกลับมาที่หน้านี้แล้วลองบันทึกอีกครั้ง";
        } else if (res.status === 403) {
          hint = "บัญชีนี้อาจไม่มีสิทธิ์จัดการห้องนี้";
        } else if (res.status === 404) {
          hint = "ไม่พบห้อง — รีเฟรชรายการห้องหรือเปิดห้องจากเมนูหอพักอีกครั้ง";
        } else if (res.status >= 500) {
          hint = "มักเกิดจากฐานข้อมูลหรือเซิร์ฟเวอร์ขัดข้อง — ลองรีเฟรชหน้า หรือตรวจสอบว่ารัน migration แล้ว";
        } else if (res.status === 400) {
          hint =
            "ตรวจสอบ: มิเตอร์เป็นจำนวนเต็มไม่ติดลบ, ราคาต่อหน่วยเป็นตัวเลข, ค่าคงที่ทุกแถวที่เหลือต้องมีชื่อรายการ";
        }
        const rawDetails = Array.isArray(data.details)
          ? data.details.filter((x): x is string => typeof x === "string" && x.length > 0)
          : [];
        const detailsExtra = rawDetails.filter((d) => d !== message);
        setBillFeedback({
          ok: false,
          title: "บันทึกมิเตอร์ / ค่าคงที่ไม่สำเร็จ",
          message,
          details: detailsExtra.length > 0 ? detailsExtra : undefined,
          hint,
          httpStatus: res.status,
        });
        return;
      }
      setBillFeedback({
        ok: true,
        title: "บันทึกสำเร็จ",
        message: "บันทึกมิเตอร์น้ำ / ไฟ และค่าคงที่สำหรับงวดนี้แล้ว",
        hint: "กำลังเลื่อนไปส่วนชำระเงิน — ออกใบแจ้งหนี้ แนบสลิป หรือกดรับชำระได้ที่นั่น",
      });
      setPayMonth(periodMonth);
      setMeterModalOpen(false);
      router.refresh();
      window.setTimeout(() => {
        document.getElementById("dorm-record-payment")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 450);
    } catch (err) {
      setBillFeedback({
        ok: false,
        title: "เชื่อมต่อไม่สำเร็จ",
        message: "ส่งข้อมูลไปเซิร์ฟเวอร์ไม่ได้ (อาจขาดอินเทอร์เน็ตหรือเซิร์ฟเวอร์ปิด)",
        hint: err instanceof Error && err.message ? `รายละเอียดทางเทคนิค: ${err.message}` : undefined,
      });
    } finally {
      setLoadingBill(false);
    }
  }

  const [tName, setTName] = useState("");
  const [tPhone, setTPhone] = useState("");
  const [tIdCard, setTIdCard] = useState("");
  const [tCheckIn, setTCheckIn] = useState("");
  const [tLoading, setTLoading] = useState(false);
  const [tErr, setTErr] = useState<string | null>(null);

  async function addTenant(e: React.FormEvent) {
    e.preventDefault();
    setTErr(null);
    if (!tName.trim() || !tPhone.trim() || !tIdCard.trim()) {
      setTErr("กรอกชื่อ เบอร์โทร และเลขบัตรประชาชน (13 หลัก)");
      return;
    }
    if (!/^\d{13}$/.test(tIdCard.trim())) {
      setTErr("เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก");
      return;
    }
    setTLoading(true);
    try {
      const body: Record<string, string> = {
        name: tName.trim(),
        phone: tPhone.trim(),
        idCard: tIdCard.trim(),
      };
      if (tCheckIn.trim()) body.checkInDate = tCheckIn.trim();
      const res = await fetch(`/api/dorm/rooms/${room.id}/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setTErr(data.error ?? "เพิ่มไม่สำเร็จ");
        return;
      }
      setTName("");
      setTPhone("");
      setTIdCard("");
      setTCheckIn("");
      setTenantModalOpen(false);
      router.refresh();
    } finally {
      setTLoading(false);
    }
  }

  const [payTenant, setPayTenant] = useState(activeTenants[0]?.id ?? "");
  const [payMonth, setPayMonth] = useState(() => initialPayMonth ?? initialBangkokYm);
  const [payNote, setPayNote] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [payErr, setPayErr] = useState<string | null>(null);

  useEffect(() => {
    const first = activeTenants[0]?.id;
    if (first && !activeTenants.some((t) => t.id === payTenant)) {
      setPayTenant(first);
    }
  }, [activeTenants, payTenant]);

  useEffect(() => {
    if (!initialPayMonth) return;
    const row = overdueRows.find((r) => r.month === initialPayMonth);
    if (row?.tenantId && room.tenants.some((t) => t.id === row.tenantId && t.status === "ACTIVE")) {
      setPayTenant(row.tenantId);
    }
  }, [initialPayMonth, overdueRows, room.tenants]);

  const billForPay = useMemo(
    () => room.utilityBills.find((b) => b.periodMonth === payMonth),
    [room.utilityBills, payMonth],
  );

  const pendingForTenant = useMemo(() => {
    if (!billForPay || !payTenant) return null;
    return (
      billForPay.payments.find(
        (p) => String(p.tenantId) === payTenant && isUnpaidStatus(p.paymentStatus),
      ) ?? null
    );
  }, [billForPay, payTenant]);

  /** แถวค้างชำระที่ตรงกับผู้พัก + งวดในแบบฟอร์ม (สอดคล้องแดชบอร์ด) */
  const overdueRowForPay = useMemo(
    () => overdueRows.find((r) => r.month === payMonth && r.tenantId === payTenant) ?? null,
    [overdueRows, payMonth, payTenant],
  );

  /** ยอดที่แสดงในส่วนชำระเงิน — ใช้ Split Bill ถ้ามีแถวค้าง; ไม่เช่นนั้นใช้ยอดจากการคำนวณค้างชำระ */
  const displayOutstanding = useMemo(() => {
    if (pendingForTenant) return pendingForTenant.amountToPay;
    if (overdueRowForPay && overdueRowForPay.balance > 0.005) return overdueRowForPay.balance;
    return null;
  }, [pendingForTenant, overdueRowForPay]);

  const overdueNoBillForPayMonth = Boolean(overdueRowForPay && !overdueRowForPay.billId);

  const billButNoUnpaidRow =
    Boolean(billForPay && payTenant && !pendingForTenant && overdueRowForPay && overdueRowForPay.balance > 0.005);

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    setPayErr(null);
    if (!payTenant || !billForPay || !pendingForTenant) {
      setPayErr("เลือกผู้เข้าพักและงวดที่มีบิลมิเตอร์แล้ว (และมียอดค้างชำระ)");
      return;
    }
    setPayLoading(true);
    try {
      const res = await fetch("/api/dorm/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId: billForPay.id,
          tenantId: Number(payTenant),
          note: payNote.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setPayErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setPayNote("");
      router.refresh();
    } finally {
      setPayLoading(false);
    }
  }

  function addFixedRow() {
    setFixedRows((r) => [...r, { label: "ค่าส่วนกลาง", amount: 0 }]);
  }

  function updateFixed(i: number, patch: Partial<FixedCostItem>) {
    setFixedRows((rows) => rows.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  }

  function removeFixed(i: number) {
    setFixedRows((rows) => rows.filter((_, j) => j !== i));
  }

  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [meterModalOpen, setMeterModalOpen] = useState(false);
  const [invoiceSheetPaymentId, setInvoiceSheetPaymentId] = useState<number | null>(null);

  useEffect(() => {
    if (!tenantModalOpen && !meterModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTenantModalOpen(false);
        setMeterModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tenantModalOpen, meterModalOpen]);

  return (
    <DormPageStack>
      {invoiceSheetPaymentId != null ? (
        <DormRoomInvoiceSheetModal
          paymentId={invoiceSheetPaymentId}
          roomId={room.id}
          roomNumber={room.roomNumber}
          onClose={() => setInvoiceSheetPaymentId(null)}
        />
      ) : null}
      {overdueRows.length > 0 ? (
        <section
          className="rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-white to-white p-5 shadow-sm"
          aria-label="ค้างชำระ"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-amber-950">ค้างชำระ (งวดที่ผ่านมา)</h2>
              <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
                รายการตรงกับแดชบอร์ด — ใช้ใบแจ้งหนี้ / แนบสลิป หรือบันทึกมิเตอร์ถ้ายังไม่มีบิลในงวดนั้น
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {overdueRows.map((row) => (
              <li
                key={`${row.tenantId}-${row.month}`}
                className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{row.tenantName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      งวด {formatPeriodMonthLabelStable(row.month)}{" "}
                      <span className="font-mono text-slate-400">({row.month})</span>
                    </p>
                    <p className="mt-2 text-lg font-bold tabular-nums text-red-800">
                      {formatDormAmountStable(row.balance, 2)}{" "}
                      <span className="text-sm font-semibold">บาท</span>
                    </p>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-3 lg:max-w-md">
                    {!row.billId ? (
                      <>
                        <p className="text-xs leading-relaxed text-amber-900">
                          ยังไม่มีบิลมิเตอร์ในงวดนี้ — บันทึกมิเตอร์และค่าคงที่ก่อน ระบบจะสร้างยอดแยกคนและใบแจ้งหนี้ให้
                          จากนั้นไปที่ส่วน &quot;บันทึกการชำระเงิน&quot; ด้านล่างเพื่อออกใบแจ้งหนี้ แนบสลิป หรือรับชำระ
                          (หลังบันทึกมิเตอร์สำเร็จ หน้าจะเลื่อนไปให้อัตโนมัติ)
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                          <button
                            type="button"
                            className="w-full rounded-xl bg-[#0000BF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0000a3] sm:w-auto"
                            onClick={() => {
                              setPayTenant(row.tenantId);
                              setPayMonth(row.month);
                              setPeriodMonth(row.month);
                              setBillFeedback(null);
                              setMeterModalOpen(true);
                            }}
                          >
                            บันทึกมิเตอร์ / ค่าคงที่ — {row.month}
                          </button>
                          <button
                            type="button"
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 sm:w-auto"
                            onClick={() => {
                              setPayTenant(row.tenantId);
                              setPayMonth(row.month);
                              document.getElementById("dorm-record-payment")?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                            }}
                          >
                            ไปส่วนชำระเงิน (หลังมีบิลจึงชำระได้)
                          </button>
                        </div>
                      </>
                    ) : row.paymentId != null && isUnpaidStatus(row.paymentStatus) ? (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setInvoiceSheetPaymentId(row.paymentId!)}
                            className="inline-flex items-center justify-center rounded-xl bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0000a3]"
                          >
                            ใบแจ้งหนี้ / QR / ลิงก์แนบสลิป
                          </button>
                          <button
                            type="button"
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                            onClick={() => {
                              setPayTenant(row.tenantId);
                              setPayMonth(row.month);
                              document.getElementById("dorm-record-payment")?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                            }}
                          >
                            เลือกในแบบฟอร์มชำระ
                          </button>
                        </div>
                        <DormPaymentProofBlock
                          paymentId={row.paymentId}
                          initialUrl={row.proofSlipUrl ?? null}
                        />
                      </>
                    ) : (
                      <p className="text-xs text-slate-500">
                        ไม่พบแถวชำระในงวดนี้ — ลองรีเฟรช หรือบันทึกมิเตอร์ใหม่
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">งวดปัจจุบัน ({dashboardYm})</h2>
        <p className="mt-1 text-xs text-slate-500">
          มิเตอร์และยอดรวมเป็นของทั้งห้อง — แต่ละคนชำระตามยอดที่หารจากผู้พัก ACTIVE
        </p>
        {!billCurrent ? (
          <p className="mt-4 text-sm text-sky-800">
            ยังไม่มีบิลมิเตอร์เดือนนี้ — กดปุ่ม &quot;บันทึกมิเตอร์ / ค่าคงที่&quot; ด้านล่างเพื่อกรอกมิเตอร์
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                <p className="text-xs font-semibold text-slate-500">มิเตอร์น้ำ (ห้อง)</p>
                <p className="mt-1 tabular-nums">
                  {billCurrent.waterMeterPrev} → {billCurrent.waterMeterCurr}
                  <span className="text-slate-500">
                    {" "}
                    (ใช้ {Math.max(0, billCurrent.waterMeterCurr - billCurrent.waterMeterPrev)} หน่วย)
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  ราคา/หน่วย {formatDormAmountStable(billCurrent.waterPrice)} บาท
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                <p className="text-xs font-semibold text-slate-500">มิเตอร์ไฟ (ห้อง)</p>
                <p className="mt-1 tabular-nums">
                  {billCurrent.electricMeterPrev} → {billCurrent.electricMeterCurr}
                  <span className="text-slate-500">
                    {" "}
                    (ใช้ {Math.max(0, billCurrent.electricMeterCurr - billCurrent.electricMeterPrev)} หน่วย)
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  ราคา/หน่วย {formatDormAmountStable(billCurrent.electricPrice)} บาท
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-700">
              <span className="font-medium">ยอดน้ำไฟ+คงที่ (ห้อง):</span>{" "}
              {formatDormAmountStable(billCurrent.totalRoomAmount, 2)} บาท
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">ผู้เข้าพัก</th>
                    <th className="px-3 py-2">สถานะในห้อง</th>
                    <th className="px-3 py-2 text-right">ยอดหาร (บาท)</th>
                    <th className="px-3 py-2">การชำระงวดนี้</th>
                    <th className="px-3 py-2">ใบแจ้งหนี้</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {room.tenants.map((t) => {
                    const row = billCurrent.payments.find((p) => p.tenantId === Number(t.id));
                    return (
                      <tr key={t.id} className="text-slate-800">
                        <td className="px-3 py-2 font-medium">{t.name}</td>
                        <td className="px-3 py-2 text-slate-600">
                          {t.status === "ACTIVE" ? "พักอยู่" : "ย้ายออก"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {t.status === "ACTIVE" && row
                            ? formatDormAmountStable(row.amountToPay, 2)
                            : "—"}
                        </td>
                        <td className="px-3 py-2">
                          {t.status !== "ACTIVE" ? (
                            <span className="text-slate-400">—</span>
                          ) : row ? (
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={
                                  row.paymentStatus === "PAID"
                                    ? "font-medium text-emerald-700"
                                    : "font-medium text-amber-800"
                                }
                              >
                                {paymentStatusTh(row.paymentStatus)}
                              </span>
                              {isUnpaidStatus(row.paymentStatus) && row.proofSlipUrl ? (
                                <span className="text-[10px] font-medium text-sky-700">มีสลิปรอตรวจ</span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-slate-400">รอสร้างแถวชำระ</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {t.status === "ACTIVE" && row && isUnpaidStatus(row.paymentStatus) ? (
                            <button
                              type="button"
                              onClick={() => setInvoiceSheetPaymentId(row.id)}
                              className="text-xs font-semibold text-[#0000BF] underline decoration-[#0000BF]/40 underline-offset-2 hover:decoration-[#0000BF]"
                            >
                              พิมพ์ / QR
                            </button>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {billFeedback && (!meterModalOpen || billFeedback.ok) ? (
        <div
          role="alert"
          aria-live="polite"
          className={
            billFeedback.ok
              ? "rounded-xl border-2 border-emerald-200 bg-emerald-50/90 px-4 py-3 text-slate-800 shadow-sm"
              : "rounded-xl border-2 border-red-300 bg-red-50/95 px-4 py-3 text-slate-900 shadow-sm"
          }
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-semibold">{billFeedback.title}</p>
            <button
              type="button"
              onClick={() => setBillFeedback(null)}
              className="shrink-0 rounded-lg px-2 py-0.5 text-xs font-medium text-slate-600 underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
            >
              ปิดข้อความ
            </button>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed">{billFeedback.message}</p>
          {billFeedback.details && billFeedback.details.length > 0 ? (
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
              {billFeedback.details.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          ) : null}
          {billFeedback.hint ? (
            <p className="mt-2 border-t border-slate-200/80 pt-2 text-xs leading-relaxed text-slate-600">
              {billFeedback.hint}
            </p>
          ) : null}
          {billFeedback.httpStatus != null && !billFeedback.ok ? (
            <p className="mt-1 text-[11px] tabular-nums text-slate-500">
              รหัส HTTP {billFeedback.httpStatus}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={deleteRoom}
          className="text-sm font-medium text-red-600 hover:text-red-800"
        >
          ลบห้องนี้
        </button>
      </div>
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">ผู้เข้าพัก ({n}/{room.maxOccupants})</h2>
        <p className="mt-1 text-xs text-slate-500">
          ค่าเช่า {formatDormAmountStable(room.basePrice)} บาท — หาร {n > 0 ? n : "—"} คน ={" "}
          <span className="font-medium text-slate-800">{n > 0 ? formatDormAmountStable(rentShare) : "—"}</span>{" "}
          บาท/คน
        </p>
        <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
          {room.tenants.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-sm">
              <div>
                <span className="font-medium text-slate-900">{t.name}</span>
                <span className="text-slate-500"> · {t.phone}</span>
                <span className="text-slate-400"> · ปชช. {t.idCard}</span>
                {t.status === "MOVED_OUT" ? (
                  <span className="ml-2 text-xs text-slate-400">(ย้ายออก)</span>
                ) : null}
              </div>
              <div className="flex gap-2">
                {t.status === "ACTIVE" ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-slate-500 hover:text-slate-800"
                    onClick={async () => {
                      await fetch(`/api/dorm/tenants/${t.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "MOVED_OUT" }),
                      });
                      router.refresh();
                    }}
                  >
                    ย้ายออก
                  </button>
                ) : null}
                <button
                  type="button"
                  className="text-xs font-medium text-red-600 hover:text-red-800"
                  onClick={async () => {
                    if (!confirm("ลบผู้เข้าพักนี้?")) return;
                    await fetch(`/api/dorm/tenants/${t.id}`, { method: "DELETE" });
                    router.refresh();
                  }}
                >
                  ลบ
                </button>
              </div>
            </li>
          ))}
        </ul>
        {n < room.maxOccupants ? (
          <button
            type="button"
            onClick={() => {
              setTErr(null);
              setTenantModalOpen(true);
            }}
            className="mt-4 w-full rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-[#0000BF] transition hover:border-[#0000BF]/30 hover:bg-[#0000BF]/[0.04] sm:w-auto"
          >
            + เพิ่มผู้เข้าพัก
          </button>
        ) : (
          <p className="mt-3 text-xs text-amber-700">ห้องเต็ม — ไม่สามารถเพิ่มผู้เข้าพักได้</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">มิเตอร์น้ำ / ไฟ &amp; ค่าคงที่</h2>
            <p className="mt-1 text-xs text-slate-500">
              บันทึกงวดบิลและยอดรวมห้อง — Split ให้ผู้พัก ACTIVE อัตโนมัติ
            </p>
            <p className="mt-2 text-xs text-slate-600">
              <span className="font-medium text-slate-700">สรุปงวด {periodMonth}</span> (
              {formatPeriodMonthLabelStable(periodMonth)}
              {billForMonth
                ? `) · ยอดห้อง ${formatDormAmountStable(billForMonth.totalRoomAmount, 2)} บาท`
                : ") · ยังไม่มีบิลในงวดนี้"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setBillFeedback(null);
              setMeterModalOpen(true);
            }}
            className="shrink-0 rounded-lg bg-[#0000BF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0000a6]"
          >
            บันทึกมิเตอร์ / ค่าคงที่
          </button>
        </div>
      </section>

      <section
        id="dorm-record-payment"
        className="scroll-mt-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
      >
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">บันทึกการชำระเงิน</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500">
            เลือกผู้เข้าพักและงวดที่บันทึกมิเตอร์แล้ว — พิมพ์ใบแจ้งหนี้ให้ผู้พักสแกนพร้อมเพย์และแนบสลิป จากนั้นตรวจสลิปแล้วกดรับชำระ
            ถ้างวดนั้นยังไม่มีบิล ให้บันทึกมิเตอร์ก่อน (จากการ์ดค้างชำระหรือปุ่มมิเตอร์ด้านบน) แล้วยอดจะขึ้นที่นี่
          </p>
        </div>

        <form onSubmit={recordPayment} className="space-y-6 p-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="pay-tenant" className="block text-xs font-semibold text-slate-700">
                ผู้เข้าพัก
              </label>
              <select
                id="pay-tenant"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#0000BF]/40 focus:ring-2 focus:ring-[#0000BF]/15"
                value={payTenant}
                onChange={(e) => setPayTenant(e.target.value)}
              >
                {activeTenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="pay-month" className="block text-xs font-semibold text-slate-700">
                งวดเรียกเก็บ
              </label>
              <input
                id="pay-month"
                type="month"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#0000BF]/40 focus:ring-2 focus:ring-[#0000BF]/15"
                value={payMonth}
                onChange={(e) => setPayMonth(e.target.value)}
              />
              <p className="text-xs text-slate-500">{formatPeriodMonthLabelStable(payMonth)}</p>
            </div>
          </div>

          <div
            className={
              displayOutstanding != null
                ? "rounded-2xl border-2 border-[#0000BF]/20 bg-[#0000BF]/[0.04] p-4 sm:p-5"
                : "rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 sm:p-5"
            }
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {pendingForTenant ? "ยอด Split Bill (เรียกเก็บ)" : "ยอดค้างชำระ"}
                </p>
                {displayOutstanding != null ? (
                  <>
                    <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-red-800 sm:text-3xl">
                      {formatDormAmountStable(displayOutstanding, 2)}{" "}
                      <span className="text-base font-semibold text-red-800/85">บาท</span>
                    </p>
                    {pendingForTenant ? (
                      <p className="mt-1 text-[11px] text-slate-600">
                        ตรงกับใบแจ้งหนี้ / แนบสลิปในงวด {payMonth}
                      </p>
                    ) : overdueNoBillForPayMonth ? (
                      <p className="mt-2 text-xs leading-relaxed text-amber-950">
                        งวดนี้ยังไม่มีบิลมิเตอร์ — บันทึกมิเตอร์ / ค่าคงที่ก่อน (การ์ดค้างชำระหรือส่วนมิเตอร์)
                        หลังมีบิลแล้วยอดด้านบนจะตรงกับ Split Bill และจะออกใบแจ้งหนี้ได้
                      </p>
                    ) : billButNoUnpaidRow ? (
                      <p className="mt-2 text-xs leading-relaxed text-amber-900">
                        มีบิลในงวดนี้แต่ไม่พบแถวชำระที่ยังค้างสำหรับผู้พักนี้ — ลองรีเฟรชหน้า หรือบันทึกมิเตอร์ใหม่ให้ครบผู้พัก ACTIVE
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-600">
                        ยอดตามการคำนวณค้างชำระ (สอดคล้องแดชบอร์ด)
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    ไม่มียอดค้างชำระในงวดนี้สำหรับผู้พักที่เลือก — หรือยังไม่มีบิลมิเตอร์ ให้บันทึกมิเตอร์ด้วยปุ่ม
                    &quot;บันทึกมิเตอร์ / ค่าคงที่&quot; ก่อน
                  </p>
                )}
              </div>
              {displayOutstanding != null ? (
                <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-950 ring-1 ring-amber-200/80">
                  ค้างชำระ
                </span>
              ) : null}
            </div>
          </div>

          {pendingForTenant ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-800">ใบแจ้งหนี้ &amp; QR พร้อมเพย์</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  ตั้งเบอร์พร้อมเพย์และช่องทางโอนได้ที่ &quot;ตั้งค่าหอพัก&quot;
                </p>
                <button
                  type="button"
                  onClick={() => setInvoiceSheetPaymentId(pendingForTenant.id)}
                  className="mt-3 inline-flex min-h-[44px] items-center rounded-xl bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0000a6]"
                >
                  เปิดใบแจ้งหนี้ (พิมพ์ / ลิงก์แนบสลิป)
                </button>
              </div>
              <DormPaymentProofBlock
                paymentId={pendingForTenant.id}
                initialUrl={pendingForTenant.proofSlipUrl ?? null}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="pay-note" className="block text-xs font-semibold text-slate-700">
              หมายเหตุ <span className="font-normal text-slate-400">(ไม่บังคับ)</span>
            </label>
            <input
              id="pay-note"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#0000BF]/40 focus:ring-2 focus:ring-[#0000BF]/15"
              placeholder="เช่น โอนแล้ว, เงินสด"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={payLoading || activeTenants.length === 0 || !pendingForTenant}
              className="order-2 w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:order-1 sm:w-auto sm:min-w-[180px]"
            >
              {payLoading ? "กำลังบันทึก…" : "บันทึกการชำระ"}
            </button>
            <p className="order-1 text-center text-[11px] text-slate-400 sm:order-2 sm:text-right">
              แนะนำตรวจสลิปก่อนกดรับเงิน — หลังบันทึกจะออกใบเสร็จได้จากรายการด้านล่าง
            </p>
          </div>
          {payErr ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">{payErr}</p>
          ) : null}
        </form>

        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">รายการชำระล่าสุด</h3>
            <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-slate-200">
              ชำระแล้ว
            </span>
          </div>
          {room.paidPayments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
              ยังไม่มีรายการชำระในห้องนี้
            </p>
          ) : (
            <ul className="space-y-2">
              {room.paidPayments.slice(0, 15).map((p) => {
                const tn = room.tenants.find((t) => t.id === p.tenantId)?.name ?? "—";
                return (
                  <li
                    key={p.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{tn}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        งวด {formatPeriodMonthLabelStable(p.periodMonth)}{" "}
                        <span className="text-slate-400">({p.periodMonth})</span>
                      </p>
                      <p className="mt-1 text-lg font-bold tabular-nums text-emerald-800">
                        {formatDormAmountStable(p.amountToPay, 2)}{" "}
                        <span className="text-sm font-semibold">บาท</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Link
                        href={`/dashboard/dormitory/receipt/${p.id}`}
                        target="_blank"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-[#0000BF] transition hover:bg-[#0000BF]/5"
                        title="ใช้ขนาดจากตั้งค่าหอพัก"
                      >
                        ตามตั้งค่า
                      </Link>
                      <Link
                        href={`/dashboard/dormitory/receipt/${p.id}?w=58`}
                        target="_blank"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-[#0000BF] transition hover:bg-[#0000BF]/5"
                      >
                        Slip 58mm
                      </Link>
                      <Link
                        href={`/dashboard/dormitory/receipt/${p.id}?w=80`}
                        target="_blank"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-[#0000BF] transition hover:bg-[#0000BF]/5"
                      >
                        Slip 80mm
                      </Link>
                      <Link
                        href={`/dashboard/dormitory/receipt/${p.id}?format=a4`}
                        target="_blank"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-[#0000BF] transition hover:bg-[#0000BF]/5"
                      >
                        A4
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {tenantModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          role="presentation"
          onClick={() => setTenantModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dorm-tenant-modal-title"
            className="max-h-[min(92vh,640px)] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <h2 id="dorm-tenant-modal-title" className="text-lg font-semibold text-slate-900">
                  เพิ่มผู้เข้าพัก
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  ห้อง {room.roomNumber} · เหลือที่ว่าง {room.maxOccupants - n} คน
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTenantModalOpen(false)}
                className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>
            <form onSubmit={addTenant} className="grid gap-3 px-5 py-4">
              {tErr ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-100">{tErr}</p>
              ) : null}
              <input
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                placeholder="ชื่อ-นามสกุล"
                value={tName}
                onChange={(e) => setTName(e.target.value)}
                autoComplete="name"
              />
              <input
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                placeholder="เบอร์โทร"
                value={tPhone}
                onChange={(e) => setTPhone(e.target.value)}
                inputMode="tel"
              />
              <input
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                placeholder="เลขบัตร ปชช. 13 หลัก"
                value={tIdCard}
                onChange={(e) => setTIdCard(e.target.value.replace(/\D/g, "").slice(0, 13))}
                maxLength={13}
                inputMode="numeric"
              />
              <label className="text-xs font-medium text-slate-600">
                วันเข้าพัก <span className="font-normal text-slate-400">(ว่างได้ = วันนี้)</span>
                <input
                  type="date"
                  className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                  value={tCheckIn}
                  onChange={(e) => setTCheckIn(e.target.value)}
                />
              </label>
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setTenantModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={tLoading}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {tLoading ? "กำลังบันทึก…" : "เพิ่มผู้เข้าพัก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {meterModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          role="presentation"
          onClick={() => setMeterModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dorm-meter-modal-title"
            className="max-h-[min(92vh,720px)] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <h2 id="dorm-meter-modal-title" className="text-lg font-semibold text-slate-900">
                  มิเตอร์น้ำ / ไฟ &amp; ค่าคงที่
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  เลือกงวด กรอกมิเตอร์และราคาต่อหน่วย แล้วบันทึก — Split ต่อคนอัตโนมัติ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMeterModalOpen(false)}
                className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>
            <form onSubmit={saveBill} className="space-y-4 px-5 py-4">
              <label className="block text-xs font-medium text-slate-600">
                งวดบิล (YYYY-MM)
                <input
                  type="month"
                  className="mt-1 block w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={periodMonth}
                  onChange={(e) => setPeriodMonth(e.target.value)}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-xs font-medium text-slate-600">
                  มิเตอร์น้ำก่อน
                  <input
                    type="number"
                    step={1}
                    min={0}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={waterPrev}
                    onChange={(e) => setWaterPrev(Number(e.target.value))}
                  />
                </label>
                <label className="text-xs font-medium text-slate-600">
                  มิเตอร์น้ำปัจจุบัน
                  <input
                    type="number"
                    step={1}
                    min={0}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={waterCurr}
                    onChange={(e) => setWaterCurr(Number(e.target.value))}
                  />
                </label>
                <label className="text-xs font-medium text-slate-600">
                  ราคาน้ำ / หน่วย
                  <input
                    type="number"
                    step={0.01}
                    min={0}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={waterRate}
                    onChange={(e) => setWaterRate(Number(e.target.value))}
                  />
                </label>
                <label className="text-xs font-medium text-slate-600">
                  มิเตอร์ไฟก่อน
                  <input
                    type="number"
                    step={1}
                    min={0}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={elecPrev}
                    onChange={(e) => setElecPrev(Number(e.target.value))}
                  />
                </label>
                <label className="text-xs font-medium text-slate-600">
                  มิเตอร์ไฟปัจจุบัน
                  <input
                    type="number"
                    step={1}
                    min={0}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={elecCurr}
                    onChange={(e) => setElecCurr(Number(e.target.value))}
                  />
                </label>
                <label className="text-xs font-medium text-slate-600">
                  ราคาไฟ / หน่วย
                  <input
                    type="number"
                    step={0.01}
                    min={0}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={elecRate}
                    onChange={(e) => setElecRate(Number(e.target.value))}
                  />
                </label>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-700">ค่าใช้จ่ายคงที่ (Fixed)</p>
                  <button
                    type="button"
                    onClick={addFixedRow}
                    className="text-xs font-medium text-[#0000BF] hover:underline"
                  >
                    + เพิ่มรายการ
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {fixedRows.length === 0 ? (
                    <p className="text-xs text-slate-400">ยังไม่มีรายการ — เช่น ค่าส่วนกลาง, อินเทอร์เน็ต</p>
                  ) : null}
                  {fixedRows.map((row, i) => (
                    <div key={i} className="flex flex-wrap gap-2">
                      <input
                        className="min-w-[140px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={row.label}
                        onChange={(e) => updateFixed(i, { label: e.target.value })}
                      />
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={row.amount}
                        onChange={(e) => updateFixed(i, { amount: Number(e.target.value) })}
                      />
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => removeFixed(i)}
                      >
                        ลบ
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p>
                  <span className="font-medium">ยอดน้ำไฟ+คงที่รวมห้อง:</span>{" "}
                  {formatDormAmountStable(utilityTotal, 2)} บาท
                </p>
                <p className="mt-1">
                  <span className="font-medium">Split Bill ต่อคน (งวด {periodMonth}):</span> ค่าเช่า{" "}
                  {formatDormAmountStable(rentShare)} + ส่วนน้ำไฟ {formatDormAmountStable(utilShare)} ={" "}
                  <span className="font-semibold text-[#0000BF]">{formatDormAmountStable(totalPerPerson)}</span>{" "}
                  บาท
                </p>
              </div>
              {billFeedback && !billFeedback.ok ? (
                <div
                  role="alert"
                  className="rounded-xl border-2 border-red-300 bg-red-50/95 px-4 py-3 text-slate-900 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{billFeedback.title}</p>
                    <button
                      type="button"
                      onClick={() => setBillFeedback(null)}
                      className="shrink-0 text-xs font-medium text-slate-600 underline"
                    >
                      ปิด
                    </button>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed">{billFeedback.message}</p>
                  {billFeedback.details && billFeedback.details.length > 0 ? (
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
                      {billFeedback.details.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  ) : null}
                  {billFeedback.hint ? (
                    <p className="mt-2 border-t border-slate-200/80 pt-2 text-xs text-slate-600">
                      {billFeedback.hint}
                    </p>
                  ) : null}
                  {billFeedback.httpStatus != null ? (
                    <p className="mt-1 text-[11px] text-slate-500">รหัส HTTP {billFeedback.httpStatus}</p>
                  ) : null}
                </div>
              ) : null}
              <p className="text-[11px] text-slate-500">
                บันทึกสำเร็จจะแสดงข้อความด้านบนหน้า — กดพื้นหลังมืดหรือ Esc เพื่อปิดหน้าต่าง
              </p>
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setMeterModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loadingBill}
                  className="rounded-xl bg-[#0000BF] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0000a6] disabled:opacity-60"
                >
                  {loadingBill ? "กำลังบันทึก…" : "บันทึกบิลงวดนี้"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </DormPageStack>
  );
}
