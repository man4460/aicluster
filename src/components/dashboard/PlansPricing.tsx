"use client";

import type { SubscriptionTier, SubscriptionType } from "@/generated/prisma/enums";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  PLAN_PRICES,
  PRICE_TO_TIER,
  TIER_SUBSCRIPTION_TOKEN_COST,
  computeBuffetSubscriptionTokenCharge,
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
  tokens,
}: Props) {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string | null>(null);
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
      const data = (await res.json()) as { error?: string; orderId?: string };
      if (!res.ok) {
        setErr(data.error ?? "สร้างคำสั่งซื้อไม่สำเร็จ");
        return;
      }
      setOrderId(data.orderId ?? null);
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
    setOrderId(null);
    router.refresh();
  }

  const isDev = process.env.NODE_ENV === "development";

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {PLAN_PRICES.map((price) => {
          const tier = PRICE_TO_TIER[price];
          const fullCost = TIER_SUBSCRIPTION_TOKEN_COST[tier];
          const bullets = tierGroupBullets(tier);
          const charge = computeBuffetSubscriptionTokenCharge({
            targetTier: tier,
            currentTier: subscriptionTier,
            subscriptionType,
          });
          const canSelect = charge.ok && tokens >= charge.tokensToDeduct;
          const disabledReason = !charge.ok ? charge.error : !canSelect ? "โทเคนไม่พอ" : null;

          return (
            <div
              key={price}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-3xl font-bold tabular-nums text-slate-900">
                {fullCost}
                <span className="text-base font-normal text-slate-500"> โทเคน</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">ราคาเต็มของแพ็กนี้</p>
              {charge.ok ? (
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
                  "mt-4 w-full rounded-lg bg-[#0000BF] py-2.5 text-sm font-semibold text-white hover:bg-[#0000a3] disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                {loading === price ? "กำลังสร้าง..." : "เลือกแพ็กเกจ"}
              </button>
            </div>
          );
        })}
      </div>

      {orderId ? (
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-medium">คำสั่งซื้อ: {orderId}</p>
          <p className="mt-1 text-xs">
            เมื่อชำระสำเร็จ ระบบจะหักโทเคนตามที่แสดงบนการ์ด — ในระบบจริงให้ส่งลูกค้าไปหน้าชำระ Melody แล้วให้ Melody callback ไปที่{" "}
            <code className="rounded bg-white px-1">POST /api/payments/melody/webhook</code>
          </p>
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
