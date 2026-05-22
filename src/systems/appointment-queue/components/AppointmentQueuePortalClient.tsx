"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  AppPublicCheckInGlassPage,
  appPublicCheckInGlassCardClass,
  prepareImageFileForUpload,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { useMounted } from "@/lib/use-mounted";
import {
  CarWashPublicSlotPicker,
  type PublicSlotItem,
} from "@/systems/car-wash/CarWashPublicSlotPicker";

type ShopInfo = {
  shop: {
    displayName: string;
    tagline: string | null;
    depositRequired: boolean;
    depositAmountBaht: number | null;
    promptPayId: string | null;
    promptPayName: string | null;
    bankAccountNote: string | null;
  };
  services: { id: number; name: string; durationMinutes: number; priceBaht: number | null }[];
};

type BookingResult = {
  id: number;
  status: string;
  timeLabel: string;
  dateLabel: string;
  depositRequired: boolean;
  depositAmountBaht: number | null;
};

type SlotsPayload = {
  openTime?: string;
  closeTime?: string;
  slotMinutes?: number;
  isClosed?: boolean;
  slots?: PublicSlotItem[];
  error?: string;
};

const fieldClass =
  "mt-1.5 w-full rounded-2xl border border-white/70 bg-white/60 px-4 py-3.5 text-sm font-semibold text-[#1e1b4b] shadow-[inset_0_1px_2px_rgba(30,27,75,0.06)] backdrop-blur-sm outline-none transition-all placeholder:text-[#a8a5cc] focus:border-[#5b61ff]/50 focus:bg-white/80 focus:ring-2 focus:ring-[#5b61ff]/15";

const labelClass = "block text-xs font-semibold text-[#6b6894]";

function PortalSkeleton() {
  return (
    <>
      <div className={appPublicCheckInGlassCardClass} aria-hidden>
        <div className="space-y-3 px-5 py-5 sm:px-6">
          <div className="h-4 w-24 animate-pulse rounded bg-white/40" />
          <div className="h-12 animate-pulse rounded-2xl bg-white/50" />
          <div className="h-12 animate-pulse rounded-2xl bg-white/50" />
        </div>
      </div>
      <div className={appPublicCheckInGlassCardClass} aria-hidden>
        <div className="space-y-3 px-5 py-5 sm:px-6">
          <div className="h-12 animate-pulse rounded-2xl bg-white/50" />
          <div className="h-24 animate-pulse rounded-2xl bg-white/40" />
        </div>
      </div>
      <div className="h-[52px] animate-pulse rounded-2xl bg-white/40" aria-hidden />
    </>
  );
}

function PortalHeaderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7 text-[#5b61ff]"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M12 14v4M9 18h6" />
    </svg>
  );
}

