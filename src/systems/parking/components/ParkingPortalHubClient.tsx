"use client";

import { useState } from "react";
import { ModuleStaffTokenQrPanel } from "@/components/qr/module-staff-token-qr-panel";
import { ModulePublicLinkQrPanel } from "@/components/qr/module-public-link-qr-panel";
import { FormModal } from "@/components/ui/FormModal";
import { parkingPublicPortalUrl } from "@/lib/parking/public-url";
import {
  ParkingCustomerQrHubClient,
  type ParkingQrLotRow,
  type ParkingQrSpotRow,
} from "@/systems/parking/components/ParkingCustomerQrHubClient";

export function ParkingPortalHubClient({
  lots,
  spots,
  businessName,
  logoUrl,
  baseUrl,
  ownerId,
  trialSessionId,
}: {
  lots: ParkingQrLotRow[];
  spots: ParkingQrSpotRow[];
  businessName: string | null;
  logoUrl: string | null;
  baseUrl: string;
  ownerId: string;
  trialSessionId: string;
}) {
  const [modal, setModal] = useState<"booking" | "customer" | "staff" | null>(null);
  const bookingUrl = parkingPublicPortalUrl(baseUrl, ownerId, trialSessionId);
  const cardClass =
    "min-h-[150px] rounded-[2rem] border border-white/60 bg-gradient-to-br from-white/70 via-white/50 to-indigo-50/50 p-5 text-left shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5";
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <button type="button" className={cardClass} onClick={() => setModal("booking")}>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-violet-500 text-xl text-white">P</span>
          <h2 className="mt-3 text-lg font-black text-[#1e1b4b]">เว็บจองลูกค้า</h2>
          <p className="mt-1 text-sm text-[#66638c]">จองที่จอดรายวันและชำระออนไลน์</p>
        </button>
        <button type="button" className={cardClass} onClick={() => setModal("customer")}>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5b61ff] to-violet-500 text-xl text-white">▦</span>
          <h2 className="mt-3 text-lg font-black text-[#1e1b4b]">QR เช็คอินลูกค้า</h2>
          <p className="mt-1 text-sm text-[#66638c]">QR รายช่องสำหรับลูกค้าเช็คอินเอง</p>
        </button>
        <button type="button" className={cardClass} onClick={() => setModal("staff")}>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-xl text-white">👥</span>
          <h2 className="mt-3 text-lg font-black text-[#1e1b4b]">QR พนักงาน</h2>
          <p className="mt-1 text-sm text-[#66638c]">ภาพรวม · เช็คอิน · เช็คเอาต์ · การจอง</p>
        </button>
      </div>
      <FormModal
        open={modal === "booking"}
        onClose={() => setModal(null)}
        size="full"
        appearance="glass"
        glassTint="violet"
        mobileCentered
        title="เว็บไซต์จองลูกค้า"
      >
        <ModulePublicLinkQrPanel
          pageUrl={bookingUrl}
          shopLabel={businessName || "ลานจอดรถ"}
          logoUrl={logoUrl}
          trialExportBlocked={trialSessionId !== "prod"}
          tagline="สแกนเพื่อจองที่จอดรถรายวัน"
          downloadFilePrefix="parking-booking"
        />
      </FormModal>
      <FormModal
        open={modal === "customer"}
        onClose={() => setModal(null)}
        size="full"
        appearance="glass"
        glassTint="violet"
        mobileCentered
        title="QR เช็คอินลูกค้า"
      >
        <ParkingCustomerQrHubClient
          lots={lots}
          spots={spots}
          businessName={businessName}
          logoUrl={logoUrl}
          baseUrl={baseUrl}
        />
      </FormModal>
      <FormModal
        open={modal === "staff"}
        onClose={() => setModal(null)}
        size="full"
        appearance="glass"
        glassTint="amber"
        mobileCentered
        title="QR พนักงาน"
      >
        <ModuleStaffTokenQrPanel
          staffLinkApiPath="/api/parking/session/staff-link"
          shopLabel={businessName || "ลานจอดรถ"}
          logoUrl={logoUrl}
          tagline="สแกนเข้าหน้าพนักงานลานจอด — ลิงก์ถาวร หมุนโทเค็นใหม่ได้"
        />
      </FormModal>
    </div>
  );
}
