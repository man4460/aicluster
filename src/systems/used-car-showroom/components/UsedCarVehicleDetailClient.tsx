"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AppEmptyState,
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  AppLabeledImageThumb,
  AppPublicCheckInGlassPage,
  AppTime24Input,
  AppYoutubeLightbox,
  prepareImageFileForUpload,
  useAppCameraCapture,
  useAppImageLightbox,
  useAppNoticePopup,
  useAppYoutubeLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { UsedCarPortalSection } from "@/systems/used-car-showroom/components/UsedCarPortalSection";
import type { UsedCarShopDto } from "@/systems/used-car-showroom/lib/mappers";
import {
  USED_CAR_PAYMENT_METHODS,
  usedCarPaymentMethodLabel,
  usedCarPaymentRequiresSlip,
  type UsedCarPaymentMethod,
} from "@/systems/used-car-showroom/lib/payment-method";
import {
  usedCarShowroomPortalFlatBlockClass,
  usedCarShowroomPortalInsetPanelClass,
  usedCarShowroomPortalLabelClass,
  usedCarShowroomPortalPrimaryBtnClass,
  usedCarShowroomPortalPublicFieldClass,
  usedCarShowroomPortalPublicTextareaClass,
  usedCarShowroomPortalShopNameClass,
  usedCarShowroomOutlineButtonClass,
  usedCarShowroomYoutubeCardGridClass,
} from "@/systems/used-car-showroom/lib/ui-tokens";

type PortalVehicle = {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number | null;
  status: string;
  statusLabel: string;
  askingPriceBaht: number;
  coverImageUrl: string | null;
  description: string | null;
  mileageKm: number | null;
  transmission: string | null;
  fuelType: string | null;
  bodyType: string | null;
  color: string | null;
  plateNumber: string | null;
  images: { id: string; imageUrl: string; isCover: boolean }[];
  videos: { id: string; title: string; youtubeUrl: string; videoId?: string }[];
};

function baht(n: number) {
  return `฿${n.toLocaleString("th-TH")}`;
}

function trialQuery(trialParam?: string | null) {
  const t = trialParam?.trim();
  return t && t !== "prod" ? `?t=${encodeURIComponent(t)}` : "";
}

