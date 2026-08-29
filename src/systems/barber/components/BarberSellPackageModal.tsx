"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { BarberModalPortal } from "@/systems/barber/components/BarberModalPortal";
import { BarberPaymentPanel } from "@/systems/barber/components/BarberPaymentPanel";
import {
  BarberTaxInvoiceFields,
  emptyBarberTaxInvoiceForm,
  type BarberTaxInvoiceFormValue,
} from "@/systems/barber/components/BarberTaxInvoiceFields";
import type { BarberPaymentMethod } from "@/systems/barber/lib/payment-method";
import {
  barberCardSurfaceRadiusClass,
  barberModalBackdropClass,
  barberModalCloseBtnClass,
  barberModalHeaderClass,
  barberModalPanelLgClass,
  barberModalSubtitleClass,
  barberModalTitleClass,
  barberOffersListRowCardClass,
} from "@/systems/barber/components/barber-ui-tokens";

export type BarberSellPackagePkg = {
  id: number;
  name: string;
  price: number;
  totalSessions: number;
  imageUrl?: string | null;
};

type StylistBrief = { id: number; name: string };

export type BarberSellPackageModalProps = {
  open: boolean;
  onClose: () => void;
  /** หลังบันทึกสำเร็จ — ปิดโมดัลเป็นหน้าที่ parent */
  onSuccess?: (result: {
    subscriptionId?: number;
    warning?: string | null;
    /** URL โหลดสลิปในรายการ (จาก API หลังบันทึกสำเร็จ) */
    saleReceiptImageUrl?: string | null;
  }) => void;
  /**
   * หน้าเช็กอิน: ส่ง stylist จากแถบบนหน้า (ไม่แสดง dropdown ในโมดัล)
   * ไม่ส่ง = โมดัลโหลดรายช่างเองและมี dropdown ในโมดัล
   */
  externalStylistId?: string;
  /** หน้าเช็กอิน: ส่งแพ็กที่โหลดแล้ว — ไม่ส่ง = โมดัลโหลดเองตอนเปิด */
  packagesFromParent?: BarberSellPackagePkg[];
};

const SELL_PKG_THEMES = [
  {
    shell: "border-violet-200/70 bg-gradient-to-br from-white via-violet-50/40 to-fuchsia-50/40",
    accent: "from-violet-500 via-indigo-500 to-fuchsia-500",
    glow: "bg-violet-300/35",
    placeholder: "from-violet-200 via-indigo-100 to-fuchsia-200",
  },
  {
    shell: "border-teal-200/70 bg-gradient-to-br from-white via-emerald-50/45 to-cyan-50/40",
    accent: "from-teal-500 via-emerald-500 to-cyan-500",
    glow: "bg-teal-300/35",
    placeholder: "from-teal-200 via-emerald-100 to-cyan-200",
  },
  {
    shell: "border-amber-200/70 bg-gradient-to-br from-white via-amber-50/45 to-orange-50/40",
    accent: "from-amber-500 via-orange-500 to-rose-500",
    glow: "bg-amber-300/35",
    placeholder: "from-amber-200 via-orange-100 to-rose-200",
  },
  {
    shell: "border-sky-200/70 bg-gradient-to-br from-white via-sky-50/45 to-indigo-50/40",
    accent: "from-sky-500 via-blue-500 to-indigo-500",
    glow: "bg-sky-300/35",
    placeholder: "from-sky-200 via-blue-100 to-indigo-200",
  },
] as const;

