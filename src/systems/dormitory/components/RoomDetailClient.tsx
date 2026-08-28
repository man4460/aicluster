"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DormPaymentProofBlock } from "@/systems/dormitory/components/DormPaymentProofBlock";
import { DormCenteredModal } from "@/systems/dormitory/components/DormCenteredModal";
import { DormRoomInvoiceSheetModal } from "@/systems/dormitory/components/DormRoomInvoiceSheetModal";
import { DormReceiptPrintIconButton } from "@/systems/dormitory/components/DormReceiptPrintIconButton";
import { AppEmptyState } from "@/components/app-templates";
import type { DormReceiptBrand } from "@/systems/dormitory/lib/dorm-receipt-print";
import { formatDormAmountStable, formatPeriodMonthLabelStable } from "@/lib/dormitory/format-display-stable";
import { cn } from "@/lib/cn";
import { dormFilterChipClass, dormSegmentShellClass } from "@/systems/dormitory/dorm-ui-tokens";
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

function resolveOverviewInvoicePayment(
  row: OverviewBillingCard,
  bills: DormRoomDetailJson["utilityBills"],
): { paymentId: number; proofSlipUrl: string | null } | null {
  if (row.paymentId != null && isUnpaidStatus(row.paymentStatus)) {
    return { paymentId: row.paymentId, proofSlipUrl: row.proofSlipUrl ?? null };
  }
  if (!row.billId) return null;
  const bill = bills.find((b) => b.id === row.billId);
  const payment = bill?.payments.find(
    (p) => String(p.tenantId) === row.tenantId && isUnpaidStatus(p.paymentStatus),
  );
  if (!payment) return null;
  return { paymentId: payment.id, proofSlipUrl: payment.proofSlipUrl ?? null };
}

type OverviewBillingCard = {
  key: string;
  tenantId: string;
  tenantName: string;
  month: string;
  balance: number;
  billId: number | null;
  paymentId: number | null;
  paymentStatus: "PENDING" | "PAID" | "OVERDUE" | null;
  proofSlipUrl: string | null;
  scope: "overdue" | "current";
  meterNote?: string;
};

type RoomDetailTab = "overview" | "tenants" | "meter" | "payment";

function parseRoomDetailTab(raw: string | null | undefined): RoomDetailTab | null {
  if (raw === "overview" || raw === "tenants" || raw === "meter" || raw === "payment") return raw;
  return null;
}

function resolveInitialRoomDetailTab(
  initialFocusSection: "meter" | "payment" | null,
  initialPayMonth: string | null,
  initialSection?: string | null,
): RoomDetailTab {
  const fromSection = parseRoomDetailTab(initialSection);
  if (fromSection) return fromSection;
  if (initialFocusSection === "meter") return "meter";
  if (initialFocusSection === "payment" || initialPayMonth) return "payment";
  return "overview";
}

function roomDetailTabClass(active: boolean) {
  return cn(
    "inline-flex min-h-[42px] w-full items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-center text-[10px] font-bold sm:px-2 sm:text-sm",
    dormFilterChipClass(active),
  );
}

