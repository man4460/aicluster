"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppPublicCheckInGlassPage } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { isTerminalLaundryOrderStatus } from "@/systems/laundry/laundry-order-status";

const TRACK_STORE_PREFIX = "laundryPickupTrack:v1:";

function trackStorageKey(ownerId: string): string {
  return `${TRACK_STORE_PREFIX}${ownerId}`;
}

/** รูปแบบ UUID (เช่น จาก `crypto.randomUUID()`) */
function looksLikeUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.trim());
}

type PublicPickupTrackPayload = {
  ok?: boolean;
  order_id?: number;
  status?: string;
  status_label_th?: string;
  order_at?: string;
  updated_at?: string;
  service_type?: string;
  package_name?: string;
  final_price?: number;
  error?: string;
};

type Step = "package" | "contact" | "location";

type PublicPackage = {
  id: number;
  name: string;
  base_price: number;
  description: string;
  image_url: string | null;
  basket_tiers: { label: string; price: number }[] | null;
};

function priceHint(pkg: PublicPackage): string {
  const tiers = pkg.basket_tiers?.filter((t) => t.label.trim()) ?? [];
  if (tiers.length) {
    const prices = tiers.map((t) => t.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `฿${min.toLocaleString("th-TH")}` : `฿${min.toLocaleString("th-TH")} – ฿${max.toLocaleString("th-TH")}`;
  }
  return `฿${pkg.base_price.toLocaleString("th-TH")}`;
}

function IconCheck(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={props.className} aria-hidden>
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function buildPickupAddress(coords: { lat: number; lng: number } | null, detail: string): string {
  const lines: string[] = [];
  if (coords) {
    lines.push(`พิกัด GPS: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
  }
  const d = detail.trim();
  if (d) lines.push(d);
  return lines.join("\n").slice(0, 500);
}

function mapsLink(coords: { lat: number; lng: number }): string {
  return `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
}

export function LaundryPickupPublicClient({
  ownerId,
  shopLabel,
}: {
  ownerId: string;
  shopLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trialParam = searchParams.get("t");

  const [step, setStep] = useState<Step>("package");
  const [packages, setPackages] = useState<PublicPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);

  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [tierIndex, setTierIndex] = useState<number | null>(null);

  const [customer_name, setCustomerName] = useState("");
  const [customer_phone, setCustomerPhone] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDetail, setLocationDetail] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [dropoff_address, setDropoffAddress] = useState("");
  const [preferred_pickup_note, setPreferredPickupNote] = useState("");
  const [estimated_weight_kg, setEstimatedWeightKg] = useState("");
  const [estimated_item_count, setEstimatedItemCount] = useState("");
  const [extra_note, setExtraNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);

  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<PublicPickupTrackPayload | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [copyTrackHint, setCopyTrackHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPackagesLoading(true);
      setPackagesError(null);
      try {
        const res = await fetch(`/api/laundry/public/packages?owner_id=${encodeURIComponent(ownerId)}`);
        const data = (await res.json()) as { packages?: PublicPackage[]; error?: string };
        if (!res.ok) {
          if (!cancelled) setPackagesError(data.error ?? "โหลดแพ็กเกจไม่สำเร็จ");
          return;
        }
        if (!cancelled) setPackages(data.packages ?? []);
      } catch {
        if (!cancelled) setPackagesError("เชื่อมต่อไม่ได้");
      } finally {
        if (!cancelled) setPackagesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  useEffect(() => {
    const fromUrl = searchParams.get("track")?.trim() ?? "";
    if (fromUrl && looksLikeUuid(fromUrl)) {
      setTrackingToken(fromUrl);
      try {
        sessionStorage.setItem(trackStorageKey(ownerId), JSON.stringify({ token: fromUrl }));
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      const raw = sessionStorage.getItem(trackStorageKey(ownerId));
      if (!raw) return;
      const j = JSON.parse(raw) as { token?: unknown };
      if (typeof j.token === "string" && looksLikeUuid(j.token)) {
        setTrackingToken(j.token);
      }
    } catch {
      /* ignore */
    }
  }, [ownerId, searchParams]);

  const fetchTracking = useCallback(async () => {
    if (!trackingToken) return;
    setTrackingLoading(true);
    setTrackingError(null);
    try {
      const res = await fetch(
        `/api/laundry/public/pickup-status?owner_id=${encodeURIComponent(ownerId)}&token=${encodeURIComponent(trackingToken)}`,
      );
      const data = (await res.json()) as PublicPickupTrackPayload;
      if (!res.ok) {
        setTrackingError(data.error ?? "โหลดสถานะไม่สำเร็จ");
        setTrackingInfo(null);
        return;
      }
      setTrackingInfo(data);
    } catch {
      setTrackingError("เชื่อมต่อไม่ได้");
      setTrackingInfo(null);
    } finally {
      setTrackingLoading(false);
    }
  }, [ownerId, trackingToken]);

  useEffect(() => {
    if (!trackingToken) {
      setTrackingInfo(null);
      setTrackingError(null);
      return;
    }
    void fetchTracking();
    const id = window.setInterval(() => void fetchTracking(), 30_000);
    const onVis = () => {
      if (document.visibilityState === "visible") void fetchTracking();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [trackingToken, fetchTracking]);

  /** มีคำขอที่ยังดำเนินการ — ซ่อนการเลือกแพ็กเกจจนกว่าสถานะจะเป็น COMPLETED / CANCELLED (โหลดซ้ำในเบื้องหลังไม่ใช้ trackingLoading เพื่อไม่ให้การ์ดกระพริบ) */
  const blocksPackageSelection = useMemo(() => {
    if (!trackingToken || trackingError) return false;
    if (trackingInfo == null) return trackingLoading;
    return !isTerminalLaundryOrderStatus(trackingInfo.status);
  }, [trackingError, trackingInfo, trackingLoading, trackingToken]);

  useEffect(() => {
    if (blocksPackageSelection && step !== "package") {
      setStep("package");
    }
  }, [blocksPackageSelection, step]);

  const dismissTracking = useCallback(() => {
    setTrackingToken(null);
    setTrackingInfo(null);
    setTrackingError(null);
    setCopyTrackHint(null);
    try {
      sessionStorage.removeItem(trackStorageKey(ownerId));
    } catch {
      /* ignore */
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete("track");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [ownerId, pathname, router, searchParams]);

  const copyTrackingLink = useCallback(async () => {
    if (!trackingToken || typeof window === "undefined") return;
    setCopyTrackHint(null);
    const params = new URLSearchParams();
    params.set("track", trackingToken);
    if (trialParam) params.set("t", trialParam);
    const url = `${window.location.origin}${pathname}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyTrackHint("คัดลอกลิงก์ติดตามแล้ว — เปิดลิงก์นี้ภายหลังเพื่อดูสถานะ");
      window.setTimeout(() => setCopyTrackHint(null), 3200);
    } catch {
      setCopyTrackHint("คัดลอกอัตโนมัติไม่ได้ — ลองเลือกและคัดลอกจากแถบที่อยู่");
    }
  }, [pathname, trackingToken, trialParam]);

  const selectedPkg = useMemo(
    () => (selectedPackageId != null ? packages.find((p) => p.id === selectedPackageId) ?? null : null),
    [packages, selectedPackageId],
  );

  const tiers = useMemo(
    () => selectedPkg?.basket_tiers?.filter((t) => t.label.trim()) ?? [],
    [selectedPkg],
  );

  const resolvedPrice = useMemo(() => {
    if (!selectedPkg) return 0;
    if (tiers.length && tierIndex != null && tiers[tierIndex]) return tiers[tierIndex].price;
    return selectedPkg.base_price;
  }, [selectedPkg, tierIndex, tiers]);

  const pickup_address = useMemo(() => buildPickupAddress(coords, locationDetail), [coords, locationDetail]);

  const canProceedPackage = selectedPkg != null && (tiers.length === 0 || tierIndex != null);
  const canProceedContact = customer_name.trim().length > 0 && customer_phone.trim().length > 0;
  const hasLocation = coords != null || locationDetail.trim().length > 0;

  function selectPackage(p: PublicPackage) {
    setSelectedPackageId(p.id);
    const list = p.basket_tiers?.filter((t) => t.label.trim()) ?? [];
    setTierIndex(list.length > 0 ? 0 : null);
  }

  const fetchGeo = useCallback(() => {
    setGeoError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง — กรอกรายละเอียดสถานที่ด้านล่างแทน");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGeoLoading(false);
      },
      () => {
        setGeoError("ดึงพิกัดไม่ได้ — ตรวจสอบว่าเปิดการเข้าถึงตำแหน่งแล้ว หรือกรอกที่อยู่/จุดสังเกตด้านล่าง");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 18_000, maximumAge: 60_000 },
    );
  }, []);

  const submit = useCallback(async () => {
    setError(null);
    setDoneMsg(null);
    if (!selectedPkg || !canProceedPackage) {
      setError("กรุณาเลือกแพ็กเกจ");
      return;
    }
    if (!customer_name.trim() || !customer_phone.trim()) {
      setError("กรุณากรอกชื่อและเบอร์โทร");
      return;
    }
    if (!hasLocation) {
      setError("กดดึงพิกัดจากเครื่อง หรือกรอกรายละเอียดสถานที่รับผ้า");
      return;
    }
    const addr = pickup_address.trim();
    if (!addr) {
      setError("ข้อมูลที่อยู่รับผ้าไม่ครบ");
      return;
    }
    const w = estimated_weight_kg.trim() === "" ? undefined : Number(estimated_weight_kg);
    const ic = estimated_item_count.trim() === "" ? undefined : Number.parseInt(estimated_item_count, 10);
    if (w !== undefined && (!Number.isFinite(w) || w < 0)) {
      setError("น้ำหนักประมาณการไม่ถูกต้อง");
      return;
    }
    if (ic !== undefined && (!Number.isFinite(ic) || ic < 0)) {
      setError("จำนวนชิ้นประมาณการไม่ถูกต้อง");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        owner_id: ownerId,
        package_id: selectedPkg.id,
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        pickup_address: addr,
        dropoff_address: dropoff_address.trim() || undefined,
        preferred_pickup_note: preferred_pickup_note.trim() || undefined,
        estimated_weight_kg: w,
        estimated_item_count: ic,
        extra_note: extra_note.trim() || undefined,
      };
      if (tiers.length > 0 && tierIndex != null) {
        body.basket_tier_index = tierIndex;
      }

      const res = await fetch("/api/laundry/public/pickup-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        tracking_token?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "ส่งคำขอไม่สำเร็จ");
        return;
      }
      setDoneMsg(data.message ?? "ส่งคำขอแล้ว");
      if (data.tracking_token && looksLikeUuid(data.tracking_token)) {
        setTrackingToken(data.tracking_token);
        try {
          sessionStorage.setItem(trackStorageKey(ownerId), JSON.stringify({ token: data.tracking_token }));
        } catch {
          /* ignore */
        }
        const params = new URLSearchParams(searchParams.toString());
        params.set("track", data.tracking_token);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
      setStep("package");
      setSelectedPackageId(null);
      setTierIndex(null);
      setCustomerName("");
      setCustomerPhone("");
      setCoords(null);
      setLocationDetail("");
      setDropoffAddress("");
      setPreferredPickupNote("");
      setEstimatedWeightKg("");
      setEstimatedItemCount("");
      setExtraNote("");
      setGeoError(null);
      router.refresh();
    } catch {
      setError("เชื่อมต่อไม่ได้ ลองใหม่ภายหลัง");
    } finally {
      setLoading(false);
    }
  }, [
    canProceedPackage,
    customer_name,
    customer_phone,
    dropoff_address,
    estimated_weight_kg,
    estimated_item_count,
    extra_note,
    hasLocation,
    ownerId,
    pickup_address,
    preferred_pickup_note,
    router,
    pathname,
    searchParams,
    selectedPkg,
    tierIndex,
    tiers.length,
  ]);

  const inputClass =
    "app-input mt-2 w-full min-h-[52px] rounded-2xl px-4 py-3 text-base font-semibold text-[#1e1b4b] placeholder:text-slate-400";
  const labelClass = "block text-sm font-bold text-[#4d47b6]";

  const stepTitle =
    blocksPackageSelection ? "คำขอรับผ้าที่ยังดำเนินการ — ดูสถานะด้านบน"
    : step === "package" ? "ขั้นตอนที่ 1 — เลือกแพ็กเกจ"
    : step === "contact" ? "ขั้นตอนที่ 2 — ชื่อและเบอร์โทร"
    : "ขั้นตอนที่ 3 — พิกัดและจุดรับผ้า";

  return (
    <AppPublicCheckInGlassPage className="flex min-h-[100dvh] flex-col pb-0">
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col">
      <header className="shrink-0 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-center">
        <div
          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/70 bg-gradient-to-br from-white/80 to-violet-100/60 shadow-[0_8px_24px_-8px_rgba(91,97,255,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/70"
          aria-hidden
        >
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7 text-[#5b61ff]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 7h16v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
            <path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
            <path d="M8 3h8" />
            <circle cx="12" cy="13.5" r="3.25" />
          </svg>
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-500">รับฝากซักผ้า</p>
        <h1 className="mt-1 text-xl font-black leading-tight tracking-tight text-[#1e1b4b] sm:text-2xl">{shopLabel}</h1>
        <p className="mt-2 text-sm leading-snug text-[#6b6894]">{stepTitle}</p>
        {trialParam ?
          <p className="mx-auto mt-3 max-w-md rounded-2xl border border-amber-200 bg-amber-50/95 px-3 py-2 text-xs font-semibold text-amber-950">
            โหมดทดลองร้าน — ข้อมูลจะอยู่ในชุดทดลองของร้าน
          </p>
        : null}
        {doneMsg ?
          <p className="mx-auto mt-3 max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
            {doneMsg}
          </p>
        : null}
        {trackingToken ?
          <section
            className="mx-auto mt-3 w-full max-w-md rounded-2xl border border-indigo-200/90 bg-white/95 px-4 py-3 text-left shadow-md shadow-indigo-950/5"
            aria-label="ติดตามสถานะคำขอรับผ้า"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">ติดตามคำขอ</p>
                {trackingInfo?.order_id != null ?
                  <p className="mt-1 truncate text-sm font-bold text-[#1e1b4b]">เลขอ้างอิง #{trackingInfo.order_id}</p>
                : trackingLoading ?
                  <p className="mt-1 text-sm text-slate-600">กำลังโหลดสถานะ…</p>
                : null}
              </div>
              <button
                type="button"
                onClick={() => dismissTracking()}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 underline decoration-slate-300"
              >
                ปิด
              </button>
            </div>
            {trackingInfo?.status_label_th ?
              <>
                <p className="mt-3 text-lg font-black leading-snug text-indigo-700">{trackingInfo.status_label_th}</p>
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  {(trackingInfo.service_type?.trim() || trackingInfo.package_name?.trim() || "—") +
                    (trackingInfo.final_price != null && trackingInfo.final_price > 0 ?
                      ` · ฿${trackingInfo.final_price.toLocaleString("th-TH")}`
                    : "")}
                </p>
                {trackingInfo.updated_at ?
                  <p className="mt-2 text-[11px] font-medium text-slate-500">
                    อัปเดตล่าสุด{" "}
                    {new Date(trackingInfo.updated_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                : null}
              </>
            : null}
            {trackingError ?
              <p className="mt-2 text-xs font-semibold text-red-700">{trackingError}</p>
            : null}
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                disabled={trackingLoading}
                onClick={() => void fetchTracking()}
                aria-label={trackingLoading ? "กำลังรีเฟรชสถานะ" : "รีเฟรชสถานะ"}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200/90 bg-indigo-50/90 text-indigo-800 shadow-sm transition hover:bg-indigo-100/90 disabled:opacity-60"
              >
                {trackingLoading ?
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" aria-hidden />
                : <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                    <path d="M20 11a8 8 0 1 0-2.3 5.6M20 4v7h-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
              </button>
              <button
                type="button"
                onClick={() => void copyTrackingLink()}
                aria-label="คัดลอกลิงก์ติดตาม"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white/90 text-[#4d47b6] shadow-sm transition hover:bg-white"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              </button>
            </div>
            {copyTrackHint ?
              <p className="mt-2 text-[11px] font-semibold leading-snug text-emerald-800">{copyTrackHint}</p>
            : null}
            <p className="mt-2 text-[10px] leading-snug text-slate-500">
              สถานะจะเปลี่ยนตามที่ร้านอัปเดตในระบบ — เปิดหน้านี้ค้างไว้หรือบันทึกลิงก์เพื่อตรวจสอบภายหลัง (รีเฟรชอัตโนมัติทุก 30 วินาที)
            </p>
          </section>
        : null}
        {error ?
          <p className="mx-auto mt-3 max-w-md rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">{error}</p>
        : null}
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-28">
        {step === "package" ?
          <section className="mx-auto max-w-md" aria-labelledby="pickup-step-package">
            <h2 id="pickup-step-package" className="sr-only">
              {blocksPackageSelection ? "แพ็กเกจปิดชั่วคราว — มีคำขอที่ยังดำเนินการ" : "เลือกแพ็กเกจ"}
            </h2>
            {blocksPackageSelection ?
              <div
                className="rounded-2xl border border-indigo-200/90 bg-indigo-50/70 px-4 py-8 text-center shadow-inner shadow-indigo-950/5"
                role="status"
              >
                <p className="text-sm font-black leading-snug text-[#1e1b4b]">แพ็กเกจจะแสดงอีกครั้งเมื่อคำขอนี้จบ</p>
                <p className="mt-3 text-xs font-semibold leading-relaxed text-[#4d47b6]">
                  กล่อง<strong className="font-black"> ติดตามคำขอ </strong>ด้านบนจะอัปเดตตามร้าน เมื่อสถานะเป็น
                  <span className="whitespace-nowrap font-bold"> ส่งคืนสำเร็จ </span>
                  หรือ<span className="whitespace-nowrap font-bold"> ยกเลิก </span>
                  แล้ว คุณจะเลือกแพ็กเกจเพื่อส่งคำขอใหม่ได้
                </p>
              </div>
            : <>
                <p className="mb-4 text-center text-xs font-medium text-slate-600">แตะการ์ดเลือกแพ็กเกจ — เหมือนตอนพนักงานบันทึกที่ร้าน</p>
                {packagesLoading ?
                  <p className="rounded-2xl border border-indigo-100 bg-white/70 py-10 text-center text-sm font-medium text-slate-600">กำลังโหลดแพ็กเกจ…</p>
                : packagesError ?
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm font-semibold text-red-900">{packagesError}</p>
                : packages.length === 0 ?
                  <p className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/60 px-4 py-8 text-center text-sm font-semibold text-[#4d47b6]">
                    ร้านยังไม่มีแพ็กเกจที่เปิดให้เลือก — โปรดติดต่อร้านโดยตรง
                  </p>
                : <>
                    <div className="grid max-h-[min(58vh,520px)] grid-cols-1 gap-3 overflow-y-auto pb-2">
                      {packages.map((p) => {
                        const selected = selectedPackageId === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => selectPackage(p)}
                            className={cn(
                              "relative flex w-full flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200",
                              selected ?
                                "border-indigo-400 bg-indigo-50/90 shadow-[0_0_0_1px_rgba(99,102,241,0.35)] ring-2 ring-indigo-200/80"
                              : "border-slate-200/90 bg-white shadow-sm hover:border-indigo-200 hover:shadow-md",
                            )}
                          >
                            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                              {p.image_url ?
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                              : <div className="flex h-full w-full items-center justify-center text-slate-400">
                                  <svg viewBox="0 0 24 24" className="h-12 w-12 opacity-35" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" strokeLinecap="round" />
                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                  </svg>
                                </div>
                              }
                              {selected ?
                                <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/25 backdrop-blur-[2px]">
                                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg ring-2 ring-white/60">
                                    <IconCheck className="h-5 w-5" />
                                  </div>
                                </div>
                              : null}
                            </div>
                            <div className="space-y-1 p-3">
                              <p className="line-clamp-2 text-sm font-black text-[#2e2a58]">{p.name}</p>
                              <p className="text-xs font-bold text-indigo-600">{priceHint(p)}</p>
                              {p.description ?
                                <p className="line-clamp-2 text-[11px] leading-snug text-[#66638c]">{p.description}</p>
                              : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {selectedPkg && tiers.length > 0 ?
                      <div className="mt-4 rounded-2xl border border-[#ecebff] bg-[#f8f7ff] p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#66638c]">เลือกขนาดตะกร้า / ราคา</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {tiers.map((t, i) => (
                            <button
                              key={`${t.label}-${i}`}
                              type="button"
                              onClick={() => setTierIndex(i)}
                              className={cn(
                                "min-h-[44px] rounded-xl border px-3 py-2 text-left text-xs font-bold transition-all",
                                tierIndex === i ?
                                  "border-indigo-400 bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                                : "border-transparent bg-white/70 text-[#2e2a58] hover:border-indigo-200",
                              )}
                            >
                              <span className="block">{t.label}</span>
                              <span className="text-[11px] font-black text-indigo-600">฿{t.price.toLocaleString("th-TH")}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    : null}
                  </>
                }
              </>
            }
          </section>
        : step === "contact" ?
          <section
            className="mx-auto max-w-md rounded-[1.75rem] border border-white/70 bg-white/75 p-4 shadow-xl shadow-indigo-950/10 backdrop-blur-xl sm:p-5"
            aria-labelledby="pickup-step-contact"
          >
            <button
              type="button"
              onClick={() => {
                setError(null);
                setDoneMsg(null);
                setStep("package");
              }}
              className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/80 px-3 py-2 text-sm font-bold text-[#4d47b6] shadow-sm active:scale-[0.99]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              แก้แพ็กเกจ
            </button>
            {selectedPkg ?
              <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 px-3 py-2 text-sm font-bold text-[#2e2a58]">
                <span>{selectedPkg.name}</span>
                {tiers.length > 0 && tierIndex != null && tiers[tierIndex] ?
                  <span className="font-semibold text-[#66638c]">
                    {" "}
                    · {tiers[tierIndex].label} · ฿{tiers[tierIndex].price.toLocaleString("th-TH")}
                  </span>
                : <span className="font-semibold text-[#66638c]"> · ฿{resolvedPrice.toLocaleString("th-TH")}</span>}
              </div>
            : null}
            <h2 id="pickup-step-contact" className="sr-only">
              ข้อมูลติดต่อ
            </h2>
            <label className={labelClass}>
              ชื่อ–นามสกุล <span className="text-rose-600">*</span>
              <input
                className={inputClass}
                placeholder="เช่น สมชาย ใจดี"
                value={customer_name}
                onChange={(e) => setCustomerName(e.target.value)}
                autoComplete="name"
                autoCapitalize="words"
              />
            </label>
            <label className={cn(labelClass, "mt-5 block")}>
              เบอร์โทรติดต่อ <span className="text-rose-600">*</span>
              <input
                className={inputClass}
                placeholder="เช่น 0812345678"
                value={customer_phone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
          </section>
        : <div className="mx-auto max-w-md space-y-4">
            <button
              type="button"
              onClick={() => setStep("contact")}
              className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/80 px-3 py-2 text-sm font-bold text-[#4d47b6] shadow-sm backdrop-blur-sm active:scale-[0.99]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              แก้ชื่อหรือเบอร์
            </button>
            {selectedPkg ?
              <p className="rounded-2xl border border-violet-100 bg-violet-50/40 px-4 py-2 text-center text-xs font-bold text-[#2e2a58]">
                {selectedPkg.name}
                {tiers.length > 0 && tierIndex != null && tiers[tierIndex] ?
                  <span className="text-[#66638c]"> · {tiers[tierIndex].label} · ฿{tiers[tierIndex].price.toLocaleString("th-TH")}</span>
                : <span className="text-[#66638c]"> · ฿{resolvedPrice.toLocaleString("th-TH")}</span>}
              </p>
            : null}
            <p className="rounded-2xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-center text-sm font-bold text-[#2e2a58]">
              {customer_name.trim() || "—"}{" "}
              <span className="font-semibold text-[#66638c]">·</span> {customer_phone.trim() || "—"}
            </p>

            <section
              className="rounded-[1.75rem] border border-white/70 bg-white/75 p-4 shadow-xl shadow-indigo-950/10 backdrop-blur-xl sm:p-5"
              aria-labelledby="pickup-step-location"
            >
              <h2 id="pickup-step-location" className="text-base font-black text-[#1e1b4b]">
                พิกัดรับผ้า
              </h2>
              <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">
                แนะนำให้กดดึงพิกัดจากเครื่อง แล้วเติมบ้านเลขที่ ซอย หรือจุดสังเกตเพิ่ม
              </p>

              <button
                type="button"
                disabled={geoLoading}
                onClick={() => void fetchGeo()}
                className="app-btn-primary mt-4 flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl text-base font-bold shadow-lg shadow-indigo-200/60 disabled:opacity-60"
              >
                {geoLoading ?
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
                    กำลังดึงพิกัด…
                  </>
                : <>
                    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                      <path d="M12 21c-3.314 0-6-2.686-6-6 0-4.5 6-10 6-10s6 5.5 6 10c0 3.314-2.686 6-6 6z" strokeLinejoin="round" />
                      <circle cx="12" cy="15" r="2.5" />
                    </svg>
                    ดึงพิกัดจากเครื่อง
                  </>
                }
              </button>

              {geoError ?
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950">{geoError}</p>
              : null}

              {coords ?
                <div className="mt-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">พิกัดที่ได้รับ</p>
                  <p className="mt-2 font-mono text-sm font-bold text-emerald-950">
                    {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                  </p>
                  <a
                    href={mapsLink(coords)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 text-sm font-bold text-emerald-800"
                  >
                    เปิดใน Google Maps
                  </a>
                </div>
              : null}

              <label className={cn(labelClass, "mt-6 block")}>
                รายละเอียดสถานที่ <span className="font-semibold text-slate-500">(บ้านเลขที่ ซอย ป้อมรปภ. ฯลฯ)</span>
                {!coords ?
                  <span className="text-rose-600"> *</span>
                : null}
                <textarea
                  className={cn(inputClass, "min-h-[100px] resize-y py-3")}
                  placeholder={
                    coords ?
                      "เพิ่มจุดสังเกตให้พนักงานหาง่าย…"
                    : "ระบุที่อยู่หรือจุดสังเกต — จำเป็นหากยังไม่ดึงพิกัด"
                  }
                  value={locationDetail}
                  onChange={(e) => setLocationDetail(e.target.value)}
                />
              </label>
              {!hasLocation ?
                <p className="mt-2 text-xs font-semibold text-rose-600">ต้องมีพิกัดจากเครื่อง หรือรายละเอียดสถานที่อย่างใดอย่างหนึ่ง</p>
              : null}

              <details className="group mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 open:bg-white/80">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-[#4d47b6] [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-2">
                    ข้อมูลเพิ่มเติม <span className="text-xs font-semibold text-slate-500">ไม่บังคับ</span>
                  </span>
                </summary>
                <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-3">
                  <label className={cn(labelClass, "text-[#66638c]")}>
                    ที่อยู่ส่งคืน
                    <textarea
                      className={cn(inputClass, "min-h-[72px] text-sm")}
                      placeholder="ว่าง = ใช้ที่อยู่รับผ้าเดียวกัน"
                      value={dropoff_address}
                      onChange={(e) => setDropoffAddress(e.target.value)}
                    />
                  </label>
                  <label className={cn(labelClass, "text-[#66638c]")}>
                    ช่วงเวลาที่สะดวกให้ไปรับ
                    <textarea
                      className={cn(inputClass, "min-h-[72px] text-sm")}
                      placeholder="เช่น เสาร์ 9:00–12:00"
                      value={preferred_pickup_note}
                      onChange={(e) => setPreferredPickupNote(e.target.value)}
                    />
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    <label className={cn(labelClass, "text-[#66638c]")}>
                      น้ำหนักโดยประมาณ (กก.)
                      <input
                        className={cn(inputClass, "min-h-[48px] text-sm")}
                        type="number"
                        min={0}
                        step={0.1}
                        placeholder="—"
                        value={estimated_weight_kg}
                        onChange={(e) => setEstimatedWeightKg(e.target.value)}
                      />
                    </label>
                    <label className={cn(labelClass, "text-[#66638c]")}>
                      จำนวนชิ้นโดยประมาณ
                      <input
                        className={cn(inputClass, "min-h-[48px] text-sm")}
                        type="number"
                        min={0}
                        placeholder="—"
                        value={estimated_item_count}
                        onChange={(e) => setEstimatedItemCount(e.target.value)}
                      />
                    </label>
                  </div>
                  <label className={cn(labelClass, "text-[#66638c]")}>
                    หมายเหตุอื่น ๆ
                    <textarea
                      className={cn(inputClass, "min-h-[72px] text-sm")}
                      placeholder="ประเภทผ้า รหัสประตู ฯลฯ"
                      value={extra_note}
                      onChange={(e) => setExtraNote(e.target.value)}
                    />
                  </label>
                </div>
              </details>
            </section>
          </div>
        }
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-10 border-t border-white/50 bg-white/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_-12px_rgba(30,27,75,0.2)] backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg flex-col gap-2">
          {step === "package" ?
            <button
              type="button"
              disabled={blocksPackageSelection || !canProceedPackage || packages.length === 0}
              onClick={() => {
                setError(null);
                setDoneMsg(null);
                setStep("contact");
              }}
              aria-label="ถัดไป — ข้อมูลติดต่อ"
              className="app-btn-primary flex min-h-[54px] w-full items-center justify-center rounded-2xl shadow-lg shadow-indigo-200/70 disabled:opacity-45"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          : step === "contact" ?
            <button
              type="button"
              disabled={!canProceedContact}
              onClick={() => {
                setError(null);
                setDoneMsg(null);
                setStep("location");
              }}
              aria-label="ถัดไป — พิกัดรับผ้า"
              className="app-btn-primary flex min-h-[54px] w-full items-center justify-center rounded-2xl shadow-lg shadow-indigo-200/70 disabled:opacity-45"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          : <button
              type="button"
              disabled={loading || !hasLocation}
              onClick={() => void submit()}
              aria-label={loading ? "กำลังส่งคำขอ" : "ส่งคำขอรับผ้า"}
              className="app-btn-primary flex min-h-[54px] w-full items-center justify-center rounded-2xl shadow-lg shadow-indigo-200/70 disabled:opacity-45"
            >
              {loading ?
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
              : <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            </button>
          }
          <p className="text-center text-[11px] font-medium text-slate-500">
            ข้อมูลส่งถึงร้านเท่านั้น — ร้านจะติดต่อกลับก่อนเข้ารับ
          </p>
        </div>
      </footer>
    </div>
    </AppPublicCheckInGlassPage>
  );
}
