"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, CreditCard, Landmark, Phone, QrCode, ShieldCheck, TicketPercent } from "lucide-react";
import {
  AppPublicCheckInGlassPage,
  appPublicCheckInGlassCardClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  type FootballTurfBooking,
  type FootballTurfPromotionSale,
  type FootballTurfVenueSettings,
  createFootballTurfRepository,
} from "@/systems/football-turf/football-turf-service";
import {
  canActOnBookingQueue,
  isBookingTimePassed,
} from "@/systems/football-turf/lib/time-queue";

const FOOTBALL_TURF_MODULE_NAME = "สนามฟุตบอล";

const EMPTY_SETTINGS: FootballTurfVenueSettings = {
  venueName: "",
  venueSubtitle: "",
  promptpayNumber: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  venueAddress: "",
  taxId: "",
  contactPhone: "",
  contactLine: "",
  note: "",
};

function bookingStatusLabel(status: FootballTurfBooking["status"]) {
  if (status === "CHECKED_IN") return "เช็กอินแล้ว";
  if (status === "PLAYING") return "กำลังใช้งาน";
  if (status === "COMPLETED") return "ปิดรอบแล้ว";
  if (status === "CANCELLED") return "ยกเลิก";
  return "จองแล้ว";
}

function bookingStatusTone(status: FootballTurfBooking["status"]) {
  if (status === "CHECKED_IN") return "bg-sky-50 text-sky-700 ring-sky-200";
  if (status === "PLAYING") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "COMPLETED") return "bg-violet-50 text-violet-700 ring-violet-200";
  if (status === "CANCELLED") return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

