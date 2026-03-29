"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import type { SubscriptionTier, SubscriptionType } from "@/generated/prisma/enums";
import { MawellLogo } from "@/components/layout/MawellLogo";

type Props = {
  triggerLabel?: string;
  triggerClassName?: string;
  subscriptionTier: SubscriptionTier;
  subscriptionType: SubscriptionType;
};

export function TokenTopupModal({
  triggerLabel = "เติมโทเคน",
  triggerClassName,
  subscriptionTier,
  subscriptionType,
}: Props) {
  void subscriptionTier;
  void subscriptionType;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amountBaht, setAmountBaht] = useState<number | "">(100);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [expiresAtIso, setExpiresAtIso] = useState<string | null>(null);
  const [countdownText, setCountdownText] = useState("");
  const [qrCodeContent, setQrCodeContent] = useState<string | null>(null);
  const [qrImageDataUrl, setQrImageDataUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const popupRef = useRef<HTMLDivElement | null>(null);

  async function createOrder() {
    const amt = amountBaht === "" ? 0 : Number(amountBaht);
    if (amt < 1 || amt > 100000) {
      setErr("กรุณาระบุยอด 1-100000 บาท");
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/payments/melody/topup/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amountBaht: amt }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        orderId?: string;
        qrCodeContent?: string | null;
        expiresAt?: string | null;
      };
      if (!res.ok) {
        setErr(data.error ?? "สร้างคำสั่งซื้อไม่สำเร็จ");
        return;
      }
      setOrderId(data.orderId ?? null);
      setQrCodeContent(data.qrCodeContent ?? null);
      setExpiresAtIso(data.expiresAt ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let disposed = false;
    if (!qrCodeContent) {
      setQrImageDataUrl(null);
      return;
    }
    (async () => {
      try {
        const img = await QRCode.toDataURL(qrCodeContent, { margin: 1, width: 260 });
        if (!disposed) setQrImageDataUrl(img);
      } catch {
        if (!disposed) setQrImageDataUrl(null);
      }
    })();
    return () => {
      disposed = true;
    };
  }, [qrCodeContent]);

  useEffect(() => {
    if (!open) {
      setOrderId(null);
      setQrCodeContent(null);
      setQrImageDataUrl(null);
      setExpiresAtIso(null);
      setCountdownText("");
      setErr(null);
      setDownloading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!expiresAtIso) {
      setCountdownText("");
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((new Date(expiresAtIso).getTime() - Date.now()) / 1000));
      if (left <= 0) {
        setCountdownText("หมดอายุแล้ว");
        return;
      }
      const m = Math.floor(left / 60);
      const s = left % 60;
      setCountdownText(`หมดอายุใน ${m} นาที ${s} วินาที`);
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAtIso]);

  useEffect(() => {
    if (!orderId) return;
    const timer = window.setInterval(async () => {
      const res = await fetch(`/api/payments/melody/status/${orderId}`, { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as { status?: string; expiresAt?: string | null };
      if (!res.ok) return;
      if (data.expiresAt) setExpiresAtIso(data.expiresAt);
      if (data.status === "PAID") {
        setOpen(false);
        setOrderId(null);
        setQrCodeContent(null);
        setQrImageDataUrl(null);
        setExpiresAtIso(null);
        router.refresh();
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [orderId, router]);

  async function downloadCard() {
    if (!qrImageDataUrl) {
      setErr("QR ยังไม่พร้อมสำหรับดาวน์โหลด");
      return;
    }
    setDownloading(true);
    setErr(null);
    try {
      const canvas = document.createElement("canvas");
      const w = 820;
      const h = 1120;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas context unavailable");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, w - 40, h - 40);

      ctx.fillStyle = "#0f172a";
      ctx.font = "700 46px sans-serif";
      const mawell = "MAWELL";
      const a = " A";
      const mawellW = ctx.measureText(mawell).width;
      const aW = ctx.measureText(a).width;
      const x = (w - mawellW - aW) / 2;
      ctx.fillStyle = "#0000BF";
      ctx.fillText(mawell, x, 110);
      ctx.fillStyle = "#dc2626";
      ctx.fillText(a, x + mawellW, 110);

      ctx.fillStyle = "#0f172a";
      ctx.font = "600 34px sans-serif";
      ctx.fillText("เติมโทเคนด้วยพร้อมเพย์", w / 2 - ctx.measureText("เติมโทเคนด้วยพร้อมเพย์").width / 2, 170);

      ctx.font = "400 26px sans-serif";
      const line = `สแกน QR Code แล้วโอน ${tokenPreview} บาท`;
      ctx.fillStyle = "#475569";
      ctx.fillText(line, w / 2 - ctx.measureText(line).width / 2, 215);

      const qrImg = new Image();
      qrImg.src = qrImageDataUrl;
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject(new Error("qr image load failed"));
      });
      const qrSize = 520;
      ctx.drawImage(qrImg, (w - qrSize) / 2, 250, qrSize, qrSize);

      ctx.fillStyle = "#0000BF";
      ctx.font = "700 34px sans-serif";
      const tok = `จะได้รับ ${tokenPreview} โทเคน`;
      ctx.fillText(tok, w / 2 - ctx.measureText(tok).width / 2, 840);

      ctx.fillStyle = "#b45309";
      ctx.font = "600 28px sans-serif";
      const cd = countdownText || "กำลังรอเวลา...";
      ctx.fillText(cd, w / 2 - ctx.measureText(cd).width / 2, 885);

      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `mawell-topup-${orderId ?? "qr"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("[topup popup] download failed", e);
      setErr("ไม่สามารถดาวน์โหลดรูปได้ กรุณาลองอีกครั้ง");
    } finally {
      setDownloading(false);
    }
  }

  const tokenPreview = useMemo(() => (amountBaht === "" ? 0 : Number(amountBaht)), [amountBaht]);

  return (
    <>
      <button
        type="button"
        className={
          triggerClassName ??
          "inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        }
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 p-4">
          <div
            ref={popupRef}
            className="mx-auto mt-10 w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">เติมโทเคนด้วยพร้อมเพย์</h3>
              {!orderId ? (
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                >
                  ปิด
                </button>
              ) : null}
            </div>

            {!orderId ? (
              <>
                <label className="mt-4 block text-sm font-medium text-slate-700">ยอดเงินที่ต้องการเติม (บาท)</label>
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={amountBaht}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAmountBaht(v === "" ? "" : Math.max(1, Math.min(100000, parseInt(v, 10) || 0)));
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                />
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[100, 200, 500, 1000, 2000, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmountBaht(preset)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void createOrder()}
                    className="flex-1 rounded-lg bg-[#0000BF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0000a3] disabled:opacity-60"
                  >
                    {loading ? "กำลังสร้าง QR..." : "สร้าง QR Code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    ยกเลิก
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">ค่าเริ่มต้น 100 บาท</p>
              </>
            ) : null}

            {orderId ? (
              <div className="mt-4">
                <div className="mb-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOrderId(null);
                      setQrCodeContent(null);
                      setQrImageDataUrl(null);
                      setExpiresAtIso(null);
                      setCountdownText("");
                      setErr(null);
                    }}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
                    title="แก้ไขจำนวนเงิน"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-sky-600 transition-colors hover:bg-sky-50"
                    onClick={() => void downloadCard()}
                    disabled={downloading}
                    title="ดาวน์โหลดทั้งหน้าเป็นรูป"
                  >
                    ⬇
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-rose-600 transition-colors hover:bg-rose-50"
                    onClick={() => setOpen(false)}
                    title="ปิด"
                  >
                    🗑
                  </button>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-center gap-3 border-b border-slate-200 pb-4">
                    <MawellLogo size="md" />
                  </div>
                  <h4 className="text-center text-lg font-semibold text-slate-900">เติมโทเคนด้วยพร้อมเพย์</h4>
                  <p className="mt-1 text-center text-sm text-slate-600">
                    สแกน QR Code ด้วยแอพธนาคาร แล้วโอน{" "}
                    <span className="font-semibold text-slate-900">{tokenPreview} บาท</span>
                  </p>
                  <div className="mt-4 flex justify-center">
                    {qrImageDataUrl ? (
                      <img src={qrImageDataUrl} alt="Payment QR" className="h-60 w-60 rounded-lg border border-slate-300 bg-white p-2" />
                    ) : (
                      <div className="flex h-60 w-60 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm text-slate-500">
                        กำลังสร้าง QR...
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-center text-xl font-semibold text-[#0000BF]">
                    จะได้รับ {tokenPreview} โทเคน
                  </p>
                  <p className="mt-1 text-center text-base font-medium text-amber-700">
                    {countdownText || "กำลังรอเวลา..."}
                  </p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void downloadCard()}
                    disabled={downloading}
                    className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
                  >
                    {downloading ? "กำลังดาวน์โหลด..." : "ดาวน์โหลดทั้งหน้าเป็นรูป"}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  ปิด
                </button>
              </div>
            ) : null}

            {err ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

