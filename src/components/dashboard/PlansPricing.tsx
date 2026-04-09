"use client";

import type { SubscriptionTier, SubscriptionType } from "@/generated/prisma/enums";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import QRCode from "qrcode";
import {
  DAILY_LINE_PLAN_SUMMARY,
  MODULE_GROUP_TIER_NAME,
  PLAN_PRICES,
  PRICE_TO_TIER,
  TIER_SUBSCRIPTION_TOKEN_COST,
  buffetTierMaxGroup,
  computeBuffetSubscriptionTokenCharge,
  isBuffetTierOpenForPurchase,
  tierGroupBullets,
} from "@/lib/module-permissions";

type Props = {
  showUpgradeHint?: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionType: SubscriptionType;
  tokens: number;
};

export function PlansPricing({
  showUpgradeHint,
  subscriptionTier,
  subscriptionType,
}: Props) {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [qrCodeContent, setQrCodeContent] = useState<string | null>(null);
  const [qrImageDataUrl, setQrImageDataUrl] = useState<string | null>(null);
  const [waitingPayment, setWaitingPayment] = useState(false);
  const [loading, setLoading] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function selectPlan(price: number) {
    setErr(null);
    setLoading(price);
    try {
      const res = await fetch("/api/payments/melody/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amountBaht: price }),
      });
      const data = (await res.json()) as {
        error?: string;
        orderId?: string;
        qrCodeContent?: string | null;
      };
      if (!res.ok) {
        setErr(data.error ?? "สร้างคำสั่งซื้อไม่สำเร็จ");
        return;
      }
      const nextOrderId = data.orderId ?? null;
      setOrderId(nextOrderId);
      setQrCodeContent(data.qrCodeContent ?? null);
      setQrImageDataUrl(null);
      setWaitingPayment(Boolean(nextOrderId));
    } finally {
      setLoading(null);
    }
  }

  async function simulatePay() {
    if (!orderId) return;
    setErr(null);
    const res = await fetch("/api/payments/melody/simulate-pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderId }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setErr(data.error ?? "จำลองชำระไม่สำเร็จ");
      return;
    }
    setQrCodeContent(null);
    setQrImageDataUrl(null);
    setWaitingPayment(false);
    setOrderId(null);
    router.refresh();
  }

  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    let done = false;
    if (!qrCodeContent) {
      setQrImageDataUrl(null);
      return;
    }
    (async () => {
      try {
        const dataUrl = await QRCode.toDataURL(qrCodeContent, { margin: 1, width: 280 });
        if (!done) setQrImageDataUrl(dataUrl);
      } catch {
        if (!done) setQrImageDataUrl(null);
      }
    })();
    return () => {
      done = true;
    };
  }, [qrCodeContent]);

  useEffect(() => {
    if (!orderId || !waitingPayment) return;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/melody/status/${orderId}`, { credentials: "include" });
        const data = (await res.json().catch(() => ({}))) as { status?: string };
        if (!res.ok) return;
        if (data.status === "PAID") {
          setWaitingPayment(false);
          setOrderId(null);
          setQrCodeContent(null);
          setQrImageDataUrl(null);
          router.refresh();
        }
      } catch {
        // ignore transient poll errors
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [orderId, waitingPayment, router]);

  return (
    <div>
      {showUpgradeHint ? (
        <div
          className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <p className="font-semibold">ต้องการสิทธิ์เพิ่ม?</p>
          <p className="mt-1 text-amber-900/90">
            โมดูลนี้อยู่นอกแพ็กเกจหรือกลุ่มที่คุณใช้ได้ — เลือกแพ็กเกจด้านล่างเพื่ออัปเกรดการเข้าถึงกลุ่มโมดูล
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col rounded-2xl border-2 border-[#0000BF]/20 bg-gradient-to-b from-indigo-50/90 to-white p-5 shadow-sm ring-1 ring-indigo-100/80">
          <p className="text-lg font-bold text-[#2e2a58]">{DAILY_LINE_PLAN_SUMMARY.title}</p>
          <p className="mt-1 text-xs text-slate-600">{DAILY_LINE_PLAN_SUMMARY.subtitle}</p>
          <ul className="mt-3 flex-1 space-y-1.5 text-xs leading-relaxed text-slate-600">
            {DAILY_LINE_PLAN_SUMMARY.lines.map((line, i) => (
              <li key={i}>• {line}</li>
            ))}
          </ul>
          {subscriptionType === "DAILY" ? (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-800">
              คุณใช้สายรายวันอยู่
            </p>
          ) : subscriptionType === "BUFFET" && subscriptionTier !== "NONE" ? (
            <p className="mt-4 text-center text-xs text-slate-600">
              คุณใช้แพ็กเหมารายเดือน — ปรับระดับได้จากการ์ดด้านข้าง (เปิดรับสมัครเฉพาะ 199 โทเคน)
            </p>
          ) : (
            <p className="mt-4 text-center text-xs text-slate-500">
              ต้องการรายเดือนเลือกการ์ด &quot;แพ็กเหมา&quot; ด้านข้าง · เปลี่ยนกลับมาสายรายวันติดต่อแอดมิน
            </p>
          )}
        </div>

        {PLAN_PRICES.map((price) => {
          const tier = PRICE_TO_TIER[price];
          const fullCost = TIER_SUBSCRIPTION_TOKEN_COST[tier];
          const maxG = buffetTierMaxGroup(tier);
          const packTierName = MODULE_GROUP_TIER_NAME[maxG] ?? "";
          const bullets = tierGroupBullets(tier);
          const tierOpen = isBuffetTierOpenForPurchase(tier);
          const charge = computeBuffetSubscriptionTokenCharge({
            targetTier: tier,
            currentTier: subscriptionTier,
            subscriptionType,
          });
          const canSelect = charge.ok && tierOpen;
          const disabledReason = !tierOpen
            ? "ปิดจำหน่ายชั่วคราว — เปิดเฉพาะแพ็ก 199 โทเคน"
            : !charge.ok
              ? charge.error
              : null;

          return (
            <div
              key={price}
              className={cn(
                "flex flex-col rounded-2xl border bg-white p-5 shadow-sm",
                tierOpen ? "border-slate-200" : "border-slate-200/80 bg-slate-50/80 opacity-90",
              )}
            >
              <p className="text-3xl font-bold tabular-nums text-slate-900">
                {fullCost}
                <span className="text-base font-normal text-slate-500"> โทเคน</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                แพ็กเหมา · กลุ่ม 1{maxG > 1 ? `–${maxG}` : ""}
                {packTierName ? ` (${packTierName})` : ""}
              </p>
              {!tierOpen ? (
                <p className="mt-2 text-xs font-medium text-amber-800">ปิดจำหน่ายชั่วคราว</p>
              ) : charge.ok ? (
                <p
                  className={cn(
                    "mt-2 text-sm font-medium",
                    charge.tokensToDeduct < fullCost ? "text-emerald-700" : "text-slate-800",
                  )}
                >
                  {charge.tokensToDeduct < fullCost
                    ? `อัปเกรด: หัก ${charge.tokensToDeduct} โทเคน (ส่วนต่าง)`
                    : `สมัคร: หัก ${charge.tokensToDeduct} โทเคน`}
                </p>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-amber-800">{charge.error}</p>
              )}
              <ul className="mt-3 flex-1 space-y-1 text-xs text-slate-600">
                {bullets.map((line, i) => (
                  <li key={i}>• {line}</li>
                ))}
              </ul>
              <button
                type="button"
                disabled={loading === price || !canSelect}
                title={disabledReason ?? undefined}
                onClick={() => selectPlan(price)}
                className={cn(
                  "mt-4 w-full rounded-lg py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55",
                  tierOpen
                    ? "bg-[#0000BF] text-white hover:bg-[#0000a3]"
                    : "border border-slate-300 bg-slate-100 text-slate-500",
                )}
              >
                {loading === price
                  ? "กำลังสร้าง..."
                  : !tierOpen
                    ? "ไม่เปิดรับสมัคร"
                    : "เลือกแพ็กเกจ"}
              </button>
            </div>
          );
        })}
      </div>

      {orderId ? (
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-medium">คำสั่งซื้อ: {orderId}</p>
          {qrCodeContent ? (
            <p className="mt-1 text-xs">
              สแกน QR เพื่อชำระเงิน จากนั้นระบบจะอัปเดตสถานะและรีเฟรชโทเคนอัตโนมัติ
            </p>
          ) : (
            <p className="mt-1 text-xs">
              เมื่อชำระสำเร็จ ระบบจะหักโทเคนตามที่แสดงบนการ์ด — ในระบบจริงให้ส่ง callback เข้า{" "}
              <code className="rounded bg-white px-1">POST /api/payments/melody/webhook</code>
            </p>
          )}
          {qrCodeContent ? (
            <div className="mt-3 rounded-lg border border-blue-200 bg-white p-3">
              {qrImageDataUrl ? (
                <img src={qrImageDataUrl} alt="Melody payment QR" className="mx-auto h-56 w-56 rounded-md" />
              ) : (
                <p className="text-xs text-slate-500">กำลังสร้างภาพ QR...</p>
              )}
              <p className="mt-2 text-center text-xs text-slate-500">
                {waitingPayment ? "รอยืนยันการชำระเงิน..." : "ชำระเงินแล้ว"}
              </p>
            </div>
          ) : null}
          {isDev ? (
            <button
              type="button"
              onClick={simulatePay}
              className="mt-3 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-900 hover:bg-blue-100"
            >
              จำลองชำระเงินสำเร็จ (dev)
            </button>
          ) : null}
        </div>
      ) : null}

      {err ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}
