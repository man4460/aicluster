"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { FormModal } from "@/components/ui/FormModal";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";
import { DrinkPosButton } from "@/systems/drink-pos/components/DrinkPosButton";
import { DrinkPosLoyaltyBar } from "@/systems/drink-pos/components/DrinkPosLoyaltyBar";
import { DrinkPosQrPosterClient } from "@/systems/drink-pos/components/DrinkPosQrPosterClient";
import type { DrinkPosLoyaltyMemberDto } from "@/systems/drink-pos/lib/loyalty-rule";
import { formatDrinkPosLoyaltyEarnRule } from "@/systems/drink-pos/lib/loyalty-rule";
import {
  drinkPosStationPublicUrl,
  type DrinkPosStationRole,
} from "@/systems/drink-pos/lib/fulfillment-status";
import { drinkPosCtaClass } from "@/systems/drink-pos/lib/ui-tokens";

type Props = {
  ownerId: string;
  trialSessionId: string;
  baseUrl: string;
  shopLabel: string;
  logoUrl?: string | null;
  trialExportBlocked?: boolean;
  loyaltyEnabled?: boolean;
  bahtPerPoint?: number;
  pointsPerUnit?: number;
};

type HubModal = "qr" | "lookup" | "kitchen" | "serve" | null;

function ModalCloseFooter({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex justify-end">
      <DrinkPosButton
        type="button"
        onClick={onClose}
        className="cw-btn app-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold"
        aria-label="ปิด"
      >
        <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
        <span className="cw-btn-label">ปิด</span>
      </DrinkPosButton>
    </div>
  );
}

function HubCardChevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const hubCardBase =
  "group relative w-full overflow-hidden rounded-[2.5rem] border border-white/50 text-left p-6 sm:p-8 backdrop-blur-2xl ring-1 ring-inset ring-white/60 transition-all duration-300 hover:-translate-y-1 hover:border-white/75 active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