export function UsedCarVehicleDetailClient({
  slug,
  vehicleId,
  trialParam,
}: {
  slug: string;
  vehicleId: string;
  trialParam?: string | null;
}) {
  const lb = useAppImageLightbox();
  const yt = useAppYoutubeLightbox();
  const notice = useAppNoticePopup();
  const { openCamera, cameraInputRef, cameraModal } = useAppCameraCapture({ title: "ถ่ายสลิป" });
  const galleryRef = useRef<HTMLInputElement>(null);

  const [shop, setShop] = useState<UsedCarShopDto | null>(null);
  const [vehicle, setVehicle] = useState<PortalVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<UsedCarPaymentMethod>("PROMPTPAY");
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [slipBusy, setSlipBusy] = useState(false);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const [apptDoneMsg, setApptDoneMsg] = useState<string | null>(null);
  const [apptBusy, setApptBusy] = useState(false);
  const [apptKind, setApptKind] = useState<"VIEW" | "TEST_DRIVE">("VIEW");
  const [apptOn, setApptOn] = useState(bangkokDateKey());
  const [apptHm, setApptHm] = useState("10:00");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr(null);
    try {
      const qs = trialQuery(trialParam);
      const res = await fetch(
        `/api/used-car-showroom/public/portal/${encodeURIComponent(slug)}/vehicles/${encodeURIComponent(vehicleId)}${qs}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "โหลดไม่สำเร็จ");
      setShop(data.shop ?? null);
      setVehicle(data.vehicle ?? null);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [slug, vehicleId, trialParam]);

  useEffect(() => {
    void load();
  }, [load]);

  const depositBaht = useMemo(() => {
    if (!shop || !vehicle) return 0;
    if (shop.portalBookingPaymentMode === "DEPOSIT") return Math.max(0, shop.depositAmountBaht);
    if (shop.portalBookingPaymentMode === "FULL") return Math.max(0, vehicle.askingPriceBaht);
    return 0;
  }, [shop, vehicle]);

  const needsPay = depositBaht > 0;
  const needsSlip = usedCarPaymentRequiresSlip(paymentMethod, depositBaht);

  useEffect(() => {
    if (!shop || !needsPay || paymentMethod !== "PROMPTPAY" || depositBaht <= 0) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/used-car-showroom/public/promptpay-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            amountBaht: depositBaht,
            t: trialParam?.trim() || null,
          }),
        });
        const data = await res.json();
        if (!cancelled && res.ok) setQrDataUrl(data.qrDataUrl ?? null);
      } catch {
        if (!cancelled) setQrDataUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shop, needsPay, paymentMethod, depositBaht, slug, trialParam]);

  const uploadSlip = async (file: File) => {
    setSlipBusy(true);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.set("file", prepared);
      fd.set("slug", slug);
      if (trialParam?.trim()) fd.set("t", trialParam.trim());
      const res = await fetch("/api/used-car-showroom/public/upload-slip", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัปโหลดไม่สำเร็จ");
      setSlipUrl(data.imageUrl as string);
      notice.show("อัปโหลดสลิปแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setSlipBusy(false);
    }
  };

  const onSlipInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void uploadSlip(file);
  };

  const submitReserve = async () => {
    if (!vehicle || !shop) return;
    if (!name.trim() || !phone.trim()) {
      notice.error("กรอกชื่อและเบอร์โทร");
      return;
    }
    if (needsPay && needsSlip && !slipUrl) {
      notice.error(
        paymentMethod === "PROMPTPAY" ? "แนบสลิปหลังโอนพร้อมเพย์" : "แนบสลิปการโอน",
      );
      return;
    }
    if (vehicle.status === "RESERVED") {
      notice.error("รถคันนี้ติดจองแล้ว");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(
        `/api/used-car-showroom/public/portal/${encodeURIComponent(slug)}/reserve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleId: vehicle.id,
            customerName: name.trim(),
            customerPhone: phone.trim(),
            note: note.trim() || null,
            paymentMethod: needsPay ? paymentMethod : "NONE",
            slipImageUrl: slipUrl,
            t: trialParam?.trim() || null,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "จองไม่สำเร็จ");
      setDoneMsg(typeof data.message === "string" ? data.message : "จองสำเร็จ");
      notice.show(typeof data.message === "string" ? data.message : "จองสำเร็จ");
      setVehicle((v) => (v ? { ...v, status: "RESERVED", statusLabel: "ติดจอง" } : v));
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "จองไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const submitAppointment = async () => {
    if (!vehicle || !shop) return;
    if (!name.trim() || !phone.trim()) {
      notice.error("กรอกชื่อและเบอร์โทร");
      return;
    }
    if (!apptOn || !apptHm) {
      notice.error("เลือกวันและเวลาที่สะดวก");
      return;
    }
    if (apptOn < bangkokDateKey()) {
      notice.error("ไม่สามารถนัดวันในอดีต");
      return;
    }
    setApptBusy(true);
    try {
      const res = await fetch(
        `/api/used-car-showroom/public/portal/${encodeURIComponent(slug)}/appointments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleId: vehicle.id,
            customerName: name.trim(),
            customerPhone: phone.trim(),
            appointmentOn: apptOn,
            appointmentHm: apptHm,
            kind: apptKind,
            note: note.trim() || null,
            t: trialParam?.trim() || null,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "นัดไม่สำเร็จ");
      setApptDoneMsg("บันทึกนัดแล้ว — โชว์รูมจะติดต่อกลับ");
      notice.show("บันทึกนัดแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "นัดไม่สำเร็จ");
    } finally {
      setApptBusy(false);
    }
  };

  if (loading) {
    return (
      <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
        <div className="flex min-h-[50vh] items-center justify-center text-sm font-medium text-slate-600">
          กำลังโหลด…
        </div>
      </AppPublicCheckInGlassPage>
    );
  }

  if (loadErr || !shop || !vehicle) {
    return (
      <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
        <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-sm font-semibold text-rose-600">{loadErr || "ไม่พบรถ"}</p>
          <Link
            href={`/car/${encodeURIComponent(slug)}${trialQuery(trialParam)}`}
            className={usedCarShowroomOutlineButtonClass}
          >
            กลับหน้าร้าน
          </Link>
        </div>
      </AppPublicCheckInGlassPage>
    );
  }

  const cover = vehicle.coverImageUrl || vehicle.images[0]?.imageUrl || null;
  const tq = trialQuery(trialParam);

  return (
    <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
      {notice.popup}
      {cameraModal}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt={vehicle.title} />
      <AppYoutubeLightbox youtubeUrl={yt.youtubeUrl} title={yt.title} onClose={yt.close} />

      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href={`/car/${encodeURIComponent(slug)}${tq}`}
            className={cn(usedCarShowroomOutlineButtonClass, "text-xs")}
          >
            ← กลับหน้าร้าน
          </Link>
          <p className={cn("truncate text-sm", usedCarShowroomPortalShopNameClass)}>
            {shop.displayName}
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-10 px-4 pb-20 sm:space-y-12 sm:px-6">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <button
              type="button"
              className="relative block aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-100"
              onClick={() => cover && lb.open(cover)}
              aria-label="ดูรูปหลัก"
            >
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
                  ไม่มีรูป
                </div>
              )}
            </button>
            {vehicle.images.length > 1 ? (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {vehicle.images.map((img) => (
                  <AppImageThumb
                    key={img.id}
                    src={img.imageUrl}
                    alt={vehicle.title}
                    onOpen={() => lb.open(img.imageUrl)}
                    className="h-16 w-full"
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-3xl">
              {vehicle.title}
            </h1>
            <p className="text-2xl font-black text-[#4d47b6]">{baht(vehicle.askingPriceBaht)}</p>
            <p className="text-sm font-semibold text-[#66638c]">
              {[
                vehicle.statusLabel,
                vehicle.mileageKm != null
                  ? `${vehicle.mileageKm.toLocaleString("th-TH")} กม.`
                  : null,
                vehicle.transmission,
                vehicle.fuelType,
                vehicle.bodyType,
                vehicle.color,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {vehicle.description ? (
              <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-[#3f3a6a]">
                {vehicle.description}
              </p>
            ) : null}
          </div>
        </section>

        {vehicle.videos.length > 0 ? (
          <UsedCarPortalSection title="คลิปวิดีโอ">
            <div className={usedCarShowroomYoutubeCardGridClass}>
              {vehicle.videos.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className="overflow-hidden rounded-xl border border-slate-200/90 bg-white text-left shadow-sm"
                  onClick={() => yt.open(v.youtubeUrl, v.title)}
                >
                  <div className="flex aspect-video items-center justify-center bg-slate-900 text-xs font-bold text-white">
                    เล่น YouTube
                  </div>
                  <p className="line-clamp-2 p-2 text-[11px] font-bold text-[#1e1b4b]">{v.title}</p>
                </button>
              ))}
            </div>
          </UsedCarPortalSection>
        ) : null}

        <UsedCarPortalSection
          id="reserve"
          title={needsPay ? "จองรถ · มัดจำ+สลิป" : "จองรถออนไลน์"}
        >
          {!needsPay ? (
            <div className={usedCarShowroomPortalInsetPanelClass}>
              <p className="text-sm font-semibold text-[#1e1b4b]">
                ร้านนี้ยังไม่เปิดจองมัดจำผ่านเว็บ
              </p>
              <p className="mt-1 text-xs text-[#66638c]">
                ใช้แบบฟอร์ม «นัดดูรถ» ด้านล่างได้เลย — ตามแนวเต็นท์ทั่วไปที่นัดก่อน จองมัดจำเมื่อจะกันคัน
              </p>
            </div>
          ) : doneMsg ? (
            <div
              className={cn(
                usedCarShowroomPortalInsetPanelClass,
                "text-sm font-semibold text-emerald-800",
              )}
            >
              {doneMsg}
            </div>
          ) : vehicle.status === "RESERVED" ? (
            <AppEmptyState>
              <p className="font-semibold text-[#1e1b4b]">รถคันนี้ติดจองแล้ว</p>
              <p className="mt-1 text-sm text-[#66638c]">ติดต่อโชว์รูมหากต้องการสอบถามคิว</p>
            </AppEmptyState>
          ) : (
            <div className={usedCarShowroomPortalFlatBlockClass}>
              <p className="text-xs font-semibold text-[#66638c]">
                จองกันคันจริงตามเต็นท์ไทย — โอนมัดจำแล้วแนบสลิปก่อนยืนยัน
              </p>
              <label className="block space-y-1">
                <span className={usedCarShowroomPortalLabelClass}>ชื่อ</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={usedCarShowroomPortalPublicFieldClass}
                  autoComplete="name"
                  placeholder="ชื่อ-นามสกุล"
                />
              </label>
              <label className="block space-y-1">
                <span className={usedCarShowroomPortalLabelClass}>เบอร์โทร</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={usedCarShowroomPortalPublicFieldClass}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0812345678"
                />
              </label>
              <label className="block space-y-1">
                <span className={usedCarShowroomPortalLabelClass}>หมายเหตุ</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={usedCarShowroomPortalPublicTextareaClass}
                  placeholder="เวลาติดต่อ / รายละเอียดเพิ่ม"
                />
              </label>

              <div className={usedCarShowroomPortalInsetPanelClass}>
                <p className="text-sm font-black text-[#1e1b4b]">
                  ยอดที่ต้องชำระ {baht(depositBaht)}
                  {shop.portalBookingPaymentMode === "DEPOSIT" ? " (มัดจำ)" : " (เต็มราคา)"}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {USED_CAR_PAYMENT_METHODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={cn(
                        usedCarShowroomOutlineButtonClass,
                        paymentMethod === m &&
                          "border-[#5b61ff]/45 bg-[#5b61ff]/10 ring-2 ring-[#5b61ff]/20",
                      )}
                      onClick={() => setPaymentMethod(m)}
                    >
                      {usedCarPaymentMethodLabel(m)}
                    </button>
                  ))}
                </div>

                {paymentMethod === "PROMPTPAY" && qrDataUrl ? (
                  <div className="flex flex-col items-start gap-2 pt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrDataUrl}
                      alt="QR พร้อมเพย์"
                      className="h-44 w-44 rounded-xl border border-slate-200 bg-white object-contain p-2"
                    />
                    {shop.promptPayPhone ? (
                      <p className="text-xs font-semibold text-[#66638c]">
                        พร้อมเพย์ {shop.promptPayPhone}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {(paymentMethod === "TRANSFER" || paymentMethod === "PROMPTPAY") &&
                (shop.bankName || shop.bankAccountNumber) ? (
                  <p className="pt-1 text-xs font-semibold text-[#66638c]">
                    {[shop.bankName, shop.bankAccountNumber, shop.bankAccountName]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}

                {needsSlip ? (
                  <div className="space-y-2 pt-2">
                    <p className={usedCarShowroomPortalLabelClass}>แนบสลิป</p>
                    <AppGalleryCameraFileInputs
                      galleryInputRef={galleryRef}
                      cameraInputRef={cameraInputRef}
                      onChange={onSlipInputChange}
                    />
                    <AppImagePickCameraButtons
                      busy={slipBusy}
                      onPickGallery={() => galleryRef.current?.click()}
                      onPickCamera={() => openCamera((file) => void uploadSlip(file))}
                      labels={{
                        gallery: "เลือกรูปสลิป",
                        camera: "ถ่ายสลิป",
                        busy: "กำลังอัปโหลด…",
                      }}
                      className="justify-start"
                    />
                    {slipUrl ? (
                      <AppLabeledImageThumb
                        src={slipUrl}
                        kind="slip"
                        alt="สลิปชำระเงิน"
                        onOpen={() => lb.open(slipUrl)}
                        className="h-20 w-20"
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                disabled={busy}
                className={cn(usedCarShowroomPortalPrimaryBtnClass, "w-full sm:w-auto")}
                onClick={() => void submitReserve()}
              >
                {busy ? "กำลังบันทึก…" : "ยืนยันจองมัดจำ"}
              </button>
            </div>
          )}
        </UsedCarPortalSection>

        <UsedCarPortalSection id="appointment" title="นัดดูรถ / ทดลองขับ">
          {apptDoneMsg ? (
            <div
              className={cn(
                usedCarShowroomPortalInsetPanelClass,
                "text-sm font-semibold text-emerald-800",
              )}
            >
              {apptDoneMsg}
            </div>
          ) : (
            <div className={usedCarShowroomPortalFlatBlockClass}>
              <p className="text-xs font-semibold text-[#66638c]">
                นัดเข้าชม — ไม่ต้องมัดจำ (แยกจากจองกันคัน)
              </p>
              <label className="block space-y-1">
                <span className={usedCarShowroomPortalLabelClass}>ชื่อ</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={usedCarShowroomPortalPublicFieldClass}
                  autoComplete="name"
                />
              </label>
              <label className="block space-y-1">
                <span className={usedCarShowroomPortalLabelClass}>เบอร์โทร</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={usedCarShowroomPortalPublicFieldClass}
                  inputMode="tel"
                  autoComplete="tel"
                />
              </label>
              <label className="block space-y-1">
                <span className={usedCarShowroomPortalLabelClass}>ประเภท</span>
                <select
                  className={usedCarShowroomPortalPublicFieldClass}
                  value={apptKind}
                  onChange={(e) => setApptKind(e.target.value as "VIEW" | "TEST_DRIVE")}
                >
                  <option value="VIEW">นัดดูรถ</option>
                  <option value="TEST_DRIVE">ทดลองขับ</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className={usedCarShowroomPortalLabelClass}>วันที่ (เวลาไทย)</span>
                <input
                  type="date"
                  className={usedCarShowroomPortalPublicFieldClass}
                  value={apptOn}
                  min={bangkokDateKey()}
                  onChange={(e) => setApptOn(e.target.value)}
                />
              </label>
              <label className="block space-y-1">
                <span className={usedCarShowroomPortalLabelClass}>เวลา</span>
                <AppTime24Input value={apptHm} onChange={setApptHm} />
              </label>
              <label className="block space-y-1">
                <span className={usedCarShowroomPortalLabelClass}>หมายเหตุ</span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={usedCarShowroomPortalPublicTextareaClass}
                  placeholder="รายละเอียดเพิ่ม"
                />
              </label>
              <button
                type="button"
                disabled={apptBusy}
                className={cn(usedCarShowroomPortalPrimaryBtnClass, "w-full sm:w-auto")}
                onClick={() => void submitAppointment()}
              >
                {apptBusy ? "กำลังบันทึก…" : "ยืนยันนัด"}
              </button>
            </div>
          )}
        </UsedCarPortalSection>
      </main>
    </AppPublicCheckInGlassPage>
  );
}
