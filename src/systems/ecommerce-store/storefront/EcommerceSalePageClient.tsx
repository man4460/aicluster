"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  useAppImageLightbox,
} from "@/components/app-templates";
import { useMounted } from "@/systems/ecommerce-store/hooks/useMounted";

type Product = {
  id: string;
  name: string;
  imageUrl: string | null;
  description: string | null;
  priceBaht: string;
  stockBalance: number;
};

type StorePay = {
  id: string;
  storeName: string;
  promptPayPhone: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
};

function SalePageSkeleton({ storeName }: { storeName: string }) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#f8f7ff] to-white pb-28" aria-hidden>
      <header className="px-4 py-4 text-center">
        <div className="mx-auto h-7 w-48 animate-pulse rounded-xl bg-[#ecebff]/60" />
        <p className="sr-only">{storeName}</p>
      </header>
      <div className="mx-auto max-w-lg space-y-4 px-4">
        <div className="app-surface h-80 animate-pulse rounded-[2rem] bg-[#ecebff]/30" />
        <div className="app-surface h-24 animate-pulse rounded-2xl bg-[#ecebff]/30" />
        <div className="app-surface h-32 animate-pulse rounded-2xl bg-[#ecebff]/30" />
      </div>
    </div>
  );
}

export function EcommerceSalePageClient({
  store,
  product,
}: {
  store: StorePay;
  product: Product;
}) {
  const mounted = useMounted();
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [tracking, setTracking] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lb = useAppImageLightbox();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const price = Number(product.priceBaht);
  const total = price * qty;

  useEffect(() => {
    if (!mounted || !store.promptPayPhone || total <= 0) return;
    void fetch(`/api/ecommerce-store/public/${store.id}/promptpay-qr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountBaht: total }),
    })
      .then((r) => r.json())
      .then((j) => setQrUrl(typeof j.qrDataUrl === "string" ? j.qrDataUrl : null));
  }, [mounted, store.id, store.promptPayPhone, total]);

  async function onSlip(file: File) {
    const fd = new FormData();
    fd.set("storeId", store.id);
    fd.set("file", file);
    const res = await fetch("/api/ecommerce-store/public/upload-slip", { method: "POST", body: fd });
    const j = await res.json();
    if (res.ok && j.imageUrl) setSlipUrl(j.imageUrl);
    else setErr(j.error ?? "อัปโหลดไม่สำเร็จ");
  }

  async function submit() {
    if (!slipUrl) {
      setErr("กรุณาแนบสลิป");
      return;
    }
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/ecommerce-store/public/${store.id}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        paymentSlipUrl: slipUrl,
        items: [{ productId: product.id, quantity: qty }],
      }),
    });
    const j = await res.json();
    setBusy(false);
    if (!res.ok) {
      setErr(j.error ?? "ไม่สำเร็จ");
      return;
    }
    setTracking(j.order?.trackingCode ?? null);
  }

  if (!mounted) {
    return <SalePageSkeleton storeName={store.storeName} />;
  }

  if (tracking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <h1 className="font-black text-2xl text-[#1e1b4b]">สั่งซื้อสำเร็จ</h1>
        <p className="mt-2 text-sm text-[#66638c]">รหัสติดตาม: {tracking}</p>
        <Link
          href={`/shop/${store.id}/track?code=${encodeURIComponent(tracking)}`}
          className="app-btn-primary mt-6 inline-flex rounded-2xl px-6 py-3 font-bold"
        >
          ดูสถานะ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#f8f7ff] to-white pb-28">
      <header className="px-4 py-4 text-center">
        <h1 className="font-black text-xl text-[#1e1b4b]">{store.storeName}</h1>
      </header>
      <div className="mx-auto max-w-lg space-y-4 px-4">
        <article className="app-surface overflow-hidden rounded-[2rem]">
          <div className="relative aspect-[4/3] bg-[#f3f2fa]">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt="" fill className="object-cover" sizes="100vw" />
            ) : null}
          </div>
          <div className="p-4">
            <h2 className="font-black text-lg text-[#1e1b4b]">{product.name}</h2>
            {product.description ? (
              <p className="mt-2 text-sm text-[#66638c]">{product.description}</p>
            ) : null}
            <p className="mt-3 font-black text-2xl text-[#4d47b6]">
              ฿{price.toLocaleString("th-TH")}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm font-semibold">จำนวน</span>
              <button
                type="button"
                className="min-h-[40px] min-w-[40px] rounded-xl border font-bold"
                aria-label="ลดจำนวน"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                -
              </button>
              <span className="font-bold tabular-nums">{qty}</span>
              <button
                type="button"
                className="min-h-[40px] min-w-[40px] rounded-xl border font-bold"
                aria-label="เพิ่มจำนวน"
                onClick={() => setQty((q) => Math.min(product.stockBalance, q + 1))}
              >
                +
              </button>
            </div>
          </div>
        </article>

        <section className="app-surface rounded-2xl p-4">
          <p className="font-bold">ชำระ ฿{total.toLocaleString("th-TH")}</p>
          {qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrUrl} alt="QR PromptPay" className="mx-auto mt-2 h-40 w-40 rounded-2xl" />
          ) : null}
        </section>

        <section className="app-surface space-y-2 rounded-2xl p-4">
          <input
            className="app-input w-full rounded-xl"
            placeholder="ชื่อ"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
          <input
            className="app-input w-full rounded-xl"
            placeholder="เบอร์"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
          <textarea
            className="app-input w-full rounded-xl"
            placeholder="ที่อยู่"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            autoComplete="street-address"
          />
        </section>

        <section className="app-surface rounded-2xl p-4">
          <p className="font-bold text-sm">แนบสลิป</p>
          {slipUrl ? (
            <AppImageThumb
              src={slipUrl}
              alt="สลิป"
              onOpen={() => lb.open(slipUrl)}
              className="mt-2"
            />
          ) : null}
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onSlip(f);
              e.target.value = "";
            }}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onSlip(f);
              e.target.value = "";
            }}
          />
          <AppImagePickCameraButtons
            onPickGallery={() => galleryRef.current?.click()}
            onPickCamera={() => cameraRef.current?.click()}
            className="mt-2 justify-start"
          />
        </section>
        {err ? <p className="text-sm text-rose-600">{err}</p> : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="mx-auto flex w-full max-w-lg min-h-[48px] items-center justify-center rounded-2xl bg-[#4d47b6] font-bold text-white disabled:opacity-60"
        >
          {busy ? "กำลังส่ง..." : "สั่งซื้อจบในหน้าเดียว"}
        </button>
      </div>
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />
    </div>
  );
}
