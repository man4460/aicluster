"use client";

import { useCallback, useEffect, useState } from "react";

type Profile = {
  displayName: string | null;
  logoUrl: string | null;
  taxId: string | null;
  address: string | null;
  contactPhone: string | null;
};

export function BarberShopSettingsClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [address, setAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/barber/profile");
    const data = (await res.json().catch(() => ({}))) as { profile?: Profile; error?: string };
    if (!res.ok) {
      setErr(data.error ?? "โหลดไม่สำเร็จ");
      setProfile(null);
      return;
    }
    const p = data.profile;
    if (!p) return;
    setProfile(p);
    setDisplayName(p.displayName ?? "");
    setTaxId(p.taxId ?? "");
    setAddress(p.address ?? "");
    setContactPhone(p.contactPhone ?? "");
  }, []);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      await load();
      if (!c) setLoading(false);
    })();
    return () => {
      c = true;
    };
  }, [load]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch("/api/barber/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          taxId: taxId.trim() || null,
          address: address.trim() || null,
          contactPhone: contactPhone.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { profile?: Profile; error?: string };
      if (!res.ok) {
        setErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      if (data.profile) {
        setProfile(data.profile);
        setMsg("บันทึกการตั้งค่าแล้ว");
      }
    } finally {
      setSaving(false);
    }
  }

  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(null);
    setMsg(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/barber/profile/logo", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { logoUrl?: string; error?: string };
      if (!res.ok) {
        setErr(data.error ?? "อัปโหลดไม่สำเร็จ");
        return;
      }
      if (data.logoUrl) {
        setProfile((prev) => (prev ? { ...prev, logoUrl: data.logoUrl! } : null));
        setMsg("อัปโหลดโลโก้แล้ว");
      }
    } finally {
      setUploading(false);
    }
  }

  async function removeLogo() {
    setErr(null);
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch("/api/barber/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: null }),
      });
      const data = (await res.json().catch(() => ({}))) as { profile?: Profile; error?: string };
      if (!res.ok) {
        setErr(data.error ?? "ลบโลโก้ไม่สำเร็จ");
        return;
      }
      if (data.profile) setProfile(data.profile);
      setMsg("ลบโลโก้แล้ว");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !profile) {
    return (
      <p className="text-sm text-slate-500">{loading ? "กำลังโหลด…" : err ?? "ไม่พบข้อมูล"}</p>
    );
  }

  return (
    <div className="space-y-6">
      {err ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{err}</p> : null}
      {msg ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{msg}</p> : null}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">โลโก้ร้าน</h2>
        <p className="mt-1 text-xs text-slate-500">แสดงบนป้าย QR หน้าร้าน — JPG PNG WEBP GIF ไม่เกิน 2MB</p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {profile.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-[10px] text-slate-400">ยังไม่มีรูป</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex min-h-[44px] cursor-pointer items-center rounded-xl bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0000a6]">
              {uploading ? "กำลังอัปโหลด…" : "เลือกไฟล์โลโก้"}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onLogoChange} />
            </label>
            {profile.logoUrl ? (
              <button
                type="button"
                onClick={() => void removeLogo()}
                disabled={saving}
                className="min-h-[44px] rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                ลบโลโก้
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <form onSubmit={onSave} className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">ข้อมูลร้าน</h2>

        <div>
          <label htmlFor="barber-display-name" className="text-xs font-medium text-slate-600">
            ชื่อร้าน (แสดงบนป้าย QR ถ้ายังไม่มีโลโก้)
          </label>
          <input
            id="barber-display-name"
            className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-200 px-3 text-base"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="เช่น ร้านตัดผมสไตล์"
            maxLength={200}
          />
        </div>

        <div>
          <label htmlFor="barber-tax" className="text-xs font-medium text-slate-600">
            เลขประจำตัวผู้เสียภาษี
          </label>
          <input
            id="barber-tax"
            className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-200 px-3 text-base"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            placeholder="ไม่บังคับ"
            maxLength={30}
          />
        </div>

        <div>
          <label htmlFor="barber-address" className="text-xs font-medium text-slate-600">
            ที่อยู่ร้าน
          </label>
          <textarea
            id="barber-address"
            className="mt-1 min-h-[100px] w-full rounded-xl border border-slate-200 px-3 py-2 text-base"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="บรรทัดใหม่ได้"
            maxLength={4000}
          />
        </div>

        <div>
          <label htmlFor="barber-phone" className="text-xs font-medium text-slate-600">
            เบอร์ติดต่อร้าน
          </label>
          <input
            id="barber-phone"
            className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-200 px-3 text-base"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="ไม่บังคับ"
            maxLength={32}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="min-h-[48px] rounded-xl bg-[#0000BF] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "กำลังบันทึก…" : "บันทึกการตั้งค่า"}
        </button>
      </form>
    </div>
  );
}
