"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type {
  InvestigationLogDto,
  InvestigationReportDto,
  SuspectDto,
  SuspectRiskLevel,
} from "@/lib/smart-police/investigation/types";
import {
  LOG_ACTIVITY_LABELS,
  SUSPECT_RISK_LEVELS,
} from "@/lib/smart-police/investigation/types";

const TAB_KEYS = ["suspects", "logs", "reports"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  suspects: "บุคคลต้องสงสัย",
  logs: "ประวัติการสืบ",
  reports: "รายงาน",
};

const RISK_LABEL: Record<SuspectRiskLevel, string> = { HIGH: "สูง", MEDIUM: "กลาง", LOW: "ต่ำ" };
const RISK_CLASS: Record<SuspectRiskLevel, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-800",
  LOW: "bg-cyan-100 text-cyan-800",
};

const inputClass = "h-9 w-full rounded-md border border-slate-300 px-2 text-sm";
const labelClass = "block text-[11px] font-semibold text-slate-600";

type CaseOption = { id: string; caseNumber: string; title: string };

export function SmartPoliceInvestigationHub({ initialTab }: { initialTab?: string }) {
  const [tab, setTab] = useState<TabKey>(
    TAB_KEYS.includes(initialTab as TabKey) ? (initialTab as TabKey) : "suspects",
  );

  const [suspects, setSuspects] = useState<SuspectDto[]>([]);
  const [logs, setLogs] = useState<InvestigationLogDto[]>([]);
  const [reports, setReports] = useState<InvestigationReportDto[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [dialog, setDialog] = useState<null | "suspect" | "log" | "report">(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, l, r, c] = await Promise.all([
        fetch("/api/smart-police/investigation/suspects", { cache: "no-store" }),
        fetch("/api/smart-police/investigation/logs", { cache: "no-store" }),
        fetch("/api/smart-police/investigation/reports", { cache: "no-store" }),
        fetch("/api/smart-police/cases", { cache: "no-store" }),
      ]);
      if (s.ok) setSuspects(((await s.json()) as { suspects: SuspectDto[] }).suspects ?? []);
      if (l.ok) setLogs(((await l.json()) as { logs: InvestigationLogDto[] }).logs ?? []);
      if (r.ok) setReports(((await r.json()) as { reports: InvestigationReportDto[] }).reports ?? []);
      if (c.ok) {
        const data = (await c.json()) as { cases: CaseOption[] };
        setCases(data.cases ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const filteredSuspects = useMemo(() => {
    const needle = q.trim();
    if (!needle) return suspects;
    return suspects.filter((s) =>
      [s.fullName, s.alias, s.nickname, s.nationalId, s.phone].some((v) => v?.includes(needle)),
    );
  }, [suspects, q]);

  const caseNumber = (id: string | null) =>
    id ? (cases.find((x) => x.id === id)?.caseNumber ?? "—") : "—";

  const addLabel = tab === "suspects" ? "เพิ่มบุคคล" : tab === "logs" ? "บันทึกการสืบ" : "เขียนรายงาน";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
        <h1 className="text-sm font-bold text-[#1e1b4b]">สืบสวน</h1>
        <nav className="ml-2 flex gap-1">
          {TAB_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              aria-current={tab === k ? "page" : undefined}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-semibold",
                tab === k ? "bg-[#eef2ff] text-[#4338ca]" : "text-slate-500 hover:bg-slate-100",
              )}
            >
              {TAB_LABELS[k]}
              <span className="ml-1 text-[10px] text-slate-400">
                {k === "suspects" ? suspects.length : k === "logs" ? logs.length : reports.length}
              </span>
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href="/dashboard/smart-police/investigation/graph"
            className="h-8 rounded-md border border-slate-300 px-2 text-[11px] font-semibold leading-8 text-slate-700 hover:bg-slate-50"
          >
            ผังเชื่อมโยง
          </Link>
          <button
            type="button"
            onClick={() => void loadAll()}
            className="h-8 rounded-md border border-slate-300 px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            disabled={loading}
          >
            {loading ? "…" : "รีเฟรช"}
          </button>
          <button
            type="button"
            onClick={() => setDialog(tab === "suspects" ? "suspect" : tab === "logs" ? "log" : "report")}
            className="h-8 rounded-md bg-[#4f46e5] px-3 text-[11px] font-bold text-white hover:bg-[#4338ca]"
          >
            + {addLabel}
          </button>
        </div>
      </div>

      {message ? (
        <p className="border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800">{message}</p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "suspects" ? (
          <>
            <div className="px-3 py-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหา ชื่อ ฉายา เลขบัตร เบอร์"
                className={inputClass}
              />
            </div>
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-1.5">ชื่อ</th>
                  <th className="px-3 py-1.5">ฉายา</th>
                  <th className="px-3 py-1.5">ระดับ</th>
                  <th className="px-3 py-1.5">คดี</th>
                  <th className="px-3 py-1.5">เส้น</th>
                  <th className="px-3 py-1.5">พิกัด</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuspects.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-1.5">
                      <Link
                        href={`/dashboard/smart-police/investigation/suspects/${s.id}`}
                        className="font-semibold text-[#1e1b4b] underline-offset-2 hover:underline"
                      >
                        {s.fullName}
                      </Link>
                    </td>
                    <td className="px-3 py-1.5 text-slate-600">{s.alias ?? "—"}</td>
                    <td className="px-3 py-1.5">
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", RISK_CLASS[s.riskLevel])}>
                        {RISK_LABEL[s.riskLevel]}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-slate-600">
                      {s.caseIds.length ? `${s.caseIds.length} คดี` : "—"}
                    </td>
                    <td className="px-3 py-1.5 text-slate-600">{s.linkCount || "—"}</td>
                    <td className="px-3 py-1.5 text-slate-600">
                      {s.addresses.length ? `${s.addresses.length} จุด` : "—"}
                    </td>
                  </tr>
                ))}
                {filteredSuspects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                      {loading ? "กำลังโหลด…" : "ยังไม่มีข้อมูล"}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </>
        ) : null}

        {tab === "logs" ? (
          <ul className="divide-y divide-slate-100">
            {logs.map((l) => (
              <li key={l.id} className="px-3 py-2 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-bold text-[#4f46e5]">{LOG_ACTIVITY_LABELS[l.activity]}</span>
                  <span>{new Date(l.occurredAt).toLocaleString("th-TH")}</span>
                  {l.suspectName ? <span>· {l.suspectName}</span> : null}
                  {l.caseId ? <span>· {caseNumber(l.caseId)}</span> : null}
                </div>
                <p className="text-slate-800">{l.result}</p>
              </li>
            ))}
            {logs.length === 0 ? (
              <li className="px-3 py-8 text-center text-xs text-slate-500">
                {loading ? "กำลังโหลด…" : "ยังไม่มีประวัติ"}
              </li>
            ) : null}
          </ul>
        ) : null}

        {tab === "reports" ? (
          <ul className="divide-y divide-slate-100">
            {reports.map((r) => (
              <li key={r.id} className="px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-[#1e1b4b]">{r.title}</span>
                  {r.reportNo ? (
                    <span className="rounded bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-600">
                      {r.reportNo}
                    </span>
                  ) : null}
                  <span className="ml-auto text-[11px] text-slate-500">
                    {new Date(r.reportedAt).toLocaleDateString("th-TH")}
                  </span>
                </div>
                {r.summary ? <p className="text-xs text-slate-700">{r.summary}</p> : null}
                <p className="text-[11px] text-slate-500">
                  {caseNumber(r.caseId)}
                  {r.officerName ? ` · ${r.officerName}` : ""}
                </p>
              </li>
            ))}
            {reports.length === 0 ? (
              <li className="px-3 py-8 text-center text-xs text-slate-500">
                {loading ? "กำลังโหลด…" : "ยังไม่มีรายงาน"}
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      {dialog === "suspect" ? (
        <Dialog title="เพิ่มบุคคลต้องสงสัย" onClose={() => setDialog(null)}>
          <SuspectForm
            cases={cases}
            onSaved={(msg) => {
              setMessage(msg);
              setDialog(null);
              void loadAll();
            }}
          />
        </Dialog>
      ) : null}
      {dialog === "log" ? (
        <Dialog title="บันทึกการสืบ" onClose={() => setDialog(null)}>
          <LogForm
            cases={cases}
            suspects={suspects}
            onSaved={(msg) => {
              setMessage(msg);
              setDialog(null);
              void loadAll();
            }}
          />
        </Dialog>
      ) : null}
      {dialog === "report" ? (
        <Dialog title="เขียนรายงานการสืบสวน" onClose={() => setDialog(null)}>
          <ReportForm
            cases={cases}
            onSaved={(msg) => {
              setMessage(msg);
              setDialog(null);
              void loadAll();
            }}
          />
        </Dialog>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- dialog */

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-label={title}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-[#1e1b4b]">{title}</p>
          <button type="button" onClick={onClose} className="text-xs text-slate-500" aria-label="ปิด">
            ปิด
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- forms */

function SuspectForm({ cases, onSaved }: { cases: CaseOption[]; onSaved: (msg: string) => void }) {
  const [form, setForm] = useState({
    fullName: "",
    alias: "",
    nickname: "",
    nationalId: "",
    phone: "",
    occupation: "",
    description: "",
    riskLevel: "MEDIUM" as SuspectRiskLevel,
    caseIds: [] as string[],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadNote, setUploadNote] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/smart-police/investigation/suspects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(b?.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      const created = (await res.json()) as { suspect: { id: string } };

      // อัปโหลดรูปที่เลือกไว้ (ถ้ามี) — บุคคลถูกสร้างแล้วจึงแนบรูปได้
      if (files.length > 0) {
        setUploadNote("กำลังอัปโหลดรูป…");
        let failed = 0;
        for (const file of files) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("kind", "FRONT");
          const up = await fetch(
            `/api/smart-police/investigation/suspects/${created.suspect.id}/photos`,
            { method: "POST", body: fd },
          );
          if (!up.ok) failed++;
        }
        onSaved(
          failed === 0
            ? `เพิ่มบุคคลแล้ว · แนบรูป ${files.length} รูป`
            : `เพิ่มบุคคลแล้ว · อัปโหลดรูปไม่สำเร็จ ${failed} รูป`,
        );
        return;
      }
      onSaved("เพิ่มบุคคลแล้ว");
    } finally {
      setBusy(false);
      setUploadNote(null);
    }
  }

  return (
    <div className="space-y-2">
      <label className={labelClass}>
        ชื่อ-นามสกุล *
        <input
          autoFocus
          className={inputClass}
          value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className={labelClass}>
          ฉายา
          <input
            className={inputClass}
            value={form.alias}
            onChange={(e) => setForm((f) => ({ ...f, alias: e.target.value }))}
          />
        </label>
        <label className={labelClass}>
          ระดับ
          <select
            className={inputClass}
            value={form.riskLevel}
            onChange={(e) => setForm((f) => ({ ...f, riskLevel: e.target.value as SuspectRiskLevel }))}
          >
            {SUSPECT_RISK_LEVELS.map((r) => (
              <option key={r} value={r}>
                {RISK_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className={labelClass}>
          เลขบัตร
          <input
            className={inputClass}
            value={form.nationalId}
            onChange={(e) => setForm((f) => ({ ...f, nationalId: e.target.value }))}
          />
        </label>
        <label className={labelClass}>
          เบอร์โทร
          <input
            className={inputClass}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </label>
      </div>
      <label className={labelClass}>
        รูปพรรณ
        <textarea
          className="min-h-[56px] w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </label>
      <div>
        <p className={labelClass}>ผูกคดี</p>
        <div className="max-h-24 space-y-0.5 overflow-y-auto rounded-md border border-slate-300 px-2 py-1">
          {cases.length === 0 ? <p className="text-xs text-slate-500">ยังไม่มีคดี</p> : null}
          {cases.map((c) => {
            const checked = form.caseIds.includes(c.id);
            return (
              <label key={c.id} className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setForm((f) => ({
                      ...f,
                      caseIds: checked ? f.caseIds.filter((x) => x !== c.id) : [...f.caseIds, c.id],
                    }))
                  }
                />
                {c.caseNumber}
              </label>
            );
          })}
        </div>
      </div>
      <div className="rounded-lg border border-dashed border-slate-300 p-2">
        <p className="text-[11px] font-semibold text-slate-600">รูปภาพ</p>
        <div className="mt-1 flex gap-2">
          <label className="flex-1 cursor-pointer rounded-md border border-slate-300 px-2 py-1.5 text-center text-[11px] font-semibold text-slate-700 hover:bg-slate-50">
            เลือกรูป
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              disabled={busy}
              onChange={(e) => {
                setFiles(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
              className="hidden"
            />
          </label>
          <label className="flex-1 cursor-pointer rounded-md border border-slate-300 px-2 py-1.5 text-center text-[11px] font-semibold text-slate-700 hover:bg-slate-50">
            ถ่ายรูป
            <input
              type="file"
              accept="image/*"
              capture="environment"
              disabled={busy}
              onChange={(e) => {
                setFiles(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
              className="hidden"
            />
          </label>
        </div>
        {files.length > 0 ? (
          <ul className="mt-1 space-y-1">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                {previews[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previews[i]} alt="" className="h-8 w-8 rounded border border-slate-200 object-cover" />
                ) : null}
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <span className="shrink-0 text-slate-400">{Math.max(1, Math.round(f.size / 1024))} KB</span>
                <button
                  type="button"
                  className="shrink-0 text-red-600"
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  ลบ
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {uploadNote ? <p className="text-[11px] text-amber-700">{uploadNote}</p> : null}
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <SubmitButton busy={busy} disabled={!form.fullName.trim()} onClick={() => void submit()} />
    </div>
  );
}

function LogForm({
  cases,
  suspects,
  onSaved,
}: {
  cases: CaseOption[];
  suspects: SuspectDto[];
  onSaved: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    occurredAt: new Date().toISOString().slice(0, 16),
    place: "",
    officerName: "",
    activity: "SURVEILLANCE" as keyof typeof LOG_ACTIVITY_LABELS,
    result: "",
    suspectId: "",
    caseId: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/smart-police/investigation/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, occurredAt: new Date(form.occurredAt).toISOString() }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(b?.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      onSaved("บันทึกแล้ว");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className={labelClass}>
          วันเวลา
          <input
            type="datetime-local"
            className={inputClass}
            value={form.occurredAt}
            onChange={(e) => setForm((f) => ({ ...f, occurredAt: e.target.value }))}
          />
        </label>
        <label className={labelClass}>
          กิจกรรม
          <select
            className={inputClass}
            value={form.activity}
            onChange={(e) =>
              setForm((f) => ({ ...f, activity: e.target.value as keyof typeof LOG_ACTIVITY_LABELS }))
            }
          >
            {Object.entries(LOG_ACTIVITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className={labelClass}>
          บุคคล
          <select
            className={inputClass}
            value={form.suspectId}
            onChange={(e) => setForm((f) => ({ ...f, suspectId: e.target.value }))}
          >
            <option value="">—</option>
            {suspects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          คดี
          <select
            className={inputClass}
            value={form.caseId}
            onChange={(e) => setForm((f) => ({ ...f, caseId: e.target.value }))}
          >
            <option value="">—</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.caseNumber}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className={labelClass}>
          สถานที่
          <input
            className={inputClass}
            value={form.place}
            onChange={(e) => setForm((f) => ({ ...f, place: e.target.value }))}
          />
        </label>
        <label className={labelClass}>
          ผู้ลงสืบ
          <input
            className={inputClass}
            value={form.officerName}
            onChange={(e) => setForm((f) => ({ ...f, officerName: e.target.value }))}
          />
        </label>
      </div>
      <label className={labelClass}>
        ผล *
        <textarea
          autoFocus
          className="min-h-[64px] w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          value={form.result}
          onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
        />
      </label>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <SubmitButton busy={busy} disabled={!form.result.trim()} onClick={() => void submit()} />
    </div>
  );
}

function ReportForm({ cases, onSaved }: { cases: CaseOption[]; onSaved: (msg: string) => void }) {
  const [form, setForm] = useState({
    title: "",
    reportNo: "",
    officerName: "",
    caseId: "",
    summary: "",
    body: "",
    finding: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/smart-police/investigation/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(b?.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      onSaved("บันทึกรายงานแล้ว");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className={labelClass}>
        ชื่อรายงาน *
        <input
          autoFocus
          className={inputClass}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className={labelClass}>
          เลขที่
          <input
            className={inputClass}
            value={form.reportNo}
            onChange={(e) => setForm((f) => ({ ...f, reportNo: e.target.value }))}
          />
        </label>
        <label className={labelClass}>
          คดี
          <select
            className={inputClass}
            value={form.caseId}
            onChange={(e) => setForm((f) => ({ ...f, caseId: e.target.value }))}
          >
            <option value="">—</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.caseNumber}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={labelClass}>
        สรุป
        <input
          className={inputClass}
          value={form.summary}
          onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
        />
      </label>
      <label className={labelClass}>
        รายละเอียด
        <textarea
          className="min-h-[72px] w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
        />
      </label>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <SubmitButton busy={busy} disabled={!form.title.trim()} onClick={() => void submit()} />
    </div>
  );
}

function SubmitButton({
  busy,
  disabled,
  onClick,
}: {
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy || disabled}
      onClick={onClick}
      className="h-9 w-full rounded-md bg-[#4f46e5] text-sm font-bold text-white hover:bg-[#4338ca] disabled:opacity-50"
    >
      {busy ? "กำลังบันทึก…" : "บันทึก"}
    </button>
  );
}
