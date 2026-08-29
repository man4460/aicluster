"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  AppCameraCaptureModal,
  AppPickGalleryImageButton,
  AppTakePhotoButton,
} from "@/components/app-templates";
import { MassageModalPortal } from "@/systems/massage/components/MassageModalPortal";
import {
  massageCardSurfaceRadiusClass,
  massageModalBackdropClass,
  massageModalCloseBtnClass,
  massageModalHeaderClass,
  massageModalPanelLgClass,
  massageModalSubtitleClass,
  massageModalTitleClass,
} from "@/systems/massage/components/massage-ui-tokens";

export type MassageSellPackagePkg = { id: number; name: string; price: number; totalSessions: number };

type StylistBrief = { id: number; name: string };

export type MassageSellPackageModalProps = {
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
  packagesFromParent?: MassageSellPackagePkg[];
};

export function MassageSellPackageModal({
  open,
  onClose,
  onSuccess,
  externalStylistId,
  packagesFromParent,
}: MassageSellPackageModalProps) {
  const [packages, setPackages] = useState<MassageSellPackagePkg[]>(packagesFromParent ?? []);
  const [stylists, setStylists] = useState<StylistBrief[]>([]);
  const [internalStylistId, setInternalStylistId] = useState("");
  const [sellPkg, setSellPkg] = useState("");
  const [sellPhone, setSellPhone] = useState("");
  const [sellName, setSellName] = useState("");
  const [sellLoading, setSellLoading] = useState(false);
  const [sellFormErr, setSellFormErr] = useState<string | null>(null);
  const [sellReceipt, setSellReceipt] = useState<{ file: File; url: string } | null>(null);
  const [sellCameraOpen, setSellCameraOpen] = useState(false);
  const sellSlipFileInputRef = useRef<HTMLInputElement>(null);

  const clearSellReceipt = useCallback(() => {
    setSellReceipt((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, []);

  const onSellReceiptSelected = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setSellFormErr("เลือกรูปภาพเท่านั้น");
      return;
    }
    setSellFormErr(null);
    setSellReceipt((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return { file: f, url: URL.createObjectURL(f) };
    });
  }, []);

  const onSellCameraCapture = useCallback((file: File) => {
    setSellReceipt((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return { file, url: URL.createObjectURL(file) };
    });
    setSellFormErr(null);
  }, []);

  useEffect(() => {
    if (packagesFromParent && packagesFromParent.length > 0) {
      setPackages(packagesFromParent);
    }
  }, [packagesFromParent]);

  useEffect(() => {
    if (!open) return;
    if (packagesFromParent && packagesFromParent.length > 0) return;
    void fetch("/api/massage/packages")
      .then((r) => r.json())
      .then((d: { packages?: MassageSellPackagePkg[] }) => setPackages(d.packages ?? []))
      .catch(() => {});
  }, [open, packagesFromParent]);

  useEffect(() => {
    if (!open || externalStylistId !== undefined) return;
    void fetch("/api/massage/therapists")
      .then((r) => r.json())
      .then((d: { therapists?: StylistBrief[] }) => setStylists(d.therapists ?? []))
      .catch(() => {});
  }, [open, externalStylistId]);

  useEffect(() => {
    if (!open) return;
    setSellFormErr(null);
    setSellPkg("");
    setSellPhone("");
    setSellName("");
    setSellReceipt((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
    setSellCameraOpen(false);
    setInternalStylistId("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (sellCameraOpen) {
          setSellCameraOpen(false);
          return;
        }
        clearSellReceipt();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, sellCameraOpen, clearSellReceipt, onClose]);

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
      let receiptImageUrl: string | undefined;
      if (sellReceipt?.file) {
        const fd = new FormData();
        fd.append("file", sellReceipt.file);
        const up = await fetch("/api/massage/cash-receipt/upload", {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        const upData = (await up.json().catch(() => ({}))) as { error?: string; imageUrl?: string };
        if (!up.ok) {
          setSellFormErr(upData.error ?? "อัปโหลดรูปไม่สำเร็จ");
          return;
        }
        if (!upData.imageUrl) {
          setSellFormErr("อัปโหลดรูปไม่สำเร็จ");
          return;
        }
        receiptImageUrl = upData.imageUrl;
      }

      const sidFromPage =
        externalStylistId !== undefined ? externalStylistId : internalStylistId;
      const sidSell = sidFromPage ? Number(sidFromPage) : null;
      const res = await fetch("/api/massage/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          packageId: pkgId,
          phone: digits,
          name: sellName.trim() || null,
          ...(sidSell != null && Number.isInteger(sidSell) && sidSell > 0 ? { therapistId: sidSell } : {}),
          ...(receiptImageUrl ? { receiptImageUrl } : {}),
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
      clearSellReceipt();
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

  const pkgList = packagesFromParent && packagesFromParent.length > 0 ? packagesFromParent : packages;
  const showInternalStylist = externalStylistId === undefined;

  if (!open) return null;

  return (
    <MassageModalPortal>
      <>
        <div
          className={massageModalBackdropClass}
          role="presentation"
          onClick={() => {
            clearSellReceipt();
            setSellCameraOpen(false);
            onClose();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="massage-sell-modal-title"
            className={massageModalPanelLgClass}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={massageModalHeaderClass}>
              <div className="min-w-0">
                <h2 id="massage-sell-modal-title" className={massageModalTitleClass}>
                  ขายแพ็กเกจให้ลูกค้า
                </h2>
                <p className={massageModalSubtitleClass}>
                  เลือกแพ็กเกจ กรอกเบอร์และชื่อ — แนบสลิปได้ (ไม่บังคับ)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearSellReceipt();
                  setSellCameraOpen(false);
                  onClose();
                }}
                className={massageModalCloseBtnClass}
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
                <label htmlFor="massage-sell-modal-stylist" className="text-sm font-semibold text-[#4d47b6]">
                  พนักงานที่บันทึกการขาย (ไม่บังคับ)
                </label>
                <select
                  id="massage-sell-modal-stylist"
                  className="app-input mt-1 min-h-[48px] w-full rounded-[1.25rem] border border-slate-200 px-3 text-base"
                  value={internalStylistId}
                  onChange={(e) => setInternalStylistId(e.target.value)}
                >
                  <option value="">— ไม่ระบุพนักงาน —</option>
                  {stylists.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <select
              className="min-h-[48px] rounded-[1.25rem] border border-slate-200 px-3 text-base"
              value={sellPkg}
              onChange={(e) => setSellPkg(e.target.value)}
              required
            >
              <option value="">เลือกแพ็กเกจ</option>
              {pkgList.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name} — {p.price.toLocaleString("th-TH")} บ. / {p.totalSessions} ครั้ง
                </option>
              ))}
            </select>
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
            <div className={`${massageCardSurfaceRadiusClass} border border-slate-200 bg-slate-50/60 px-3 py-2.5`}>
              <p className="text-xs font-semibold text-slate-700">แนบรูปสลิป (ไม่บังคับ)</p>
              <input
                ref={sellSlipFileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={onSellReceiptSelected}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <AppPickGalleryImageButton
                  type="button"
                  disabled={sellLoading}
                  className="min-h-[44px]"
                  onClick={() => {
                    setSellFormErr(null);
                    sellSlipFileInputRef.current?.click();
                  }}
                >
                  อัปโหลดสลิป (ทดลอง)
                </AppPickGalleryImageButton>
                <AppTakePhotoButton
                  type="button"
                  disabled={sellLoading}
                  className="min-h-[44px]"
                  onClick={() => {
                    setSellFormErr(null);
                    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
                      setSellFormErr("เบราว์เซอร์ไม่รองรับการเปิดกล้อง — ใช้ปุ่มอัปโหลดสลิปแทน");
                      return;
                    }
                    setSellCameraOpen(true);
                  }}
                />
                {sellReceipt ? (
                  <button
                    type="button"
                    className="rounded-[1.25rem] px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-white hover:text-slate-800"
                    onClick={clearSellReceipt}
                  >
                    ลบรูป
                  </button>
                ) : null}
              </div>
              {sellReceipt ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sellReceipt.url}
                  alt="ตัวอย่างสลิป"
                  className="mt-2 max-h-40 w-full rounded-[1.25rem] border border-slate-200 bg-white object-contain"
                />
              ) : null}
            </div>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  clearSellReceipt();
                  setSellCameraOpen(false);
                  onClose();
                }}
                className={`min-h-[48px] ${massageCardSurfaceRadiusClass} border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50`}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={sellLoading || pkgList.length === 0}
                className={`app-btn-primary min-h-[48px] ${massageCardSurfaceRadiusClass} px-4 py-3 text-sm font-semibold text-white disabled:opacity-50`}
              >
                {sellLoading ? "…" : "เปิดแพ็กเกจ"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AppCameraCaptureModal
        open={sellCameraOpen}
        onClose={() => setSellCameraOpen(false)}
        onCapture={(file) => onSellCameraCapture(file)}
        title="ถ่ายรูปสลิป"
      />
      </>
    </MassageModalPortal>
  );
}
