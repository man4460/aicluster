"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DormCenteredModal } from "@/systems/dormitory/components/DormCenteredModal";
import { parseRoomFormValues, RoomFormFields } from "@/systems/dormitory/components/RoomFormFields";
import { dormBtnSecondary } from "@/systems/dormitory/dorm-ui";
import { cn } from "@/lib/cn";
import { useDormitoryApiFetch, useDormitoryStaffAuth } from "@/systems/dormitory/lib/staff-api-fetch";

export type EditRoomFormRoom = {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  basePrice: number;
  maxOccupants: number;
  activeTenants: number;
};

type EditRoomFormProps = {
  room: EditRoomFormRoom;
  className?: string;
  onSaved?: () => void;
};

export function EditRoomForm({ room, className, onSaved }: EditRoomFormProps) {
  const router = useRouter();
  const apiFetch = useDormitoryApiFetch();
  const staffAuth = useDormitoryStaffAuth();
  const [open, setOpen] = useState(false);
  const [roomNumber, setRoomNumber] = useState(room.roomNumber);
  const [floor, setFloor] = useState(String(room.floor));
  const [roomType, setRoomType] = useState(room.roomType);
  const [basePrice, setBasePrice] = useState(String(room.basePrice));
  const [maxOccupants, setMaxOccupants] = useState(String(room.maxOccupants));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetFields() {
    setRoomNumber(room.roomNumber);
    setFloor(String(room.floor));
    setRoomType(room.roomType);
    setBasePrice(String(room.basePrice));
    setMaxOccupants(String(room.maxOccupants));
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
    const parsed = parseRoomFormValues({ roomNumber, roomType, basePrice, maxOccupants, floor });
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    if (parsed.data.maxOccupants < room.activeTenants) {
      setError(`พักได้สูงสุดต้องไม่น้อยกว่าผู้พัก ACTIVE (${room.activeTenants} คน)`);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(`/api/dorm/rooms/${room.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      closeModal();
      if (onSaved) onSaved();
      else if (!staffAuth) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={cn(dormBtnSecondary, "w-full justify-center sm:w-auto", className)}
        aria-label={`แก้ไขรายละเอียดห้อง ${room.roomNumber}`}
      >
        แก้ไขห้อง
      </button>

      <DormCenteredModal
        open={open}
        onClose={closeModal}
        title={`แก้ไขห้อง ${room.roomNumber}`}
        titleId="edit-room-title"
        description="เลขห้อง · ชั้น · ประเภท · ค่าเช่า · จำนวนที่นอน — ยอดบิลงวดถัดไปจะคำนวณจากค่าเช่าใหม่"
      >
        <RoomFormFields
          roomNumber={roomNumber}
          setRoomNumber={setRoomNumber}
          floor={floor}
          setFloor={setFloor}
          roomType={roomType}
          setRoomType={setRoomType}
          basePrice={basePrice}
          setBasePrice={setBasePrice}
          maxOccupants={maxOccupants}
          setMaxOccupants={setMaxOccupants}
          error={error}
          loading={loading}
          onSubmit={onSubmit}
          onCancel={closeModal}
          submitLabel="บันทึกการแก้ไข"
        />
      </DormCenteredModal>
    </>
  );
}
