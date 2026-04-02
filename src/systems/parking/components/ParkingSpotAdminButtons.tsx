"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parkingBtnSecondary } from "@/systems/parking/parking-ui";

export function ParkingRegenerateTokenButton({ spotId }: { spotId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      className={parkingBtnSecondary}
      onClick={async () => {
        if (!confirm("สร้างลิงก์ QR ใหม่? ลิงก์เดิมจะใช้ไม่ได้")) return;
        setLoading(true);
        try {
          await fetch(`/api/parking/spots/${spotId}/token`, { method: "POST" });
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? "กำลังสร้าง…" : "สร้างลิงก์ QR ใหม่"}
    </button>
  );
}

export function ParkingDeleteSpotButton({ spotId }: { spotId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
      onClick={async () => {
        if (!confirm("ลบช่องจอดนี้? (ต้องไม่มีรถจอด)")) return;
        setLoading(true);
        try {
          const res = await fetch(`/api/parking/spots/${spotId}`, { method: "DELETE" });
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          if (!res.ok) {
            alert(data.error ?? "ลบไม่สำเร็จ");
            return;
          }
          router.push("/dashboard/parking/spots");
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? "กำลังลบ…" : "ลบช่อง"}
    </button>
  );
}
