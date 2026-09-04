"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowLeft, QrCode, Search } from "lucide-react";
import {
  AppEmptyState,
  AppSignaturePad,
  type AppSignaturePadHandle,
  useAppNoticePopup,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { formatBangkokDateTimeLong } from "@/lib/time/bangkok";
import {
  CLUB_EVENT_BASE,
  clubEventEventHref,
} from "@/systems/club-event/club-event-module-nav";
import { ClubEventPageSubNav } from "@/systems/club-event/components/ClubEventPageSubNav";
import {
  clubEventPublicCheckInPath,
  type ClubEventCheckInDto,
} from "@/systems/club-event/lib/desk";
import { uploadClubEventSignatureBlob } from "@/systems/club-event/lib/upload-signature";
import {
  clubEventPageTitleIcon,
  clubEventPageTitleTone,
} from "@/systems/club-event/lib/page-menu-icons";
import {
  clubEventFieldClass,
  clubEventOutlineButtonClass,
  clubEventPrimaryButtonClass,
  clubEventRowCardClass,
  clubEventStatInlineClass,
} from "@/systems/club-event/lib/ui-tokens";

type DeskPayload = {
  event: {
    id: string;
    title: string;
    eventDate: string;
    slug: string;
    clubName: string;
  };
  summary: {
    checkedIn: number;
    registered: number;
    pendingFulfill: number;
    pendingPay: number;
    pendingSign: number;
  };
  checkIns: ClubEventCheckInDto[];
  registered: Array<{
    kind: "submission";
    submissionId: string;
    linkTitle: string;
    name: string;
    phone: string;
    memberCode: string;
    amountBaht: number | null;
    fulfillment: ClubEventCheckInDto["fulfillment"];
    alreadyCheckedIn: boolean;
  }>;
  members: Array<{
    kind: "member";
    memberId: string;
    name: string;
    phone: string;
    memberCode: string;
    alreadyCheckedIn: boolean;
  }>;
};

export function ClubEventEventDeskClient({ eventId }: { eventId: string }) {
  const notice = useAppNoticePopup();
  const padRef = useRef<AppSignaturePadHandle>(null);
  const [q, setQ] = useState("");
  const [data, setData] = useState<DeskPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<ClubEventCheckInDto | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [walkName, setWalkName] = useState("");
  const [walkPhone, setWalkPhone] = useState("");

  const load = useCallback(
    async (query = q) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        const res = await fetch(
          `/api/club-event/session/events/${encodeURIComponent(eventId)}/desk?${params}`,
        );
        const json = (await res.json()) as DeskPayload & { error?: string };
        if (!res.ok) throw new Error(json.error ?? "โหลดไม่สำเร็จ");
        setData(json);
        setSelected((prev) => {
          if (!prev) return prev;
          return json.checkIns.find((c) => c.id === prev.id) ?? prev;
        });
      } catch (e) {
        notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    },
    [eventId, notice, q],
  );

  useEffect(() => {
    void load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  useEffect(() => {
    if (!data?.event.slug) return;
    const path = clubEventPublicCheckInPath(data.event.slug, data.event.id);
    const url =
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    void QRCode.toDataURL(url, { width: 280, margin: 2, errorCorrectionLevel: "M" }).then(
      setQrDataUrl,
      () => setQrDataUrl(null),
    );
  }, [data?.event.id, data?.event.slug]);

  const checkIn = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/club-event/session/events/${encodeURIComponent(eventId)}/desk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const json = (await res.json()) as {
        checkIn?: ClubEventCheckInDto;
        already?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "เช็กอินไม่สำเร็จ");
      notice.success(json.already ? "เช็กอินไว้แล้ว" : "เช็กอินแล้ว");
      if (json.checkIn) setSelected(json.checkIn);
      setWalkName("");
      setWalkPhone("");
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "เช็กอินไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const patchCheckIn = async (id: string, body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/club-event/session/events/${encodeURIComponent(eventId)}/desk/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const json = (await res.json()) as { checkIn?: ClubEventCheckInDto; error?: string };
      if (!res.ok) throw new Error(json.error ?? "บันทึกไม่สำเร็จ");
      if (json.checkIn) setSelected(json.checkIn);
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const saveSignature = async () => {
    if (!selected) return;
    if (selected.fulfillment.some((f) => !f.delivered)) {
      notice.error("จ่ายของครบทุกรายการก่อนเซ็นรับ");
      return;
    }
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) {
      notice.error("ให้ผู้รับเซ็นชื่อก่อนบันทึก");
      return;
    }
    setBusy(true);
    try {
      const blob = await pad.toPngBlob();
      if (!blob) throw new Error("อ่านลายเซ็นไม่สำเร็จ");
      const imageUrl = await uploadClubEventSignatureBlob(blob);
      const res = await fetch(
        `/api/club-event/session/events/${encodeURIComponent(eventId)}/desk/${encodeURIComponent(selected.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signatureImageUrl: imageUrl }),
        },
      );
      const json = (await res.json()) as { checkIn?: ClubEventCheckInDto; error?: string };
      if (!res.ok) throw new Error(json.error ?? "บันทึกไม่สำเร็จ");
      if (json.checkIn) setSelected(json.checkIn);
      notice.success("บันทึกลายเซ็นรับของแล้ว");
      pad.clear();
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกลายเซ็นไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const publicUrl =
    data?.event.slug && typeof window !== "undefined"
      ? `${window.location.origin}${clubEventPublicCheckInPath(data.event.slug, data.event.id)}`
      : data?.event.slug
        ? clubEventPublicCheckInPath(data.event.slug, data.event.id)
        : "";

  return (
    <>
      {notice.popup}
      <ClubEventPageSubNav
      title="จุดลงทะเบียนวันงาน"
      titleIcon={clubEventPageTitleIcon("eventDetail")}
      titleTone={clubEventPageTitleTone("eventDetail")}
      subtitle={data?.event.title}
      action={
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href={clubEventEventHref(eventId)}
            className={cn(
              clubEventOutlineButtonClass,
              "inline-flex min-h-[40px] min-w-[40px] items-center justify-center",
            )}
            aria-label="กลับกิจกรรม"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
          <button
            type="button"
            className={cn(clubEventOutlineButtonClass, "min-h-[40px]")}
            onClick={() => void load()}
            disabled={loading}
          >
            รีเฟรช
          </button>
        </div>
      }
    >
      {loading && !data ? (
        <p className="py-8 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
      ) : !data ? (
        <AppEmptyState>
          ไม่พบกิจกรรม —{" "}
          <Link href={CLUB_EVENT_BASE} className="font-semibold text-[#0000BF] underline">
            กลับแดชบอร์ด
          </Link>
        </AppEmptyState>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#e4e0f5] bg-[#faf9ff]/90 p-3">
            <p className="text-sm font-black text-[#1e1b4b]">{data.event.title}</p>
            <p className="text-xs font-semibold text-[#66638c]">
              {formatBangkokDateTimeLong(data.event.eventDate)} · {data.event.clubName}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className={cn(clubEventStatInlineClass, "border-l-[3px] border-l-emerald-500")}>
              <p className="text-[10px] font-semibold text-emerald-700">มาแล้ว</p>
              <p className="text-lg font-black tabular-nums text-emerald-800">
                {data.summary.checkedIn}
              </p>
            </div>
            <div className={cn(clubEventStatInlineClass, "border-l-[3px] border-l-indigo-500")}>
              <p className="text-[10px] font-semibold text-indigo-700">ลงทะเบียนล่วงหน้า</p>
              <p className="text-lg font-black tabular-nums text-[#1e1b4b]">
                {data.summary.registered}
              </p>
            </div>
            <div className={cn(clubEventStatInlineClass, "border-l-[3px] border-l-amber-500")}>
              <p className="text-[10px] font-semibold text-amber-800">รอรับของ</p>
              <p className="text-lg font-black tabular-nums text-amber-900">
                {data.summary.pendingFulfill}
              </p>
            </div>
            <div
              className={cn(
                clubEventStatInlineClass,
                "col-span-2 border-l-[3px] border-l-rose-500 sm:col-span-1",
              )}
            >
              <p className="text-[10px] font-semibold text-rose-700">รอเซ็นรับ</p>
              <p className="text-lg font-black tabular-nums text-rose-800">
                {data.summary.pendingSign}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  className={cn(clubEventFieldClass, "min-w-0 flex-1")}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="ค้นชื่อ · เบอร์ · รหัสสมาชิก"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void load();
                  }}
                />
                <button
                  type="button"
                  className={cn(clubEventOutlineButtonClass, "min-h-[40px] min-w-[40px]")}
                  aria-label="ค้นหา"
                  onClick={() => void load()}
                >
                  <Search className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <section className="space-y-2">
                <h3 className="text-xs font-black text-[#4d47b6]">ลงทะเบียนล่วงหน้า</h3>
                {data.registered.length === 0 ? (
                  <p className="text-sm text-[#8b87b8]">ไม่พบรายการ / ยังไม่มีคำตอบลิงก์ที่ผูกกิจกรรม</p>
                ) : (
                  <ul className="space-y-2">
                    {data.registered.map((r) => (
                      <li
                        key={r.submissionId}
                        className={cn(
                          clubEventRowCardClass,
                          "flex flex-row items-center justify-between gap-2 p-3",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-bold text-[#1e1b4b]">{r.name || "ไม่ระบุชื่อ"}</p>
                          <p className="truncate text-[11px] font-semibold text-[#66638c]">
                            {[r.memberCode, r.phone, r.linkTitle].filter(Boolean).join(" · ")}
                          </p>
                          {r.fulfillment.length > 0 ? (
                            <p className="mt-0.5 text-[11px] font-semibold text-[#4d47b6]">
                              ของ:{" "}
                              {r.fulfillment.map((f) => `${f.label}×${f.qty}`).join(" · ")}
                            </p>
                          ) : null}
                        </div>
                        {r.alreadyCheckedIn ? (
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                            มาแล้ว
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            className={cn(clubEventPrimaryButtonClass, "shrink-0")}
                            onClick={() =>
                              void checkIn({ submissionId: r.submissionId, source: "STAFF" })
                            }
                          >
                            เช็กอิน
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-black text-[#4d47b6]">สมาชิกชมรม (ยังไม่ผูกฟอร์มก็ได้)</h3>
                {data.members.length === 0 ? (
                  <p className="text-sm text-[#8b87b8]">ไม่พบสมาชิกตามคำค้น</p>
                ) : (
                  <ul className="max-h-64 space-y-2 overflow-y-auto">
                    {data.members.map((m) => (
                      <li
                        key={m.memberId}
                        className={cn(
                          clubEventRowCardClass,
                          "flex flex-row items-center justify-between gap-2 p-3",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-bold text-[#1e1b4b]">{m.name}</p>
                          <p className="truncate text-[11px] font-semibold text-[#66638c]">
                            {[m.memberCode, m.phone].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </div>
                        {m.alreadyCheckedIn ? (
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                            มาแล้ว
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            className={cn(clubEventOutlineButtonClass, "shrink-0")}
                            onClick={() =>
                              void checkIn({ memberId: m.memberId, source: "STAFF" })
                            }
                          >
                            เช็กอิน
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="space-y-2 rounded-xl border border-dashed border-[#d8d6ec] bg-white/80 p-3">
                <h3 className="text-xs font-black text-[#4d47b6]">Walk-in — มาหน้างาน (ยังไม่ลงทะเบียน)</h3>
                <div className="grid gap-2 sm:grid-cols-2">
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
                </div>
                <button
                  type="button"
                  disabled={busy || !walkName.trim()}
                  className={cn(clubEventPrimaryButtonClass, "w-full sm:w-auto")}
                  onClick={() =>
                    void checkIn({
                      guestName: walkName.trim(),
                      guestPhone: walkPhone.trim(),
                      source: "WALK_IN",
                    })
                  }
                >
                  เช็กอิน Walk-in
                </button>
              </section>
            </div>

            <aside className="space-y-3">
              <div className="rounded-xl border border-[#e4e0f5] bg-white p-3 text-center">
                <p className="mb-2 flex items-center justify-center gap-1 text-xs font-black text-[#4d47b6]">
                  <QrCode className="h-4 w-4" aria-hidden />
                  QR ให้สมาชิกสแกน
                </p>
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="QR เช็กอิน" className="mx-auto h-44 w-44" />
                ) : (
                  <p className="py-8 text-xs text-[#9490c0]">กำลังสร้าง QR…</p>
                )}
                <p className="mt-2 break-all text-[10px] font-semibold text-[#8b87b8]">{publicUrl}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    className={clubEventOutlineButtonClass}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(publicUrl);
                        notice.success("คัดลอกลิงก์แล้ว");
                      } catch {
                        notice.error("คัดลอกไม่สำเร็จ");
                      }
                    }}
                  >
                    คัดลอกลิงก์
                  </button>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={clubEventOutlineButtonClass}
                  >
                    เปิดหน้าสมาชิก
                  </a>
                </div>
              </div>

              {selected ? (
                <div className="space-y-3 rounded-xl border border-[#e4e0f5] bg-[#faf9ff]/90 p-3">
                  <div>
                    <p className="text-sm font-black text-[#1e1b4b]">{selected.guestName}</p>
                    <p className="text-[11px] font-semibold text-[#66638c]">
                      {[selected.memberCode, selected.guestPhone, selected.source]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="text-[10px] text-[#9490c0]">
                      เช็กอิน {formatBangkokDateTimeLong(selected.checkedInAt)}
                    </p>
                  </div>

                  {selected.fulfillment.length > 0 ? (
                    <ul className="space-y-1.5">
                      {selected.fulfillment.map((f) => (
                        <li
                          key={f.key}
                          className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-sm"
                        >
                          <span className="min-w-0 font-semibold text-[#1e1b4b]">
                            {f.label} ×{f.qty}
                          </span>
                          {f.delivered ? (
                            <button
                              type="button"
                              className="text-[11px] font-bold text-emerald-700"
                              disabled={busy}
                              onClick={() =>
                                void patchCheckIn(selected.id, { undeliverKey: f.key })
                              }
                            >
                              จ่ายแล้ว · ยกเลิก
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={cn(clubEventPrimaryButtonClass, "text-[11px]")}
                              disabled={busy}
                              onClick={() =>
                                void patchCheckIn(selected.id, { deliverKey: f.key })
                              }
                            >
                              จ่ายของ
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs font-semibold text-[#8b87b8]">ไม่มีรายการของแจกจากฟอร์ม</p>
                  )}

                  {selected.fulfillment.some((f) => !f.delivered) ? (
                    <button
                      type="button"
                      className={cn(clubEventOutlineButtonClass, "w-full")}
                      disabled={busy}
                      onClick={() => void patchCheckIn(selected.id, { deliverAll: true })}
                    >
                      จ่ายของทั้งหมด
                    </button>
                  ) : null}

                  {selected.fulfillment.some((f) => f.delivered) ? (
                    <div className="space-y-2">
                      <p className="text-xs font-black text-[#4d47b6]">เซ็นรับของ</p>
                      {selected.signatureImageUrl ? (
                        <p className="text-xs font-bold text-emerald-700">เซ็นรับแล้ว</p>
                      ) : (
                        <>
                          <AppSignaturePad ref={padRef} disabled={busy} />
                          <button
                            type="button"
                            className={cn(clubEventPrimaryButtonClass, "w-full")}
                            disabled={busy}
                            onClick={() => void saveSignature()}
                          >
                            บันทึกลายเซ็น
                          </button>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-[#d8d6ec] bg-white/70 p-4 text-center text-xs font-semibold text-[#8b87b8]">
                  เลือกคนจากรายการเช็กอิน หรือกดเช็กอินเพื่อเปิดแผงจ่ายของ/เซ็นรับ
                </p>
              )}

              <section className="space-y-2">
                <h3 className="text-xs font-black text-[#4d47b6]">มาแล้วล่าสุด</h3>
                <ul className="max-h-56 space-y-1.5 overflow-y-auto">
                  {data.checkIns.slice(0, 30).map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={cn(
                          clubEventRowCardClass,
                          "w-full p-2.5 text-left",
                          selected?.id === c.id && "ring-2 ring-[#0000BF]/30",
                        )}
                        onClick={() => setSelected(c)}
                      >
                        <p className="truncate text-sm font-bold text-[#1e1b4b]">{c.guestName}</p>
                        <p className="truncate text-[10px] font-semibold text-[#9490c0]">
                          {formatBangkokDateTimeLong(c.checkedInAt)} · {c.source}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>
        </div>
      )}
    </ClubEventPageSubNav>
    </>
  );
}
