"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { FACE_ENROLL_MAX_SAMPLES } from "@/lib/attendance/face-descriptor";
import {
  captureMultiFrameDescriptor,
  preloadAttendanceFaceModels,
  waitForVideoFrame,
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

type AngleStep = {
  title: string;
  detail: string;
  /** ผ่อนเกณฑ์หันหน้าเฉพาะมุมข้าง — ไม่ให้ระบบปฏิเสธมุมที่สั่งให้ทำเอง */
  maxYawRatio?: number;
  maxRollDeg?: number;
};

/** ลำดับมุมที่เก็บ — เก็บครบยิ่งจับคู่ได้แม่นในแสง/มุมจริง */
const ANGLE_STEPS: AngleStep[] = [
  {
    title: "มองตรงกล้อง",
    detail: "จัดใบหน้าให้เต็มกรอบวงรี ให้เห็นตาสองข้างและหน้าผากชัด",
  },
  {
    title: "หันซ้ายเล็กน้อย",
    detail: "หันประมาณครึ่งฝ่ามือ — ยังต้องเห็นตาทั้งสองข้าง",
    maxYawRatio: 0.62,
    maxRollDeg: 24,
  },
  {
    title: "หันขวาเล็กน้อย",
    detail: "หันกลับอีกด้านเท่า ๆ กัน — ยังต้องเห็นตาทั้งสองข้าง",
    maxYawRatio: 0.62,
    maxRollDeg: 24,
  },
  {
    title: "มองตรง แล้วยิ้ม",
    detail: "มุมสุดท้าย เก็บสีหน้าตอนยิ้มไว้ให้ระบบจำได้ทั้งสองแบบ",
  },
];

/** เก็บได้ครบเท่านี้ถือว่าใช้งานได้ดี */
const GOOD_ENOUGH_ANGLES = 3;

const PREP_CHECKS = [
  "อยู่คนเดียวหน้ากล้อง — ไม่มีคนยืนซ้อนด้านหลัง",
  "ถอดหมวก แมสก์ และดันแว่นกันแดดขึ้น",
  "อยู่ที่แสงสว่างพอ ไม่ยืนหันหลังให้หน้าต่าง",
  "ถือกล้องระดับสายตา ห่างประมาณหนึ่งช่วงแขน",
];

function sleep(ms: number) {
  return new Promise((r) => window.setTimeout(r, ms));
}

function StageDots({ stage }: { stage: number }) {
  const labels = ["เตรียมตัว", "เก็บใบหน้า", "พร้อมใช้งาน"];
  return (
    <ol className="flex items-center gap-1.5" aria-label="ขั้นตอนลงทะเบียนใบหน้า">
      {labels.map((label, i) => {
        const done = i < stage;
        const active = i === stage;
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-1.5">
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black",
                done
                  ? "bg-emerald-500 text-white"
                  : active
                    ? "bg-gradient-to-br from-[#5b61ff] to-[#8b5cf6] text-white shadow-sm"
                    : "bg-white/70 text-[#9490c0] ring-1 ring-[#e8e6fc]",
              )}
              aria-hidden
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={cn(
                "min-w-0 truncate text-[11px] font-bold",
                active ? "text-[#1e1b4b]" : done ? "text-emerald-800" : "text-[#9490c0]",
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

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
  /** descriptor ล่าสุด — ใช้ยืนยันซ้ำกรณีใบหน้าใกล้กับคนอื่น */
  const lastDescriptorRef = useRef<number[] | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [camReady, setCamReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [modelBusy, setModelBusy] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(sampleCount);
  const [angleIndex, setAngleIndex] = useState(0);
  const [duplicateWarn, setDuplicateWarn] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setCamReady(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    setSavedCount(sampleCount);
    setAngleIndex(sampleCount > 0 ? Math.min(sampleCount, ANGLE_STEPS.length - 1) : 0);
  }, [sampleCount, open]);

  useEffect(() => {
    if (!open) {
      stop();
      setErr(null);
      setHint(null);
      setDuplicateWarn(null);
      setCountdown(null);
      return;
    }
    setModelBusy(true);
    void preloadAttendanceFaceModels()
      .then(() => setHint(null))
      .catch(() => setErr("โหลดโมเดลจดจำใบหน้าไม่สำเร็จ — รีเฟรชหน้าแล้วเปิดใหม่"))
      .finally(() => setModelBusy(false));
    return () => stop();
  }, [open, stop]);

  useEffect(() => {
    if (!cameraOn || !streamRef.current || !videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    void video.play().catch(() => {});
    let alive = true;
    void waitForVideoFrame(video).then((ok) => {
      if (alive) setCamReady(ok);
    });
    return () => {
      alive = false;
    };
  }, [cameraOn]);

  async function startCamera() {
    setErr(null);
    stop();
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErr("เบราว์เซอร์นี้เปิดกล้องไม่ได้ — ต้องเปิดหน้าเว็บผ่าน https และอนุญาตกล้อง");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      setHint("กล้องเปิดแล้ว — ทำตามคำสั่งในกรอบ แล้วกดปุ่มถ่ายเก็บใบหน้า");
    } catch {
      setErr("เปิดกล้องไม่สำเร็จ — กดอนุญาตกล้องในเบราว์เซอร์แล้วลองใหม่");
    }
  }

  /** ส่ง descriptor หนึ่งมุมเข้าเซิร์ฟเวอร์ — คืน true เมื่อบันทึกสำเร็จ */
  async function saveDescriptor(descriptor: number[], allowDuplicateFace: boolean): Promise<boolean> {
    const res = await fetch(`/api/attendance/owner/roster/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        faceDescriptors: [descriptor],
        appendFace: true,
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
      return false;
    }
    if (!res.ok) throw new Error(j.error ?? "บันทึกไม่สำเร็จ");

    const prev = savedCount;
    const count = j.entry?.faceSampleCount ?? prev + 1;
    setSavedCount(count);
    onSaved();
    const nextIndex = Math.min(angleIndex + 1, ANGLE_STEPS.length - 1);
    setAngleIndex(nextIndex);
    if (count <= prev) {
      setHint("มุมนี้ใกล้กับที่เก็บไว้แล้ว — ลองขยับมุมให้ต่างขึ้นอีกนิดในรอบถัดไป");
    } else if (count >= GOOD_ENOUGH_ANGLES) {
      setHint(`เก็บแล้ว ${count} มุม — ใช้สแกนเช็คอินได้แล้ว เพิ่มได้ถึง ${FACE_ENROLL_MAX_SAMPLES} มุม`);
    } else {
      setHint(`เก็บแล้ว ${count} มุม — เก็บให้ครบ ${GOOD_ENOUGH_ANGLES} มุมเพื่อความแม่นยำ`);
    }
    return true;
  }

  async function captureAngle() {
    const video = videoRef.current;
    if (!video || !cameraOn) {
      setErr("กดปุ่ม «เปิดกล้อง» ก่อน");
      return;
    }
    setBusy(true);
    setErr(null);
    setDuplicateWarn(null);
    try {
      setHint("จัดใบหน้าให้นิ่งในกรอบ…");
      for (let n = 3; n >= 1; n--) {
        setCountdown(n);
        await sleep(620);
      }
      setCountdown(null);
      setHint("กำลังถ่ายหลายภาพและคัดภาพที่ชัดที่สุด…");

      const step = ANGLE_STEPS[Math.min(angleIndex, ANGLE_STEPS.length - 1)]!;
      const extracted = await captureMultiFrameDescriptor(video, {
        frames: 5,
        gapMs: 220,
        // ผู้ใช้ตั้งใจอยู่นิ่งตอนลงทะเบียน — ไม่ต้องตรวจการขยับแบบตอนเช็คอิน
        requireMotion: false,
        minSamples: 1,
        ...(step.maxYawRatio !== undefined ? { maxYawRatio: step.maxYawRatio } : {}),
        ...(step.maxRollDeg !== undefined ? { maxRollDeg: step.maxRollDeg } : {}),
      });
      if (!extracted.ok) {
        setErr(extracted.error);
        setHint(null);
        return;
      }
      lastDescriptorRef.current = extracted.descriptor;
      await saveDescriptor(extracted.descriptor, false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      setHint(null);
    } finally {
      setCountdown(null);
      setBusy(false);
    }
  }

  async function confirmDuplicate() {
    const descriptor = lastDescriptorRef.current;
    if (!descriptor) return;
    setBusy(true);
    setDuplicateWarn(null);
    try {
      await saveDescriptor(descriptor, true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function clearFace() {
    if (!confirm(`ลบข้อมูลใบหน้าของ ${displayName} แล้วเริ่มเก็บใหม่?`)) return;
    setBusy(true);
    setErr(null);
    setDuplicateWarn(null);
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
      setAngleIndex(0);
      setHint("ลบแล้ว — เริ่มเก็บมุมแรกใหม่ได้เลย");
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const step = ANGLE_STEPS[Math.min(angleIndex, ANGLE_STEPS.length - 1)]!;
  const stage = savedCount >= GOOD_ENOUGH_ANGLES ? 2 : cameraOn ? 1 : 0;
  const reachedMax = savedCount >= FACE_ENROLL_MAX_SAMPLES;
  const captureBlockReason = modelBusy
    ? "กำลังโหลดโมเดลจดจำใบหน้า…"
    : !cameraOn
      ? "เปิดกล้องก่อนจึงจะถ่ายได้"
      : !camReady
        ? "กำลังเตรียมภาพจากกล้อง…"
        : reachedMax
          ? `เก็บครบ ${FACE_ENROLL_MAX_SAMPLES} มุมแล้ว — ลบแล้วเริ่มใหม่ถ้าต้องการเปลี่ยน`
          : null;

  return (
    <FormModal
      open={open}
      onClose={() => {
        if (busy) return;
        stop();
        onClose();
      }}
      title="ลงทะเบียนใบหน้า"
      description={`${displayName} — ประมวลผลในเครื่อง ไม่ส่งภาพออกไปบริการภายนอก`}
      size="md"
      appearance="glass"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={busy || savedCount === 0}
            onClick={() => void clearFace()}
            className="min-h-[44px] rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-bold text-rose-700 disabled:opacity-45"
          >
            ลบใบหน้าที่เก็บไว้
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              stop();
              onClose();
            }}
            className={cn(
              "min-h-[44px] rounded-2xl px-6 text-sm font-black shadow-md disabled:opacity-50",
              savedCount >= GOOD_ENOUGH_ANGLES
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                : "border border-slate-200 bg-white text-slate-600",
            )}
          >
            {savedCount >= GOOD_ENOUGH_ANGLES ? "เสร็จสิ้น" : "ปิดหน้าต่าง"}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <StageDots stage={stage} />

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[1.25rem] border border-[#e8e6fc] bg-[#f7f6ff] px-3 py-2">
          <span className="text-xs font-black text-[#4d47b6]">
            เก็บไว้แล้ว {savedCount}/{FACE_ENROLL_MAX_SAMPLES} มุม
          </span>
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px] font-bold",
              savedCount >= GOOD_ENOUGH_ANGLES
                ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/70"
                : "bg-amber-100 text-amber-900 ring-1 ring-amber-200/70",
            )}
          >
            {savedCount >= GOOD_ENOUGH_ANGLES ? "พร้อมใช้สแกนเช็คอิน" : `แนะนำอย่างน้อย ${GOOD_ENOUGH_ANGLES} มุม`}
          </span>
        </div>

        {!cameraOn ? (
          <div className="rounded-[1.25rem] border border-[#e8e6fc] bg-white/80 p-3.5">
            <p className="text-sm font-black text-[#1e1b4b]">ขั้นที่ 1 · เตรียมตัวก่อนถ่าย</p>
            <ul className="mt-2 space-y-1.5">
              {PREP_CHECKS.map((c) => (
                <li key={c} className="flex items-start gap-2 text-xs font-medium leading-snug text-[#5f5a8a]">
                  <span className="mt-0.5 text-emerald-600" aria-hidden>
                    ✓
                  </span>
                  <span className="min-w-0">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-[#5b61ff]/30 bg-gradient-to-br from-[#ecebff] to-white p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#4d47b6]">
              มุมที่ {Math.min(angleIndex + 1, ANGLE_STEPS.length)} จาก {ANGLE_STEPS.length}
            </p>
            <p className="mt-0.5 text-base font-black leading-snug text-[#1e1b4b]">{step.title}</p>
            <p className="mt-1 text-xs font-medium leading-snug text-[#5f5a8a]">{step.detail}</p>
          </div>
        )}

        <div className="relative overflow-hidden rounded-2xl border border-[#e8e6fc] bg-slate-900/90 aspect-[3/4]">
          {cameraOn ? (
            <>
              <video
                ref={videoRef}
                className="h-full w-full -scale-x-100 object-cover"
                playsInline
                muted
                autoPlay
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className={cn(
                    "h-[74%] w-[62%] rounded-[50%] border-[3px] shadow-[0_0_0_9999px_rgba(15,23,42,0.42)] transition-colors",
                    busy ? "border-emerald-400" : "border-white/85",
                  )}
                  aria-hidden
                />
              </div>
              {countdown != null ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="text-7xl font-black text-white drop-shadow-lg">{countdown}</span>
                </div>
              ) : null}
              <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[11px] font-bold text-white/90">
                {camReady ? "จัดใบหน้าให้เต็มกรอบวงรี" : "กำลังเตรียมภาพจากกล้อง…"}
              </p>
            </>
          ) : (
            <div className="flex h-full items-center justify-center px-5 text-center text-sm font-medium text-white/85">
              กดปุ่มด้านล่างเพื่อเปิดกล้องหน้า
            </div>
          )}
        </div>

        {!cameraOn ? (
          <button
            type="button"
            disabled={modelBusy || busy}
            onClick={() => void startCamera()}
            className="min-h-[56px] w-full rounded-2xl bg-gradient-to-r from-[#5b61ff] to-[#8b5cf6] text-base font-black text-white shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {modelBusy ? "กำลังเตรียมระบบจดจำใบหน้า…" : "เปิดกล้อง"}
          </button>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              disabled={busy || Boolean(captureBlockReason)}
              onClick={() => void captureAngle()}
              className="min-h-[56px] w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-base font-black text-white shadow-lg shadow-emerald-200 disabled:opacity-45"
            >
              {busy
                ? countdown != null
                  ? `เตรียมตัว… ${countdown}`
                  : "กำลังบันทึกใบหน้า…"
                : `ถ่ายเก็บใบหน้า · ${step.title}`}
            </button>
            {captureBlockReason ? (
              <p className="text-center text-[11px] font-semibold text-[#66638c]">{captureBlockReason}</p>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={stop}
              className="min-h-[44px] w-full rounded-2xl border border-white/60 bg-white/80 text-sm font-bold text-[#4d47b6] disabled:opacity-50"
            >
              ปิดกล้อง
            </button>
          </div>
        )}

        {hint && !err ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-xs font-semibold text-emerald-900">
            {hint}
          </p>
        ) : null}
        {err ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
            <p className="text-sm font-semibold text-rose-800">{err}</p>
            <p className="mt-1 text-[11px] font-medium text-rose-700/90">
              แก้ตามข้อความแล้วกดถ่ายอีกครั้งได้ทันที — ไม่ต้องปิดหน้าต่าง
            </p>
          </div>
        ) : null}
        {duplicateWarn ? (
          <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2">
            <p className="text-sm font-semibold text-amber-950">{duplicateWarn}</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void confirmDuplicate()}
              className="min-h-[40px] rounded-lg border border-amber-400 bg-white/80 px-3 text-xs font-bold text-amber-900 disabled:opacity-50"
            >
              ยืนยันว่าเป็นคนละคน — บันทึกต่อ
            </button>
          </div>
        ) : null}
      </div>
    </FormModal>
  );
}
