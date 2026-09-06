"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  prepareImageFileForUpload,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { useMounted } from "@/systems/ecommerce-store/hooks/useMounted";
import { fetchEcommercePromptPayQr } from "@/systems/ecommerce-store/lib/fetch-promptpay-qr";
import {
  ecommerceStoreFieldClass,
  ecommerceStoreOutlineButtonClass,
  ecommerceStorePanelClass,
  ecommerceStorePortalBottomDockClass,
  ecommerceStorePortalPageInnerClass,
  ecommerceStorePortalPageShellClass,
  ecommerceStorePortalPageTitleClass,
  ecommerceStorePortalStickyHeaderClass,
  ecommerceStorePrimaryButtonClass,
  ecommerceStoreTextareaClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";
import { useEcommerceCart } from "@/systems/ecommerce-store/storefront/useEcommerceCart";
import { useEcommerceBuyerPhone } from "@/systems/ecommerce-store/storefront/useEcommerceBuyerPhone";

type StorePay = {
  id: string;
  storeName: string;
  promptPayPhone: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  paymentNote: string | null;
};

const formLabelClass = "block text-xs font-semibold text-[#4d47b6]";

function CheckoutAside({
  store,
  lines,
  totalBaht,
  qrUrl,
  qrError,
}: {
  store: StorePay;
  lines: { productId: string; name: string; quantity: number; priceBaht: number }[];
  totalBaht: number;
  qrUrl: string | null;
  qrError: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className={cn(ecommerceStorePanelClass, "space-y-3 p-4 sm:p-5")}>
        <p className="text-xs font-bold tracking-wide text-[#1e1b4b]">สรุปยอด</p>
        <ul className="space-y-2 text-sm">
          {lines.map((l) => (
            <li key={l.productId} className="flex justify-between gap-2">
              <span className="min-w-0 flex-1 truncate font-medium text-[#66638c]">
                {l.name} × {l.quantity}
              </span>
              <span className="shrink-0 font-bold tabular-nums text-[#1e1b4b]">
                ฿{(l.priceBaht * l.quantity).toLocaleString("th-TH")}
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t border-slate-200/80 pt-3 text-right">
          <p className="text-[10px] font-semibold text-[#66638c]">ยอดรวม</p>
          <p className="text-xl font-black tabular-nums text-emerald-700">
            ฿{totalBaht.toLocaleString("th-TH")}
          </p>
        </div>
      </div>

      <div className={cn(ecommerceStorePanelClass, "space-y-3 p-4 sm:p-5")}>
        <p className="text-xs font-bold tracking-wide text-[#1e1b4b]">โอนชำระ</p>
        {qrUrl ? (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="QR PromptPay"
              className="h-44 w-44 rounded-xl border border-slate-200/90 bg-white p-2 shadow-sm sm:h-48 sm:w-48"
            />
          </div>
        ) : qrError ? (
          <p className="text-sm font-semibold text-rose-600">{qrError}</p>
        ) : store.promptPayPhone?.trim() ? (
          <p className="text-sm font-medium text-[#66638c]">กำลังสร้าง QR…</p>
        ) : (
          <p className="text-sm font-medium text-[#66638c]">โอนตามบัญชีด้านล่าง แล้วแนบสลิป</p>
        )}
        {store.promptPayPhone ? (
          <p className="text-sm font-semibold text-[#1e1b4b]">
            พร้อมเพย์: <span className="font-black">{store.promptPayPhone}</span>
          </p>
        ) : null}
        {store.bankAccountNumber ? (
          <p className="text-sm font-medium leading-relaxed text-[#66638c]">
            {store.bankName} · {store.bankAccountName}
            <br />
            {store.bankAccountNumber}
          </p>
        ) : null}
        {store.paymentNote ? (
          <p className="text-xs font-medium text-[#8b87b8]">{store.paymentNote}</p>
        ) : null}
      </div>
    </div>
  );
}

export function EcommerceCheckoutClient({ store }: { store: StorePay }) {
  const mounted = useMounted();
  const router = useRouter();
  const cart = useEcommerceCart(store.id);
  const buyerPhone = useEcommerceBuyerPhone(store.id);
  const lb = useAppImageLightbox();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!mounted || cart.totalBaht <= 0) return;
    if (!store.promptPayPhone?.trim()) {
      setQrUrl(null);
      setQrError(null);
      return;
    }
    let cancelled = false;
    void fetchEcommercePromptPayQr(store.id, cart.totalBaht).then(({ qrDataUrl, error }) => {
      if (cancelled) return;
      setQrUrl(qrDataUrl);
      setQrError(error);
    });
    return () => {
      cancelled = true;
    };
  }, [mounted, store.id, store.promptPayPhone, cart.totalBaht]);

  if (!mounted) {
    return (
      <div className={ecommerceStorePortalPageShellClass} aria-hidden>
        <div className={cn(ecommerceStorePortalPageInnerClass, "space-y-4 py-8")}>
          <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-56 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  async function onSlipFile(file: File) {
    setErr(null);
    const prepared = await prepareImageFileForUpload(file);
    const fd = new FormData();
    fd.set("storeId", store.id);
    fd.set("file", prepared);
    const res = await fetch("/api/ecommerce-store/public/upload-slip", { method: "POST", body: fd });
    const j = (await res.json()) as { imageUrl?: string; error?: string };
    if (!res.ok) {
      setErr(j.error ?? "อัปโหลดไม่สำเร็จ");
      return;
    }
    if (j.imageUrl) setSlipUrl(j.imageUrl);
  }

  async function submit() {
    setErr(null);
    if (!slipUrl) {
      setErr("กรุณาแนบสลิปก่อนยืนยันออเดอร์");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/ecommerce-store/public/${store.id}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customerAddress: address,
          paymentSlipUrl: slipUrl,
          items: cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        }),
      });
      const j = (await res.json()) as { error?: string; order?: { trackingCode: string } };
      if (!res.ok) {
        setErr(j.error ?? "สั่งซื้อไม่สำเร็จ");
        return;
      }
      cart.clear();
      buyerPhone.setPhone(phone);
      router.push(`/shop/${store.id}/track?code=${encodeURIComponent(j.order?.trackingCode ?? "")}`);
    } finally {
      setBusy(false);
    }
  }

  if (cart.lines.length === 0) {
    return (
      <div className={cn(ecommerceStorePortalPageShellClass, "flex flex-col")}>
        <header className={ecommerceStorePortalStickyHeaderClass}>
          <div className={cn(ecommerceStorePortalPageInnerClass, "flex items-center justify-between gap-3 py-3")}>
            <h1 className={cn(ecommerceStorePortalPageTitleClass, "!text-xl sm:!text-2xl")}>ชำระเงิน</h1>
            <Link href={`/shop/${store.id}`} className={ecommerceStoreOutlineButtonClass}>
              กลับร้าน
            </Link>
          </div>
        </header>
        <div className={cn(ecommerceStorePortalPageInnerClass, "flex flex-1 flex-col items-center justify-center py-16 text-center")}>
          <div className={cn(ecommerceStorePanelClass, "w-full max-w-md space-y-4 p-6")}>
            <p className="text-lg font-black text-[#1e1b4b]">ตะกร้าว่าง</p>
            <Link href={`/shop/${store.id}`} className={cn(ecommerceStorePrimaryButtonClass, "w-full")}>
              เลือกสินค้า
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const aside = (
    <CheckoutAside
      store={store}
      lines={cart.lines}
      totalBaht={cart.totalBaht}
      qrUrl={qrUrl}
      qrError={qrError}
    />
  );

  return (
    <div className={ecommerceStorePortalPageShellClass}>
      <header className={ecommerceStorePortalStickyHeaderClass}>
        <div className={cn(ecommerceStorePortalPageInnerClass, "flex items-center justify-between gap-3 py-3")}>
          <div className="min-w-0">
            <h1 className={cn(ecommerceStorePortalPageTitleClass, "!text-xl sm:!text-2xl")}>ชำระเงิน</h1>
            <p className="truncate text-xs font-semibold text-[#66638c] sm:text-sm">{store.storeName}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href={`/shop/${store.id}/cart`} className={ecommerceStoreOutlineButtonClass}>
              ตะกร้า
            </Link>
            <Link
              href={`/shop/${store.id}`}
              className={cn(ecommerceStoreOutlineButtonClass, "hidden sm:inline-flex")}
            >
              กลับร้าน
            </Link>
          </div>
        </div>
      </header>

      <main
        className={cn(
          ecommerceStorePortalPageInnerClass,
          "grid gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-8",
        )}
      >
        <div className="space-y-6 sm:space-y-8">
          <div className="lg:hidden">{aside}</div>

          <div
            id="checkout-form"
            className={cn(ecommerceStorePanelClass, "space-y-4 p-4 sm:p-5")}
          >
            <label className={formLabelClass}>
              ชื่อ-นามสกุล
              <input
                className={cn(ecommerceStoreFieldClass, "mt-1.5")}
                placeholder="ชื่อผู้รับ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </label>
            <label className={formLabelClass}>
              เบอร์โทร
              <input
                className={cn(ecommerceStoreFieldClass, "mt-1.5")}
                placeholder="08x-xxx-xxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
            <label className={formLabelClass}>
              ที่อยู่จัดส่ง
              <textarea
                className={cn(ecommerceStoreTextareaClass, "mt-1.5 min-h-[5rem]")}
                placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
              />
            </label>

            <div className="border-t border-slate-200/80 pt-4">
              <p className={formLabelClass}>สลิปชำระเงิน</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                {slipUrl ? (
                  <AppImageThumb src={slipUrl} alt="สลิป" onOpen={() => lb.open(slipUrl)} />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-[10px] font-semibold text-[#8b87b8]">
                    ไม่มีสลิป
                  </div>
                )}
                <input
                  ref={galleryRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onSlipFile(f);
                    e.target.value = "";
                  }}
                />
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onSlipFile(f);
                    e.target.value = "";
                  }}
                />
                <AppImagePickCameraButtons
                  onPickGallery={() => galleryRef.current?.click()}
                  onPickCamera={() => cameraRef.current?.click()}
                  busy={busy}
                  className="justify-start"
                  buttonClassName={ecommerceStoreOutlineButtonClass}
                  labels={{ gallery: "เลือกสลิป", camera: "ถ่ายสลิป" }}
                />
              </div>
            </div>
          </div>

          {err ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {err}
            </p>
          ) : null}

          <div className="hidden lg:block">
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit()}
              className={cn(ecommerceStorePrimaryButtonClass, "w-full sm:w-auto sm:min-w-[12rem]")}
            >
              {busy ? "กำลังส่ง…" : "ยืนยันออเดอร์"}
            </button>
          </div>
        </div>

        <aside className="hidden lg:sticky lg:top-24 lg:block">{aside}</aside>
      </main>

      <div className={ecommerceStorePortalBottomDockClass}>
        <div className={cn(ecommerceStorePortalPageInnerClass, "flex items-center gap-3")}>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-[#66638c]">ยอดรวม</p>
            <p className="text-lg font-black tabular-nums text-emerald-700">
              ฿{cart.totalBaht.toLocaleString("th-TH")}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className={cn(ecommerceStorePrimaryButtonClass, "shrink-0 px-5")}
          >
            {busy ? "กำลังส่ง…" : "ยืนยันออเดอร์"}
          </button>
        </div>
      </div>

      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิปชำระเงิน" />
    </div>
  );
}