export function RoomDetailClient({
  room,
  dormBrand,
  overdueRows = [],
  initialPayMonth = null,
  initialBangkokYm,
  initialFocusSection = null,
  initialSection = null,
}: {
  room: DormRoomDetailJson;
  dormBrand: DormReceiptBrand;
  overdueRows?: DormOverdueRow[];
  initialPayMonth?: string | null;
  /** snapshot จาก Server Component — กัน hydration ของช่องงวด YYYY-MM */
  initialBangkokYm: string;
  initialFocusSection?: "meter" | "payment" | null;
  initialSection?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<RoomDetailTab>(() =>
    resolveInitialRoomDetailTab(initialFocusSection, initialPayMonth, initialSection),
  );

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
  /** มิเตอร์/เรียกเก็บผูก Split Bill — ห้องว่างไม่บันทึกเพราะไม่มีผู้รับยอด */
  const canManageBilling = n > 0;

  const [liveBangkokYm, setLiveBangkokYm] = useState<string | null>(null);
  useEffect(() => {
    setLiveBangkokYm(bangkokYmNow());
  }, []);
  const dashboardYm = liveBangkokYm ?? initialBangkokYm;
  const billCurrent = useMemo(
    () => room.utilityBills.find((b) => b.periodMonth === dashboardYm),
    [room.utilityBills, dashboardYm],
  );

  const overviewBillingCards = useMemo(() => {
    const cards: OverviewBillingCard[] = overdueRows.map((row) => ({
      key: `overdue-${row.tenantId}-${row.month}`,
      tenantId: row.tenantId,
      tenantName: row.tenantName,
      month: row.month,
      balance: row.balance,
      billId: row.billId,
      paymentId: row.paymentId,
      paymentStatus: row.paymentStatus,
      proofSlipUrl: row.proofSlipUrl,
      scope: "overdue" as const,
    }));

    if (!canManageBilling) return cards;

    const seen = new Set(cards.map((c) => `${c.tenantId}-${c.month}`));
    const meterNote = billCurrent
      ? `มิเตอร์น้ำ ${billCurrent.waterMeterPrev}→${billCurrent.waterMeterCurr} · ไฟ ${billCurrent.electricMeterPrev}→${billCurrent.electricMeterCurr} · ห้อง ${formatDormAmountStable(billCurrent.totalRoomAmount, 2)} บ.`
      : undefined;

    for (const t of activeTenants) {
      const dedupeKey = `${t.id}-${dashboardYm}`;
      if (seen.has(dedupeKey)) continue;

      const payment = billCurrent?.payments.find((p) => p.tenantId === Number(t.id));

      if (!billCurrent) {
        cards.push({
          key: `current-${t.id}-${dashboardYm}`,
          tenantId: t.id,
          tenantName: t.name,
          month: dashboardYm,
          balance: 0,
          billId: null,
          paymentId: null,
          paymentStatus: null,
          proofSlipUrl: null,
          scope: "current",
        });
        continue;
      }

      if (!payment) {
        cards.push({
          key: `current-${t.id}-${dashboardYm}`,
          tenantId: t.id,
          tenantName: t.name,
          month: dashboardYm,
          balance: 0,
          billId: billCurrent.id,
          paymentId: null,
          paymentStatus: null,
          proofSlipUrl: null,
          scope: "current",
          meterNote,
        });
        continue;
      }

      if (!isUnpaidStatus(payment.paymentStatus)) continue;

      cards.push({
        key: `current-${t.id}-${dashboardYm}`,
        tenantId: t.id,
        tenantName: t.name,
        month: dashboardYm,
        balance: payment.amountToPay,
        billId: billCurrent.id,
        paymentId: payment.id,
        paymentStatus: payment.paymentStatus as "PENDING" | "PAID" | "OVERDUE",
        proofSlipUrl: payment.proofSlipUrl,
        scope: "current",
        meterNote,
      });
    }

    return cards.sort((a, b) => {
      if (a.scope !== b.scope) return a.scope === "current" ? -1 : 1;
      return a.month.localeCompare(b.month);
    });
  }, [overdueRows, canManageBilling, activeTenants, dashboardYm, billCurrent]);

  const billForMonth = useMemo(
    () => room.utilityBills.find((b) => b.periodMonth === periodMonth),
    [room.utilityBills, periodMonth],
  );
  const isEditingBill = Boolean(billForMonth);
  const billForMonthPaidCount = useMemo(
    () => billForMonth?.payments.filter((p) => p.paymentStatus === "PAID").length ?? 0,
    [billForMonth],
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
    if (!canManageBilling) {
      setBillFeedback({
        ok: false,
        title: "ห้องว่าง — บันทึกมิเตอร์ไม่ได้",
        message: "ยังไม่มีผู้เข้าพักในห้องนี้ จึงไม่ทราบว่าจะแบ่งค่าไฟ/น้ำให้ใคร",
        hint: "เพิ่มผู้พักที่แถบ «ผู้พัก» ก่อน แล้วค่อยบันทึกมิเตอร์และชำระเงิน",
      });
      return;
    }
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
        title: billForMonth ? "บันทึกการแก้ไขแล้ว" : "บันทึกสำเร็จ",
        message: billForMonth
          ? "อัปเดตมิเตอร์และค่าคงที่สำหรับงวดนี้แล้ว"
          : "บันทึกมิเตอร์น้ำ / ไฟ และค่าคงที่สำหรับงวดนี้แล้ว",
        hint: billForMonth
          ? "ยอดค้างชำระจะปรับตามใหม่ — รายการที่ชำระแล้วจะไม่ถูกเปลี่ยน"
          : "เปิดแถบ «ชำระเงิน» — ออกใบแจ้งหนี้ แนบสลิป หรือกดรับชำระได้ที่นั่น",
      });
      setPayMonth(periodMonth);
      setMeterModalOpen(false);
      setTab("payment");
      const params = new URLSearchParams(searchParams.toString());
      params.set("section", "payment");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      router.refresh();
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

  const payMonthIsCurrent = payMonth === dashboardYm;

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

  function openMeterEditor(nextMonth?: string) {
    setBillFeedback(null);
    if (!canManageBilling) {
      setBillFeedback({
        ok: false,
        title: "ห้องว่าง — บันทึกมิเตอร์ไม่ได้",
        message: "ยังไม่มีผู้เข้าพักในห้องนี้ จึงไม่ทราบว่าจะแบ่งค่าไฟ/น้ำให้ใคร",
        hint: "เพิ่มผู้พักที่แถบ «ผู้พัก» ก่อน แล้วค่อยบันทึกมิเตอร์",
      });
      selectTab("tenants");
      return;
    }
    if (nextMonth) {
      setPeriodMonth(nextMonth);
    }
    setMeterModalOpen(true);
  }

  const selectTab = (next: RoomDetailTab) => {
    setMeterModalOpen(false);
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "overview") {
      params.delete("section");
    } else {
      params.set("section", next);
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  useEffect(() => {
    const fromUrl = parseRoomDetailTab(searchParams.get("section"));
    if (fromUrl) {
      setTab(fromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (initialFocusSection === "meter" && !canManageBilling) {
      selectTab("tenants");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deep link ห้องว่าง → ไปแท็บผู้พัก
  }, [initialFocusSection, canManageBilling]);

  return (
    <>
      {invoiceSheetPaymentId != null ? (
        <DormRoomInvoiceSheetModal
          paymentId={invoiceSheetPaymentId}
          roomId={room.id}
          roomNumber={room.roomNumber}
          onClose={() => setInvoiceSheetPaymentId(null)}
        />
      ) : null}

      <div className="space-y-4">
        <nav
          aria-label="เมนูรายละเอียดห้อง"
          role="tablist"
          className={cn(dormSegmentShellClass, "grid grid-cols-2 gap-1 sm:grid-cols-4")}
        >
          {(
            [
              { key: "overview" as const, label: "ภาพรวม" },
              { key: "tenants" as const, label: "ผู้พัก", count: n },
              { key: "meter" as const, label: "มิเตอร์" },
              { key: "payment" as const, label: "ชำระเงิน" },
            ] as const
          ).map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                id={`dorm-room-tab-${item.key}`}
                aria-selected={active}
                aria-controls={`dorm-room-panel-${item.key}`}
                className={roomDetailTabClass(active)}
                onClick={() => selectTab(item.key)}
              >
                <span>{item.label}</span>
                {"count" in item && item.count !== undefined ? (
                  <span
                    className={cn(
                      "tabular-nums text-[10px] font-black sm:text-xs",
                      active ? "text-white/90" : "text-[#66638c]",
                    )}
                  >
                    {item.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {tab === "overview" ? (
          <div
            role="tabpanel"
            id="dorm-room-panel-overview"
            aria-labelledby="dorm-room-tab-overview"
            className="space-y-4"
          >
            <div className="rounded-[1.25rem] border border-white/60 bg-white/40 px-3 py-3 sm:px-4">
              <p className="text-xs leading-relaxed text-[#66638c]">
                {canManageBilling
                  ? "ลำดับแนะนำ: แท็บ «ผู้พัก» → «มิเตอร์» → «ชำระเงิน»"
                  : "ห้องว่าง — ไปแท็บ «ผู้พัก» เพื่อเพิ่มผู้เข้าพักก่อนบันทึกมิเตอร์"}
              </p>
            </div>

            {overviewBillingCards.length > 0 ? (
              <section
                className="rounded-[1.25rem] border border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-white to-white p-4 sm:p-5"
                aria-label="ค้างชำระและงวดปัจจุบัน"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-amber-950">
                      ค้างชำระ & งวดปัจจุบัน
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
                      งวดปัจจุบัน — บันทึกมิเตอร์ก่อน · งวดค้าง — พิมพ์ใบแจ้งหนี้หรือแนบสลิปได้
                    </p>
                  </div>
                  {canManageBilling && billCurrent ? (
                    <button
                      type="button"
                      onClick={() => openMeterEditor(dashboardYm)}
                      className="shrink-0 rounded-xl border border-amber-300/80 bg-white px-3 py-2 text-xs font-semibold text-[#0000BF] hover:bg-amber-50/80"
                    >
                      แก้ไขมิเตอร์งวดนี้
                    </button>
                  ) : null}
                </div>
                <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {overviewBillingCards.map((row, index) => {
                    const resolvedPayment = resolveOverviewInvoicePayment(row, room.utilityBills);
                    const invoicePayment = row.scope === "overdue" ? resolvedPayment : null;
                    const needsMeterFirst = row.scope === "current" || !row.billId;
                    return (
                    <li
                      key={row.key}
                      className={cn(
                        "rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm",
                        overviewBillingCards.length % 2 === 1 &&
                          index === overviewBillingCards.length - 1 &&
                          "sm:col-span-2 lg:col-span-1",
                      )}
                    >
                      <div className="flex min-h-0 flex-col gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">{row.tenantName}</p>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
                                row.scope === "current"
                                  ? "bg-sky-50 text-sky-900 ring-sky-200/80"
                                  : "bg-amber-50 text-amber-950 ring-amber-200/80",
                              )}
                            >
                              {row.scope === "current" ? "งวดปัจจุบัน" : "ค้างชำระ"}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            งวด {formatPeriodMonthLabelStable(row.month)}{" "}
                            <span className="font-mono text-slate-400">({row.month})</span>
                          </p>
                          {row.balance > 0.005 ? (
                            <p className="mt-2 text-lg font-bold tabular-nums text-red-800">
                              {formatDormAmountStable(row.balance, 2)}{" "}
                              <span className="text-sm font-semibold">บาท</span>
                            </p>
                          ) : row.scope === "current" && !row.billId ? (
                            <p className="mt-2 text-sm font-medium text-sky-800">ยังไม่มีบิลมิเตอร์งวดนี้</p>
                          ) : null}
                          {row.meterNote ? (
                            <p className="mt-2 text-[11px] leading-relaxed text-slate-600">{row.meterNote}</p>
                          ) : null}
                        </div>
                        <div className="flex min-w-0 flex-col gap-3">
                          {needsMeterFirst ? (
                            <>
                              <p className="text-xs leading-relaxed text-amber-900">
                                {row.scope === "current"
                                  ? row.billId
                                    ? "งวดปัจจุบัน — ตรวจ/บันทึกมิเตอร์ให้ครบก่อน แล้วไปแถบ «ชำระเงิน» เพื่อออกใบแจ้งหนี้"
                                    : "ยังไม่มีบิลมิเตอร์งวดนี้ — บันทึกมิเตอร์และค่าคงที่ก่อน ระบบจะสร้างยอดแยกคนและใบแจ้งหนี้ให้"
                                  : "ยังไม่มีบิลมิเตอร์ในงวดนี้ — บันทึกมิเตอร์และค่าคงที่ก่อน ระบบจะสร้างยอดแยกคนและใบแจ้งหนี้ให้"}
                              </p>
                              <div className="flex flex-col gap-2">
                                <button
                                  type="button"
                                  className="w-full rounded-xl bg-[#0000BF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0000a3]"
                                  onClick={() => {
                                    setPayTenant(row.tenantId);
                                    setPayMonth(row.month);
                                    setPeriodMonth(row.month);
                                    setBillFeedback(null);
                                    selectTab("meter");
                                    openMeterEditor(row.month);
                                  }}
                                >
                                  {row.billId ? "แก้ไขมิเตอร์ / ค่าคงที่" : "บันทึกมิเตอร์ / ค่าคงที่"}
                                </button>
                                {row.scope === "current" && row.billId && resolvedPayment ? (
                                  <button
                                    type="button"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                                    onClick={() => {
                                      setPayTenant(row.tenantId);
                                      setPayMonth(row.month);
                                      selectTab("payment");
                                    }}
                                  >
                                    ไปแถบชำระเงิน
                                  </button>
                                ) : null}
                              </div>
                            </>
                          ) : invoicePayment ? (
                            <>
                              <div className="flex flex-col gap-2">
                                <button
                                  type="button"
                                  onClick={() => setInvoiceSheetPaymentId(invoicePayment.paymentId)}
                                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0000a3]"
                                >
                                  พิมพ์ใบแจ้งหนี้
                                </button>
                                <button
                                  type="button"
                                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                                  onClick={() => {
                                    setPayTenant(row.tenantId);
                                    setPayMonth(row.month);
                                    selectTab("payment");
                                  }}
                                >
                                  ไปแถบชำระเงิน
                                </button>
                              </div>
                              <DormPaymentProofBlock
                                paymentId={invoicePayment.paymentId}
                                initialUrl={invoicePayment.proofSlipUrl}
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
                    );
                  })}
                </ul>
              </section>
            ) : null}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={deleteRoom}
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                ลบห้อง
              </button>
            </div>
          </div>
        ) : null}

        {tab === "tenants" ? (
          <div
            role="tabpanel"
            id="dorm-room-panel-tenants"
            aria-labelledby="dorm-room-tab-tenants"
            className="rounded-[1.25rem] border border-white/60 bg-white/40 p-4 sm:p-5"
          >
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
          </div>
        ) : null}

        {tab === "meter" ? (
          <div
            role="tabpanel"
            id="dorm-room-panel-meter"
            aria-labelledby="dorm-room-tab-meter"
            className="space-y-4"
          >
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
            {!canManageBilling ? (
              <AppEmptyState className="px-4 py-8">
                <span className="block font-semibold text-slate-800">ห้องว่าง — ยังไม่บันทึกมิเตอร์</span>
                <span className="mt-2 block text-xs leading-relaxed">
                  ระบบแบ่งค่าไฟ/น้ำให้ผู้พัก ACTIVE เท่านั้น — เพิ่มผู้เข้าพักก่อน จึงจะบันทึกมิเตอร์และเรียกเก็บได้
                </span>
                <button
                  type="button"
                  onClick={() => selectTab("tenants")}
                  className="mt-4 rounded-xl bg-[#0000BF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0000a3]"
                >
                  + เพิ่มผู้พัก
                </button>
              </AppEmptyState>
            ) : null}
            <section className="rounded-[1.25rem] border border-white/60 bg-white/40 p-4 sm:p-5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-slate-900">มิเตอร์น้ำ / ไฟ &amp; ค่าคงที่</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {canManageBilling
                        ? "เลือกงวดแล้วบันทึกใหม่หรือแก้ไขมิเตอร์ที่บันทึกแล้ว — Split ให้ผู้พัก ACTIVE อัตโนมัติ"
                        : "ประวัติบิลเก่า (ถ้ามี) — ห้องว่างจึงไม่บันทึกหรือแก้ไขมิเตอร์ใหม่"}
                    </p>
                  </div>
                  <label className="block shrink-0 text-xs font-medium text-slate-600">
                    งวดที่จัดการ
                    <input
                      type="month"
                      className="mt-1 block w-full min-w-[10.5rem] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      value={periodMonth}
                      onChange={(e) => setPeriodMonth(e.target.value)}
                    />
                  </label>
                </div>

                {room.utilityBills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {room.utilityBills.map((b) => {
                      const active = b.periodMonth === periodMonth;
                      return (
                        <button
                          key={b.periodMonth}
                          type="button"
                          className={cn(
                            "inline-flex min-h-8 items-center rounded-xl px-3 py-1.5 text-xs font-bold",
                            dormFilterChipClass(active),
                          )}
                          onClick={() => setPeriodMonth(b.periodMonth)}
                        >
                          {formatPeriodMonthLabelStable(b.periodMonth)}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                <p className="text-xs text-slate-600">
                  <span className="font-medium text-slate-700">สรุปงวด {periodMonth}</span> (
                  {formatPeriodMonthLabelStable(periodMonth)}
                  {billForMonth
                    ? `) · ยอดห้อง ${formatDormAmountStable(billForMonth.totalRoomAmount, 2)} บาท`
                    : ") · ยังไม่มีบิลในงวดนี้"}
                </p>

                {billForMonth ? (
                  <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                      <p className="text-xs font-semibold text-slate-500">มิเตอร์น้ำ (ห้อง)</p>
                      <p className="mt-1 tabular-nums">
                        {billForMonth.waterMeterPrev} → {billForMonth.waterMeterCurr}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                      <p className="text-xs font-semibold text-slate-500">มิเตอร์ไฟ (ห้อง)</p>
                      <p className="mt-1 tabular-nums">
                        {billForMonth.electricMeterPrev} → {billForMonth.electricMeterCurr}
                      </p>
                    </div>
                  </div>
                ) : null}

                {billForMonthPaidCount > 0 ? (
                  <p className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs leading-relaxed text-amber-950">
                    งวดนี้มี {billForMonthPaidCount} รายการชำระแล้ว — แก้ไขมิเตอร์จะอัปเดตยอดค้างชำระเท่านั้น ไม่เปลี่ยนยอดที่รับชำระแล้ว
                  </p>
                ) : null}

                {canManageBilling ? (
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openMeterEditor(periodMonth)}
                      className="rounded-lg bg-[#0000BF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0000a6]"
                    >
                      {isEditingBill ? "แก้ไขมิเตอร์ / ค่าคงที่" : "บันทึกมิเตอร์ / ค่าคงที่"}
                    </button>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}

        {tab === "payment" ? (
          <div
            role="tabpanel"
            id="dorm-room-panel-payment"
            aria-labelledby="dorm-room-tab-payment"
          >
      {!canManageBilling ? (
        <AppEmptyState className="px-4 py-10">
          <span className="block font-semibold text-slate-800">ห้องว่าง — ยังไม่เรียกเก็บเงิน</span>
          <span className="mt-2 block text-xs leading-relaxed">
            ต้องมีผู้เข้าพัก ACTIVE ก่อน จึงจะออกใบแจ้งหนี้และรับชำระค่าเช่า/ไฟ/น้ำได้
          </span>
          <button
            type="button"
            onClick={() => selectTab("tenants")}
            className="mt-4 rounded-xl bg-[#0000BF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0000a3]"
          >
            + เพิ่มผู้พัก
          </button>
        </AppEmptyState>
      ) : (
      <section
        id="dorm-record-payment"
        className="overflow-hidden rounded-[1.25rem] border border-white/60 bg-white/40"
      >
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">บันทึกการชำระเงิน</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500">
            เลือกผู้เข้าพักและงวดที่บันทึกมิเตอร์แล้ว — พิมพ์ใบแจ้งหนี้ให้ผู้พักสแกนพร้อมเพย์และแนบสลิป จากนั้นตรวจสลิปแล้วกดรับชำระ
            ถ้างวดนั้นยังไม่มีบิล ให้บันทึกมิเตอร์ที่แถบ «มิเตอร์» ก่อน แล้วยอดจะขึ้นที่นี่
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

          {payMonthIsCurrent && !billForPay ? (
            <div className="rounded-2xl border border-sky-200/90 bg-sky-50/80 p-4 sm:p-5">
              <p className="text-sm font-semibold text-sky-950">งวดปัจจุบันยังไม่มีบิลมิเตอร์</p>
              <p className="mt-1 text-xs leading-relaxed text-sky-900/85">
                บันทึกมิเตอร์และค่าคงที่ก่อน — หลังมีบิลแล้วจึงออกใบแจ้งหนี้และรับชำระได้ที่แถบนี้
              </p>
              <button
                type="button"
                className="mt-3 inline-flex min-h-[44px] items-center rounded-xl bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0000a6]"
                onClick={() => {
                  setPeriodMonth(payMonth);
                  setBillFeedback(null);
                  selectTab("meter");
                  openMeterEditor(payMonth);
                }}
              >
                บันทึกมิเตอร์ / ค่าคงที่
              </button>
            </div>
          ) : null}

          {pendingForTenant && billForPay ? (
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
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <DormReceiptPrintIconButton
                        defaultPaperSize={dormBrand.defaultPaperSize}
                        data={{
                          dormTitle: dormBrand.dormTitle,
                          logoUrl: dormBrand.logoUrl,
                          taxId: dormBrand.taxId,
                          address: dormBrand.address,
                          caretakerPhone: dormBrand.caretakerPhone,
                          roomNumber: room.roomNumber,
                          tenantName: tn,
                          periodMonth: p.periodMonth,
                          amountBaht: p.amountToPay,
                          paidAtIso: p.paidAt,
                          receiptNumber: p.receiptNumber,
                          note: p.note,
                        }}
                      />
                      <Link
                        href={`/dashboard/dormitory/receipt/${p.id}`}
                        target="_blank"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xs font-semibold text-[#0000BF] transition hover:bg-[#0000BF]/5"
                      >
                        เปิดใบเสร็จ
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
      )}
          </div>
        ) : null}
      </div>

      <DormCenteredModal
        open={tenantModalOpen}
        onClose={() => setTenantModalOpen(false)}
        title="เพิ่มผู้เข้าพัก"
        titleId="dorm-tenant-modal-title"
        description={`ห้อง ${room.roomNumber} · เหลือที่ว่าง ${room.maxOccupants - n} คน`}
      >
        <form onSubmit={addTenant} className="grid gap-3">
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
      </DormCenteredModal>

      <DormCenteredModal
        open={meterModalOpen}
        onClose={() => setMeterModalOpen(false)}
        title={isEditingBill ? "แก้ไขมิเตอร์น้ำ / ไฟ & ค่าคงที่" : "บันทึกมิเตอร์น้ำ / ไฟ & ค่าคงที่"}
        titleId="dorm-meter-modal-title"
        description={
          isEditingBill
            ? "แก้ไขเลขมิเตอร์ ราคาต่อหน่วย หรือค่าคงที่ — แล้วกดบันทึกการแก้ไข"
            : "เลือกงวด กรอกมิเตอร์และราคาต่อหน่วย แล้วบันทึก — Split ต่อคนอัตโนมัติ"
        }
        size="lg"
      >
        <form onSubmit={saveBill} className="space-y-4">
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
                  {loadingBill ? "กำลังบันทึก…" : isEditingBill ? "บันทึกการแก้ไข" : "บันทึกบิลงวดนี้"}
                </button>
              </div>
            </form>
      </DormCenteredModal>
    </>
  );
}
