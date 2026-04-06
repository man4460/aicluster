"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AppCameraCaptureModal,
  AppPickGalleryImageButton,
  AppTakePhotoButton,
} from "@/components/app-templates";
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
    <div className="mx-auto min-h-[100dvh] max-w-md px-4 pb-16 pt-8">
      <header className="text-center">
        <h1 className="text-xl font-bold text-[#2e2a58]">สมาชิก</h1>
        <p className="mt-2 text-sm text-[#5f5a8a]">
          กรอกเบอร์ ดูแพ็ก แล้วกดยืนยันเมื่อใช้บริการ — หักครั้งอัตโนมัติ
        </p>
      </header>

      <form onSubmit={onSearch} className="mt-8 space-y-3">
        <label className="block text-xs font-semibold text-[#4d47b6]">
          เบอร์โทร
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="0812345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
            className="app-input mt-1.5 w-full rounded-2xl border-2 px-4 py-3.5 text-lg tracking-wide shadow-sm outline-none transition focus:border-[#4d47b6]/40 focus:ring-4 focus:ring-[#4d47b6]/12"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="app-btn-primary w-full rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg shadow-[#4d47b6]/20 disabled:opacity-60"
        >
          {loading ? "กำลังค้นหา…" : "ดูแพ็ก"}
        </button>
        {err ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-800 ring-1 ring-red-100">
            {err}
          </p>
        ) : null}
      </form>

      {data ? (
        <section className="mt-10 space-y-4">
          <div className="rounded-3xl border-2 border-[#ecebff] bg-gradient-to-b from-white to-[#f8f7ff] p-5 shadow-lg shadow-[#4d47b6]/10">
            <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Digital Member Card
            </p>
            <p className="mt-3 text-center text-lg font-bold text-slate-900">{data.customer.displayName}</p>
            <p className="mt-1 text-center text-sm text-slate-600">{data.customer.phoneMasked}</p>
            <div className="mt-6 space-y-4">
              {data.subscriptions.length === 0 ? (
                <p className="text-center text-sm text-slate-500">ยังไม่มีแพ็กเกจในระบบ</p>
              ) : usableSubscriptions.length === 0 ? (
                <p className="text-center text-sm text-slate-600">
                  แพ็กที่มีสิทธิ์ใช้งานหมดแล้ว — รับแพ็กใหม่ที่ร้าน
                </p>
              ) : (
                usableSubscriptions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedSubId(s.id);
                      setCheckInMsg(null);
                    }}
                    className={`w-full rounded-2xl border-2 px-4 py-4 text-left transition ${
                      selectedSubId === s.id
                        ? "border-[#4d47b6] bg-[#4d47b6]/5 ring-2 ring-[#4d47b6]/20"
                        : "border-[#ecebff] bg-white hover:border-[#d8d4f5]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-800">{s.packageName}</p>
                    <p className="mt-3 text-center">
                      <span className="text-xs text-slate-500">ครั้งคงเหลือ</span>
                      <span className="mt-1 block text-4xl font-black tabular-nums text-[#4d47b6]">
                        {s.remainingSessions}
                      </span>
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {checkInMsg ? (
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-900 ring-1 ring-emerald-100">
              {checkInMsg}
            </p>
          ) : null}

          <div className="rounded-2xl border border-[#dcd8f0] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-[#4d47b6]">แนบรูปยืนยัน (ไม่บังคับ)</p>
            <p className="mt-0.5 text-[11px] text-[#66638c]">ถ่ายหรือเลือกจากแกลเลอรี — แนบกับการใช้สิทธิ์ครั้งนี้</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <AppPickGalleryImageButton
                type="button"
                disabled={photoBusy || checkInLoading}
                onClick={() => galleryInputRef.current?.click()}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#4d47b6]/30 bg-[#ecebff] px-3 py-2 text-xs font-semibold text-[#4d47b6]"
              >
                อัปโหลดรูป
              </AppPickGalleryImageButton>
              <AppTakePhotoButton
                type="button"
                disabled={photoBusy || checkInLoading}
                onClick={() => setCameraOpen(true)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-emerald-600/35 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900"
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

          <button
            type="button"
            disabled={checkInLoading || !canSelfCheckIn}
            onClick={() => void onSelfCheckIn()}
            className="w-full rounded-2xl bg-emerald-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checkInLoading ? "กำลังบันทึก…" : "ยืนยันว่าใช้บริการเรียบร้อยแล้ว"}
          </button>
          {!canSelfCheckIn && usableSubscriptions.length > 0 ? (
            <p className="text-center text-xs text-amber-800">เลือกแพ็กที่ต้องการใช้สิทธิ์</p>
          ) : null}
        </section>
      ) : null}

      <footer className="mt-16 text-center text-[10px] text-[#8b87ad]">QR ลูกค้า · เช็กอินเอง</footer>
    </div>
  );
}