/** Hub รวมลิงก์ — QR ลูกค้า · ค้นหาสมาชิก · แผนกทำ · แผนกเสิร์ฟ */
export function DrinkPosLoyaltyHubClient({
  ownerId,
  trialSessionId,
  baseUrl,
  shopLabel,
  logoUrl = null,
  trialExportBlocked = false,
  loyaltyEnabled = false,
  bahtPerPoint = 100,
  pointsPerUnit = 1,
}: Props) {
  const [modal, setModal] = useState<HubModal>(null);
  const [member, setMember] = useState<DrinkPosLoyaltyMemberDto | null>(null);
  const [copied, setCopied] = useState<"kitchen" | "serve" | null>(null);
  const ruleLabel = formatDrinkPosLoyaltyEarnRule(bahtPerPoint, pointsPerUnit);

  const kitchenUrl = useMemo(
    () => drinkPosStationPublicUrl(baseUrl, "kitchen", ownerId, trialSessionId),
    [baseUrl, ownerId, trialSessionId],
  );
  const serveUrl = useMemo(
    () => drinkPosStationPublicUrl(baseUrl, "serve", ownerId, trialSessionId),
    [baseUrl, ownerId, trialSessionId],
  );

  async function copyStation(role: DrinkPosStationRole, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(role);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      window.prompt("คัดลอกลิงก์:", url);
    }
  }

  function openModal(next: HubModal) {
    setModal(next);
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <DrinkPosButton
          type="button"
          onClick={() => openModal("qr")}
          className={cn(
            hubCardBase,
            "bg-gradient-to-br from-white/50 via-[#f5f3ff]/70 to-[#fdf2f8]/55",
            "shadow-[0_28px_70px_-24px_rgba(91,97,255,0.42),inset_0_1px_0_0_rgba(255,255,255,0.65)]",
            "hover:shadow-[0_34px_85px_-22px_rgba(91,97,255,0.48)]",
            "focus-visible:outline-[#0000BF]",
          )}
          aria-label="เปิดจัดการ QR ลูกค้า"
        >
          <span className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#0000BF]/25 blur-3xl" aria-hidden />
          <span className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-fuchsia-400/18 blur-3xl" aria-hidden />
          <div className="relative flex items-start gap-4 sm:gap-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/55 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] ring-1 ring-white/75 backdrop-blur-md sm:h-16 sm:w-16">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#0000BF] sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3h-3zM20 14h1v1h-1zM18 18h3v3h-3z" />
              </svg>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">QR ลูกค้า</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                สแกนสั่งเครื่องดื่ม · คัดลอกลิงก์ ดาวน์โหลดโปสเตอร์
              </p>
              <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0000BF]">
                <span>คลิกเพื่อเปิด</span>
                <HubCardChevron />
              </p>
            </div>
          </div>
        </DrinkPosButton>

        <DrinkPosButton
          type="button"
          onClick={() => openModal("lookup")}
          className={cn(
            hubCardBase,
            "bg-gradient-to-br from-white/50 via-amber-50/35 to-orange-100/22",
            "shadow-[0_28px_70px_-24px_rgba(217,119,6,0.35),inset_0_1px_0_0_rgba(255,255,255,0.65)]",
            "hover:shadow-[0_34px_85px_-22px_rgba(217,119,6,0.4)]",
            "focus-visible:outline-amber-600",
          )}
          aria-label="เปิดค้นหาสมาชิกที่เคาน์เตอร์"
        >
          <span className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-amber-400/25 blur-3xl" aria-hidden />
          <span className="pointer-events-none absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-orange-300/15 blur-3xl" aria-hidden />
          <div className="relative flex items-start gap-4 sm:gap-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/55 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] ring-1 ring-white/75 backdrop-blur-md sm:h-16 sm:w-16">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-amber-700 sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" />
                <path d="M16 7l1.5 1.5M18 4v3M21 5.5h-3" strokeLinecap="round" />
              </svg>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">ค้นหาสมาชิก</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                เบอร์ 10 หลักหรือ 4 หลักท้าย — ดูคะแนนก่อนบันทึกบิล
              </p>
              <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-800">
                <span>คลิกเพื่อเปิด</span>
                <HubCardChevron />
              </p>
            </div>
          </div>
        </DrinkPosButton>

        <DrinkPosButton
          type="button"
          onClick={() => openModal("kitchen")}
          className={cn(
            hubCardBase,
            "bg-gradient-to-br from-white/50 via-sky-50/50 to-cyan-100/30",
            "shadow-[0_28px_70px_-24px_rgba(14,165,233,0.35),inset_0_1px_0_0_rgba(255,255,255,0.65)]",
            "hover:shadow-[0_34px_85px_-22px_rgba(14,165,233,0.42)]",
            "focus-visible:outline-sky-600",
          )}
          aria-label="เปิดลิงก์แผนกทำ"
        >
          <span className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-sky-400/25 blur-3xl" aria-hidden />
          <div className="relative flex items-start gap-4 sm:gap-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/55 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] ring-1 ring-white/75 backdrop-blur-md sm:h-16 sm:w-16">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-sky-700 sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path d="M4 10h16v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8z" strokeLinejoin="round" />
                <path d="M8 10V7a4 4 0 018 0v3M8 14h.01M12 14h.01M16 14h.01" strokeLinecap="round" />
              </svg>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">แผนกทำ</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                ลิงก์สำหรับครัว — รับออเดอร์ · กำลังทำ · พร้อมรับ
              </p>
              <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-800">
                <span>คลิกเพื่อเปิด</span>
                <HubCardChevron />
              </p>
            </div>
          </div>
        </DrinkPosButton>

        <DrinkPosButton
          type="button"
          onClick={() => openModal("serve")}
          className={cn(
            hubCardBase,
            "bg-gradient-to-br from-white/50 via-emerald-50/45 to-teal-100/28",
            "shadow-[0_28px_70px_-24px_rgba(16,185,129,0.35),inset_0_1px_0_0_rgba(255,255,255,0.65)]",
            "hover:shadow-[0_34px_85px_-22px_rgba(16,185,129,0.42)]",
            "focus-visible:outline-emerald-600",
          )}
          aria-label="เปิดลิงก์แผนกเสิร์ฟ"
        >
          <span className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-400/22 blur-3xl" aria-hidden />
          <div className="relative flex items-start gap-4 sm:gap-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/55 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] ring-1 ring-white/75 backdrop-blur-md sm:h-16 sm:w-16">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-emerald-700 sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">แผนกเสิร์ฟ</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                ลิงก์สำหรับเสิร์ฟ — พร้อมรับ · กดส่งมอบแล้วเพื่อออกจากคิว
              </p>
              <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">
                <span>คลิกเพื่อเปิด</span>
                <HubCardChevron />
              </p>
            </div>
          </div>
        </DrinkPosButton>
      </div>

      <section
        className="rounded-[2rem] border border-white/50 bg-white/35 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.28)] backdrop-blur-xl sm:p-5"
        aria-label="วิธีสะสมคะแนน"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-black text-[#1e1b4b]">วิธีสะสมคะแนน</h3>
            <p className="mt-1 text-xs font-bold text-[#4d47b6]">
              {loyaltyEnabled ? ruleLabel : "ยังไม่เปิดระบบสะสมคะแนน"}
            </p>
          </div>
          <Link
            href="/dashboard/drink-pos/settings"
            className={cn(
              appTemplateOutlineButtonClass,
              "shrink-0 rounded-xl px-3 py-1.5 text-[10px] font-black text-[#4d47b6]",
            )}
          >
            ตั้งค่าคะแนน
          </Link>
        </div>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-left text-xs font-semibold text-[#2e2a58] marker:text-[#0000BF] sm:text-sm">
          <li>
            หน้า <strong className="text-[#1e1b4b]">ออร์เดอร์ / สินค้า</strong> — กรอกเบอร์ในแถบคะแนน แล้วบันทึกบิล
          </li>
          <li>แลกของรางวัลจากรายการในแถบคะแนน หรือให้ลูกค้าแลกเองผ่าน QR</li>
          <li>ลูกค้าเปิด QR สั่งเครื่องดื่ม · พนักงานใช้ลิงก์แผนกทำ / เสิร์ฟ จากบัตรด้านบน</li>
        </ol>
      </section>

      <FormModal
        open={modal === "qr"}
        size="lg"
        appearance="glass"
        glassTint="violet"
        onClose={() => setModal(null)}
        title="QR ลูกค้า"
        footer={<ModalCloseFooter onClose={() => setModal(null)} />}
      >
        <DrinkPosQrPosterClient
          ownerId={ownerId}
          shopLabel={shopLabel}
          logoUrl={logoUrl}
          baseUrl={baseUrl}
          trialSessionId={trialSessionId}
          trialExportBlocked={trialExportBlocked}
          compactForModal
        />
      </FormModal>

      <FormModal
        open={modal === "lookup"}
        size="lg"
        appearance="glass"
        glassTint="amber"
        mobileCentered
        onClose={() => setModal(null)}
        title="ค้นหาสมาชิก"
        description="ใช้ก่อนบันทึกบิลที่หน้าสินค้า — บันทึกจริงอยู่ที่แถบคะแนนบนหน้าขาย"
        footer={<ModalCloseFooter onClose={() => setModal(null)} />}
      >
        <DrinkPosLoyaltyBar
          member={member}
          onMemberChange={setMember}
          hideMembersLink
        />
      </FormModal>

      <FormModal
        open={modal === "kitchen"}
        size="md"
        appearance="glass"
        glassTint="violet"
        onClose={() => setModal(null)}
        title="ลิงก์แผนกทำ"
        footer={<ModalCloseFooter onClose={() => setModal(null)} />}
      >
        <StationLinkBody
          hint="เปิดบนมือถือ/แท็บเล็ตครัว — สถานะอัปเดตทันทีทุกเครื่องที่เปิดคิว"
          url={kitchenUrl}
          copied={copied === "kitchen"}
          onCopy={() => void copyStation("kitchen", kitchenUrl)}
          onOpen={() => window.open(kitchenUrl, "_blank", "noopener,noreferrer")}
        />
      </FormModal>

      <FormModal
        open={modal === "serve"}
        size="md"
        appearance="glass"
        glassTint="violet"
        onClose={() => setModal(null)}
        title="ลิงก์แผนกเสิร์ฟ"
        footer={<ModalCloseFooter onClose={() => setModal(null)} />}
      >
        <StationLinkBody
          hint="เปิดบนมือถือ/แท็บเล็ตเสิร์ฟ — กดพร้อมรับ แล้วกดส่งมอบแล้วเมื่อลูกค้ารับเครื่องดื่ม"
          url={serveUrl}
          copied={copied === "serve"}
          onCopy={() => void copyStation("serve", serveUrl)}
          onOpen={() => window.open(serveUrl, "_blank", "noopener,noreferrer")}
        />
      </FormModal>
    </div>
  );
}

function StationLinkBody({
  hint,
  url,
  copied,
  onCopy,
  onOpen,
}: {
  hint: string;
  url: string;
  copied: boolean;
  onCopy: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[#66638c]">{hint}</p>
      <p className="break-all rounded-2xl border border-[#e8e6fc]/90 bg-[#f8f7ff] px-3 py-3 text-xs font-semibold text-[#4d47b6]">
        {url}
      </p>
      <div className="flex flex-wrap gap-2">
        <DrinkPosButton type="button" className={cn(drinkPosCtaClass, "min-h-[44px] px-4 text-sm")} onClick={onOpen}>
          เปิดลิงก์
        </DrinkPosButton>
        <DrinkPosButton
          type="button"
          className={cn(appTemplateOutlineButtonClass, "min-h-[44px] rounded-xl px-4 text-sm font-black")}
          onClick={onCopy}
        >
          {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
        </DrinkPosButton>
      </div>
    </div>
  );
}
