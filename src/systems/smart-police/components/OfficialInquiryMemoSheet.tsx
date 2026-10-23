"use client";

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  defaultInquiryMemoCounters,
  packInquiryMemoPages,
  type InquiryMemoFields,
  type InquiryMemoLineCounters,
  type InquiryMemoPageModel,
} from "@/lib/smart-police/form-templates/inquiry-memo";
import { INQUIRY_MEMO_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import { thaiNumeral } from "@/lib/smart-police/form-templates/property-list";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "15pt";
const TITLE = "15pt";
const LINE = "8.2mm";
const RULE = "0.75pt solid #111";
const COL_DATE = "32mm";
const COL_SIGN = "40mm";
const HEAD_H = "14mm";

function measureHostLines(host: HTMLDivElement, text: string): number {
  if (!text) return 0;
  host.textContent = text;
  const linePx = parseFloat(getComputedStyle(host).lineHeight);
  if (!Number.isFinite(linePx) || linePx <= 0) return defaultInquiryMemoCounters.notes(text);
  return Math.max(1, Math.round(host.scrollHeight / linePx));
}

function StationField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <>
      <span style={{ flexShrink: 0, fontWeight: 700, lineHeight: "8.2mm", whiteSpace: "nowrap" }}>{label}</span>
      <input
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className={cn("sp-word-field min-w-0")}
        style={{
          width: "100%",
          minWidth: 0,
          fontSize: BODY,
          lineHeight: "8.2mm",
          height: "auto",
          paddingBottom: "1px",
        }}
      />
    </>
  );
}

function Th({ children, borderRight }: { children: ReactNode; borderRight?: boolean }) {
  return (
    <div
      style={{
        borderRight: borderRight ? RULE : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        fontWeight: 700,
        fontSize: BODY,
        lineHeight: 1.25,
        padding: "0 1mm",
      }}
    >
      {children}
    </div>
  );
}

function ColNotes({
  value,
  onChange,
  ariaLabel,
  left,
  width,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  left: string;
  width: string;
}) {
  return (
    <textarea
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className="sp-lined-notes"
      style={{
        position: "absolute",
        left,
        top: 0,
        width,
        height: "100%",
        boxSizing: "border-box",
        padding: "0 1.4mm",
        fontFamily: "inherit",
        fontSize: BODY,
        lineHeight: LINE,
        color: "#111",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
      }}
    />
  );
}