export function FootballTurfCheckInClient({
  ownerId,
  trialSessionId,
}: {
  ownerId: string;
  trialSessionId?: string;
}) {
  const repo = useMemo(
    () => createFootballTurfRepository({ mode: "public", ownerId, trialSessionId }),
    [ownerId, trialSessionId],
  );
  const [bookings, setBookings] = useState<FootballTurfBooking[]>([]);
  const [sales, setSales] = useState<FootballTurfPromotionSale[]>([]);
  const [settings, setSettings] = useState<FootballTurfVenueSettings>(EMPTY_SETTINGS);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [liveClockMs, setLiveClockMs] = useState(() => Date.now());

  const refresh = useCallback(async () => {
    const [bookingRows, saleRows, settingsRow] = await Promise.all([
      repo.listBookings(),
      repo.listPromotionSales(),
      repo.getSettings(),
    ]);
    setBookings(bookingRows);
    setSales(saleRows);
    setSettings(settingsRow);
  }, [repo]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(id);
  }, [refresh]);

  useEffect(() => {
    const id = window.setInterval(() => setLiveClockMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const liveNow = useMemo(() => new Date(liveClockMs), [liveClockMs]);
  const phoneDigits = phone.replace(/\D/g, "");
  const myBookings = useMemo(
    () =>
      phoneDigits
        ? bookings
            .filter((item) => item.customerPhone.includes(phoneDigits) && item.status !== "CANCELLED")
            .slice(0, 8)
        : [],
    [bookings, phoneDigits],
  );
  const mySales = useMemo(
    () => (phoneDigits ? sales.filter((item) => item.customerPhone.includes(phoneDigits)) : []),
    [sales, phoneDigits],
  );
  const moduleVenueLine = settings.venueName.trim() || settings.venueSubtitle.trim() || "สนามฟุตบอล";
  const activeQueueCount = useMemo(
    () => myBookings.filter((item) => canActOnBookingQueue(item, liveNow)).length,
    [myBookings, liveNow],
  );

  async function checkInBooking(bookingId: number) {
    const target = bookings.find((item) => item.id === bookingId);
    if (!target || !canActOnBookingQueue(target, new Date()) || target.status !== "BOOKED") {
      setMessage("คิวนี้หมดเวลาหรือเช็กอินไม่ได้แล้ว");
      return;
    }
    await repo.updateBooking(bookingId, { status: "CHECKED_IN" });
    setMessage("อัปเดตสถานะเช็กอินเรียบร้อย");
    await refresh();
  }

  async function applyPromotionSale(saleId: number, bookingId: number) {
    const target = bookings.find((item) => item.id === bookingId);
    if (!target || !canActOnBookingQueue(target, new Date())) {
      setMessage("คิวนี้หมดเวลาแล้ว ไม่สามารถใช้สิทธิ์ได้");
      return;
    }
    const result = await repo.usePromotionSale(saleId, bookingId);
    setMessage(result ? "ตัดสิทธิ์โปรโมชั่นและผูกกับคิวนี้แล้ว" : "ไม่สามารถใช้สิทธิ์กับคิวนี้ได้");
    await refresh();
  }

  return (
    <AppPublicCheckInGlassPage className="pb-10">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className={cn(appPublicCheckInGlassCardClass, "px-5 py-6 sm:px-7")}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">เช็กอิน / ใช้สิทธิ์</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{FOOTBALL_TURF_MODULE_NAME}</h1>
              <p className="mt-1 text-sm font-bold text-slate-500">{moduleVenueLine}</p>
            </div>
            <div className="rounded-[1.5rem] bg-white/75 p-3 text-[#4d47b6] shadow-sm">
              <QrCode className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className={cn(appPublicCheckInGlassCardClass, "px-5 py-5 sm:px-7")}>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <input
              className="w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-bold text-slate-800"
              placeholder="กรอกเบอร์โทร"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
            />
            <div className="inline-flex items-center rounded-2xl border border-[#0000BF]/30 bg-[#0000BF]/10 px-4 py-3 text-sm font-black text-[#2e2a58]">
              เบอร์ที่ค้นหา: {phoneDigits || "-"}
            </div>
          </div>
          {message ? <p className="mt-3 text-sm font-bold text-[#4d47b6]">{message}</p> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className={cn(appPublicCheckInGlassCardClass, "px-5 py-4")}>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">คิวที่ใช้งานได้</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{activeQueueCount}</p>
          </div>
          <div className={cn(appPublicCheckInGlassCardClass, "px-5 py-4")}>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">สิทธิ์ที่ใช้ได้</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-violet-700">
              {mySales
                .filter((item) => item.status === "ACTIVE" && item.remainingUses > 0)
                .reduce((sum, item) => sum + item.remainingUses, 0)}
            </p>
          </div>
          <div className={cn(appPublicCheckInGlassCardClass, "px-5 py-4")}>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">เบอร์ที่ค้นหา</p>
            <p className="mt-2 text-sm font-black tracking-tight text-slate-900">{phoneDigits || "-"}</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.28fr_0.72fr]">
          <div className={cn(appPublicCheckInGlassCardClass, "px-5 py-5 sm:px-7")}>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-slate-500" />
              <p className="text-sm font-black text-slate-900">คิวที่จองไว้</p>
            </div>
            <div className="mt-4 space-y-3">
              {myBookings.length === 0 ? (
                <p className="text-sm font-medium text-slate-500">
                  {phoneDigits ? "ยังไม่พบคิวจากเบอร์นี้" : "กรอกเบอร์โทรเพื่อค้นหาคิวและใช้สิทธิ์"}
                </p>
              ) : (
                myBookings.map((item) => {
                  const past = isBookingTimePassed(item, liveNow);
                  const canAct = canActOnBookingQueue(item, liveNow);
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-[1.25rem] border p-4",
                        past
                          ? "border-slate-200/80 bg-slate-100/85"
                          : "border-white/70 bg-gradient-to-br from-white/90 via-white/80 to-emerald-50/35",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className={cn("font-black", past ? "text-slate-400" : "text-slate-900")}>
                            {past ? "ไม่มีผู้จอง / ผู้เล่น" : item.teamName || item.customerName}
                          </p>
                          <p className={cn("mt-1 text-xs font-medium", past ? "text-slate-400" : "text-slate-500")}>
                            {item.courtName} · {item.bookingDate} · {item.startTime}-{item.endTime}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-black ring-1",
                            past
                              ? "bg-slate-200/90 text-slate-500 ring-slate-300/80"
                              : bookingStatusTone(item.status),
                          )}
                        >
                          {past ? "หมดเวลา" : bookingStatusLabel(item.status)}
                        </span>
                      </div>
                      {!past ? (
                        <>
                          <div className="mt-3 flex items-center gap-2 text-[11px] font-black text-slate-500">
                            <Clock3 className="h-3.5 w-3.5" />
                            <span>คิวนี้พร้อมใช้สิทธิ์โปรโมชั่นก่อนเริ่มเล่น</span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-200">
                              {item.paymentMethod === "TRANSFER"
                                ? "โอนเงิน"
                                : item.paymentMethod === "ONSITE"
                                  ? "ชำระหน้าสนาม"
                                  : "ยังไม่ระบุการชำระ"}
                            </span>
                            <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-black text-cyan-700 ring-1 ring-cyan-200">
                              {item.paymentStatus === "PENDING_REVIEW"
                                ? "รอตรวจสลิป"
                                : item.paymentStatus === "PAID"
                                  ? "ชำระแล้ว"
                                  : "ยังไม่ชำระ"}
                            </span>
                          </div>
                          {item.paymentSlipDataUrl ? (
                            <div className="mt-3 rounded-[1rem] border border-emerald-100 bg-emerald-50/70 p-3">
                              <Image
                                src={item.paymentSlipDataUrl}
                                alt="สลิปการชำระเงิน"
                                width={640}
                                height={360}
                                className="h-36 w-full rounded-2xl object-cover ring-1 ring-emerald-100"
                                unoptimized
                              />
                            </div>
                          ) : null}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void checkInBooking(item.id)}
                              disabled={!canAct || item.status !== "BOOKED"}
                              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              เช็กอินคิวนี้
                            </button>
                            {mySales
                              .filter((sale) => sale.status === "ACTIVE" && sale.remainingUses > 0)
                              .map((sale) => (
                                <button
                                  key={`${sale.id}-${item.id}`}
                                  type="button"
                                  onClick={() => void applyPromotionSale(sale.id, item.id)}
                                  disabled={!canAct || Boolean(item.promotionSaleId) || item.status === "CANCELLED"}
                                  className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                  ใช้สิทธิ์ {sale.promotionName}
                                </button>
                              ))}
                          </div>
                          {item.promotionSaleId ? (
                            <p className="mt-3 text-xs font-bold text-violet-700">คิวนี้ผูกสิทธิ์โปรโมชั่นแล้ว</p>
                          ) : null}
                        </>
                      ) : (
                        <p className="mt-3 text-xs font-bold text-slate-400">
                          รอบนี้หมดเวลาแล้ว — ไม่สามารถเช็กอินหรือใช้สิทธิ์ได้
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className={cn(appPublicCheckInGlassCardClass, "px-5 py-5")}>
              <div className="flex items-center gap-3">
                <TicketPercent className="h-5 w-5 text-slate-500" />
                <p className="text-sm font-black text-slate-900">สิทธิ์โปรโมชั่นของคุณ</p>
              </div>
              <div className="mt-4 space-y-3">
                {mySales.length === 0 ? (
                  <p className="text-sm font-medium text-slate-500">
                    {phoneDigits ? "ยังไม่พบสิทธิ์โปรโมชั่นจากเบอร์นี้" : "กรอกเบอร์โทรเพื่อค้นหาสิทธิ์โปรโมชั่น"}
                  </p>
                ) : (
                  mySales.map((item) => (
                    <div key={item.id} className="rounded-[1.25rem] border border-white/70 bg-white/80 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-900">{item.promotionName}</p>
                          <p className="mt-1 text-xs font-medium text-slate-500">{item.teamName || item.customerName}</p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-black ring-1",
                            item.status === "ACTIVE"
                              ? "bg-violet-50 text-violet-700 ring-violet-200"
                              : "bg-slate-100 text-slate-500 ring-slate-200",
                          )}
                        >
                          {item.status === "ACTIVE" ? "พร้อมใช้" : "ใช้ครบแล้ว"}
                        </span>
                      </div>
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-black text-violet-700 ring-1 ring-violet-200">
                        เหลือ {item.remainingUses}/{item.totalUses} สิทธิ์
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={cn(appPublicCheckInGlassCardClass, "px-5 py-5")}>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <Landmark className="h-5 w-5 text-slate-500" />
                  <p className="text-sm font-black text-slate-900">{settings.venueAddress || "-"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-slate-500" />
                  <p className="text-sm font-black text-slate-900">{settings.contactPhone || "-"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-slate-500" />
                  <p className="text-sm font-black text-slate-900">{settings.promptpayNumber || settings.accountNumber || "-"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-slate-500" />
                  <p className="text-sm font-black text-slate-900">{settings.taxId || settings.contactLine || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppPublicCheckInGlassPage>
  );
}
