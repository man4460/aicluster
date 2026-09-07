"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, Filter, RefreshCw, UserRound, UserX } from "lucide-react";
import {
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  AppLabeledImageThumb,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { ClubEventSlipVerifyButton } from "@/systems/club-event/components/ClubEventSlipVerifyButton";
import {
  clubEventCardIconTileClass,
  clubEventTonedRowCardClass,
} from "@/systems/club-event/lib/card-tones";
import {
  clubEventFieldClass,
  clubEventFilterChipClass,
  clubEventFilterChipShellClass,
  clubEventIconButtonClass,
  clubEventOutlineButtonClass,
} from "@/systems/club-event/lib/ui-tokens";

type PaidRow = {
  id: string;
  respondentName: string;
  respondentPhone: string;
  amountBaht: number | null;
  paymentMethod: string | null;
  slipUrl: string | null;
  slipVerifiedAt: string | null;
  slipVerified: boolean;
  createdAt: string;
  matchedMemberId: string | null;
  matchedMemberName: string | null;
};

type UnpaidMember = {
  id: string;
  name: string;
  nickname: string;
  phone: string;
  memberCode: string;
  photoUrl: string | null;
  position: string;
};

type DuesStatusPayload = {
  enabled: boolean;
  periodKey: string;
  periodLabel: string;
  amountBaht: number;
  linkId: string | null;
  paid: PaidRow[];
  unpaidMembers: UnpaidMember[];
  summary: {
    paidCount: number;
    unpaidCount: number;
    paidAmountBaht: number;
    memberCount: number;
  };
  error?: string;
};

/** กรองด่วน: ทั้งหมด · ตรวจแล้ว · รอตรวจ · ยังไม่ชำระ */
type SlipStatusFilter = "all" | "verified" | "pending" | "unpaid";

function isPaidVerified(row: PaidRow): boolean {
  return Boolean(row.slipVerified ?? row.slipVerifiedAt);
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ClubEventDuesStatusPanel({
  duesEnabled,
  duesLinkId,
  refreshKey = 0,
}: {
  duesEnabled: boolean;
  duesLinkId: string | null;
  /** เปลี่ยนค่าเมื่อบันทึกตั้งค่าแล้ว เพื่อรีโหลดรายการ */
  refreshKey?: number;
}) {
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DuesStatusPayload | null>(null);
  const [statusFilter, setStatusFilter] = useState<SlipStatusFilter>("pending");
  const [filterOpen, setFilterOpen] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    if (!duesEnabled || !duesLinkId) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/club-event/session/dues/status", { credentials: "include" });
      const json = (await res.json()) as DuesStatusPayload;
      if (!res.ok) throw new Error(json.error ?? "โหลดไม่สำเร็จ");
      setData(json);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดสถานะค่าบำรุงไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- duesEnabled/duesLinkId/refreshKey only
  }, [duesEnabled, duesLinkId, refreshKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const q = query.trim().toLowerCase();

  const slipCounts = useMemo(() => {
    const paid = data?.paid ?? [];
    let verified = 0;
    let pending = 0;
    for (const row of paid) {
      if (isPaidVerified(row)) verified += 1;
      else pending += 1;
    }
    return {
      all: paid.length + (data?.unpaidMembers.length ?? 0),
      verified,
      pending,
      unpaid: data?.unpaidMembers.length ?? 0,
    };
  }, [data?.paid, data?.unpaidMembers]);

  const paidFiltered = useMemo(() => {
    let rows = data?.paid ?? [];
    if (statusFilter === "verified") rows = rows.filter((r) => isPaidVerified(r));
    else if (statusFilter === "pending") rows = rows.filter((r) => !isPaidVerified(r));
    else if (statusFilter === "unpaid") rows = [];
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.respondentName.toLowerCase().includes(q) ||
        r.respondentPhone.includes(q) ||
        (r.matchedMemberName ?? "").toLowerCase().includes(q),
    );
  }, [data?.paid, q, statusFilter]);

  const unpaidFiltered = useMemo(() => {
    if (statusFilter === "verified" || statusFilter === "pending") return [];
    const rows = data?.unpaidMembers ?? [];
    if (!q) return rows;
    return rows.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.nickname.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.memberCode.toLowerCase().includes(q),
    );
  }, [data?.unpaidMembers, q, statusFilter]);

  const showPaidList = statusFilter === "all" || statusFilter === "verified" || statusFilter === "pending";
  const showUnpaidList = statusFilter === "all" || statusFilter === "unpaid";
  const filtersActive = Boolean(q) || statusFilter !== "all";

  if (!duesEnabled) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
        <p className="text-sm font-semibold text-[#66638c]">
          เปิดเก็บค่าบำรุงแล้วกดบันทึก — จากนั้นจะเห็นรายชื่อผู้จ่าย / ยังไม่จ่าย และสลิปที่นี่
        </p>
      </div>
    );
  }

  if (!duesLinkId) {
    return (
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-4">
        <p className="text-sm font-semibold text-amber-900">
          กดบันทึกเพื่อสร้างลิงก์ชำระก่อน แล้วระบบจะติดตามคำตอบและสลิปที่นี่
        </p>
      </div>
    );
  }

  const summary = data?.summary;

  return (
    <>
      {notice.popup}
      <section className="space-y-3 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-row items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-black text-[#1e1b4b]">ติดตามการชำระค่าบำรุง</h3>
            <p className="mt-0.5 text-[11px] font-semibold text-[#66638c]">
              {data?.periodLabel ?? "กำลังโหลดรอบเก็บ…"}
              {typeof summary?.paidAmountBaht === "number" ? (
                <span className="ml-1 text-emerald-700">
                  · รวมรับ ฿{summary.paidAmountBaht.toLocaleString("th-TH")}
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              className={cn(
                clubEventOutlineButtonClass,
                "relative min-w-[40px] px-2 sm:min-w-0 sm:px-3",
                filterOpen && "border-[#0000BF]/45 bg-[#0000BF]/10 ring-2 ring-[#0000BF]/20",
                filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
              )}
              aria-expanded={filterOpen}
              aria-controls="club-event-dues-status-filter"
              aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
              title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
              onClick={() => setFilterOpen((o) => !o)}
            >
              <Filter className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
              {filtersActive && !filterOpen ? (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-500" aria-hidden />
              ) : null}
            </button>
            <button
              type="button"
              className={clubEventIconButtonClass}
              aria-label="รีเฟรชสถานะค่าบำรุง"
              title="รีเฟรช"
              disabled={loading}
              aria-busy={loading}
              onClick={() => void load()}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className={cn(clubEventTonedRowCardClass("emerald"), "flex-col items-stretch gap-1 sm:flex-col")}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800/80">จ่ายแล้ว</p>
            <p className="text-lg font-black tabular-nums text-emerald-700">
              {(summary?.paidCount ?? 0).toLocaleString("th-TH")}
            </p>
          </div>
          <div className={cn(clubEventTonedRowCardClass("rose"), "flex-col items-stretch gap-1 sm:flex-col")}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-rose-800/80">ยังไม่จ่าย</p>
            <p className="text-lg font-black tabular-nums text-rose-700">
              {(summary?.unpaidCount ?? 0).toLocaleString("th-TH")}
            </p>
          </div>
          <div
            className={cn(
              clubEventTonedRowCardClass("violet"),
              "col-span-2 flex-col items-stretch gap-1 sm:col-span-1 sm:flex-col",
            )}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-violet-800/80">สมาชิกใช้งาน</p>
            <p className="text-lg font-black tabular-nums text-[#4d47b6]">
              {(summary?.memberCount ?? 0).toLocaleString("th-TH")}
            </p>
          </div>
        </div>

        <div id="club-event-dues-status-filter" className={cn("space-y-2", filterOpen ? "block" : "hidden")}>
          <nav className={clubEventFilterChipShellClass} role="tablist" aria-label="กรองสถานะสลิปและชำระ">
            {(
              [
                { key: "all" as const, label: "ทั้งหมด", count: slipCounts.all },
                { key: "verified" as const, label: "ตรวจแล้ว", count: slipCounts.verified },
                { key: "pending" as const, label: "รอตรวจ", count: slipCounts.pending },
                { key: "unpaid" as const, label: "ยังไม่ชำระ", count: slipCounts.unpaid },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={statusFilter === item.key}
                className={clubEventFilterChipClass(statusFilter === item.key)}
                onClick={() => setStatusFilter(item.key)}
              >
                {item.label} ({item.count})
              </button>
            ))}
          </nav>
          <input
            className={clubEventFieldClass}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              statusFilter === "unpaid" ? "ค้นหาชื่อ / เบอร์ / รหัสสมาชิก" : "ค้นหาชื่อ / เบอร์ ผู้ชำระ"
            }
            aria-label="ค้นหารายการค่าบำรุง"
          />
          {filtersActive ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold text-[#66638c]">
                แสดง{" "}
                {(showPaidList ? paidFiltered.length : 0) + (showUnpaidList ? unpaidFiltered.length : 0)}{" "}
                รายการ
              </p>
              <button
                type="button"
                className={clubEventFilterChipClass(true)}
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                }}
              >
                ล้างกรอง
              </button>
            </div>
          ) : null}
        </div>

        {loading && !data ? (
          <p className="text-sm font-semibold text-[#66638c]">กำลังโหลด…</p>
        ) : (
          <div className="space-y-4">
            {showPaidList ? (
              paidFiltered.length === 0 ? (
                <AppEmptyState>
                  {q || statusFilter === "verified" || statusFilter === "pending"
                    ? statusFilter === "verified"
                      ? q
                        ? "ไม่พบรายการที่ตรงเงื่อนไข"
                        : "ยังไม่มีสลิปที่ตรวจแล้ว"
                      : statusFilter === "pending"
                        ? q
                          ? "ไม่พบรายการที่ตรงเงื่อนไข"
                          : "ไม่มีรายการรอตรวจสลิป"
                        : "ไม่พบรายการที่ตรงเงื่อนไข"
                    : "ยังไม่มีใครชำระในรอบนี้"}
                </AppEmptyState>
              ) : (
                <ul className="space-y-2" role="tabpanel" aria-label="รายการชำระแล้ว">
                  {paidFiltered.map((row) => {
                    const verified = isPaidVerified(row);
                    return (
                      <li
                        key={row.id}
                        className={cn(
                          clubEventTonedRowCardClass(verified ? "emerald" : "amber"),
                          "!flex-row items-start justify-between gap-2 sm:items-center",
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          {row.slipUrl ? (
                            <AppLabeledImageThumb
                              src={row.slipUrl}
                              kind="slip"
                              alt={row.respondentName || "ผู้ชำระ"}
                              onOpen={() => lb.open(row.slipUrl!)}
                            />
                          ) : (
                            <span
                              className={clubEventCardIconTileClass(verified ? "emerald" : "amber", "lg")}
                              aria-hidden
                            >
                              <Banknote className="h-6 w-6" strokeWidth={2.1} />
                            </span>
                          )}
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="truncate text-sm font-black tracking-tight text-[#1e1b4b]">
                              {row.respondentName || "ไม่ระบุชื่อ"}
                            </p>
                            {row.respondentPhone ? (
                              <p className="truncate text-[11px] font-semibold text-[#66638c]">
                                {row.respondentPhone}
                              </p>
                            ) : null}
                            <p className="text-xs font-black tabular-nums text-emerald-700">
                              ฿{(row.amountBaht ?? 0).toLocaleString("th-TH")}
                              {row.paymentMethod ? (
                                <span className="ml-1 font-semibold text-[#8b87b8]">{row.paymentMethod}</span>
                              ) : null}
                            </p>
                            <p className="text-[10px] font-semibold text-[#9490c0]">
                              {formatWhen(row.createdAt)}
                            </p>
                            {row.matchedMemberName ? (
                              <p className="text-[10px] font-bold text-[#4d47b6]">
                                ตรงสมาชิก: {row.matchedMemberName}
                              </p>
                            ) : (
                              <p className="text-[10px] font-semibold text-amber-800">นอกทะเบียนสมาชิก</p>
                            )}
                            {!row.slipUrl ? (
                              <p className="text-[10px] font-semibold text-rose-600">ไม่มีสลิปแนบ</p>
                            ) : null}
                            {row.slipUrl && !verified ? (
                              <p className="text-[10px] font-bold text-amber-800">รอตรวจสลิป</p>
                            ) : null}
                          </div>
                        </div>
                        {row.slipUrl ? (
                          <ClubEventSlipVerifyButton
                            className="self-start"
                            submissionId={row.id}
                            hasSlip
                            verified={verified}
                            onPatched={(next) =>
                              setData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      paid: prev.paid.map((p) =>
                                        p.id === row.id
                                          ? {
                                              ...p,
                                              slipVerified: next.slipVerified,
                                              slipVerifiedAt: next.slipVerifiedAt,
                                            }
                                          : p,
                                      ),
                                    }
                                  : prev,
                              )
                            }
                            onError={(msg) => notice.error(msg)}
                          />
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )
            ) : null}

            {showUnpaidList ? (
              unpaidFiltered.length === 0 ? (
                showPaidList && statusFilter === "all" && paidFiltered.length > 0 ? null : (
                  <AppEmptyState>
                    {q
                      ? "ไม่พบสมาชิกที่ตรงเงื่อนไข"
                      : (summary?.memberCount ?? 0) === 0
                        ? "ยังไม่มีสมาชิกในระบบ — เพิ่มที่เมนูการจัดการ"
                        : "สมาชิกใช้งานชำระครบในรอบนี้แล้ว"}
                  </AppEmptyState>
                )
              ) : (
                <div className="space-y-2">
                  {statusFilter === "all" && paidFiltered.length > 0 ? (
                    <p className="text-xs font-bold text-rose-800/90">ยังไม่ชำระ ({unpaidFiltered.length})</p>
                  ) : null}
                  <ul className="space-y-2" role="tabpanel" aria-label="สมาชิกยังไม่ชำระ">
                    {unpaidFiltered.map((m) => (
                      <li key={m.id} className={clubEventTonedRowCardClass("rose")}>
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          {m.photoUrl ? (
                            <AppImageThumb
                              src={m.photoUrl}
                              alt={m.name}
                              onOpen={() => lb.open(m.photoUrl!)}
                              className="h-14 w-14 shrink-0"
                            />
                          ) : (
                            <span className={clubEventCardIconTileClass("rose", "lg")} aria-hidden>
                              <UserX className="h-6 w-6" strokeWidth={2.1} />
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-[#1e1b4b]">{m.name}</p>
                            <p className="truncate text-[11px] font-semibold text-[#66638c]">
                              {[
                                m.nickname && `ชื่อเล่น ${m.nickname}`,
                                m.phone,
                                m.memberCode && `รหัส ${m.memberCode}`,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "ไม่มีเบอร์/รหัส"}
                            </p>
                            {m.position ? (
                              <p className="mt-0.5 truncate text-[10px] font-semibold text-[#8b87b8]">
                                {m.position}
                              </p>
                            ) : null}
                          </div>
                          <span className={cn(clubEventCardIconTileClass("rose"), "hidden sm:flex")} aria-hidden>
                            <UserRound className="h-4 w-4" strokeWidth={2.25} />
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ) : null}
          </div>
        )}
      </section>
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป / รูปสมาชิก" />
    </>
  );
}
