"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { distanceMeters } from "@/lib/geo/haversine";
import { MawellThBrandHeader } from "@/components/branding/MawellThBrandHeader";

const statusTh: Record<string, string> = {
  AWAITING_CHECKOUT: "รอเช็คออก",
  ON_TIME: "ตรงเวลา",
  LATE: "มาสาย",
  EARLY_LEAVE: "ออกก่อนเวลา",
  LATE_AND_EARLY: "มาสาย · ออกก่อนเวลา",
};

const visitorKindTh: Record<string, string> = {
  ROSTER_STAFF: "พนักงานในรายชื่อ",
  EXTERNAL_GUEST: "บุคคลภายนอก",
};

/** บันทึกที่ยังไม่เช็คออก — ข้อมูลจาก API state (ขยายสำหรับแสดงก่อนเช็คออก) */
type OpenAttendanceLog = {
  id: number;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
  lateCheckIn: boolean;
  earlyCheckOut?: boolean;
  guestPhone?: string | null;
  guestName?: string | null;
  publicVisitorKind?: string | null;
  checkInLat?: number | null;
  checkInLng?: number | null;
  checkInFacePhotoUrl?: string | null;
  appliedShiftIndex?: number | null;
  appliedShiftLabel?: string | null;
  note?: string | null;
  actorFullName?: string | null;
  actorUsername?: string | null;
  actorEmail?: string | null;
};

function formatThDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}

function formatCoord(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(6);
}

type GeoState =
  | { ok: false; msg: string }
  | { ok: true; lat: number; lng: number; distance: number | null };

function initialAttendanceGeoState(): GeoState {
  return { ok: false, msg: "ยังไม่ได้ดึงตำแหน่ง — กดปุ่ม «ดึงตำแหน่ง (GPS)» (ขั้นตอนที่ 2)" };
}

const CHECK_STEP_1_ANCHOR_ID = "attendance-check-step-1";

type Props =
  | { mode: "session"; orgName?: string; logoUrl?: string | null }
  | {
      mode: "public";
      ownerId: string;
      /** ชุดทดลอง — ส่งต่อ API สาธารณะ (ไม่ส่งเมื่อ subscribe จริง / prod) */
      sandboxTrialSessionId?: string | null;
      orgName: string;
      logoUrl: string | null;
      geofence: { lat: number; lng: number; radiusMeters: number };
      /** จุดเช็คจาก ?loc= — ส่งต่อ API */
      publicLocationId: number | null;
      locationLabel?: string | null;
    };

type PublicFlow = "pick" | "staff" | "external";

const stepBox = "mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm";

