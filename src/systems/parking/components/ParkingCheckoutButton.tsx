"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { parkingBtnPrimary } from "@/systems/parking/parking-ui";

export function ParkingCheckoutButton({
  sessionId,
  label = "เช็คเอาต์ / คิดเงิน",
}: {
  sessionId: number;
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function confirm() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/parking/sessions/${sessionId}/checkout`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "ไม่สำเร็จ");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setErr("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" className={parkingBtnPrimary} onClick={() => setOpen(true)} disabled={loading}>
        {label}
      </button>
      <FormModal
        open={open}
        onClose={() => !loading && setOpen(false)}
        title="ยืนยันเช็คเอาต์?"
        description="คำนวณค่าจอดตามอัตราที่บันทึกตอนเช็คอิน และปิดเซสชันนี้"
        appearance="glass"
        footer={
          <FormModalFooterActions
            cancelLabel="ยกเลิก"
            onCancel={() => setOpen(false)}
            submitLabel="เช็คเอาต์"
            onSubmit={confirm}
            loading={loading}
            submitDisabled={loading}
          />
        }
      >
        {err ? <p className="text-sm font-medium text-red-600">{err}</p> : null}
      </FormModal>
    </div>
  );
}
