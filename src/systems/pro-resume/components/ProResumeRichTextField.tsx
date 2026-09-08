"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";
import {
  proResumeRichTextAreaWithToolbarClass,
  proResumeRichTextToolbarBtnClass,
  proResumeRichTextToolbarClass,
} from "@/systems/pro-resume/lib/ui-tokens";

type FormatAction = "heading" | "paragraph" | "small" | "bullet" | "newline";

const TOOLBAR: { action: FormatAction; label: string; title: string }[] = [
  { action: "heading", label: "หัวข้อ", title: "หัวข้อใหญ่ (# )" },
  { action: "paragraph", label: "ย่อหน้า", title: "ย่อหน้าใหม่ (คั่นบรรทัดว่าง)" },
  { action: "small", label: "ตัวเล็ก", title: "เนื้อหาตัวเล็ก (~ )" },
  { action: "bullet", label: "ข้อๆ", title: "บูลเล็ต (- )" },
  { action: "newline", label: "บรรทัดใหม่", title: "ขึ้นบรรทัดใหม่" },
];

function applyFormat(value: string, start: number, end: number, action: FormatAction): { next: string; caret: number } {
  const selected = value.slice(start, end);
  const before = value.slice(0, start);
  const after = value.slice(end);

  const lineStart = before.lastIndexOf("\n") + 1;
  const linePrefix = before.slice(lineStart);

  switch (action) {
    case "heading": {
      const body = (selected || "หัวข้อ").replace(/^#+\s*/, "");
      if (!selected && !linePrefix.trim()) {
        const insert = `# ${body}`;
        return { next: before + insert + after, caret: before.length + insert.length };
      }
      const insert = `\n\n# ${body}\n`;
      return { next: before + insert + after, caret: before.length + insert.length };
    }
    case "paragraph": {
      const body = selected || "ย่อหน้า";
      const needsBreak = before.length > 0 && !/\n\n$/.test(before);
      const insert = `${needsBreak ? "\n\n" : ""}${body}`;
      return { next: before + insert + after, caret: before.length + insert.length };
    }
    case "small": {
      const body = (selected || "ข้อความตัวเล็ก").replace(/^(?:~|%%)\s*/, "");
      if (!selected && !linePrefix.trim()) {
        const insert = `~ ${body}`;
        return { next: before + insert + after, caret: before.length + insert.length };
      }
      const insert = `\n~ ${body}`;
      return { next: before + insert + after, caret: before.length + insert.length };
    }
    case "bullet": {
      const lines = (selected || "รายการ").split("\n").map((l) => l.replace(/^[-*•]\s+/, "").trim() || "รายการ");
      const block = lines.map((l) => `- ${l}`).join("\n");
      if (!selected && !linePrefix.trim()) {
        return { next: before + block + after, caret: before.length + block.length };
      }
      const insert = `\n${block}`;
      return { next: before + insert + after, caret: before.length + insert.length };
    }
    case "newline": {
      const insert = "\n";
      return { next: before + insert + after, caret: before.length + insert.length };
    }
    default:
      return { next: value, caret: end };
  }
}

/** ช่องกรอกรายละเอียดพร้อมแถบจัดรูปแบบ: หัวข้อ · ย่อหน้า · ตัวเล็ก · บูลเล็ต · บรรทัดใหม่ */
export function ProResumeRichTextField({
  label,
  value,
  onChange,
  placeholder,
  className,
  textareaClassName,
  disabled,
  id,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  textareaClassName?: string;
  disabled?: boolean;
  id?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const run = (action: FormatAction) => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const { next, caret } = applyFormat(value, start, end, action);
    onChange(next);
    requestAnimationFrame(() => {
      const ta = ref.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(caret, caret);
    });
  };

  return (
    <label className={cn("block space-y-1 text-xs font-bold text-[#4d47b6]", className)}>
      <span>{label}</span>
      <div className={proResumeRichTextToolbarClass} role="toolbar" aria-label="จัดรูปแบบข้อความ">
        {TOOLBAR.map((btn) => (
          <button
            key={btn.action}
            type="button"
            className={proResumeRichTextToolbarBtnClass}
            title={btn.title}
            aria-label={btn.title}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run(btn.action)}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <textarea
        id={id}
        ref={ref}
        className={cn(proResumeRichTextAreaWithToolbarClass, textareaClassName)}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="mt-1 block space-y-0.5 text-[10px] font-medium leading-relaxed text-[#66638c]">
        <span className="block">
          หัวข้อใหญ่: <code className="rounded bg-slate-100 px-1">#</code> · ย่อหน้า: คั่นบรรทัดว่าง · ตัวเล็ก:{" "}
          <code className="rounded bg-slate-100 px-1">~</code>
        </span>
        <span className="block">
          บูลเล็ต: <code className="rounded bg-slate-100 px-1">- ข้อความ</code> · ขึ้นบรรทัดใหม่ในช่อง · ตัวหนา:{" "}
          <code className="rounded bg-slate-100 px-1">**ข้อความ**</code>
        </span>
      </span>
    </label>
  );
}
