"use client";

import type { SubscriptionTier, SubscriptionType } from "@/generated/prisma/enums";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { dashboardModuleHref } from "@/lib/dashboard-nav";
import { MODULE_MONTHLY_199_TOKEN_COST, isTokenDebtLocked, tokenArrearsToClear } from "@/lib/tokens/token-debt";

export type PlansModuleRow = {
  id: string;
  slug: string;
  title: string;
  /** โมดูลฟรี — ไม่หักรายวัน/รายเดือน */
  tokenFree: boolean;
  plan: "daily" | "monthly199" | "free";
};

type Props = {
  showUpgradeHint?: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionType: SubscriptionType;
  tokens: number;
  modules: PlansModuleRow[];
};

export function PlansPricing({ showUpgradeHint, tokens, modules: initialModules }: Props) {
  const router = useRouter();
  const notice = useAppNoticePopup();
  const [modules, setModules] = useState(initialModules);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "daily" | "monthly">("all");
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

  useEffect(() => {
    setModules(initialModules);
  }, [initialModules]);

  const counts = useMemo(() => {
    let daily = 0;
    let monthly = 0;
    let free = 0;
    for (const m of modules) {
      if (m.plan === "monthly199") monthly += 1;
      else if (m.plan === "free") free += 1;
      else daily += 1;
    }
    return { daily, monthly, free, total: modules.length };
  }, [modules]);

  const visible = useMemo(() => {
    if (filter === "daily") return modules.filter((m) => m.plan === "daily");
    if (filter === "monthly") return modules.filter((m) => m.plan === "monthly199");
    return modules;
  }, [modules, filter]);

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

  async function switchModulePlan(mod: PlansModuleRow, target: "daily" | "monthly199") {
    if (mod.tokenFree || mod.plan === "free") return;
    if (target === "monthly199" && locked) {
      notice.error("บัญชีถูกล็อค — ชำระค่าค้างก่อนอัปเกรด", { title: "อัปเกรดไม่ได้" });
      return;
    }

    const ok = await notice.confirm(
      target === "monthly199"
        ? `อัปเกรด «${mod.title}» เป็นแพ็กรายเดือน?\n\nหัก ${MODULE_MONTHLY_199_TOKEN_COST} โทเคน · ไม่หัก 1 บาท/วันของโมดูลนี้`
        : `ดาวน์เกรด «${mod.title}» เป็นสายรายวัน?\n\nยังสมัครโมดูลนี้ไว้ — จะหัก 1 บาท/วันเมื่อเข้าใช้\nไม่คืนโทเคนที่จ่ายไปแล้วในงวดนี้`,
      {
        title: target === "monthly199" ? "ยืนยันอัปเกรด" : "ยืนยันดาวน์เกรด",
        confirmLabel: target === "monthly199" ? "อัปเกรด" : "ดาวน์เกรด",
        tone: target === "monthly199" ? "confirm" : "warning",
      },
    );
    if (!ok) return;

    setBusySlug(mod.slug);
    try {
      const res = await fetch("/api/subscription/plan-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ target, moduleSlug: mod.slug }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        alreadyHad?: boolean;
        alreadyDaily?: boolean;
        tokensCharged?: number;
        monthly199Slugs?: string[];
      };
      if (!res.ok) {
        notice.error(data.error ?? "เปลี่ยนแพ็กไม่สำเร็จ", { title: "ไม่สำเร็จ" });
        return;
      }

      const monthlySet = new Set(Array.isArray(data.monthly199Slugs) ? data.monthly199Slugs : []);
      setModules((prev) =>
        prev.map((row) => {
          if (row.tokenFree) return { ...row, plan: "free" as const };
          if (Array.isArray(data.monthly199Slugs)) {
            return {
              ...row,
              plan: monthlySet.has(row.slug) ? ("monthly199" as const) : ("daily" as const),
            };
          }
          if (row.slug !== mod.slug) return row;
          return {
            ...row,
            plan: target === "monthly199" ? ("monthly199" as const) : ("daily" as const),
          };
        }),
      );

      if (target === "monthly199") {
        notice.success(
          data.alreadyHad
            ? `«${mod.title}» เป็นแพ็กรายเดือนอยู่แล้ว`
            : `อัปเกรด «${mod.title}» สำเร็จ — หัก ${data.tokensCharged ?? MODULE_MONTHLY_199_TOKEN_COST} โทเคน`,
          { title: "อัปเกรดแล้ว" },
        );
      } else {
        notice.success(
          data.alreadyDaily
            ? `«${mod.title}» เป็นสายรายวันอยู่แล้ว`
            : `ดาวน์เกรด «${mod.title}» เป็นสายรายวันแล้ว`,
          { title: "ดาวน์เกรดแล้ว" },
        );
      }
      router.refresh();
    } finally {
      setBusySlug(null);
    }
  }

  return (
    <div className="space-y-4">
      {notice.popup}

      <div className="grid gap-2.5 rounded-2xl border border-[#d8d6ec] bg-[#faf9ff]/85 p-3.5 text-sm text-[#2e2a58] sm:grid-cols-3 sm:p-4">
        <div className="rounded-xl border border-[#ebe9ff] bg-white/85 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#66638c]">โทเคนคงเหลือ</p>
          <p className="mt-1 tabular-nums text-lg font-bold text-[#0000BF]">{tokens.toLocaleString("th-TH")} โทเคน</p>
        </div>
        <div className="rounded-xl border border-[#ebe9ff] bg-white/85 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#66638c]">โมดูลที่สมัคร</p>
          <p className="mt-1 text-sm font-semibold text-[#2e2a58]">
            {counts.total} ระบบ
            <span className="mt-0.5 block text-[11px] font-medium text-[#66638c]">
              รายวัน {counts.daily} · รายเดือน {counts.monthly}
              {counts.free > 0 ? ` · ฟรี ${counts.free}` : ""}
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-[#ebe9ff] bg-white/85 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#66638c]">เติมโทเคน</p>
          <button
            type="button"
            onClick={() => openTopUp(arrears > 0 ? arrears : 100)}
            className="mt-1 text-sm font-semibold text-[#0000BF] underline-offset-2 hover:underline"
          >
            {arrears > 0 ? `ชำระค่าค้าง ${arrears} บาท` : locked ? "บัญชีถูกล็อค — เติมโทเคน" : "เปิด QR เติมโทเคน"}
          </button>
        </div>
      </div>

      {locked ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950" role="alert">
          <p className="font-semibold">บัญชีถูกล็อคเพราะติดค้างเกิน 100 บาท</p>
          <p className="mt-1">เติมอย่างน้อย {arrears} บาท จนยอดไม่ติดลบ จึงอัปเกรดหรือเข้าใช้ระบบต่อได้</p>
        </div>
      ) : null}

      {showUpgradeHint ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="status">
          <p className="font-semibold">ต้องการสิทธิ์เพิ่ม?</p>
          <p className="mt-1">อัปเกรดเป็นแพ็กรายเดือนทีละโมดูลด้านล่าง หรือสมัครระบบใหม่ที่หน้า ระบบทั้งหมด</p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#0000BF]/15 bg-gradient-to-b from-indigo-50/80 to-white p-4 text-xs leading-relaxed text-slate-600">
          <p className="text-sm font-bold text-[#2e2a58]">สายรายวัน</p>
          <p className="mt-1">หัก 1 โทเคน / โมดูล / วัน (เวลาไทย) เมื่อเข้าใช้</p>
        </div>
        <div className="rounded-2xl border border-[#d6d2ff]/80 bg-gradient-to-b from-white to-[#fff6fc] p-4 text-xs leading-relaxed text-slate-600">
          <p className="text-sm font-bold text-[#2e2a58]">สายรายเดือน · 199 / โมดูล</p>
          <p className="mt-1">หัก {MODULE_MONTHLY_199_TOKEN_COST} โทเคน / เดือน · ไม่หักรายวัน · ปลดโควต้า/ฟีเจอร์ตามโมดูล</p>
        </div>
      </div>

      <AppDashboardSection className="!rounded-[1.5rem] border border-[#e8e6fc]/90 bg-white/80 p-3.5 sm:p-5">
        <AppSectionHeader
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          title="โมดูลที่สมัคร"
          description="อัปเกรดหรือดาวน์เกรดทีละระบบตามที่ต้องการ"
          action={
            <Link
              href="/dashboard/modules"
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#0000BF]/20 bg-[#0000BF]/8 px-3 text-xs font-bold text-[#2e2a58] hover:bg-[#0000BF]/12"
            >
              + สมัครระบบ
            </Link>
          }
        />

        {modules.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="กรองแพ็กโมดูล">
            {(
              [
                ["all", `ทั้งหมด · ${counts.total}`],
                ["daily", `รายวัน · ${counts.daily}`],
                ["monthly", `รายเดือน · ${counts.monthly}`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                className={cn(
                  "min-h-8 rounded-lg px-2.5 text-[11px] font-bold transition sm:min-h-9 sm:px-3 sm:text-xs",
                  filter === key
                    ? "bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] text-white"
                    : "border border-[#e0ddf5] bg-white/90 text-[#4d47b6] hover:bg-indigo-50",
                )}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-4 space-y-2.5">
          {modules.length === 0 ? (
            <AppEmptyState>
              ยังไม่ได้สมัครระบบใด —{" "}
              <Link href="/dashboard/modules" className="font-bold text-[#0000BF] underline-offset-2 hover:underline">
                ไปหน้า ระบบทั้งหมด
              </Link>
            </AppEmptyState>
          ) : visible.length === 0 ? (
            <AppEmptyState>ไม่มีโมดูลในตัวกรองนี้</AppEmptyState>
          ) : (
            visible.map((mod) => {
              const busy = busySlug === mod.slug;
              const isMonthly = mod.plan === "monthly199";
              const isFree = mod.plan === "free";
              return (
                <article
                  key={mod.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-[1.25rem] border border-l-[3px] bg-white/90 p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4",
                    isMonthly
                      ? "border-l-violet-500 border-violet-100 bg-violet-50/40"
                      : isFree
                        ? "border-l-emerald-500 border-emerald-100 bg-emerald-50/35"
                        : "border-l-sky-500 border-sky-100 bg-sky-50/35",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={dashboardModuleHref(mod.slug)}
                        className="truncate text-sm font-black text-[#1e1b4b] hover:text-[#0000BF] sm:text-base"
                      >
                        {mod.title}
                      </Link>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
                          isMonthly
                            ? "bg-violet-50 text-violet-800 ring-violet-200"
                            : isFree
                              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                              : "bg-sky-50 text-sky-800 ring-sky-200",
                        )}
                      >
                        {isMonthly ? "สายรายเดือน" : isFree ? "ฟรี" : "สายรายวัน"}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-[#66638c]">
                      {isMonthly
                        ? `หัก ${MODULE_MONTHLY_199_TOKEN_COST} โทเคน / เดือน · ไม่หักรายวัน`
                        : isFree
                          ? "ไม่หักโทเคน"
                          : "หัก 1 โทเคน / วัน เมื่อเข้าใช้"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    {isFree ? (
                      <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                        ไม่ต้องอัปเกรด
                      </span>
                    ) : isMonthly ? (
                      <button
                        type="button"
                        disabled={busy || busySlug != null}
                        onClick={() => void switchModulePlan(mod, "daily")}
                        className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                      >
                        {busy ? "กำลังดาวน์เกรด..." : "ดาวน์เกรดเป็นรายวัน"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy || busySlug != null || locked}
                        onClick={() => void switchModulePlan(mod, "monthly199")}
                        className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] px-3 text-xs font-bold text-white hover:brightness-95 disabled:opacity-50"
                      >
                        {busy ? "กำลังอัปเกรด..." : `อัปเกรดรายเดือน · ${MODULE_MONTHLY_199_TOKEN_COST}`}
                      </button>
                    )}
                    <Link
                      href={dashboardModuleHref(mod.slug)}
                      className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-white/70 bg-white/90 px-3 text-xs font-bold text-[#4d47b6] ring-1 ring-[#e8e6fc] hover:bg-indigo-50"
                    >
                      เปิดใช้
                    </Link>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </AppDashboardSection>

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
    </div>
  );
}
