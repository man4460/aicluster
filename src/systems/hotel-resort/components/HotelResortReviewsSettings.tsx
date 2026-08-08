"use client";

import { useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppSectionHeader,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  assetRowRemoveIconButtonClass,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import { HotelResortErrorBanner } from "@/systems/hotel-resort/components/HotelResortErrorBanner";
import { hotelResortFetchErrorMessage } from "@/systems/hotel-resort/lib/client-data";
import {
  hotelResortFieldClass,
  hotelResortFormLabelClass,
  hotelResortSectionRadiusClass,
  hotelResortSuccessBannerClass,
} from "@/systems/hotel-resort/lib/ui-tokens";

type ReviewRow = {
  id: string;
  guestName: string;
  rating: number;
  comment: string;
  isPublished: boolean;
  createdAt: string;
};

export function HotelResortReviewsSettings() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [guestName, setGuestName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/hotel-resort/reviews", { credentials: "include", cache: "no-store" });
    if (!res.ok) return;
    const j = (await res.json()) as { reviews?: ReviewRow[] };
    setRows(j.reviews ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function add() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/hotel-resort/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ guestName, rating, comment }),
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      setGuestName("");
      setComment("");
      setRating(5);
      setMsg("เพิ่มรีวิวแล้ว");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/hotel-resort/reviews?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublished(row: ReviewRow) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/hotel-resort/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: row.id, isPublished: !row.isPublished }),
      });
      if (!res.ok) throw new Error(await hotelResortFetchErrorMessage(res));
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "อัปเดตไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppDashboardSection tone="violet" className={hotelResortSectionRadiusClass}>
      <AppSectionHeader tone="violet" title="รีวิวหน้าลิงก์ลูกค้า" />
      <div className="mt-4 space-y-3">
        {err ? <HotelResortErrorBanner message={err} /> : null}
        {msg ? <p className={hotelResortSuccessBannerClass}>{msg}</p> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className={hotelResortFormLabelClass}>ชื่อผู้รีวิว</span>
            <input
              className={cn(hotelResortFieldClass, "mt-1")}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className={hotelResortFormLabelClass}>คะแนน</span>
            <select
              className={cn(hotelResortFieldClass, "mt-1")}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block space-y-1">
          <span className={hotelResortFormLabelClass}>ข้อความ</span>
          <textarea
            className={cn(hotelResortFieldClass, "mt-1 min-h-[88px]")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={800}
          />
        </label>
        <button
          type="button"
          disabled={busy || !guestName.trim() || !comment.trim()}
          onClick={() => void add()}
          className="app-btn-primary min-h-[44px] rounded-xl px-5 text-sm font-bold disabled:opacity-50"
        >
          {busy ? "กำลังบันทึก…" : "+ เพิ่มรีวิว"}
        </button>
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex items-start gap-2 rounded-2xl border border-white/60 bg-white/50 px-3 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-[#1e1b4b]">
                  {r.guestName} · {r.rating}/5
                  {!r.isPublished ? (
                    <span className="ml-2 text-[11px] font-bold text-[#8b87b8]">ซ่อน</span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs font-medium text-[#66638c]">{r.comment}</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void togglePublished(r)}
                  className="mt-2 text-[11px] font-bold text-[#4d47b6]"
                >
                  {r.isPublished ? "ซ่อนจากหน้าลิงก์" : "แสดงบนหน้าลิงก์"}
                </button>
              </div>
              <button
                type="button"
                className={assetRowRemoveIconButtonClass}
                aria-label={`ลบรีวิว ${r.guestName}`}
                title="ลบ"
                disabled={busy}
                onClick={() => void remove(r.id)}
              >
                <IconRowRemove className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </AppDashboardSection>
  );
}
