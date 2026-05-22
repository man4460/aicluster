"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { FormModal } from "@/components/ui/FormModal";
import { DrinkPosButton } from "@/systems/drink-pos/components/DrinkPosButton";
import { DrinkPosLoyaltyBar } from "@/systems/drink-pos/components/DrinkPosLoyaltyBar";
import { DrinkPosQrPosterClient } from "@/systems/drink-pos/components/DrinkPosQrPosterClient";
import type { DrinkPosMemberDto } from "@/systems/drink-pos/lib/member-service";

type Props = {
  ownerId: string;
  trialSessionId: string;
  baseUrl: string;
  shopLabel: string;
  trialExportBlocked?: boolean;
};

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

/** Hub สมาชิก — การ์ดคู่ + FormModal แบบคาร์แคร์ (ดู shop-qr-hub-popup-pattern.mdc) */
export function DrinkPosLoyaltyHubClient({
  ownerId,
  trialSessionId,
  baseUrl,
  shopLabel,
  trialExportBlocked = false,
}: Props) {
  const [showQrModal, setShowQrModal] = useState(false);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [member, setMember] = useState<DrinkPosMemberDto | null>(null);
  const [redeemMode, setRedeemMode] = useState(false);

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <DrinkPosButton
          type="button"
          onClick={() => {
            setShowLookupModal(false);
            setShowQrModal(true);
          }}
          className={cn(
            "group relative w-full overflow-hidden rounded-[2.5rem] border border-white/50 text-left",
            "bg-gradient-to-br from-white/50 via-indigo-50/35 to-violet-200/25",
            "p-6 shadow-[0_28px_70px_-24px_rgba(91,97,255,0.42),inset_0_1px_0_0_rgba(255,255,255,0.65)] backdrop-blur-2xl",
            "ring-1 ring-inset ring-white/60 transition-all duration-300",
            "hover:-translate-y-1 hover:border-white/75 hover:shadow-[0_34px_85px_-22px_rgba(91,97,255,0.48)]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b61ff]",
            "active:translate-y-0 sm:p-8",
          )}
          aria-label="เปิดจัดการ QR ลูกค้า"
        >
          <span className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#5b61ff]/28 blur-3xl" aria-hidden />
          <span className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-fuchsia-400/18 blur-3xl" aria-hidden />
          <div className="relative flex items-start gap-4 sm:gap-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/55 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] ring-1 ring-white/75 backdrop-blur-md sm:h-16 sm:w-16">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7 text-[#5b61ff] sm:h-8 sm:w-8"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3h-3zM20 14h1v1h-1zM18 18h3v3h-3z" />
              </svg>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">QR ลูกค้า</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                สแกนตรวจแต้ม · คัดลอกลิงก์ ดาวน์โหลดโปสเตอร์ — ดูตัวอย่างในป๊อปอัป
              </p>
              <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5b61ff]">
                <span>คลิกเพื่อเปิด</span>
                <HubCardChevron />
              </p>
            </div>
          </div>
        </DrinkPosButton>

        <DrinkPosButton
          type="button"
          onClick={() => {
            setShowQrModal(false);
            setShowLookupModal(true);
          }}
          className={cn(
            "group relative w-full overflow-hidden rounded-[2.5rem] border border-white/50 text-left",
            "bg-gradient-to-br from-white/50 via-amber-50/35 to-orange-100/22",
            "p-6 shadow-[0_28px_70px_-24px_rgba(217,119,6,0.35),inset_0_1px_0_0_rgba(255,255,255,0.65)] backdrop-blur-2xl",
            "ring-1 ring-inset ring-white/60 transition-all duration-300",
            "hover:-translate-y-1 hover:border-white/75 hover:shadow-[0_34px_85px_-22px_rgba(217,119,6,0.4)]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600",
            "active:translate-y-0 sm:p-8",
          )}
          aria-label="เปิดค้นหาสมาชิกที่เคาน์เตอร์"
        >
          <span className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-amber-400/25 blur-3xl" aria-hidden />
          <span className="pointer-events-none absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-orange-300/15 blur-3xl" aria-hidden />
          <div className="relative flex items-start gap-4 sm:gap-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/55 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] ring-1 ring-white/75 backdrop-blur-md sm:h-16 sm:w-16">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7 text-amber-700 sm:h-8 sm:w-8"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" />
                <path d="M16 7l1.5 1.5M18 4v3M21 5.5h-3" strokeLinecap="round" />
              </svg>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">ค้นหาสมาชิก</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                เบอร์ 10 หลักหรือ 4 หลักท้าย — ดูแต้มและสถานะแลกฟรีก่อนบันทึกบิลที่หน้าสินค้า
              </p>
              <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-800">
                <span>คลิกเพื่อเปิด</span>
                <HubCardChevron />
              </p>
            </div>
          </div>
        </DrinkPosButton>
      </div>

      <section
        className="rounded-[2rem] border border-white/50 bg-white/35 p-4 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.28)] backdrop-blur-xl sm:p-5"
        aria-label="วิธีสะสมแต้ม"
      >
        <h3 className="text-sm font-black text-[#1e1b4b]">วิธีสะสมแต้ม</h3>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-left text-xs font-semibold text-[#2e2a58] marker:text-[#5b61ff] sm:text-sm">
          <li>
            หน้า <strong className="text-[#1e1b4b]">สินค้า</strong> — ค้นหาเบอร์ในแถบสะสมแต้ม แล้วบันทึกบิล (+1 แต้มต่อบิล)
          </li>
          <li>
            ครบตามที่ตั้ง — ติ๊ก <strong className="text-[#1e1b4b]">แลกฟรี</strong> แล้วบันทึกบิล (ยอด 0 บาท)
          </li>
          <li>ลูกค้าเปิด QR / ลิงก์ด้านบนเพื่อตรวจแต้มเอง</li>
        </ol>
      </section>

      <FormModal
        open={showQrModal}
        size="lg"
        appearance="glass"
        glassTint="violet"
        onClose={() => setShowQrModal(false)}
        title="QR ลูกค้า"
        footer={<ModalCloseFooter onClose={() => setShowQrModal(false)} />}
      >
        <DrinkPosQrPosterClient
          ownerId={ownerId}
          shopLabel={shopLabel}
          baseUrl={baseUrl}
          trialSessionId={trialSessionId}
          trialExportBlocked={trialExportBlocked}
          compactForModal
        />
      </FormModal>

      <FormModal
        open={showLookupModal}
        size="lg"
        appearance="glass"
        glassTint="amber"
        mobileCentered
        onClose={() => setShowLookupModal(false)}
        title="ค้นหาสมาชิก"
        description="ใช้ก่อนบันทึกบิลที่หน้าสินค้า — บันทึกจริงอยู่ที่แถบสะสมแต้มบนหน้าขาย"
        footer={<ModalCloseFooter onClose={() => setShowLookupModal(false)} />}
      >
        <DrinkPosLoyaltyBar
          member={member}
          onMemberChange={setMember}
          redeemMode={redeemMode}
          onRedeemModeChange={setRedeemMode}
          hideMembersLink
        />
      </FormModal>
    </div>
  );
}
