"use client";

import { cn } from "@/lib/cn";
import { promptCardClass } from "@/systems/prompt-library/prompt-library-tokens";
import {
  IconPromptCopy,
  IconPromptPlay,
  IconPromptStar,
} from "@/systems/prompt-library/components/PromptLibraryIcons";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";

export type PromptLibraryCardRow = {
  id: string;
  title: string;
  content: string;
  description: string | null;
  categoryId?: string | null;
  tags: string;
  language: string;
  modelHint?: string | null;
  temperature?: number;
  isFavorite: boolean;
  usageCount: number;
  category: { id: string; name: string; icon: string; color: string } | null;
};

type Props = {
  row: PromptLibraryCardRow;
  onCopy: (row: PromptLibraryCardRow) => void;
  onUse: (row: PromptLibraryCardRow) => void;
  onEdit: (row: PromptLibraryCardRow) => void;
  onRemove: (row: PromptLibraryCardRow) => void;
  compact?: boolean;
};

function excerpt(text: string, max = 120): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function PromptLibraryCard({ row, onCopy, onUse, onEdit, onRemove, compact }: Props) {
  const preview = row.description?.trim() || excerpt(row.content, compact ? 72 : 100);

  return (
    <article className={cn(promptCardClass, "text-left")}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 font-black leading-snug tracking-tight text-[#1e1b4b] text-sm sm:text-base">
          <button
            type="button"
            onClick={() => onCopy(row)}
            className="text-left transition hover:text-[#5b61ff]"
            title={row.title}
          >
            {row.title}
          </button>
        </h3>
        {row.isFavorite ? (
          <IconPromptStar className="h-4 w-4 shrink-0 text-amber-500" filled aria-label="รายการโปรด" />
        ) : null}
      </div>

      {row.category ? (
        <span
          className="mt-2 inline-flex max-w-full items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold text-white sm:text-xs"
          style={{ backgroundColor: row.category.color }}
        >
          <span aria-hidden>{row.category.icon}</span>
          <span className="truncate">{row.category.name}</span>
        </span>
      ) : (
        <span className="mt-2 inline-block text-[10px] font-semibold text-[#8b87b8]">ไม่ระบุหมวด</span>
      )}

      <p className="mt-2 line-clamp-3 min-h-0 flex-1 text-left text-xs leading-relaxed text-[#5f5a8a] sm:text-sm">
        {preview}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/50 pt-3">
        <div className="min-w-0 text-left text-[10px] font-semibold tabular-nums text-[#66638c] sm:text-xs">
          <span>ใช้ {row.usageCount}</span>
          <span className="mx-1 text-[#c4c0dc]">·</span>
          <span className="uppercase">{row.language}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onUse(row)}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-[#5b61ff]/25 bg-[#eef0ff] text-[#4d47b6]"
            aria-label={`นับการใช้งาน ${row.title}`}
            title="ใช้งาน"
          >
            <IconPromptPlay className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onCopy(row)}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-white/60 bg-white/80 text-[#4d47b6]"
            aria-label={`คัดลอก ${row.title}`}
            title="คัดลอก"
          >
            <IconPromptCopy className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={assetRowEditIconButtonClass}
            aria-label={`แก้ไข ${row.title}`}
            title="แก้ไข"
            onClick={() => onEdit(row)}
          >
            <IconRowEdit className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={assetRowRemoveIconButtonClass}
            aria-label={`ซ่อน ${row.title}`}
            title="ซ่อน"
            onClick={() => onRemove(row)}
          >
            <IconRowRemove className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
