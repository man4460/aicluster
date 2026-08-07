"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import {
  appTemplateOutlineButtonClass,
  useAppNoticePopup,
  LoyaltyRewardMenuCard,
  LoyaltyRewardMenuGrid,
} from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
import { DrinkPosButton } from "@/systems/drink-pos/components/DrinkPosButton";
import { isLoyaltyPhoneSearchReady } from "@/lib/loyalty-stamp/member-qr";
import type {
  DrinkPosLoyaltyMemberDto,
  DrinkPosLoyaltyRewardDto,
} from "@/systems/drink-pos/lib/loyalty-rule";
import { formatDrinkPosLoyaltyEarnRule } from "@/systems/drink-pos/lib/loyalty-rule";
import { lsFieldClass } from "@/systems/loyalty-stamp/loyalty-stamp-ui-tokens";

type Props = {
  member: DrinkPosLoyaltyMemberDto | null;
  onMemberChange: (m: DrinkPosLoyaltyMemberDto | null) => void;
  /** @deprecated */
  redeemMode?: boolean;
  onRedeemModeChange?: (v: boolean) => void;
  hideMembersLink?: boolean;
  onRedeemed?: () => void;
  /**
   * compact = หน้าออเดอร์ — เบอร์ + ปุ่มไปแลก (ไม่โชว์รายการแลกในหน้า)
   * full = โชว์รายการแลกในแผง
   */
  compact?: boolean;
};

