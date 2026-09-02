"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppEmptyState,
  AppPublicCheckInGlassPage,
  appPublicCheckInGlassCardClass,
  useAppNoticePopup,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { LaundryPublicPaymentPanel } from "@/systems/laundry/components/LaundryPublicPaymentPanel";
import {
  LaundryPortalPackageSelectCard,
  laundryPortalPackageGridClass,
  laundryPortalPackageGridScrollClass,
  laundryPortalPackagePriceLabel,
  type LaundryPortalPackageItem,
} from "@/systems/laundry/components/LaundryPortalPackageCard";
import { isTerminalLaundryOrderStatus } from "@/systems/laundry/laundry-order-status";
import { laundryDistanceKm, laundryPickupFeeBaht } from "@/systems/laundry/lib/pickup-distance";
import {
  laundryPaymentSubmitBlocked,
  type LaundryPublicPaymentMethod,
} from "@/systems/laundry/lib/payment-method";
import {
  laundryComputePortalPayDue,
  laundryPortalSlipProofMessage,
  normalizeLaundryPortalPaymentMode,
  type LaundryPortalBookingPaymentMode,
} from "@/systems/laundry/lib/portal-booking";
import {
  laundryDashboardSegmentBtnClass,
  laundryDashboardSegmentShellClass,
  laundryInlineAlertErrorClass,
  laundryMutedLoadingNoticeClass,
  laundryPanelClass,
  laundryPanelSectionClass,
  laundryPaymentChipActiveClass,
  laundryPaymentChipIdleClass,
  laundryPaymentCtaClass,
  laundryPortalChipActiveClass,
  laundryPortalChipIdleClass,
  laundryPortalFieldClass,
  laundryPortalInfoBannerClass,
  laundryPortalInsetPanelClass,
  laundryPortalLabelClass,
  laundryPortalPrimaryBtnClass,
  laundryPortalStepNavBtnClass,
  laundryPortalSuccessPanelClass,
  laundryPortalTextareaClass,
  laundryPortalTierPickerShellClass,
  laundrySectionHeadingClass,
} from "@/systems/laundry/lib/ui-tokens";

const TRACK_STORE_PREFIX = "laundryPickupTrack:v1:";

type Tab = "info" | "service" | "orders";

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

type PublicPackage = LaundryPortalPackageItem;

function trackStorageKey(ownerId: string): string {
  return `${TRACK_STORE_PREFIX}${ownerId}`;
}

function looksLikeUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.trim());
}

