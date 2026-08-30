"use client";

import { useCallback, useEffect, useState } from "react";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";

type ReviewRow = {
  id: string;
  guestName: string;
  rating: number;
  comment: string;
  isPublished: boolean;
};

export function ParkingReviewsSettings() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/parking/session/reviews", {
        credentials: "include",
        cache: "no-store",
      });
      const data = (await res.json()) as { reviews?: ReviewRow[] };
      if (res.ok) setReviews(data.reviews ?? []);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(id: string, isPublished: boolean) {
    const res = await fetch("/api/parking/session/reviews", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isPublished }),
    });
    if (!res.ok) return;
    setReviews((rows) =>
      rows.map((r) => (r.id === id ? { ...r, isPublished } : r)),
    );
  }

  return (
    <div className="rounded-2xl border border-white/60 bg-white/45 p-4">
      <p className="text-xs font-black text-[#4d47b6]">รีวิว</p>
      {busy ? (
        <p className="mt-3 text-sm font-semibold text-[#8b87b8]">กำลังโหลด…</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-[#ecebff] bg-[#faf9ff]/80 p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-black text-[#1e1b4b]">
                  {r.guestName} · ★{r.rating}
                  {!r.isPublished ? (
                    <span className="ml-2 text-xs font-bold text-amber-700">ซ่อน</span>
                  ) : null}
                </p>
                <p className="mt-1 text-sm text-[#5f5a8a]">{r.comment}</p>
              </div>
              <button
                type="button"
                className={cn(appTemplateOutlineButtonClass, "min-h-9 rounded-xl px-3 text-xs font-bold")}
                onClick={() => void toggle(r.id, !r.isPublished)}
              >
                {r.isPublished ? "ซ่อน" : "เผยแพร่"}
              </button>
            </li>
          ))}
          {reviews.length === 0 ? (
            <p className="text-sm font-semibold text-[#8b87b8]">ยังไม่มีรีวิว</p>
          ) : null}
        </ul>
      )}
    </div>
  );
}
