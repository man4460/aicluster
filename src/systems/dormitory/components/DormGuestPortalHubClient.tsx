"use client";

import { useState } from "react";
import { FormModal } from "@/components/ui/FormModal";
import { ModuleStaffTokenQrPanel } from "@/components/qr/module-staff-token-qr-panel";
import { DormQrPosterClient } from "@/systems/dormitory/components/DormQrPosterClient";
import { DormPortalMediaSettings } from "@/systems/dormitory/components/DormPortalMediaSettings";
import { dormBtnPrimary, dormBtnSecondary } from "@/systems/dormitory/dorm-ui";
import { dormHubCardAmberClass, dormHubCardVioletClass } from "@/systems/dormitory/lib/ui-tokens";
import { cn } from "@/lib/cn";

function ModalCloseFooter({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex justify-end">
      <button type="button" onClick={onClose} className={cn(dormBtnPrimary, "min-h-10 px-4")} aria-label="ปิด">
        ปิด
      </button>
    </div>
  );
}

export function DormGuestPortalHubClient({
  ownerId,
  trialSessionId,
  baseUrl,
  dormLabel,
  logoUrl = null,
  trialExportBlocked = false,
  initialPortalBannerUrl = null,
  initialPortalGallery = [],
  initialAddress = "",
  initialContactLine = "",
  initialFacebookUrl = "",
  initialMapUrl = "",
  embedded = false,
}: {
  ownerId: string;
  trialSessionId: string;
  baseUrl: string;
  dormLabel: string;
  logoUrl?: string | null;
  trialExportBlocked?: boolean;
  initialPortalBannerUrl?: string | null;
  initialPortalGallery?: string[];
  initialAddress?: string;
  initialContactLine?: string;
  initialFacebookUrl?: string;
  initialMapUrl?: string;
  /** ฝังในแท็บตั้งค่า — แสดงเฉพาะ QR (สื่ออยู่ในแบบฟอร์มหลัก) */
  embedded?: boolean;
}) {
  const [modal, setModal] = useState<"qr" | "staff" | null>(null);
  const [form, setForm] = useState({
    portalBannerUrl: initialPortalBannerUrl ?? "",
    portalGallery: initialPortalGallery ?? [],
    address: initialAddress,
    contactLine: initialContactLine,
    facebookUrl: initialFacebookUrl,
    mapUrl: initialMapUrl,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const saveMedia = async () => {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/dorm/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portalBannerUrl: form.portalBannerUrl.trim() || null,
          portalGallery: form.portalGallery,
          address: form.address.trim() || null,
          contactLine: form.contactLine.trim() || null,
          facebookUrl: form.facebookUrl.trim() || null,
          mapUrl: form.mapUrl.trim() || null,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "บันทึกไม่สำเร็จ");
      setMsg("บันทึกสื่อเว็บลูกค้าแล้ว");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <button type="button" onClick={() => setModal("qr")} className={dormHubCardVioletClass}>
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#7c66ff] text-white shadow-lg">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h7v7h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1e1b4b] sm:text-xl">QR เว็บหอพัก</h2>
              <p className="mt-2 text-sm font-medium text-slate-600">ลูกค้าดูห้องว่าง · ติดต่อจอง</p>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-[#5b61ff]">คลิกเพื่อเปิด</p>
            </div>
          </div>
        </button>

        <button type="button" onClick={() => setModal("staff")} className={dormHubCardAmberClass}>
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1e1b4b] sm:text-xl">QR พนักงาน</h2>
              <p className="mt-2 text-sm font-medium text-slate-600">ภาพรวม · จัดการห้อง (ไม่ต้องล็อกอินแดชบอร์ด)</p>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-amber-800">คลิกเพื่อเปิด</p>
            </div>
          </div>
        </button>
      </div>

      <FormModal
        open={modal === "qr"}
        onClose={() => setModal(null)}
        size="lg"
        appearance="glass"
        glassTint="violet"
        mobileCentered
        title="QR เว็บหอพัก"
        footer={<ModalCloseFooter onClose={() => setModal(null)} />}
      >
        <DormQrPosterClient
          ownerId={ownerId}
          trialSessionId={trialSessionId}
          baseUrl={baseUrl}
          dormLabel={dormLabel}
          logoUrl={logoUrl}
          trialExportBlocked={trialExportBlocked}
          compactForModal
        />
      </FormModal>

      <FormModal
        open={modal === "staff"}
        onClose={() => setModal(null)}
        size="lg"
        appearance="glass"
        glassTint="amber"
        mobileCentered
        title="QR พนักงาน"
        footer={<ModalCloseFooter onClose={() => setModal(null)} />}
      >
        <ModuleStaffTokenQrPanel
          staffLinkApiPath="/api/dorm/session/staff-link"
          shopLabel={dormLabel}
          logoUrl={logoUrl}
          trialExportBlocked={trialExportBlocked}
          tagline="สแกนเข้าหน้าพนักงาน — ภาพรวม · จัดการห้อง"
          mobileBannerText="สแกน QR หรือเปิดลิงก์เพื่อเข้าหน้าพนักงาน"
          openPrimaryLabel="เปิดหน้าพนักงาน"
        />
      </FormModal>

      {!embedded ? (
      <div className="rounded-[2rem] border border-white/60 bg-white/55 p-4 backdrop-blur-sm sm:p-5">
        <h3 className="text-base font-black text-[#1e1b4b]">สื่อบนเว็บลูกค้า</h3>
        <p className="mt-1 text-xs font-semibold text-[#66638c]">แบนเนอร์ · แกลเลอรี · ติดต่อ</p>
        {err ? <p className="mt-2 text-sm text-rose-600">{err}</p> : null}
        {msg ? <p className="mt-2 text-sm font-semibold text-emerald-700">{msg}</p> : null}
        <div className="mt-4">
          <DormPortalMediaSettings
            bannerUrl={form.portalBannerUrl}
            gallery={form.portalGallery}
            address={form.address}
            contactLine={form.contactLine}
            facebookUrl={form.facebookUrl}
            mapUrl={form.mapUrl}
            onBannerUrlChange={(url) => setForm((f) => ({ ...f, portalBannerUrl: url }))}
            onGalleryChange={(portalGallery) => setForm((f) => ({ ...f, portalGallery }))}
            onAddressChange={(address) => setForm((f) => ({ ...f, address }))}
            onContactLineChange={(contactLine) => setForm((f) => ({ ...f, contactLine }))}
            onFacebookUrlChange={(facebookUrl) => setForm((f) => ({ ...f, facebookUrl }))}
            onMapUrlChange={(mapUrl) => setForm((f) => ({ ...f, mapUrl }))}
            disabled={busy}
          />
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void saveMedia()}
          className={cn(dormBtnPrimary, "mt-4 min-h-11 px-5")}
        >
          {busy ? "กำลังบันทึก…" : "บันทึกสื่อเว็บลูกค้า"}
        </button>
      </div>
      ) : null}
    </div>
  );
}
