"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { isLoyaltyPhoneSearchReady } from "@/lib/loyalty-stamp/member-qr";
import { appTemplateOutlineButtonClass, useAppNoticePopup, LoyaltyRewardMenuCard, LoyaltyRewardMenuGrid } from "@/components/app-templates";
import type {
  BuildingPosLoyaltyMemberDto,
  BuildingPosLoyaltyRewardDto,
} from "@/systems/building-pos/lib/loyalty-rule";

type StaffAuth = { ownerId: string; trialSessionId: string; k: string };

/**
 * แผงเบอร์สมาชิก + แลกคะแนน — โมดัลโต๊ะ (แดชบอร์ด / ลิงก์พนักงาน)
 * ถ้าออเดอร์มีเบอร์จากลูกค้าแล้ว — ใช้เบอร์นั้น ไม่บังคับกรอกใหม่
 */
export function BuildingPosLoyaltyCheckoutPanel({
  orderId,
  className,
  onMemberPhoneChange,
  staffAuth,
  /** เบอร์ที่ผูกกับออเดอร์แล้ว (ลูกค้ากรอกตอนสั่ง) */
  linkedPhone = "",
}: {
  orderId?: number | null;
  className?: string;
  onMemberPhoneChange?: (phone: string) => void;
  staffAuth?: StaffAuth;
  linkedPhone?: string;
}) {
  const notice = useAppNoticePopup({
    defaultConfirmTone: "warning",
    defaultConfirmTitle: "ยืนยันการแลก",
    defaultConfirmLabel: "แลก",
  });
  const linkedDigits = useMemo(() => linkedPhone.replace(/\D/g, "").slice(0, 20), [linkedPhone]);
  const hasLinked = linkedDigits.length >= 9;

  const [enabled, setEnabled] = useState(false);
  const [phone, setPhone] = useState(hasLinked ? linkedDigits : "");
  const [member, setMember] = useState<BuildingPosLoyaltyMemberDto | null>(null);
  const [candidates, setCandidates] = useState<BuildingPosLoyaltyMemberDto[]>([]);
  const [rewards, setRewards] = useState<BuildingPosLoyaltyRewardDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const staffQs = useMemo(() => {
    if (!staffAuth) return "";
    return new URLSearchParams({
      ownerId: staffAuth.ownerId,
      t: staffAuth.trialSessionId,
      k: staffAuth.k,
    }).toString();
  }, [staffAuth]);

  const loyaltyBase = staffAuth
    ? `/api/building-pos/staff/loyalty`
    : `/api/building-pos/session/loyalty`;
  const membersBase = `${loyaltyBase}/members`;

  const lookup = useCallback(
    async (raw: string) => {
      if (!isLoyaltyPhoneSearchReady(raw)) {
        setMember(null);
        return;
      }
      setBusy(true);
      setErr(null);
      try {
        const url = staffAuth
          ? `${membersBase}?${staffQs}&phone=${encodeURIComponent(raw.trim())}`
          : `${membersBase}?phone=${encodeURIComponent(raw.trim())}`;
        const res = await fetch(url, {
          credentials: staffAuth ? "omit" : "include",
          cache: "no-store",
        });
        const j = (await res.json().catch(() => ({}))) as {
          enabled?: boolean;
          member?: BuildingPosLoyaltyMemberDto | null;
          candidates?: BuildingPosLoyaltyMemberDto[];
          rewards?: BuildingPosLoyaltyRewardDto[];
          error?: string;
        };
        if (!res.ok && j.error && !j.candidates?.length) {
          setErr(j.error);
          setMember(null);
          setCandidates([]);
          return;
        }
        setEnabled(j.enabled === true);
        if (Array.isArray(j.rewards)) setRewards(j.rewards);
        if (Array.isArray(j.candidates) && j.candidates.length > 1) {
          setCandidates(j.candidates);
          setMember(null);
          setErr(null);
          return;
        }
        setCandidates([]);
        setMember(j.member ?? null);
        if (j.member?.phone) {
          setPhone(j.member.phone);
          onMemberPhoneChange?.(j.member.phone);
        }
        if (!j.member && j.error) setErr(j.error);
        else setErr(null);
      } catch {
        setErr("ค้นหาสมาชิกไม่สำเร็จ");
      } finally {
        setBusy(false);
      }
    },
    [membersBase, onMemberPhoneChange, staffAuth, staffQs],
  );

  useEffect(() => {
    const url = staffAuth ? `${loyaltyBase}?${staffQs}` : loyaltyBase;
    void fetch(url, {
      credentials: staffAuth ? "omit" : "include",
      cache: "no-store",
    })
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as {
          settings?: { enabled?: boolean };
          rewards?: BuildingPosLoyaltyRewardDto[];
        };
        setEnabled(j.settings?.enabled === true);
        setRewards(Array.isArray(j.rewards) ? j.rewards.filter((r) => r.is_active !== false) : []);
      })
      .catch(() => undefined);
  }, [loyaltyBase, staffAuth, staffQs]);

  /** ซิงก์เบอร์จากออเดอร์ลูกค้า → แผง + lookup คะแนน */
  useEffect(() => {
    if (!hasLinked) return;
    setPhone(linkedDigits);
    onMemberPhoneChange?.(linkedDigits);
    void lookup(linkedDigits);
  }, [hasLinked, linkedDigits, lookup, onMemberPhoneChange]);

  /** พิมพ์เบอร์เอง — ค้นหาอัตโนมัติเมื่อครบ */
  useEffect(() => {
    if (hasLinked) return;
    if (!isLoyaltyPhoneSearchReady(phone)) {
      setMember(null);
      return;
    }
    const t = window.setTimeout(() => void lookup(phone), 400);
    return () => window.clearTimeout(t);
  }, [hasLinked, phone, lookup]);

  const redeemableRewards = useMemo(() => {
    if (!member) return [];
    return rewards.filter((r) => r.is_active !== false && member.points_balance >= r.points_cost);
  }, [member, rewards]);

  async function ensureMember() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setErr("กรอกเบอร์ 9–10 หลัก");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const url = staffAuth ? `${membersBase}?action=upsert&${staffQs}` : `${membersBase}?action=upsert`;
      const res = await fetch(url, {
        method: "POST",
        credentials: staffAuth ? "omit" : "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digits }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        member?: BuildingPosLoyaltyMemberDto;
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "บันทึกสมาชิกไม่สำเร็จ");
      if (j.member) {
        setMember(j.member);
        onMemberPhoneChange?.(j.member.phone);
        setMsg("ผูกเบอร์แล้ว");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function redeem(reward: BuildingPosLoyaltyRewardDto) {
    const digits = (member?.phone || phone).replace(/\D/g, "");
    if (digits.length < 9) {
      notice.warning("กรอกเบอร์ก่อน", { title: "แจ้งเตือน" });
      return;
    }
    const ok = await notice.confirm(
      `แลก «${reward.title}»\n${reward.points_cost.toLocaleString("th-TH")} คะแนน`,
      { title: "ยืนยันการแลก", confirmLabel: "แลก", tone: "warning" },
    );
    if (!ok) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const url = staffAuth ? `${membersBase}?action=redeem&${staffQs}` : `${membersBase}?action=redeem`;
      const res = await fetch(url, {
        method: "POST",
        credentials: staffAuth ? "omit" : "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: digits,
          reward_id: reward.id,
          order_id: orderId ?? null,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        member?: BuildingPosLoyaltyMemberDto;
        error?: string;
        points_spent?: number;
      };
      if (!res.ok) throw new Error(j.error ?? "แลกไม่สำเร็จ");
      if (j.member) setMember(j.member);
      notice.success(`แลกแล้ว (−${j.points_spent ?? reward.points_cost})`);
      onMemberPhoneChange?.(digits);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "แลกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  return (
    <div className={cn("space-y-2.5", className)}>
      {notice.popup}

      {hasLinked ? (
        <p className="text-sm font-black tabular-nums text-[#1e1b4b]">
          {linkedDigits}
          {member ?
            <span className="ml-2 text-xs font-semibold text-[#4d47b6]">
              {member.points_balance.toLocaleString("th-TH")} คะแนน
              {member.customer_name ? ` · ${member.customer_name}` : ""}
            </span>
          : null}
        </p>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-xs font-bold text-[#4d47b6]">
            เบอร์โทร
            <input
              className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
              inputMode="tel"
              placeholder="08xxxxxxxx หรือ 4 หลักท้าย"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                onMemberPhoneChange?.(e.target.value.replace(/\D/g, ""));
                setCandidates([]);
              }}
              onBlur={() => void lookup(phone)}
            />
          </label>
          <button
            type="button"
            disabled={busy}
            className={cn(
              appTemplateOutlineButtonClass,
              "min-h-[40px] rounded-xl px-3 text-xs font-black disabled:opacity-50",
            )}
            onClick={() => void lookup(phone)}
          >
            ค้นหา
          </button>
          <button
            type="button"
            disabled={busy}
            className="app-btn-primary min-h-[40px] rounded-xl px-3 text-xs font-black disabled:opacity-50"
            onClick={() => void ensureMember()}
          >
            ผูกเบอร์
          </button>
        </div>
      )}

      {candidates.length > 1 ? (
        <ul className="space-y-1.5 rounded-xl border border-amber-200/80 bg-amber-50/80 p-2">
          <li className="text-[11px] font-black text-amber-900">เลือกเบอร์ (4 หลักท้ายซ้ำ)</li>
          {candidates.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/80 bg-white px-2.5 py-2 text-left hover:bg-violet-50"
                onClick={() => {
                  setPhone(c.phone);
                  setCandidates([]);
                  setMember(c);
                  onMemberPhoneChange?.(c.phone);
                  void lookup(c.phone);
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

      {!hasLinked && member ? (
        <p className="text-sm font-black tabular-nums text-[#1e1b4b]">
          {member.phone}
          <span className="ml-2 text-xs font-semibold text-[#4d47b6]">
            {member.points_balance.toLocaleString("th-TH")} คะแนน
          </span>
        </p>
      ) : null}

      {redeemableRewards.length > 0 ? (
        <LoyaltyRewardMenuGrid>
          {redeemableRewards.map((r) => (
            <LoyaltyRewardMenuCard
              key={`ok-${r.id}`}
              title={r.title}
              pointsCost={r.points_cost}
              imageUrl={r.image_url}
              busy={busy}
              onRedeem={() => void redeem(r)}
            />
          ))}
        </LoyaltyRewardMenuGrid>
      ) : null}

      {rewards.length > 0 && redeemableRewards.length === 0 ? (
        <LoyaltyRewardMenuGrid>
          {rewards.map((r) => {
            const can = member != null && member.points_balance >= r.points_cost;
            return (
              <LoyaltyRewardMenuCard
                key={r.id}
                title={r.title}
                pointsCost={r.points_cost}
                imageUrl={r.image_url}
                disabled={!can}
                busy={busy}
                onRedeem={() => void redeem(r)}
              />
            );
          })}
        </LoyaltyRewardMenuGrid>
      ) : null}

      {err ? <p className="text-xs font-semibold text-rose-700">{err}</p> : null}
      {msg ? <p className="text-xs font-semibold text-emerald-700">{msg}</p> : null}
    </div>
  );
}