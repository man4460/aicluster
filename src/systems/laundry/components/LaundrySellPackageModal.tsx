"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  laundryCardSurfaceRadiusClass,
  laundryModalBackdropClass,
  laundryModalCloseBtnClass,
  laundryModalHeaderClass,
  laundryModalPanelLgClass,
  laundryModalSubtitleClass,
  laundryModalTitleClass,
  laundryOffersListRowCardClass,
  laundryOutlineButtonClass,
  laundryFieldClass,
  laundryPrimaryButtonClass,
} from "@/systems/laundry/lib/ui-tokens";
import { LaundryPaymentPanel } from "@/systems/laundry/components/LaundryPaymentPanel";
import {
  LaundryTaxInvoiceFields,
  emptyLaundryTaxInvoiceForm,
  type LaundryTaxInvoiceFormValue,
} from "@/systems/laundry/components/LaundryTaxInvoiceFields";
import { printLaundryMemberDocs } from "@/systems/laundry/lib/laundry-print-docs";
import { useLaundryShopPrintProfile } from "@/systems/laundry/lib/use-laundry-shop-print-profile";
import type { LaundryPaymentMethod } from "@/systems/laundry/lib/payment-method";

export type LaundrySellPackagePkg = {
  id: number;
  name: string;
  price: number;
  totalSessions: number;
  description?: string;
  durationHours?: number;
  imageUrl?: string | null;
};

function packageDescMeaningful(raw: string | null | undefined): boolean {
  const t = raw?.trim() ?? "";
  if (t.length < 2) return false;
  if (/^(ไม่มี|n\/?a|-|—)$/i.test(t)) return false;
  return true;
}

export type LaundrySellPackageModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: {
    subscriptionId?: number;
    warning?: string | null;
    saleReceiptImageUrl?: string | null;
  }) => void;
  packagesFromParent?: LaundrySellPackagePkg[];
};

const SELL_THEMES = [
  {
    shell: "border-sky-200/70 bg-gradient-to-br from-white via-sky-50/45 to-indigo-50/40",
    accent: "from-sky-500 via-blue-500 to-indigo-500",
    glow: "bg-sky-300/35",
    placeholder: "from-sky-200 via-blue-100 to-indigo-200",
  },
  {
    shell: "border-teal-200/70 bg-gradient-to-br from-white via-emerald-50/45 to-cyan-50/40",
    accent: "from-teal-500 via-emerald-500 to-cyan-500",
    glow: "bg-teal-300/35",
    placeholder: "from-teal-200 via-emerald-100 to-cyan-200",
  },
] as const;

