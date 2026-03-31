"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-container";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { resolveAssetUrl } from "@/components/qr/shop-qr-template";
import { createVillageSessionApiRepository, type VillageHouse, type VillageSlip } from "@/systems/village/village-service";

function currentYm(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }).slice(0, 7);
}

export function VillageSlipsClient({ baseUrl }: { baseUrl: string }) {
  const api = useMemo(() => createVillageSessionApiRepository(), []);
  const [houses, setHouses] = useState<VillageHouse[]>([]);
  const [slips, setSlips] = useState<VillageSlip[]>([]);
  const [filter, setFilter] = useState<"PENDING" | "ALL">("PENDING");
  const [filterYm, setFilterYm] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const q: { status?: string; year_month?: string } = {};
      if (filter === "PENDING") q.status = "PENDING";
      if (filterYm.trim()) q.year_month = filterYm.trim();
      const [h, s] = await Promise.all([api.getHouses(), api.getSlips(q)]);
      setHouses(h.houses);
      setSlips(s.slips);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    }
  }, [api, filter, filterYm]);

  useEffect(() => {
    void load();
  }, [load]);

  const [houseId, setHouseId] = useState("");
  const [ym, setYm] = useState(currentYm);
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [review, setReview] = useState<{ slip: VillageSlip; action: "APPROVED" | "REJECTED" } | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  useEffect(() => {
    if (review) setReviewNote("");
  }, [review]);

  return (
    <div className="space-y-8">
      <PageHeader title="ตรวจสอบสลิป" description="อัปโหลดสลิปโอน กรองตามเดือน และอนุมัติ/ปฏิเสธพร้อมหมายเหตุ" />
      <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">แนบสลิปใหม่</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            บ้าน
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={houseId}
              onChange={(e) => setHouseId(e.target.value)}
            >
              <option value="">— เลือก —</option>
              {houses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.house_no} {h.owner_name ? `· ${h.owner_name}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            เดือน
            <input type="month" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono" value={ym} onChange={(e) => setYm(e.target.value)} />
          </label>
          <label className="text-sm">
            จำนวนเงิน (บาท)
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
            />
          </label>
          <label className="text-sm">
            รูปสลิป
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mt-1 w-full text-sm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <button
          type="button"
          className="mt-4 rounded-lg bg-[#0000BF] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={!houseId || !file || !amount}
          onClick={async () => {
            const fd = new FormData();
            fd.set("house_id", houseId);
            fd.set("year_month", ym.trim());
            fd.set("amount", amount.trim());
            fd.set("file", file!);
            try {
              await api.postSlip(fd);
              setAmount("");
              setFile(null);
              void load();
            } catch (e) {
              alert(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
            }
          }}
        >
          อัปโหลด
        </button>
      </section>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm ${filter === "PENDING" ? "bg-[#0000BF]/10 text-[#0000BF]" : "bg-slate-100"}`}
            onClick={() => setFilter("PENDING")}
          >
            รอตรวจ
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm ${filter === "ALL" ? "bg-[#0000BF]/10 text-[#0000BF]" : "bg-slate-100"}`}
            onClick={() => setFilter("ALL")}
          >
            ทั้งหมด
          </button>
        </div>
        <label className="text-sm">
          <span className="text-slate-600">กรองเดือน (เว้นว่าง = ทุกเดือน)</span>
          <input
            type="month"
            className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 font-mono"
            value={filterYm}
            onChange={(e) => setFilterYm(e.target.value)}
          />
        </label>
        <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onClick={() => void load()}>
          โหลดรายการ
        </button>
      </div>
      {err ? <p className="text-sm text-rose-600">{err}</p> : null}
      <ul className="space-y-4">
        {slips.map((s) => {
          const src = resolveAssetUrl(s.slip_image_url, baseUrl);
          return (
            <li key={s.id} className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap gap-4">
                {src ? (
                  <a href={src} target="_blank" rel="noreferrer" className="block h-40 w-32 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <img src={src} alt="สลิป" className="h-full w-full object-cover" />
                  </a>
                ) : null}
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">
                    บ้าน {s.house_no} · {s.year_month} · {s.amount.toLocaleString("th-TH")} บาท
                  </p>
                  <p className="text-slate-600">สถานะ: {s.status}</p>
                  <p className="text-xs text-slate-500">ส่งเมื่อ {new Date(s.submitted_at).toLocaleString("th-TH")}</p>
                  {s.reviewer_note ? <p className="mt-1 text-xs text-slate-600">หมายเหตุ: {s.reviewer_note}</p> : null}
                  {s.status === "PENDING" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
                        onClick={() => setReview({ slip: s, action: "APPROVED" })}
                      >
                        อนุมัติ
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-700"
                        onClick={() => setReview({ slip: s, action: "REJECTED" })}
                      >
                        ปฏิเสธ
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {slips.length === 0 ? <p className="text-sm text-slate-500">ไม่มีรายการ</p> : null}

      {review ? (
        <FormModal
          open
          title={review.action === "APPROVED" ? "อนุมัติสลิป" : "ปฏิเสธสลิป"}
          description={`บ้าน ${review.slip.house_no} · ${review.slip.year_month}`}
          onClose={() => setReview(null)}
          size="md"
          footer={
            <FormModalFooterActions
              cancelLabel="ยกเลิก"
              onCancel={() => setReview(null)}
              submitLabel={review.action === "APPROVED" ? "อนุมัติ" : "ปฏิเสธ"}
              onSubmit={async () => {
                try {
                  await api.patchSlip(review.slip.id, {
                    status: review.action,
                    reviewer_note: reviewNote.trim() || null,
                  });
                  setReview(null);
                  void load();
                } catch (e) {
                  alert(e instanceof Error ? e.message : "ไม่สำเร็จ");
                }
              }}
            />
          }
        >
          <label className="block text-sm">
            <span className="text-slate-600">หมายเหตุถึงลูกบ้าน (ไม่บังคับ)</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder={review.action === "REJECTED" ? "เช่น ยอดไม่ตรง รูปไม่ชัด" : "เช่น รับยอดตามสลิปแล้ว"}
            />
          </label>
        </FormModal>
      ) : null}
    </div>
  );
}
