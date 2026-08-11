"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarberModalPortal } from "@/systems/barber/components/BarberModalPortal";
import { BarberPaymentPanel } from "@/systems/barber/components/BarberPaymentPanel";
import {
  BarberTaxInvoiceFields,
  emptyBarberTaxInvoiceForm,
  type BarberTaxInvoiceFormValue,
} from "@/systems/barber/components/BarberTaxInvoiceFields";
import { cn } from "@/lib/cn";
import { isValidThaiId13 } from "@/lib/thai-tax-id";
import type { BarberPaymentMethod } from "@/systems/barber/lib/payment-method";
import {
  printBarberMemberDocs,
  type BarberPrintShopProfile,
} from "@/systems/barber/lib/barber-print-docs";
import {
  DEFAULT_BARBER_PAY_AMOUNT_PRESETS,
  parseBarberPayAmountPresets,
} from "@/systems/barber/lib/pay-amount-presets";
import {
  barberCardSurfaceRadiusClass,
  barberModalBackdropClass,
  barberModalCloseBtnClass,
  barberModalHeaderClass,
  barberModalPanelLgClass,
  barberModalSubtitleClass,
  barberModalTitleClass,
  barberPaymentChipActiveClass,
  barberPaymentChipIdleClass,
} from "@/systems/barber/components/barber-ui-tokens";

type SubRow = {
  id: number;
  remainingSessions: number;
  status: string;
  packageName: string;
  packageId: number;
};

type StylistBrief = { id: number; name: string };

export type BarberQueueCheckInSeed = {
  phone?: string;
  customerName?: string | null;
  bookingId?: number | null;
};

type Props = {
  open: boolean;
  seed: BarberQueueCheckInSeed | null;
  onClose: () => void;
  /** หลังเช็กอินสำเร็จ — อัปเดตรายการคิว / refresh */
  onSuccess?: (result: {
    mode: "PACKAGE_USE" | "CASH_WALK_IN";
    bookingId: number | null;
    phone: string;
  }) => void;
};

