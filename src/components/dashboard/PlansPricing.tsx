"use client";

import type { SubscriptionTier, SubscriptionType } from "@/generated/prisma/enums";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import {
  DAILY_LINE_PLAN_SUMMARY,
  MONTHLY_199_PLAN_FEATURE_LINES,
} from "@/lib/modules/config";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { useAppNoticePopup } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { isTokenDebtLocked, MODULE_MONTHLY_199_TOKEN_COST, tokenArrearsToClear } from "@/lib/tokens/token-debt";

type Props = {
  showUpgradeHint?: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionType: SubscriptionType;
  tokens: number;
  monthly199Slugs?: string[];
};

export function PlansPricing({
  showUpgradeHint,
  subscriptionType,
  tokens,
  monthly199Slugs: initialMonthly199Slugs = [],
}: Props) {
  const router = useRouter();
  const notice = useAppNoticePopup();
  const [err, setErr] = useState<string | null>(null);
  const [planBusy, setPlanBusy] = useState<"upgrade" | "downgrade" | null>(null);
  const [monthly199Slugs, setMonthly199Slugs] = useState(initialMonthly199Slugs);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpOrderId, setTopUpOrderId] = useState<string | null>(null);
  const [topUpQr, setTopUpQr] = useState<string | null>(null);
  const [topUpQrImg, setTopUpQrImg] = useState<string | null>(null);
  const [topUpWaiting, setTopUpWaiting] = useState(false);
  const [topUpBusy, setTopUpBusy] = useState(false);
  const [topUpErr, setTopUpErr] = useState<string | null>(null);
  const [amountBahtInput, setAmountBahtInput] = useState("");

  const arrears = tokenArrearsToClear(tokens);
  const locked = isTokenDebtLocked(tokens);
  const hasMonthly = monthly199Slugs.length > 0 || subscriptionType === "BUFFET";
  const isDailyLine = !hasMonthly;

  useEffect(() => {
    setMonthly199Slugs(initialMonthly199Slugs);
  }, [initialMonthly199Slugs]);

  const resetTopUpModal = useCallback(() => {
    setTopUpOrderId(null);
    setTopUpQr(null);
    setTopUpQrImg(null);
    setTopUpWaiting(false);
    setTopUpErr(null);
    setAmountBahtInput("");
  }, []);

  const closeTopUpModal = useCallback(() => {
    setTopUpOpen(false);
    resetTopUpModal();
  }, [resetTopUpModal]);

  function openTopUp(preset?: number) {
    setErr(null);
    const suggest = preset ?? (arrears > 0 ? arrears : 100);
    setAmountBahtInput(String(suggest));
    resetTopUpModal();
    setTopUpOpen(true);
  }

  async function createTopUpOrder() {
    const n = Number.parseInt(amountBahtInput.trim(), 10);
    if (!Number.isFinite(n) || n < 1 || n > 100_000) {
      setTopUpErr("กรอกยอดเติม 1–100000 บาท (1 บาท = 1 โทเคน)");
      return;
    }
    setTopUpBusy(true);
    setTopUpErr(null);
    try {
      const res = await fetch("/api/payments/melody/topup/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amountBaht: n }),
      });
      const data = (await res.json()) as { error?: string; orderId?: string; qrCodeContent?: string | null };
      if (!res.ok) {
        setTopUpErr(data.error ?? "สร้างคำสั่งเติมโทเคนไม่สำเร็จ");
        return;
      }
      setTopUpOrderId(data.orderId ?? null);
      setTopUpQr(data.qrCodeContent ?? null);
      setTopUpQrImg(null);
      setTopUpWaiting(Boolean(data.orderId));
    } finally {
      setTopUpBusy(false);
    }
  }

  const finishAfterTopUp = useCallback(() => {
    closeTopUpModal();
    router.refresh();
  }, [closeTopUpModal, router]);

  useEffect(() => {
    if (!topUpQr) {
      setTopUpQrImg(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(topUpQr, { margin: 1, width: 416 }).then((url) => {
      if (!cancelled) setTopUpQrImg(url);
    });
    return () => {
      cancelled = true;
    };
  }, [topUpQr]);

  useEffect(() => {
    if (!topUpOrderId || !topUpWaiting) return;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/melody/status/${topUpOrderId}`, { credentials: "include" });
        const data = (await res.json().catch(() => ({}))) as { paid?: boolean; status?: string };
        if (!res.ok) return;
        if (data.paid || data.status === "PAID") {
          setTopUpWaiting(false);
          finishAfterTopUp();
        }
      } catch {
        // ignore
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [topUpOrderId, topUpWaiting, finishAfterTopUp]);

  const isDev = process.env.NODE_ENV === "development";

  async function simulateTopUpPay() {
    if (!topUpOrderId) return;
    setTopUpErr(null);
    const res = await fetch("/api/payments/melody/simulate-pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderId: topUpOrderId }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setTopUpErr(data.error ?? "จำลองชำระไม่สำเร็จ");
      return;
    }
    setTopUpWaiting(false);
    finishAfterTopUp();
  }

  async function switchPlan(target: "daily" | "monthly199") {
    setErr(null);
    setPlanBusy(target === "monthly199" ? "upgrade" : "downgrade");
    try {
      const res = await fetch("/api/subscription/plan-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ target }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        monthly199Slugs?: string[];
        upgraded?: number;
        tokensCharged?: number;
        cleared?: number;
        alreadyDaily?: boolean;
      };
      if (!res.ok) {
        notice.error(data.error ?? "เปลี่ยนแพ็กไม่สำเร็จ", { title: "ไม่สำเร็จ" });
        return;
      }
      if (Array.isArray(data.monthly199Slugs)) {
        setMonthly199Slugs(data.monthly199Slugs);
      } else if (target === "daily") {
        setMonthly199Slugs([]);
      }
      if (target === "monthly199") {
        const n = data.upgraded ?? 0;
        notice.success(
          n > 0
            ? `อัปเกรด ${n} โมดูลเป็นแพ็ก 199 / เดือนแล้ว (หัก ${data.tokensCharged ?? n * MODULE_MONTHLY_199_TOKEN_COST} โทเคน)`
            : "โมดูลที่สมัครอยู่เป็นแพ็กรายเดือนอยู่แล้ว",
          { title: "อัปเกรดสำเร็จ" },
        );
      } else {
        notice.success(
          data.alreadyDaily
            ? "คุณใช้สายรายวันอยู่แล้ว"
            : `ดาวน์เกรดเป็นสายรายวันแล้ว (${data.cleared ?? 0} โมดูล) — ยังสมัครระบบเดิมไว้ หัก 1 บาท/วันเมื่อเข้าใช้`,
          { title: "ดาวน์เกรดสำเร็จ" },
        );
      }
      router.refresh();
    } finally {
      setPlanBusy(null);
    }
  }

  async function requestUpgrade() {
    if (locked) {
      notice.error("บัญชีถูกล็อค — ชำระค่าค้างก่อนอัปเกรด", { title: "อัปเกรดไม่ได้" });
      return;
    }
    const ok = await notice.confirm(
      `อัปเกรดโมดูลที่สมัครอยู่ทั้งหมดเป็นแพ็ก 199 / เดือน?\n\nหัก ${MODULE_MONTHLY_199_TOKEN_COST} โทเคนต่อโมดูล (โมดูลที่จ่ายรายเดือนแล้วจะไม่หักซ้ำ)\nถ้ายังไม่ได้สมัครระบบใด ให้ไปที่หน้า ระบบทั้งหมด ก่อน`,
      {
        title: "ยืนยันอัปเกรดเป็นสายรายเดือน",
        confirmLabel: "อัปเกรด",
        tone: "confirm",
      },
    );
    if (!ok) return;
    await switchPlan("monthly199");
  }

  async function requestDowngrade() {
    const ok = await notice.confirm(
      "ดาวน์เกรดเป็นสายรายวัน?\n\nยกเลิกแพ็ก 199 ของทุกโมดูล — ยังสมัครระบบเดิมไว้ และจะหัก 1 บาท/โมดูล/วันเมื่อเข้าใช้\nไม่คืนโทเคนที่จ่ายไปแล้วในงวดนี้",
      {
        title: "ยืนยันดาวน์เกรด",
        confirmLabel: "ดาวน์เกรด",
        tone: "warning",
      },
    );
    if (!ok) return;
    await switchPlan("daily");
  }

  const currentPlanLabel = hasMonthly
    ? monthly199Slugs.length > 0
      ? `สายรายเดือน (${monthly199Slugs.length} โมดูล)`
      : "สายรายเดือน"
    : "สายรายวัน";

  return (
    <div>
      {notice.popup}

      <div className="mb-4 grid gap-2.5 rounded-2xl border border-[#d8d6ec] bg-[#faf9ff]/85 p-3.5 text-sm text-[#2e2a58] sm:grid-cols-3 sm:p-4">
        <div className="rounded-xl border border-[#ebe9ff] bg-white/85 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#66638c]">โทเคนคงเหลือ</p>
          <p className="mt-1 tabular-nums text-lg font-bold text-[#0000BF]">{tokens.toLocaleString("th-TH")} โทเคน</p>
        </div>
        <div className="rounded-xl border border-[#ebe9ff] bg-white/85 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#66638c]">แพ็กปัจจุบัน</p>
          <p className="mt-1 text-sm font-semibold text-[#2e2a58]">{currentPlanLabel}</p>
          <p className="mt-0.5 text-[11px] text-[#66638c]">
            {locked ? "ถูกล็อค — ต้องชำระค่าค้าง" : arrears > 0 ? `ติดค้าง ${arrears} บาท` : "ใช้งานได้"}
          </p>
        </div>
        <div className="rounded-xl border border-[#ebe9ff] bg-white/85 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#66638c]">เติมโทเคน</p>
          <button
            type="button"
            onClick={() => openTopUp(arrears > 0 ? arrears : 100)}
            className="mt-1 text-sm font-semibold text-[#0000BF] underline-offset-2 hover:underline"
          >
            {arrears > 0 ? `ชำระค่าค้าง ${arrears} บาท` : "เปิด QR เติมโทเคน"}
          </button>
        </div>
      </div>

      {locked ? (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950" role="alert">
          <p className="font-semibold">บัญชีถูกล็อคเพราะติดค้างเกิน 100 บาท</p>
          <p className="mt-1">
            เติมอย่างน้อย {arrears} บาท (1 บาท = 1 โทเคน) จนยอดไม่ติดลบ จึงเข้าใช้ระบบต่อได้
          </p>
        </div>
      ) : null}

      {showUpgradeHint ? (
        <div
          className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <p className="font-semibold">ต้องการสิทธิ์เพิ่ม?</p>
          <p className="mt-1">
            อัปเกรดเป็นสายรายเดือน (แพ็ก 199 ต่อโมดูล) ด้านล่าง หรือสมัครทีละระบบที่หน้า{" "}
            <Link href="/dashboard/modules" className="font-semibold underline-offset-2 hover:underline">
              ระบบทั้งหมด
            </Link>
          </p>
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={planBusy != null || locked}
          onClick={() => void requestUpgrade()}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:min-w-[200px]"
        >
          {planBusy === "upgrade" ? "กำลังอัปเกรด..." : "อัปเกรดเป็นสายรายเดือน"}
        </button>
        <button
          type="button"
          disabled={planBusy != null || !hasMonthly}
          onClick={() => void requestDowngrade()}
          className={cn(
            "inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:min-w-[200px]",
            hasMonthly
              ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              : "border-slate-200 bg-slate-50 text-slate-500",
          )}
          title={hasMonthly ? undefined : "คุณใช้สายรายวันอยู่แล้ว — ปุ่มนี้ใช้เมื่อมีแพ็กรายเดือน"}
        >
          {planBusy === "downgrade" ? "กำลังดาวน์เกรด..." : "ดาวน์เกรดเป็นสายรายวัน"}
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div
          className={cn(
            "flex flex-col rounded-2xl border-2 bg-gradient-to-b from-indigo-50/90 to-white p-5 shadow-sm ring-1 ring-indigo-100/80",
            isDailyLine ? "border-[#0000BF]/35" : "border-[#0000BF]/15",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-lg font-bold text-[#2e2a58]">{DAILY_LINE_PLAN_SUMMARY.title}</p>
              <p className="mt-1 text-xs font-semibold text-[#66638c]">{DAILY_LINE_PLAN_SUMMARY.subtitle}</p>
            </div>
            {isDailyLine ? (
              <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800 ring-1 ring-emerald-200/80">
                แพ็กปัจจุบัน
              </span>
            ) : null}
          </div>
          <ul className="mt-3 flex-1 space-y-1.5 text-xs leading-relaxed text-slate-600">
            {DAILY_LINE_PLAN_SUMMARY.lines.map((line, i) => (
              <li key={i}>• {line}</li>
            ))}
          </ul>
          {hasMonthly ? (
            <button
              type="button"
              disabled={planBusy != null}
              onClick={() => void requestDowngrade()}
              className="mt-4 inline-flex justify-center rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
            >
              {planBusy === "downgrade" ? "กำลังดาวน์เกรด..." : "ดาวน์เกรดเป็นสายรายวัน"}
            </button>
          ) : (
            <Link
              href="/dashboard/modules"
              className="mt-4 inline-flex justify-center rounded-lg bg-[#0000BF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0000a3]"
            >
              สมัครโมดูล (1 บาท/วัน)
            </Link>
          )}
        </div>

        <div
          className={cn(
            "flex flex-col rounded-2xl border bg-gradient-to-b from-white via-[#faf9ff] to-[#fff6fc] p-5 shadow-sm",
            hasMonthly ? "border-[#0000BF]/35 ring-1 ring-indigo-100/80" : "border-[#d6d2ff]/75",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-lg font-bold text-[#2e2a58]">สายรายเดือน · แพ็ก 199 / โมดูล</p>
              <p className="mt-1 text-xs font-semibold text-[#66638c]">ไม่เหมาทั้งระบบ — หักต่อโมดูลที่สมัคร</p>
            </div>
            {hasMonthly ? (
              <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800 ring-1 ring-emerald-200/80">
                แพ็กปัจจุบัน
              </span>
            ) : null}
          </div>
          <ul className="mt-3 flex-1 space-y-1.5 text-xs leading-relaxed text-slate-600">
            {MONTHLY_199_PLAN_FEATURE_LINES.map((line, i) => (
              <li key={i}>• {line}</li>
            ))}
          </ul>
          {isDailyLine ? (
            <button
              type="button"
              disabled={planBusy != null || locked}
              onClick={() => void requestUpgrade()}
              className="mt-4 inline-flex justify-center rounded-lg bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50"
            >
              {planBusy === "upgrade" ? "กำลังอัปเกรด..." : "อัปเกรดเป็นสายรายเดือน"}
            </button>
          ) : (
            <Link
              href="/dashboard/modules"
              className="mt-4 inline-flex justify-center rounded-lg border border-[#0000BF]/25 bg-white px-4 py-2.5 text-sm font-semibold text-[#2e2a58] hover:bg-indigo-50"
            >
              จัดการโมดูลที่สมัคร
            </Link>
          )}
        </div>
      </div>

      <FormModal
        open={topUpOpen}
        onClose={closeTopUpModal}
        title="เติมโทเคน"
        description="1 บาท = 1 โทเคน — ถ้าติดค้างให้เติมจนยอดไม่ติดลบจึงปลดล็อค"
        footer={
          <FormModalFooterActions
            onCancel={closeTopUpModal}
            submitLabel={topUpOrderId ? "ปิด" : "สร้าง QR ชำระ"}
            submitDisabled={topUpBusy}
            loading={topUpBusy}
            onSubmit={() => {
              if (topUpOrderId) closeTopUpModal();
              else void createTopUpOrder();
            }}
          />
        }
      >
        <div className="space-y-4 text-sm">
          {!topUpOrderId ? (
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">ยอดเติม (บาท)</span>
              <input
                type="number"
                min={1}
                max={100_000}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 tabular-nums outline-none focus:border-[#4d47b6]/40 focus:ring-2 focus:ring-[#4d47b6]/15"
                value={amountBahtInput}
                onChange={(e) => setAmountBahtInput(e.target.value)}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {[arrears > 0 ? arrears : null, 100, 199, 300, 500]
                  .filter((n): n is number => n != null)
                  .filter((n, i, arr) => arr.indexOf(n) === i)
                  .map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmountBahtInput(String(preset))}
                      className="app-tap-feedback rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      +{preset}
                    </button>
                  ))}
              </div>
            </label>
          ) : null}
          {topUpErr ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {topUpErr}
            </p>
          ) : null}
          {topUpQr ? (
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              {topUpQrImg ? (
                <Image
                  src={topUpQrImg}
                  alt="QR เติมโทเคน"
                  width={208}
                  height={208}
                  unoptimized
                  className="mx-auto h-52 w-52 rounded-md"
                />
              ) : (
                <p className="text-center text-xs text-slate-500">กำลังสร้าง QR...</p>
              )}
              <p className="mt-2 text-center text-xs text-slate-600">
                {topUpWaiting ? "รอชำระ — ระบบจะรีเฟรชยอดอัตโนมัติ" : "ชำระแล้ว"}
              </p>
              {isDev && topUpOrderId ? (
                <button
                  type="button"
                  onClick={() => void simulateTopUpPay()}
                  className="mt-3 w-full rounded-lg border border-blue-300 bg-blue-50 py-2 text-xs font-semibold text-blue-900"
                >
                  จำลองชำระสำเร็จ (dev)
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </FormModal>

      {err ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}
