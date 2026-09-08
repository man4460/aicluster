"use client";

import { AppLabeledImageThumb } from "@/components/app-templates";
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
  "rounded-lg border border-slate-200/90 bg-white px-2.5 py-2 shadow-sm";

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

  if (preview && onOpen && first) {
    return (
      <AppLabeledImageThumb
        src={preview}
        kind="slip"
        alt={title}
        onOpen={() => onOpen(first)}
        className="h-9 w-9 sm:h-9 sm:w-9"
      />
    );
  }

  return (
    <span
      aria-label="ไม่มีสลิป"
      title="ไม่มีสลิป"
      className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-300 ring-1 ring-slate-200/80"
    >
      <IconSlip className="h-4 w-4" />
    </span>
  );
}

type HomeFinanceEntryRowCardProps = {
  entry: HomeFinanceEntryRow;
  thb: (n: number) => string;
  onOpenSlip?: (url: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

/** การ์ดรายการกระชับ — สลิป · ชื่อ · หมวด · ประเภท · วันที่ · จำนวนเงิน */
export function HomeFinanceEntryRowCard({
  entry: e,
  thb,
  onOpenSlip,
  onEdit,
  onDelete,
}: HomeFinanceEntryRowCardProps) {
  const attachments = entryAttachmentUrls(e);

  return (
    <article
      className={cn(
        hfEntryRowCardClass,
        "border-l-[3px] py-1.5",
        accentBorderClass(e.type),
      )}
    >
      <div className="flex items-center gap-2">
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
