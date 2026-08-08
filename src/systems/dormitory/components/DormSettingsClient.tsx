"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AppSlipPaperSizeSettingsField,
  type AppSlipPaperSize,
} from "@/components/app-templates";
import { dormBtnPrimary } from "@/systems/dormitory/dorm-ui";
import { cn } from "@/lib/cn";
import { normalizeModuleSlipPaperSize } from "@/lib/profile/module-slip-paper-size";

export function DormSettingsClient() {
  const [paper, setPaper] = useState<AppSlipPaperSize>("SLIP_58");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/dorm/profile", { credentials: "include", cache: "no-store" })
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as {
          profile?: { defaultPaperSize?: string | null };
        };
        if (cancelled || !r.ok) return;
        setPaper(normalizeModuleSlipPaperSize(j.profile?.defaultPaperSize));
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const savePaper = useCallback(async (next: AppSlipPaperSize) => {
    setPaper(next);
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/dorm/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultPaperSize: next }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "บันทึกไม่สำเร็จ");
      setMsg("บันทึกขนาดสลิปแล้ว");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <div className="space-y-4 text-sm text-slate-700">
      <AppSlipPaperSizeSettingsField
        fieldClassName="app-input mt-1 w-full rounded-xl"
        hint="ใช้ตอนพิมพ์ใบแจ้งหนี้ / ใบเสร็จหอพัก · เฉพาะโมดูลหอพัก"
        value={paper}
        onChange={(next) => void savePaper(next)}
        disabled={!loaded || busy}
      />
      {err ? <p className="text-xs font-semibold text-rose-600">{err}</p> : null}
      {msg ? <p className="text-xs font-semibold text-emerald-700">{msg}</p> : null}
      <div className="space-y-2">
        <p className="font-semibold leading-snug text-slate-900">ช่องทางชำระและข้อมูลร้าน/บริษัท</p>
        <p className="text-[13px] leading-relaxed text-[#66638c]">
          ตั้งค่าเบอร์พร้อมเพย์ ช่องทางชำระ และข้อมูลร้าน ได้ที่หน้าโปรไฟล์ส่วนกลาง
        </p>
        <Link href="/dashboard/profile" className={cn(dormBtnPrimary, "mt-1 inline-flex w-full justify-center sm:w-auto")}>
          ไปโปรไฟล์ส่วนกลาง
        </Link>
      </div>
    </div>
  );
}
