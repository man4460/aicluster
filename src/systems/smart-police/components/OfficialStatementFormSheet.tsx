"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { StatementHeaderFields, StatementPage } from "@/lib/smart-police/form-templates";
import {
  OVERLAY_FONT_PT,
  OVERLAY_STMT_FONT_PT,
  OVERLAY_STMT_LINE_H,
  STATEMENT_COMPLAINANT_BG,
  STATEMENT_COMPLAINANT_OVERLAY_FIELDS,
  STATEMENT_CONTINUATION_BG,
  STATEMENT_CONTINUATION_OVERLAY_FIELDS,
  STATEMENT_PAGE_H_MM,
  STATEMENT_PAGE_W_MM,
  mmBox,
  type OverlayField,
} from "@/lib/smart-police/form-templates/statement-overlay-template";

/**
 * แม่แบบราชการจริง (PNG) + ช่องพิมพ์โปร่งใสทับจุดไข่ปลา
 * ตัวอักษรชิดเส้นจุด · ไม่คร่อมแถว
 */

function OverlayInput({
  field,
  value,
  onChange,
}: {
  field: OverlayField;
  value: string;
  onChange: (v: string) => void;
}) {
  const box = mmBox(field);

  if (field.multiline) {
    return (
      <LinedOverlay
        ariaLabel={String(field.key)}
        value={value}
        onChange={onChange}
        style={{
          position: "absolute",
          ...box,
          margin: 0,
          padding: `0.6mm 1.2mm 0`,
          border: "none",
          outline: "none",
          background: "transparent",
          boxShadow: "none",
          fontFamily: '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif',
          fontSize: OVERLAY_STMT_FONT_PT,
          lineHeight: `${OVERLAY_STMT_LINE_H}mm`,
          color: "#111",
          caretColor: "#111",
        }}
      />
    );
  }

  return (
    <input
      aria-label={String(field.key)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className="sp-word-field"
      style={{
        position: "absolute",
        ...box,
        margin: 0,
        padding: "0 0.4mm",
        border: "none",
        outline: "none",
        background: "transparent",
        boxShadow: "none",
        fontFamily: '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif',
        fontSize: OVERLAY_FONT_PT,
        lineHeight: box.height,
        height: box.height,
        color: "#111",
        caretColor: "#111",
        verticalAlign: "bottom",
      }}
    />
  );
}

function LinedOverlay({
  value,
  onChange,
  ariaLabel,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  style: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const focused = useRef(false);

  useEffect(() => {
    if (!ref.current || focused.current) return;
    if (ref.current.innerText !== value) ref.current.innerText = value;
  }, [value]);

  return (
    <div
      ref={ref}
      role="textbox"
      aria-multiline
      aria-label={ariaLabel}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      className="overflow-hidden whitespace-pre-wrap break-words"
      style={style}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        onChange(ref.current?.innerText ?? "");
      }}
      onInput={() => onChange(ref.current?.innerText ?? "")}
    />
  );
}

function fieldValue(field: OverlayField, header: StatementHeaderFields, pageText: string): string {
  if (field.key === "statementBody") return pageText;
  if (field.key === "amphoe") return header.amphoe || header.district;
  return String(header[field.key as keyof StatementHeaderFields] ?? "");
}

export function OfficialStatementFormSheet({
  header,
  pages,
  pageIndex,
  onHeaderChange,
  onPageTextChange,
  className,
}: {
  header: StatementHeaderFields;
  pages: StatementPage[];
  pageIndex: number;
  formTitle?: string;
  onHeaderChange: <K extends keyof StatementHeaderFields>(key: K, value: StatementHeaderFields[K]) => void;
  onPageTextChange: (pageIdx: number, text: string) => void;
  onQaChange?: unknown;
  onAddQa?: unknown;
  onRemoveQa?: unknown;
  className?: string;
}) {
  const isCont = pageIndex > 0;
  const page = pages[pageIndex];
  const pageText = page?.text ?? "";
  const bg = isCont ? STATEMENT_CONTINUATION_BG : STATEMENT_COMPLAINANT_BG;
  const fields = isCont ? STATEMENT_CONTINUATION_OVERLAY_FIELDS : STATEMENT_COMPLAINANT_OVERLAY_FIELDS;

  function onFieldChange(field: OverlayField, value: string) {
    if (field.key === "statementBody") {
      onPageTextChange(pageIndex, value);
      return;
    }
    onHeaderChange(field.key as keyof StatementHeaderFields, value as never);
  }

  return (
    <article
      className={cn("sp-a4-sheet relative mx-auto overflow-hidden bg-white shadow-xl print:shadow-none", className)}
      style={{
        width: `${STATEMENT_PAGE_W_MM}mm`,
        height: `${STATEMENT_PAGE_H_MM}mm`,
        boxSizing: "border-box",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bg}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill"
      />

      {fields.map((field, i) => (
        <OverlayInput
          key={`${field.key}-${i}-${pageIndex}`}
          field={field}
          value={fieldValue(field, header, pageText)}
          onChange={(v) => onFieldChange(field, v)}
        />
      ))}

      {isCont ? (
        <span
          className="pointer-events-none absolute text-[10pt] text-[#111]"
          style={{ right: "24mm", top: "18mm" }}
          aria-hidden
        >
          {pageIndex + 1}
        </span>
      ) : null}
    </article>
  );
}
