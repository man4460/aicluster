"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { SubscriptionTier, SubscriptionType } from "@/generated/prisma/enums";
import { appDashboardBrandCtaPillButtonClass } from "@/components/app-templates";
import { TokenTopupModal } from "@/components/dashboard/TokenTopupModal";
import { REFERRAL_BONUS_TOKENS } from "@/lib/tokens/signup-bonus";

type Initial = {
  email: string;
  username: string;
  subscriptionTier: SubscriptionTier;
  subscriptionType: SubscriptionType;
  fullName: string | null;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  avatarUrl: string | null;
  taxId: string | null;
  promptPayPhone: string | null;
  paymentChannelsNote: string | null;
  defaultPaperSize: string;
  tokens: number;
  referrerLocked: boolean;
  referrerSummary: string | null;
  /** บัญชีทดลอง — ห้ามกรอก/บันทึกเบอร์ผู้แนะนำ */
  demoAccount?: boolean;
};

export function ProfileEditor({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [tab, setTab] = useState<"account" | "business">("business");
  const [fullName, setFullName] = useState(initial.fullName ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [address, setAddress] = useState(initial.address ?? "");
  const [taxId, setTaxId] = useState(initial.taxId ?? "");
  const [promptPayPhone, setPromptPayPhone] = useState(initial.promptPayPhone ?? "");
  const [paymentChannelsNote, setPaymentChannelsNote] = useState(initial.paymentChannelsNote ?? "");
  const [defaultPaperSize, setDefaultPaperSize] = useState(initial.defaultPaperSize || "SLIP_58");
  const [latitude, setLatitude] = useState(
    initial.latitude != null ? String(initial.latitude) : "",
  );
  const [longitude, setLongitude] = useState(
    initial.longitude != null ? String(initial.longitude) : "",
  );
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [referrerPhone, setReferrerPhone] = useState("");

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: fullName || null,
          phone: phone || null,
          address: address || null,
          taxId: taxId || null,
          promptPayPhone: promptPayPhone || null,
          paymentChannelsNote: paymentChannelsNote || null,
          defaultPaperSize,
          latitude:
            latitude === "" || Number.isNaN(Number(latitude)) ? null : Number(latitude),
          longitude:
            longitude === "" || Number.isNaN(Number(longitude)) ? null : Number(longitude),
          ...(!initial.referrerLocked &&
          !initial.demoAccount &&
          referrerPhone.trim()
            ? { referrerPhone: referrerPhone.trim().slice(0, 32) }
            : {}),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setMsg("บันทึกแล้ว");
      setReferrerPhone("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function saveReferrerOnly(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (initial.referrerLocked || initial.demoAccount) return;
    const raw = referrerPhone.trim().slice(0, 32);
    if (!raw) {
      setErr("กรุณากรอกเบอร์ผู้แนะนำ");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ referrerPhone: raw }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setMsg("บันทึกเบอร์ผู้แนะนำแล้ว");
      setReferrerPhone("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function getLocation() {
    if (!navigator.geolocation) {
      setErr("เบราว์เซอร์ไม่รองรับตำแหน่ง");
      return;
    }
    setGeoLoading(true);
    setErr(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude));
        setLongitude(String(pos.coords.longitude));
        setGeoLoading(false);
      },
      () => {
        setErr("ไม่สามารถดึงตำแหน่งได้ (กรุณาอนุญาตการเข้าถึง)");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/profile/avatar", {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    const data = (await res.json()) as { error?: string; avatarUrl?: string };
    if (!res.ok) {
      setErr(data.error ?? "อัปโหลดไม่สำเร็จ");
      return;
    }
    if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl text-slate-400">?</div>
            )}
          </div>
          <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">
            เปลี่ยนรูป
            <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
          </label>
        </div>
        <p className="text-center text-xs text-slate-500">{initial.email}</p>
        <p className="text-center text-sm font-medium text-slate-700">@{initial.username}</p>
        <p className="text-center text-sm text-amber-800">โทเคน: {initial.tokens}</p>
        <TokenTopupModal
          triggerLabel="เติมโทเคน"
          triggerClassName={cn(appDashboardBrandCtaPillButtonClass, "w-full")}
          subscriptionTier={initial.subscriptionTier}
          subscriptionType={initial.subscriptionType}
        />
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("business")}
            className={cn(
              "rounded-xl px-3.5 py-2 text-sm font-semibold",
              tab === "business" ? "bg-[#0000BF]/12 text-[#0000BF]" : "bg-slate-100 text-slate-700",
            )}
          >
            ตั้งค่าบริษัท/ร้าน
          </button>
          <button
            type="button"
            onClick={() => setTab("account")}
            className={cn(
              "rounded-xl px-3.5 py-2 text-sm font-semibold",
              tab === "account" ? "bg-[#0000BF]/12 text-[#0000BF]" : "bg-slate-100 text-slate-700",
            )}
          >
            ข้อมูลบัญชี
          </button>
        </div>
        {tab === "account" ? (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="space-y-2">
              <p>อีเมล: {initial.email}</p>
              <p>ชื่อผู้ใช้: @{initial.username}</p>
              <p>โทเคนคงเหลือ: {initial.tokens}</p>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold text-slate-800">เบอร์โทรผู้แนะนำ</p>
              <p className="mt-1 text-xs text-slate-600">
                บันทึกได้ครั้งเดียว — ต้องตรงเบอร์ในโปรไฟล์ของผู้แนะนำในระบบ ผู้แนะนำจะได้ {REFERRAL_BONUS_TOKENS} โทเคนเมื่อบันทึกสำเร็จ
              </p>
              {err ? (
                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {err}
                </p>
              ) : null}
              {msg ? (
                <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>
              ) : null}
              {initial.demoAccount ? (
                <p className="mt-2 rounded-lg border border-slate-200 bg-slate-100/90 px-3 py-2 text-sm text-slate-700">
                  บัญชีทดลองใช้งาน — ไม่สามารถกรอกหรือบันทึกเบอร์ผู้แนะนำได้
                </p>
              ) : initial.referrerLocked ? (
                <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900">
                  บันทึกแล้ว
                  {initial.referrerSummary ? (
                    <>
                      {" "}
                      — อ้างอิง: <span className="font-medium">{initial.referrerSummary}</span>
                    </>
                  ) : null}
                </p>
              ) : (
                <form onSubmit={saveReferrerOnly} className="mt-2 space-y-2">
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="off"
                    value={referrerPhone}
                    onChange={(e) => setReferrerPhone(e.target.value)}
                    className={input}
                    placeholder="เช่น 0812345678"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-lg bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0000a3] disabled:opacity-60"
                  >
                    {loading ? "กำลังบันทึก..." : "บันทึกเบอร์ผู้แนะนำ"}
                  </button>
                  <p className="text-[11px] text-slate-500">
                    หรือบันทึกพร้อมข้อมูลร้านได้จากแท็บ &quot;ตั้งค่าบริษัท/ร้าน&quot;
                  </p>
                </form>
              )}
            </div>
            <p className="text-xs text-slate-500">ตั้งค่าบริษัท/ร้านอยู่ที่แท็บด้านบน</p>
          </div>
        ) : (
          <form onSubmit={saveProfile} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">ชื่อบริษัท/ร้าน</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={input}
            placeholder="ชื่อบริษัทหรือชื่อร้าน"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">เลขกำกับภาษี</label>
          <input
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            className={input}
            placeholder="เลขประจำตัวผู้เสียภาษี"
          />
        </div>
        <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
          <p className="text-sm font-semibold text-sky-900">การชำระเงิน & ใบเสร็จ / ใบแจ้งชำระ</p>
          <p className="mt-1 text-xs text-sky-800/90">
            ใช้ข้อมูลนี้ร่วมกันในระบบบิล ใบเสร็จ และใบแจ้งให้ชำระ
          </p>
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">เบอร์พร้อมเพย์ (เฉพาะตัวเลข)</label>
              <input
                value={promptPayPhone}
                onChange={(e) => setPromptPayPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                className={input}
                placeholder="0812345678"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">ช่องทางชำระ (โอนธนาคาร ฯลฯ)</label>
              <textarea
                value={paymentChannelsNote}
                onChange={(e) => setPaymentChannelsNote(e.target.value)}
                rows={3}
                className={input}
                placeholder="เช่น ธ.กสิกรไทย เลขที่ ..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">ขนาดกระดาษเริ่มต้น</label>
              <select
                value={defaultPaperSize}
                onChange={(e) => setDefaultPaperSize(e.target.value)}
                className={input}
              >
                <option value="SLIP_58">สลิป 58 mm</option>
                <option value="SLIP_80">สลิป 80 mm</option>
                <option value="A4">A4 (เอกสารเต็มแผ่น)</option>
              </select>
            </div>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">เบอร์โทร</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={input}
            placeholder="08xxxxxxxx"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">ที่อยู่</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className={input}
            placeholder="ที่อยู่จัดส่ง / ที่ตั้งร้าน"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">ละติจูด</label>
            <input
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className={input}
              placeholder="จากปุ่มด้านล่าง"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">ลองจิจูด</label>
            <input
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className={input}
              placeholder="จากปุ่มด้านล่าง"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={getLocation}
          disabled={geoLoading}
          className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-60"
        >
          {geoLoading ? "กำลังดึงตำแหน่ง..." : "ดึงตำแหน่งปัจจุบัน (Geolocation)"}
        </button>

        {err ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {err}
          </p>
        ) : null}
        {msg ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "rounded-lg bg-[#0000BF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0000a3] disabled:opacity-60",
          )}
        >
          {loading ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}
        </button>
          </form>
        )}
      </div>
    </div>
  );
}

const input =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-[#0000BF] focus:ring-2 focus:ring-[#0000BF]/20";