export function BarberQueueCheckInModal({ open, seed, onClose, onSuccess }: Props) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [lookedUp, setLookedUp] = useState(false);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [stylists, setStylists] = useState<StylistBrief[]>([]);
  const [stylistId, setStylistId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<BarberPaymentMethod>("CASH");
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [taxForm, setTaxForm] = useState<BarberTaxInvoiceFormValue>(() => emptyBarberTaxInvoiceForm());
  const [printReceipt, setPrintReceipt] = useState(true);
  const [printTaxInvoice, setPrintTaxInvoice] = useState(false);
  const [shopPrintProfile, setShopPrintProfile] = useState<BarberPrintShopProfile | null>(null);
  const [payPresets, setPayPresets] = useState<number[]>([...DEFAULT_BARBER_PAY_AMOUNT_PRESETS]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const amountBaht = useMemo(() => {
    const raw = amount.trim().replace(/,/g, "");
    if (!raw) return 0;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.round(n * 100) / 100;
  }, [amount]);

  const hasPackage = subs.length > 0;

  const resetPayment = useCallback(() => {
    setPaymentMethod("CASH");
    setSlipUrl(null);
    setAmount("");
    setNote("");
    setTaxForm(emptyBarberTaxInvoiceForm());
    setPrintReceipt(true);
    setPrintTaxInvoice(false);
  }, []);

  const lookup = useCallback(async (digits: string) => {
    setLoadingLookup(true);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/barber/customers/search?phone=${encodeURIComponent(digits)}`, {
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        customer?: { id: number; name: string | null; phone: string } | null;
        subscriptions?: SubRow[];
        error?: string;
      };
      if (!res.ok) {
        setErr(data.error ?? "ค้นหาไม่สำเร็จ");
        setSubs([]);
        setSelectedSubId(null);
        setLookedUp(true);
        return;
      }
      if (data.customer?.name?.trim()) {
        setName((prev) => prev.trim() || data.customer!.name!.trim());
      }
      const nextSubs = data.subscriptions ?? [];
      setSubs(nextSubs);
      setSelectedSubId(nextSubs[0]?.id ?? null);
      setLookedUp(true);
      if (nextSubs.length > 0) {
        setInfo(`พบสมาชิกแพ็ก ${nextSubs.length} รายการ — หักครั้งได้`);
      } else if (data.customer) {
        setInfo("พบลูกค้าในระบบ แต่ไม่มีแพ็กใช้งาน — รับชำระแล้วบันทึก");
      } else {
        setInfo("ยังไม่มีในระบบ — กรอกยอดชำระแล้วบันทึกเป็น walk-in");
      }
    } finally {
      setLoadingLookup(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !seed) return;
    const digits = (seed.phone ?? "").replace(/\D/g, "").slice(0, 15);
    setPhone(digits);
    setName(seed.customerName?.trim() || "");
    setBookingId(seed.bookingId ?? null);
    setSubs([]);
    setSelectedSubId(null);
    setLookedUp(false);
    setErr(null);
    setInfo(null);
    resetPayment();
    if (digits.length >= 9) {
      void lookup(digits);
    }
    // seed identity only when modal opens / seed changes
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open+seed phone/booking drive reset
  }, [open, seed?.phone, seed?.bookingId, seed?.customerName, lookup, resetPayment]);

  useEffect(() => {
    if (!open) return;
    void fetch("/api/barber/stylists", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { stylists?: StylistBrief[] }) => setStylists(d.stylists ?? []))
      .catch(() => {});
    void fetch("/api/barber/shop-profile", { credentials: "include" })
      .then((r) => r.json())
      .then(
        (d: {
          profile?: BarberPrintShopProfile & {
            payAmountPresets?: number[];
            payAmountPresetsRaw?: string;
          };
        }) => {
          const p = d.profile;
          if (!p) return;
          setShopPrintProfile(p);
          setPayPresets(
            p.payAmountPresets && p.payAmountPresets.length > 0
              ? p.payAmountPresets
              : parseBarberPayAmountPresets(p.payAmountPresetsRaw),
          );
        },
      )
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  async function markBookingArrived(id: number) {
    const res = await fetch(`/api/barber/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: "ARRIVED" }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(j.error ?? "อัปเดตสถานะคิวไม่สำเร็จ");
    }
  }

  async function onDeduct() {
    setErr(null);
    if (!selectedSubId) {
      setErr("เลือกแพ็กเกจที่จะหัก");
      return;
    }
    setBusy(true);
    try {
      const sid = stylistId ? Number(stylistId) : null;
      const res = await fetch("/api/barber/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          subscriptionId: selectedSubId,
          ...(sid != null && Number.isInteger(sid) && sid > 0 ? { stylistId: sid } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        remainingSessions?: number;
        status?: string;
      };
      if (!res.ok) {
        setErr(data.error ?? "หักแพ็กไม่สำเร็จ");
        return;
      }
      if (bookingId != null) {
        await markBookingArrived(bookingId);
      }
      onSuccess?.({ mode: "PACKAGE_USE", bookingId, phone });
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function onCashPay() {
    setErr(null);
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setErr("กรอกเบอร์อย่างน้อย 9 หลัก");
      return;
    }
    if (amountBaht <= 0) {
      setErr("กรอกหรือเลือกยอดชำระ");
      return;
    }
    if (printTaxInvoice || taxForm.taxInvoiceEnabled) {
      if (taxForm.billingName.trim().length < 2) {
        setErr("กรอกชื่อในใบกำกับภาษี");
        return;
      }
      if (!isValidThaiId13(taxForm.taxId)) {
        setErr("เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลักและถูกต้อง");
        return;
      }
      if (taxForm.taxAddress.trim().length < 8) {
        setErr("กรอกที่อยู่ในใบกำกับภาษีให้ครบ");
        return;
      }
    }
    setBusy(true);
    try {
      const receiptImageUrl =
        paymentMethod === "CASH" || paymentMethod === "CREDIT_CARD" ? null : slipUrl;
      const sid = stylistId ? Number(stylistId) : null;
      const res = await fetch("/api/barber/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          visitType: "CASH_WALK_IN",
          phone: digits,
          name: name.trim() || null,
          note: note.trim() || null,
          amountBaht,
          paymentMethod,
          ...(receiptImageUrl ? { receiptImageUrl } : {}),
          ...(sid != null && Number.isInteger(sid) && sid > 0 ? { stylistId: sid } : {}),
          taxInvoiceEnabled: taxForm.taxInvoiceEnabled,
          ...(taxForm.taxInvoiceEnabled
            ? {
                billingName: taxForm.billingName.trim() || null,
                taxId: taxForm.taxId.trim() || null,
                taxAddress: taxForm.taxAddress.trim() || null,
                taxBranch: taxForm.taxBranch.trim() || null,
              }
            : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        serviceLogId?: number;
        customer?: {
          phone: string;
          name: string | null;
          billingName?: string;
          taxId?: string;
          taxAddress?: string;
          taxBranch?: string;
        };
      };
      if (!res.ok) {
        setErr(data.error ?? "บันทึกชำระไม่สำเร็จ");
        return;
      }
      if (bookingId != null) {
        await markBookingArrived(bookingId);
      }

      if ((printReceipt || printTaxInvoice) && amountBaht > 0) {
        const billingName =
          (taxForm.billingName || data.customer?.billingName || name || digits).trim() || digits;
        printBarberMemberDocs({
          receipt: printReceipt,
          taxInvoice: printTaxInvoice,
          data: {
            shop: shopPrintProfile ?? { displayName: "ร้านตัดผม", slipPaperSize: "SLIP_58" },
            customerName: printTaxInvoice ? billingName : name.trim() || billingName,
            customerPhone: digits,
            customerAddress: printTaxInvoice ? taxForm.taxAddress.trim() : null,
            customerTaxId: printTaxInvoice ? taxForm.taxId.trim() : null,
            packageName: note.trim() || "บริการตัดผม",
            totalSessions: 0,
            remainingSessions: 0,
            priceBaht: amountBaht,
            paymentMethod,
            soldAtIso: new Date().toISOString(),
            docNo: data.serviceLogId != null ? `CW-${data.serviceLogId}` : undefined,
            note: taxForm.taxBranch.trim() ? `สาขา ${taxForm.taxBranch.trim()}` : null,
          },
        });
      }

      onSuccess?.({ mode: "CASH_WALK_IN", bookingId, phone: digits });
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <BarberModalPortal>
      <div className={barberModalBackdropClass} role="presentation" onClick={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="barber-queue-checkin-title"
          className={barberModalPanelLgClass}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={barberModalHeaderClass}>
            <div className="min-w-0">
              <h2 id="barber-queue-checkin-title" className={barberModalTitleClass}>
                เช็กอิน
              </h2>
              <p className={barberModalSubtitleClass}>
                {bookingId != null
                  ? "ลิงก์คิว · สมาชิกหักแพ็ก · ไม่ใช่สมาชิกรับชำระ"
                  : "Walk-in ไม่จอง · สมาชิกหักแพ็ก · ไม่ใช่สมาชิกรับชำระ"}
              </p>
            </div>
            <button type="button" onClick={onClose} className={barberModalCloseBtnClass} aria-label="ปิด">
              ✕
            </button>
          </div>

          <div className="grid max-h-[min(78vh,44rem)] gap-3 overflow-y-auto px-5 py-5">
            {err ? (
              <p className="rounded-[1.25rem] bg-red-50 px-3 py-2 text-sm text-red-800">{err}</p>
            ) : null}
            {info ? (
              <p className="rounded-[1.25rem] bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{info}</p>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="block min-w-0 flex-1 text-xs font-bold text-[#4d47b6]">
                เบอร์โทร
                <input
                  className="app-input mt-1 min-h-[48px] w-full rounded-[1.25rem] px-3 text-base tabular-nums"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 15));
                    setLookedUp(false);
                    setSubs([]);
                    setSelectedSubId(null);
                  }}
                  placeholder="0812345678"
                />
              </label>
              <button
                type="button"
                disabled={loadingLookup || phone.replace(/\D/g, "").length < 9}
                onClick={() => void lookup(phone.replace(/\D/g, ""))}
                className={`app-btn-soft min-h-[48px] shrink-0 ${barberCardSurfaceRadiusClass} px-4 text-sm font-semibold disabled:opacity-50`}
              >
                {loadingLookup ? "กำลังลิงก์…" : "ลิงก์ข้อมูล"}
              </button>
            </div>

            <label className="block text-xs font-bold text-[#4d47b6]">
              ชื่อ (ไม่บังคับ)
              <input
                className="app-input mt-1 min-h-[48px] w-full rounded-[1.25rem] px-3 text-base"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 100))}
                placeholder="ชื่อลูกค้า"
              />
            </label>

            {stylists.length > 0 ? (
              <label className="block text-xs font-bold text-[#4d47b6]">
                ช่างที่บันทึก
                <select
                  className="app-input mt-1 min-h-[48px] w-full rounded-[1.25rem] px-3 text-sm"
                  value={stylistId}
                  onChange={(e) => setStylistId(e.target.value)}
                >
                  <option value="">— ไม่ระบุ —</option>
                  {stylists.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {lookedUp && hasPackage ? (
              <div className="space-y-3 rounded-[1.25rem] border border-emerald-200/80 bg-emerald-50/50 p-3">
                <p className="text-sm font-black text-emerald-950">สมาชิกแพ็กเกจ</p>
                <ul className="space-y-2">
                  {subs.map((s) => {
                    const active = selectedSubId === s.id;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedSubId(s.id)}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-[1rem] border px-3 py-2.5 text-left transition",
                            active
                              ? "border-emerald-400 bg-white ring-1 ring-emerald-300"
                              : "border-emerald-100 bg-white/70 hover:bg-white",
                          )}
                          aria-pressed={active}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-[#1e1b4b]">
                              {s.packageName}
                            </span>
                            <span className="text-[11px] font-semibold text-[#66638c]">
                              เหลือ {s.remainingSessions} ครั้ง
                            </span>
                          </span>
                          {active ? (
                            <span className="shrink-0 text-[11px] font-black text-emerald-700">เลือก</span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <button
                  type="button"
                  disabled={busy || !selectedSubId}
                  onClick={() => void onDeduct()}
                  className="app-btn-primary min-h-[48px] w-full rounded-[1.25rem] text-sm font-bold disabled:opacity-60"
                >
                  {busy ? "กำลังหัก…" : "หัก 1 ครั้งจากแพ็ก + เช็กอิน"}
                </button>
              </div>
            ) : null}

            {lookedUp && !hasPackage ? (
              <div className="space-y-3 rounded-[1.25rem] border border-amber-200/80 bg-amber-50/40 p-3">
                <p className="text-sm font-black text-amber-950">รับชำระ (ไม่ใช่สมาชิกแพ็ก)</p>
                {payPresets.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label="ปุ่มลัดยอด">
                    {payPresets.map((n) => {
                      const active = amountBaht === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          disabled={busy}
                          className={cn(
                            active ? barberPaymentChipActiveClass : barberPaymentChipIdleClass,
                            "tabular-nums",
                          )}
                          aria-pressed={active}
                          onClick={() => setAmount(String(n))}
                        >
                          ฿{n.toLocaleString("th-TH")}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                <label className="block text-[11px] font-bold text-[#4d47b6]">
                  กรอกจำนวนเอง
                  <input
                    className="app-input mt-1 min-h-[48px] w-full rounded-[1.25rem] bg-white px-3 text-base"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                  />
                </label>
                <label className="block text-[11px] font-bold text-[#4d47b6]">
                  หมายเหตุ (ไม่บังคับ)
                  <input
                    className="app-input mt-1 min-h-[44px] w-full rounded-[1.25rem] bg-white px-3 text-sm"
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 255))}
                    placeholder="เช่น ตัดผม / ย้อม"
                  />
                </label>
                <BarberPaymentPanel
                  amountBaht={amountBaht}
                  method={paymentMethod}
                  slipUrl={slipUrl}
                  onMethodChange={setPaymentMethod}
                  onSlipUrlChange={setSlipUrl}
                  disabled={busy}
                />

                <BarberTaxInvoiceFields
                  value={taxForm}
                  onChange={(next) => {
                    setTaxForm(next);
                    if (next.taxInvoiceEnabled) setPrintTaxInvoice(true);
                  }}
                  fallbackName={name}
                  disabled={busy}
                />

                <div className="space-y-2 rounded-[1.25rem] border border-[#ecebff] bg-white/80 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    พิมพ์หลังบันทึก
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label
                      className={cn(
                        "flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-sm font-bold transition",
                        printReceipt
                          ? "border-[#5b61ff]/45 bg-[#ecebff]/70 text-[#1e1b4b]"
                          : "border-white/60 bg-white/55 text-slate-700",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#5b61ff]"
                        checked={printReceipt}
                        disabled={busy}
                        onChange={(e) => setPrintReceipt(e.target.checked)}
                      />
                      ใบเสร็จ
                    </label>
                    <label
                      className={cn(
                        "flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-sm font-bold transition",
                        printTaxInvoice
                          ? "border-[#5b61ff]/45 bg-[#ecebff]/70 text-[#1e1b4b]"
                          : "border-white/60 bg-white/55 text-slate-700",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#5b61ff]"
                        checked={printTaxInvoice}
                        disabled={busy}
                        onChange={(e) => {
                          const on = e.target.checked;
                          setPrintTaxInvoice(on);
                          if (on && !taxForm.taxInvoiceEnabled) {
                            setTaxForm((prev) => ({
                              ...prev,
                              taxInvoiceEnabled: true,
                              billingName: prev.billingName.trim() || name.trim(),
                            }));
                          }
                        }}
                      />
                      ใบกำกับภาษี
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={busy || amountBaht <= 0}
                  onClick={() => void onCashPay()}
                  className="min-h-[48px] w-full rounded-[1.25rem] border-2 border-amber-400 bg-amber-50 text-sm font-bold text-amber-950 disabled:opacity-60"
                >
                  {busy ? "กำลังบันทึก…" : "ชำระ + บันทึกเช็กอิน"}
                </button>
              </div>
            ) : null}

            {!lookedUp && !loadingLookup ? (
              <p className="text-center text-xs font-semibold text-[#8b87ad]">
                กด «ลิงก์ข้อมูล» เพื่อดึงแพ็กเกจหรือเปิดฟอร์มรับชำระ
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </BarberModalPortal>
  );
}
