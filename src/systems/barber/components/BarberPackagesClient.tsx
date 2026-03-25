"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Pkg = {
  id: number;
  name: string;
  price: number;
  totalSessions: number;
};

export function BarberPackagesClient() {
  const router = useRouter();
  const [list, setList] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [sessions, setSessions] = useState("10");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/barber/packages");
    const data = (await res.json().catch(() => ({}))) as { packages?: Pkg[]; error?: string };
    if (!res.ok) {
      setErr(data.error ?? "โหลดไม่สำเร็จ");
      setList([]);
      return;
    }
    setList(data.packages ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const p = Number(price);
    const s = Number(sessions);
    if (!name.trim() || !Number.isFinite(p) || p < 0 || !Number.isInteger(s) || s < 1) {
      setErr("กรอกชื่อ ราคา และจำนวนครั้งให้ถูกต้อง");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/barber/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), price: p, totalSessions: s }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setName("");
      setPrice("");
      setSessions("10");
      await load();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("ลบแพ็กเกจนี้?")) return;
    setErr(null);
    const res = await fetch(`/api/barber/packages/${id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setErr(data.error ?? "ลบไม่สำเร็จ");
      return;
    }
    await load();
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={onCreate}
        className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
      >
        <h2 className="text-sm font-semibold text-slate-900">เพิ่มแพ็กเกจ / โปรโมชั่น</h2>
        <p className="mt-1 text-xs text-slate-500">เช่น ตัดผม 10 ครั้ง 1,200 บาท</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="block text-xs font-semibold text-slate-700">
            ชื่อแพ็กเกจ
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ตัดผม 10 ครั้ง"
              required
            />
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            ราคา (บาท)
            <input
              type="number"
              min={0}
              step={0.01}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            จำนวนครั้ง
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              value={sessions}
              onChange={(e) => setSessions(e.target.value)}
              required
            />
          </label>
        </div>
        {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="mt-4 min-h-[48px] w-full rounded-xl bg-[#0000BF] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0000a6] disabled:opacity-60 sm:w-auto"
        >
          {saving ? "กำลังบันทึก…" : "บันทึกแพ็กเกจ"}
        </button>
      </form>

      <section>
        <h2 className="text-sm font-semibold text-slate-900">รายการแพ็กเกจ</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-500">กำลังโหลด…</p>
        ) : list.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500">
            ยังไม่มีแพ็กเกจ
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {list.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {p.price.toLocaleString("th-TH", { maximumFractionDigits: 2 })} บาท · {p.totalSessions}{" "}
                    ครั้ง
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="min-h-[44px] rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  ลบ
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
