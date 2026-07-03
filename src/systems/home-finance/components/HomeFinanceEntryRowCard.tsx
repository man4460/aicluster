"use client";

import { encodeHomeFinancePublicAssetHref } from "@/lib/home-finance/attachments";
import { cn } from "@/lib/cn";
import {
  HomeFinanceRowActionIconButton,
  HomeFinanceRowIconEdit,
  HomeFinanceRowIconTrash,
} from "@/systems/home-finance/components/HomeFinanceUi";

export type HomeFinanceEntryRow = {
  id: number;
  entryDate: string;
  type: "INCOME" | "EXPENSE";
  categoryLabel: string;
  title: string;
  amount: number;
  slipImageUrl: string | null;
  attachmentUrls: string[];
};

const hfEntryRowCardClass =
  "rounded-2xl border border-white/60 bg-white/55 px-2.5 py-2 shadow-sm ring-1 ring-inset ring-white/50";

function entryAttachmentUrls(e: HomeFinanceEntryRow): string[] {
  if (e.attachmentUrls?.length > 0) return e.attachmentUrls;
  return e.slipImageUrl ? [e.slipImageUrl] : [];
}

/** วันที่สั้น — รวมปี */
function formatEntryDateShort(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
}

function formatMoneyCompact(thb: (n: number) => string, amount: number): string {
  return `฿${thb(amount)}`;
}

function typePillClass(type: "INCOME" | "EXPENSE"): string {
  return type === "INCOME"
    ? "bg-emerald-100 text-emerald-800"
    : "bg-rose-100 text-rose-800";
}

function amountClass(type: "INCOME" | "EXPENSE"): string {
  return type === "INCOME" ? "text-emerald-700" : "text-rose-700";
}

function accentBorderClass(type: "INCOME" | "EXPENSE"): string {
  return type === "INCOME" ? "border-l-emerald-500" : "border-l-rose-500";
}

function IconSlip({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M14 3H8a2 2 0 0 0-2 2v14l4-2 4 2 4-2 4 2V7l-6-4z" strokeLinejoin="round" />
      <path d="M14 3v4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SlipThumbButton({
  urls,
  title,
  onOpen,
}: {
  urls: string[];
  title: string;
  onOpen?: (url: string) => void;
}) {
  const hasSlip = urls.length > 0;
  const first = hasSlip ? urls[0]! : null;
  const preview = first ? encodeHomeFinancePublicAssetHref(first) : null;

  return (
    <button
      type="button"
      disabled={!hasSlip || !onOpen}
      onClick={() => first && onOpen?.(first)}
      aria-label={hasSlip ? `ดูสลิป ${title}` : "ไม่มีสลิป"}
      title={hasSlip ? "ดูสลิป" : "ไม่มีสลิป"}
      className={cn(
        "relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 transition touch-manipulation",
        hasSlip
          ? "bg-white text-[#4d47b6] ring-[#4d47b6]/30 hover:ring-[#4d47b6]/55 active:scale-95"
          : "cursor-default bg-slate-100 text-slate-300 ring-slate-200/80",
      )}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="h-full w-full object-cover" />
      ) : (
        <IconSlip className="h-4 w-4" />
      )}
      {hasSlip ? (
        <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-tl bg-[#4d47b6] text-white">
          <svg viewBox="0 0 24 24" className="h-2 w-2" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" strokeLinecap="round" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
        </span>
      ) : null}
    </button>
  );
}

type HomeFinanceEntryRowCardProps = {
  entry: HomeFinanceEntryRow;
  thb: (n: number) => string;
  onOpenSlip?: (url: string) => void;
  variant?: "dashboard" | "history";
  selected?: boolean;
  onToggleSelected?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

/** การ์ดรายการกระชับ — สลิป · ชื่อ · หมวด · ประเภท · วันที่ · จำนวนเงิน */
export function HomeFinanceEntryRowCard({
  entry: e,
  thb,
  onOpenSlip,
  variant = "dashboard",
  selected = false,
  onToggleSelected,
  onEdit,
  onDelete,
}: HomeFinanceEntryRowCardProps) {
  const attachments = entryAttachmentUrls(e);
  const isHistory = variant === "history";

  return (
    <article
      className={cn(
        hfEntryRowCardClass,
        "border-l-[3px] py-1.5",
        accentBorderClass(e.type),
        selected && "ring-2 ring-[#4d47b6]/35",
      )}
    >
      <div className="flex items-center gap-2">
        {isHistory ? (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelected}
            aria-label={`เลือก ${e.title}`}
            className="h-4 w-4 shrink-0 rounded border-slate-300"
          />
        ) : null}

        <SlipThumbButton urls={attachments} title={e.title} onOpen={onOpenSlip} />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="min-w-0 flex-1 truncate text-[13px] font-bold leading-tight text-[#1e1b4b]">
              {e.title}
            </p>
            <p
              className={cn(
                "shrink-0 text-[13px] font-black tabular-nums leading-none",
                amountClass(e.type),
              )}
            >
              {e.type === "EXPENSE" ? "−" : "+"}
              {formatMoneyCompact(thb, e.amount)}
            </p>
          </div>

          <div className="mt-0.5 flex items-center justify-between gap-1">
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
              <span
                className={cn(
                  "inline-flex shrink-0 rounded px-1.5 py-px text-[9px] font-bold leading-none",
                  typePillClass(e.type),
                )}
              >
                {e.type === "INCOME" ? "รับ" : "จ่าย"}
              </span>
              {e.categoryLabel ? (
                <>
                  <span className="shrink-0 text-[10px] text-slate-300" aria-hidden>
                    ·
                  </span>
                  <span className="min-w-0 truncate text-[10px] font-medium text-[#5f5a8a]" title={e.categoryLabel}>
                    {e.categoryLabel}
                  </span>
                </>
              ) : null}
              <span className="shrink-0 text-[10px] text-slate-300" aria-hidden>
                ·
              </span>
              <time className="shrink-0 text-[10px] tabular-nums text-slate-500" dateTime={e.entryDate}>
                {formatEntryDateShort(e.entryDate)}
              </time>
            </div>

            {(onEdit || onDelete) ? (
              <div className="flex shrink-0 items-center gap-0.5">
                {onEdit ? (
                  <HomeFinanceRowActionIconButton
                    variant="primary"
                    title="แก้ไข"
                    aria-label={`แก้ไข ${e.title}`}
                    onClick={onEdit}
                    className="!min-h-[32px] !min-w-[32px]"
                  >
                    <HomeFinanceRowIconEdit />
                  </HomeFinanceRowActionIconButton>
                ) : null}
                {onDelete ? (
                  <HomeFinanceRowActionIconButton
                    variant="danger"
                    title="ลบ"
                    aria-label={`ลบ ${e.title}`}
                    onClick={onDelete}
                    className="!min-h-[32px] !min-w-[32px]"
                  >
                    <HomeFinanceRowIconTrash />
                  </HomeFinanceRowActionIconButton>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