function StepDoneMark({ done, label = "ทำครบแล้ว" }: { done: boolean; label?: string }) {
  if (!done) return null;
  return (
    <span
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm"
      title={label}
      aria-label={label}
    >
      <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M3.5 8.5l3 3 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** หน้า /check-in/[ownerId] — ไม่แสดงแบรนด์ MAWELL แค่โลโก้ธุรกิจ (ถ้ามี) + ชื่อองค์กรแถวเดียว */
function PublicCheckInHeader({
  orgName,
  logoUrl,
  locationLabel,
}: {
  orgName: string;
  logoUrl: string | null;
  locationLabel?: string | null;
}) {
  return (
    <header className="flex flex-col items-center gap-3 text-center">
      {logoUrl ? (
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt={orgName} className="max-h-full max-w-full object-contain p-1" />
        </div>
      ) : null}
      <h1 className="text-xl font-bold leading-snug text-slate-900">{orgName}</h1>
      {locationLabel?.trim() ? (
        <p className="text-xs font-medium text-slate-500">จุดเช็ค · {locationLabel.trim()}</p>
      ) : null}
    </header>
  );
}

export function AttendanceCheckClient(props: Props) {
  /** null จนกว่า client จะ mount — หลีกเลี่ยง hydration mismatch กับเวลาจริงที่ SSR */
  const [now, setNow] = useState<Date | null>(null);
  const [phone, setPhone] = useState("");
  const [guestName, setGuestName] = useState("");
  /** หน้าสาธารณะ: เลือกพนักงาน (รายชื่อ) vs บุคคลภายนอก */
  const [publicFlow, setPublicFlow] = useState<PublicFlow>("pick");
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const facePreview = useMemo(() => (faceFile ? URL.createObjectURL(faceFile) : null), [faceFile]);

  useEffect(() => {
    return () => {
      if (facePreview) URL.revokeObjectURL(facePreview);
    };
  }, [facePreview]);

  const stopFaceStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const v = videoRef.current;
    if (v) v.srcObject = null;
  }, []);

  useEffect(() => {
    return () => {
      stopFaceStream();
    };
  }, [stopFaceStream]);

  useEffect(() => {
    if (!cameraActive || !streamRef.current) return;
    const v = videoRef.current;
    const stream = streamRef.current;
    if (!v) return;
    v.srcObject = stream;
    void v.play().catch(() => {});
    return () => {
      v.srcObject = null;
    };
  }, [cameraActive]);

  async function startFaceCamera() {
    setErr(null);
    stopFaceStream();
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setErr("เบราว์เซอร์ไม่รองรับการเปิดกล้อง");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setErr("ไม่สามารถเปิดกล้อง — อนุญาตกล้องแล้วลองใหม่");
    }
  }

  function captureFromCamera() {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      setErr("รอให้ภาพจากกล้องพร้อมแล้วลองอีกครั้ง");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopFaceStream();
        setCameraActive(false);
        setFaceFile(new File([blob], "face.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  }

  function cancelFaceCamera() {
    stopFaceStream();
    setCameraActive(false);
  }

  function clearFaceCapture() {
    stopFaceStream();
    setCameraActive(false);
    setFaceFile(null);
  }

  const [geo, setGeo] = useState<GeoState>(() => initialAttendanceGeoState());
  const [openLog, setOpenLog] = useState<OpenAttendanceLog | null>(null);
  const [todayLatest, setTodayLatest] = useState<{
    checkOutTime: string | null;
    status: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [schemaSyncWarning, setSchemaSyncWarning] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  /** แถบด้านบนหลังเช็คเข้าสำเร็จ */
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [dataConsent, setDataConsent] = useState(false);

  const isPublic = props.mode === "public";
  const centerLat = isPublic ? props.geofence.lat : null;
  const centerLng = isPublic ? props.geofence.lng : null;
  const radius = isPublic ? props.geofence.radiusMeters : null;

  const refreshGeo = useCallback(() => {
    if (!navigator.geolocation) {
      setGeo({ ok: false, msg: "อุปกรณ์ไม่รองรับ GPS" });
      return;
    }
    setGeo({ ok: false, msg: "กำลังดึงพิกัด…" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (!isPublic) {
          setGeo({
            ok: true,
            lat,
            lng,
            distance: null,
          });
          return;
        }
        const d =
          centerLat != null && centerLng != null
            ? distanceMeters(centerLat, centerLng, lat, lng)
            : null;
        const inside = d != null && radius != null && d <= radius;
        setGeo(
          inside
            ? { ok: true, lat, lng, distance: d }
            : {
                ok: false,
                msg:
                  d != null && radius != null
                    ? `อยู่ห่างจุดเช็คอิน ~${Math.round(d)} เมตร (อนุญาต ≤ ${radius} เมตร)`
                    : "ไม่สามารถตรวจระยะได้",
              },
        );
      },
      () => setGeo({ ok: false, msg: "ไม่ได้รับตำแหน่ง — เปิด Location แล้วลองใหม่" }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, [isPublic, centerLat, centerLng, radius]);

  function scrollToCheckStep1() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(CHECK_STEP_1_ANCHOR_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  const loadStateSession = useCallback(async () => {
    const res = await fetch("/api/attendance/session/state", { credentials: "include" });
    const j = (await res.json().catch(() => ({}))) as {
      openLog?: OpenAttendanceLog | null;
      todayLatest?: typeof todayLatest;
      syncWarning?: string | null;
    };
    if (res.ok) {
      setOpenLog(j.openLog ?? null);
      setTodayLatest(j.todayLatest ?? null);
      setSchemaSyncWarning(j.syncWarning ?? null);
    }
  }, []);

  const loadStatePublic = useCallback(async () => {
    if (!isPublic || props.mode !== "public") return;
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setOpenLog(null);
      setTodayLatest(null);
      return;
    }
    const tid = props.sandboxTrialSessionId?.trim();
    const res = await fetch("/api/attendance/public/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerId: props.ownerId,
        phone: digits,
        ...(tid ? { trialSessionId: tid } : {}),
      }),
    });
    const j = (await res.json().catch(() => ({}))) as {
      openLog?: OpenAttendanceLog | null;
      todayLatest?: typeof todayLatest;
      syncWarning?: string | null;
    };
    if (res.ok) {
      setOpenLog(j.openLog ?? null);
      setTodayLatest(j.todayLatest ?? null);
      setSchemaSyncWarning(j.syncWarning ?? null);
    }
  }, [isPublic, phone, props]);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isPublic) void loadStateSession();
  }, [isPublic, loadStateSession]);

  useEffect(() => {
    if (isPublic) void loadStatePublic();
  }, [isPublic, loadStatePublic]);

  async function getFreshPosition(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    });
  }

  async function onCheckIn() {
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const pos = await getFreshPosition();
      if (!pos) {
        setErr("ไม่ได้รับพิกัด — อนุญาตการเข้าถึงตำแหน่ง");
        return;
      }
      if (!dataConsent) {
        setErr("กรุณาติ๊กยินยอมให้เก็บข้อมูล (ขั้นตอนที่ 4)");
        return;
      }
      if (isPublic) {
        const digits = phone.replace(/\D/g, "");
        if (digits.length < 9) {
          setErr("กรอกเบอร์อย่างน้อย 9 หลัก");
          return;
        }
        if (!faceFile) {
          setErr("ต้องถ่ายรูปใบหน้าก่อนเช็คเข้า");
          return;
        }
        const visitorKind = publicFlow === "staff" ? "ROSTER_STAFF" : "EXTERNAL_GUEST";
        const fd = new FormData();
        fd.set("ownerId", props.ownerId);
        fd.set("phone", digits);
        fd.set("name", guestName.trim());
        fd.set("visitorKind", visitorKind);
        fd.set("latitude", String(pos.lat));
        fd.set("longitude", String(pos.lng));
        fd.set("face", faceFile, faceFile.name || "face.jpg");
        if (props.publicLocationId != null && props.publicLocationId > 0) {
          fd.set("locationId", String(props.publicLocationId));
        }
        const pubTid = props.sandboxTrialSessionId?.trim();
        if (pubTid) fd.set("trialSessionId", pubTid);
        const res = await fetch("/api/attendance/public/check-in", {
          method: "POST",
          body: fd,
        });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setErr(j.error ?? "บันทึกไม่สำเร็จ");
          return;
        }
        clearFaceCapture();
        setDataConsent(false);
        setErr(null);
        setMsg(null);
        setPhone("");
        setGuestName("");
        setPublicFlow("pick");
        setGeo(initialAttendanceGeoState());
        setSuccessBanner("เช็คเข้างานแล้ว");
        await loadStatePublic();
        setTimeout(() => scrollToCheckStep1(), 120);
      } else {
        if (!faceFile) {
          setErr("ต้องถ่ายรูปใบหน้าก่อนเช็คเข้า");
          return;
        }
        const fd = new FormData();
        fd.set("latitude", String(pos.lat));
        fd.set("longitude", String(pos.lng));
        fd.set("face", faceFile, faceFile.name || "face.jpg");
        const res = await fetch("/api/attendance/session/check-in", {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setErr(j.error ?? "บันทึกไม่สำเร็จ");
          return;
        }
        clearFaceCapture();
        setDataConsent(false);
        setErr(null);
        setMsg(null);
        setGeo(initialAttendanceGeoState());
        setSuccessBanner("เช็คเข้างานแล้ว");
        await loadStateSession();
        setTimeout(() => scrollToCheckStep1(), 120);
      }
    } finally {
      setBusy(false);
    }
  }

  async function onCheckOut() {
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const pos = await getFreshPosition();
      if (!pos) {
        setErr("ไม่ได้รับพิกัด");
        return;
      }
      if (isPublic) {
        const digits = phone.replace(/\D/g, "");
        if (digits.length < 9) {
          setErr("กรอกเบอร์");
          return;
        }
        const pubTidOut = props.sandboxTrialSessionId?.trim();
        const res = await fetch("/api/attendance/public/check-out", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerId: props.ownerId,
            phone: digits,
            latitude: pos.lat,
            longitude: pos.lng,
            ...(props.publicLocationId != null && props.publicLocationId > 0
              ? { locationId: props.publicLocationId }
              : {}),
            ...(pubTidOut ? { trialSessionId: pubTidOut } : {}),
          }),
        });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setErr(j.error ?? "บันทึกไม่สำเร็จ");
          return;
        }
        setMsg("เช็คออกงานแล้ว");
        await loadStatePublic();
        refreshGeo();
      } else {
        const res = await fetch("/api/attendance/session/check-out", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ latitude: pos.lat, longitude: pos.lng }),
        });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setErr(j.error ?? "บันทึกไม่สำเร็จ");
          return;
        }
        setMsg("เช็คออกงานแล้ว");
        await loadStateSession();
      }
    } finally {
      setBusy(false);
    }
  }

  const showFaceCapture = !isPublic || publicFlow === "staff" || publicFlow === "external";
  /** มีบันทึกเช็คเข้าค้าง — โฟกัสเช็คออก ไม่ต้องถ่ายรูป/ยินยอมใหม่ */
  const checkoutOnlyUi = !!openLog;

  const canCheckIn = isPublic
    ? geo.ok &&
      dataConsent &&
      phone.replace(/\D/g, "").length >= 9 &&
      !!faceFile &&
      !openLog &&
      (publicFlow === "staff" || publicFlow === "external")
    : !openLog && !!faceFile && dataConsent && geo.ok;

  async function lookupRosterName() {
    if (props.mode !== "public") return;
    const ownerId = props.ownerId;
    setErr(null);
    setMsg(null);
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setErr("กรอกเบอร์อย่างน้อย 9 หลักก่อนค้นหา");
      return;
    }
    const lookTid = props.mode === "public" ? props.sandboxTrialSessionId?.trim() : "";
    const res = await fetch("/api/attendance/public/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerId,
        phone: digits,
        ...(lookTid ? { trialSessionId: lookTid } : {}),
      }),
    });
    const j = (await res.json().catch(() => ({}))) as { displayName?: string | null; error?: string };
    if (!res.ok) {
      setErr(j.error ?? "ค้นหาไม่สำเร็จ");
      return;
    }
    if (j.displayName) {
      setGuestName(j.displayName);
      setMsg("พบชื่อในรายชื่อพนักงานแล้ว — ตรวจสอบแล้วกดเช็คเข้า");
    } else {
      setErr("ไม่พบเบอร์ในรายชื่อ — ให้เจ้าของเพิ่มที่แดชบอร์ด หรือกด «บุคคลภายนอก»");
    }
  }
  const canCheckOut = !!openLog;

  const orgLine = isPublic ? props.orgName : props.orgName ?? "เช็คชื่อพนักงาน";
  const showAfterStep1 = !isPublic || publicFlow !== "pick";

  const phoneDigitsLen = phone.replace(/\D/g, "").length;
  const step1PublicFormDone =
    isPublic &&
    (publicFlow === "staff" || publicFlow === "external") &&
    phoneDigitsLen >= 9 &&
    (openLog ? true : guestName.trim().length > 0);
  const step1SessionIdentityDone = !isPublic;
  const step2GpsDone = geo.ok;
  const step3FaceDone = !!faceFile;
  const step4ConsentDone = dataConsent;
  const step5AttendanceDone = !!openLog || !!todayLatest?.checkOutTime;

  return (
    <div className="mx-auto min-h-[100dvh] max-w-md bg-gradient-to-b from-[#0000BF]/[0.03] via-white to-white px-4 pb-16 pt-6">
      {isPublic ? (
        <PublicCheckInHeader
          orgName={props.orgName}
          logoUrl={props.logoUrl}
          locationLabel={props.locationLabel ?? null}
        />
      ) : (
        <MawellThBrandHeader orgLine={orgLine} logoUrl={props.logoUrl ?? null} />
      )}

      {successBanner ? (
        <div
          className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-600 px-4 py-3 text-white shadow-md shadow-emerald-900/10"
          role="status"
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M3.5 8.5l3 3 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <p className="min-w-0 flex-1 text-sm font-semibold leading-snug">{successBanner}</p>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-white/90 hover:bg-white/15"
            aria-label="ปิดแถบแจ้งเตือน"
          >
            ปิด
          </button>
        </div>
      ) : null}

      <div className="mt-8 rounded-2xl border border-[#0000BF]/15 bg-white px-5 py-6 shadow-sm">
        <p className="text-center text-xs font-medium uppercase tracking-wider text-slate-500">เวลาปัจจุบัน</p>
        <p className="mt-2 text-center text-3xl font-bold tabular-nums text-slate-900">
          {now
            ? now.toLocaleTimeString("th-TH", {
                timeZone: "Asia/Bangkok",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            : "--:--:--"}
        </p>
        <p className="mt-1 text-center text-sm text-slate-500">
          {now
            ? now.toLocaleDateString("th-TH", {
                timeZone: "Asia/Bangkok",
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "\u00a0"}
        </p>
      </div>

      {isPublic ? (
        publicFlow === "pick" ? (
          <div className={stepBox} id={CHECK_STEP_1_ANCHOR_ID}>
            <p className="text-sm font-semibold text-slate-900">ขั้นตอนที่ 1 · เลือกประเภทผู้เช็ค</p>
            <p className="mt-1 text-xs text-slate-600">เลือกว่าเป็นพนักงานหรือบุคคลภายนอก</p>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setPublicFlow("staff");
                  setErr(null);
                  setMsg(null);
                  setSuccessBanner(null);
                  setGuestName("");
                  setDataConsent(false);
                  clearFaceCapture();
                }}
                className="min-h-[52px] w-full rounded-2xl bg-[#0000BF] py-3.5 text-base font-bold text-white shadow-md shadow-[#0000BF]/20"
              >
                พนักงาน — ยืนยันด้วยเบอร์ในรายชื่อ
              </button>
              <button
                type="button"
                onClick={() => {
                  setPublicFlow("external");
                  setErr(null);
                  setMsg(null);
                  setSuccessBanner(null);
                  setGuestName("");
                  setDataConsent(false);
                  clearFaceCapture();
                }}
                className="min-h-[52px] w-full rounded-2xl border-2 border-slate-300 bg-white py-3.5 text-base font-bold text-slate-800"
              >
                บุคคลภายนอก — กรอกข้อมูลอิสระ
              </button>
            </div>
          </div>
        ) : (
          <div className={stepBox} id={CHECK_STEP_1_ANCHOR_ID}>
            <button
              type="button"
              onClick={() => {
                setPublicFlow("pick");
                setErr(null);
                setMsg(null);
                setSuccessBanner(null);
                setDataConsent(false);
                clearFaceCapture();
              }}
              className="text-xs font-bold text-[#0000BF] hover:underline"
            >
              ← เปลี่ยนประเภทผู้เช็ค
            </button>
            <div className="mt-2 flex items-start justify-between gap-3">
              <p className="min-w-0 flex-1 text-sm font-semibold text-slate-900">ขั้นตอนที่ 1 · เบอร์โทรและชื่อ</p>
              <StepDoneMark done={step1PublicFormDone} label="กรอกเบอร์และชื่อครบแล้ว" />
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {openLog
                ? "เบอร์นี้มีการเช็คเข้าค้าง — ตรวจสอบรายละเอียดที่ขั้นตอนสุดท้าย แล้วดึง GPS ก่อนกดเช็คออก"
                : publicFlow === "staff"
                  ? "เบอร์ต้องตรงรายชื่อที่เจ้าของลงทะเบียน — กดค้นหาชื่อก่อนเช็คเข้า"
                  : "กรอกเบอร์และชื่อตามจริง — ไม่ต้องอยู่ในรายชื่อพนักงาน"}
            </p>
            <label className="mt-3 block text-xs font-semibold text-slate-700">
              เบอร์โทร
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                className="mt-1 w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-lg outline-none focus:border-[#0000BF]/40"
                placeholder="0812345678"
              />
            </label>
            {!openLog && publicFlow === "staff" ? (
              <button
                type="button"
                onClick={() => void lookupRosterName()}
                className="mt-3 w-full rounded-xl border-2 border-[#0000BF]/40 bg-white py-2.5 text-sm font-bold text-[#0000BF]"
              >
                ค้นหาชื่อจากรายชื่อพนักงาน
              </button>
            ) : null}
            {!openLog ? (
              <label className="mt-3 block text-xs font-semibold text-slate-700">
                {publicFlow === "staff" ? "ชื่อ (ดึงจากรายชื่อ หรือแก้ได้)" : "ชื่อ / หมายเหตุ (อิสระ)"}
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value.slice(0, 100))}
                  className="mt-1 w-full rounded-2xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-[#0000BF]/40"
                  placeholder={publicFlow === "external" ? "เช่น คุณสมศรี — ผู้รับเหมา" : ""}
                />
              </label>
            ) : null}
          </div>
        )
      ) : (
        <div className={stepBox} id={CHECK_STEP_1_ANCHOR_ID}>
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 flex-1 text-sm font-semibold text-slate-900">ขั้นตอนที่ 1 · ตัวตนผู้เช็ค</p>
            <StepDoneMark done={step1SessionIdentityDone} label="ล็อกอินแล้ว" />
          </div>
          <p className="mt-1 text-xs text-slate-600">
            {openLog
              ? "มีการเช็คเข้าค้าง — ดำเนินการเช็คออกได้ที่ขั้นตอนถัดไป (ดึง GPS แล้วกดเช็คออก)"
              : "เข้าสู่ระบบด้วยบัญชีพนักงานแล้ว — ไม่ต้องกรอกเบอร์โทรในขั้นตอนนี้"}
          </p>
        </div>
      )}

      {showAfterStep1 ? (
        <>
          <div className={stepBox}>
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 flex-1 text-sm font-semibold text-slate-900">
                {checkoutOnlyUi ? "ขั้นตอนที่ 2 · ดึงตำแหน่ง (เช็คออก)" : "ขั้นตอนที่ 2 · ดึงตำแหน่ง GPS"}
              </p>
              <StepDoneMark done={step2GpsDone} label="ตำแหน่งพร้อมแล้ว" />
            </div>
            <p className="mt-1 text-xs text-slate-600">
              {checkoutOnlyUi
                ? isPublic
                  ? "กดปุ่มเพื่อยืนยันตำแหน่งก่อนเช็คชื่อออก — ต้องอยู่ในจุดเช็คที่องค์กรกำหนด"
                  : "กดปุ่มเพื่อยืนยันตำแหน่งก่อนเช็คออก — ระบบจะส่งพิกัดอีกครั้งตอนกดเช็คออก"
                : isPublic
                  ? "กดปุ่มด้านล่างเพื่อตรวจว่าอยู่ในจุดเช็คอินที่องค์กรกำหนด"
                  : "กดปุ่มด้านล่างเพื่อยืนยันตำแหน่ง — ตอนกดเช็คเข้า/ออกระบบจะส่งพิกัดใหม่อีกครั้ง"}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slate-700">
              {geo.ok
                ? geo.distance != null
                  ? `อยู่ในรัศมี — ห่างจุดเช็ค ~${Math.round(geo.distance)} เมตร`
                  : checkoutOnlyUi
                    ? "ได้รับพิกัดแล้ว — พร้อมเช็คออก"
                    : "ได้รับพิกัดแล้ว — พร้อมเช็คเข้า"
                : geo.msg}
            </p>
            <button
              type="button"
              onClick={() => refreshGeo()}
              className="mt-3 min-h-[44px] w-full rounded-xl bg-[#0000BF] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0000a6]"
            >
              {geo.ok ? "ตรวจสอบตำแหน่งอีกครั้ง" : "ดึงตำแหน่ง (GPS)"}
            </button>
          </div>

          {showFaceCapture && !checkoutOnlyUi ? (
            <>
              <div className={stepBox}>
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 text-sm font-semibold text-slate-900">ขั้นตอนที่ 3 · ถ่ายรูปใบหน้า</p>
                  <StepDoneMark done={step3FaceDone} label="ถ่ายรูปแล้ว" />
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  ถ่ายจากกล้องเท่านั้น — เปิดกล้องหน้า แล้วกดยืนยันถ่ายรูป
                </p>
                {!facePreview ? (
                  cameraActive ? (
                    <div className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-black p-2">
                      <video
                        ref={videoRef}
                        className="mx-auto aspect-[3/4] w-full max-w-xs rounded-xl bg-black object-cover"
                        playsInline
                        muted
                        autoPlay
                      />
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={cancelFaceCamera}
                          className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-800"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={captureFromCamera}
                          className="flex-1 rounded-xl bg-[#0000BF] py-2.5 text-sm font-bold text-white"
                        >
                          ยืนยันถ่ายรูป
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void startFaceCamera()}
                      className="mt-3 w-full rounded-2xl border-2 border-dashed border-[#0000BF]/40 bg-slate-50 py-10 text-center"
                    >
                      <span className="text-sm font-bold text-[#0000BF]">เปิดกล้องถ่ายรูปใบหน้า</span>
                      <span className="mt-1 block text-xs text-slate-500">อนุญาตการใช้กล้องเมื่อเบราว์เซอร์ถาม</span>
                    </button>
                  )
                ) : (
                  <div className="mt-3 space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={facePreview} alt="" className="mx-auto max-h-56 w-full max-w-xs rounded-2xl border border-slate-200 object-cover" />
                    <button
                      type="button"
                      onClick={clearFaceCapture}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-800"
                    >
                      ถ่ายใหม่
                    </button>
                  </div>
                )}
              </div>

              <div className={stepBox}>
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 text-sm font-semibold text-slate-900">ขั้นตอนที่ 4 · ยินยอมให้เก็บข้อมูล</p>
                  <StepDoneMark done={step4ConsentDone} label="ยินยอมแล้ว" />
                </div>
                <p className="mt-1 text-xs text-slate-600">อ่านแล้วติ๊กยืนยันก่อนกดเข้างาน</p>
                <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                  <input
                    type="checkbox"
                    checked={dataConsent}
                    onChange={(e) => setDataConsent(e.target.checked)}
                    className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-[#0000BF] focus:ring-[#0000BF]/30"
                  />
                  <span className="text-sm leading-snug text-slate-700">
                    ข้าพเจ้ายินยอมให้เก็บพิกัด GPS รูปใบหน้า และบันทึกเวลาเข้า-ออกงาน เพื่อการเช็คชื่อและหลักฐานตามที่องค์กรกำหนด
                  </span>
                </label>
              </div>
            </>
          ) : null}

          {showFaceCapture ? (
            <div className={stepBox}>
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 text-sm font-semibold text-slate-900">
                  {checkoutOnlyUi ? "ขั้นตอนที่ 3 · เช็คชื่อออก" : "ขั้นตอนที่ 5 · บันทึกเวลาเข้า-ออก"}
                </p>
                <StepDoneMark
                  done={step5AttendanceDone}
                  label={openLog ? "เช็คเข้าแล้ววันนี้" : "บันทึกครบวันแล้ว"}
                />
              </div>
              <p className="mt-1 text-xs text-slate-600">
                {checkoutOnlyUi
                  ? isPublic
                    ? "ระบบดึงรายละเอียดการเข้างานแล้ว — กดเช็คชื่อออกเมื่อพร้อม (ต้องดึง GPS ในขั้นตอนที่ 2)"
                    : "ระบบดึงรายละเอียดการเข้างานแล้ว — กดเช็คชื่อออกเมื่อพร้อม"
                  : isPublic
                    ? "กรอกเบอร์ครบแล้วระบบจะดึงสถานะอัตโนมัติ — หากมีการเช็คเข้าในระบบจะแสดงรายละเอียดด้านล่างและให้กดเช็คชื่อออก"
                    : "ตรวจสอบสถานะวันนี้ แล้วกดปุ่มที่ต้องการ"}
              </p>
                <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                  <p className="text-center text-xs font-semibold text-slate-600">สถานะวันนี้</p>
                  {openLog ? (
                    <div className="mt-3 space-y-3 text-left text-sm text-slate-800">
                      <p className="text-center text-sm font-semibold text-emerald-800">
                        พบบันทึกเช็คเข้าวันนี้ — ตรวจสอบรายละเอียดแล้วกดเช็คชื่อออก
                      </p>
                      <div className="space-y-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs">
                        <div className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                          <span className="text-slate-500">เวลาเข้างาน</span>
                          <span className="text-right font-medium text-slate-900">{formatThDateTime(openLog.checkInTime)}</span>
                        </div>
                        <div className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                          <span className="text-slate-500">สถานะ</span>
                          <span className="text-right font-medium text-[#0000BF]">{statusTh[openLog.status] ?? openLog.status}</span>
                        </div>
                        {openLog.appliedShiftLabel ? (
                          <div className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                            <span className="text-slate-500">กะที่ใช้คำนวณ</span>
                            <span className="text-right font-medium text-slate-900">{openLog.appliedShiftLabel}</span>
                          </div>
                        ) : null}
                        {openLog.lateCheckIn ? (
                          <p className="text-amber-800">มาสาย (หลังเวลาเริ่มกะที่ระบบใช้)</p>
                        ) : null}
                        {isPublic ? (
                          <>
                            {openLog.guestPhone ? (
                              <div className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                                <span className="text-slate-500">เบอร์โทร</span>
                                <span className="text-right font-medium">{openLog.guestPhone}</span>
                              </div>
                            ) : null}
                            {openLog.guestName ? (
                              <div className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                                <span className="text-slate-500">ชื่อ</span>
                                <span className="text-right font-medium">{openLog.guestName}</span>
                              </div>
                            ) : null}
                            {openLog.publicVisitorKind ? (
                              <div className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                                <span className="text-slate-500">ประเภทผู้เช็ค</span>
                                <span className="text-right font-medium">
                                  {visitorKindTh[openLog.publicVisitorKind] ?? openLog.publicVisitorKind}
                                </span>
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <div className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                            <span className="text-slate-500">ผู้เช็ค</span>
                            <span className="text-right font-medium">
                              {openLog.actorFullName?.trim() ||
                                openLog.actorUsername ||
                                openLog.actorEmail ||
                                "—"}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between gap-2 border-b border-slate-100 pb-2">
                          <span className="text-slate-500">พิกัดตอนเข้า (lat, lng)</span>
                          <span className="max-w-[55%] text-right font-mono text-[11px] text-slate-700">
                            {formatCoord(openLog.checkInLat)}, {formatCoord(openLog.checkInLng)}
                          </span>
                        </div>
                        {openLog.note?.trim() ? (
                          <div className="pt-1">
                            <span className="text-slate-500">หมายเหตุ</span>
                            <p className="mt-1 text-slate-800">{openLog.note.trim()}</p>
                          </div>
                        ) : null}
                        {openLog.checkInFacePhotoUrl ? (
                          <div className="pt-2">
                            <span className="text-slate-500">รูปใบหน้าตอนเข้า</span>
                            <div className="mt-2 flex justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={openLog.checkInFacePhotoUrl}
                                alt="รูปตอนเช็คเข้า"
                                className="max-h-48 max-w-full rounded-xl border border-slate-200 object-contain"
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : todayLatest?.checkOutTime ? (
                    <div className="mt-2 text-center text-sm text-slate-700">
                      <p>เช็คครบวันแล้ว</p>
                      <p className="mt-1 text-xs text-slate-500">{statusTh[todayLatest.status] ?? todayLatest.status}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-center text-sm text-slate-500">ยังไม่ได้เช็คเข้าวันนี้</p>
                  )}
                </div>
              <div className="mt-4 flex flex-col gap-3">
                {!checkoutOnlyUi ? (
                  <button
                    type="button"
                    disabled={busy || !canCheckIn}
                    onClick={() => void onCheckIn()}
                    className="min-h-[52px] w-full rounded-2xl bg-[#0000BF] py-3.5 text-base font-bold text-white shadow-lg shadow-[#0000BF]/20 disabled:opacity-45"
                  >
                    ยืนยันเข้างาน
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy || !canCheckOut}
                  onClick={() => void onCheckOut()}
                  className="min-h-[52px] w-full rounded-2xl border-2 border-slate-800 bg-white py-3.5 text-base font-bold text-slate-900 disabled:opacity-45"
                >
                  เช็คชื่อออกงาน
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {schemaSyncWarning ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm text-amber-950">
          {schemaSyncWarning}
        </p>
      ) : null}
      {err ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-800">{err}</p> : null}
      {msg ? <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-900">{msg}</p> : null}
    </div>
  );
}
