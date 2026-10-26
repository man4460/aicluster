"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  applyCaseValues,
  buildCaseFieldValues,
  type FillSourceCase,
  type FillSourcePreset,
} from "@/lib/smart-police/case-presets/fill-form-from-case";
import type { SmartPoliceCaseListItem } from "@/lib/smart-police/types";

const barBtnClass =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-slate-600 bg-slate-700 px-2 text-[11px] font-semibold text-white hover:bg-slate-600 disabled:opacity-50";

/**
 * แถบเครื่องมือ "ดึงข้อมูลตั้งต้นจากคดี" สำหรับหน้า preview แม่แบบ
 *
 * - เลือกคดีจาก ?caseId= (ถ้ามี) หรือจาก dropdown
 * - ปุ่มดึงข้อมูล: เติมเฉพาะช่องว่าง (ไม่ทับข้อความที่พิมพ์ไว้) — กดซ้ำด้วย Shift เพื่อทับทั้งหมด
 */
export function SmartPoliceCaseFillBar<T extends Record<string, unknown>>({
  fields,
  onFilled,
  preset,
  caseId,
}: {
  fields: T;
  onFilled: (next: T) => void;
  preset?: FillSourcePreset;
  caseId?: string;
}) {
  const [cases, setCases] = useState<SmartPoliceCaseListItem[]>([]);
  const [selectedId, setSelectedId] = useState(caseId ?? "");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/smart-police/cases", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { cases: SmartPoliceCaseListItem[] };
        if (cancelled) return;
        setCases(data.cases ?? []);
        if (!selectedId && data.cases?.length === 1) setSelectedId(data.cases[0]!.id);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => cases.find((c) => c.id === selectedId) ?? null,
    [cases, selectedId],
  );

  async function fill(overwrite: boolean) {
    if (!selectedId) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/smart-police/cases/${selectedId}`, { cache: "no-store" });
      if (!res.ok) {
        setMessage("โหลดข้อมูลคดีไม่สำเร็จ");
        return;
      }
      const data = (await res.json()) as { case: FillSourceCase };
      const values = buildCaseFieldValues(data.case, preset ?? null);
      const { next, filled, skipped } = applyCaseValues(fields, values, { overwrite });
      onFilled(next);
      setMessage(
        filled === 0
          ? `ไม่มีช่องว่างให้เติม (ข้าม ${skipped} ช่องที่มีข้อความแล้ว)`
          : `เติม ${filled} ช่อง${skipped ? ` · ข้าม ${skipped} ช่องที่มีข้อความ` : ""}`,
      );
    } catch {
      setMessage("ดึงข้อมูลคดีไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <select
        className="h-8 max-w-[13rem] shrink-0 rounded-md border border-slate-600 bg-slate-700 px-1.5 text-[11px] font-semibold text-white"
        value={selectedId}
        onChange={(e) => {
          setSelectedId(e.target.value);
          setMessage(null);
        }}
        aria-label="เลือกคดีที่จะดึงข้อมูล"
        disabled={loading || cases.length === 0}
      >
        <option value="">
          {loading ? "กำลังโหลดคดี…" : cases.length === 0 ? "ยังไม่มีคดี" : "— เลือกคดี —"}
        </option>
        {cases.map((c) => (
          <option key={c.id} value={c.id}>
            {c.caseNumber} · {c.title}
          </option>
        ))}
      </select>
      <button
        type="button"
        className={cn(barBtnClass, "gap-1")}
        disabled={!selectedId || busy || !selected}
        title="ดึงข้อมูลตั้งต้นจากคดี (กด Shift เพื่อทับข้อความที่มีอยู่)"
        onClick={(e) => void fill(e.shiftKey)}
      >
        {busy ? "กำลังดึง…" : "ดึงข้อมูลจากคดี"}
      </button>
      {message ? (
        <span className="shrink-0 text-[11px] font-semibold text-amber-200" role="status">
          {message}
        </span>
      ) : null}
    </>
  );
}
