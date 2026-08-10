"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AppDashboardSection,
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
  useAppCameraCapture,
  useAppImageLightbox,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { HotelResortButton } from "@/systems/hotel-resort/components/HotelResortButton";
import { HotelResortErrorBanner } from "@/systems/hotel-resort/components/HotelResortErrorBanner";
import { HotelResortPaymentPanel } from "@/systems/hotel-resort/components/HotelResortPaymentPanel";
import { IconIdCard, IconKey, IconNavCheckIn } from "@/systems/hotel-resort/components/HotelResortIcons";
import {
  hotelResortFetchErrorMessage,
  type HotelResortBookingRow,
  type HotelResortRoomRow,
} from "@/systems/hotel-resort/lib/client-data";
import {
  hotelResortPaymentMethodLabel,
  hotelResortPaymentRequiresSlip,
  isHotelResortPaymentMethod,
  type HotelResortPaymentMethod,
} from "@/systems/hotel-resort/lib/payment-method";
import { printHotelResortCheckInDocs } from "@/systems/hotel-resort/lib/hotel-resort-print-docs";
import { useHotelResortApiFetch } from "@/systems/hotel-resort/lib/staff-api-fetch";
import {
  hotelResortContentCardClass,
  hotelResortFieldClass,
  hotelResortFormLabelClass,
  hotelResortSectionRadiusClass,
  hotelResortStatIconBadgeClass,
} from "@/systems/hotel-resort/lib/ui-tokens";

function todayIsoDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function tomorrowIsoDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toDateInput(iso: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

type BookingDetail = HotelResortBookingRow & {
  nationalId?: string | null;
  nationality?: string | null;
  guestAddress?: string | null;
  guestTaxId?: string | null;
};

export function HotelResortCheckInClient({
  portalRoomId,
  portalBookingId,
  onComplete,
  refreshNonce = 0,
}: {
  portalRoomId?: string;
  portalBookingId?: string;
  /** พอร์ทัลพนักงาน — หลังบันทึกสำเร็จ */
  onComplete?: () => void;
  refreshNonce?: number;
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiFetch = useHotelResortApiFetch();
  const roomIdFromQuery = portalRoomId?.trim() || searchParams.get("roomId")?.trim() || "";
  const bookingIdFromQuery = portalBookingId?.trim() || searchParams.get("bookingId")?.trim() || "";

  const [rooms, setRooms] = useState<HotelResortRoomRow[]>([]);
  const [existingBooking, setExistingBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [idCardImageUrl, setIdCardImageUrl] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [nationality, setNationality] = useState("ไทย");
  const [roomId, setRoomId] = useState(roomIdFromQuery);
  const [checkInAt, setCheckInAt] = useState(todayIsoDate);
  const [checkOutAt, setCheckOutAt] = useState(tomorrowIsoDate);
  const [totalBaht, setTotalBaht] = useState("");
  const [amountPaidBaht, setAmountPaidBaht] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<HotelResortPaymentMethod>("CASH");
  const [paymentSlipUrl, setPaymentSlipUrl] = useState<string | null>(null);
  const [printTaxInvoice, setPrintTaxInvoice] = useState(false);
  const [printFolio, setPrintFolio] = useState(false);
  const [fillExtraBilling, setFillExtraBilling] = useState(false);
  const [guestAddress, setGuestAddress] = useState("");
  const [guestTaxId, setGuestTaxId] = useState("");

  const galleryRef = useRef<HTMLInputElement>(null);
  const { openCamera, cameraInputRef, cameraModal } = useAppCameraCapture({ title: "ถ่ายรูปบัตรประชาชน" });

  const isExistingReservation = Boolean(bookingIdFromQuery && existingBooking);
  const showBillingFields = fillExtraBilling || printTaxInvoice;
  const saveBillingFields = fillExtraBilling || printTaxInvoice || printFolio;
  const taxInvoiceFieldsMissing =
    printTaxInvoice && (!guestAddress.trim() || !guestTaxId.trim());

  const slipLb = useAppImageLightbox();
  const paidNow = useMemo(() => Math.max(0, Math.round(Number(amountPaidBaht || 0))), [amountPaidBaht]);
  const totalNow = useMemo(() => Math.max(0, Math.round(Number(totalBaht || 0))), [totalBaht]);
  const slipMissing = hotelResortPaymentRequiresSlip(paymentMethod, paidNow) && !paymentSlipUrl;

  useEffect(() => {
    if (portalRoomId?.trim()) setRoomId(portalRoomId.trim());
  }, [portalRoomId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const roomsRes = await apiFetch("/api/hotel-resort/rooms", {
        cache: "no-store",
      });
      if (!roomsRes.ok) throw new Error(await hotelResortFetchErrorMessage(roomsRes));
      const roomsJson = (await roomsRes.json()) as { rooms?: HotelResortRoomRow[] };
      const list = (roomsJson.rooms ?? []).filter((r) => r.status === "VACANT" || r.status === "RESERVED");
      setRooms(list);

      if (bookingIdFromQuery) {
        const bookingRes = await apiFetch(`/api/hotel-resort/bookings/${bookingIdFromQuery}`, {
          cache: "no-store",
        });
        if (!bookingRes.ok) throw new Error(await hotelResortFetchErrorMessage(bookingRes));
        const bookingJson = (await bookingRes.json()) as { booking?: BookingDetail };
        const b = bookingJson.booking;
        if (!b) throw new Error("ไม่พบการจอง");
        if (b.status !== "RESERVED") {
          setError("รายการนี้เช็คอินแล้วหรือไม่พร้อมเช็คอิน");
        }
        setExistingBooking(b);
        setName(b.guestName);
        setPhone(b.guestPhone);
        setNationalId(b.nationalId ?? "");
        setNationality(b.nationality ?? "ไทย");
        setGuestAddress(b.guestAddress ?? "");
        setGuestTaxId(b.guestTaxId ?? "");
        setFillExtraBilling(Boolean(b.guestAddress?.trim() || b.guestTaxId?.trim()));
        setRoomId(b.roomId || roomIdFromQuery);
        setCheckInAt(toDateInput(b.checkInAt) || todayIsoDate());
        setCheckOutAt(toDateInput(b.checkOutAt) || tomorrowIsoDate());
        setTotalBaht(String(b.totalBaht ?? ""));
        const remaining = Math.max(0, (b.totalBaht ?? 0) - (b.amountPaidBaht ?? 0));
        setAmountPaidBaht(String(remaining));
        // ช่องทางตอนเช็คอินเริ่มใหม่ — ไม่ดึง PROMPTPAY/โอนจากมัดจำพอร์ทัลโดยอัตโนมัติถ้ายังค้างชำระ
        setPaymentMethod(
          remaining > 0
            ? "CASH"
            : isHotelResortPaymentMethod(b.paymentMethod)
              ? b.paymentMethod
              : "CASH",
        );
        // สลิปชำระเพิ่มแยกจากมัดจำ — อย่าใส่สลิปมัดจำลงช่องนี้
        setPaymentSlipUrl(b.paymentSlipUrl ?? null);
        setIdCardImageUrl(b.idCardImageUrl);
      } else {
        setExistingBooking(null);
        if (roomIdFromQuery && list.some((r) => r.id === roomIdFromQuery)) {
          setRoomId(roomIdFromQuery);
          const room = list.find((r) => r.id === roomIdFromQuery);
          if (room) {
            setTotalBaht(String(room.basePriceBaht || ""));
            setAmountPaidBaht(String(room.basePriceBaht || ""));
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดข้อมูลเช็คอินไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, bookingIdFromQuery, roomIdFromQuery]);

  useEffect(() => {
    void load();
  }, [load, refreshNonce]);

  async function uploadIdImage(file: File) {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiFetch("/api/hotel-resort/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      const j = (await res.json()) as { url?: string; imageUrl?: string };
      setIdCardImageUrl(j.url ?? j.imageUrl ?? null);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function onPickIdImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadIdImage(file);
  }

  async function submitCheckIn() {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const paid = paidNow;
      const total = totalNow;
      if (hotelResortPaymentRequiresSlip(paymentMethod, paid) && !paymentSlipUrl) {
        throw new Error("แนบสลิปชำระเงินก่อนบันทึก");
      }
      if (taxInvoiceFieldsMissing) {
        throw new Error("กรอกที่อยู่และเลขผู้เสียภาษีลูกค้าก่อนพิมพ์ใบกำกับภาษี");
      }

      // paymentSlipUrl = สลิปชำระเพิ่มเท่านั้น — ไม่แตะ depositSlipUrl บน API
      const paymentPayload = {
        paymentMethod,
        ...(paid > 0
          ? paymentMethod === "CASH" || paymentMethod === "CREDIT_CARD"
            ? { paymentSlipUrl: null as string | null }
            : paymentSlipUrl
              ? { paymentSlipUrl }
              : {}
          : {}),
      };
      const guestDocPayload = {
        nationalId: nationalId.trim() || null,
        nationality: nationality.trim() || null,
        guestAddress: saveBillingFields ? guestAddress.trim() || null : null,
        guestTaxId: saveBillingFields ? guestTaxId.trim() || null : null,
      };

      type SaveJson = {
        booking?: {
          id: string;
          guestName: string;
          guestPhone: string;
          roomNumber?: string | null;
          roomTypeName?: string | null;
          checkInAt: string;
          checkOutAt: string;
          totalBaht: number;
          amountPaidBaht: number;
          paymentMethod?: string;
          note?: string | null;
          guestAddress?: string | null;
          guestTaxId?: string | null;
        };
        property?: {
          propertyName?: string;
          managerName?: string | null;
          taxId?: string | null;
          contactPhone?: string | null;
          address?: string | null;
          logoUrl?: string | null;
          bankName?: string | null;
          bankAccountNumber?: string | null;
          bankAccountName?: string | null;
        };
        error?: string;
      };

      let saved: SaveJson = {};

      if (isExistingReservation && existingBooking) {
        const previouslyPaid = existingBooking.amountPaidBaht ?? 0;
        const nextPaid = Math.min(total, previouslyPaid + paid);
        const res = await apiFetch(`/api/hotel-resort/bookings/${existingBooking.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "CHECKED_IN",
            guestName: name.trim(),
            guestPhone: phone.trim(),
            roomId: roomId || null,
            idCardImageUrl,
            totalBaht: total,
            amountPaidBaht: nextPaid,
            ...paymentPayload,
            ...guestDocPayload,
          }),
        });
        saved = (await res.json().catch(() => ({}))) as SaveJson;
        if (!res.ok) throw new Error(saved.error ?? "บันทึกเช็คอินไม่สำเร็จ");
      } else {
        const res = await apiFetch("/api/hotel-resort/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestName: name.trim(),
            guestPhone: phone.trim(),
            roomId: roomId || null,
            checkInAt,
            checkOutAt,
            idCardImageUrl,
            isWalkIn: true,
            totalBaht: total,
            amountPaidBaht: paid,
            ...paymentPayload,
            ...guestDocPayload,
          }),
        });
        saved = (await res.json().catch(() => ({}))) as SaveJson;
        if (!res.ok) throw new Error(saved.error ?? "บันทึกเช็คอินไม่สำเร็จ");
      }

      if ((printTaxInvoice || printFolio) && saved.booking) {
        const roomMeta = rooms.find((r) => r.id === roomId);
        const roomLabel =
          saved.booking.roomNumber ||
          roomMeta?.roomNumber ||
          existingBooking?.roomNumber ||
          "-";
        printHotelResortCheckInDocs({
          taxInvoice: printTaxInvoice,
          folio: printFolio,
          data: {
            propertyName: saved.property?.propertyName || "โรงแรม",
            propertyTaxId: saved.property?.taxId,
            propertyAddress: saved.property?.address,
            propertyPhone: saved.property?.contactPhone,
            logoUrl: saved.property?.logoUrl,
            bankName: saved.property?.bankName,
            bankAccountNumber: saved.property?.bankAccountNumber,
            bankAccountName: saved.property?.bankAccountName,
            managerName: saved.property?.managerName,
            guestName: saved.booking.guestName || name.trim(),
            guestPhone: saved.booking.guestPhone || phone.trim(),
            guestAddress: saved.booking.guestAddress || guestAddress.trim() || null,
            guestTaxId: saved.booking.guestTaxId || guestTaxId.trim() || null,
            roomNumber: roomLabel,
            roomTypeName: saved.booking.roomTypeName || roomMeta?.roomTypeName || null,
            checkInAt: saved.booking.checkInAt || checkInAt,
            checkOutAt: saved.booking.checkOutAt || checkOutAt,
            totalBaht: saved.booking.totalBaht ?? total,
            amountPaidBaht: saved.booking.amountPaidBaht ?? paid,
            paymentMethodLabel: hotelResortPaymentMethodLabel(
              saved.booking.paymentMethod || paymentMethod,
            ),
            note: saved.booking.note,
            docNo: saved.booking.id.slice(-8).toUpperCase(),
          },
        });
      }

      setInfo("เช็คอินสำเร็จ");
      if (onComplete) {
        onComplete();
      } else {
        router.push("/dashboard/hotel-resort");
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกเช็คอินไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const goBack = () => {
    if (onComplete) {
      onComplete();
      return;
    }
    router.push("/dashboard/hotel-resort");
  };

  const selectedRoom = rooms.find((r) => r.id === roomId);

  return (
    <AppDashboardSection tone="violet" className={hotelResortSectionRadiusClass}>
      <AppSectionHeader
        tone="violet"
        title={isExistingReservation ? "เช็คอินจากการจอง" : "เช็คอิน"}
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
        actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        action={
          <div className={cn(hotelResortStatIconBadgeClass("indigo"), "h-11 w-11 rounded-2xl")} aria-hidden>
            <IconKey className="h-5 w-5" />
          </div>
        }
      />
      {error ? (
        <div className="mt-3">
          <HotelResortErrorBanner message={error} />
        </div>
      ) : null}
      {info ? (
        <p className="mt-3 rounded-[1rem] border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-sm font-semibold text-emerald-800">
          {info}
        </p>
      ) : null}

      {selectedRoom || existingBooking ? (
        <p className="mt-3 rounded-[1rem] border border-[#5b61ff]/25 bg-[#ecebff]/60 px-3 py-2 text-xs font-semibold text-[#4d47b6]">
          {isExistingReservation
            ? `ห้อง ${existingBooking?.roomNumber ?? selectedRoom?.roomNumber ?? "-"}`
            : `ห้อง ${selectedRoom?.roomNumber}${selectedRoom?.roomTypeName ? ` · ${selectedRoom.roomTypeName}` : ""}`}
        </p>
      ) : null}

      <div className={cn(hotelResortContentCardClass, "mt-4")}>
        <p className={hotelResortFormLabelClass}>1) ข้อมูลลูกค้า</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#66638c]">ชื่อ-นามสกุล</span>
            <input className={hotelResortFieldClass} placeholder="ชื่อ-นามสกุล" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#66638c]">เบอร์โทร</span>
            <input className={hotelResortFieldClass} placeholder="เบอร์โทร" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#66638c]">เลขบัตรประชาชน</span>
            <input className={hotelResortFieldClass} placeholder="เลขบัตรประชาชน" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#66638c]">สัญชาติ</span>
            <input className={hotelResortFieldClass} placeholder="สัญชาติ" value={nationality} onChange={(e) => setNationality(e.target.value)} />
          </label>
        </div>

        <p className={cn(hotelResortFormLabelClass, "mt-5")}>2) ห้องพัก & วันที่</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold text-[#66638c]">เลือกห้อง</span>
            <select
              className={hotelResortFieldClass}
              value={roomId}
              onChange={(e) => {
                const nextId = e.target.value;
                setRoomId(nextId);
                const room = rooms.find((r) => r.id === nextId);
                if (room && !isExistingReservation) {
                  setTotalBaht(String(room.basePriceBaht || ""));
                  setAmountPaidBaht(String(room.basePriceBaht || ""));
                }
              }}
              disabled={isExistingReservation}
            >
              <option value="">เลือกห้อง</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  ห้อง {r.roomNumber} ({r.roomTypeName})
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#66638c]">เช็คอิน</span>
            <input
              className={hotelResortFieldClass}
              type="date"
              value={checkInAt}
              onChange={(e) => setCheckInAt(e.target.value)}
              disabled={isExistingReservation}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#66638c]">เช็คเอาต์</span>
            <input
              className={hotelResortFieldClass}
              type="date"
              value={checkOutAt}
              onChange={(e) => setCheckOutAt(e.target.value)}
              disabled={isExistingReservation}
            />
          </label>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <div className={cn(hotelResortStatIconBadgeClass("amber"), "h-8 w-8 rounded-[1rem]")} aria-hidden>
            <IconIdCard className="h-4 w-4" />
          </div>
          <p className={hotelResortFormLabelClass}>3) รูปบัตรประชาชน</p>
        </div>
        <div className="mt-3 space-y-2">
          <AppGalleryCameraFileInputs galleryInputRef={galleryRef} cameraInputRef={cameraInputRef} onChange={onPickIdImage} />
          <AppImagePickCameraButtons
            onPickGallery={() => galleryRef.current?.click()}
            onPickCamera={() => openCamera((file) => void uploadIdImage(file))}
            busy={busy}
            labels={{ gallery: "เลือกรูปบัตร", camera: "ถ่ายรูปบัตร" }}
          />
          {cameraModal}
          {idCardImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={idCardImageUrl}
              alt="บัตรประชาชน"
              className="h-28 w-44 rounded-[1rem] border-2 border-white/70 bg-white/80 object-cover p-1 shadow-md ring-1 ring-[#5b61ff]/15"
            />
          ) : (
            <p className="text-xs font-semibold text-[#8b87b8]">ยังไม่มีรูปบัตร</p>
          )}
        </div>

        <p className={cn(hotelResortFormLabelClass, "mt-5")}>4) ชำระเงิน</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#66638c]">ยอดรวม (บาท)</span>
            <input
              className={hotelResortFieldClass}
              type="number"
              min={0}
              value={totalBaht}
              onChange={(e) => {
                const v = e.target.value;
                setTotalBaht(v);
                if (!isExistingReservation) setAmountPaidBaht(v);
              }}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#66638c]">
              {isExistingReservation ? "ยอดชำระตอนนี้ (บาท)" : "ยอดที่ชำระ (บาท)"}
            </span>
            <input
              className={hotelResortFieldClass}
              type="number"
              min={0}
              value={amountPaidBaht}
              onChange={(e) => setAmountPaidBaht(e.target.value)}
            />
          </label>
        </div>
        {isExistingReservation && existingBooking ? (
          <div className="mt-2 space-y-2">
            <p className="text-xs font-semibold text-[#66638c]">
              ชำระแล้วก่อนหน้า (มัดจำ/จอง) {(existingBooking.amountPaidBaht ?? 0).toLocaleString("th-TH")} บาท
              {existingBooking.depositAmountBaht != null && existingBooking.depositAmountBaht > 0
                ? ` · มัดจำที่ตั้งไว้ ${existingBooking.depositAmountBaht.toLocaleString("th-TH")} บาท`
                : null}
            </p>
            <p className="text-sm font-black text-[#1e1b4b]">
              ต้องชำระเพิ่ม{" "}
              {Math.max(0, (existingBooking.totalBaht ?? 0) - (existingBooking.amountPaidBaht ?? 0)).toLocaleString(
                "th-TH",
              )}{" "}
              บาท
              {paidNow > 0
                ? ` · หลังชำระครั้งนี้ค้าง ${Math.max(0, totalNow - ((existingBooking.amountPaidBaht ?? 0) + paidNow)).toLocaleString("th-TH")} บาท`
                : null}
            </p>
            {existingBooking.depositSlipUrl?.trim() ? (
              <div className="rounded-[1rem] border border-white/60 bg-white/70 p-3">
                <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-[#8b87b8]">
                  สลิปมัดจำ (จากลิงก์จอง)
                </p>
                <AppImageThumb
                  src={existingBooking.depositSlipUrl.trim()}
                  alt="สลิปมัดจำ"
                  onOpen={() => slipLb.open(existingBooking.depositSlipUrl!.trim())}
                  className="h-16 w-16"
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <HotelResortPaymentPanel
          className="mt-3"
          amountBaht={paidNow}
          method={paymentMethod}
          slipUrl={paymentSlipUrl}
          onMethodChange={setPaymentMethod}
          onSlipUrlChange={setPaymentSlipUrl}
          disabled={busy || loading}
        />
        {isExistingReservation && paidNow > 0 ? (
          <p className="mt-2 text-[11px] font-semibold text-[#66638c]">
            สลิปด้านบนเป็นการชำระเพิ่มตอนเช็คอิน — เก็บแยกจากสลิปมัดจำ
          </p>
        ) : null}

        <p className={cn(hotelResortFormLabelClass, "mt-5")}>5) เอกสารพิมพ์</p>
        <p className="mt-1 text-[11px] font-medium text-[#8b87b8]">
          เลือกเอกสารที่ต้องการหลังเช็คอิน — พิมพ์แบบฟอร์ม A4 อัตโนมัติ
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label
            className={cn(
              "flex min-h-[48px] cursor-pointer items-center gap-3 rounded-[1rem] border px-3 py-2.5 transition",
              printTaxInvoice
                ? "border-[#5b61ff]/45 bg-[#ecebff]/70 ring-1 ring-[#5b61ff]/20"
                : "border-white/60 bg-white/55 hover:bg-white/80",
            )}
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#5b61ff]"
              checked={printTaxInvoice}
              onChange={(e) => {
                const on = e.target.checked;
                setPrintTaxInvoice(on);
                if (on) setFillExtraBilling(true);
              }}
            />
            <span className="min-w-0">
              <span className="block text-sm font-black text-[#1e1b4b]">ใบกำกับภาษี</span>
              <span className="block text-[11px] font-medium text-[#66638c]">ต้องมีที่อยู่ + เลขผู้เสียภาษี</span>
            </span>
          </label>
          <label
            className={cn(
              "flex min-h-[48px] cursor-pointer items-center gap-3 rounded-[1rem] border px-3 py-2.5 transition",
              printFolio
                ? "border-amber-400/50 bg-amber-50/80 ring-1 ring-amber-300/40"
                : "border-white/60 bg-white/55 hover:bg-white/80",
            )}
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-amber-600"
              checked={printFolio}
              onChange={(e) => setPrintFolio(e.target.checked)}
            />
            <span className="min-w-0">
              <span className="block text-sm font-black text-[#1e1b4b]">โฟลิโอ</span>
              <span className="block text-[11px] font-medium text-[#66638c]">สรุปค่าใช้จ่าย / ยอดค้าง</span>
            </span>
          </label>
        </div>

        <label
          className={cn(
            "mt-3 flex min-h-[48px] cursor-pointer items-center gap-3 rounded-[1rem] border px-3 py-2.5 transition",
            fillExtraBilling
              ? "border-emerald-400/50 bg-emerald-50/70 ring-1 ring-emerald-300/40"
              : "border-white/60 bg-white/55 hover:bg-white/80",
          )}
        >
          <input
            type="checkbox"
            className="h-4 w-4 accent-emerald-600"
            checked={fillExtraBilling}
            onChange={(e) => {
              const on = e.target.checked;
              setFillExtraBilling(on);
              if (!on && printTaxInvoice) setPrintTaxInvoice(false);
            }}
          />
          <span className="min-w-0">
            <span className="block text-sm font-black text-[#1e1b4b]">ใส่ข้อมูลเพิ่มเติม</span>
            <span className="block text-[11px] font-medium text-[#66638c]">
              ที่อยู่ และเลขประจำตัวผู้เสียภาษีลูกค้า
            </span>
          </span>
        </label>

        {showBillingFields ? (
          <div className="mt-3 space-y-3 rounded-[1rem] border border-dashed border-[#5b61ff]/35 bg-[#f7f6ff]/80 p-3">
            <p className="text-xs font-bold text-[#4d47b6]">
              ข้อมูลลูกค้าสำหรับเอกสาร
              {printTaxInvoice ? (
                <span className="ml-1 font-semibold text-rose-600">· บังคับเมื่อพิมพ์ใบกำกับภาษี</span>
              ) : (
                <span className="ml-1 font-normal text-[#8b87b8]">(บันทึกไว้ใช้ตอนเช็คเอาต์/พิมพ์)</span>
              )}
            </p>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#66638c]">
                ที่อยู่ลูกค้า{printTaxInvoice ? " *" : ""}
              </span>
              <textarea
                className={cn(hotelResortFieldClass, "min-h-[4.5rem] py-2")}
                placeholder="บ้านเลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์"
                value={guestAddress}
                onChange={(e) => setGuestAddress(e.target.value)}
                rows={3}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-[#66638c]">
                เลขประจำตัวผู้เสียภาษี{printTaxInvoice ? " *" : ""}
              </span>
              <input
                className={hotelResortFieldClass}
                inputMode="numeric"
                placeholder="เช่น 0-1234-56789-01-2"
                value={guestTaxId}
                onChange={(e) => setGuestTaxId(e.target.value)}
              />
            </label>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <HotelResortButton
          type="button"
          onClick={() => void submitCheckIn()}
          disabled={
            busy ||
            loading ||
            !name.trim() ||
            !phone.trim() ||
            !roomId ||
            !checkInAt ||
            !checkOutAt ||
            slipMissing ||
            taxInvoiceFieldsMissing ||
            (isExistingReservation && existingBooking?.status !== "RESERVED")
          }
          className={cn(
            "app-btn-primary inline-flex min-h-[44px] items-center gap-2 rounded-[1rem] px-5 text-sm font-black",
            "disabled:opacity-50",
          )}
          aria-label="ยืนยันเช็คอิน"
        >
          <IconNavCheckIn className="h-5 w-5" aria-hidden />
          {busy
            ? "กำลังบันทึก..."
            : isExistingReservation
              ? printTaxInvoice || printFolio
                ? "ยืนยันเช็คอิน + พิมพ์"
                : "ยืนยันเช็คอิน"
              : printTaxInvoice || printFolio
                ? "บันทึกเช็คอิน + พิมพ์"
                : "บันทึกเช็คอิน"}
        </HotelResortButton>
        <HotelResortButton
          type="button"
          onClick={goBack}
          className={cn(appTemplateOutlineButtonClass, "min-h-[44px] rounded-[1rem] px-4 text-sm font-black text-[#4d47b6]")}
        >
          กลับแดชบอร์ด
        </HotelResortButton>
      </div>
      <AppImageLightbox src={slipLb.src} onClose={slipLb.close} alt="สลิปชำระ" />
    </AppDashboardSection>
  );
}
