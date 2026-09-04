"use client";

import { useEffect, useRef, useState } from "react";
import {
  AppSignaturePad,
  type AppSignaturePadHandle,
  useAppNoticePopup,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { formatBangkokDateTimeLong } from "@/lib/time/bangkok";
import type { ClubEventCheckInDto } from "@/systems/club-event/lib/desk";
import {
  clubEventFieldClass,
  clubEventGlassShellClass,
  clubEventOutlineButtonClass,
  clubEventPrimaryButtonClass,
} from "@/systems/club-event/lib/ui-tokens";

type Hit = {
  kind: "submission" | "member";
  submissionId?: string;
  memberId?: string;
  name: string;
  phone: string;
  memberCode: string;
  alreadyCheckedIn: boolean;
  fulfillmentCount: number;
};

export function ClubEventPublicCheckInClient({
  slug,
  eventId,
  trialParam,
}: {
  slug: string;
  eventId: string;
  trialParam?: string;
}) {
  const notice = useAppNoticePopup();
  const padRef = useRef<AppSignaturePadHandle>(null);
  const tq = trialParam ? `?t=${encodeURIComponent(trialParam)}` : "";
  const base = `/api/club-event/public/${encodeURIComponent(slug)}/events/${encodeURIComponent(eventId)}/check-in${tq}`;

  const [eventTitle, setEventTitle] = useState("");
  const [clubName, setClubName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const [checkIn, setCheckIn] = useState<ClubEventCheckInDto | null>(null);
  const [walkOpen, setWalkOpen] = useState(false);
  const [walkName, setWalkName] = useState("");
  const [walkPhone, setWalkPhone] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(base);
        const data = (await res.json()) as {
          event?: { title: string; eventDate: string };
          clubName?: string;
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
        if (cancelled) return;
        setEventTitle(data.event?.title ?? "");
        setEventDate(data.event?.eventDate ?? "");
        setClubName(data.clubName ?? "");
        setReady(true);
      } catch (e) {
        if (cancelled) return;
        setBootError(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [base]);

  const search = async () => {
    if (q.trim().length < 2) {
      notice.error("พิมพ์อย่างน้อย 2 ตัวอักษร");
      return;
    }
    setBusy(true);
    try {
      const sep = base.includes("?") ? "&" : "?";
      const res = await fetch(`${base}${sep}q=${encodeURIComponent(q.trim())}`);
      const data = (await res.json()) as { hits?: Hit[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "ค้นหาไม่สำเร็จ");
      setHits(data.hits ?? []);
      if ((data.hits ?? []).length === 0) notice.error("ไม่พบรายการ — ลอง Walk-in");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ค้นหาไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const doCheckIn = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        checkIn?: ClubEventCheckInDto;
        already?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "เช็กอินไม่สำเร็จ");
      notice.success(data.already ? "เช็กอินไว้แล้ว" : "เช็กอินสำเร็จ");
      if (data.checkIn) setCheckIn(data.checkIn);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "เช็กอินไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const sign = async () => {
    if (!checkIn) return;
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) {
      notice.error("เซ็นชื่อก่อนบันทึก");
      return;
    }
    setBusy(true);
    try {
      const blob = await pad.toPngBlob();
      if (!blob) throw new Error("อ่านลายเซ็นไม่สำเร็จ");
      const file = new File([blob], `signature-${Date.now()}.png`, { type: "image/png" });
      const fd = new FormData();
      fd.set("file", file);
      fd.set("checkInId", checkIn.id);
      const res = await fetch(base, { method: "PUT", body: fd });
      const data = (await res.json()) as { checkIn?: ClubEventCheckInDto; error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      if (data.checkIn) setCheckIn(data.checkIn);
      notice.success("เซ็นรับของแล้ว");
      pad.clear();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  if (bootError) {
    return (
      <>
        {notice.popup}
        <div className={cn(clubEventGlassShellClass, "mx-auto max-w-lg p-6 text-center")}>
          <p className="font-bold text-rose-700">{bootError}</p>
        </div>
      </>
    );
  }

  if (!ready) {
    return (
      <>
        {notice.popup}
        <div className={cn(clubEventGlassShellClass, "mx-auto max-w-lg p-6 text-center")}>
          <p className="text-sm font-semibold text-[#66638c]">กำลังโหลด…</p>
        </div>
      </>
    );
  }

  return (
    <>
      {notice.popup}
      <div className={cn(clubEventGlassShellClass, "mx-auto max-w-lg space-y-4 p-4 sm:p-6")}>
      <header className="space-y-1 text-center">
        <p className="text-xs font-bold text-[#66638c]">{clubName || "ชมรม"}</p>
        <h1 className="text-xl font-black text-[#1e1b4b]">{eventTitle || "เช็กอินวันงาน"}</h1>
        {eventDate ? (
          <p className="text-xs font-semibold text-[#8b87b8]">
            {formatBangkokDateTimeLong(eventDate)}
          </p>
        ) : null}
      </header>

      {checkIn ? (
        <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
          <p className="text-center text-sm font-black text-emerald-800">
            เช็กอินแล้ว · {checkIn.guestName}
          </p>
          {checkIn.fulfillment.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {checkIn.fulfillment.map((f) => (
                <li key={f.key} className="flex justify-between gap-2 font-semibold text-[#1e1b4b]">
                  <span>
                    {f.label} ×{f.qty}
                  </span>
                  <span className={f.delivered ? "text-emerald-700" : "text-amber-700"}>
                    {f.delivered ? "รับแล้ว" : "รอรับที่โต๊ะ"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-xs font-semibold text-[#66638c]">ไม่มีรายการของแจก</p>
          )}
          {checkIn.fulfillment.some((f) => f.delivered) && !checkIn.signatureImageUrl ? (
            <div className="space-y-2">
              <p className="text-xs font-black text-[#4d47b6]">เซ็นรับของ</p>
              <AppSignaturePad ref={padRef} disabled={busy} />
              <button
                type="button"
                className={cn(clubEventPrimaryButtonClass, "w-full")}
                disabled={busy}
                onClick={() => void sign()}
              >
                บันทึกลายเซ็น
              </button>
            </div>
          ) : checkIn.signatureImageUrl ? (
            <p className="text-center text-xs font-bold text-emerald-700">เซ็นรับครบแล้ว ขอบคุณครับ</p>
          ) : null}
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              className={cn(clubEventFieldClass, "min-w-0 flex-1")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ชื่อ · เบอร์ · รหัสสมาชิก"
              onKeyDown={(e) => {
                if (e.key === "Enter") void search();
              }}
            />
            <button
              type="button"
              className={clubEventPrimaryButtonClass}
              disabled={busy}
              onClick={() => void search()}
            >
              ค้นหา
            </button>
          </div>

          {hits.length > 0 ? (
            <ul className="space-y-2">
              {hits.map((h) => (
                <li
                  key={`${h.kind}-${h.submissionId ?? h.memberId}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#1e1b4b]">{h.name}</p>
                    <p className="truncate text-[11px] font-semibold text-[#66638c]">
                      {[h.memberCode, h.phone].filter(Boolean).join(" · ")}
                      {h.fulfillmentCount > 0 ? ` · ของ ${h.fulfillmentCount} ชิ้น` : ""}
                    </p>
                  </div>
                  {h.alreadyCheckedIn ? (
                    <span className="text-[11px] font-bold text-emerald-700">มาแล้ว</span>
                  ) : (
                    <button
                      type="button"
                      className={clubEventPrimaryButtonClass}
                      disabled={busy}
                      onClick={() =>
                        void doCheckIn(
                          h.kind === "submission"
                            ? { submissionId: h.submissionId }
                            : { memberId: h.memberId },
                        )
                      }
                    >
                      เช็กอิน
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="rounded-xl border border-dashed border-[#d8d6ec] bg-white/80 p-3">
            <button
              type="button"
              className={cn(clubEventOutlineButtonClass, "w-full")}
              onClick={() => setWalkOpen((o) => !o)}
            >
              {walkOpen ? "ปิดฟอร์ม Walk-in" : "ยังไม่ลงทะเบียนล่วงหน้า — กรอกชื่อที่นี่"}
            </button>
            {walkOpen ? (
              <div className="mt-3 space-y-2">
                <input
                  className={clubEventFieldClass}
                  value={walkName}
                  onChange={(e) => setWalkName(e.target.value)}
                  placeholder="ชื่อ *"
                />
                <input
                  className={clubEventFieldClass}
                  value={walkPhone}
                  onChange={(e) => setWalkPhone(e.target.value)}
                  placeholder="เบอร์โทร"
                />
                <button
                  type="button"
                  className={cn(clubEventPrimaryButtonClass, "w-full")}
                  disabled={busy || !walkName.trim()}
                  onClick={() =>
                    void doCheckIn({
                      walkIn: true,
                      guestName: walkName.trim(),
                      guestPhone: walkPhone.trim(),
                    })
                  }
                >
                  เช็กอิน Walk-in
                </button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
    </>
  );
}
