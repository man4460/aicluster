"use client";

import type { ReactNode } from "react";

export const dormRoomFormInputClass =
  "mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0000BF]/40";

export type RoomFormFieldsProps = {
  roomNumber: string;
  setRoomNumber: (v: string) => void;
  floor: string;
  setFloor: (v: string) => void;
  roomType: string;
  setRoomType: (v: string) => void;
  basePrice: string;
  setBasePrice: (v: string) => void;
  maxOccupants: string;
  setMaxOccupants: (v: string) => void;
  error: string | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  submitLabel?: string;
  footer?: ReactNode;
};

export function RoomFormFields({
  roomNumber,
  setRoomNumber,
  floor,
  setFloor,
  roomType,
  setRoomType,
  basePrice,
  setBasePrice,
  maxOccupants,
  setMaxOccupants,
  error,
  loading,
  onSubmit,
  onCancel,
  autoFocus,
  submitLabel = "บันทึกห้อง",
  footer,
}: RoomFormFieldsProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-slate-600">
          เลขห้อง
          <input
            className={dormRoomFormInputClass}
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="เช่น 101"
            required
            autoFocus={autoFocus}
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          ชั้น
          <input
            type="number"
            min={0}
            max={200}
            className={dormRoomFormInputClass}
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            required
          />
        </label>
        <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
          ประเภทห้อง
          <input
            className={dormRoomFormInputClass}
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            placeholder="เช่น แอร์ / พัดลม"
            required
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          ค่าเช่า / เดือน (บาท)
          <input
            type="number"
            min={0}
            step={0.01}
            className={dormRoomFormInputClass}
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            required
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          พักได้สูงสุด (คน)
          <input
            type="number"
            min={1}
            max={50}
            className={dormRoomFormInputClass}
            value={maxOccupants}
            onChange={(e) => setMaxOccupants(e.target.value)}
            required
          />
        </label>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {footer ?? (
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#0000BF] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "กำลังบันทึก…" : submitLabel}
          </button>
        </div>
      )}
    </form>
  );
}

export function parseRoomFormValues(input: {
  roomNumber: string;
  roomType: string;
  basePrice: string;
  maxOccupants: string;
  floor: string;
}):
  | { ok: true; data: { roomNumber: string; roomType: string; basePrice: number; maxOccupants: number; floor: number } }
  | { ok: false; error: string } {
  const rent = Number(input.basePrice);
  const max = Number(input.maxOccupants);
  const fl = Number(input.floor);
  if (
    !input.roomNumber.trim() ||
    !input.roomType.trim() ||
    !Number.isFinite(rent) ||
    rent < 0 ||
    !Number.isInteger(max) ||
    max < 1 ||
    !Number.isInteger(fl) ||
    fl < 0
  ) {
    return { ok: false, error: "กรอกข้อมูลให้ครบถูกต้อง" };
  }
  return {
    ok: true,
    data: {
      roomNumber: input.roomNumber.trim(),
      roomType: input.roomType.trim(),
      basePrice: rent,
      maxOccupants: max,
      floor: fl,
    },
  };
}
