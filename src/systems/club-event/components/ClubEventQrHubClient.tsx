"use client";

import { ModulePublicLinkQrPanel } from "@/components/qr/module-public-link-qr-panel";
import { ModuleQrMonthlyGate } from "@/components/qr/ModuleQrMonthlyGate";
import { CLUB_EVENT_MODULE_SLUG } from "@/lib/modules/config";
import { clubEventSettingsHref } from "@/systems/club-event/club-event-module-nav";
import Link from "next/link";

/**
 * แท็บลิงก์ตั้งค่าชมรม — QR/คัดลอกลิงก์เว็บ · สมัคร · ค่าบำรุง
 * ห่อ ModuleQrMonthlyGate ครั้งเดียวตามแม่แบบร้าน
 */
export function ClubEventQrHubClient({
  portalAbsoluteUrl,
  signupAbsoluteUrl,
  duesAbsoluteUrl,
  shopLabel,
  logoUrl,
  trialExportBlocked,
  signupEnabled,
  duesEnabled,
}: {
  portalAbsoluteUrl: string;
  signupAbsoluteUrl: string | null;
  duesAbsoluteUrl: string | null;
  shopLabel: string;
  logoUrl: string | null;
  trialExportBlocked: boolean;
  signupEnabled: boolean;
  duesEnabled: boolean;
}) {
  return (
    <ModuleQrMonthlyGate moduleSlug={CLUB_EVENT_MODULE_SLUG}>
      <div className="space-y-4">
        <ModulePublicLinkQrPanel
          moduleSlug={CLUB_EVENT_MODULE_SLUG}
          pageUrl={portalAbsoluteUrl}
          shopLabel={shopLabel || "ชมรม"}
          logoUrl={logoUrl}
          trialExportBlocked={trialExportBlocked}
          planGateAllowed
          tagline="สแกนเพื่อเข้าเว็บชมรม / ดูกิจกรรม"
          openLabel="เปิดเว็บ"
          qrAlt="QR เว็บชมรมสาธารณะ"
          posterAlt="โปสเตอร์ QR เว็บชมรม"
          downloadFilePrefix="club-portal"
        />

        {signupEnabled && signupAbsoluteUrl ? (
          <ModulePublicLinkQrPanel
            moduleSlug={CLUB_EVENT_MODULE_SLUG}
            pageUrl={signupAbsoluteUrl}
            shopLabel={shopLabel || "ชมรม"}
            logoUrl={logoUrl}
            trialExportBlocked={trialExportBlocked}
            planGateAllowed
            tagline="สแกนเพื่อสมัครสมาชิกชมรม"
            openLabel="เปิดหน้าสมัคร"
            qrAlt="QR สมัครสมาชิก"
            posterAlt="โปสเตอร์ QR สมัครสมาชิก"
            downloadFilePrefix="club-signup"
          />
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2.5 text-xs font-semibold text-[#66638c]">
            ลิงก์สมัครสมาชิก — เปิดได้ที่{" "}
            <Link
              href={clubEventSettingsHref("portal")}
              className="font-bold text-[#0000BF] underline underline-offset-2"
            >
              ตั้งค่าเว็บไซต์
            </Link>
          </p>
        )}

        {duesEnabled && duesAbsoluteUrl ? (
          <ModulePublicLinkQrPanel
            moduleSlug={CLUB_EVENT_MODULE_SLUG}
            pageUrl={duesAbsoluteUrl}
            shopLabel={shopLabel || "ชมรม"}
            logoUrl={logoUrl}
            trialExportBlocked={trialExportBlocked}
            planGateAllowed
            tagline="สแกนเพื่อชำระค่าบำรุงสมาชิก"
            openLabel="เปิดหน้าชำระ"
            qrAlt="QR ค่าบำรุง"
            posterAlt="โปสเตอร์ QR ค่าบำรุง"
            downloadFilePrefix="club-dues"
          />
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2.5 text-xs font-semibold text-[#66638c]">
            ลิงก์ชำระค่าบำรุง — เปิดเก็บได้ที่{" "}
            <Link
              href={clubEventSettingsHref("dues")}
              className="font-bold text-[#0000BF] underline underline-offset-2"
            >
              ค่าบำรุงประจำปี
            </Link>
          </p>
        )}
      </div>
    </ModuleQrMonthlyGate>
  );
}
