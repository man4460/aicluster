"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { dormBtnPrimary } from "@/systems/dormitory/dorm-ui";
import { DormCenteredModal } from "@/systems/dormitory/components/DormCenteredModal";
import { parseRoomFormValues, RoomFormFields } from "@/systems/dormitory/components/RoomFormFields";
import { cn } from "@/lib/cn";

type AddRoomFormProps = {
  presentation?: "modal" | "inline";
  onSuccess?: () => void;
  /** เปิด popup อัตโนมัติเมื่อ URL มี ?tab=add */
  openFromUrl?: boolean;
  triggerLabel?: string;
};

export function AddRoomForm({
  presentation = "modal",
  onSuccess,
  openFromUrl = false,
  triggerLabel = "+ เพิ่มห้อง",
}: AddRoomFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    if (openFromUrl && searchParams.get("tab") === "add") {
      router.replace("/dashboard/dormitory/rooms", { scroll: false });
    }
  }

  useEffect(() => {
    if (openFromUrl && searchParams.get("tab") === "add") {
      setError(null);
      resetFields();
      setOpen(true);
    }
  }, [openFromUrl, searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = parseRoomFormValues({ roomNumber, roomType, basePrice, maxOccupants, floor });
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/dorm/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      resetFields();
      if (presentation === "modal") {
        closeModal();
      }
      onSuccess?.();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const fieldsProps = {
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
  };

  if (presentation === "inline") {
    return (
      <div className="rounded-[1.25rem] border border-white/60 bg-white/55 p-4 shadow-sm ring-1 ring-inset ring-white/50 backdrop-blur-sm sm:p-5">
        <p className="mb-4 text-xs text-slate-500">ค่าเช่าจะหารให้ผู้เข้าพักอัตโนมัติเมื่อมีมากกว่า 1 คน</p>
        <RoomFormFields {...fieldsProps} autoFocus />
      </div>
    );
  }

  return (
    <>
      <button type="button" onClick={openModal} className={cn(dormBtnPrimary, "w-full justify-center sm:w-auto")}>
        {triggerLabel}
      </button>

      <DormCenteredModal
        open={open}
        onClose={closeModal}
        title="เพิ่มห้องพัก"
        titleId="add-room-title"
        description="ค่าเช่าจะหารให้ผู้เข้าพักอัตโนมัติเมื่อมีมากกว่า 1 คน"
      >
        <RoomFormFields {...fieldsProps} onCancel={closeModal} autoFocus />
      </DormCenteredModal>
    </>
  );
}
