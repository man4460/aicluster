"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppSignaturePad, type AppSignaturePadHandle } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { uploadLaundrySignatureBlob } from "@/systems/laundry/lib/upload-signature";
import {
  laundryCardSurfaceRadiusClass,
  laundryInlineAlertErrorClass,
  laundrySectionFirstClass,
  laundrySectionNextClass,
  laundrySubtitleClass,
} from "@/systems/laundry/lib/ui-tokens";

type SubRow = {
  id: number;
  remainingSessions: number;
  status: string;
  packageName: string;
  packageId: number;
};

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export type LaundryCheckInFormProps = {
  variant?: "page" | "modal";
  /** เมื่อเปิดโมดัล — รีเซ็ตฟอร์มเมื่อปิด */
  active?: boolean;
  onRequestSell?: () => void;
};

export function LaundryCheckInForm({
  variant = "page",
  active = true,
  onRequestSell,
}: LaundryCheckInFormProps) {
  const router = useRouter();
  const modal = variant === "modal";
  const signaturePadRef = useRef<AppSignaturePadHandle>(null);

  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [deducting, setDeducting] = useState(false);

  useEffect(() => {
    if (active) return;
    setPhone("");
    setSearching(false);
    setCustomerName(null);
    setSubs([]);
    setSelectedSubId(null);
    setMsg(null);
    setErr(null);
    setDeducting(false);
    signaturePadRef.current?.clear();
  }, [active]);

  const searchByPhone = useCallback(async (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 9) {
      setErr("กรอกเบอร์อย่างน้อย 9 หลัก");
      return;
    }
    setErr(null);
    setMsg(null);
    setSearching(true);
    try {
      const res = await fetch(`/api/laundry/customers/search?phone=${encodeURIComponent(digits)}`, {
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        customer?: { name: string | null } | null;
        subscriptions?: SubRow[];
        error?: string;
      };
      if (!res.ok) {
        setErr(data.error ?? "ค้นหาไม่สำเร็จ");
        setSubs([]);
        setCustomerName(null);
        setSelectedSubId(null);
        return;
      }
      setCustomerName(data.customer?.name ?? null);
      setSubs(data.subscriptions ?? []);
      setSelectedSubId(data.subscriptions?.[0]?.id ?? null);
      signaturePadRef.current?.clear();
    } finally {
      setSearching(false);
    }
  }, []);

  async function onDeduct() {
    if (!selectedSubId) {
      setErr("เลือกแพ็กที่จะหักครั้ง");
      return;
    }
    if (signaturePadRef.current?.isEmpty()) {
      setErr("ให้ลูกค้าลงชื่อด้วยปากกาหรือนิ้วก่อนหักแพ็ก");
      return;
    }
    setErr(null);
    setMsg(null);
    setDeducting(true);
    try {
      const blob = await signaturePadRef.current?.toPngBlob();
      if (!blob) {
        setErr("ให้ลูกค้าลงชื่อด้วยปากกาหรือนิ้วก่อนหักแพ็ก");
        return;
      }
      const signatureImageUrl = await uploadLaundrySignatureBlob(blob);
      const res = await fetch("/api/laundry/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subscriptionId: selectedSubId, signatureImageUrl }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        remainingSessions?: number;
        status?: string;
      };
      if (!res.ok) {
        setErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setMsg(`หัก 1 ครั้งแล้ว — เหลือ ${data.remainingSessions ?? 0} ครั้ง`);
      setSubs((prev) =>
        prev.map((s) =>
          s.id === selectedSubId
            ? { ...s, remainingSessions: data.remainingSessions ?? 0, status: data.status ?? s.status }
            : s,
        ),
      );
      signaturePadRef.current?.clear();
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setDeducting(false);
    }
  }

  const searchShellClass = modal
    ? "rounded-lg border border-sky-100 bg-sky-50/40 p-4"
    : "relative overflow-hidden rounded-xl border border-sky-200/85 bg-gradient-to-br from-sky-50/95 via-white to-indigo-50/45 p-4 shadow-sm sm:p-5";

  const resultShellClass = modal
    ? "rounded-lg border border-slate-200 bg-slate-50/60 p-4"
    : "rounded-xl border border-[#e0dcf5] bg-white p-4 shadow-sm sm:p-5";

  const subPickClass = modal
    ? "flex cursor-pointer items-center gap-3 rounded-lg border bg-white px-4 py-3 transition hover:border-[#5b61ff]/40"
    : "flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-white px-4 py-3.5 shadow-sm transition hover:border-[#5b61ff]/40";

  return (
    <>
      {err ? <p className={laundryInlineAlertErrorClass}>{err}</p> : null}
      {msg ? (
        <p className={cn(laundryCardSurfaceRadiusClass, "bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900")}>
          {msg}
        </p>
      ) : null}

      <section className={laundrySectionFirstClass} aria-label="ค้นหาลูกค้า">
        <div className={searchShellClass}>
          <div className="relative">
            {!modal ? (
              <div className="min-w-0">
                <h2 className="text-lg font-bold tracking-tight text-sky-950">ค้นหาลูกค้า</h2>
                <p className={laundrySubtitleClass}>กรอกเบอร์ 9 หลักขึ้นไป แล้วเลือกแพ็กเพื่อหักครั้ง</p>
              </div>
            ) : null}
            <form
              className={cn("flex flex-col gap-3 sm:flex-row sm:items-stretch", modal ? "mt-0" : "mt-5")}
              onSubmit={(e) => {
                e.preventDefault();
                void searchByPhone(phone);
              }}
            >
              <div className="relative min-w-0 flex-1">
                <span
                  className="pointer-events-none absolute inset-y-0 left-0 z-[1] flex w-11 items-center justify-center text-sky-600/80"
                  aria-hidden
                >
                  <IconSearch className="h-5 w-5 shrink-0" />
                </span>
                <input
                  className="app-input min-h-[48px] w-full rounded-lg border-sky-200/90 bg-white py-3 !pl-11 pr-3 text-base font-medium text-[#1e293b] placeholder:text-slate-400 focus:border-sky-400 focus:ring-sky-400/25"
                  inputMode="numeric"
                  placeholder="เบอร์โทรลูกค้า"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                  aria-label="เบอร์โทรลูกค้า"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="app-btn-primary inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold text-white disabled:opacity-60 sm:min-w-[7.5rem]"
              >
                {searching ? "กำลังค้นหา…" : "ค้นหา"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {(customerName !== null || subs.length > 0) && (
        <section className={laundrySectionNextClass} aria-label="ผลค้นหา">
          <div className={resultShellClass}>
            <h3 className="text-base font-bold text-[#2e2a58]">ผลค้นหา</h3>
            {customerName ? (
              <p className="mt-2 text-sm font-medium text-[#5f5a8a]">
                ชื่อลูกค้า: <span className="text-[#2e2a58]">{customerName}</span>
              </p>
            ) : phone.length >= 9 ? (
              <p className="mt-2 text-xs text-[#66638c]">ยังไม่มีชื่อ — ใส่ตอนขายแพ็ก</p>
            ) : null}

            {subs.length === 0 && phone.length >= 9 && !searching ? (
              <div className="mt-4 rounded-[1.25rem] border border-amber-200/90 bg-amber-50/90 px-3 py-2.5 text-sm font-medium text-amber-950">
                <p>ไม่มีแพ็กที่ใช้ได้</p>
                {onRequestSell ? (
                  <button
                    type="button"
                    onClick={onRequestSell}
                    className="mt-2 text-sm font-bold text-[#4d47b6] underline underline-offset-2 hover:text-[#5b61ff]"
                  >
                    เปิดขายแพ็กเหมา
                  </button>
                ) : (
                  <p className="mt-1 text-xs">กดปุ่ม «ขายแพ็ก» ที่แถบเมนูด้านบน</p>
                )}
              </div>
            ) : null}

            {subs.length > 0 ? (
              <div className="mt-4 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#8b87ad]">เลือกแพ็กเพื่อหักครั้ง</p>
                {subs.map((s) => (
                  <label
                    key={s.id}
                    className={cn(
                      subPickClass,
                      selectedSubId === s.id ? "border-[#5b61ff] ring-1 ring-[#5b61ff]/15" : "border-slate-200",
                    )}
                  >
                    <input
                      type="radio"
                      name="laundry-subpick"
                      checked={selectedSubId === s.id}
                      onChange={() => setSelectedSubId(s.id)}
                      className="h-5 w-5 accent-[#5b61ff]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#2e2a58]">{s.packageName}</p>
                      <p className="mt-0.5 text-lg font-black tabular-nums text-[#4d47b6]">เหลือ {s.remainingSessions} ครั้ง</p>
                    </div>
                  </label>
                ))}
              </div>
            ) : null}

            {subs.length > 0 ? (
              <div className="mt-4">
                <AppSignaturePad ref={signaturePadRef} disabled={deducting} />
              </div>
            ) : null}

            <button
              type="button"
              disabled={deducting || !selectedSubId || subs.length === 0}
              onClick={() => void onDeduct()}
              className="mt-5 flex min-h-[48px] w-full items-center justify-center rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 py-3 text-sm font-bold text-white transition hover:brightness-[1.03] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45"
            >
              {deducting ? "กำลังบันทึก…" : "หัก 1 ครั้งจากแพ็ก (รับผ้า)"}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
