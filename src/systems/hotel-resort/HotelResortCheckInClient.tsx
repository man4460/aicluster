"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  AppDashboardSection,
  AppGalleryCameraFileInputs,
  AppImagePickCameraButtons,
  AppSectionHeader,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { HotelResortButton } from "@/systems/hotel-resort/components/HotelResortButton";
import { HotelResortErrorBanner } from "@/systems/hotel-resort/components/HotelResortErrorBanner";
import { IconIdCard, IconKey, IconNavCheckIn } from "@/systems/hotel-resort/components/HotelResortIcons";
import {
  hotelResortFetchErrorMessage,
  type HotelResortRoomRow,
} from "@/systems/hotel-resort/lib/client-data";
import {
  hotelResortContentCardClass,
  hotelResortFieldClass,
  hotelResortFormLabelClass,
  hotelResortStatIconBadgeClass,
} from "@/systems/hotel-resort/lib/ui-tokens";

export function HotelResortCheckInClient() {
  const [rooms, setRooms] = useState<HotelResortRoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [idCardImageUrl, setIdCardImageUrl] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [nationality, setNationality] = useState("ไทย");
  const [roomId, setRoomId] = useState("");
  const [checkInAt, setCheckInAt] = useState("");
  const [checkOutAt, setCheckOutAt] = useState("");

  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hotel-resort/rooms", { cache: "no-store", credentials: "include" });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      const j = (await res.json()) as { rooms?: HotelResortRoomRow[] };
      setRooms((j.rooms ?? []).filter((r) => r.status === "VACANT" || r.status === "RESERVED"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดห้องไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  async function onPickIdImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/hotel-resort/upload", {
        method: "POST",
        credentials: "include",
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

  async function submitWalkIn() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/hotel-resort/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          guestName: name.trim(),
          guestPhone: phone.trim(),
          nationalId: nationalId.trim() || null,
          nationality: nationality.trim() || null,
          roomId: roomId || null,
          checkInAt,
          checkOutAt,
          idCardImageUrl,
          isWalkIn: true,
        }),
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      setName("");
      setPhone("");
      setNationalId("");
      setNationality("ไทย");
      setRoomId("");
      setCheckInAt("");
      setCheckOutAt("");
      setIdCardImageUrl(null);
      await loadRooms();
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึก walk-in ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppDashboardSection tone="violet">
      <AppSectionHeader
        tone="violet"
        title="เช็คอิน Walk-in"
        description="บันทึกลูกค้าเข้าพักหน้างาน พร้อมแนบรูปบัตร"
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

      <div className={cn(hotelResortContentCardClass, "mt-4")}>
        <p className={hotelResortFormLabelClass}>ข้อมูลลูกค้า</p>
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

        <p className={cn(hotelResortFormLabelClass, "mt-5")}>ห้องพัก & วันที่</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold text-[#66638c]">เลือกห้อง</span>
            <select className={hotelResortFieldClass} value={roomId} onChange={(e) => setRoomId(e.target.value)}>
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
            <input className={hotelResortFieldClass} type="date" value={checkInAt} onChange={(e) => setCheckInAt(e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-[#66638c]">เช็คเอาต์</span>
            <input className={hotelResortFieldClass} type="date" value={checkOutAt} onChange={(e) => setCheckOutAt(e.target.value)} />
          </label>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <div className={cn(hotelResortStatIconBadgeClass("amber"), "h-8 w-8 rounded-xl")} aria-hidden>
            <IconIdCard className="h-4 w-4" />
          </div>
          <p className={hotelResortFormLabelClass}>รูปบัตรประชาชน</p>
        </div>
        <div className="mt-3 space-y-2">
          <AppGalleryCameraFileInputs galleryInputRef={galleryRef} cameraInputRef={cameraRef} onChange={onPickIdImage} />
          <AppImagePickCameraButtons
            onPickGallery={() => galleryRef.current?.click()}
            onPickCamera={() => cameraRef.current?.click()}
            busy={busy}
            labels={{ gallery: "เลือกรูปบัตร", camera: "ถ่ายรูปบัตร" }}
          />
          {idCardImageUrl ? (
            <img
              src={idCardImageUrl}
              alt="บัตรประชาชน"
              className="h-28 w-44 rounded-xl border-2 border-white/70 bg-white/80 object-cover p-1 shadow-md ring-1 ring-[#5b61ff]/15"
            />
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <HotelResortButton
          type="button"
          onClick={() => void submitWalkIn()}
          disabled={busy || loading || !name.trim() || !phone.trim() || !roomId || !checkInAt || !checkOutAt}
          className={cn(
            "app-btn-primary inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 text-sm font-black",
            "disabled:opacity-50",
          )}
          aria-label="บันทึกเช็คอิน Walk-in"
        >
          <IconNavCheckIn className="h-5 w-5" aria-hidden />
          {busy ? "กำลังบันทึก..." : "บันทึกเช็คอิน Walk-in"}
        </HotelResortButton>
      </div>
    </AppDashboardSection>
  );
}
