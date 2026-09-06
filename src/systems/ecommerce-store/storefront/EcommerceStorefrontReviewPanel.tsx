"use client";

import { useState } from "react";
import { useAppNoticePopup } from "@/components/app-templates";
import { EcommerceRemoteImg } from "@/systems/ecommerce-store/components/EcommerceRemoteImg";
import {
  ecommerceStoreFieldClass,
  ecommerceStoreOutlineButtonClass,
  ecommerceStorePrimaryButtonClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";
import { cn } from "@/lib/cn";

type LookupItem = {
  productId: string;
  productName: string;
  imageUrl: string | null;
  alreadyReviewed: boolean;
};

type Props = {
  storeId: string;
};

export function EcommerceStorefrontReviewPanel({ storeId }: Props) {
  const notice = useAppNoticePopup();
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<LookupItem[] | null>(null);
  const [orderLabel, setOrderLabel] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitBusy, setSubmitBusy] = useState(false);

  async function lookup() {
    setBusy(true);
    setItems(null);
    setSelectedId("");
    try {
      const res = await fetch(
        `/api/ecommerce-store/public/${encodeURIComponent(storeId)}/reviews/lookup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, phone }),
        },
      );
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        order?: { referenceCode?: string };
        items?: LookupItem[];
      };
      if (!res.ok) {
        notice.error(j.error ?? "ค้นหาออเดอร์ไม่สำเร็จ");
        return;
      }
      setItems(j.items ?? []);
      setOrderLabel(j.order?.referenceCode ?? code.trim().toUpperCase());
      const first = (j.items ?? []).find((it) => !it.alreadyReviewed);
      if (first) setSelectedId(first.productId);
    } catch {
      notice.error("เครือข่ายมีปัญหา — ลองใหม่");
    } finally {
      setBusy(false);
    }
  }

  async function submitReview() {
    if (!selectedId) {
      notice.error("เลือกสินค้าที่ต้องการรีวิว");
      return;
    }
    setSubmitBusy(true);
    try {
      const res = await fetch(
        `/api/ecommerce-store/public/${encodeURIComponent(storeId)}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            phone,
            productId: selectedId,
            rating,
            comment,
          }),
        },
      );
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        notice.error(j.error ?? "บันทึกรีวิวไม่สำเร็จ");
        return;
      }
      notice.success("บันทึกรีวิวแล้ว — ขอบคุณครับ");
      setComment("");
      setItems((list) =>
        (list ?? []).map((it) =>
          it.productId === selectedId ? { ...it, alreadyReviewed: true } : it,
        ),
      );
      setSelectedId("");
    } catch {
      notice.error("เครือข่ายมีปัญหา — ลองใหม่");
    } finally {
      setSubmitBusy(false);
    }
  }

  const reviewable = (items ?? []).filter((it) => !it.alreadyReviewed);

  return (
    <div className="space-y-4">
      {notice.popup}
      <p className="text-sm font-medium text-[#5f5a8a]">
        ค้นหาออเดอร์ที่จัดส่งแล้วด้วยรหัสออเดอร์/ติดตาม และเบอร์โทรที่ใช้สั่ง — สินค้า 1 ชิ้นรีวิวได้ 1 ครั้งต่อเบอร์
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-bold text-[#4d47b6]">รหัสออเดอร์ / ติดตาม</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={ecommerceStoreFieldClass}
            placeholder="เช่น EC-…"
            autoComplete="off"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold text-[#4d47b6]">เบอร์โทร</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={ecommerceStoreFieldClass}
            placeholder="08x-xxx-xxxx"
            inputMode="tel"
            autoComplete="tel"
          />
        </label>
      </div>
      <button
        type="button"
        disabled={busy || !code.trim() || !phone.trim()}
        onClick={() => void lookup()}
        className={cn(ecommerceStorePrimaryButtonClass, "w-full sm:w-auto")}
      >
        {busy ? "กำลังค้นหา…" : "ค้นหาออเดอร์"}
      </button>

      {items ? (
        <div className="space-y-3 rounded-xl border border-slate-200/90 bg-white p-3 sm:p-4">
          <p className="text-xs font-bold text-[#1e1b4b]">ออเดอร์ {orderLabel}</p>
          {items.length === 0 ? (
            <p className="text-sm text-[#66638c]">ออเดอร์นี้ไม่มีสินค้าให้รีวิว</p>
          ) : (
            <ul className="space-y-2">
              {items.map((it) => (
                <li key={it.productId}>
                  <button
                    type="button"
                    disabled={it.alreadyReviewed}
                    onClick={() => setSelectedId(it.productId)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-2 text-left transition",
                      it.alreadyReviewed
                        ? "cursor-default border-emerald-200 bg-emerald-50/80"
                        : selectedId === it.productId
                          ? "border-[#5b61ff] bg-[#5b61ff]/8 ring-2 ring-[#5b61ff]/25"
                          : "border-slate-200 bg-slate-50/80 hover:border-slate-300",
                    )}
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      <EcommerceRemoteImg
                        src={it.imageUrl}
                        className="h-full w-full object-cover"
                        fallback={
                          <div className="flex h-full items-center justify-center text-[10px] text-[#8b87b8]">
                            —
                          </div>
                        }
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-bold text-[#1e1b4b]">{it.productName}</p>
                      <p className="text-[10px] font-semibold text-[#66638c]">
                        {it.alreadyReviewed ? "รีวิวแล้ว" : "แตะเพื่อเลือกรีวิว"}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {reviewable.length > 0 && selectedId ? (
            <div className="space-y-3 border-t border-slate-200/80 pt-3">
              <div>
                <p className="mb-1.5 text-xs font-bold text-[#4d47b6]">ให้คะแนน</p>
                <div className="flex gap-1" role="group" aria-label="คะแนนดาว">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className={cn(
                        "min-h-10 min-w-10 rounded-lg text-lg",
                        n <= rating ? "text-amber-500" : "text-slate-300",
                      )}
                      aria-label={`${n} ดาว`}
                      aria-pressed={n === rating}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-[#4d47b6]">ความคิดเห็น (ไม่บังคับ)</span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={800}
                  className={cn(ecommerceStoreFieldClass, "resize-y")}
                  placeholder="เล่าประสบการณ์ใช้สินค้าสั้น ๆ"
                />
              </label>
              <button
                type="button"
                disabled={submitBusy}
                onClick={() => void submitReview()}
                className={cn(ecommerceStorePrimaryButtonClass, "w-full sm:w-auto")}
              >
                {submitBusy ? "กำลังบันทึก…" : "ส่งรีวิว"}
              </button>
            </div>
          ) : items.length > 0 && reviewable.length === 0 ? (
            <p className="text-sm font-semibold text-emerald-700">รีวิวครบทุกรายการในออเดอร์นี้แล้ว</p>
          ) : null}
        </div>
      ) : null}

      {items === null ? (
        <p className="text-xs text-[#8b87b8]">
          ยังไม่พบออเดอร์ — กรอกข้อมูลแล้วกดค้นหา หรือ{" "}
          <a href={`/shop/${storeId}/track`} className={cn(ecommerceStoreOutlineButtonClass, "inline-flex !min-h-0 !px-2 !py-1 text-[11px]")}>
            ติดตามออเดอร์
          </a>
        </p>
      ) : null}
    </div>
  );
}