export function LaundrySellPackageModal({
  open,
  onClose,
  onSuccess,
  packagesFromParent,
}: LaundrySellPackageModalProps) {
  const { profile: shopPrint } = useLaundryShopPrintProfile();
  const [packages, setPackages] = useState<LaundrySellPackagePkg[]>(packagesFromParent ?? []);
  const [sellPkg, setSellPkg] = useState("");
  const [sellPhone, setSellPhone] = useState("");
  const [sellName, setSellName] = useState("");
  const [sellLoading, setSellLoading] = useState(false);
  const [sellFormErr, setSellFormErr] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<LaundryPaymentMethod>("CASH");
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [taxForm, setTaxForm] = useState<LaundryTaxInvoiceFormValue>(emptyLaundryTaxInvoiceForm());
  const [printAfterSave, setPrintAfterSave] = useState(true);

  useEffect(() => {
    if (packagesFromParent && packagesFromParent.length > 0) {
      setPackages(packagesFromParent);
    }
  }, [packagesFromParent]);

  useEffect(() => {
    if (!open) return;
    if (packagesFromParent && packagesFromParent.length > 0) return;
    void fetch("/api/laundry/session/packages", { credentials: "include" })
      .then((r) => r.json())
      .then(
        (d: {
          packages?: {
            id: number;
            name: string;
            base_price: number;
            total_sessions?: number;
            description?: string | null;
            duration_hours?: number | string | null;
            image_url?: string | null;
          }[];
        }) => {
          const rows = (d.packages ?? [])
            .filter((p) => (p.total_sessions ?? 1) > 1)
            .map((p) => ({
              id: p.id,
              name: p.name,
              price: p.base_price,
              totalSessions: p.total_sessions ?? 1,
              description: p.description?.trim() || "",
              durationHours: p.duration_hours != null ? Number(p.duration_hours) : undefined,
              imageUrl: p.image_url ?? null,
            }));
          setPackages(rows);
        },
      )
      .catch(() => {});
  }, [open, packagesFromParent]);

  useEffect(() => {
    if (!open) return;
    setSellFormErr(null);
    setSellPkg("");
    setSellPhone("");
    setSellName("");
    setPaymentMethod("CASH");
    setSlipUrl(null);
    setTaxForm(emptyLaundryTaxInvoiceForm());
    setPrintAfterSave(true);
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

  async function onSell(e: React.FormEvent) {
    e.preventDefault();
    setSellFormErr(null);
    const pkgId = Number(sellPkg);
    const digits = sellPhone.replace(/\D/g, "");
    if (!Number.isInteger(pkgId) || pkgId < 1 || digits.length < 9) {
      setSellFormErr("เลือกแพ็กเหมาและกรอกเบอร์ลูกค้า");
      return;
    }
    setSellLoading(true);
    try {
      const receiptImageUrl =
        paymentMethod === "CASH" || paymentMethod === "CREDIT_CARD" ? undefined : slipUrl ?? undefined;
      const res = await fetch("/api/laundry/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          packageId: pkgId,
          phone: digits,
          name: sellName.trim() || null,
          paymentMethod,
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
      const subId = data.subscription?.id;
      // ออกใบกำกับ → พิมพ์ใบกำกับอย่างเดียว (ไม่พิมพ์ใบเสร็จ) · พิมพ์ย้อนหลังเลือกได้ทั้งสองที่ข้อมูลสมาชิก
      const wantTaxInvoice = taxForm.taxInvoiceEnabled;
      if (printAfterSave && selectedPkg && amountBaht > 0 && subId) {
        printLaundryMemberDocs({
          receipt: !wantTaxInvoice,
          taxInvoice: wantTaxInvoice,
          data: {
            shop: shopPrint,
            customerName: (wantTaxInvoice ? taxForm.billingName : sellName).trim() || digits,
            customerPhone: digits,
            customerAddress: wantTaxInvoice ? taxForm.taxAddress.trim() || null : null,
            customerTaxId: wantTaxInvoice ? taxForm.taxId.trim() || null : null,
            packageName: selectedPkg.name,
            totalSessions: selectedPkg.totalSessions,
            remainingSessions: selectedPkg.totalSessions,
            priceBaht: amountBaht,
            paymentMethod,
            soldAtIso: new Date().toISOString(),
            docNo: `LDM-${subId}`,
            note: taxForm.taxBranch.trim() ? `สาขา ${taxForm.taxBranch.trim()}` : null,
          },
        });
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
    <div className={laundryModalBackdropClass} role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="laundry-sell-modal-title"
        className={laundryModalPanelLgClass}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={laundryModalHeaderClass}>
          <div className="min-w-0">
            <h2 id="laundry-sell-modal-title" className={laundryModalTitleClass}>
              ขายแพ็กเหมาซัก
            </h2>
            <p className={laundryModalSubtitleClass}>เลือกแพ็กหลายครั้ง · ดูชื่อและคำอธิบาย · เบอร์ · ชำระเงิน</p>
          </div>
          <button type="button" onClick={onClose} className={laundryModalCloseBtnClass} aria-label="ปิด">
            ✕
          </button>
        </div>
        <form onSubmit={(e) => void onSell(e)} className="grid max-h-[min(78vh,44rem)] gap-3 overflow-y-auto px-5 py-5">
          {sellFormErr ? (
            <p className="rounded-[1.25rem] bg-red-50 px-3 py-2 text-sm text-red-800">{sellFormErr}</p>
          ) : null}
          <fieldset className="min-w-0 space-y-2">
            <legend className="text-sm font-semibold text-[#4d47b6]">เลือกแพ็กเหมา</legend>
            {pkgList.length === 0 ? (
              <p className={cn(laundryOffersListRowCardClass, "px-3 py-6 text-center text-sm text-[#66638c]")}>
                ยังไม่มีแพ็กหลายครั้ง — ตั้งจำนวนครั้ง &gt; 1 ที่แท็บแพ็กเกจก่อน
              </p>
            ) : (
              <ul className="grid max-h-[min(42vh,22rem)] grid-cols-1 gap-2 overflow-y-auto">
                {pkgList.map((p, index) => {
                  const theme = SELL_THEMES[index % SELL_THEMES.length]!;
                  const selected = sellPkg === String(p.id);
                  const img = p.imageUrl?.trim() || null;
                  const desc = packageDescMeaningful(p.description) ? p.description!.trim() : null;
                  const hours = p.durationHours != null && Number.isFinite(p.durationHours) ? p.durationHours : null;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setSellPkg(String(p.id))}
                        aria-pressed={selected}
                        className={cn(
                          laundryOffersListRowCardClass,
                          "relative w-full overflow-hidden !px-3 py-2.5 text-left",
                          theme.shell,
                          selected && "ring-2 ring-[#5b61ff]/55",
                        )}
                      >
                        <div className="flex min-w-0 gap-2.5">
                          <span
                            className={cn(
                              "h-14 w-14 shrink-0 overflow-hidden rounded-[1rem]",
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
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">แพ็กเกจ</p>
                            <p className="line-clamp-2 text-sm font-black text-[#1e1b4b]">{p.name}</p>
                            {desc ?
                              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[#66638c]">{desc}</p>
                            : null}
                            <p className="mt-1 text-sm font-black tabular-nums text-[#4d47b6]">
                              ฿{p.price.toLocaleString("th-TH")} · {p.totalSessions.toLocaleString("th-TH")} ครั้ง
                              {hours != null && hours > 0 ?
                                <span className="font-bold text-[#8b87ad]">
                                  {" "}
                                  · {hours >= 1
                                    ? `${hours.toLocaleString("th-TH", { maximumFractionDigits: 1 })} ชม.`
                                    : `${Math.round(hours * 60)} นาที`}
                                </span>
                              : null}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <input type="hidden" value={sellPkg} required readOnly aria-hidden tabIndex={-1} />
          </fieldset>
          {selectedPkg ?
            <div className="rounded-2xl border border-[#5b61ff]/25 bg-[#5b61ff]/5 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#5f5a8a]">แพ็กที่เลือก</p>
              <p className="text-sm font-black text-[#1e1b4b]">{selectedPkg.name}</p>
              {packageDescMeaningful(selectedPkg.description) ?
                <p className="mt-0.5 text-xs leading-relaxed text-[#66638c]">{selectedPkg.description!.trim()}</p>
              : null}
              <p className="mt-1 text-xs font-bold tabular-nums text-[#4d47b6]">
                ฿{selectedPkg.price.toLocaleString("th-TH")} · {selectedPkg.totalSessions.toLocaleString("th-TH")} ครั้ง
              </p>
            </div>
          : null}
          <input
            className={laundryFieldClass}
            placeholder="เบอร์ลูกค้า"
            inputMode="numeric"
            value={sellPhone}
            onChange={(e) => setSellPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
          />
          <input
            className={laundryFieldClass}
            placeholder="ชื่อลูกค้า (ไม่บังคับ)"
            value={sellName}
            onChange={(e) => setSellName(e.target.value)}
          />
          <LaundryTaxInvoiceFields
            value={taxForm}
            onChange={setTaxForm}
            fallbackName={sellName}
            disabled={sellLoading}
          />
          <LaundryPaymentPanel
            amountBaht={amountBaht}
            method={paymentMethod}
            slipUrl={slipUrl}
            onMethodChange={setPaymentMethod}
            onSlipUrlChange={setSlipUrl}
            disabled={sellLoading}
          />
          <label className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-[#5b61ff] focus:ring-[#5b61ff]"
              checked={printAfterSave}
              onChange={(e) => setPrintAfterSave(e.target.checked)}
            />
            <span className="min-w-0">
              <span className="block text-sm font-black text-[#1e1b4b]">
                {taxForm.taxInvoiceEnabled ? "พิมพ์ใบกำกับภาษีหลังบันทึก" : "พิมพ์ใบเสร็จหลังบันทึก"}
              </span>
              <span className="block text-[11px] font-semibold text-[#66638c]">
                {taxForm.taxInvoiceEnabled
                  ? "พิมพ์ใบกำกับ A4 อย่างเดียว · ใบเสร็จพิมพ์ย้อนหลังได้ที่ข้อมูลสมาชิก"
                  : "ขนาดตามตั้งค่าร้าน · พิมพ์ย้อนหลังได้ที่ข้อมูลสมาชิก"}
              </span>
            </span>
          </label>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className={cn(laundryOutlineButtonClass, "w-full sm:w-auto")}>
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={sellLoading || pkgList.length === 0 || !sellPkg}
              className={cn(laundryPrimaryButtonClass, "w-full sm:w-auto")}
            >
              {sellLoading ? "…" : "เปิดแพ็ก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
