"use client";

import { useMemo, useState } from "react";

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

  const selectedSub = useMemo(
    () => data?.subscriptions.find((s) => s.id === selectedSubId) ?? null,
    [data, selectedSubId],
  );
  const canSelfCheckIn =
    selectedSub != null && selectedSub.status === "ACTIVE" && selectedSub.remainingSessions > 0;

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setData(null);
    setCheckInMsg(null);
    setSelectedSubId(null);
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
        setSelectedSubId((first ?? j.subscriptions[0])?.id ?? null);
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
        body: JSON.stringify({ ownerId, phone: digits, subscriptionId: selectedSubId }),
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
        setCheckInMsg(`บันทึกการใช้บริการแล้ว — ${pkg} เหลืออีก ${j.remainingSessions} สิทธิ์`);
      }
    } finally {
      setCheckInLoading(false);
    }
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-md px-4 pb-16 pt-8">
      <header className="text-center">
        <h1 className="text-xl font-bold text-slate-900">สมาชิกร้าน</h1>
        <p className="mt-2 text-sm text-slate-600">
          กรอกเบอร์ ตรวจสิทธิ์ แล้วกดยืนยันเมื่อใช้บริการ — ระบบจะหักสิทธิ์และแจ้งจำนวนครั้งคงเหลือ
        </p>
      </header>

      <form onSubmit={onSearch} className="mt-8 space-y-3">
        <label className="block text-xs font-semibold text-slate-700">
          เบอร์โทรศัพท์
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="เช่น 0812345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
            className="mt-1.5 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 text-lg tracking-wide text-slate-900 shadow-sm outline-none transition focus:border-[#0000BF]/50 focus:ring-4 focus:ring-[#0000BF]/10"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-[#0000BF] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0000BF]/25 transition hover:bg-[#0000a6] disabled:opacity-60"
        >
          {loading ? "กำลังค้นหา…" : "ดูสิทธิ์แพ็กเกจ"}
        </button>
        {err ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-800 ring-1 ring-red-100">
            {err}
          </p>
        ) : null}
      </form>

      {data ? (
        <section className="mt-10 space-y-4">
          <div className="rounded-3xl border-2 border-[#0000BF]/20 bg-gradient-to-b from-white to-slate-50 p-5 shadow-lg shadow-slate-200/80">
            <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Digital Member Card
            </p>
            <p className="mt-3 text-center text-lg font-bold text-slate-900">{data.customer.displayName}</p>
            <p className="mt-1 text-center text-sm text-slate-600">{data.customer.phoneMasked}</p>
            <div className="mt-6 space-y-4">
              {data.subscriptions.length === 0 ? (
                <p className="text-center text-sm text-slate-500">ยังไม่มีแพ็กเกจในระบบ</p>
              ) : (
                data.subscriptions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedSubId(s.id);
                      setCheckInMsg(null);
                    }}
                    className={`w-full rounded-2xl border-2 px-4 py-4 text-left transition ${
                      selectedSubId === s.id
                        ? "border-[#0000BF] bg-[#0000BF]/5 ring-2 ring-[#0000BF]/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-800">{s.packageName}</p>
                    <p className="mt-3 text-center">
                      <span className="text-xs text-slate-500">ครั้งคงเหลือ</span>
                      <span
                        className={`mt-1 block text-4xl font-black tabular-nums ${
                          s.remainingSessions > 0 && s.status === "ACTIVE"
                            ? "text-[#0000BF]"
                            : "text-slate-400"
                        }`}
                      >
                        {s.remainingSessions}
                      </span>
                    </p>
                    {s.status !== "ACTIVE" || s.remainingSessions <= 0 ? (
                      <p className="mt-2 text-center text-xs text-amber-800">แพ็กหมดหรือไม่พร้อมใช้</p>
                    ) : null}
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

          <button
            type="button"
            disabled={checkInLoading || !canSelfCheckIn}
            onClick={() => void onSelfCheckIn()}
            className="w-full rounded-2xl bg-emerald-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checkInLoading ? "กำลังบันทึก…" : "ยืนยันว่าใช้บริการเรียบร้อยแล้ว"}
          </button>
          {!canSelfCheckIn && data.subscriptions.length > 0 ? (
            <p className="text-center text-xs text-amber-800">
              เลือกแพ็กเกจที่มียอดครั้งคงเหลือ หรือซื้อแพ็กใหม่ที่ร้าน
            </p>
          ) : null}
        </section>
      ) : null}

      <footer className="mt-16 text-center text-[10px] text-slate-400">Customer QR · เช็คอินด้วยตนเอง</footer>
    </div>
  );
}
