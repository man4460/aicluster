"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AppCameraCaptureModal,
  AppPickGalleryImageButton,
  AppPublicCheckInGlassPage,
  AppTakePhotoButton,
  appPublicCheckInGlassCardClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { barberCardSurfaceRadiusClass } from "@/systems/barber/components/barber-ui-tokens";
import { prepareBuildingPosSlipImageFile } from "@/systems/building-pos/building-pos-slip-image";

type SubRow = {
  id: number;
  packageName: string;
  remainingSessions: number;
  status: string;
};

type LookupOk = {
  found: true;
  customer: { id: number; displayName: string; phoneMasked: string };
  subscriptions: SubRow[];
};

export function BarberCustomerPortalClient({ ownerId }: { ownerId: string }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<LookupOk | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInMsg, setCheckInMsg] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [slipUrl, setSlipUrl] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const uploadSlipFile = useCallback(
    async (file: File) => {
      setPhotoBusy(true);
      setErr(null);
      try {
        const prepared = await prepareBuildingPosSlipImageFile(file);
        const fd = new FormData();
        fd.append("file", prepared);
        fd.append("ownerId", ownerId);
        const res = await fetch("/api/barber/public/portal/upload-slip", { method: "POST", body: fd });
        const j = (await res.json().catch(() => ({}))) as { error?: string; imageUrl?: string };
        if (!res.ok) throw new Error(j.error ?? "อัปโหลดไม่สำเร็จ");
        const url = j.imageUrl?.trim();
        if (!url) throw new Error("อัปโหลดไม่สำเร็จ");
        setSlipUrl(url);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
      } finally {
        setPhotoBusy(false);
      }
    },
    [ownerId],
  );

  const onSlipFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      await uploadSlipFile(file);
    },
    [uploadSlipFile],
  );

  const selectedSub = useMemo(
    () => data?.subscriptions.find((s) => s.id === selectedSubId) ?? null,
    [data, selectedSubId],
  );

  /** แสดงเฉพาะแพ็กที่ใช้หักครั้งได้ — ไม่โชว์การ์ดแพ็กหมด/ไม่พร้อมใช้ในหน้า QR */
  const usableSubscriptions = useMemo(
    () =>
      (data?.subscriptions ?? []).filter((s) => s.status === "ACTIVE" && s.remainingSessions > 0),
    [data],
  );

  const canSelfCheckIn =
    selectedSub != null && selectedSub.status === "ACTIVE" && selectedSub.remainingSessions > 0;

  /** ถ้าแพ็กที่เลือกหมดสิทธิ์แล้ว — เลือกแพ็กที่ใช้ได้แทน หรือไม่เลือก (กันข้อมูล/ขอบการ์ดค้าง) */
  useEffect(() => {
    if (!data?.subscriptions.length) {
      setSelectedSubId(null);
      return;
    }
    const sub =
      selectedSubId != null ? data.subscriptions.find((s) => s.id === selectedSubId) : undefined;
    const selectionOk =
      sub != null && sub.status === "ACTIVE" && sub.remainingSessions > 0;
    if (selectionOk) return;
    const firstOk = data.subscriptions.find((s) => s.status === "ACTIVE" && s.remainingSessions > 0);
    setSelectedSubId(firstOk?.id ?? null);
  }, [data, selectedSubId]);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setData(null);
    setCheckInMsg(null);
    setSelectedSubId(null);
    setSlipUrl("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setErr("กรอกเบอร์โทรอย่างน้อย 9 หลัก");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/barber/public/portal/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, phone: digits }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        found?: boolean;
        customer?: LookupOk["customer"];
        subscriptions?: SubRow[];
      };
      if (!res.ok) {
        setErr(j.error ?? "ค้นหาไม่สำเร็จ");
        return;
      }
      if (!j.found) {
        setErr("ไม่พบข้อมูลสมาชิกจากเบอร์นี้");
        return;
      }
      if (j.customer && j.subscriptions) {
        const block: LookupOk = {
          found: true,
          customer: j.customer,
          subscriptions: j.subscriptions,
        };
        setData(block);
        const first = j.subscriptions.find((s) => s.status === "ACTIVE" && s.remainingSessions > 0);
        setSelectedSubId(first?.id ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function onSelfCheckIn() {
    setCheckInMsg(null);
    setErr(null);
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setErr("กรอกเบอร์โทรอย่างน้อย 9 หลัก");
      return;
    }
    if (!canSelfCheckIn || selectedSubId == null) {
      setErr("เลือกแพ็กเกจที่มียอดครั้งคงเหลือก่อน");
      return;
    }
    setCheckInLoading(true);
    try {
      const res = await fetch("/api/barber/public/portal/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          phone: digits,
          subscriptionId: selectedSubId,
          receiptImageUrl: slipUrl.trim() || undefined,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
        remainingSessions?: number;
        status?: string;
        packageName?: string;
      };
      if (!res.ok) {
        setErr(j.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      if (j.ok && typeof j.remainingSessions === "number") {
        setSlipUrl("");
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            subscriptions: prev.subscriptions.map((s) =>
              s.id === selectedSubId
                ? {
                    ...s,
                    remainingSessions: j.remainingSessions!,
                    status: j.status ?? s.status,
                  }
                : s,
            ),
          };
        });
        const pkg = j.packageName ?? "แพ็กเกจ";
        const rem = j.remainingSessions;
        if (rem <= 0) {
          setCheckInMsg(`บันทึกแล้ว — ${pkg} ใช้ครบทุกสิทธิ์แล้ว`);
        } else {
          setCheckInMsg(`บันทึกการใช้บริการแล้ว — ${pkg} เหลืออีก ${rem} สิทธิ์`);
        }
      }
    } finally {
      setCheckInLoading(false);
    }
  }

  return (
    <AppPublicCheckInGlassPage>
      <div className="relative mx-auto max-w-md space-y-4">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/70 bg-gradient-to-br from-white/80 to-violet-100/60 shadow-[0_8px_24px_-8px_rgba(91,97,255,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/70">
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7 text-[#5b61ff]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="6" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <line x1="20" y1="4" x2="8.12" y2="15.88" />
              <line x1="14.47" y1="14.48" x2="20" y2="20" />
              <line x1="8.12" y1="8.12" x2="12" y2="12" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1e1b4b]">สมาชิกร้านตัดผม</h1>
          <p className="mt-1 text-sm text-[#6b6894]">กรอกเบอร์ ดูแพ็ก ยืนยันใช้บริการ</p>
        </div>

        <div className={appPublicCheckInGlassCardClass}>
          <div className="px-5 py-5 sm:px-6">
            <form onSubmit={onSearch} className="space-y-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9490c0]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="เบอร์โทร เช่น 0812345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                  className="w-full rounded-2xl border border-white/70 bg-white/60 py-3.5 pl-11 pr-4 text-sm font-semibold text-[#1e1b4b] shadow-[inset_0_1px_2px_rgba(30,27,75,0.06)] backdrop-blur-sm outline-none transition-all placeholder:text-[#a8a5cc] focus:border-[#5b61ff]/50 focus:bg-white/80 focus:ring-2 focus:ring-[#5b61ff]/15"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_-12px_rgba(91,97,255,0.6)] transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  "กำลังค้นหา…"
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" />
                    </svg>
                    ค้นหาข้อมูล
                  </>
                )}
              </button>
              {err ? (
                <p className={`${barberCardSurfaceRadiusClass} bg-red-50/90 px-3 py-2 text-center text-sm font-medium text-red-800 ring-1 ring-red-100`}>
                  {err}
                </p>
              ) : null}
            </form>
          </div>
        </div>

        {data ? (
          <>
            <div className={appPublicCheckInGlassCardClass}>
              <div className="px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center ${barberCardSurfaceRadiusClass} border border-white/70 bg-white/70 text-[#5b61ff] ring-1 ring-inset ring-white/70`}>
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-[#1e1b4b]">{data.customer.displayName}</p>
                    <p className="text-xs font-medium text-[#66638c]">{data.customer.phoneMasked}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3 border-t border-white/60 pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9490c0]">แพ็กเกจของฉัน</p>
                  {data.subscriptions.length === 0 ? (
                    <p className={`${barberCardSurfaceRadiusClass} bg-white/55 px-3 py-3 text-center text-sm text-[#66638c] ring-1 ring-inset ring-white/60`}>
                      ยังไม่มีแพ็กเกจในระบบ
                    </p>
                  ) : usableSubscriptions.length === 0 ? (
                    <p className={`${barberCardSurfaceRadiusClass} bg-amber-50/80 px-3 py-3 text-center text-sm font-medium text-amber-900 ring-1 ring-amber-200/60`}>
                      แพ็กที่มีสิทธิ์ใช้งานหมดแล้ว — รับแพ็กใหม่ที่ร้าน
                    </p>
                  ) : (
                    usableSubscriptions.map((s) => {
                      const active = selectedSubId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedSubId(s.id);
                            setCheckInMsg(null);
                          }}
                          className={cn(
                            "w-full rounded-2xl border bg-white/65 px-4 py-3 text-left shadow-sm ring-1 ring-inset transition",
                            active
                              ? "border-[#5b61ff]/40 bg-white/85 ring-[#5b61ff]/30"
                              : "border-white/70 ring-white/60 hover:border-[#5b61ff]/30 hover:bg-white/80",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-[#1e1b4b]">{s.packageName}</p>
                              <p className="mt-0.5 text-[11px] font-medium text-[#66638c]">ใช้สิทธิ์ที่ร้าน</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9490c0]">คงเหลือ</p>
                              <p className="text-2xl font-black tabular-nums text-[#5b61ff]">{s.remainingSessions}</p>
                              <p className="text-[10px] font-semibold text-[#66638c]">ครั้ง</p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {checkInMsg ? (
              <div className="rounded-2xl bg-emerald-50/85 px-4 py-3 text-center text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200/60 backdrop-blur-sm">
                {checkInMsg}
              </div>
            ) : null}

            <div className={appPublicCheckInGlassCardClass}>
              <div className="px-5 py-5 sm:px-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9490c0]">หลักฐาน (ไม่บังคับ)</p>
                <p className="mt-1 text-xs text-[#66638c]">ถ่ายหรือเลือกจากแกลเลอรี — แนบกับการใช้สิทธิ์ครั้งนี้</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <AppPickGalleryImageButton
                    type="button"
                    disabled={photoBusy || checkInLoading}
                    onClick={() => galleryInputRef.current?.click()}
                    className={`inline-flex min-h-[44px] items-center gap-2 ${barberCardSurfaceRadiusClass} border border-[#dcd8f0] bg-white/70 px-3 py-2 text-xs font-semibold text-[#4d47b6] ring-1 ring-inset ring-white/60`}
                  >
                    อัปโหลดรูป
                  </AppPickGalleryImageButton>
                  <AppTakePhotoButton
                    type="button"
                    disabled={photoBusy || checkInLoading}
                    onClick={() => setCameraOpen(true)}
                    className={`inline-flex min-h-[44px] items-center gap-2 ${barberCardSurfaceRadiusClass} border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs font-semibold text-emerald-900 ring-1 ring-inset ring-white/60`}
                  >
                    ถ่ายรูป
                  </AppTakePhotoButton>
                  {slipUrl ? (
                    <button
                      type="button"
                      disabled={photoBusy || checkInLoading}
                      onClick={() => setSlipUrl("")}
                      className="text-xs font-semibold text-red-700 underline"
                    >
                      ลบรูป
                    </button>
                  ) : null}
                </div>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden
                  onChange={(ev) => void onSlipFileChange(ev)}
                />
                {photoBusy ? <p className="mt-2 text-xs text-[#4d47b6]">กำลังอัปโหลด…</p> : null}
                {slipUrl ? (
                  <p className="mt-2 text-xs font-medium text-emerald-800">แนบรูปแล้ว — จะส่งพร้อมยืนยันใช้บริการ</p>
                ) : null}
                <AppCameraCaptureModal
                  open={cameraOpen}
                  onClose={() => setCameraOpen(false)}
                  onCapture={(file) => void uploadSlipFile(file)}
                  onRequestLegacyPicker={() => {
                    setCameraOpen(false);
                    requestAnimationFrame(() => galleryInputRef.current?.click());
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              disabled={checkInLoading || !canSelfCheckIn}
              onClick={() => void onSelfCheckIn()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 py-4 text-sm font-bold text-white shadow-[0_12px_28px_-12px_rgba(16,185,129,0.55)] transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checkInLoading ? (
                "กำลังบันทึก…"
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  ยืนยันใช้บริการ
                </>
              )}
            </button>
            {!canSelfCheckIn && usableSubscriptions.length > 0 ? (
              <p className="text-center text-xs font-medium text-amber-800">เลือกแพ็กที่ต้องการใช้สิทธิ์</p>
            ) : null}
          </>
        ) : null}
      </div>
    </AppPublicCheckInGlassPage>
  );
}
