"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { FACE_ENROLL_MAX_SAMPLES } from "@/lib/attendance/face-descriptor";
import {
  captureMultiFrameDescriptor,
  preloadAttendanceFaceModels,
} from "@/systems/attendance/lib/face-api-client";

type Props = {
  open: boolean;
  entryId: number;
  displayName: string;
  /** จำนวนมุมใบหน้าที่บันทึกไว้แล้ว */
  sampleCount?: number;
  onClose: () => void;
  onSaved: () => void;
};

/** มุมที่แนะนำให้เก็บ — ยิ่งหลากหลาย ยิ่งจับคู่ได้แม่นในสภาพจริง */
const ANGLE_STEPS = [
  "มองตรงกล้อง",
  "หันซ้ายเล็กน้อย",
  "หันขวาเล็กน้อย",
  "ก้มหน้าลงเล็กน้อย",
];

export function AttendanceFaceEnrollModal({
  open,
  entryId,
  displayName,
  sampleCount = 0,
  onClose,
  onSaved,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [modelBusy, setModelBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(sampleCount);
  const [duplicateWarn, setDuplicateWarn] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  useEffect(() => {
    setSavedCount(sampleCount);
  }, [sampleCount, open]);

  useEffect(() => {
    if (!open) {
      stop();
      setErr(null);
      setHint(null);
      setDuplicateWarn(null);
      return;
    }
    setModelBusy(true);
    void preloadAttendanceFaceModels()
      .then(() => setHint("โมเดลพร้อม — เปิดกล้อง จัดใบหน้าให้เต็มกรอบ แสงพอ แล้วเก็บทีละมุม"))
      .catch(() => setErr("โหลดโมเดลไม่สำเร็จ"))
      .finally(() => setModelBusy(false));
    return () => stop();
  }, [open, stop]);

  useEffect(() => {
    if (!cameraOn || !streamRef.current || !videoRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play().catch(() => {});
  }, [cameraOn]);

  async function startCamera() {
    setErr(null);
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
    } catch {
      setErr("เปิดกล้องไม่สำเร็จ — อนุญาตกล้องแล้วลองใหม่");
    }
  }

  /** append = เพิ่มมุมเข้าชุดเดิม · false = เริ่มชุดใหม่ทับของเก่า */
  async function captureAndSave(append: boolean, allowDuplicateFace = false) {
    const video = videoRef.current;
    if (!video || !cameraOn) {
      setErr("เปิดกล้องก่อน");
      return;
    }
    setBusy(true);
    setErr(null);
    setDuplicateWarn(null);
    setHint("กำลังถ่ายหลายเฟรมและคัดเฟรมที่ชัดที่สุด…");
    try {
      const extracted = await captureMultiFrameDescriptor(video, { frames: 4, gapMs: 280 });
      if (!extracted.ok) {
        setErr(extracted.error);
        setHint(null);
        return;
      }
      const res = await fetch(`/api/attendance/owner/roster/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          faceDescriptors: extracted.samples,
          appendFace: append,
          ...(allowDuplicateFace ? { allowDuplicateFace: true } : {}),
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        entry?: { faceSampleCount?: number };
        duplicateOf?: { displayName?: string };
      };
      if (res.status === 409 && j.duplicateOf) {
        setDuplicateWarn(j.error ?? "ใบหน้านี้ใกล้กับพนักงานคนอื่นที่ลงทะเบียนไว้");
        setHint(null);
        return;
      }
      if (!res.ok) throw new Error(j.error ?? "บันทึกไม่สำเร็จ");

      const count = j.entry?.faceSampleCount ?? savedCount + 1;
      setSavedCount(count);
      onSaved();
      setHint(
        count >= 3
          ? `บันทึกแล้ว ${count} มุม — ความแม่นยำระดับดี เพิ่มมุมอีกได้ถึง ${FACE_ENROLL_MAX_SAMPLES}`
          : `บันทึกแล้ว ${count} มุม — แนะนำเก็บอย่างน้อย 3 มุมเพื่อความแม่นยำ`,
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      setHint(null);
    } finally {
      setBusy(false);
    }
  }

  async function clearFace() {
    if (!confirm(`ลบข้อมูลใบหน้าของ ${displayName}?`)) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/attendance/owner/roster/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ faceDescriptor: null }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "ลบไม่สำเร็จ");
      setSavedCount(0);
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const nextAngle = ANGLE_STEPS[Math.min(savedCount, ANGLE_STEPS.length - 1)]!;
  const canAppend = savedCount > 0 && savedCount < FACE_ENROLL_MAX_SAMPLES;

  return (
    <FormModal
      open={open}
      onClose={() => {
        if (busy) return;
        stop();
        onClose();
      }}
      title="ลงทะเบียนใบหน้า"
      description={`${displayName} — ประมวลผลในเครื่อง ไม่ส่ง API ภายนอก`}
      size="md"
      appearance="glass"
      footer={
        <FormModalFooterActions
          onCancel={() => {
            stop();
            onClose();
          }}
          cancelLabel={savedCount > 0 ? "เสร็จสิ้น" : "ยกเลิก"}
          onSubmit={() => void captureAndSave(canAppend)}
          submitLabel={
            busy ? "กำลังบันทึก…" : canAppend ? `เก็บมุมที่ ${savedCount + 1}` : "เก็บใบหน้าชุดใหม่"
          }
          submitDisabled={busy || !cameraOn || modelBusy || savedCount >= FACE_ENROLL_MAX_SAMPLES}
          loading={busy}
        />
      }
    >
      <div className="space-y-3">
        {modelBusy ? <p className="text-xs font-semibold text-[#66638c]">กำลังโหลดโมเดลจดจำใบหน้า…</p> : null}
        {hint && !err ? <p className="text-xs font-semibold text-emerald-800">{hint}</p> : null}
        {err ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{err}</p> : null}
        {duplicateWarn ? (
          <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2">
            <p className="text-sm font-semibold text-amber-950">{duplicateWarn}</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void captureAndSave(canAppend, true)}
              className="min-h-[36px] rounded-lg border border-amber-400 bg-white/80 px-3 text-xs font-bold text-amber-900"
            >
              ยืนยันว่าเป็นคนละคน — บันทึกต่อ
            </button>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e8e6fc] bg-[#f7f6ff] px-3 py-2">
          <span className="text-xs font-bold text-[#4d47b6]">
            บันทึกไว้ {savedCount}/{FACE_ENROLL_MAX_SAMPLES} มุม
          </span>
          <span className="text-[11px] font-semibold text-[#66638c]">ถัดไป: {nextAngle}</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e8e6fc] bg-slate-900/90 aspect-[4/3]">
          {cameraOn ? (
            <video ref={videoRef} className="h-full w-full object-cover" playsInline muted autoPlay />
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center px-4 text-center text-sm text-white/80">
              กดเปิดกล้อง — คนเดียวในเฟรม แสงพอ ใบหน้าใหญ่และไม่เอียง
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {!cameraOn ? (
            <button
              type="button"
              disabled={modelBusy || busy}
              onClick={() => void startCamera()}
              className={cn(
                "app-btn-primary min-h-[44px] rounded-xl px-4 text-sm font-semibold",
                "disabled:opacity-50",
              )}
            >
              เปิดกล้อง
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={stop}
              className="min-h-[44px] rounded-xl border border-white/60 bg-white/80 px-4 text-sm font-semibold text-[#4d47b6]"
            >
              ปิดกล้อง
            </button>
          )}
          {savedCount > 0 ? (
            <button
              type="button"
              disabled={busy || !cameraOn || modelBusy}
              onClick={() => void captureAndSave(false)}
              className="min-h-[44px] rounded-xl border border-[#d8d6ec] bg-white px-4 text-sm font-bold text-[#4d47b6] disabled:opacity-50"
            >
              เริ่มชุดใหม่ (ทับของเดิม)
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => void clearFace()}
            className="min-h-[44px] rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 disabled:opacity-50"
          >
            ลบใบหน้า
          </button>
        </div>
      </div>
    </FormModal>
  );
}
