"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Stylist = {
  id: number;
  name: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
};

export function BarberStylistsClient() {
  const router = useRouter();
  const [list, setList] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/barber/stylists?all=1");
    const data = (await res.json().catch(() => ({}))) as { stylists?: Stylist[]; error?: string };
    if (!res.ok) {
      setErr(data.error ?? "โหลดไม่สำเร็จ");
      setList([]);
      return;
    }
    setList(data.stylists ?? []);
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
    if (!name.trim()) {
      setErr("กรอกชื่อช่าง");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/barber/stylists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setName("");
      setPhone("");
      await load();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(s: Stylist) {
    const res = await fetch(`/api/barber/stylists/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setErr(data.error ?? "อัปเดตไม่สำเร็จ");
      return;
    }
    await load();
    router.refresh();
  }

  async function editStylist(s: Stylist) {
    const nextName = prompt("ชื่อช่าง", s.name);
    if (!nextName || !nextName.trim()) return;
    const nextPhone = prompt("เบอร์โทร (ไม่บังคับ)", s.phone ?? "") ?? "";
    const res = await fetch(`/api/barber/stylists/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName.trim(), phone: nextPhone.trim() || null }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setErr(data.error ?? "อัปเดตไม่สำเร็จ");
      return;
    }
    await load();
    router.refresh();
  }

  async function removeStylist(s: Stylist) {
    if (!confirm(`ลบช่าง "${s.name}" ?`)) return;
    const res = await fetch(`/api/barber/stylists/${s.id}`, { method: "DELETE" });
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
      <form onSubmit={onCreate} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-slate-900">เพิ่มช่างตัดผม</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            className="min-h-[48px] rounded-xl border border-slate-200 px-3 text-base"
            placeholder="ชื่อช่าง *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="min-h-[48px] rounded-xl border border-slate-200 px-3 text-base"
            placeholder="เบอร์ (ไม่บังคับ)"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 min-h-[48px] w-full rounded-xl bg-[#0000BF] py-3 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {saving ? "…" : "บันทึกช่าง"}
        </button>
      </form>

      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">รายชื่อช่าง</h2>
        {loading ? (
          <p className="text-sm text-slate-500">กำลังโหลด…</p>
        ) : list.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
            ยังไม่มีช่าง — เพิ่มด้านบน
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {s.name}
                    {!s.isActive ? (
                      <span className="ml-2 text-xs font-normal text-amber-800">(ปิดใช้งาน)</span>
                    ) : null}
                  </p>
                  {s.phone ? <p className="text-sm text-slate-600">{s.phone}</p> : null}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => void editStylist(s)} className="min-h-[44px] shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">แก้ไข</button>
                  <button type="button" onClick={() => void toggleActive(s)} className="min-h-[44px] shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">{s.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}</button>
                  <button type="button" onClick={() => void removeStylist(s)} className="min-h-[44px] shrink-0 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">ลบ</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
