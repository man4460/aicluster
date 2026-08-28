"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { distanceMeters } from "@/lib/geo/haversine";
import {
  attendanceFacePunchActionButtonClass,
  attendanceFacePunchCameraPlaceholderClass,
  attendanceFacePunchCameraShellClass,
  attendanceFacePunchCameraVideoClass,
  attendanceFacePunchFeedbackClass,
  attendanceKioskCenterShellClass,
  attendanceKioskCompactClockClass,
  attendanceKioskPageInnerClass,
  attendanceKioskPageShellClass,
  attendanceKioskStepBoxClass,
  attendanceStepBoxClass,
} from "@/systems/attendance/attendance-ui";
import { AttendanceFaceKioskGuideModal } from "@/systems/attendance/components/AttendanceFaceKioskGuideModal";
import {
  captureMultiFrameDescriptor,
  extractFaceDescriptorFromBlob,
  preloadAttendanceFaceModels,
} from "@/systems/attendance/lib/face-api-client";

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

const FACE_CAPTURE_COUNTDOWN_SEC = 3;

function sleepMs(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function faceScanRetakeHint(detail: string): string {
  if (/ถ่ายใหม่|ลองใหม่/.test(detail)) return detail;
  return `${detail} — กรุณาถ่ายใหม่`;
}

function faceScanErrorFeedback(msg: string): { title: string; detail: string } {
  const t = msg.trim();
  if (/ไม่ตรงกับใบหน้า/.test(t)) {
    return { title: "ไม่ตรงกับใบหน้าในรายชื่อ", detail: faceScanRetakeHint(t) };
  }
  if (/คล้ายหลายคน/.test(t)) {
    return { title: "ใบหน้าคล้ายหลายคนในรายชื่อ", detail: faceScanRetakeHint(t) };
  }
  if (/ไม่พบใบหน้า|ภาพเบลอ|ใบหน้าเล็ก|ไม่เปลี่ยนแปลง|กล้อง/.test(t)) {
    return { title: "ถ่ายไม่ชัด — ลองใหม่", detail: faceScanRetakeHint(t) };
  }
  return { title: "สแกนไม่สำเร็จ", detail: faceScanRetakeHint(t) };
}

function faceScanSuccessFeedback(
  action: "check_in" | "check_out",
  displayName: string | undefined,
): { title: string; detail: string } {
  const name = displayName?.trim();
  const verb = action === "check_out" ? "เช็คออกแล้ว" : "เช็คเข้าแล้ว";
  if (name) {
    return { title: `ตรงกับ: ${name}`, detail: `${verb} — บันทึกเรียบร้อย` };
  }
  return { title: verb, detail: "ยืนยันใบหน้าและบันทึกเรียบร้อย" };
}

function FaceScanFeedback({
  variant,
  intent,
  title,
  detail,
}: {
  variant: "success" | "error";
  intent: "check_in" | "check_out";
  title: string;
  detail?: string;
}) {
  const success = variant === "success";
  return (
    <div
      role={success ? "status" : "alert"}
      className={attendanceFacePunchFeedbackClass(intent, variant)}
    >
      <p className="text-base font-black tracking-tight">{title}</p>
      {detail ? <p className="mt-1.5 text-xs font-semibold leading-relaxed opacity-90">{detail}</p> : null}
    </div>
  );
}

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
      /** เปิดทางเลือกสแกนใบหน้า (ตั้งค่าโดยเจ้าของ) */
      faceCheckInEnabled?: boolean;
      /**
       * ลิงก์แยกโหมด iPad (`/check-in/.../face`) — เฉพาะสแกนใบหน้า
       * หน้า `/check-in/...` หลักยังใช้วิธีเดิม (เบอร์ / ภายนอก)
       */
      kioskFaceOnly?: boolean;
    };

type PublicFlow = "pick" | "staff" | "external" | "face";

