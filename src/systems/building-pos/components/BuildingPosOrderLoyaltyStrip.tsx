"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  appTemplateOutlineButtonClass,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { isLoyaltyPhoneSearchReady } from "@/lib/loyalty-stamp/member-qr";
import { BuildingPosLoyaltyCheckoutPanel } from "@/systems/building-pos/components/BuildingPosLoyaltyCheckoutPanel";
import {
  normalizeBuildingPosMemberPhone,
  type BuildingPosLoyaltyMemberDto,
  type BuildingPosLoyaltyRewardDto,
} from "@/systems/building-pos/lib/loyalty-rule";
import { buildingPosFieldClass } from "@/systems/building-pos/components/building-pos-ui-tokens";

type StaffAuth = { ownerId: string; trialSessionId: string; k: string };

/**
 * แถบเบอร์บนหน้าออเดอร์ — กะทัดรัด + ปุ่มไปแลกคะแนน (ไม่รกหน้า)
 * ค้นหา 4 หลักท้าย: ถ้าซ้ำให้เลือกจากเบอร์เต็ม
 */
export function BuildingPosOrderLoyaltyStrip({
  staffAuth,
  phone,
  onPhoneChange,
  className,
}: {
  staffAuth?: StaffAuth;
  phone: string;
  onPhoneChange: (digits: string) => void;
  className?: string;
}) {
  const notice = useAppNoticePopup();
  const [query, setQuery] = useState(phone);
  const [member, setMember] = useState<BuildingPosLoyaltyMemberDto | null>(null);
  const [candidates, setCandidates] = useState<BuildingPosLoyaltyMemberDto[]>([]);
  const [rewards, setRewards] = useState<BuildingPosLoyaltyRewardDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);

  const staffQs = useMemo(() => {
    if (!staffAuth) return "";
    return new URLSearchParams({
      ownerId: staffAuth.ownerId,
      t: staffAuth.trialSessionId,
      k: staffAuth.k,
    }).toString();
  }, [staffAuth]);

  const membersBase = staffAuth
    ? `/api/building-pos/staff/loyalty/members`
    : `/api/building-pos/session/loyalty/members`;

  useEffect(() => {
    if (!phone) {
      setQuery("");
      setMember(null);
      setCandidates([]);
      return;
    }
    if (phone !== query && normalizeBuildingPosMemberPhone(phone).length >= 9) {
      setQuery(phone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync parent reset / full phone only
  }, [phone]);

  const lookup = useCallback(
    async (raw: string) => {
      if (!isLoyaltyPhoneSearchReady(raw)) {
        setMember(null);
        setCandidates([]);
        return;
      }
      setBusy(true);
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
        setEnabled(j.enabled !== false);
        if (Array.isArray(j.rewards)) setRewards(j.rewards.filter((r) => r.is_active !== false));

        if (Array.isArray(j.candidates) && j.candidates.length > 1) {
          setCandidates(j.candidates);
          setMember(null);
          return;
        }
        setCandidates([]);
        if (j.member) {
          setMember(j.member);
          setQuery(j.member.phone);
          onPhoneChange(j.member.phone);
        } else {
          setMember(null);
          if (j.error && !j.candidates?.length) {
            notice.warning(
              j.error.includes("ไม่พบ") ?
                "ยังไม่มีสมาชิก — จะผูกเบอร์อัตโนมัติเมื่อชำระเงิน"
              : j.error,
              { title: "แจ้งเตือน" },
            );
          }
        }
      } catch {
        setMember(null);
        setCandidates([]);
      } finally {
        setBusy(false);
      }
    },
    [membersBase, notice, onPhoneChange, staffAuth, staffQs],
  );

  useEffect(() => {
    if (!isLoyaltyPhoneSearchReady(query)) {
      setMember(null);
      setCandidates([]);
      return;
    }
    const t = window.setTimeout(() => void lookup(query), 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce by query only
  }, [query]);

  const canRedeem = useMemo(() => {
    if (!member || member.points_balance <= 0) return false;
    return rewards.some((r) => r.is_active !== false && member.points_balance >= r.points_cost);
  }, [member, rewards]);

  if (!enabled) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {notice.popup}
      <label className="block text-xs font-semibold text-[#66638c]">
        เบอร์โทร
        <div className="mt-1 flex gap-2">
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="off"
            className={cn(buildingPosFieldClass, "min-w-0 flex-1 tabular-nums")}
            placeholder="08xxxxxxxx หรือ 4 หลักท้าย"
            value={query}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 20);
              setQuery(v);
              onPhoneChange(v);
              setCandidates([]);
              if (v.length < 4) setMember(null);
            }}
          />
          <button
            type="button"
            disabled={busy || !isLoyaltyPhoneSearchReady(query)}
            className={cn(
              appTemplateOutlineButtonClass,
              "min-h-[44px] shrink-0 rounded-xl px-3 text-xs font-black disabled:opacity-40",
            )}
            onClick={() => void lookup(query)}
          >
            ค้นหา
          </button>
        </div>
      </label>

      {candidates.length > 1 ? (
        <ul className="space-y-1.5 rounded-xl border border-amber-200/80 bg-amber-50/80 p-2.5">
          <li className="text-[11px] font-black text-amber-900">เลือกเบอร์ (4 หลักท้ายซ้ำ)</li>
          {candidates.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/80 bg-white px-3 py-2.5 text-left shadow-sm hover:bg-violet-50"
                onClick={() => {
                  setQuery(c.phone);
                  setCandidates([]);
                  setMember(c);
                  onPhoneChange(c.phone);
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

      {member && candidates.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-200/70 bg-violet-50/50 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-sm font-black tabular-nums text-[#1e1b4b]">{member.phone}</p>
            <p className="text-xs font-semibold text-[#4d47b6]">
              {member.points_balance.toLocaleString("th-TH")} คะแนน
              {member.customer_name ? ` · ${member.customer_name}` : ""}
            </p>
          </div>
          {canRedeem ?
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
      ) : null}

      <FormModal
        open={redeemOpen}
        onClose={() => setRedeemOpen(false)}
        title="แลกคะแนน"
        size="md"
      >
        {member ?
          <BuildingPosLoyaltyCheckoutPanel
            staffAuth={staffAuth}
            linkedPhone={member.phone}
            onMemberPhoneChange={(digits) => {
              const n = normalizeBuildingPosMemberPhone(digits);
              if (n.length >= 9) {
                onPhoneChange(n);
                setQuery(n);
              }
            }}
          />
        : null}
      </FormModal>
    </div>
  );
}