export function AppointmentQueuePortalClient({ ownerId }: { ownerId: string }) {
  const mounted = useMounted();
  const [info, setInfo] = useState<ShopInfo | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [dateKey, setDateKey] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slotAvailability, setSlotAvailability] = useState<PublicSlotItem[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState("09:00");
  const [scheduleClose, setScheduleClose] = useState("18:00");
  const [scheduleSlotMinutes, setScheduleSlotMinutes] = useState(60);
  const [scheduleClosed, setScheduleClosed] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [booking, setBooking] = useState<BookingResult | null>(null);
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lb = useAppImageLightbox();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const phoneDigits = useMemo(() => phone.replace(/\D/g, ""), [phone]);
  const phoneOk = phoneDigits.length >= 9;

  useEffect(() => {
    setDateKey(bangkokDateKey());
  }, []);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/appointment-queue/public/portal/info?ownerId=${encodeURIComponent(ownerId)}`);
      const json = (await res.json()) as ShopInfo & { error?: string };
      if (!res.ok) {
        setErr(json.error ?? "ไม่พบร้าน");
        return;
      }
      setInfo(json);
      if (json.services[0]) setServiceId(json.services[0].id);
    })();
  }, [ownerId]);

  const loadSlots = useCallback(async () => {
    if (!serviceId || !dateKey) return;
    setScheduleLoading(true);
    setErr(null);
    try {
      const q = new URLSearchParams({
        ownerId,
        date: dateKey,
        serviceId: String(serviceId),
      });
      const res = await fetch(`/api/appointment-queue/public/portal/slots?${q}`);
      const json = (await res.json().catch(() => ({}))) as SlotsPayload;
      if (!res.ok) {
        setErr(json.error ?? "โหลดเวลาไม่สำเร็จ");
        setSlotAvailability([]);
        setSelectedSlot("");
        return;
      }
      setScheduleOpen(json.openTime ?? "09:00");
      setScheduleClose(json.closeTime ?? "18:00");
      setScheduleSlotMinutes(json.slotMinutes ?? 60);
      setScheduleClosed(Boolean(json.isClosed));
      const slots = json.slots ?? [];
      setSlotAvailability(slots);
      const firstFree = slots.find((s) => s.available);
      setSelectedSlot(firstFree?.time ?? "");
    } finally {
      setScheduleLoading(false);
    }
  }, [ownerId, dateKey, serviceId]);

  useEffect(() => {
    if (serviceId && dateKey && phoneOk) void loadSlots();
  }, [serviceId, dateKey, phoneOk, loadSlots]);

  const scheduledAtLocal = useMemo(() => {
    if (!selectedSlot || !dateKey) return null;
    return `${dateKey}T${selectedSlot}:00+07:00`;
  }, [dateKey, selectedSlot]);

  const book = async () => {
    if (!serviceId || !scheduledAtLocal || !phoneOk) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/appointment-queue/public/portal/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          phone: phoneDigits,
          customerName: customerName.trim() || null,
          serviceId,
          scheduledAtLocal,
        }),
      });
      const json = (await res.json()) as { booking?: BookingResult; error?: string };
      if (!res.ok) throw new Error(json.error ?? "จองไม่สำเร็จ");
      setBooking(json.booking!);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "จองไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const uploadSlip = async (file: File) => {
    const prepared = await prepareImageFileForUpload(file);
    const fd = new FormData();
    fd.set("ownerId", ownerId);
    fd.set("file", prepared);
    const res = await fetch("/api/appointment-queue/public/portal/upload-slip", { method: "POST", body: fd });
    const json = (await res.json()) as { imageUrl?: string; error?: string };
    if (!res.ok) throw new Error(json.error ?? "อัปโหลดไม่สำเร็จ");
    setSlipUrl(json.imageUrl!);
    return json.imageUrl!;
  };

  const attachSlip = async () => {
    if (!booking || !slipUrl) return;
    setBusy(true);
    try {
      const res = await fetch("/api/appointment-queue/public/portal/attach-slip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, bookingId: booking.id, slipUrl }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "ส่งสลิปไม่สำเร็จ");
      setErr(null);
      alert("ส่งสลิปแล้ว — ร้านจะยืนยันมัดจำให้");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "ส่งสลิปไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  if (err && !info) {
    return (
      <AppPublicCheckInGlassPage>
        <div className="relative mx-auto max-w-md px-2 py-12 text-center">
          <p className="font-semibold text-rose-600">{err}</p>
        </div>
      </AppPublicCheckInGlassPage>
    );
  }

  if (!info) {
    return (
      <AppPublicCheckInGlassPage>
        <div className="relative mx-auto max-w-md px-2 py-12 text-center text-sm text-[#6b6894]">
          กำลังโหลด…
        </div>
      </AppPublicCheckInGlassPage>
    );
  }

  if (booking) {
    const needSlip = booking.depositRequired && booking.status === "PENDING_DEPOSIT";
    return (
      <AppPublicCheckInGlassPage>
        <div className="relative mx-auto max-w-md space-y-4">
          <div className="mb-4 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/70 bg-gradient-to-br from-white/80 to-violet-100/60 shadow-[0_8px_24px_-8px_rgba(91,97,255,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/70">
              <PortalHeaderIcon />
            </div>
            <h1 className="text-xl font-black tracking-tight text-[#1e1b4b]">จองสำเร็จ</h1>
            <p className="mt-1 text-sm text-[#6b6894]">
              {booking.dateLabel} · {booking.timeLabel}
            </p>
          </div>

          <div className={appPublicCheckInGlassCardClass}>
            <div className="px-5 py-5 text-left sm:px-6">
              {needSlip ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-[#4d47b6]">
                    โอนมัดจำ {booking.depositAmountBaht ?? info.shop.depositAmountBaht ?? ""} บาท
                  </p>
                  {info.shop.promptPayId ? (
                    <p className="text-xs text-[#6b6894]">PromptPay: {info.shop.promptPayId}</p>
                  ) : null}
                  {info.shop.promptPayName ? (
                    <p className="text-xs text-[#6b6894]">ชื่อบัญชี: {info.shop.promptPayName}</p>
                  ) : null}
                  <AppGalleryCameraFileInputs
                    galleryInputRef={galleryRef}
                    cameraInputRef={cameraRef}
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f) return;
                      try {
                        await uploadSlip(f);
                      } catch (uploadErr) {
                        setErr(uploadErr instanceof Error ? uploadErr.message : "อัปโหลดไม่สำเร็จ");
                      }
                    }}
                  />
                  <AppImagePickCameraButtons
                    onPickGallery={() => galleryRef.current?.click()}
                    onPickCamera={() => cameraRef.current?.click()}
                    busy={busy}
                  />
                  {slipUrl ? (
                    <>
                      <AppImageThumb src={slipUrl} alt="สลิปมัดจำ" onOpen={() => lb.open(slipUrl)} />
                      <button
                        type="button"
                        className={cn(
                          "flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-[#5b61ff]/30 bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] py-4 text-sm font-bold text-white shadow-[0_14px_30px_-10px_rgba(91,97,255,0.45)] active:scale-[0.98] disabled:opacity-60",
                        )}
                        disabled={busy}
                        onClick={() => void attachSlip()}
                      >
                        ส่งสลิปให้ร้าน
                      </button>
                    </>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm font-semibold text-emerald-800">ยืนยันคิวแล้ว — พบร้านตามเวลานัด</p>
              )}
            </div>
          </div>
          <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิปมัดจำ" />
        </div>
      </AppPublicCheckInGlassPage>
    );
  }

  const canBook = phoneOk && Boolean(selectedSlot) && !scheduleClosed && !busy;

  return (
    <AppPublicCheckInGlassPage>
      <div className="relative mx-auto max-w-md space-y-4">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/70 bg-gradient-to-br from-white/80 to-violet-100/60 shadow-[0_8px_24px_-8px_rgba(91,97,255,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/70">
            <PortalHeaderIcon />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1e1b4b]">{info.shop.displayName}</h1>
          <p className="mt-1 text-sm text-[#6b6894]">
            {info.shop.tagline?.trim() || "จองเวลาล่วงหน้า — ไม่ต้องทักแชทถามคิว"}
          </p>
        </div>

        {!mounted ? (
          <PortalSkeleton />
        ) : (
          <>
            <div className={appPublicCheckInGlassCardClass}>
              <div className="px-5 py-5 sm:px-6">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#9490c0]">
                  ข้อมูลการจอง
                </p>
                <label className={labelClass}>
                  บริการ
                  <select
                    className={fieldClass}
                    value={serviceId ?? ""}
                    onChange={(e) => setServiceId(Number(e.target.value))}
                  >
                    {info.services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.durationMinutes} นาที)
                        {s.priceBaht != null ? ` · ฿${s.priceBaht}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={cn(labelClass, "mt-3")}>
                  เบอร์โทร
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="0812345678"
                    className={fieldClass}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.slice(0, 16))}
                  />
                </label>
                {!phoneOk && phone.length > 0 ? (
                  <p className="mt-1 text-xs text-amber-800">กรอกเบอร์อย่างน้อย 9 หลัก</p>
                ) : null}
                <label className={cn(labelClass, "mt-3")}>
                  ชื่อ (ไม่บังคับ)
                  <input
                    type="text"
                    placeholder="ชื่อสำหรับจอง"
                    className={fieldClass}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value.slice(0, 100))}
                  />
                </label>
              </div>
            </div>

            {phoneOk ? (
              <div className={appPublicCheckInGlassCardClass}>
                <div className="px-5 py-5 sm:px-6">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#9490c0]">
                    เลือกวันและเวลา
                  </p>
                  <CarWashPublicSlotPicker
                    bookingDateKey={dateKey}
                    onDateChange={setDateKey}
                    selectedSlot={selectedSlot}
                    onSlotChange={setSelectedSlot}
                    slotAvailability={slotAvailability}
                    scheduleLoading={scheduleLoading}
                    scheduleClosed={scheduleClosed}
                    scheduleOpen={scheduleOpen}
                    scheduleClose={scheduleClose}
                    scheduleSlotMinutes={scheduleSlotMinutes}
                  />
                </div>
              </div>
            ) : (
              <div className={appPublicCheckInGlassCardClass}>
                <p className="px-5 py-5 text-center text-sm text-[#6b6894] sm:px-6">
                  กรอกเบอร์โทรก่อน — แล้วเลือกวันและเวลาได้
                </p>
              </div>
            )}

            {err ? (
              <div className="overflow-hidden rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-3.5 ring-1 ring-inset ring-rose-100/80">
                <p className="text-center text-sm font-semibold text-rose-800">{err}</p>
              </div>
            ) : null}

            <button
              type="button"
              disabled={!canBook}
              onClick={() => void book()}
              aria-label={busy ? "กำลังจอง" : "ยืนยันจองคิว"}
              className={cn(
                "flex min-h-[52px] w-full items-center justify-center rounded-2xl py-4 transition-all",
                !canBook
                  ? "border border-white/60 bg-white/40 text-[#a8a5cc]"
                  : "border border-[#5b61ff]/30 bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] text-white shadow-[0_14px_30px_-10px_rgba(91,97,255,0.45)] active:scale-[0.98]",
              )}
            >
              {busy ? (
                <svg
                  className="h-6 w-6 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18M12 14v4M9 18h6" />
                </svg>
              )}
            </button>
          </>
        )}
      </div>
    </AppPublicCheckInGlassPage>
  );
}
