"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowLeft, Package, QrCode, Search, UserRound } from "lucide-react";
import {
  AppEmptyState,
  AppSignaturePad,
  type AppSignaturePadHandle,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
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
import { useClubEventDeskSse } from "@/systems/club-event/lib/use-club-event-desk-sse";
import { uploadClubEventSignatureBlob } from "@/systems/club-event/lib/upload-signature";
import {
  clubEventPageTitleIcon,
  clubEventPageTitleTone,
} from "@/systems/club-event/lib/page-menu-icons";
import {
  clubEventFieldClass,
  clubEventIconButtonClass,
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

type DeskFilter = "all" | "checkedIn" | "registered" | "pendingFulfill" | "pendingSign";

function checkInNeedsFulfill(c: ClubEventCheckInDto): boolean {
  return c.fulfillment.some((f) => !f.delivered);
}

function checkInNeedsSign(c: ClubEventCheckInDto): boolean {
  return c.fulfillment.some((f) => f.delivered) && !c.signatureImageUrl;
}

function checkInStatusLabel(c: ClubEventCheckInDto): { text: string; className: string } {
  if (c.fulfillment.length === 0) {
    return { text: "เช็กอินแล้ว", className: "bg-emerald-50 text-emerald-700" };
  }
  if (checkInNeedsFulfill(c)) {
    return { text: "รอรับของ", className: "bg-amber-50 text-amber-800" };
  }
  if (checkInNeedsSign(c)) {
    return { text: "รอเซ็นรับ", className: "bg-rose-50 text-rose-700" };
  }
  return { text: "ครบแล้ว", className: "bg-emerald-50 text-emerald-700" };
}

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
  const [filter, setFilter] = useState<DeskFilter>("all");
  const [qrOpen, setQrOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const load = useCallback(
    async (query = q, opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
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
        if (!opts?.silent) {
          notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
        }
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [eventId, notice, q],
  );

  useEffect(() => {
    void load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  useClubEventDeskSse(eventId, () => void load(q, { silent: true }), Boolean(eventId));

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

  const openManage = (c: ClubEventCheckInDto) => {
    setSelected(c);
    setManageOpen(true);
  };

  const closeManage = () => {
    setManageOpen(false);
  };

  const toggleFilter = (key: DeskFilter) => {
    setFilter((prev) => (prev === key ? "all" : key));
  };

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
      if (json.checkIn) openManage(json.checkIn);
      setWalkName("");
      setWalkPhone("");
      await load(q, { silent: true });
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "เช็กอินไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const saveSignature = async () => {
    if (!selected) return;
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) {
      notice.error("ให้ผู้รับเซ็นชื่อก่อนบันทึก");
      return;
    }
    if (selected.fulfillment.length === 0) {
      notice.error("ไม่มีรายการของแจก");
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
          body: JSON.stringify({
            deliverAll: true,
            signatureImageUrl: imageUrl,
          }),
        },
      );
      const json = (await res.json()) as { checkIn?: ClubEventCheckInDto; error?: string };
      if (!res.ok) throw new Error(json.error ?? "บันทึกไม่สำเร็จ");
      if (json.checkIn) setSelected(json.checkIn);
      pad.clear();
      setManageOpen(false);
      setQrOpen(false);
      await load(q, { silent: true });
      notice.success("จ่ายของและเซ็นรับแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const filteredCheckIns = useMemo(() => {
    if (!data) return [];
    const list = data.checkIns;
    if (filter === "pendingFulfill") return list.filter(checkInNeedsFulfill);
    if (filter === "pendingSign") return list.filter(checkInNeedsSign);
    if (filter === "checkedIn") return list;
    return list;
  }, [data, filter]);

  const filteredRegistered = useMemo(() => {
    if (!data) return [];
    if (filter === "registered") {
      return data.registered.filter((r) => !r.alreadyCheckedIn);
    }
    return data.registered;
  }, [data, filter]);

  const showRegisteredSection = filter === "all" || filter === "registered";
  const showMembersSection = filter === "all";
  const showWalkInSection = filter === "all";
  const showCheckInSection =
    filter === "all" ||
    filter === "checkedIn" ||
    filter === "pendingFulfill" ||
    filter === "pendingSign";

  const publicUrl =
    data?.event.slug && typeof window !== "undefined"
      ? `${window.location.origin}${clubEventPublicCheckInPath(data.event.slug, data.event.id)}`
      : data?.event.slug
        ? clubEventPublicCheckInPath(data.event.slug, data.event.id)
        : "";

  const filterHint =
    filter === "checkedIn"
      ? "แสดงเฉพาะคนที่มาแล้ว"
      : filter === "registered"
        ? "แสดงเฉพาะลงทะเบียนล่วงหน้าที่ยังไม่เช็กอิน"
        : filter === "pendingFulfill"
          ? "แสดงเฉพาะรายการรอรับของ"
          : filter === "pendingSign"
            ? "แสดงเฉพาะรายการรอเซ็นรับ"
            : null;

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
              className={clubEventIconButtonClass}
              aria-label="กลับกิจกรรม"
              title="กลับกิจกรรม"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
            <button
              type="button"
              className={cn(clubEventOutlineButtonClass, "gap-1.5")}
              aria-label="แสดง QR เช็กอิน"
              title="QR เช็กอิน"
              onClick={() => setQrOpen(true)}
            >
              <QrCode className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">QR</span>
            </button>
            <button
              type="button"
              className={clubEventOutlineButtonClass}
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
              <p className="mt-1 text-[10px] font-semibold text-emerald-700">
                อัปเดตสดเมื่อสมาชิกเช็กอินด้วย QR
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  {
                    key: "checkedIn" as const,
                    label: "มาแล้ว",
                    value: data.summary.checkedIn,
                    border: "border-l-emerald-500",
                    tone: "text-emerald-700",
                    num: "text-emerald-800",
                  },
                  {
                    key: "registered" as const,
                    label: "ลงทะเบียนล่วงหน้า",
                    value: data.summary.registered,
                    border: "border-l-indigo-500",
                    tone: "text-indigo-700",
                    num: "text-[#1e1b4b]",
                  },
                  {
                    key: "pendingFulfill" as const,
                    label: "รอรับของ",
                    value: data.summary.pendingFulfill,
                    border: "border-l-amber-500",
                    tone: "text-amber-800",
                    num: "text-amber-900",
                  },
                  {
                    key: "pendingSign" as const,
                    label: "รอเซ็นรับ",
                    value: data.summary.pendingSign,
                    border: "border-l-rose-500",
                    tone: "text-rose-700",
                    num: "text-rose-800",
                    span: true,
                  },
                ] as const
              ).map((card) => {
                const active = filter === card.key;
                return (
                  <button
                    key={card.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleFilter(card.key)}
                    className={cn(
                      clubEventStatInlineClass,
                      "border-l-[3px] text-left transition",
                      card.border,
                      "span" in card && card.span ? "col-span-2 sm:col-span-1" : null,
                      active
                        ? "ring-2 ring-[#0000BF]/35 bg-[#0000BF]/5"
                        : "hover:bg-white/90",
                    )}
                  >
                    <p className={cn("text-[10px] font-semibold", card.tone)}>{card.label}</p>
                    <p className={cn("text-lg font-black tabular-nums", card.num)}>{card.value}</p>
                    <p className="mt-0.5 text-[9px] font-semibold text-[#9490c0]">
                      {active ? "กำลังกรอง · กดอีกครั้งเพื่อยกเลิก" : "กดเพื่อกรอง"}
                    </p>
                  </button>
                );
              })}
            </div>

            {filterHint ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-indigo-100 bg-indigo-50/70 px-3 py-2">
                <p className="text-xs font-bold text-[#4d47b6]">{filterHint}</p>
                <button
                  type="button"
                  className={clubEventOutlineButtonClass}
                  onClick={() => setFilter("all")}
                >
                  แสดงทั้งหมด
                </button>
              </div>
            ) : null}

            <div className="space-y-4">
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
                    className={clubEventIconButtonClass}
                    aria-label="ค้นหา"
                    title="ค้นหา"
                    onClick={() => void load()}
                  >
                    <Search className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={cn(clubEventPrimaryButtonClass, "gap-1.5")}
                    aria-label="แสดง QR เช็กอิน"
                    title="QR เช็กอิน"
                    onClick={() => setQrOpen(true)}
                  >
                    <QrCode className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">QR</span>
                  </button>
                </div>

                {showCheckInSection ? (
                  <section className="space-y-2">
                    <h3 className="text-sm font-black text-[#4d47b6]">
                      {filter === "pendingFulfill"
                        ? "รายการรอรับของ"
                        : filter === "pendingSign"
                          ? "รายการรอเซ็นรับ"
                          : "มาแล้ว"}
                      <span className="ml-1.5 font-semibold text-[#9490c0]">
                        ({filteredCheckIns.length})
                      </span>
                    </h3>
                    {filteredCheckIns.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-[#d8d6ec] bg-white/70 p-4 text-sm text-[#8b87b8]">
                        ไม่มีรายการในกลุ่มนี้
                      </p>
                    ) : (
                      <ul className="space-y-2.5">
                        {filteredCheckIns.map((c) => {
                          const status = checkInStatusLabel(c);
                          const pendingItems = c.fulfillment.filter((f) => !f.delivered).length;
                          return (
                            <li
                              key={c.id}
                              className={cn(
                                clubEventRowCardClass,
                                "flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4",
                                selected?.id === c.id && "ring-2 ring-[#0000BF]/35",
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-base font-black text-[#1e1b4b] sm:text-lg">
                                    {c.guestName}
                                  </p>
                                  <span
                                    className={cn(
                                      "rounded-full px-2 py-0.5 text-[11px] font-bold",
                                      status.className,
                                    )}
                                  >
                                    {status.text}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs font-semibold text-[#66638c]">
                                  {[c.memberCode, c.guestPhone, c.source].filter(Boolean).join(" · ")}
                                </p>
                                <p className="text-[11px] font-semibold text-[#9490c0]">
                                  {formatBangkokDateTimeLong(c.checkedInAt)}
                                </p>
                                {c.fulfillment.length > 0 ? (
                                  <p className="mt-1.5 text-xs font-semibold text-[#4d47b6]">
                                    ของ {c.fulfillment.reduce((n, f) => n + f.qty, 0)} ชิ้น
                                    {pendingItems > 0
                                      ? ` · รอจ่าย ${pendingItems} รายการ`
                                      : c.signatureImageUrl
                                        ? " · เซ็นรับแล้ว"
                                        : " · พร้อมเซ็นรับ"}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex shrink-0 flex-wrap gap-1.5">
                                {c.fulfillment.length > 0 &&
                                (checkInNeedsFulfill(c) || checkInNeedsSign(c)) ? (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    className={clubEventPrimaryButtonClass}
                                    onClick={() => openManage(c)}
                                  >
                                    <Package className="h-3.5 w-3.5" aria-hidden />
                                    จ่ายของทั้งหมด
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  className={clubEventOutlineButtonClass}
                                  onClick={() => openManage(c)}
                                >
                                  จัดการ
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                ) : null}

                {showRegisteredSection ? (
                  <section className="space-y-2">
                    <h3 className="text-sm font-black text-[#4d47b6]">
                      ลงทะเบียนล่วงหน้า
                      <span className="ml-1.5 font-semibold text-[#9490c0]">
                        ({filteredRegistered.length})
                      </span>
                    </h3>
                    {filteredRegistered.length === 0 ? (
                      <p className="text-sm text-[#8b87b8]">
                        {filter === "registered"
                          ? "เช็กอินครบแล้ว หรือยังไม่มีคำตอบ"
                          : "ไม่พบรายการ / ยังไม่มีคำตอบลิงก์ที่ผูกกิจกรรม"}
                      </p>
                    ) : (
                      <ul className="space-y-2.5">
                        {filteredRegistered.map((r) => (
                          <li
                            key={r.submissionId}
                            className={cn(
                              clubEventRowCardClass,
                              "flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4",
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-base font-black text-[#1e1b4b]">{r.name || "ไม่ระบุชื่อ"}</p>
                              <p className="mt-0.5 text-xs font-semibold text-[#66638c]">
                                {[r.memberCode, r.phone, r.linkTitle].filter(Boolean).join(" · ")}
                              </p>
                              {r.fulfillment.length > 0 ? (
                                <p className="mt-1 text-xs font-semibold text-[#4d47b6]">
                                  ของ:{" "}
                                  {r.fulfillment.map((f) => `${f.label}×${f.qty}`).join(" · ")}
                                </p>
                              ) : null}
                            </div>
                            {r.alreadyCheckedIn ? (
                              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                  มาแล้ว
                                </span>
                                {(() => {
                                  const linked = data.checkIns.find(
                                    (c) => c.submissionId === r.submissionId,
                                  );
                                  return linked ? (
                                    <button
                                      type="button"
                                      className={clubEventOutlineButtonClass}
                                      onClick={() => openManage(linked)}
                                    >
                                      จัดการ
                                    </button>
                                  ) : null;
                                })()}
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={busy}
                                className={cn(clubEventPrimaryButtonClass, "shrink-0")}
                                onClick={() =>
                                  void checkIn({ submissionId: r.submissionId, source: "STAFF" })
                                }
                              >
                                <UserRound className="h-3.5 w-3.5" aria-hidden />
                                เช็กอิน
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                ) : null}

                {showMembersSection ? (
                  <section className="space-y-2">
                    <h3 className="text-sm font-black text-[#4d47b6]">สมาชิกชมรม (ยังไม่ผูกฟอร์มก็ได้)</h3>
                    {data.members.length === 0 ? (
                      <p className="text-sm text-[#8b87b8]">ไม่พบสมาชิกตามคำค้น</p>
                    ) : (
                      <ul className="max-h-80 space-y-2 overflow-y-auto">
                        {data.members.map((m) => (
                          <li
                            key={m.memberId}
                            className={cn(
                              clubEventRowCardClass,
                              "flex flex-row items-center justify-between gap-3 p-3.5",
                            )}
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-[#1e1b4b]">{m.name}</p>
                              <p className="truncate text-xs font-semibold text-[#66638c]">
                                {[m.memberCode, m.phone].filter(Boolean).join(" · ") || "—"}
                              </p>
                            </div>
                            {m.alreadyCheckedIn ? (
                              <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
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
                ) : null}

                {showWalkInSection ? (
                  <section className="space-y-2 rounded-xl border border-dashed border-[#d8d6ec] bg-white/80 p-3">
                    <h3 className="text-sm font-black text-[#4d47b6]">
                      Walk-in — มาหน้างาน (ยังไม่ลงทะเบียน)
                    </h3>
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
                ) : null}
            </div>
          </div>
        )}
      </ClubEventPageSubNav>

      <FormModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        title="QR ให้สมาชิกสแกน"
        description="เช็กอินวันงาน · อัปเดตสดบนแดชบอร์ด"
        size="sm"
        appearance="glass"
      >
        <div className="space-y-3 text-center">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR เช็กอิน" className="mx-auto h-56 w-56" />
          ) : (
            <p className="py-10 text-sm text-[#9490c0]">กำลังสร้าง QR…</p>
          )}
          <p className="break-all text-[11px] font-semibold text-[#8b87b8]">{publicUrl}</p>
          <div className="flex flex-wrap justify-center gap-2">
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
      </FormModal>

      <FormModal
        open={manageOpen && Boolean(selected)}
        onClose={closeManage}
        title={selected ? `จ่ายของ · ${selected.guestName}` : "จ่ายของ"}
        description={
          selected
            ? [[selected.memberCode, selected.guestPhone, selected.source].filter(Boolean).join(" · "), formatBangkokDateTimeLong(selected.checkedInAt)]
                .filter(Boolean)
                .join(" · ")
            : undefined
        }
        size="md"
        appearance="glass"
      >
        {selected ? (
          <div className="space-y-3">
            {selected.fulfillment.length > 0 ? (
              <ul className="space-y-2">
                {selected.fulfillment.map((f) => (
                  <li
                    key={f.key}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-2.5 text-sm"
                  >
                    <span className="min-w-0 font-semibold text-[#1e1b4b]">
                      {f.label} ×{f.qty}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-[11px] font-bold",
                        f.delivered ? "text-emerald-700" : "text-amber-800",
                      )}
                    >
                      {f.delivered ? "จ่ายแล้ว" : "รอจ่าย"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-semibold text-[#8b87b8]">ไม่มีรายการของแจกจากฟอร์ม</p>
            )}

            {selected.fulfillment.length > 0 ? (
              selected.signatureImageUrl ? (
                <p className="text-sm font-bold text-emerald-700">เซ็นรับครบแล้ว</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-black text-[#4d47b6]">เซ็นรับของ</p>
                  <AppSignaturePad ref={padRef} disabled={busy} />
                  <button
                    type="button"
                    className={cn(clubEventPrimaryButtonClass, "w-full")}
                    disabled={busy}
                    onClick={() => void saveSignature()}
                  >
                    ยืนยันจ่ายของและเซ็นรับ
                  </button>
                </div>
              )
            ) : null}
          </div>
        ) : null}
      </FormModal>
    </>
  );
}