const stepBox = attendanceStepBoxClass;

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
  compact = false,
}: {
  orgName: string;
  logoUrl: string | null;
  locationLabel?: string | null;
  compact?: boolean;
}) {
  return (
    <header
      className={cn(
        "flex shrink-0 flex-col items-center text-center",
        compact ? "gap-1.5 pb-1" : "gap-3",
      )}
    >
      {logoUrl ? (
        <div
          className={cn(
            "flex items-center justify-center overflow-hidden rounded-2xl border border-[#e8e6fc] bg-white shadow-sm",
            compact ? "h-11 w-11" : "h-16 w-16",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt={orgName} className="max-h-full max-w-full object-contain p-1" />
        </div>
      ) : null}
      <h1 className={cn("font-bold leading-snug text-[#2e2a58]", compact ? "text-lg" : "text-xl")}>
        {orgName}
      </h1>
      {locationLabel?.trim() ? (
        <p className="text-xs font-medium text-[#66638c]">จุดเช็ค · {locationLabel.trim()}</p>
      ) : null}
    </header>
  );
}

function KioskCompactClock({ now }: { now: Date | null }) {
  return (
    <div className={attendanceKioskCompactClockClass}>
      <p className="text-2xl font-bold tabular-nums text-[#2e2a58]">
        {now
          ? now.toLocaleTimeString("th-TH", {
              timeZone: "Asia/Bangkok",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          : "--:--:--"}
      </p>
      <p className="mt-0.5 text-xs text-[#66638c]">
        {now
          ? now.toLocaleDateString("th-TH", {
              timeZone: "Asia/Bangkok",
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "\u00a0"}
      </p>
    </div>
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
      const { openUserCameraStream } = await import("@/lib/media/open-user-camera-stream");
      const stream = await openUserCameraStream();
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setErr("ไม่สามารถเปิดกล้อง — อนุญาตกล้องแล้วลองใหม่");
    }
  }

  function grabFaceBlobFromCamera(): Promise<File | null> {
    return new Promise((resolve) => {
      const video = videoRef.current;
      const stream = streamRef.current;
      if (!video || !stream) {
        resolve(null);
        return;
      }
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) {
        resolve(null);
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          resolve(new File([blob], "face.jpg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.92,
      );
    });
  }

  function captureFromCamera() {
    void grabFaceBlobFromCamera().then((file) => {
      if (!file) {
        setErr("รอให้ภาพจากกล้องพร้อมแล้วลองอีกครั้ง");
        return;
      }
      stopFaceStream();
      setCameraActive(false);
      setFaceFile(file);
    });
  }

  function cancelFaceCamera() {
    stopFaceStream();
    setCameraActive(false);
  }

  function clearFaceCapture() {
    stopFaceStream();
    setCameraActive(false);
    setFaceFile(null);
    setFaceCaptureCountdown(null);
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
  /** คีออสก์สแกนใบหน้า — แจ้งตรงกับใคร / ไม่ตรงให้ถ่ายใหม่ */
  const [faceScanFeedback, setFaceScanFeedback] = useState<{
    variant: "success" | "error";
    intent: "check_in" | "check_out";
    title: string;
    detail?: string;
  } | null>(null);
  const [dataConsent, setDataConsent] = useState(false);
  const [kioskGuideOpen, setKioskGuideOpen] = useState(false);
  /** คีออสก์ — ผู้ใช้เลือกเข้าหรือออกก่อนเปิดกล้อง */
  const [facePunchIntent, setFacePunchIntent] = useState<"check_in" | "check_out" | null>(null);
  /** นับถอยหลังก่อนถ่ายใบหน้า (คีออสก์) */
  const [faceCaptureCountdown, setFaceCaptureCountdown] = useState<number | null>(null);
  /** คีออสก์หลายจุด — เลือกจุดเมื่อลิงก์ไม่มี ?loc= */
  const [kioskSite, setKioskSite] = useState<{
    locationId: number;
    locationLabel: string;
    geofence: { lat: number; lng: number; radiusMeters: number };
  } | null>(null);
  const [kioskLocationChoices, setKioskLocationChoices] = useState<{ id: number; name: string }[] | null>(
    null,
  );
  const [kioskLocationPickOpen, setKioskLocationPickOpen] = useState(false);
  const [kioskContextLoading, setKioskContextLoading] = useState(false);

  const isPublic = props.mode === "public";
  const kioskFaceOnly = Boolean(isPublic && props.kioskFaceOnly);
  const faceEnabled = Boolean(isPublic && props.faceCheckInEnabled);

  const effectivePublicLocationId = useMemo(() => {
    if (!isPublic) return null;
    if (props.publicLocationId != null && props.publicLocationId > 0) return props.publicLocationId;
    return kioskSite?.locationId ?? null;
  }, [isPublic, props, kioskSite]);

  const effectiveGeofence = useMemo(() => {
    if (!isPublic) return null;
    if (props.publicLocationId != null && props.publicLocationId > 0) return props.geofence;
    return kioskSite?.geofence ?? props.geofence;
  }, [isPublic, props, kioskSite]);

  const effectiveLocationLabel = useMemo(() => {
    if (!isPublic) return null;
    if (props.locationLabel?.trim()) return props.locationLabel;
    return kioskSite?.locationLabel ?? null;
  }, [isPublic, props, kioskSite]);

  const centerLat = isPublic && effectiveGeofence ? effectiveGeofence.lat : null;
  const centerLng = isPublic && effectiveGeofence ? effectiveGeofence.lng : null;
  const radius = isPublic && effectiveGeofence ? effectiveGeofence.radiusMeters : null;

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

  const selectKioskLocation = useCallback(
    async (locId: number) => {
      if (props.mode !== "public") return;
      setKioskContextLoading(true);
      setErr(null);
      try {
        const params = new URLSearchParams({ ownerId: props.ownerId, loc: String(locId) });
        const tid = props.sandboxTrialSessionId?.trim();
        if (tid) params.set("t", tid);
        const res = await fetch(`/api/attendance/public/context?${params}`);
        const j = (await res.json().catch(() => ({}))) as {
          error?: string;
          activeLocationId?: number;
          locationLabel?: string | null;
          geofence?: { lat: number; lng: number; radiusMeters: number };
          locations?: { id: number; name: string }[];
        };
        if (!res.ok || !j.geofence || j.activeLocationId == null) {
          setErr(j.error ?? "โหลดจุดเช็คไม่สำเร็จ");
          return;
        }
        setKioskSite({
          locationId: j.activeLocationId,
          locationLabel:
            j.locationLabel ??
            j.locations?.find((l) => l.id === j.activeLocationId)?.name ??
            "จุดเช็ค",
          geofence: j.geofence,
        });
        setKioskLocationPickOpen(false);
        setGeo(initialAttendanceGeoState());
      } finally {
        setKioskContextLoading(false);
      }
    },
    [props],
  );

  useEffect(() => {
    if (!kioskFaceOnly || props.mode !== "public") return;
    if (props.publicLocationId != null && props.publicLocationId > 0) {
      setKioskSite({
        locationId: props.publicLocationId,
        locationLabel: props.locationLabel ?? "จุดเช็ค",
        geofence: props.geofence,
      });
      setKioskLocationPickOpen(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setKioskContextLoading(true);
      const params = new URLSearchParams({ ownerId: props.ownerId });
      const tid = props.sandboxTrialSessionId?.trim();
      if (tid) params.set("t", tid);
      try {
        const res = await fetch(`/api/attendance/public/context?${params}`);
        const j = (await res.json().catch(() => ({}))) as {
          error?: string;
          activeLocationId?: number;
          locationLabel?: string | null;
          geofence?: { lat: number; lng: number; radiusMeters: number };
          locations?: { id: number; name: string }[];
        };
        if (cancelled) return;
        if (!res.ok || !j.geofence || j.activeLocationId == null) {
          setErr(j.error ?? "โหลดจุดเช็คไม่สำเร็จ");
          return;
        }
        const locs = j.locations ?? [];
        if (locs.length > 1) {
          setKioskLocationChoices(locs);
          setKioskLocationPickOpen(true);
        } else {
          setKioskSite({
            locationId: j.activeLocationId,
            locationLabel: j.locationLabel ?? locs[0]?.name ?? "จุดเช็ค",
            geofence: j.geofence,
          });
          setKioskLocationPickOpen(false);
        }
      } finally {
        if (!cancelled) setKioskContextLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kioskFaceOnly, props]);

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
    if (!successBanner) return;
    const ms = kioskFaceOnly ? 7000 : 4500;
    const t = window.setTimeout(() => setSuccessBanner(null), ms);
    return () => window.clearTimeout(t);
  }, [successBanner, kioskFaceOnly]);

  useEffect(() => {
    if (!faceScanFeedback) return;
    const ms = faceScanFeedback.variant === "success" ? 7000 : 12000;
    const t = window.setTimeout(() => setFaceScanFeedback(null), ms);
    return () => window.clearTimeout(t);
  }, [faceScanFeedback]);

  /** คีออสก์ iPad — ล็อก scroll ทั้งหน้า (กัน body เลื่อน / bounce บน iOS) */
  useEffect(() => {
    if (!kioskFaceOnly) return;
    const html = document.documentElement;
    const body = document.body;
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyInset: body.style.inset,
      bodyWidth: body.style.width,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.inset = "0";
    body.style.width = "100%";
    return () => {
      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.position = previous.bodyPosition;
      body.style.inset = previous.bodyInset;
      body.style.width = previous.bodyWidth;
    };
  }, [kioskFaceOnly]);

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

  /** สแกนใบหน้าสาธารณะ — คีออสก์: เช็คเข้าหรือเช็คออก · อื่น ๆ: เช็คเข้าอย่างเดียว */
  async function submitPublicFaceCheckIn(
    file: File,
    precomputedDescriptor?: number[],
    precomputedSamples?: number[][],
  ) {
    if (props.mode !== "public") return;
    setErr(null);
    setMsg(
      kioskFaceOnly ? "กำลังระบุตัวตนและบันทึกเช็คเข้า/เช็คออก…" : "กำลังระบุตัวตนและบันทึกเช็คอิน…",
    );
    setBusy(true);
    try {
      const pos = await getFreshPosition();
      if (!pos) {
        setErr("ไม่ได้รับพิกัด — อนุญาตการเข้าถึงตำแหน่งแล้วลองใหม่");
        void startFaceCamera();
        return;
      }
      if (isPublic && centerLat != null && centerLng != null && radius != null) {
        const d = distanceMeters(centerLat, centerLng, pos.lat, pos.lng);
        if (d > radius) {
          setErr(`อยู่นอกรัศมีจุดเช็ค (~${Math.round(d)} ม. จากจุดที่ตั้งไว้ สูงสุด ${radius} ม.)`);
          void startFaceCamera();
          return;
        }
        setGeo({ ok: true, lat: pos.lat, lng: pos.lng, distance: d });
      } else {
        setGeo({ ok: true, lat: pos.lat, lng: pos.lng, distance: null });
      }

      let descriptor = precomputedDescriptor;
      if (!descriptor) {
        setMsg("กำลังวิเคราะห์ใบหน้าหลายเฟรม…");
        const extracted = await extractFaceDescriptorFromBlob(file);
        if (!extracted.ok) {
          setErr(extracted.error);
          void startFaceCamera();
          return;
        }
        descriptor = extracted.descriptor;
      }
      const fd = new FormData();
      fd.set("ownerId", props.ownerId);
      fd.set("latitude", String(pos.lat));
      fd.set("longitude", String(pos.lng));
      fd.set("descriptor", JSON.stringify(descriptor));
      if (precomputedSamples && precomputedSamples.length >= 2) {
        fd.set("descriptors", JSON.stringify(precomputedSamples));
      }
      fd.set("face", file, file.name || "face.jpg");
      if (effectivePublicLocationId != null && effectivePublicLocationId > 0) {
        fd.set("locationId", String(effectivePublicLocationId));
      }
      const pubTid = props.sandboxTrialSessionId?.trim();
      if (pubTid) fd.set("trialSessionId", pubTid);
      if (kioskFaceOnly && facePunchIntent) fd.set("intent", facePunchIntent);
      const faceApi = kioskFaceOnly ? "/api/attendance/public/face-punch" : "/api/attendance/public/face-check-in";
      const res = await fetch(faceApi, {
        method: "POST",
        body: fd,
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        action?: "check_in" | "check_out";
        matched?: { displayName?: string };
      };
      if (!res.ok) {
        const apiErr = j.error ?? "บันทึกไม่สำเร็จ";
        if (kioskFaceOnly) {
          const fb = faceScanErrorFeedback(apiErr);
          setSuccessBanner(null);
          setFaceScanFeedback({
            variant: "error",
            intent: facePunchIntent ?? "check_in",
            title: fb.title,
            detail: fb.detail,
          });
          setErr(null);
        } else {
          setErr(apiErr);
        }
        if (kioskFaceOnly) void startFaceCamera();
        return;
      }
      clearFaceCapture();
      setDataConsent(kioskFaceOnly);
      setErr(null);
      setMsg(null);
      if (!kioskFaceOnly) {
        setPhone("");
        setGuestName("");
        setPublicFlow("pick");
        setGeo(initialAttendanceGeoState());
      } else {
        setPublicFlow("face");
      }
      const name = j.matched?.displayName?.trim();
      const action = j.action ?? "check_in";
      if (kioskFaceOnly) {
        const fb = faceScanSuccessFeedback(action, name);
        setFaceScanFeedback({
          variant: "success",
          intent: action,
          title: fb.title,
          detail: fb.detail,
        });
        setSuccessBanner(`${fb.title} · ${fb.detail}`);
      } else if (action === "check_out") {
        setSuccessBanner(name ? `เช็คออกแล้ว · ${name}` : "เช็คออกงานแล้ว (สแกนใบหน้า)");
      } else {
        setSuccessBanner(name ? `เช็คเข้าแล้ว · ${name}` : "เช็คเข้างานแล้ว (สแกนใบหน้า)");
      }
      if (kioskFaceOnly) {
        await startFaceCamera();
      } else {
        await loadStatePublic();
      }
      setTimeout(() => scrollToCheckStep1(), 120);
    } finally {
      setBusy(false);
    }
  }

  async function captureAndFaceCheckIn() {
    setErr(null);
    setMsg(null);
    setFaceScanFeedback(null);
    if (!cameraActive || !videoRef.current) {
      setErr("กำลังเปิดกล้อง — รอสักครู่แล้วลองใหม่");
      return;
    }
    setBusy(true);
    setMsg("จัดใบหน้าให้นิ่งในกรอบ…");
    try {
      for (let n = FACE_CAPTURE_COUNTDOWN_SEC; n >= 1; n--) {
        setFaceCaptureCountdown(n);
        await sleepMs(620);
      }
      setFaceCaptureCountdown(null);
      setMsg("กำลังถ่ายหลายเฟรมเพื่อความแม่นยำ…");
      const multi = await captureMultiFrameDescriptor(videoRef.current, { frames: 4, gapMs: 240 });
      if (!multi.ok) {
        const fb = faceScanErrorFeedback(multi.error);
        if (kioskFaceOnly) {
          setFaceScanFeedback({
            variant: "error",
            intent: facePunchIntent ?? "check_in",
            title: fb.title,
            detail: fb.detail,
          });
          setErr(null);
        } else {
          setErr(multi.error);
        }
        setMsg(null);
        return;
      }
      const file = await grabFaceBlobFromCamera();
      if (!file) {
        setErr("รอให้ภาพจากกล้องพร้อมแล้วลองอีกครั้ง");
        setMsg(null);
        return;
      }
      stopFaceStream();
      setCameraActive(false);
      setFaceFile(file);
      setDataConsent(true);
      await submitPublicFaceCheckIn(file, multi.descriptor, multi.samples);
    } finally {
      setFaceCaptureCountdown(null);
      setBusy(false);
    }
  }

  async function beginFaceCheckInFlow(intent: "check_in" | "check_out") {
    if (!kioskFaceOnly || !faceEnabled) return;
    setFacePunchIntent(intent);
    setPublicFlow("face");
    setErr(null);
    setMsg(null);
    setSuccessBanner(null);
    setFaceScanFeedback(null);
    setGuestName("");
    setPhone("");
    setDataConsent(true);
    clearFaceCapture();
    void preloadAttendanceFaceModels().catch(() => {});
    refreshGeo();
    await startFaceCamera();
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
        if (publicFlow === "face") {
          if (!faceFile) {
            setErr("ต้องสแกนใบหน้าก่อนเช็คเข้า");
            return;
          }
          await submitPublicFaceCheckIn(faceFile);
          return;
        } else {
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
          if (effectivePublicLocationId != null && effectivePublicLocationId > 0) {
            fd.set("locationId", String(effectivePublicLocationId));
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
        }
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
            ...(effectivePublicLocationId != null && effectivePublicLocationId > 0
              ? { locationId: effectivePublicLocationId }
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

  const showFaceCapture =
    !isPublic || publicFlow === "staff" || publicFlow === "external";
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

  const showAfterStep1 = !isPublic || (publicFlow !== "pick" && publicFlow !== "face");

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

  const kioskMainCentered =
    kioskFaceOnly && isPublic && (publicFlow === "pick" || publicFlow === "face");

  /** หน้าเช็คอินสาธารณะ — พื้นหลังเต็มจอ (body gradient) · คีออสก์จัดกลางจอ */
  const checkInPageShellClass = isPublic
    ? kioskFaceOnly
      ? attendanceKioskPageShellClass
      : "min-h-[100dvh] w-full"
    : "mx-auto min-h-[100dvh] max-w-md bg-gradient-to-b from-[#0000BF]/[0.03] via-white to-white px-4 pb-16 pt-6";

  const checkInPageInnerClass = isPublic
    ? kioskFaceOnly
      ? attendanceKioskPageInnerClass
      : "mx-auto w-full max-w-md px-4 pb-16 pt-6"
    : null;

  const kioskStepBox = kioskFaceOnly ? attendanceKioskStepBoxClass : stepBox;

  return (
    <div className={checkInPageShellClass}>
      <div className={checkInPageInnerClass ?? undefined}>
      {isPublic ? (
        <PublicCheckInHeader
          orgName={props.orgName}
          logoUrl={props.logoUrl}
          locationLabel={effectiveLocationLabel ?? null}
          compact={kioskFaceOnly}
        />
      ) : (
        <header className="rounded-2xl border border-[#e8e6fc] bg-white/90 px-4 py-4 text-center shadow-sm">
          <h1 className="text-lg font-black tracking-tight text-[#2e2a58] sm:text-xl">เช็คชื่อพนักงาน</h1>
          <p className="mt-1 text-xs text-[#66638c]">ตรวจสอบตัวตนด้วยรูปและตำแหน่ง ก่อนบันทึกเวลาเข้า-ออก</p>
        </header>
      )}

      {successBanner && !kioskMainCentered ? (
        <div
          className={cn(
            "mt-4 flex items-center gap-3 rounded-2xl border-[3px] px-4 py-3 text-white shadow-md",
            kioskFaceOnly && facePunchIntent === "check_out"
              ? "border-rose-300/70 bg-gradient-to-r from-rose-600 to-red-600 shadow-rose-900/15 ring-2 ring-rose-400/25"
              : "border-emerald-300/70 bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-900/10 ring-2 ring-emerald-400/25",
          )}
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

      {!kioskFaceOnly ? (
        <div className="mt-8 rounded-2xl border border-[#0000BF]/15 bg-white px-5 py-6 shadow-sm">
          <p className="text-center text-xs font-medium uppercase tracking-wider text-[#66638c]">เวลาปัจจุบัน</p>
          <p className="mt-2 text-center text-3xl font-bold tabular-nums text-[#2e2a58]">
            {now
              ? now.toLocaleTimeString("th-TH", {
                  timeZone: "Asia/Bangkok",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "--:--:--"}
          </p>
          <p className="mt-1 text-center text-sm text-[#66638c]">
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
      ) : null}

      <div className={cn(kioskMainCentered && attendanceKioskCenterShellClass)}>
        {successBanner && kioskMainCentered ? (
          <div
            className={cn(
              "flex w-full max-w-md items-center gap-3 rounded-2xl border-[3px] px-4 py-3 text-white shadow-md",
              facePunchIntent === "check_out"
                ? "border-rose-300/70 bg-gradient-to-r from-rose-600 to-red-600 shadow-rose-900/15 ring-2 ring-rose-400/25"
                : "border-emerald-300/70 bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-900/10 ring-2 ring-emerald-400/25",
            )}
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

        {kioskMainCentered && publicFlow === "pick" ? <KioskCompactClock now={now} /> : null}

        {kioskFaceOnly && kioskLocationPickOpen && kioskLocationChoices && kioskLocationChoices.length > 1 ? (
          <div className={cn(kioskStepBox, "w-full max-w-md")}>
            <p className="text-center text-sm font-black tracking-tight text-[#1e1b4b]">เลือกจุดเช็ค</p>
            <p className="mt-1 text-center text-xs font-medium text-[#66638c]">
              องค์กรมีหลายจุด — เลือกสาขาที่ติดตั้ง iPad นี้
            </p>
            <div className="mt-4 space-y-2">
              {kioskLocationChoices.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  disabled={kioskContextLoading}
                  onClick={() => void selectKioskLocation(loc.id)}
                  className="flex min-h-[52px] w-full items-center justify-center rounded-[1.25rem] border border-[#0000BF]/20 bg-white/90 px-4 text-sm font-bold text-[#2e2a58] shadow-sm transition hover:bg-white active:scale-[0.99] disabled:opacity-50"
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

      {isPublic ? (
        publicFlow === "pick" ? (
          <div className={kioskStepBox} id={CHECK_STEP_1_ANCHOR_ID}>
            {kioskFaceOnly ? (
              faceEnabled ? (
                kioskLocationPickOpen ? null : (
                  <>
                  <p className="text-center text-sm font-black tracking-tight text-[#1e1b4b]">
                    จุดเช็คอิน · สแกนใบหน้า
                  </p>
                  <p className="mt-1 text-center text-xs font-medium text-[#66638c]">
                    วาง iPad ไว้ที่จุดนี้ — กดปุ่มเข้าหรือออก แล้วสแกนใบหน้า
                  </p>
                  <div className="mt-4 space-y-2.5">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void beginFaceCheckInFlow("check_in")}
                      className="flex min-h-[76px] w-full flex-col items-center justify-center gap-1 rounded-[1.5rem] bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 px-4 py-4 text-white shadow-[0_20px_40px_-18px_rgba(16,185,129,0.55)] transition active:scale-[0.99] disabled:opacity-50"
                    >
                      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                        <circle cx="12" cy="9" r="3.2" />
                        <path d="M5.5 19c1.4-3 3.7-4.5 6.5-4.5s5.1 1.5 6.5 4.5" strokeLinecap="round" />
                        <path d="M12 5V3M12 3l2 2M12 3L10 5" strokeLinecap="round" />
                      </svg>
                      <span className="text-xl font-black tracking-tight">สแกนใบหน้าเช็คเข้า</span>
                      <span className="text-[11px] font-semibold text-white/85">ตอนมาเข้างาน</span>
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void beginFaceCheckInFlow("check_out")}
                      className="flex min-h-[76px] w-full flex-col items-center justify-center gap-1 rounded-[1.5rem] bg-gradient-to-br from-rose-600 via-red-600 to-red-700 px-4 py-4 text-white shadow-[0_20px_40px_-18px_rgba(225,29,72,0.5)] transition active:scale-[0.99] disabled:opacity-50"
                    >
                      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                        <circle cx="12" cy="9" r="3.2" />
                        <path d="M5.5 19c1.4-3 3.7-4.5 6.5-4.5s5.1 1.5 6.5 4.5" strokeLinecap="round" />
                        <path d="M12 19v2M12 21l2-2M12 21l-2-2" strokeLinecap="round" />
                      </svg>
                      <span className="text-xl font-black tracking-tight">สแกนใบหน้าเช็คออก</span>
                      <span className="text-[11px] font-semibold text-white/85">ตอนเลิกงาน</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setKioskGuideOpen(true)}
                    className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-[#0000BF]/20 bg-white/85 px-4 text-sm font-bold text-[#4d47b6] shadow-sm transition hover:bg-white active:scale-[0.99]"
                    aria-haspopup="dialog"
                    aria-expanded={kioskGuideOpen}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
                      <circle cx="12" cy="12" r="9" />
                      <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
                      <circle cx="12" cy="17" r="1" />
                    </svg>
                    คู่มือการทำงาน · วิธีสแกนให้ผ่าน
                  </button>
                  </>
                )
              ) : (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950">
                  ยังไม่ได้เปิดสแกนใบหน้าในตั้งค่า — ให้เจ้าของเปิด «เช็คอินด้วยสแกนใบหน้า» ก่อนใช้ลิงก์นี้
                </p>
              )
            ) : (
              <>
                <p className="text-sm font-semibold text-[#2e2a58]">ขั้นตอนที่ 1 · เลือกประเภทผู้เช็ค</p>
                <p className="mt-1 text-xs text-[#66638c]">เลือกว่าเป็นพนักงานหรือบุคคลภายนอก</p>
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
                    className="min-h-[52px] w-full rounded-2xl border-2 border-[#d8d6ec] bg-white py-3.5 text-base font-bold text-[#2e2a58]"
                  >
                    บุคคลภายนอก — กรอกข้อมูลอิสระ
                  </button>
                </div>
              </>
            )}
          </div>
        ) : publicFlow === "face" ? (
          <div className={kioskStepBox} id={CHECK_STEP_1_ANCHOR_ID}>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                clearFaceCapture();
                setFacePunchIntent(null);
                setPublicFlow("pick");
                setErr(null);
                setMsg(null);
                setSuccessBanner(null);
                setFaceScanFeedback(null);
                setDataConsent(false);
              }}
              className="text-xs font-bold text-[#0000BF] hover:underline disabled:opacity-50"
            >
              ← กลับหน้าจุดเช็ค
            </button>
            <p className="mt-2 text-center text-sm font-black text-[#1e1b4b]">
              {facePunchIntent === "check_out" ? "สแกนใบหน้าเช็คออก" : "สแกนใบหน้าเช็คเข้า"}
            </p>
            <p className="mt-1 text-center text-xs text-[#66638c]">
              {facePunchIntent === "check_out"
                ? "มองตรงกล้อง กดปุ่มแดง — ระบบนับถอยหลังแล้วถ่ายอัตโนมัติ"
                : "มองตรงกล้อง กดปุ่มเขียว — ระบบนับถอยหลังแล้วถ่ายอัตโนมัติ"}
            </p>

            <div className={attendanceFacePunchCameraShellClass(facePunchIntent, { kiosk: kioskFaceOnly })}>
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    className={attendanceFacePunchCameraVideoClass(facePunchIntent, { kiosk: kioskFaceOnly })}
                    playsInline
                    muted
                    autoPlay
                  />
                  {faceCaptureCountdown != null ? (
                    <div className="pointer-events-none absolute inset-2 flex items-center justify-center rounded-xl bg-black/25">
                      <span className="text-7xl font-black tabular-nums text-white drop-shadow-lg">
                        {faceCaptureCountdown}
                      </span>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className={attendanceFacePunchCameraPlaceholderClass(facePunchIntent, { kiosk: kioskFaceOnly })}>
                  {busy ? "กำลังระบุตัวตน…" : "กำลังเปิดกล้อง…"}
                </div>
              )}
            </div>

            {faceScanFeedback ? (
              <div className="mt-3">
                <FaceScanFeedback
                  variant={faceScanFeedback.variant}
                  intent={faceScanFeedback.intent}
                  title={faceScanFeedback.title}
                  detail={faceScanFeedback.detail}
                />
              </div>
            ) : null}

            <button
              type="button"
              disabled={busy || !cameraActive}
              onClick={() => void captureAndFaceCheckIn()}
              className={attendanceFacePunchActionButtonClass(facePunchIntent)}
            >
              {faceCaptureCountdown != null
                ? `เตรียมตัว… ${faceCaptureCountdown}`
                : busy
                  ? "กำลังบันทึก…"
                  : facePunchIntent === "check_out"
                    ? "เริ่มสแกนเช็คออก"
                    : "เริ่มสแกนเช็คเข้า"}
            </button>
            {!cameraActive && !busy ? (
              <button
                type="button"
                onClick={() => void startFaceCamera()}
                className="mt-2 w-full rounded-xl border border-[#d8d6ec] bg-white py-2.5 text-sm font-bold text-[#4d47b6]"
              >
                เปิดกล้องอีกครั้ง
              </button>
            ) : null}
            {!kioskFaceOnly ? (
              <p className="mt-3 text-[11px] leading-relaxed text-[#66638c]">
                การกดบันทึกถือว่ายินยอมให้เก็บพิกัด GPS รูปใบหน้า (ตอนเข้างาน) และเวลาเข้า-ออกตามนโยบายองค์กร
              </p>
            ) : null}
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
              <p className="min-w-0 flex-1 text-sm font-semibold text-[#2e2a58]">ขั้นตอนที่ 1 · เบอร์โทรและชื่อ</p>
              <StepDoneMark done={step1PublicFormDone} label="กรอกเบอร์และชื่อครบแล้ว" />
            </div>
            <p className="mt-1 text-xs text-[#66638c]">
              {openLog
                ? "เบอร์นี้มีการเช็คเข้าค้าง — ตรวจสอบรายละเอียดที่ขั้นตอนสุดท้าย แล้วดึง GPS ก่อนกดเช็คออก"
                : publicFlow === "staff"
                  ? "เบอร์ต้องตรงรายชื่อที่เจ้าของลงทะเบียน — กดค้นหาชื่อก่อนเช็คเข้า"
                  : "กรอกเบอร์และชื่อตามจริง — ไม่ต้องอยู่ในรายชื่อพนักงาน"}
            </p>
            <label className="mt-3 block text-xs font-semibold text-[#2e2a58]">
              เบอร์โทร
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                className="mt-1 w-full rounded-2xl border-2 border-[#e1e3ff] px-4 py-3 text-lg outline-none focus:border-[#0000BF]/40"
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
              <label className="mt-3 block text-xs font-semibold text-[#2e2a58]">
                {publicFlow === "staff" ? "ชื่อ (ดึงจากรายชื่อ หรือแก้ได้)" : "ชื่อ / หมายเหตุ (อิสระ)"}
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value.slice(0, 100))}
                  className="mt-1 w-full rounded-2xl border-2 border-[#e1e3ff] px-4 py-3 outline-none focus:border-[#0000BF]/40"
                  placeholder={publicFlow === "external" ? "เช่น คุณสมศรี — ผู้รับเหมา" : ""}
                />
              </label>
            ) : null}
          </div>
        )
      ) : (
        <div className={stepBox} id={CHECK_STEP_1_ANCHOR_ID}>
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 flex-1 text-sm font-semibold text-[#2e2a58]">ขั้นตอนที่ 1 · ตัวตนผู้เช็ค</p>
            <StepDoneMark done={step1SessionIdentityDone} label="ล็อกอินแล้ว" />
          </div>
          <p className="mt-1 text-xs text-[#66638c]">
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
              <p className="min-w-0 flex-1 text-sm font-semibold text-[#2e2a58]">
                {checkoutOnlyUi ? "ขั้นตอนที่ 2 · ดึงตำแหน่ง (เช็คออก)" : "ขั้นตอนที่ 2 · ดึงตำแหน่ง GPS"}
              </p>
              <StepDoneMark done={step2GpsDone} label="ตำแหน่งพร้อมแล้ว" />
            </div>
            <p className="mt-1 text-xs text-[#66638c]">
              {checkoutOnlyUi
                ? isPublic
                  ? "กดปุ่มเพื่อยืนยันตำแหน่งก่อนเช็คชื่อออก — ต้องอยู่ในจุดเช็คที่องค์กรกำหนด"
                  : "กดปุ่มเพื่อยืนยันตำแหน่งก่อนเช็คออก — ระบบจะส่งพิกัดอีกครั้งตอนกดเช็คออก"
                : isPublic
                  ? "กดปุ่มด้านล่างเพื่อตรวจว่าอยู่ในจุดเช็คอินที่องค์กรกำหนด"
                  : "กดปุ่มด้านล่างเพื่อยืนยันตำแหน่ง — ตอนกดเช็คเข้า/ออกระบบจะส่งพิกัดใหม่อีกครั้ง"}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-[#2e2a58]">
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
                  <p className="min-w-0 flex-1 text-sm font-semibold text-[#2e2a58]">
                    {publicFlow === "face" ? "ขั้นตอนที่ 3 · สแกนใบหน้าเช็คอิน" : "ขั้นตอนที่ 3 · ถ่ายรูปใบหน้า"}
                  </p>
                  <StepDoneMark done={step3FaceDone} label="ถ่ายรูปแล้ว" />
                </div>
                <p className="mt-1 text-xs text-[#66638c]">
                  {publicFlow === "face"
                    ? "เปิดกล้องหน้า จัดใบหน้ากลางเฟรม แล้วกดยืนยัน — ระบบจะจดจำและเทียบกับรายชื่อ"
                    : "ถ่ายจากกล้องเท่านั้น — เปิดกล้องหน้า แล้วกดยืนยันถ่ายรูป"}
                </p>
                {!facePreview ? (
                  cameraActive ? (
                    <div className={attendanceFacePunchCameraShellClass("check_in")}>
                      <video
                        ref={videoRef}
                        className={attendanceFacePunchCameraVideoClass("check_in")}
                        playsInline
                        muted
                        autoPlay
                      />
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={cancelFaceCamera}
                          className="flex-1 rounded-xl border border-[#d8d6ec] bg-white py-2.5 text-sm font-semibold text-[#2e2a58]"
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
                      className="mt-3 w-full rounded-2xl border-2 border-dashed border-[#0000BF]/40 bg-[#faf9ff] py-10 text-center"
                    >
                      <span className="text-sm font-bold text-[#0000BF]">เปิดกล้องถ่ายรูปใบหน้า</span>
                      <span className="mt-1 block text-xs text-[#66638c]">อนุญาตการใช้กล้องเมื่อเบราว์เซอร์ถาม</span>
                    </button>
                  )
                ) : (
                  <div className="mt-3 space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={facePreview} alt="" className="mx-auto max-h-56 w-full max-w-xs rounded-2xl border border-[#e8e6fc]/90 object-cover" />
                    <button
                      type="button"
                      onClick={clearFaceCapture}
                      className="w-full rounded-xl border border-[#e8e6fc]/90 bg-white py-2 text-sm font-semibold text-[#2e2a58]"
                    >
                      ถ่ายใหม่
                    </button>
                  </div>
                )}
              </div>

              <div className={stepBox}>
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 text-sm font-semibold text-[#2e2a58]">ขั้นตอนที่ 4 · ยินยอมให้เก็บข้อมูล</p>
                  <StepDoneMark done={step4ConsentDone} label="ยินยอมแล้ว" />
                </div>
                <p className="mt-1 text-xs text-[#66638c]">อ่านแล้วติ๊กยืนยันก่อนกดเข้างาน</p>
                <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-[#e8e6fc]/70 bg-[#faf9ff]/90 p-3">
                  <input
                    type="checkbox"
                    checked={dataConsent}
                    onChange={(e) => setDataConsent(e.target.checked)}
                    className="mt-1 h-5 w-5 shrink-0 rounded border-[#d8d6ec] text-[#0000BF] focus:ring-[#0000BF]/30"
                  />
                  <span className="text-sm leading-snug text-[#2e2a58]">
                    ข้าพเจ้ายินยอมให้เก็บพิกัด GPS รูปใบหน้า และบันทึกเวลาเข้า-ออกงาน เพื่อการเช็คชื่อและหลักฐานตามที่องค์กรกำหนด
                  </span>
                </label>
              </div>
            </>
          ) : null}

          {showFaceCapture ? (
            <div className={stepBox}>
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 text-sm font-semibold text-[#2e2a58]">
                  {checkoutOnlyUi ? "ขั้นตอนที่ 3 · เช็คชื่อออก" : "ขั้นตอนที่ 5 · บันทึกเวลาเข้า-ออก"}
                </p>
                <StepDoneMark
                  done={step5AttendanceDone}
                  label={openLog ? "เช็คเข้าแล้ววันนี้" : "บันทึกครบวันแล้ว"}
                />
              </div>
              <p className="mt-1 text-xs text-[#66638c]">
                {checkoutOnlyUi
                  ? isPublic
                    ? "ระบบดึงรายละเอียดการเข้างานแล้ว — กดเช็คชื่อออกเมื่อพร้อม (ต้องดึง GPS ในขั้นตอนที่ 2)"
                    : "ระบบดึงรายละเอียดการเข้างานแล้ว — กดเช็คชื่อออกเมื่อพร้อม"
                  : isPublic
                    ? "กรอกเบอร์ครบแล้วระบบจะดึงสถานะอัตโนมัติ — หากมีการเช็คเข้าในระบบจะแสดงรายละเอียดด้านล่างและให้กดเช็คชื่อออก"
                    : "ตรวจสอบสถานะวันนี้ แล้วกดปุ่มที่ต้องการ"}
              </p>
                <div className="mt-3 rounded-xl border border-[#e8e6fc]/70 bg-[#faf9ff]/90 px-3 py-3">
                  <p className="text-center text-xs font-semibold text-[#66638c]">สถานะวันนี้</p>
                  {openLog ? (
                    <div className="mt-3 space-y-3 text-left text-sm text-[#2e2a58]">
                      <p className="text-center text-sm font-semibold text-emerald-800">
                        พบบันทึกเช็คเข้าวันนี้ — ตรวจสอบรายละเอียดแล้วกดเช็คชื่อออก
                      </p>
                      <div className="space-y-2 rounded-xl border border-[#e8e6fc]/90 bg-white px-3 py-3 text-xs">
                        <div className="flex justify-between gap-2 border-b border-[#e8e6fc]/80 pb-2">
                          <span className="text-[#66638c]">เวลาเข้างาน</span>
                          <span className="text-right font-medium text-[#2e2a58]">{formatThDateTime(openLog.checkInTime)}</span>
                        </div>
                        <div className="flex justify-between gap-2 border-b border-[#e8e6fc]/80 pb-2">
                          <span className="text-[#66638c]">สถานะ</span>
                          <span className="text-right font-medium text-[#0000BF]">{statusTh[openLog.status] ?? openLog.status}</span>
                        </div>
                        {openLog.appliedShiftLabel ? (
                          <div className="flex justify-between gap-2 border-b border-[#e8e6fc]/80 pb-2">
                            <span className="text-[#66638c]">กะที่ใช้คำนวณ</span>
                            <span className="text-right font-medium text-[#2e2a58]">{openLog.appliedShiftLabel}</span>
                          </div>
                        ) : null}
                        {openLog.lateCheckIn ? (
                          <p className="text-amber-800">มาสาย (หลังเวลาเริ่มกะที่ระบบใช้)</p>
                        ) : null}
                        {isPublic ? (
                          <>
                            {openLog.guestPhone ? (
                              <div className="flex justify-between gap-2 border-b border-[#e8e6fc]/80 pb-2">
                                <span className="text-[#66638c]">เบอร์โทร</span>
                                <span className="text-right font-medium">{openLog.guestPhone}</span>
                              </div>
                            ) : null}
                            {openLog.guestName ? (
                              <div className="flex justify-between gap-2 border-b border-[#e8e6fc]/80 pb-2">
                                <span className="text-[#66638c]">ชื่อ</span>
                                <span className="text-right font-medium">{openLog.guestName}</span>
                              </div>
                            ) : null}
                            {openLog.publicVisitorKind ? (
                              <div className="flex justify-between gap-2 border-b border-[#e8e6fc]/80 pb-2">
                                <span className="text-[#66638c]">ประเภทผู้เช็ค</span>
                                <span className="text-right font-medium">
                                  {visitorKindTh[openLog.publicVisitorKind] ?? openLog.publicVisitorKind}
                                </span>
                              </div>
                            ) : null}
                          </>
                        ) : (
                          <div className="flex justify-between gap-2 border-b border-[#e8e6fc]/80 pb-2">
                            <span className="text-[#66638c]">ผู้เช็ค</span>
                            <span className="text-right font-medium">
                              {openLog.actorFullName?.trim() ||
                                openLog.actorUsername ||
                                openLog.actorEmail ||
                                "—"}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between gap-2 border-b border-[#e8e6fc]/80 pb-2">
                          <span className="text-[#66638c]">พิกัดตอนเข้า (lat, lng)</span>
                          <span className="max-w-[55%] text-right font-mono text-[11px] text-[#2e2a58]">
                            {formatCoord(openLog.checkInLat)}, {formatCoord(openLog.checkInLng)}
                          </span>
                        </div>
                        {openLog.note?.trim() ? (
                          <div className="pt-1">
                            <span className="text-[#66638c]">หมายเหตุ</span>
                            <p className="mt-1 text-[#2e2a58]">{openLog.note.trim()}</p>
                          </div>
                        ) : null}
                        {openLog.checkInFacePhotoUrl ? (
                          <div className="pt-2">
                            <span className="text-[#66638c]">รูปใบหน้าตอนเข้า</span>
                            <div className="mt-2 flex justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={openLog.checkInFacePhotoUrl}
                                alt="รูปตอนเช็คเข้า"
                                className="max-h-48 max-w-full rounded-xl border border-[#e8e6fc]/90 object-contain"
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : todayLatest?.checkOutTime ? (
                    <div className="mt-2 text-center text-sm text-[#2e2a58]">
                      <p>เช็คครบวันแล้ว</p>
                      <p className="mt-1 text-xs text-[#66638c]">{statusTh[todayLatest.status] ?? todayLatest.status}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-center text-sm text-[#66638c]">ยังไม่ได้เช็คเข้าวันนี้</p>
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
                  className="min-h-[52px] w-full rounded-2xl border-2 border-[#2e2a58]/35 bg-white py-3.5 text-base font-bold text-[#2e2a58] disabled:opacity-45"
                >
                  เช็คชื่อออกงาน
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      </div>

      {schemaSyncWarning && !kioskFaceOnly ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm text-amber-950">
          {schemaSyncWarning}
        </p>
      ) : null}
      {err && !(kioskFaceOnly && (publicFlow === "face" || kioskMainCentered)) ? (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-800">{err}</p>
      ) : null}
      {msg && !(kioskFaceOnly && kioskMainCentered) ? (
        <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-900">{msg}</p>
      ) : null}

      {kioskFaceOnly ? (
        <AttendanceFaceKioskGuideModal open={kioskGuideOpen} onClose={() => setKioskGuideOpen(false)} />
      ) : null}
      </div>
    </div>
  );
}
