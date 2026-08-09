"use client";

import { useEffect, useState } from "react";
import {
  AppEmptyState,
  LoyaltyRewardMenuCard,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import type { FootballTurfCustomerUsageStats } from "@/systems/football-turf/lib/loyalty-rule";
import type { FootballTurfLoyaltyRewardDto } from "@/systems/football-turf/lib/loyalty-rule";
import { footballTurfInteractiveButtonClass } from "@/systems/football-turf/lib/ui-tokens";

type Props = {
  open: boolean;
  phone: string | null;
  onClose: () => void;
};

function formatMoney(n: number) {
  return `฿${Math.round(n).toLocaleString("th-TH")}`;
}

export function FootballTurfCustomerStatsModal({ open, phone, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [stats, setStats] = useState<FootballTurfCustomerUsageStats | null>(null);
  const [rewards, setRewards] = useState<FootballTurfLoyaltyRewardDto[]>([]);
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [redeemBusyId, setRedeemBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !phone) {
      setStats(null);
      setError(null);
      setInfo(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setInfo(null);
    void (async () => {
      try {
        const [statsRes, loyRes] = await Promise.all([
          fetch(`/api/football-turf/session/customer-stats?phone=${encodeURIComponent(phone)}`, {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/football-turf/session/loyalty", { credentials: "include", cache: "no-store" }),
        ]);
        const sj = (await statsRes.json().catch(() => ({}))) as {
          stats?: FootballTurfCustomerUsageStats;
          error?: string;
        };
        const lj = (await loyRes.json().catch(() => ({}))) as {
          settings?: { enabled?: boolean };
          rewards?: FootballTurfLoyaltyRewardDto[];
        };
        if (!statsRes.ok) throw new Error(sj.error ?? "โหลดสถิติไม่สำเร็จ");
        if (cancelled) return;
        setStats(sj.stats ?? null);
        setLoyaltyEnabled(Boolean(lj.settings?.enabled));
        setRewards(Array.isArray(lj.rewards) ? lj.rewards.filter((r) => r.is_active) : []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, phone]);

  async function redeem(rewardId: number) {
    if (!stats) return;
    setRedeemBusyId(rewardId);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/football-turf/session/loyalty", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "redeem",
          phone: stats.phone,
          reward_id: rewardId,
          customer_name: stats.name,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        member?: { points_balance: number; total_redeemed: number };
        reward?: { title: string };
        pointsSpent?: number;
      };
      if (!res.ok) throw new Error(j.error ?? "แลกไม่สำเร็จ");
      setInfo(`แลก «${j.reward?.title ?? "รางวัล"}» แล้ว (−${j.pointsSpent ?? 0} คะแนน)`);
      if (j.member) {
        setStats((s) =>
          s
            ? {
                ...s,
                pointsBalance: j.member!.points_balance,
                totalRedeemed: j.member!.total_redeemed,
              }
            : s,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "แลกไม่สำเร็จ");
    } finally {
      setRedeemBusyId(null);
    }
  }

  return (
    <FormModal
      open={open}
      onClose={onClose}
      size="lg"
      title="สถิติลูกค้า"
      description={stats ? `${stats.name || "ลูกค้า"} · ${stats.phone}` : phone ?? undefined}
      footer={<FormModalFooterActions onCancel={onClose} submitLabel="ปิด" onSubmit={onClose} />}
    >
      {loading && !stats ? (
        <p className="text-sm font-semibold text-[#66638c]">กำลังโหลด…</p>
      ) : !stats ? (
        <AppEmptyState tone="violet">ไม่พบข้อมูลลูกค้า</AppEmptyState>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/60 bg-white/70 px-3 py-2.5">
            <p className="font-black text-[#1e1b4b]">{stats.name || "—"}</p>
            <p className="text-xs font-semibold text-[#66638c]">
              {stats.phone}
              {stats.teamName ? ` · ${stats.teamName}` : ""}
            </p>
            {stats.note ? <p className="mt-1 text-[11px] font-medium text-[#8b87b8]">{stats.note}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "จองทั้งหมด", value: String(stats.bookingCount) },
              { label: "เสร็จสิ้น", value: String(stats.completedCount) },
              { label: "ยอดชำระ", value: formatMoney(stats.totalPaidBaht) },
              { label: "คะแนนคงเหลือ", value: String(stats.pointsBalance) },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/60 bg-white/80 px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{item.label}</p>
                <p className="mt-1 text-base font-black tabular-nums text-[#1e1b4b]">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-[#66638c] sm:grid-cols-3">
            <span>สะสมรวม {stats.totalEarned.toLocaleString("th-TH")} คะแนน</span>
            <span>แลกแล้ว {stats.totalRedeemed.toLocaleString("th-TH")} คะแนน</span>
            <span>ขายโปร {stats.promotionSaleCount} · {formatMoney(stats.promotionPaidBaht)}</span>
          </div>

          {loyaltyEnabled && rewards.length > 0 ? (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">แลกรางวัล</p>
              <ul className="mt-2 space-y-1.5">
                {rewards.map((r) => (
                  <LoyaltyRewardMenuCard
                    key={r.id}
                    title={r.title}
                    pointsCost={r.points_cost}
                    imageUrl={r.image_url}
                    disabled={stats.pointsBalance < r.points_cost || redeemBusyId != null}
                    busy={redeemBusyId === r.id}
                    onRedeem={() => void redeem(r.id)}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">ประวัติจองล่าสุด</p>
            {stats.recentBookings.length === 0 ? (
              <p className="mt-2 text-sm font-semibold text-[#8b87b8]">ยังไม่มีประวัติจอง</p>
            ) : (
              <div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
                {stats.recentBookings.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-xs font-semibold text-[#2e2a58]"
                  >
                    <p className="font-black">
                      {b.courtName} · {b.bookingDate} · {b.startTime}–{b.endTime}
                    </p>
                    <p className="mt-0.5 text-[#8b87b8]">
                      {b.status} · {b.paymentStatus} · {formatMoney(b.amountPaidBaht)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {stats.recentLedger.length > 0 ? (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">ประวัติคะแนน</p>
              <div className="mt-2 max-h-36 space-y-1 overflow-y-auto">
                {stats.recentLedger.map((l) => (
                  <div key={l.id} className="flex justify-between gap-2 text-xs font-semibold">
                    <span className="min-w-0 truncate text-[#66638c]">
                      {l.kind === "EARN" ? "สะสม" : "แลก"} · {l.note || "—"}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 tabular-nums font-black",
                        l.pointsDelta >= 0 ? "text-emerald-700" : "text-rose-600",
                      )}
                    >
                      {l.pointsDelta >= 0 ? "+" : ""}
                      {l.pointsDelta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}
          {info ? <p className="text-sm font-semibold text-emerald-700">{info}</p> : null}

          <button
            type="button"
            onClick={onClose}
            className={cn(
              appTemplateOutlineButtonClass,
              footballTurfInteractiveButtonClass,
              "hidden min-h-[40px] w-full rounded-xl",
            )}
          >
            ปิด
          </button>
        </div>
      )}
    </FormModal>
  );
}
