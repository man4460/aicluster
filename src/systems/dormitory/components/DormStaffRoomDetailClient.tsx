"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readStoredStaffDailyUnlock,
  staffDailyUnlockHeaders,
} from "@/lib/modules/staff-daily-pin";
import { cn } from "@/lib/cn";
import { EditRoomForm, type EditRoomFormRoom } from "@/systems/dormitory/components/EditRoomForm";
import {
  RoomDetailClient,
  type DormOverdueRow,
  type DormRoomDetailJson,
} from "@/systems/dormitory/components/RoomDetailClient";
import type { DormReceiptBrand } from "@/systems/dormitory/lib/dorm-receipt-print";
import { dormBtnSecondary } from "@/systems/dormitory/dorm-ui";
import { useDormitoryStaffAuth } from "@/systems/dormitory/lib/staff-api-fetch";

function parseFocusSection(raw: string | null | undefined): "meter" | "payment" | "tenants" | null {
  if (raw === "meter" || raw === "payment") return raw;
  if (raw === "tenants") return "tenants";
  return null;
}

export function DormStaffRoomDetailClient({
  roomId,
  embedded = false,
  onBack,
  initialPayMonth = null,
  initialSection = null,
  refreshNonce = 0,
}: {
  roomId: string;
  /** แสดงในกล่องพอร์ทัลเดิม — ไม่ห่อ page/card ใหม่ */
  embedded?: boolean;
  onBack?: () => void;
  initialPayMonth?: string | null;
  initialSection?: string | null;
  refreshNonce?: number;
}) {
  const staff = useDormitoryStaffAuth();
  const focusSection = parseFocusSection(initialSection);

  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [room, setRoom] = useState<DormRoomDetailJson | null>(null);
  const [dormBrand, setDormBrand] = useState<DormReceiptBrand | null>(null);
  const [overdueRows, setOverdueRows] = useState<DormOverdueRow[]>([]);
  const [initialBangkokYm, setInitialBangkokYm] = useState("");

  const loadRoom = useCallback(async () => {
    if (!staff) throw new Error("ไม่พบข้อมูลพนักงาน");
    const qs = new URLSearchParams({
      ownerId: staff.ownerId,
      t: staff.trialSessionId,
      k: staff.k,
    });
    const unlock = readStoredStaffDailyUnlock("dormitory", staff.ownerId);
    if (unlock) qs.set("du", unlock);
    const r = await fetch(`/api/dorm/staff/rooms/${roomId}?${qs}`, {
      cache: "no-store",
      headers: staffDailyUnlockHeaders("dormitory", staff.ownerId),
    });
    if (!r.ok) throw new Error("โหลดห้องไม่สำเร็จ");
    const d = (await r.json()) as {
      room: DormRoomDetailJson;
      dormBrand: DormReceiptBrand;
      overdueRows: DormOverdueRow[];
      initialBangkokYm: string;
    };
    setRoom(d.room);
    setDormBrand(d.dormBrand);
    setOverdueRows(d.overdueRows ?? []);
    setInitialBangkokYm(d.initialBangkokYm);
  }, [staff, roomId]);

  useEffect(() => {
    setLoading(true);
    void loadRoom()
      .catch((e) => setLoadErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, [loadRoom, refreshNonce]);

  const initialFocusSection =
    focusSection === "meter" || focusSection === "payment" ? focusSection : null;

  const editRoom: EditRoomFormRoom | null = room
    ? {
        id: room.id,
        roomNumber: room.roomNumber,
        floor: room.floor,
        roomType: room.roomType,
        basePrice: room.basePrice,
        maxOccupants: room.maxOccupants,
        activeTenants: room.tenants.filter((t) => t.status === "ACTIVE").length,
      }
    : null;

  if (loading) {
    return (
      <p className="py-8 text-center text-sm font-semibold text-[#66638c]">กำลังโหลดห้อง…</p>
    );
  }

  if (loadErr || !room || !dormBrand) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm font-bold text-rose-700">{loadErr ?? "ไม่พบห้อง"}</p>
        {onBack ? (
          <button type="button" onClick={onBack} className={cn(dormBtnSecondary, "mt-4 inline-flex")}>
            กลับ
          </button>
        ) : null}
      </div>
    );
  }

  const headerRow = (
    <div className="mb-3 flex flex-row items-start justify-between gap-3 sm:items-center">
      <div className="min-w-0">
        <h2 className="text-base font-black tracking-tight text-[#1e1b4b] sm:text-lg">ห้อง {room.roomNumber}</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-[#66638c]">
          {room.roomType} · ชั้น {room.floor} · ค่าเช่า {room.basePrice.toLocaleString("th-TH")} บาท/เดือน
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        {editRoom ? <EditRoomForm room={editRoom} onSaved={() => void loadRoom()} /> : null}
        {onBack ? (
          <button type="button" onClick={onBack} className={cn(dormBtnSecondary, "w-full justify-center sm:w-auto")}>
            กลับ
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className={embedded ? "min-h-0" : "mx-auto max-w-5xl px-3 py-4 sm:px-4"}>
      {headerRow}
      <RoomDetailClient
        key={`${room.id}-${refreshNonce}`}
        room={room}
        dormBrand={dormBrand}
        overdueRows={overdueRows}
        initialPayMonth={initialPayMonth}
        initialBangkokYm={initialBangkokYm}
        initialFocusSection={initialFocusSection}
        initialSection={focusSection}
        staffPortal={{
          backHref: "",
          hideDeleteRoom: true,
          onMutated: () => void loadRoom(),
        }}
      />
    </div>
  );
}
