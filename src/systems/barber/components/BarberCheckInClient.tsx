"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type SubRow = {
  id: number;
  remainingSessions: number;
  status: string;
  packageName: string;
  packageId: number;
};

type Pkg = { id: number; name: string; price: number; totalSessions: number };

type StylistBrief = { id: number; name: string };

export function BarberCheckInClient() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [deducting, setDeducting] = useState(false);

  const [cashPhone, setCashPhone] = useState("");
  const [cashName, setCashName] = useState("");
  const [cashNote, setCashNote] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [cashLoading, setCashLoading] = useState(false);

  const [packages, setPackages] = useState<Pkg[]>([]);
  const [stylists, setStylists] = useState<StylistBrief[]>([]);
  const [stylistId, setStylistId] = useState("");
  const [sellPkg, setSellPkg] = useState("");
  const [sellPhone, setSellPhone] = useState("");
  const [sellName, setSellName] = useState("");
  const [sellLoading, setSellLoading] = useState(false);

  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [cashFormErr, setCashFormErr] = useState<string | null>(null);
  const [sellFormErr, setSellFormErr] = useState<string | null>(null);

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
      const res = await fetch(`/api/barber/customers/search?phone=${encodeURIComponent(digits)}`);
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
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    void fetch("/api/barber/packages")
      .then((r) => r.json())
      .then((d: { packages?: Pkg[] }) => setPackages(d.packages ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    void fetch("/api/barber/stylists")
      .then((r) => r.json())
      .then((d: { stylists?: StylistBrief[] }) => setStylists(d.stylists ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!cashModalOpen && !sellModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCashModalOpen(false);
        setSellModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [cashModalOpen, sellModalOpen]);

  async function onDeduct() {
    if (!selectedSubId) {
      setErr("เลือกแพ็กเกจที่จะหักครั้ง");
      return;
    }
    setErr(null);
    setMsg(null);
    setDeducting(true);
    try {
      const sid = stylistId ? Number(stylistId) : null;
      const res = await fetch("/api/barber/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: selectedSubId,
          ...(sid != null && Number.isInteger(sid) && sid > 0 ? { stylistId: sid } : {}),
        }),
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
      setMsg(`หัก 1 ครั้งแล้ว — เหลือ ${data.remainingSessions} ครั้ง`);
      setSubs((prev) =>
        prev.map((s) =>
          s.id === selectedSubId
            ? { ...s, remainingSessions: data.remainingSessions ?? 0, status: data.status ?? s.status }
            : s,
        ),
      );
      router.refresh();
    } finally {
      setDeducting(false);
    }
  }

  async function onCash(e: React.FormEvent) {
    e.preventDefault();
    setCashFormErr(null);
    setMsg(null);
    const digits = cashPhone.replace(/\D/g, "");
    if (digits.length < 9) {
      setCashFormErr("กรอกเบอร์ลูกค้าเงินสดอย่างน้อย 9 หลัก");
      return;
    }
    const rawAmt = cashAmount.trim().replace(/,/g, "");
    let amountBaht: number | null = null;
    if (rawAmt.length > 0) {
      const n = Number(rawAmt);
      if (!Number.isFinite(n) || n < 0 || n > 999_999.99) {
        setCashFormErr("ยอดเงินไม่ถูกต้อง (0–999,999.99 บาท)");
        return;
      }
      amountBaht = Math.round(n * 100) / 100;
    }
    setCashLoading(true);
    try {
      const sidCash = stylistId ? Number(stylistId) : null;
      const res = await fetch("/api/barber/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitType: "CASH_WALK_IN",
          phone: digits,
          name: cashName.trim() || null,
          note: cashNote.trim() || null,
          ...(amountBaht != null ? { amountBaht } : {}),
          ...(sidCash != null && Number.isInteger(sidCash) && sidCash > 0 ? { stylistId: sidCash } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setCashFormErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setMsg("บันทึกลูกค้าเงินสดแล้ว");
      setCashPhone("");
      setCashName("");
      setCashNote("");
      setCashAmount("");
      setCashModalOpen(false);
      router.refresh();
    } finally {
      setCashLoading(false);
    }
  }

  async function onSell(e: React.FormEvent) {
    e.preventDefault();
    setSellFormErr(null);
    setMsg(null);
    const pkgId = Number(sellPkg);
    const digits = sellPhone.replace(/\D/g, "");
    if (!Number.isInteger(pkgId) || pkgId < 1 || digits.length < 9) {
      setSellFormErr("เลือกแพ็กเกจและกรอกเบอร์ลูกค้า");
      return;
    }
    setSellLoading(true);
    try {
      const sidSell = stylistId ? Number(stylistId) : null;
      const res = await fetch("/api/barber/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkgId,
          phone: digits,
          name: sellName.trim() || null,
          ...(sidSell != null && Number.isInteger(sidSell) && sidSell > 0 ? { stylistId: sidSell } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; subscription?: { id: number } };
      if (!res.ok) {
        setSellFormErr(data.error ?? "ขายแพ็กไม่สำเร็จ");
        return;
      }
      setMsg(`เปิดแพ็กเกจให้ลูกค้าแล้ว — รหัสสมาชิก #${data.subscription?.id ?? ""}`);
      setSellPhone("");
      setSellName("");
      setSellPkg("");
      setSellModalOpen(false);
      router.refresh();
    } finally {
      setSellLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-[#0000BF]/20 bg-gradient-to-br from-[#0000BF]/[0.07] via-white to-slate-50 p-5 shadow-md shadow-slate-200/40 sm:p-6">
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full bg-[#0000BF]/[0.06]"
          aria-hidden
        />
        <div className="pointer-events-none absolute bottom-0 left-0 h-20 w-20 rounded-tr-full bg-slate-200/30" aria-hidden />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-stretch lg:gap-8">
          <div className="flex min-w-0 flex-1 gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0000BF] text-lg font-bold text-white shadow-lg shadow-[#0000BF]/30"
              aria-hidden
            >
              ช
            </div>
            <div className="min-w-0 pt-0.5">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">ช่างผู้บันทึก</h2>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-600">
                เลือกช่างสำหรับการหักแพ็ก บันทึกเงินสด และขายแพ็ก — ไม่บังคับ
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-500 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                {stylists.length > 0
                  ? `มีช่างในระบบ ${stylists.length} คน`
                  : "ยังไม่มีรายชื่อช่าง — ตั้งค่าได้ที่เมนูช่าง"}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col justify-end lg:max-w-sm lg:flex-none">
            <label htmlFor="barber-stylist-select" className="text-sm font-medium text-slate-700">
              เลือกช่าง
            </label>
            <select
              id="barber-stylist-select"
              className="mt-2 min-h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm transition-colors focus:border-[#0000BF] focus:outline-none focus:ring-2 focus:ring-[#0000BF]/25"
              value={stylistId}
              onChange={(e) => setStylistId(e.target.value)}
              aria-label="เลือกช่างที่บันทึก"
            >
              <option value="">— ไม่ระบุช่าง —</option>
              {stylists.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-[11px] leading-snug text-slate-500">
              ถ้าไม่เลือก ระบบจะไม่บันทึกชื่อช่างในประวัติการขายหรือการใช้งาน
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-900">ค้นหาลูกค้าด้วยเบอร์โทร</h2>
        <p className="mt-1 text-xs text-slate-500">กรอกเบอร์แล้วกดค้นหาเพื่อหักครั้งแพ็กเกจ</p>

        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void searchByPhone(phone);
          }}
        >
          <input
            className="min-h-[48px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-base"
            inputMode="numeric"
            placeholder="เบอร์โทร (เฉพาะตัวเลข)"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
          />
          <button
            type="submit"
            disabled={searching}
            className="min-h-[48px] rounded-xl bg-[#0000BF] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {searching ? "…" : "ค้นหา"}
          </button>
        </form>
      </section>

      {(customerName !== null || subs.length > 0 || msg) && (
        <section className="rounded-2xl border-2 border-[#0000BF]/15 bg-[#0000BF]/[0.03] p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-900">ผลการค้นหา</h3>
          {customerName ? (
            <p className="mt-1 text-sm text-slate-600">ชื่อ: {customerName}</p>
          ) : phone.length >= 9 ? (
            <p className="mt-1 text-xs text-slate-500">ยังไม่มีชื่อในระบบ — ใส่ได้ตอนขายแพ็กหรือเงินสด</p>
          ) : null}

          {subs.length === 0 && phone.length >= 9 && !searching ? (
            <p className="mt-3 text-sm text-amber-800">ไม่พบแพ็กเกจที่ใช้งานได้ — ลองขายแพ็กด้านล่าง</p>
          ) : null}

          {subs.length > 0 ? (
            <div className="mt-4 space-y-2">
              {subs.map((s) => (
                <label
                  key={s.id}
                  className={[
                    "flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-3 shadow-sm",
                    selectedSubId === s.id ? "border-[#0000BF] ring-1 ring-[#0000BF]/20" : "border-slate-200",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="subpick"
                    checked={selectedSubId === s.id}
                    onChange={() => setSelectedSubId(s.id)}
                    className="h-5 w-5"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{s.packageName}</p>
                    <p className="text-lg font-bold tabular-nums text-[#0000BF]">
                      เหลือ {s.remainingSessions} ครั้ง
                    </p>
                  </div>
                </label>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            disabled={deducting || !selectedSubId || subs.length === 0}
            onClick={() => void onDeduct()}
            className="mt-4 min-h-[52px] w-full rounded-xl bg-emerald-600 py-3 text-base font-bold text-white shadow-sm disabled:opacity-50"
          >
            {deducting ? "กำลังบันทึก…" : "บันทึกการใช้งาน (หัก 1 ครั้ง)"}
          </button>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-900">การบันทึกด่วน</h2>
        <p className="mt-1 text-xs text-slate-500">
          เงินสด walk-in และการขายแพ็กเกจ — กดปุ่มแล้วกรอกในหน้าต่างป๊อปอัป
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setCashFormErr(null);
              setCashModalOpen(true);
            }}
            className="min-h-[52px] flex-1 rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-left text-sm font-bold text-amber-950 shadow-sm transition hover:bg-amber-100/90"
          >
            <span className="block">ลูกค้าเงินสด (Walk-in)</span>
            <span className="mt-0.5 block text-xs font-normal text-amber-900/80">บันทึกเบอร์ ชื่อ ยอดเงิน</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSellFormErr(null);
              setSellModalOpen(true);
            }}
            disabled={packages.length === 0}
            className="min-h-[52px] flex-1 rounded-xl bg-[#0000BF] px-4 py-3 text-left text-sm font-semibold text-white shadow-md shadow-[#0000BF]/20 transition hover:bg-[#0000a8] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="block">ขายแพ็กเกจให้ลูกค้า</span>
            <span className="mt-0.5 block text-xs font-normal text-white/85">เลือกแพ็ก เบอร์ ชื่อ</span>
          </button>
        </div>
      </section>

      {cashModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          role="presentation"
          onClick={() => setCashModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="barber-cash-modal-title"
            className="max-h-[min(92vh,720px)] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <h2 id="barber-cash-modal-title" className="text-lg font-semibold text-slate-900">
                  ลูกค้าเงินสด (Walk-in)
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  แยกจากการหักแพ็ก — กรอกยอดเงินได้เพื่อสรุปรายได้ในประวัติ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCashModalOpen(false)}
                className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>
            <form onSubmit={onCash} className="grid gap-3 px-5 py-4">
              {cashFormErr ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{cashFormErr}</p>
              ) : null}
              <input
                className="min-h-[48px] rounded-xl border border-slate-200 px-3 text-base"
                placeholder="เบอร์โทร"
                inputMode="numeric"
                value={cashPhone}
                onChange={(e) => setCashPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
              />
              <input
                className="min-h-[48px] rounded-xl border border-slate-200 px-3 text-base"
                placeholder="ชื่อ (ไม่บังคับ)"
                value={cashName}
                onChange={(e) => setCashName(e.target.value)}
              />
              <input
                className="min-h-[48px] rounded-xl border border-slate-200 px-3 text-base"
                placeholder="หมายเหตุ (ไม่บังคับ)"
                value={cashNote}
                onChange={(e) => setCashNote(e.target.value)}
              />
              <input
                className="min-h-[48px] rounded-xl border border-slate-200 px-3 text-base"
                placeholder="ยอดเงิน (บาท, ไม่บังคับ)"
                inputMode="decimal"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
              />
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setCashModalOpen(false)}
                  className="min-h-[48px] rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={cashLoading}
                  className="min-h-[48px] rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950 disabled:opacity-60"
                >
                  {cashLoading ? "…" : "บันทึกเงินสด"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {sellModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          role="presentation"
          onClick={() => setSellModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="barber-sell-modal-title"
            className="max-h-[min(92vh,720px)] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <h2 id="barber-sell-modal-title" className="text-lg font-semibold text-slate-900">
                  ขายแพ็กเกจให้ลูกค้า
                </h2>
                <p className="mt-1 text-xs text-slate-500">เลือกแพ็กเกจ กรอกเบอร์และชื่อลูกค้า</p>
              </div>
              <button
                type="button"
                onClick={() => setSellModalOpen(false)}
                className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="ปิด"
              >
                ✕
              </button>
            </div>
            <form onSubmit={onSell} className="grid gap-3 px-5 py-4">
              {sellFormErr ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{sellFormErr}</p>
              ) : null}
              <select
                className="min-h-[48px] rounded-xl border border-slate-200 px-3 text-base"
                value={sellPkg}
                onChange={(e) => setSellPkg(e.target.value)}
                required
              >
                <option value="">เลือกแพ็กเกจ</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.price.toLocaleString("th-TH")} บ. / {p.totalSessions} ครั้ง
                  </option>
                ))}
              </select>
              <input
                className="min-h-[48px] rounded-xl border border-slate-200 px-3 text-base"
                placeholder="เบอร์ลูกค้า"
                inputMode="numeric"
                value={sellPhone}
                onChange={(e) => setSellPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
              />
              <input
                className="min-h-[48px] rounded-xl border border-slate-200 px-3 text-base"
                placeholder="ชื่อลูกค้า (ไม่บังคับ)"
                value={sellName}
                onChange={(e) => setSellName(e.target.value)}
              />
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSellModalOpen(false)}
                  className="min-h-[48px] rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={sellLoading || packages.length === 0}
                  className="min-h-[48px] rounded-xl bg-[#0000BF] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {sellLoading ? "…" : "เปิดแพ็กเกจ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {msg ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{msg}</p> : null}
      {err ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{err}</p> : null}
    </div>
  );
}
