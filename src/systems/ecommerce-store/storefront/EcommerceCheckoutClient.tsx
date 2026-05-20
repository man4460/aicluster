"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  useAppImageLightbox,
} from "@/components/app-templates";
import { useMounted } from "@/systems/ecommerce-store/hooks/useMounted";
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
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!mounted || cart.totalBaht <= 0) return;
    if (!store.promptPayPhone?.trim()) {
      setQrUrl(null);
      return;
    }
    void fetch(`/api/ecommerce-store/public/${store.id}/promptpay-qr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountBaht: cart.totalBaht }),
    })
      .then((r) => r.json())
      .then((j) => setQrUrl(typeof j.qrDataUrl === "string" ? j.qrDataUrl : null))
      .catch(() => setQrUrl(null));
  }, [mounted, store.id, store.promptPayPhone, cart.totalBaht]);

  if (!mounted) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-[#f8f7ff] to-white pb-32" aria-hidden>
        <div className="mx-auto max-w-lg space-y-4 px-4 py-8">
          <div className="app-surface h-40 animate-pulse rounded-2xl bg-[#ecebff]/30" />
          <div className="app-surface h-56 animate-pulse rounded-2xl bg-[#ecebff]/30" />
        </div>
      </div>
    );
  }

  async function onSlipFile(file: File) {
    setErr(null);
    const fd = new FormData();
    fd.set("storeId", store.id);
    fd.set("file", file);
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
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-[#66638c]">ตะกร้าว่าง</p>
        <Link href={`/shop/${store.id}`} className="app-btn-primary mt-4 inline-flex rounded-2xl px-6 py-3 text-sm font-bold">
          เลือกสินค้า
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#f8f7ff] to-white pb-32">
      <header className="border-b border-white/60 px-4 py-4">
        <h1 className="font-black text-xl text-[#1e1b4b]">ชำระเงิน</h1>
        <p className="text-sm text-[#66638c]">{store.storeName}</p>
      </header>

      <div className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <section className="app-surface rounded-2xl p-4">
          <h2 className="font-bold text-[#1e1b4b]">สรุปยอด</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {cart.lines.map((l) => (
              <li key={l.productId} className="flex justify-between gap-2">
                <span className="text-[#66638c]">
                  {l.name} × {l.quantity}
                </span>
                <span className="font-semibold">฿{(l.priceBaht * l.quantity).toLocaleString("th-TH")}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-right font-black text-lg text-[#4d47b6]">
            รวม ฿{cart.totalBaht.toLocaleString("th-TH")}
          </p>
        </section>

        <section className="app-surface rounded-2xl p-4">
          <h2 className="font-bold text-[#1e1b4b]">โอนชำระ</h2>
          {qrUrl ? (
            <div className="mt-3 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="QR PromptPay" className="h-48 w-48 rounded-2xl ring-2 ring-white" />
            </div>
          ) : null}
          {store.promptPayPhone ? (
            <p className="mt-2 text-sm">
              พร้อมเพย์: <span className="font-bold">{store.promptPayPhone}</span>
            </p>
          ) : null}
          {store.bankAccountNumber ? (
            <p className="mt-1 text-sm text-[#66638c]">
              {store.bankName} · {store.bankAccountName} · {store.bankAccountNumber}
            </p>
          ) : null}
          {store.paymentNote ? <p className="mt-2 text-xs text-[#8b87b8]">{store.paymentNote}</p> : null}
        </section>

        <section className="app-surface space-y-3 rounded-2xl p-4">
          <h2 className="font-bold text-[#1e1b4b]">ข้อมูลจัดส่ง</h2>
          <input
            className="app-input w-full rounded-xl"
            placeholder="ชื่อ-นามสกุล"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="app-input w-full rounded-xl"
            placeholder="เบอร์โทร"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <textarea
            className="app-input min-h-[80px] w-full rounded-xl"
            placeholder="ที่อยู่จัดส่ง"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </section>

        <section className="app-surface rounded-2xl p-4">
          <h2 className="font-bold text-[#1e1b4b]">แนบสลิป (บังคับ)</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {slipUrl ? (
              <AppImageThumb src={slipUrl} alt="สลิป" onOpen={() => lb.open(slipUrl)} />
            ) : null}
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
            />
          </div>
        </section>

        {err ? <p className="text-sm text-rose-600">{err}</p> : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/50 bg-white/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-2xl">
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="mx-auto flex w-full max-w-lg min-h-[48px] items-center justify-center rounded-2xl bg-[#4d47b6] font-bold text-white disabled:opacity-60"
        >
          {busy ? "กำลังส่ง..." : "ยืนยันออเดอร์"}
        </button>
      </div>
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิปชำระเงิน" />
    </div>
  );
}
