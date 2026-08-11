"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AppCameraCaptureModal,
  AppPublicCheckInGlassPage,
  appPublicCheckInGlassCardClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
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

export function BarberCustomerPortalClient({
  ownerId,
  embedded = false,
}: {
  ownerId: string;
  /** เมื่อฝังในเว็บไซต์พอร์ทัล — ไม่ห่อ glass page / hero ชั้นนอก */
  embedded?: boolean;
}) {
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

  const body = (
    <>
        <div className={appPublicCheckInGlassCardClass}>
          <div className="px-5 py-5 sm:px-6">
            <form onSubmit={onSearch} className="flex items-stretch gap-2">
              <div className="relative min-w-0 flex-1">
                {!phone ? (
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9490c0]">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" />
                    </svg>
                  </span>
                ) : null}
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="เบอร์โทร เช่น 0812345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                  className={`w-full rounded-2xl border border-white/70 bg-white/60 py-3.5 ${phone ? "pl-4" : "pl-11"} pr-4 text-sm font-semibold text-[#1e1b4b] shadow-[inset_0_1px_2px_rgba(30,27,75,0.06)] backdrop-blur-sm outline-none transition-all placeholder:text-[#a8a5cc] focus:border-[#5b61ff]/50 focus:bg-white/80 focus:ring-2 focus:ring-[#5b61ff]/15`}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                aria-label={loading ? "กำลังค้นหา" : "ค้นหาข้อมูล"}
                className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-[#5b61ff]/30 bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] text-white shadow-[0_12px_28px_-10px_rgba(91,97,255,0.65)] transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>

        {data ? (
          <>
            <div className={appPublicCheckInGlassCardClass}>
              <div className="border-b border-white/50 bg-gradient-to-r from-[#5b61ff]/8 via-transparent to-transparent px-5 py-4 sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/70 bg-gradient-to-br from-white/80 to-violet-100/60 shadow-sm backdrop-blur-sm">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#5b61ff]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-black text-[#1e1b4b]">{data.customer.displayName}</p>
                    <p className="mt-0.5 text-xs font-medium text-[#6b6894]">{data.customer.phoneMasked}</p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 sm:px-6">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#9490c0]">แพ็กเกจของฉัน</p>
                </div>
                {data.subscriptions.length === 0 ? (
                  <div className="rounded-2xl border border-white/60 bg-white/40 px-4 py-4 text-center text-xs text-[#66638c] backdrop-blur-sm">
                    ยังไม่มีแพ็กเกจในระบบ
                  </div>
                ) : usableSubscriptions.length === 0 ? (
                  <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-4 text-center text-sm font-medium text-amber-900">
                    แพ็กที่มีสิทธิ์ใช้งานหมดแล้ว — รับแพ็กใหม่ที่ร้าน
                  </div>
                ) : (
                  <ul className="grid grid-cols-1 gap-3">
                    {usableSubscriptions.map((s) => {
                      const active = selectedSubId === s.id;
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSubId(s.id);
                              setCheckInMsg(null);
                            }}
                            className={cn(
                              "w-full rounded-2xl border px-4 py-3.5 text-left shadow-sm ring-1 ring-inset transition-all",
                              active
                                ? "border-[#5b61ff]/40 bg-white/85 ring-[#5b61ff]/25"
                                : "border-white/70 bg-white/55 ring-white/60 hover:border-[#5b61ff]/35 hover:bg-white/75",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-[#1e1b4b]">{s.packageName}</p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#9490c0]">คงเหลือ</p>
                                <p className="text-xl font-black tabular-nums text-[#5b61ff]">{s.remainingSessions}</p>
                                <p className="text-[10px] font-semibold text-[#66638c]">ครั้ง</p>
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {checkInMsg ? (
              <div className="overflow-hidden rounded-2xl border border-emerald-300/60 bg-gradient-to-br from-emerald-50/80 to-emerald-100/60 px-4 py-3.5 shadow-[0_8px_24px_-12px_rgba(16,185,129,0.3)] backdrop-blur-xl ring-1 ring-inset ring-emerald-200/50">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                    <svg viewBox="0 0 24 24" className="h-3 w-3 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-emerald-900">{checkInMsg}</p>
                </div>
              </div>
            ) : null}

            <div className={appPublicCheckInGlassCardClass}>
              <div className="px-5 py-5 sm:px-6">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#9490c0]">หลักฐาน</p>
                  <span className="text-[10px] font-semibold text-[#8b87ad]">ไม่บังคับ</span>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={photoBusy || checkInLoading}
                    onClick={() => galleryInputRef.current?.click()}
                    aria-label="อัปโหลดรูปจากแกลเลอรี"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#dcd8f0]/90 bg-white/90 text-[#4d47b6] shadow-sm ring-1 ring-white/70 transition hover:bg-[#f4f3ff] disabled:opacity-60"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    disabled={photoBusy || checkInLoading}
                    onClick={() => setCameraOpen(true)}
                    aria-label="ถ่ายรูป"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200/90 bg-emerald-50/90 text-emerald-800 shadow-sm ring-1 ring-white/70 transition hover:bg-emerald-100/90 disabled:opacity-60"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </button>
                  {slipUrl ? (
                    <button
                      type="button"
                      disabled={photoBusy || checkInLoading}
                      onClick={() => setSlipUrl("")}
                      aria-label="ลบรูปที่แนบ"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200/90 bg-red-50/90 text-red-700 shadow-sm transition hover:bg-red-100/90 disabled:opacity-60"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
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
                {photoBusy ? <p className="mt-2 text-center text-xs text-[#4d47b6]">กำลังอัปโหลด…</p> : null}
                {slipUrl ? (
                  <p className="mt-2 text-center text-xs font-medium text-emerald-800">แนบรูปแล้ว — จะส่งพร้อมยืนยัน</p>
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
              aria-label={checkInLoading ? "กำลังบันทึก" : "ยืนยันใช้บริการ"}
              className={cn(
                "flex min-h-[52px] w-full items-center justify-center rounded-2xl py-4 transition-all",
                checkInLoading || !canSelfCheckIn
                  ? "border border-white/60 bg-white/40 text-[#a8a5cc] backdrop-blur-sm"
                  : "border border-emerald-400/40 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_14px_30px_-10px_rgba(16,185,129,0.45)] active:scale-[0.98]",
              )}
            >
              {checkInLoading ? (
                <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
            {!canSelfCheckIn && usableSubscriptions.length > 0 ? (
              <p className="text-center text-xs font-medium text-amber-800">เลือกแพ็กที่ต้องการใช้สิทธิ์</p>
            ) : null}
          </>
        ) : null}

        {err ? (
          <div className="overflow-hidden rounded-2xl border border-red-300/60 bg-gradient-to-br from-red-50/80 to-rose-100/60 px-4 py-3.5 shadow-[0_8px_24px_-12px_rgba(220,38,38,0.2)] backdrop-blur-xl ring-1 ring-inset ring-red-200/50">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/15">
                <svg viewBox="0 0 24 24" className="h-3 w-3 text-red-700" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                  <path d="M12 9v4M12 17h.01" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
              <p className="text-sm text-red-800">{err}</p>
            </div>
          </div>
        ) : null}
    </>
  );

  if (embedded) {
    return <div className="space-y-4">{body}</div>;
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
        </div>
        {body}
      </div>
    </AppPublicCheckInGlassPage>
  );
}