function MemoTable({
  page,
  onDate,
  onNotes,
  onSign,
}: {
  page: InquiryMemoPageModel;
  onDate: (v: string) => void;
  onNotes: (v: string) => void;
  onSign: (v: string) => void;
}) {
  return (
    <div
      style={{
        position: "relative",
        flexShrink: 0,
        border: RULE,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${COL_DATE} minmax(0, 1fr) ${COL_SIGN}`,
          height: HEAD_H,
          flexShrink: 0,
          borderBottom: RULE,
          boxSizing: "border-box",
        }}
      >
        <Th borderRight>วัน เดือน ปี</Th>
        <Th borderRight>รายละเอียด</Th>
        <Th>
          ลายมือชื่อ และ
          <br />
          ตำแหน่งผู้บันทึก
        </Th>
      </div>
      <div style={{ position: "relative", height: `calc(${page.rows} * ${LINE})` }}>
        {Array.from({ length: page.rows }, (_, i) => (
          <div
            key={i}
            aria-hidden
            style={{
              height: LINE,
              display: "grid",
              gridTemplateColumns: `${COL_DATE} minmax(0, 1fr) ${COL_SIGN}`,
              boxSizing: "border-box",
              borderBottom: i === page.rows - 1 ? "none" : "0.5pt dotted #111",
            }}
          >
            <div style={{ borderRight: RULE }} />
            <div style={{ borderRight: RULE }} />
            <div />
          </div>
        ))}
        <ColNotes
          ariaLabel="วัน เดือน ปี"
          value={page.dateCol}
          onChange={onDate}
          left="0"
          width={COL_DATE}
        />
        <ColNotes
          ariaLabel="รายละเอียด"
          value={page.notes}
          onChange={onNotes}
          left={COL_DATE}
          width={`calc(100% - ${COL_DATE} - ${COL_SIGN})`}
        />
        <ColNotes
          ariaLabel="ลายมือชื่อ และตำแหน่งผู้บันทึก"
          value={page.signCol}
          onChange={onSign}
          left={`calc(100% - ${COL_SIGN})`}
          width={COL_SIGN}
        />
      </div>
    </div>
  );
}

export function OfficialInquiryMemoDocument({
  fields,
  onChange,
  onPageCount,
}: {
  fields: InquiryMemoFields;
  onChange: <K extends keyof InquiryMemoFields>(key: K, value: InquiryMemoFields[K]) => void;
  onPageCount?: (n: number) => void;
}) {
  const dateHost = useRef<HTMLDivElement | null>(null);
  const notesHost = useRef<HTMLDivElement | null>(null);
  const signHost = useRef<HTMLDivElement | null>(null);
  const [measureReady, setMeasureReady] = useState(false);

  useLayoutEffect(() => {
    function makeHost(width: string) {
      const host = document.createElement("div");
      host.setAttribute("aria-hidden", "true");
      host.style.cssText = [
        "position:absolute",
        "left:-9999px",
        "top:0",
        `width:${width}`,
        "visibility:hidden",
        "pointer-events:none",
        "box-sizing:border-box",
        "padding:0 1.4mm",
        `font-family:${FONT}`,
        `font-size:${BODY}`,
        `line-height:${LINE}`,
        "white-space:pre-wrap",
        "overflow-wrap:anywhere",
        "word-break:break-word",
      ].join(";");
      document.body.appendChild(host);
      return host;
    }
    dateHost.current = makeHost("23.2mm");
    notesHost.current = makeHost("108mm");
    signHost.current = makeHost("37.2mm");
    setMeasureReady(true);
    return () => {
      dateHost.current?.remove();
      notesHost.current?.remove();
      signHost.current?.remove();
      dateHost.current = null;
      notesHost.current = null;
      signHost.current = null;
    };
  }, []);

  const count: InquiryMemoLineCounters = useMemo(() => {
    void measureReady;
    return {
      date: (text) => {
        const host = dateHost.current;
        if (!host) return defaultInquiryMemoCounters.date(text);
        return measureHostLines(host, text);
      },
      notes: (text) => {
        const host = notesHost.current;
        if (!host) return defaultInquiryMemoCounters.notes(text);
        return measureHostLines(host, text);
      },
      sign: (text) => {
        const host = signHost.current;
        if (!host) return defaultInquiryMemoCounters.sign(text);
        return measureHostLines(host, text);
      },
    };
  }, [measureReady]);

  const pages = useMemo(() => packInquiryMemoPages(fields, count), [fields, count]);

  useLayoutEffect(() => {
    onPageCount?.(pages.length);
  }, [onPageCount, pages.length]);

  function patchCol(key: "dateCol" | "notes" | "signCol", sliceIndex: number, text: string) {
    onChange(
      key,
      pages.map((p) => (p.sliceIndex === sliceIndex ? text : p[key])).join(""),
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      {pages.map((page) => (
        <article
          key={`im-${page.index}`}
          data-sheet-index={page.index}
          className="sp-a4-sheet relative mx-auto bg-white text-[#111] shadow-xl print:shadow-none"
          style={{
            width: PAGE.w,
            height: PAGE.h,
            boxSizing: "border-box",
            overflow: "hidden",
            padding: "16mm",
            fontFamily: FONT,
            fontSize: BODY,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {page.showPageNo ? (
            <p style={{ margin: "0 0 2mm", textAlign: "center", fontSize: BODY, flexShrink: 0 }}>
              {thaiNumeral(page.index + 1)}
            </p>
          ) : null}
          <h1
            style={{
              margin: "0 0 3mm",
              fontSize: TITLE,
              fontWeight: 700,
              lineHeight: 1.2,
              textAlign: "center",
              textDecoration: "underline",
              textUnderlineOffset: "1mm",
              flexShrink: 0,
            }}
          >
            {INQUIRY_MEMO_FORM_TITLE}
          </h1>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto minmax(0,1fr) auto minmax(0,1fr) auto minmax(0,1fr)",
              columnGap: "2.2mm",
              alignItems: "baseline",
              marginBottom: "3.5mm",
              flexShrink: 0,
              fontSize: BODY,
              lineHeight: "8.2mm",
            }}
          >
            <StationField
              label="สถานีตำรวจ"
              value={fields.station}
              onChange={(v) => onChange("station", v)}
            />
            <StationField
              label="อำเภอ"
              value={fields.district}
              onChange={(v) => onChange("district", v)}
            />
            <StationField
              label="จังหวัด"
              value={fields.province}
              onChange={(v) => onChange("province", v)}
            />
          </div>
          <MemoTable
            page={page}
            onDate={(v) => patchCol("dateCol", page.sliceIndex, v)}
            onNotes={(v) => patchCol("notes", page.sliceIndex, v)}
            onSign={(v) => patchCol("signCol", page.sliceIndex, v)}
          />
        </article>
      ))}
    </div>
  );
}