function priceHint(pkg: PublicPackage): string {
  return laundryPortalPackagePriceLabel(pkg);
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

function formatBaht(n: number) {
  return n.toLocaleString("th-TH");
}

export function LaundryPickupPublicClient({
  ownerId,
  shopLabel,
  embeddedInPortal = false,
  initialPackages,
  shopLocation,
  portalPayment,
  seedCustomerName,
  seedCustomerPhone,
  seedPackageId,
}: {
  ownerId: string;
  shopLabel: string;
  embeddedInPortal?: boolean;
  initialPackages?: PublicPackage[];
  shopLocation?: {
    shopLat: number | null;
    shopLng: number | null;
    pickupFeePerKmBaht: number | null;
  } | null;
  portalPayment?: {
    mode: LaundryPortalBookingPaymentMode;
    depositAmountBaht: number | null;
  };
  /** ค่าจากแถบย่อบนแบนเนอร์ — sync เมื่อเปิดฟอร์มเต็ม */
  seedCustomerName?: string;
  seedCustomerPhone?: string;
  /** แพ็กที่เลือกจาก popup รายละเอียดบนเว็บ */
  seedPackageId?: number | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trialParam = searchParams.get("t");
  const notice = useAppNoticePopup();

  const [tab, setTab] = useState<Tab>("info");
  const [packages, setPackages] = useState<PublicPackage[]>(initialPackages ?? []);
  const [packagesLoading, setPackagesLoading] = useState(!initialPackages?.length);
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

  const [reviewOpen, setReviewOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<LaundryPublicPaymentMethod>("CASH");
  const [paymentSlipUrl, setPaymentSlipUrl] = useState<string | null>(null);
  const [resolvedPayment, setResolvedPayment] = useState<{
    mode: LaundryPortalBookingPaymentMode;
    depositAmountBaht: number | null;
  } | null>(portalPayment ?? null);

  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [trackingInfo, setTrackingInfo] = useState<PublicPickupTrackPayload | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const payMode = resolvedPayment?.mode ?? "NONE";
  const depositAmountBaht = resolvedPayment?.depositAmountBaht ?? null;

  useEffect(() => {
    if (seedCustomerName != null && seedCustomerName.trim()) {
      setCustomerName(seedCustomerName.trim());
    }
  }, [seedCustomerName]);

  useEffect(() => {
    if (seedCustomerPhone != null && seedCustomerPhone.trim()) {
      setCustomerPhone(seedCustomerPhone.trim());
    }
  }, [seedCustomerPhone]);

  useEffect(() => {
    if (portalPayment) {
      setResolvedPayment(portalPayment);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const q = trialParam ? `&t=${encodeURIComponent(trialParam)}` : "";
        const res = await fetch(`/api/laundry/public/portal?ownerId=${encodeURIComponent(ownerId)}${q}`);
        const data = (await res.json()) as {
          shop?: { portalBookingPaymentMode?: string; depositAmountBaht?: number | null };
        };
        if (!cancelled && res.ok && data.shop) {
          setResolvedPayment({
            mode: normalizeLaundryPortalPaymentMode(data.shop.portalBookingPaymentMode),
            depositAmountBaht: data.shop.depositAmountBaht ?? null,
          });
        }
      } catch {
        /* keep NONE */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ownerId, portalPayment, trialParam]);

  useEffect(() => {
    if (initialPackages?.length) {
      setPackages(initialPackages);
      setPackagesLoading(false);
      return;
    }
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
  }, [ownerId, initialPackages]);

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

  const blocksPackageSelection = useMemo(() => {
    if (!trackingToken || trackingError) return false;
    if (trackingInfo == null) return trackingLoading;
    return !isTerminalLaundryOrderStatus(trackingInfo.status);
  }, [trackingError, trackingInfo, trackingLoading, trackingToken]);

  useEffect(() => {
    if (blocksPackageSelection) {
      setTab("orders");
    }
  }, [blocksPackageSelection]);

  useEffect(() => {
    if (seedPackageId == null) return;
    const p = packages.find((x) => x.id === seedPackageId);
    if (!p) return;
    setSelectedPackageId(p.id);
    const list = p.basket_tiers?.filter((t) => t.label.trim()) ?? [];
    setTierIndex(list.length > 0 ? 0 : null);
    if (!blocksPackageSelection) {
      setTab("service");
    }
  }, [blocksPackageSelection, packages, seedPackageId]);

  useEffect(() => {
    if (!reviewOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setReviewOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [reviewOpen]);

  const dismissTracking = useCallback(() => {
    setTrackingToken(null);
    setTrackingInfo(null);
    setTrackingError(null);
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
    const params = new URLSearchParams();
    params.set("track", trackingToken);
    if (trialParam) params.set("t", trialParam);
    const url = `${window.location.origin}${pathname}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      notice.success("คัดลอกลิงก์ติดตามแล้ว — เปิดลิงก์นี้ภายหลังเพื่อดูสถานะ");
    } catch {
      notice.warning("คัดลอกอัตโนมัติไม่ได้ — ลองเลือกและคัดลอกจากแถบที่อยู่");
    }
  }, [notice, pathname, trackingToken, trialParam]);

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

  const distanceKm = useMemo(
    () =>
      laundryDistanceKm(
        shopLocation?.shopLat,
        shopLocation?.shopLng,
        coords?.lat,
        coords?.lng,
      ),
    [shopLocation?.shopLat, shopLocation?.shopLng, coords],
  );

  const estimatedPickupFee = useMemo(
    () => laundryPickupFeeBaht(distanceKm, shopLocation?.pickupFeePerKmBaht),
    [distanceKm, shopLocation?.pickupFeePerKmBaht],
  );

  const totalEstimatedPrice = useMemo(() => {
    const base = resolvedPrice;
    if (estimatedPickupFee != null && estimatedPickupFee > 0) return base + estimatedPickupFee;
    return base;
  }, [resolvedPrice, estimatedPickupFee]);

  const payDue = useMemo(
    () =>
      laundryComputePortalPayDue({
        mode: payMode,
        depositAmountBaht,
        orderTotalBaht: totalEstimatedPrice,
      }),
    [payMode, depositAmountBaht, totalEstimatedPrice],
  );

  const canProceedPackage = selectedPkg != null && (tiers.length === 0 || tierIndex != null);
  const canProceedContact = customer_name.trim().length > 0 && customer_phone.trim().length > 0;
  const hasLocation = coords != null || locationDetail.trim().length > 0;

  const customerTabs = useMemo(() => {
    const tabs: Array<{ id: Tab; label: string }> = [
      { id: "info", label: "ข้อมูล" },
    ];
    if (!blocksPackageSelection) {
      tabs.push({ id: "service", label: "เลือกบริการ" });
    }
    tabs.push({ id: "orders", label: "รายการ" });
    return tabs;
  }, [blocksPackageSelection]);

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

  function validateInfo(): string | null {
    if (!customer_name.trim() || !customer_phone.trim()) {
      return "กรุณากรอกชื่อและเบอร์โทร";
    }
    if (!hasLocation) {
      return "กดดึงพิกัดจากเครื่อง หรือกรอกรายละเอียดสถานที่รับผ้า";
    }
    const w = estimated_weight_kg.trim() === "" ? undefined : Number(estimated_weight_kg);
    const ic = estimated_item_count.trim() === "" ? undefined : Number.parseInt(estimated_item_count, 10);
    if (w !== undefined && (!Number.isFinite(w) || w < 0)) {
      return "น้ำหนักประมาณการไม่ถูกต้อง";
    }
    if (ic !== undefined && (!Number.isFinite(ic) || ic < 0)) {
      return "จำนวนชิ้นประมาณการไม่ถูกต้อง";
    }
    return null;
  }

  function goToServiceTab() {
    const errMsg = validateInfo();
    if (errMsg) {
      notice.warning(errMsg);
      return;
    }
    setTab("service");
  }

  const submit = useCallback(async () => {
    if (!selectedPkg || !canProceedPackage) {
      notice.warning("กรุณาเลือกแพ็กเกจ");
      return;
    }
    const infoErr = validateInfo();
    if (infoErr) {
      notice.warning(infoErr);
      return;
    }
    const addr = pickup_address.trim();
    if (!addr) {
      notice.warning("ข้อมูลที่อยู่รับผ้าไม่ครบ");
      return;
    }
    if (laundryPaymentSubmitBlocked(paymentMethod, payDue, paymentSlipUrl)) {
      notice.warning(
        paymentMethod === "PROMPTPAY" ? "กรุณาแนบสลิปหลังโอนพร้อมเพย์" : "กรุณาแนบสลิปการโอน",
      );
      return;
    }

    const w = estimated_weight_kg.trim() === "" ? undefined : Number(estimated_weight_kg);
    const ic = estimated_item_count.trim() === "" ? undefined : Number.parseInt(estimated_item_count, 10);

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
      if (coords) {
        body.pickup_lat = coords.lat;
        body.pickup_lng = coords.lng;
      }
      if (payDue > 0) {
        body.payment_method = paymentMethod;
        if (paymentMethod === "PROMPTPAY" || paymentMethod === "TRANSFER") {
          body.receipt_image_url = paymentSlipUrl;
        }
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
        notice.error(data.error ?? "ส่งคำขอไม่สำเร็จ");
        return;
      }
      notice.success(data.message ?? "ส่งคำขอแล้ว");
      setReviewOpen(false);
      setPaymentMethod("CASH");
      setPaymentSlipUrl(null);
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
      setTab("orders");
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
      notice.error("เชื่อมต่อไม่ได้ ลองใหม่ภายหลัง");
    } finally {
      setLoading(false);
    }
  }, [
    canProceedPackage,
    coords,
    customer_name,
    customer_phone,
    dropoff_address,
    estimated_weight_kg,
    estimated_item_count,
    extra_note,
    ownerId,
    notice,
    payDue,
    paymentMethod,
    paymentSlipUrl,
    pickup_address,
    preferred_pickup_note,
    router,
    pathname,
    searchParams,
    selectedPkg,
    tierIndex,
    tiers.length,
  ]);

  async function handleConfirmFromReview() {
    await submit();
  }

  const inputClass = cn(laundryPortalFieldClass, "mt-1");
  const textareaClass = cn(laundryPortalTextareaClass, "mt-1");
  const labelClass = laundryPortalLabelClass;

  const sectionCardClass = embeddedInPortal
    ? "space-y-3"
    : cn(laundryPanelClass, laundryPanelSectionClass);

  const sectionWrapClass = embeddedInPortal ? "w-full" : cn("mx-auto max-w-md", sectionCardClass);
  const contentPadClass = embeddedInPortal ? "" : "px-4";

  const stepSummary = useMemo(() => {
    const parts: string[] = [];
    if (customer_name.trim()) parts.push(customer_name.trim());
    if (customer_phone.trim()) parts.push(customer_phone.trim());
    if (selectedPkg?.name) parts.push(selectedPkg.name);
    return parts.join(" · ");
  }, [customer_name, customer_phone, selectedPkg?.name]);

  const trackingSection = (
    <section
      className={cn(laundryPanelClass, "px-4 py-3", !embeddedInPortal && "mx-auto max-w-md")}
      aria-label="ติดตามสถานะคำขอบริการรับ-ส่ง"
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
        {trackingToken ?
          <button
            type="button"
            onClick={() => dismissTracking()}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 underline decoration-slate-300"
          >
            ปิด
          </button>
        : null}
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
        <p className={cn("mt-2", laundryInlineAlertErrorClass)}>{trackingError}</p>
      : null}
      {trackingToken ?
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
      : null}
    </section>
  );

  const packageGrid = (
    <>
      {packagesLoading ?
        <p className={laundryMutedLoadingNoticeClass}>กำลังโหลดแพ็กเกจ…</p>
      : packagesError ?
        <AppEmptyState tone="violet">
          <span className="block font-semibold text-[#1e1b4b]">โหลดแพ็กเกจไม่สำเร็จ</span>
          <span className="mt-1 block text-xs">{packagesError}</span>
        </AppEmptyState>
      : packages.length === 0 ?
        <AppEmptyState tone="violet">
          ร้านยังไม่มีแพ็กเกจที่เปิดให้เลือก — โปรดติดต่อร้านโดยตรง
        </AppEmptyState>
      : <>
          <ul className={cn(laundryPortalPackageGridClass, laundryPortalPackageGridScrollClass, "list-none p-0")}>
            {packages.map((p) => (
              <LaundryPortalPackageSelectCard
                key={p.id}
                pkg={p}
                selected={selectedPackageId === p.id}
                onSelect={() => selectPackage(p)}
              />
            ))}
          </ul>

          {selectedPkg && tiers.length > 0 ?
            <div className={laundryPortalTierPickerShellClass}>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#66638c]">เลือกขนาดตะกร้า / ราคา</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {tiers.map((t, i) => (
                  <button
                    key={`${t.label}-${i}`}
                    type="button"
                    onClick={() => setTierIndex(i)}
                    className={cn(
                      "min-h-[44px] px-3 py-2 text-left text-xs font-bold transition-all",
                      tierIndex === i ? laundryPaymentChipActiveClass : laundryPaymentChipIdleClass,
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
  );

  const shell = (
    <div
      className={cn(
        "relative mx-auto flex w-full max-w-md flex-1 flex-col",
        embeddedInPortal && "max-w-none",
        tab === "service" && canProceedPackage && !blocksPackageSelection ? "pb-24" : embeddedInPortal ? "pb-4" : "pb-6",
      )}
    >
      {!embeddedInPortal ?
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
          {trialParam ?
            <p className={cn("mx-auto mt-3 max-w-md", laundryPortalInfoBannerClass)}>
              โหมดทดลองร้าน — ข้อมูลจะอยู่ในชุดทดลองของร้าน
            </p>
          : null}
        </header>
      : null}

      <div className={cn("shrink-0", contentPadClass, embeddedInPortal ? "pt-0" : "")}>
        {embeddedInPortal && tab !== "info" && stepSummary ?
          <p className="mt-2 text-sm font-semibold text-[#66638c]">{stepSummary}</p>
        : null}

        {embeddedInPortal ?
          <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="ขั้นตอนขอบริการรับ-ส่ง">
            {customerTabs.map((t, idx) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={active ? laundryPortalChipActiveClass : laundryPortalChipIdleClass}
                >
                  {idx + 1}. {t.label}
                </button>
              );
            })}
          </div>
        : <div className={laundryDashboardSegmentShellClass} role="tablist" aria-label="เมนูขอบริการรับ-ส่ง">
            {customerTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(laundryDashboardSegmentBtnClass(tab === t.id), "min-h-9 flex-1 px-2 sm:px-3")}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      </div>

      <main className={cn("flex-1 overflow-y-auto", embeddedInPortal ? "pt-3" : "pt-4", contentPadClass)}>
        {tab === "info" ?
          <section className={sectionWrapClass} aria-labelledby="pickup-tab-info">
            <div className={embeddedInPortal ? sectionCardClass : undefined}>
            {!embeddedInPortal ?
              <h2 id="pickup-tab-info" className={laundrySectionHeadingClass}>
                ข้อมูล
              </h2>
            : null}
            <div className={cn("grid gap-3 sm:grid-cols-2", embeddedInPortal ? "" : "mt-4")}>
            <label className={labelClass}>
              {embeddedInPortal ? "ชื่อ" : <>ชื่อ–นามสกุล <span className="text-rose-600">*</span></>}
              <input
                className={inputClass}
                placeholder="เช่น สมชาย ใจดี"
                value={customer_name}
                onChange={(e) => setCustomerName(e.target.value)}
                autoComplete="name"
                autoCapitalize="words"
                required
              />
            </label>
            <label className={labelClass}>
              {embeddedInPortal ? "เบอร์โทร" : <>เบอร์โทรติดต่อ <span className="text-rose-600">*</span></>}
              <input
                className={inputClass}
                placeholder="เช่น 0812345678"
                value={customer_phone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                required
              />
            </label>
            </div>

            <button
              type="button"
              disabled={geoLoading}
              onClick={() => void fetchGeo()}
              className={cn(
                embeddedInPortal ? laundryPortalChipIdleClass : "app-btn-primary",
                "mt-3 flex w-full items-center justify-center gap-2 sm:w-auto",
                !embeddedInPortal && "min-h-[48px] rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200/60",
                geoLoading && "opacity-60",
              )}
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
              <p className={cn("mt-3", laundryPortalInfoBannerClass)}>{geoError}</p>
            : null}

            {coords ?
              <div className={cn("mt-3", laundryPortalSuccessPanelClass)}>
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">พิกัดที่ได้รับ</p>
                <p className="mt-1.5 font-mono text-xs font-bold text-emerald-950 sm:text-sm">
                  {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                </p>
                <a
                  href={mapsLink(coords)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex min-h-[40px] items-center justify-center rounded-xl border border-emerald-300 bg-white px-3 text-xs font-bold text-emerald-800 sm:text-sm"
                >
                  เปิดใน Google Maps
                </a>
                {distanceKm != null ?
                  <div className="mt-3 space-y-1 border-t border-emerald-200/70 pt-3">
                    <p className="text-xs font-semibold text-emerald-900">
                      ระยะจากร้านประมาณ <span className="font-black tabular-nums">{distanceKm.toLocaleString("th-TH")} กม.</span>
                    </p>
                    {estimatedPickupFee != null && estimatedPickupFee > 0 ?
                      <p className="text-xs font-bold text-emerald-800">
                        ค่ารับ–ส่งโดยประมาณ ฿{estimatedPickupFee.toLocaleString("th-TH")}
                        {shopLocation?.pickupFeePerKmBaht ?
                          <span className="font-semibold text-emerald-700/80">
                            {" "}
                            (฿{shopLocation.pickupFeePerKmBaht.toLocaleString("th-TH")}/กม.)
                          </span>
                        : null}
                      </p>
                    : shopLocation?.pickupFeePerKmBaht ?
                      <p className="text-[11px] font-medium text-emerald-800/80">ร้านยังไม่คิดค่ารับ–ส่งอัตโนมัติจากระยะทาง</p>
                    : null}
                  </div>
                : null}
              </div>
            : null}

            <label className={cn(labelClass, "mt-3 block sm:col-span-2")}>
              รายละเอียดสถานที่
              {!coords ?
                <span className="text-rose-600"> *</span>
              : null}
              <textarea
                className={textareaClass}
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

            <details className={cn("group mt-3 open:bg-white/80", laundryPortalInsetPanelClass)}>
              <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-bold text-[#4d47b6] sm:px-4 sm:text-sm [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-2">
                  ข้อมูลเพิ่มเติม <span className="text-xs font-semibold text-slate-500">ไม่บังคับ</span>
                </span>
              </summary>
              <div className="space-y-3 border-t border-slate-100 px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
                <label className={cn(labelClass, "text-[#66638c]")}>
                  ที่อยู่ส่งคืน
                  <textarea
                    className={cn(textareaClass, "min-h-[72px]")}
                    placeholder="ว่าง = ใช้ที่อยู่รับผ้าเดียวกัน"
                    value={dropoff_address}
                    onChange={(e) => setDropoffAddress(e.target.value)}
                  />
                </label>
                <label className={cn(labelClass, "text-[#66638c]")}>
                  ช่วงเวลาที่สะดวกให้ไปรับ
                  <textarea
                    className={cn(textareaClass, "min-h-[72px]")}
                    placeholder="เช่น เสาร์ 9:00–12:00"
                    value={preferred_pickup_note}
                    onChange={(e) => setPreferredPickupNote(e.target.value)}
                  />
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className={cn(labelClass, "text-[#66638c]")}>
                    น้ำหนักโดยประมาณ (กก.)
                    <input
                      className={inputClass}
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
                      className={inputClass}
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
                    className={cn(textareaClass, "min-h-[72px]")}
                    placeholder="ประเภทผ้า รหัสประตู ฯลฯ"
                    value={extra_note}
                    onChange={(e) => setExtraNote(e.target.value)}
                  />
                </label>
              </div>
            </details>

            {!blocksPackageSelection ?
              embeddedInPortal ?
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    disabled={!canProceedContact || !hasLocation}
                    onClick={goToServiceTab}
                    className={cn(laundryPortalPrimaryBtnClass, "disabled:opacity-45")}
                  >
                    ถัดไป
                  </button>
                </div>
              : <button
                  type="button"
                  disabled={!canProceedContact || !hasLocation}
                  onClick={goToServiceTab}
                  className={cn(laundryPaymentCtaClass, "mt-6 w-full min-h-[48px] disabled:opacity-45")}
                >
                  เลือกบริการ
                </button>
            : null}
            </div>
          </section>
        : null}

        {tab === "service" && !blocksPackageSelection ?
          <section className={sectionWrapClass} aria-labelledby="pickup-tab-service">
            <div className={embeddedInPortal ? sectionCardClass : undefined}>
            <h2
              id="pickup-tab-service"
              className={embeddedInPortal ? "sr-only" : "sr-only"}
            >
              เลือกบริการ
            </h2>
            {packageGrid}
            </div>
          </section>
        : null}

        {tab === "orders" ?
          <section className={cn(sectionWrapClass, "space-y-4")} aria-labelledby="pickup-tab-orders">
            <h2 id="pickup-tab-orders" className={laundrySectionHeadingClass}>
              รายการ
            </h2>
            {blocksPackageSelection ?
              <div className={cn(laundryPortalInsetPanelClass, "text-center")} role="status">
                <p className="text-sm font-black leading-snug text-[#1e1b4b]">มีคำขอที่ยังดำเนินการ</p>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-[#4d47b6]">
                  เลือกแพ็กเกจใหม่ได้เมื่อสถานะเป็น ส่งคืนสำเร็จ หรือ ยกเลิก
                </p>
              </div>
            : null}
            {trackingToken ?
              trackingSection
            : <p className="text-sm font-semibold text-[#66638c]">ยังไม่มีคำขอ — กรอกข้อมูลแล้วเลือกบริการ</p>}
          </section>
        : null}
      </main>

      {tab === "service" && canProceedPackage && !blocksPackageSelection ?
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-xl",
            embeddedInPortal
              ? "border-white/50 bg-white/90 shadow-[0_-12px_40px_rgba(30,27,75,0.12)]"
              : "border-slate-200 bg-white/95 shadow-[0_-8px_32px_rgba(15,23,42,0.08)]",
          )}
        >
          <div
            className={cn(
              "mx-auto flex items-center justify-between gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
              embeddedInPortal ? "max-w-6xl sm:px-6" : "max-w-lg",
            )}
          >
            <div>
              <p className="text-xs text-[#66638c]">ยอดโดยประมาณ</p>
              <p className="text-lg font-bold tabular-nums text-[#1e1b4b]">฿{formatBaht(totalEstimatedPrice)}</p>
            </div>
            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              className={cn(laundryPaymentCtaClass, "min-h-[48px] shrink-0 px-5")}
            >
              ตรวจสอบและชำระ
            </button>
          </div>
        </div>
      : null}

      {reviewOpen ?
        <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:justify-center sm:p-4" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
            aria-label="ปิด"
            onClick={() => setReviewOpen(false)}
          />
          <div
            className="relative z-10 flex max-h-[min(92dvh,720px)] w-full flex-col rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:mx-auto sm:max-w-lg sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="laundry-pickup-review-title"
          >
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-5 sm:px-5 sm:pt-6">
              <h2 id="laundry-pickup-review-title" className="text-lg font-bold text-slate-900">
                สรุปรายการ
              </h2>
              <dl className={cn("mt-4 space-y-2 text-sm", laundryPortalInsetPanelClass)}>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">ชื่อ</dt>
                  <dd className="max-w-[65%] text-right font-medium text-slate-800">{customer_name.trim() || "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">เบอร์โทร</dt>
                  <dd className="text-right font-medium tabular-nums text-slate-800">{customer_phone.trim() || "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="shrink-0 text-slate-500">จุดรับผ้า</dt>
                  <dd className="max-w-[65%] whitespace-pre-wrap text-right text-xs font-medium leading-snug text-slate-800">
                    {pickup_address.trim() || "—"}
                  </dd>
                </div>
                {selectedPkg ?
                  <div className="flex justify-between gap-2 border-t border-slate-200/80 pt-2">
                    <dt className="text-slate-500">แพ็กเกจ</dt>
                    <dd className="max-w-[65%] text-right font-medium text-slate-800">
                      {selectedPkg.name}
                      {tiers.length > 0 && tierIndex != null && tiers[tierIndex] ?
                        <span className="block text-xs font-semibold text-slate-500">
                          {tiers[tierIndex].label} · ฿{formatBaht(tiers[tierIndex].price)}
                        </span>
                      : <span className="block text-xs font-semibold text-slate-500">฿{formatBaht(resolvedPrice)}</span>}
                    </dd>
                  </div>
                : null}
                {estimatedPickupFee != null && estimatedPickupFee > 0 ?
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">ค่ารับ–ส่ง</dt>
                    <dd className="font-medium tabular-nums text-slate-800">฿{formatBaht(estimatedPickupFee)}</dd>
                  </div>
                : null}
                <div className="flex justify-between gap-2 border-t border-slate-200/80 pt-2">
                  <dt className="font-semibold text-slate-700">ยอดโดยประมาณ</dt>
                  <dd className="text-lg font-bold tabular-nums text-indigo-800">฿{formatBaht(totalEstimatedPrice)}</dd>
                </div>
                {payDue > 0 && payDue !== totalEstimatedPrice ?
                  <div className="flex justify-between gap-2">
                    <dt className="font-semibold text-indigo-700">ชำระตอนนี้</dt>
                    <dd className="font-bold tabular-nums text-indigo-800">฿{formatBaht(payDue)}</dd>
                  </div>
                : null}
              </dl>

              {payDue > 0 ?
                <>
                  <p className="mt-3 text-xs font-medium text-slate-600">{laundryPortalSlipProofMessage(payMode)}</p>
                  <div className="mt-3">
                    <LaundryPublicPaymentPanel
                      ownerId={ownerId}
                      amountBaht={payDue}
                      method={paymentMethod}
                      slipUrl={paymentSlipUrl}
                      onMethodChange={setPaymentMethod}
                      onSlipUrlChange={setPaymentSlipUrl}
                      disabled={loading}
                      trialParam={trialParam}
                    />
                  </div>
                </>
              : null}
            </div>
            <div className="flex shrink-0 gap-2 border-t border-slate-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                className={cn(laundryPortalStepNavBtnClass, "min-h-[48px] flex-1")}
              >
                กลับ
              </button>
              <button
                type="button"
                disabled={loading || laundryPaymentSubmitBlocked(paymentMethod, payDue, paymentSlipUrl)}
                onClick={() => void handleConfirmFromReview()}
                className={cn(laundryPaymentCtaClass, "min-h-[48px] flex-[1.15] px-4 disabled:opacity-50")}
              >
                {loading ? "กำลังส่ง…" : "ยืนยันส่งคำขอ"}
              </button>
            </div>
          </div>
        </div>
      : null}
      {notice.popup}
    </div>
  );

  if (embeddedInPortal) {
    return shell;
  }

  return (
    <AppPublicCheckInGlassPage className="flex min-h-[100dvh] flex-col pb-0">
      {shell}
    </AppPublicCheckInGlassPage>
  );
}
