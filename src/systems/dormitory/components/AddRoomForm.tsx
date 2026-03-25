"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClz =
  "mt-1 w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0000BF]/40";

export function AddRoomForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roomNumber, setRoomNumber] = useState("");
  const [floor, setFloor] = useState("1");
  const [roomType, setRoomType] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [maxOccupants, setMaxOccupants] = useState("2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetFields() {
    setRoomNumber("");
    setFloor("1");
    setRoomType("");
    setBasePrice("");
    setMaxOccupants("2");
  }

  function openModal() {
    setError(null);
    resetFields();
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const rent = Number(basePrice);
    const max = Number(maxOccupants);
    const fl = Number(floor);
    if (
      !roomNumber.trim() ||
      !roomType.trim() ||
      !Number.isFinite(rent) ||
      rent < 0 ||
      !Number.isInteger(max) ||
      max < 1 ||
      !Number.isInteger(fl) ||
      fl < 0
    ) {
      setError("กรอกข้อมูลให้ครบถูกต้อง");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/dorm/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomNumber: roomNumber.trim(),
          floor: fl,
          roomType: roomType.trim(),
          basePrice: rent,
          maxOccupants: max,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      resetFields();
      closeModal();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={openModal}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#0000BF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0000a6]"
        >
          เพิ่มห้องพัก
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-room-title"
          onClick={closeModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="add-room-title" className="text-base font-semibold text-slate-900">
                เพิ่มห้องพัก
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
              >
                ปิด
              </button>
            </div>
            <p className="mb-4 text-xs text-slate-500">ค่าเช่าจะหารให้ผู้เข้าพักอัตโนมัติเมื่อมีมากกว่า 1 คน</p>

            <form onSubmit={onSubmit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-600">
                  เลขห้อง
                  <input
                    className={inputClz}
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="เช่น 101"
                    required
                    autoFocus
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  ชั้น
                  <input
                    type="number"
                    min={0}
                    max={200}
                    className={inputClz}
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    required
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
                  ประเภทห้อง
                  <input
                    className={inputClz}
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
                    className={inputClz}
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
                    className={inputClz}
                    value={maxOccupants}
                    onChange={(e) => setMaxOccupants(e.target.value)}
                    required
                  />
                </label>
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-[#0000BF] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {loading ? "กำลังบันทึก…" : "บันทึกห้อง"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