export function BarberSellPackageModal({
  open,
  onClose,
  onSuccess,
  externalStylistId,
  packagesFromParent,
}: BarberSellPackageModalProps) {
  const [packages, setPackages] = useState<BarberSellPackagePkg[]>(packagesFromParent ?? []);
  const [stylists, setStylists] = useState<StylistBrief[]>([]);
  const [internalStylistId, setInternalStylistId] = useState("");
  const [sellPkg, setSellPkg] = useState("");
  const [sellPhone, setSellPhone] = useState("");
  const [sellName, setSellName] = useState("");
  const [sellLoading, setSellLoading] = useState(false);
  const [sellFormErr, setSellFormErr] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<BarberPaymentMethod>("CASH");
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [taxForm, setTaxForm] = useState<BarberTaxInvoiceFormValue>(emptyBarberTaxInvoiceForm);

  useEffect(() => {
    if (packagesFromParent && packagesFromParent.length > 0) {
      setPackages(packagesFromParent);
    }
  }, [packagesFromParent]);

  useEffect(() => {
    if (!open) return;
    if (packagesFromParent && packagesFromParent.length > 0) return;
    void fetch("/api/barber/packages")
      .then((r) => r.json())
      .then((d: { packages?: BarberSellPackagePkg[] }) => setPackages(d.packages ?? []))
      .catch(() => {});
  }, [open, packagesFromParent]);

  useEffect(() => {
    if (!open || externalStylistId !== undefined) return;
    void fetch("/api/barber/stylists")
      .then((r) => r.json())
      .then((d: { stylists?: StylistBrief[] }) => setStylists(d.stylists ?? []))
      .catch(() => {});
  }, [open, externalStylistId]);

  useEffect(() => {
    if (!open) return;
    setSellFormErr(null);
    setSellPkg("");
    setSellPhone("");
    setSellName("");
    setPaymentMethod("CASH");
    setSlipUrl(null);
    setInternalStylistId("");
    setTaxForm(emptyBarberTaxInvoiceForm());
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

  const pkgList = packagesFromParent && packagesFromParent.length > 0 ? packagesFromParent : packages;
  const selectedPkg = useMemo(
    () => pkgList.find((p) => String(p.id) === sellPkg) ?? null,
    [pkgList, sellPkg],
  );
  const amountBaht = selectedPkg?.price ?? 0;
  const showInternalStylist = externalStylistId === undefined;

  async function onSell(e: React.FormEvent) {
    e.preventDefault();
    setSellFormErr(null);
    const pkgId = Number(sellPkg);
    const digits = sellPhone.replace(/\D/g, "");
    if (!Number.isInteger(pkgId) || pkgId < 1 || digits.length < 9) {
      setSellFormErr("เลือกแพ็กเกจและกรอกเบอร์ลูกค้า");
      return;
    }
    setSellLoading(true);
    try {
      const receiptImageUrl =
        paymentMethod === "CASH" || paymentMethod === "CREDIT_CARD" ? undefined : slipUrl ?? undefined;
      const sidFromPage = externalStylistId !== undefined ? externalStylistId : internalStylistId;
      const sidSell = sidFromPage ? Number(sidFromPage) : null;
      const res = await fetch("/api/barber/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          packageId: pkgId,
          phone: digits,
          name: sellName.trim() || null,
          paymentMethod,
          ...(sidSell != null && Number.isInteger(sidSell) && sidSell > 0 ? { stylistId: sidSell } : {}),
          ...(receiptImageUrl ? { receiptImageUrl } : {}),
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
        warning?: string;
        subscription?: { id: number; saleReceiptImageUrl?: string | null };
      };
      if (!res.ok) {
        setSellFormErr(data.error ?? "ขายแพ็กไม่สำเร็จ");
        return;
      }
      setSlipUrl(null);
      onSuccess?.({
        subscriptionId: data.subscription?.id,
        warning: data.warning?.trim() ?? null,
        saleReceiptImageUrl: data.subscription?.saleReceiptImageUrl ?? null,
      });
      onClose();
    } finally {
      setSellLoading(false);
    }
  }

  if (!open) return null;

  return (
    <BarberModalPortal>
      <div
        className={barberModalBackdropClass}
        role="presentation"
        onClick={() => {
          setSlipUrl(null);
          onClose();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="barber-sell-modal-title"
          className={barberModalPanelLgClass}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={barberModalHeaderClass}>
            <div className="min-w-0">
              <h2 id="barber-sell-modal-title" className={barberModalTitleClass}>
                ขายแพ็กเกจให้ลูกค้า
              </h2>
              <p className={barberModalSubtitleClass}>เลือกแพ็กเกจ กรอกเบอร์ และช่องทางชำระ</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSlipUrl(null);
                onClose();
              }}
              className={barberModalCloseBtnClass}
              aria-label="ปิด"
            >
              ✕
            </button>
          </div>
          <form onSubmit={(e) => void onSell(e)} className="grid gap-3 px-5 py-5">
            {sellFormErr ? (
              <p className="rounded-[1.25rem] bg-red-50 px-3 py-2 text-sm text-red-800">{sellFormErr}</p>
            ) : null}
            {showInternalStylist ? (
              <div>
                <label htmlFor="barber-sell-modal-stylist" className="text-sm font-semibold text-[#4d47b6]">
                  ช่างที่บันทึกการขาย (ไม่บังคับ)
                </label>
                <select
                  id="barber-sell-modal-stylist"
                  className="app-input mt-1 min-h-[48px] w-full rounded-[1.25rem] border border-slate-200 px-3 text-base"
                  value={internalStylistId}
                  onChange={(e) => setInternalStylistId(e.target.value)}
                >
                  <option value="">— ไม่ระบุช่าง —</option>
                  {stylists.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <fieldset className="min-w-0 space-y-2">
              <legend className="text-sm font-semibold text-[#4d47b6]">เลือกแพ็กเกจ</legend>
              {pkgList.length === 0 ? (
                <p className="rounded-[1.25rem] border border-dashed border-[#d4cff7]/75 bg-[#faf9ff]/80 px-3 py-6 text-center text-sm text-[#66638c]">
                  ยังไม่มีแพ็กเกจ — ไปเพิ่มที่การจัดการ → แพ็กเกจก่อน
                </p>
              ) : (
                <ul className="grid max-h-[min(40vh,22rem)] grid-cols-1 gap-2 overflow-y-auto pr-0.5 sm:grid-cols-2">
                  {pkgList.map((p, index) => {
                    const theme = SELL_PKG_THEMES[index % SELL_PKG_THEMES.length]!;
                    const selected = sellPkg === String(p.id);
                    const img = p.imageUrl?.trim() || null;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => setSellPkg(String(p.id))}
                          aria-pressed={selected}
                          className={cn(
                            barberOffersListRowCardClass,
                            "group/item relative w-full overflow-hidden !px-3 py-2.5 text-left transition",
                            theme.shell,
                            selected && "ring-2 ring-[#5b61ff]/55 shadow-[0_10px_28px_-16px_rgba(91,97,255,0.45)]",
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "pointer-events-none absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-gradient-to-b opacity-90",
                              theme.accent,
                            )}
                          />
                          <span
                            aria-hidden
                            className={cn(
                              "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-70",
                              theme.glow,
                            )}
                          />
                          <div className="relative flex min-w-0 gap-2.5 pl-2">
                            <span
                              className={cn(
                                "h-14 w-14 shrink-0 overflow-hidden rounded-[1rem] ring-2 ring-white/90 shadow-md",
                                !img && "flex items-center justify-center bg-gradient-to-br",
                                !img && theme.placeholder,
                              )}
                            >
                              {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={img} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-sm font-black text-[#4d47b6]/70">
                                  {p.name.trim().charAt(0) || "P"}
                                </span>
                              )}
                            </span>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-start justify-between gap-1.5">
                                <p className="truncate text-sm font-black leading-snug text-[#1e1b4b]">{p.name}</p>
                                {selected ? (
                                  <span className="shrink-0 rounded-full bg-[#5b61ff] px-1.5 py-px text-[10px] font-bold text-white">
                                    เลือกแล้ว
                                  </span>
                                ) : null}
                              </div>
                              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                                <p className="text-sm font-black tabular-nums text-[#1e1b4b]">
                                  <span className="mr-0.5 text-[10px] font-bold text-[#8b87ad]">฿</span>
                                  {p.price.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                                </p>
                                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold text-[#4d47b6] ring-1 ring-[#e8e6f4]/90">
                                  {p.totalSessions} ครั้ง
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {/* ให้ required ของฟอร์มยังทำงาน */}
              <input type="hidden" value={sellPkg} required readOnly aria-hidden tabIndex={-1} />
            </fieldset>

            <input
              className="min-h-[48px] rounded-[1.25rem] border border-slate-200 px-3 text-base"
              placeholder="เบอร์ลูกค้า"
              inputMode="numeric"
              value={sellPhone}
              onChange={(e) => setSellPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
            />
            <input
              className="min-h-[48px] rounded-[1.25rem] border border-slate-200 px-3 text-base"
              placeholder="ชื่อลูกค้า (ไม่บังคับ)"
              value={sellName}
              onChange={(e) => setSellName(e.target.value)}
            />
            <BarberTaxInvoiceFields
              value={taxForm}
              onChange={setTaxForm}
              fallbackName={sellName}
              disabled={sellLoading}
            />
            <BarberPaymentPanel
              amountBaht={amountBaht}
              method={paymentMethod}
              slipUrl={slipUrl}
              onMethodChange={setPaymentMethod}
              onSlipUrlChange={setSlipUrl}
              disabled={sellLoading}
            />
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setSlipUrl(null);
                  onClose();
                }}
                className={`min-h-[48px] ${barberCardSurfaceRadiusClass} border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50`}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={sellLoading || pkgList.length === 0 || !sellPkg}
                className={`app-btn-primary min-h-[48px] ${barberCardSurfaceRadiusClass} px-4 py-3 text-sm font-semibold text-white disabled:opacity-50`}
              >
                {sellLoading ? "…" : "เปิดแพ็กเกจ"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </BarberModalPortal>
  );
}
