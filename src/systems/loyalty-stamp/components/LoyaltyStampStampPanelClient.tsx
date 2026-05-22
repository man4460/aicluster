"use client";

import { useCallback, useState, type FormEvent } from "react";
import {
  AppDashboardSection,
  AppQrScanModal,
  AppSectionHeader,
  appDashboardSectionVioletClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { isLoyaltyPhoneSearchReady, normalizeLoyaltyQrPaste } from "@/lib/loyalty-stamp/member-qr";
import type { LoyaltyMemberDto } from "@/lib/loyalty-stamp/member-service";
import { LoyaltyStampCardVisual } from "@/systems/loyalty-stamp/components/LoyaltyStampCardVisual";
import { lsFieldClass } from "@/systems/loyalty-stamp/loyalty-stamp-ui-tokens";

export function LoyaltyStampStampPanelClient({ shopName }: { shopName: string }) {
  const [phone, setPhone] = useState("");
  const [qrPayload, setQrPayload] = useState("");
  const [qrScanOpen, setQrScanOpen] = useState(false);
  const [member, setMember] = useState<LoyaltyMemberDto | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [qrBusy, setQrBusy] = useState(false);

  const lookup = useCallback(
    async (
      payload: { phone?: string; qrPayload?: string },
      kind: "phone" | "qr",
    ) => {
      const setBusy = kind === "phone" ? setPhoneBusy : setQrBusy;
      setBusy(true);
      setErr(null);
      try {
        const res = await fetch("/api/loyalty-stamp/stamp/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json().catch(() => ({}))) as {
          member?: LoyaltyMemberDto;
          error?: string;
        };
        if (!res.ok) throw new Error(json.error ?? "ค้นหาไม่สำเร็จ");
        if (!json.member) throw new Error("ไม่พบข้อมูล");
        setMember(json.member);
      } catch (e) {
        setMember(null);
        setErr(e instanceof Error ? e.message : "ค้นหาไม่สำเร็จ");
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const applyQrPayload = useCallback(
    (raw: string) => {
      const payload = normalizeLoyaltyQrPaste(raw);
      if (!payload) {
        setErr("รหัส QR ไม่ถูกต้อง — ใช้ QR บนการ์ดลูกค้า");
        return;
      }
      void lookup({ qrPayload: payload }, "qr");
    },
    [lookup],
  );

  const onQrScanned = useCallback(
    (text: string) => {
      setQrPayload(text);
      applyQrPayload(text);
    },
    [applyQrPayload],
  );

  const addStamp = async () => {
    if (!member) return;
    setPhoneBusy(true);
    setQrBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/loyalty-stamp/stamp/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id }),
      });
      const json = (await res.json().catch(() => ({}))) as { member?: LoyaltyMemberDto; error?: string };
      if (!res.ok) throw new Error(json.error ?? "เพิ่มแต้มไม่สำเร็จ");
      if (json.member) setMember(json.member);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "เพิ่มแต้มไม่สำเร็จ");
    } finally {
      setPhoneBusy(false);
      setQrBusy(false);
    }
  };

  const onPhoneSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (phoneBusy || !isLoyaltyPhoneSearchReady(phone)) return;
    void lookup({ phone: phone.trim() }, "phone");
  };

  const onQrPasteSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (qrBusy) return;
    applyQrPayload(qrPayload);
  };

  const redeem = async () => {
    if (!member) return;
    if (!confirm(`แลก «${member.rewardTitle}» ให้ลูกค้านี้?`)) return;
    setPhoneBusy(true);
    setQrBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/loyalty-stamp/stamp/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id }),
      });
      const json = (await res.json().catch(() => ({}))) as { member?: LoyaltyMemberDto; error?: string };
      if (!res.ok) throw new Error(json.error ?? "แลกไม่สำเร็จ");
      if (json.member) setMember(json.member);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "แลกไม่สำเร็จ");
    } finally {
      setPhoneBusy(false);
      setQrBusy(false);
    }
  };

  const qrPasteReady = normalizeLoyaltyQrPaste(qrPayload).length > 0;
  const anyBusy = phoneBusy || qrBusy;

  return (
    <AppDashboardSection className={appDashboardSectionVioletClass}>
      <AppSectionHeader
        title="เพิ่มแต้มให้ลูกค้า"
        description="ค้นหาเบอร์ 10 หลัก หรือ 4 หลักท้าย · สแกน QR การ์ดลูกค้า"
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
      />

      <div className="space-y-4 text-left">
        <div className="space-y-1.5">
          <label htmlFor="ls-staff-phone" className="block text-xs font-bold text-[#4d47b6]">
            เบอร์โทรลูกค้า
          </label>
          <form onSubmit={onPhoneSubmit} className="flex items-stretch gap-2">
            <input
              id="ls-staff-phone"
              type="tel"
              autoComplete="tel"
              suppressHydrationWarning
              className={cn(lsFieldClass, "min-w-0 flex-1")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812345678 หรือ 4567"
            />
            <button
              type="submit"
              suppressHydrationWarning
              disabled={phoneBusy || !isLoyaltyPhoneSearchReady(phone)}
              className="app-btn-primary min-h-[44px] shrink-0 rounded-xl px-4 text-sm font-bold sm:px-5"
            >
              {phoneBusy ? "…" : "ค้นหา"}
            </button>
          </form>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-[#4d47b6]">QR การ์ดลูกค้า</p>
          <button
            type="button"
            suppressHydrationWarning
            disabled={qrBusy}
            onClick={() => setQrScanOpen(true)}
            className="app-btn-primary flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl text-sm font-black sm:text-base"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" strokeLinecap="round" />
              <rect x="7" y="7" width="10" height="10" rx="1" />
            </svg>
            {qrBusy ? "กำลังค้นหา…" : "ใช้ QR — เปิดกล้องสแกน"}
          </button>
          <form onSubmit={onQrPasteSubmit} className="flex items-stretch gap-2">
            <input
              id="ls-staff-qr"
              type="text"
              autoComplete="off"
              spellCheck={false}
              suppressHydrationWarning
              className={cn(lsFieldClass, "min-w-0 flex-1 text-xs sm:text-sm")}
              value={qrPayload}
              onChange={(e) => setQrPayload(e.target.value)}
              placeholder="หรือวางรหัส LS:… แล้วกด Enter"
            />
            <button
              type="submit"
              suppressHydrationWarning
              disabled={qrBusy || !qrPasteReady}
              className={cn(
                "min-h-[44px] shrink-0 rounded-xl border border-white/60 bg-white/80 px-3 text-xs font-bold text-[#4d47b6] sm:px-4 sm:text-sm",
                "transition active:scale-[0.98] disabled:opacity-50",
              )}
            >
              นำเข้า
            </button>
          </form>
        </div>

        {err ? <p className="text-sm font-medium text-rose-600">{err}</p> : null}

        {member ? (
          <div className="space-y-4">
            <LoyaltyStampCardVisual
              shopName={shopName}
              stampEmoji={member.stampEmoji}
              slots={member.slots}
              stampsPerReward={member.stampsPerReward}
              currentStamps={member.currentStamps}
              rewardTitle={member.rewardTitle}
              rewardDescription={member.rewardDescription}
              customerLabel={`${member.customerName || "ลูกค้า"} · ${member.phone}`}
              readyToRedeem={member.readyToRedeem}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={anyBusy || member.readyToRedeem}
                onClick={() => void addStamp()}
                className="app-btn-primary min-h-[48px] flex-1 rounded-2xl px-4 text-base font-black sm:flex-none sm:px-8"
              >
                +1 แต้ม
              </button>
              <button
                type="button"
                disabled={anyBusy || !member.readyToRedeem}
                onClick={() => void redeem()}
                className="min-h-[48px] flex-1 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 text-base font-black text-emerald-800 sm:flex-none sm:px-6"
              >
                แลกของรางวัล
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <AppQrScanModal
        open={qrScanOpen}
        onClose={() => setQrScanOpen(false)}
        onScan={onQrScanned}
        title="สแกน QR ลูกค้า"
        hint="จ่อกล้องให้ตรง QR บนการ์ดสะสมแต้มของลูกค้า — อ่านแล้วค้นหาอัตโนมัติ"
      />
    </AppDashboardSection>
  );
}
