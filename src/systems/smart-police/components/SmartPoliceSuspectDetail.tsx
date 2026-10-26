"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type {
  InvestigationLogDto,
  LinkDto,
  SuspectDto,
  SuspectRiskLevel,
} from "@/lib/smart-police/investigation/types";
import {
  ADDRESS_KINDS,
  ADDRESS_KIND_LABELS,
  LINK_KIND_LABELS,
  LOG_ACTIVITY_LABELS,
  SUSPECT_RISK_LEVELS,
} from "@/lib/smart-police/investigation/types";
import { cn } from "@/lib/cn";
import {
  SUSPECT_PHOTO_KINDS,
  SUSPECT_PHOTO_KIND_LABELS,
  type SuspectPhotoDto,
  type SuspectPhotoKind,
} from "@/lib/smart-police/investigation/photo-types";

const RISK_LABEL: Record<SuspectRiskLevel, string> = { HIGH: "สูง", MEDIUM: "กลาง", LOW: "ต่ำ" };
const inputClass = "h-9 w-full rounded-md border border-slate-300 px-2 text-sm";
const labelClass = "block text-[11px] font-semibold text-slate-600";

export function SmartPoliceSuspectDetail({ suspectId }: { suspectId: string }) {
  const [suspect, setSuspect] = useState<SuspectDto | null>(null);
  const [logs, setLogs] = useState<InvestigationLogDto[]>([]);
  const [links, setLinks] = useState<LinkDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, l, k] = await Promise.all([
        fetch(`/api/smart-police/investigation/suspects/${suspectId}`, { cache: "no-store" }),
        fetch(`/api/smart-police/investigation/logs?suspectId=${suspectId}`, { cache: "no-store" }),
        fetch("/api/smart-police/investigation/links", { cache: "no-store" }),
      ]);
      if (s.ok) setSuspect(((await s.json()) as { suspect: SuspectDto }).suspect);
      if (l.ok) setLogs(((await l.json()) as { logs: InvestigationLogDto[] }).logs ?? []);
      if (k.ok) {
        const all = ((await k.json()) as { links: LinkDto[] }).links ?? [];
        setLinks(all.filter((x) => x.fromId === suspectId || x.toId === suspectId));
      }
    } finally {
      setLoading(false);
    }
  }, [suspectId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateRisk(riskLevel: SuspectRiskLevel) {
    await fetch(`/api/smart-police/investigation/suspects/${suspectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ riskLevel }),
    });
    void load();
  }

  if (loading && !suspect) return <p className="p-4 text-sm text-slate-500">กำลังโหลด…</p>;
  if (!suspect) {
    return (
      <p className="p-4 text-sm text-slate-500">
        ไม่พบข้อมูล ·{" "}
        <Link href="/dashboard/smart-police/investigation" className="underline">
          กลับ
        </Link>
      </p>
    );
  }

  const addresses = suspect.addresses;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2">
        <Link href="/dashboard/smart-police/investigation" className="text-xs text-[#4d47b6] underline">
          ← สืบสวน
        </Link>
        <h1 className="text-sm font-bold text-[#1e1b4b]">{suspect.fullName}</h1>
        {suspect.alias ? <span className="text-[11px] text-slate-500">({suspect.alias})</span> : null}
        <div className="ml-auto flex items-center gap-1.5">
          <select
            className="h-8 rounded-md border border-slate-300 px-1.5 text-[11px]"
            value={suspect.riskLevel}
            onChange={(e) => void updateRisk(e.target.value as SuspectRiskLevel)}
            aria-label="ระดับความเสี่ยง"
          >
            {SUSPECT_RISK_LEVELS.map((r) => (
              <option key={r} value={r}>
                {RISK_LABEL[r]}
              </option>
            ))}
          </select>
          <Link
            href="/dashboard/smart-police/investigation/graph"
            className="h-8 rounded-md border border-slate-300 px-2 text-[11px] font-semibold leading-8 text-slate-700 hover:bg-slate-50"
          >
            ผัง
          </Link>
          <button
            type="button"
            onClick={() => setPhotoOpen(true)}
            className="h-8 rounded-md border border-slate-300 px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            รูป ({suspect.photos.length})
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-8 rounded-md bg-[#4f46e5] px-3 text-[11px] font-bold text-white hover:bg-[#4338ca]"
          >
            + พิกัด
          </button>
        </div>
      </div>

      {message ? (
        <p className="border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800">{message}</p>
      ) : null}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        <section>
          <h2 className="mb-1 text-[11px] font-bold uppercase text-slate-500">
            รูปภาพ ({suspect.photos.length})
          </h2>
          {suspect.photos.length === 0 ? (
            <button
              type="button"
              onClick={() => setPhotoOpen(true)}
              className="rounded border border-dashed border-slate-300 px-3 py-4 text-xs text-slate-500 hover:bg-slate-50"
            >
              + เพิ่มรูป
            </button>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {suspect.photos.map((ph) => (
                <li key={ph.id}>
                  <button type="button" onClick={() => setPhotoOpen(true)} className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ph.url}
                      alt={ph.caption ?? SUSPECT_PHOTO_KIND_LABELS[ph.kind]}
                      className="h-20 w-20 rounded border border-slate-200 object-cover"
                    />
                    <span className="block text-center text-[10px] text-slate-500">
                      {SUSPECT_PHOTO_KIND_LABELS[ph.kind]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-1 text-[11px] font-bold uppercase text-slate-500">ข้อมูล</h2>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-4">
            <dt className="text-slate-500">เลขบัตร</dt>
            <dd>{suspect.nationalId ?? "—"}</dd>
            <dt className="text-slate-500">เบอร์โทร</dt>
            <dd>{suspect.phone ?? "—"}</dd>
            <dt className="text-slate-500">อาชีพ</dt>
            <dd>{suspect.occupation ?? "—"}</dd>
            <dt className="text-slate-500">คดี</dt>
            <dd>{suspect.caseIds.length}</dd>
          </dl>
          {suspect.description ? (
            <p className="mt-1 rounded bg-slate-50 px-2 py-1 text-xs text-slate-700">{suspect.description}</p>
          ) : null}
        </section>

        <section>
          <h2 className="mb-1 text-[11px] font-bold uppercase text-slate-500">พิกัดที่อยู่ ({addresses.length})</h2>
          <ul className="space-y-1">
            {addresses.map((a) => (
              <li key={a.id} className="rounded border border-slate-200 px-2 py-1 text-xs">
                <span className="mr-1 rounded bg-slate-100 px-1 text-[10px] font-bold text-[#4f46e5]">
                  {ADDRESS_KIND_LABELS[a.kind]}
                </span>
                <span className="font-semibold">{a.label ?? a.address}</span>
                {a.label ? <span className="ml-1 text-slate-600">{a.address}</span> : null}
                {a.latitude != null ? (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${a.latitude}&mlon=${a.longitude}#map=17/${a.latitude}/${a.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 text-[10px] text-[#4d47b6] underline"
                  >
                    {a.latitude.toFixed(4)}, {a.longitude?.toFixed(4)}
                  </a>
                ) : null}
              </li>
            ))}
            {addresses.length === 0 ? <li className="text-xs text-slate-500">ยังไม่มีพิกัด</li> : null}
          </ul>
        </section>

        <section>
          <h2 className="mb-1 text-[11px] font-bold uppercase text-slate-500">ประวัติการสืบ ({logs.length})</h2>
          <ol className="space-y-1">
            {logs.map((l) => (
              <li key={l.id} className="rounded border border-slate-200 px-2 py-1 text-xs">
                <span className="font-bold text-[#4f46e5]">{LOG_ACTIVITY_LABELS[l.activity]}</span>{" "}
                <span className="text-slate-500">{new Date(l.occurredAt).toLocaleString("th-TH")}</span>
                <p className="text-slate-800">{l.result}</p>
              </li>
            ))}
            {logs.length === 0 ? <li className="text-xs text-slate-500">ยังไม่มี</li> : null}
          </ol>
        </section>

        <section>
          <h2 className="mb-1 text-[11px] font-bold uppercase text-slate-500">ความเชื่อมโยง ({links.length})</h2>
          <ul className="flex flex-wrap gap-1">
            {links.map((l) => {
              const isFrom = l.fromId === suspectId;
              return (
                <li
                  key={l.id}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[11px]",
                    isFrom ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700",
                  )}
                >
                  {isFrom ? "→" : "←"} {isFrom ? l.toName : l.fromName} · {LINK_KIND_LABELS[l.kind]}
                </li>
              );
            })}
            {links.length === 0 ? <li className="text-xs text-slate-500">ยังไม่มี</li> : null}
          </ul>
        </section>
      </div>

      {photoOpen ? (
        <PhotoDialog
          suspectId={suspectId}
          photos={suspect.photos}
          onClose={() => setPhotoOpen(false)}
          onChanged={() => {
            setMessage("อัปเดตรูปแล้ว");
            void load();
          }}
          onError={setMessage}
        />
      ) : null}

      {open ? (
        <AddAddressDialog
          suspectId={suspectId}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            setMessage("เพิ่มพิกัดแล้ว");
            void load();
          }}
          onError={setMessage}
        />
      ) : null}
    </div>
  );
}

function PhotoDialog({
  suspectId,
  photos,
  onClose,
  onChanged,
  onError,
}: {
  suspectId: string;
  photos: SuspectPhotoDto[];
  onClose: () => void;
  onChanged: () => void;
  onError: (msg: string) => void;
}) {
  const [kind, setKind] = useState<SuspectPhotoKind>("FRONT");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("kind", kind);
        if (caption.trim()) fd.append("caption", caption.trim());
        const res = await fetch(`/api/smart-police/investigation/suspects/${suspectId}/photos`, {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const b = (await res.json().catch(() => null)) as { error?: string } | null;
          onError(b?.error ?? "อัปโหลดไม่สำเร็จ");
          return;
        }
      }
      setCaption("");
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/smart-police/investigation/suspects/${suspectId}/photos?photoId=${id}`, {
      method: "DELETE",
    });
    onChanged();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-xl bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-label="รูปภาพบุคคลต้องสงสัย"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-[#1e1b4b]">รูปภาพ ({photos.length})</p>
          <button type="button" onClick={onClose} className="text-xs text-slate-500">
            ปิด
          </button>
        </div>

        {photos.length > 0 ? (
          <ul className="grid grid-cols-3 gap-1.5">
            {photos.map((ph) => (
              <li key={ph.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ph.url}
                  alt={ph.caption ?? SUSPECT_PHOTO_KIND_LABELS[ph.kind]}
                  className="h-24 w-full rounded border border-slate-200 object-cover"
                />
                <span className="absolute left-1 top-1 rounded bg-white/90 px-1 text-[9px] font-bold text-[#4f46e5]">
                  {SUSPECT_PHOTO_KIND_LABELS[ph.kind]}
                </span>
                {ph.hasEmbedding ? (
                  <span className="absolute right-1 top-1 rounded bg-emerald-600 px-1 text-[9px] font-bold text-white">
                    AI
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => void remove(ph.id)}
                  className="absolute bottom-1 right-1 rounded bg-red-600/90 px-1 text-[9px] font-bold text-white"
                >
                  ลบ
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">ยังไม่มีรูป</p>
        )}

        <div className="space-y-2 rounded-lg border border-slate-200 p-2">
          <div className="grid grid-cols-2 gap-2">
            <label className={labelClass}>
              ประเภท
              <select
                className={inputClass}
                value={kind}
                onChange={(e) => setKind(e.target.value as SuspectPhotoKind)}
              >
                {SUSPECT_PHOTO_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {SUSPECT_PHOTO_KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              คำอธิบาย
              <input
                className={inputClass}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </label>
          </div>
          <label className="block">
            <span className="sr-only">เลือกรูป</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              disabled={busy}
              onChange={(e) => {
                void upload(e.target.files);
                e.target.value = "";
              }}
              className="block w-full text-xs"
            />
          </label>
          <p className="text-[10px] text-slate-500">{busy ? "กำลังอัปโหลด…" : "JPG PNG WEBP · สูงสุด 8MB/รูป · เลือกหลายไฟล์ได้"}</p>
        </div>
      </div>
    </div>
  );
}

function AddAddressDialog({
  suspectId,
  onClose,
  onSaved,
  onError,
}: {
  suspectId: string;
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState({ kind: "HOME", label: "", address: "", latitude: "", longitude: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch(`/api/smart-police/investigation/suspects/${suspectId}/addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "ลงพื้นที่" }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => null)) as { error?: string } | null;
        onError(b?.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3" onClick={onClose}>
      <div
        className="w-full max-w-sm space-y-2 rounded-xl bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-label="เพิ่มพิกัดที่อยู่"
      >
        <div className="mb-1 flex items-center justify-between">
          <p className="text-sm font-bold text-[#1e1b4b]">เพิ่มพิกัด</p>
          <button type="button" onClick={onClose} className="text-xs text-slate-500">
            ปิด
          </button>
        </div>
        <label className={labelClass}>
          ประเภท
          <select
            className={inputClass}
            value={form.kind}
            onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
          >
            {ADDRESS_KINDS.map((k) => (
              <option key={k} value={k}>
                {ADDRESS_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          ชื่อจุด
          <input
            className={inputClass}
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          />
        </label>
        <label className={labelClass}>
          ที่อยู่ *
          <textarea
            autoFocus
            className="min-h-[56px] w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className={labelClass}>
            ละติจูด
            <input
              className={inputClass}
              placeholder="7.0089"
              value={form.latitude}
              onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
            />
          </label>
          <label className={labelClass}>
            ลองจิจูด
            <input
              className={inputClass}
              placeholder="100.4767"
              value={form.longitude}
              onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
            />
          </label>
        </div>
        <button
          type="button"
          disabled={busy || !form.address.trim()}
          onClick={() => void submit()}
          className="h-9 w-full rounded-md bg-[#4f46e5] text-sm font-bold text-white hover:bg-[#4338ca] disabled:opacity-50"
        >
          {busy ? "กำลังบันทึก…" : "บันทึก"}
        </button>
      </div>
    </div>
  );
}
