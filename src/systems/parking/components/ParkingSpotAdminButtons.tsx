"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { parkingBtnSecondary } from "@/systems/parking/parking-ui";

export function ParkingRegenerateTokenButton({ spotId }: { spotId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function confirm() {
    setLoading(true);
    setErr(null);
    try {
      await fetch(`/api/parking/spots/${spotId}/token`, { method: "POST" });
      setOpen(false);
      router.refresh();
    } catch {
      setErr("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" className={parkingBtnSecondary} onClick={() => setOpen(true)}>
        สร้างลิงก์ QR ใหม่
      </button>
      <FormModal
        open={open}
        onClose={() => !loading && setOpen(false)}
        title="สร้างลิงก์ QR ใหม่?"
        description="ลิงก์และ QR เดิมจะใช้ไม่ได้ — ต้องพิมพ์หรือแจกลิงก์ใหม่ให้ลูกค้า"
        appearance="glass"
        footer={
          <FormModalFooterActions
            cancelLabel="ยกเลิก"
            onCancel={() => setOpen(false)}
            submitLabel="สร้างลิงก์ใหม่"
            onSubmit={confirm}
            loading={loading}
            submitDisabled={loading}
          />
        }
      >
        {err ? <p className="text-sm font-medium text-red-600">{err}</p> : null}
      </FormModal>
    </>
  );
}

export function ParkingDeleteSpotButton({ spotId }: { spotId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function confirm() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/parking/spots/${spotId}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "ลบไม่สำเร็จ");
        return;
      }
      setOpen(false);
      router.push("/dashboard/parking/spots");
      router.refresh();
    } catch {
      setErr("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="app-tap-feedback rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-2.5 text-sm font-bold text-rose-700 shadow-sm ring-1 ring-rose-100 transition hover:bg-rose-100"
        onClick={() => setOpen(true)}
      >
        ลบช่อง
      </button>
      <FormModal
        open={open}
        onClose={() => !loading && setOpen(false)}
        title="ลบช่องจอดนี้?"
        description="ต้องไม่มีรถจอดในเซสชันที่เปิดอยู่ — การลบไม่สามารถย้อนกลับได้"
        appearance="glass"
        footer={
          <FormModalFooterActions
            cancelLabel="ยกเลิก"
            onCancel={() => setOpen(false)}
            submitLabel="ลบช่อง"
            onSubmit={confirm}
            loading={loading}
            submitDisabled={loading}
            danger
          />
        }
      >
        {err ? <p className="text-sm font-medium text-red-600">{err}</p> : null}
      </FormModal>
    </>
  );
}