export function DrinkPosLoyaltyBar({
  member,
  onMemberChange,
  hideMembersLink = false,
  onRedeemed,
  compact = false,
}: Props) {
  const notice = useAppNoticePopup({
    defaultConfirmTone: "warning",
    defaultConfirmTitle: "ยืนยันการแลก",
    defaultConfirmLabel: "แลก",
  });
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [rewards, setRewards] = useState<DrinkPosLoyaltyRewardDto[]>([]);
  const [candidates, setCandidates] = useState<DrinkPosLoyaltyMemberDto[]>([]);
  const [rulePreview, setRulePreview] = useState("สะสมคะแนน");
  const [redeemOpen, setRedeemOpen] = useState(false);

  useEffect(() => {
    if (member?.phone) setPhone(member.phone);
  }, [member?.phone]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/drink-pos/session/loyalty", {
          credentials: "include",
          cache: "no-store",
        });
        const j = (await res.json().catch(() => ({}))) as {
          settings?: { enabled?: boolean; baht_per_point?: number; points_per_unit?: number };
          rewards?: DrinkPosLoyaltyRewardDto[];
          rule_preview?: string;
        };
        if (cancelled || !res.ok) return;
        setEnabled(j.settings?.enabled === true);
        setRewards(Array.isArray(j.rewards) ? j.rewards.filter((r) => r.is_active !== false) : []);
        if (j.rule_preview) setRulePreview(j.rule_preview);
        else if (j.settings) {
          setRulePreview(
            formatDrinkPosLoyaltyEarnRule(
              j.settings.baht_per_point ?? 100,
              j.settings.points_per_unit ?? 1,
            ),
          );
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const lookup = useCallback(async () => {
    if (!isLoyaltyPhoneSearchReady(phone)) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(
        `/api/drink-pos/session/loyalty/members?phone=${encodeURIComponent(phone.trim())}`,
        { credentials: "include", cache: "no-store" },
      );
      const j = (await res.json().catch(() => ({}))) as {
        enabled?: boolean;
        member?: DrinkPosLoyaltyMemberDto | null;
        candidates?: DrinkPosLoyaltyMemberDto[];
        rewards?: DrinkPosLoyaltyRewardDto[];
        error?: string;
        rule_preview?: string;
      };
      if (!res.ok && j.error && !j.candidates?.length) throw new Error(j.error);
      setEnabled(j.enabled === true);
      if (Array.isArray(j.rewards)) setRewards(j.rewards);
      if (j.rule_preview) setRulePreview(j.rule_preview);

      if (Array.isArray(j.candidates) && j.candidates.length > 1) {
        setCandidates(j.candidates);
        onMemberChange(null);
        setErr(null);
        return;
      }
      setCandidates([]);
      if (j.member) {
        onMemberChange(j.member);
        setPhone(j.member.phone);
      } else {
        onMemberChange(null);
        setErr(j.error ?? "ยังไม่มีสมาชิกบนเบอร์นี้ — กดผูกเบอร์ได้");
      }
    } catch (e) {
      onMemberChange(null);
      setCandidates([]);
      setErr(e instanceof Error ? e.message : "ค้นหาไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }, [phone, onMemberChange]);

  useEffect(() => {
    if (!enabled) return;
    if (!isLoyaltyPhoneSearchReady(phone)) return;
    const digits = phone.replace(/\D/g, "");
    if (member?.phone === digits && member.id) return;
    if (candidates.length > 0 && digits.length === 4) return;
    const t = window.setTimeout(() => void lookup(), 450);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce phone
  }, [enabled, phone]);

  const ensureMember = useCallback(async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setErr("กรอกเบอร์ 9–10 หลัก");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/drink-pos/session/loyalty/members?action=upsert", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digits }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        member?: DrinkPosLoyaltyMemberDto;
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "บันทึกสมาชิกไม่สำเร็จ");
      if (j.member) {
        onMemberChange(j.member);
        setPhone(j.member.phone);
        setCandidates([]);
        setMsg("ผูกเบอร์แล้ว");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }, [phone, onMemberChange]);

  const redeem = useCallback(
    async (reward: DrinkPosLoyaltyRewardDto) => {
      const digits = (member?.phone || phone).replace(/\D/g, "");
      if (digits.length < 9) {
        notice.warning("กรอกเบอร์ก่อน", { title: "แจ้งเตือน" });
        return;
      }
      const ok = await notice.confirm(
        `แลก «${reward.title}»\n${reward.points_cost.toLocaleString("th-TH")} คะแนน\nจะสร้างบิลฟรีเข้าคิว`,
        { title: "ยืนยันการแลก", confirmLabel: "แลก", tone: "warning" },
      );
      if (!ok) return;
      setBusy(true);
      setErr(null);
      setMsg(null);
      try {
        const res = await fetch("/api/drink-pos/session/loyalty/members?action=redeem", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: digits,
            reward_id: reward.id,
            create_sale: true,
          }),
        });
        const j = (await res.json().catch(() => ({}))) as {
          member?: DrinkPosLoyaltyMemberDto;
          error?: string;
          points_spent?: number;
        };
        if (!res.ok) throw new Error(j.error ?? "แลกไม่สำเร็จ");
        if (j.member) onMemberChange(j.member);
        notice.success(`แลกแล้ว (−${j.points_spent ?? reward.points_cost})`);
        onRedeemed?.();
      } catch (e) {
        notice.error(e instanceof Error ? e.message : "แลกไม่สำเร็จ");
      } finally {
        setBusy(false);
      }
    },
    [member?.phone, phone, onMemberChange, onRedeemed, notice],
  );

  const redeemable = useMemo(() => {
    if (!member) return [];
    return rewards.filter((r) => member.points_balance >= r.points_cost);
  }, [member, rewards]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void lookup();
  };

  const rewardsList = () =>
    redeemable.length > 0 ? (
      <LoyaltyRewardMenuGrid>
        {redeemable.map((r) => (
          <LoyaltyRewardMenuCard
            key={`ok-${r.id}`}
            title={r.title}
            pointsCost={r.points_cost}
            imageUrl={r.image_url}
            busy={busy || !member?.id}
            onRedeem={() => void redeem(r)}
          />
        ))}
      </LoyaltyRewardMenuGrid>
    ) : rewards.length > 0 && !compact ? (
      <LoyaltyRewardMenuGrid>
        {rewards.map((r) => (
          <LoyaltyRewardMenuCard
            key={r.id}
            title={r.title}
            pointsCost={r.points_cost}
            imageUrl={r.image_url}
            disabled
            onRedeem={() => undefined}
          />
        ))}
      </LoyaltyRewardMenuGrid>
    ) : null;

  if (!enabled) {
    return (
      <div className="rounded-xl border border-[#e8e6fc]/80 bg-gradient-to-br from-white/80 via-[#f5f3ff]/70 to-[#fdf2f8]/55 p-4 shadow-sm ring-1 ring-inset ring-white/55">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-left text-xs font-bold text-[#4d47b6]">สะสมคะแนน (ปิดอยู่)</p>
          <Link
            href="/dashboard/drink-pos/settings"
            className={cn(
              appTemplateOutlineButtonClass,
              "rounded-xl px-3 py-1.5 text-[10px] font-black text-[#4d47b6]",
            )}
          >
            เปิดใช้
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#e8e6fc]/80 bg-gradient-to-br from-white/80 via-[#f5f3ff]/70 to-[#fdf2f8]/55 p-4 shadow-sm ring-1 ring-inset ring-white/55">
      {notice.popup}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-left text-xs font-bold text-[#4d47b6]">
          {compact ? "เบอร์โทร" : `เบอร์โทรสะสมคะแนน (${rulePreview})`}
        </p>
        {!compact ?
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            {hideMembersLink ? null : (
              <Link
                href="/dashboard/drink-pos/members"
                className={cn(
                  appTemplateOutlineButtonClass,
                  "rounded-xl px-3 py-1.5 text-[10px] font-black text-[#4d47b6]",
                )}
              >
                QR / ลิงก์
              </Link>
            )}
            <Link
              href="/dashboard/drink-pos/settings"
              className={cn(
                appTemplateOutlineButtonClass,
                "rounded-xl px-3 py-1.5 text-[10px] font-black text-[#4d47b6]",
              )}
              aria-label="ตั้งค่าสะสมคะแนน"
            >
              ตั้งค่า
            </Link>
          </div>
        : null}
      </div>
      <form onSubmit={onSubmit} className="mt-2 flex flex-wrap items-stretch gap-2">
        <input
          type="tel"
          suppressHydrationWarning
          className={cn(lsFieldClass, "min-w-0 flex-1")}
          placeholder="08xxxxxxxx หรือ 4 หลักท้าย"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value.replace(/\D/g, "").slice(0, 20));
            setCandidates([]);
          }}
        />
        <DrinkPosButton
          type="submit"
          disabled={busy || !isLoyaltyPhoneSearchReady(phone)}
          className="app-btn-primary min-h-[44px] shrink-0 rounded-xl px-4 text-sm font-bold"
        >
          {busy ? "…" : "ค้นหา"}
        </DrinkPosButton>
        {!compact ?
          <DrinkPosButton
            type="button"
            disabled={busy}
            onClick={() => void ensureMember()}
            className={cn(appTemplateOutlineButtonClass, "min-h-[44px] shrink-0 rounded-xl px-3 text-xs font-black")}
          >
            ผูกเบอร์
          </DrinkPosButton>
        : null}
      </form>

      {candidates.length > 1 ? (
        <ul className="mt-2 space-y-1.5 rounded-xl border border-amber-200/80 bg-amber-50/80 p-2.5">
          <li className="text-[11px] font-black text-amber-900">เลือกเบอร์ (4 หลักท้ายซ้ำ)</li>
          {candidates.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/80 bg-white px-3 py-2.5 text-left shadow-sm hover:bg-violet-50"
                onClick={() => {
                  setPhone(c.phone);
                  setCandidates([]);
                  onMemberChange(c);
                }}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-black tabular-nums text-[#1e1b4b]">{c.phone}</span>
                  {c.customer_name ?
                    <span className="text-[11px] font-semibold text-[#66638c]">{c.customer_name}</span>
                  : null}
                </span>
                <span className="shrink-0 text-xs font-black tabular-nums text-[#4d47b6]">
                  {c.points_balance.toLocaleString("th-TH")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {err ? <p className="mt-2 text-left text-sm text-rose-600">{err}</p> : null}
      {msg ? <p className="mt-2 text-left text-sm font-semibold text-emerald-700">{msg}</p> : null}

      {member && member.phone && candidates.length === 0 ? (
        <div className="mt-3 space-y-2 text-left">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-200/70 bg-violet-50/50 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-black tabular-nums text-[#1e1b4b]">{member.phone}</p>
              <p className="text-xs font-semibold text-[#4d47b6]">
                {member.points_balance.toLocaleString("th-TH")} คะแนน
                {member.customer_name ? ` · ${member.customer_name}` : ""}
              </p>
            </div>
            {compact && redeemable.length > 0 ?
              <button
                type="button"
                onClick={() => setRedeemOpen(true)}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "min-h-[40px] shrink-0 rounded-xl px-3 text-xs font-black text-indigo-800",
                )}
              >
                ไปแลกคะแนน
              </button>
            : null}
          </div>
          {!compact ? rewardsList() : null}
        </div>
      ) : null}

      <FormModal open={redeemOpen} onClose={() => setRedeemOpen(false)} title="แลกคะแนน" size="md">
        {member ?
          <div className="space-y-2.5">
            <p className="text-sm font-black tabular-nums text-[#1e1b4b]">
              {member.phone}
              <span className="ml-2 text-xs font-semibold text-[#4d47b6]">
                {member.points_balance.toLocaleString("th-TH")} คะแนน
              </span>
            </p>
            {rewardsList()}
          </div>
        : null}
      </FormModal>
    </div>
  );
}
