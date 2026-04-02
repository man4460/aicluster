"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parkingBtnPrimary } from "@/systems/parking/parking-ui";

export function ParkingCheckoutButton({
  sessionId,
  label = "เช็คเอาต์ / คิดเงิน",
}: {
  sessionId: number;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function checkout() {
    if (!confirm("ยืนยันเช็คเอาต์และคำนวณค่าจอดตามอัตราที่บันทึกตอนเช็คอิน?")) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/parking/sessions/${sessionId}/checkout`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "ไม่สำเร็จ");
        return;
      }
      router.refresh();
    } catch {
      setErr("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" disabled={loading} onClick={checkout} className={parkingBtnPrimary}>
        {loading ? "กำลังบันทึก…" : label}
      </button>
      {err ? <p className="mt-2 text-sm text-red-700">{err}</p> : null}
    </div>
  );
}
