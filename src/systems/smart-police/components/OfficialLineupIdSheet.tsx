"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { LINEUP_ID_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  LINEUP_ID_PERSON_COUNT,
  packLineupIdPages,
  type LineupIdFields,
} from "@/lib/smart-police/form-templates/lineup-id";
import { estimateArrestWrappedLines as estimateLines } from "@/lib/smart-police/form-templates/arrest-record";
import { thaiNumeral } from "@/lib/smart-police/form-templates/property-list";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "15pt";
const TITLE = "15pt";
const LINE = "7.2mm";
const SIGN_LINE = "6.7mm";

function Dot({
  value,
  onChange,
  "aria-label": ariaLabel,
  minCh = 4,
  flex,
}: {
  value: string;
  onChange: (v: string) => void;
  "aria-label"?: string;
  minCh?: number;
  flex?: boolean;
}) {
  return (
    <input
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className={cn("sp-word-field align-baseline", flex ? "min-w-0 flex-1" : "inline")}
      style={{
        minWidth: flex ? 0 : `${minCh}ch`,
        width: flex ? "100%" : `${Math.max(minCh, (value || "").length + 1)}ch`,
        fontSize: "inherit",
        lineHeight: "inherit",
        height: "auto",
        paddingBottom: "1px",
      }}
    />
  );
}

function Row({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "baseline",
        gap: "0 1.5mm",
        minHeight: LINE,
        margin: "0 0 0.45mm",
        lineHeight: LINE,
        fontSize: BODY,
        width: "100%",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function T({ children }: { children: ReactNode }) {
  return <span style={{ flexShrink: 0, fontWeight: 700 }}>{children}</span>;
}

function Sheet({ children, index }: { children: ReactNode; index: number }) {
  return (
    <article
      data-sheet-index={index}
      className="sp-a4-sheet relative mx-auto bg-white text-[#111] shadow-xl print:shadow-none"
      style={{
        width: PAGE.w,
        height: PAGE.h,
        boxSizing: "border-box",
        overflow: "hidden",
        padding: "12mm 16mm 12mm",
        fontFamily: FONT,
        fontSize: BODY,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </article>
  );
}

function FieldLines({
  value,
  onChange,
  lines,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  lines: number;
  ariaLabel: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        margin: "0 0 0.4mm",
        height: `calc(${lines} * ${LINE})`,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <div aria-hidden>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            style={{ height: LINE, borderBottom: "0.5pt dotted #111", boxSizing: "border-box" }}
          />
        ))}
      </div>
      <textarea
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="sp-lined-notes"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          fontFamily: "inherit",
          fontSize: BODY,
          lineHeight: LINE,
          color: "#111",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
        }}
      />
    </div>
  );
}

function SignBlock({
  role,
  name,
  paren,
  onName,
  onParen,
}: {
  role: string;
  name: string;
  paren: string;
  onName: (v: string) => void;
  onParen: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3mm", minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          gap: "1.5mm",
          minHeight: SIGN_LINE,
          lineHeight: SIGN_LINE,
          minWidth: 0,
        }}
      >
        <span style={{ flexShrink: 0 }}>ลงชื่อ</span>
        <Dot aria-label={`ลงชื่อ${role}`} value={name} onChange={onName} flex minCh={6} />
        <span style={{ flexShrink: 0 }}>{role}</span>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "nowrap",
          alignItems: "baseline",
          gap: "1.5mm",
          minHeight: SIGN_LINE,
          lineHeight: SIGN_LINE,
          paddingLeft: "4mm",
          minWidth: 0,
        }}
      >
        <span style={{ flexShrink: 0 }}>(</span>
        <Dot aria-label={`ชื่อวงเล็บ${role}`} value={paren} onChange={onParen} flex minCh={8} />
        <span style={{ flexShrink: 0 }}>)</span>
      </div>
    </div>
  );
}

function PlaceDateHeader({
  fields,
  onChange,
}: {
  fields: LineupIdFields;
  onChange: <K extends keyof LineupIdFields>(key: K, value: LineupIdFields[K]) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        columnGap: "1.5mm",
        width: "100%",
        marginBottom: "0.45mm",
        fontSize: BODY,
      }}
    >
      <div
        style={{
          gridColumn: "3",
          display: "flex",
          flexDirection: "column",
          gap: "0.45mm",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "nowrap",
            alignItems: "baseline",
            gap: "1.5mm",
            minHeight: LINE,
            lineHeight: LINE,
          }}
        >
          <T>สถานที่บันทึก</T>
          <Dot
            aria-label="สถานที่บันทึก"
            value={fields.recordPlace}
            onChange={(v) => onChange("recordPlace", v)}
            flex
            minCh={8}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "nowrap",
            alignItems: "baseline",
            gap: "1.5mm",
            minHeight: LINE,
            lineHeight: LINE,
          }}
        >
          <T>วันที่</T>
          <Dot aria-label="วันที่" value={fields.day} onChange={(v) => onChange("day", v)} flex minCh={3} />
          <T>เดือน</T>
          <Dot aria-label="เดือน" value={fields.month} onChange={(v) => onChange("month", v)} flex minCh={4} />
          <T>พ.ศ.</T>
          <Dot aria-label="พ.ศ." value={fields.year} onChange={(v) => onChange("year", v)} flex minCh={4} />
        </div>
      </div>
    </div>
  );
}

function measureHostLines(host: HTMLDivElement, text: string, indentCh: number): number {
  if (!text) return 0;
  host.style.textIndent = indentCh > 0 ? `calc(${indentCh}ch + 1.5mm)` : "0";
  host.textContent = text;
  const linePx = parseFloat(getComputedStyle(host).lineHeight);
  if (!Number.isFinite(linePx) || linePx <= 0) return estimateLines(text, indentCh);
  return Math.max(1, Math.round(host.scrollHeight / linePx));
}

export function OfficialLineupIdDocument({
  fields,
  onChange,
  onPageCount,
}: {
  fields: LineupIdFields;
  onChange: <K extends keyof LineupIdFields>(key: K, value: LineupIdFields[K]) => void;
  onPageCount?: (n: number) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [measureReady, setMeasureReady] = useState(false);
  const people =
    fields.people.length >= LINEUP_ID_PERSON_COUNT
      ? fields.people
      : [...fields.people, ...Array.from({ length: LINEUP_ID_PERSON_COUNT - fields.people.length }, () => "")];

  useLayoutEffect(() => {
    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = [
      "position:absolute",
      "left:-9999px",
      "top:0",
      "width:178mm",
      "visibility:hidden",
      "pointer-events:none",
      `font-family:${FONT}`,
      `font-size:${BODY}`,
      `line-height:${LINE}`,
      "white-space:pre-wrap",
      "overflow-wrap:anywhere",
      "word-break:break-word",
    ].join(";");
    document.body.appendChild(host);
    hostRef.current = host;
    setMeasureReady(true);
    return () => {
      host.remove();
      hostRef.current = null;
    };
  }, []);

  const countLines = useCallback(
    (text: string, indentCh: number) => {
      const host = hostRef.current;
      if (!host) return estimateLines(text, indentCh);
      return measureHostLines(host, text, indentCh);
    },
    [measureReady],
  );

  const pages = useMemo(() => packLineupIdPages(fields, countLines), [fields, countLines]);

  useLayoutEffect(() => {
    onPageCount?.(pages.length);
  }, [onPageCount, pages.length]);

  function patchPerson(i: number, v: string) {
    onChange(
      "people",
      people.map((p, idx) => (idx === i ? v : p)),
    );
  }

  function patchAnswer(sliceIndex: number, text: string) {
    const slices = pages.filter((p) => p.answer).map((p) => p.answer!);
    onChange("answer", slices.map((s, i) => (i === sliceIndex ? text : s.text)).join(""));
  }

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      {pages.map((page) => (
        <Sheet key={`lid-${page.index}`} index={page.index}>
          {page.showHeader ? (
            <>
              <header style={{ textAlign: "center", marginBottom: "2.5mm", flexShrink: 0 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: TITLE,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    textDecoration: "underline",
                    textUnderlineOffset: "1mm",
                  }}
                >
                  {LINEUP_ID_FORM_TITLE}
                </h1>
              </header>
              <div style={{ flexShrink: 0 }}>
                <PlaceDateHeader fields={fields} onChange={onChange} />
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>๑. ชื่อ และตำแหน่งผู้อำนวยการชี้ตัวผู้ต้องหา</T>
                  <Dot
                    aria-label="ชื่อและตำแหน่งผู้อำนวยการชี้ตัวผู้ต้องหา"
                    value={fields.director}
                    onChange={(v) => onChange("director", v)}
                    flex
                    minCh={8}
                  />
                </Row>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1.5mm",
                    margin: "0.6mm 0 0.8mm",
                    fontSize: BODY,
                    lineHeight: LINE,
                  }}
                >
                  <T>๒. จัดให้มีการชี้ตัวในคดีระหว่าง</T>
                  <span
                    aria-hidden
                    style={{
                      fontSize: "28pt",
                      lineHeight: 0.85,
                      fontWeight: 400,
                      flexShrink: 0,
                      paddingBottom: "1mm",
                    }}
                  >
                    {"{"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.3mm" }}>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "nowrap",
                        alignItems: "baseline",
                        gap: "1.5mm",
                        minHeight: LINE,
                        lineHeight: LINE,
                      }}
                    >
                      <Dot
                        aria-label="ผู้กล่าวหา"
                        value={fields.complainant}
                        onChange={(v) => onChange("complainant", v)}
                        flex
                        minCh={8}
                      />
                      <span style={{ flexShrink: 0 }}>ผู้กล่าวหา</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "nowrap",
                        alignItems: "baseline",
                        gap: "1.5mm",
                        minHeight: LINE,
                        lineHeight: LINE,
                      }}
                    >
                      <Dot
                        aria-label="ผู้ต้องหา"
                        value={fields.suspectName}
                        onChange={(v) => onChange("suspectName", v)}
                        flex
                        minCh={8}
                      />
                      <span style={{ flexShrink: 0 }}>ผู้ต้องหา</span>
                    </div>
                  </div>
                </div>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>คดีอาญาที่</T>
                  <Dot
                    aria-label="คดีอาญาที่"
                    value={fields.criminalCaseNo}
                    onChange={(v) => onChange("criminalCaseNo", v)}
                    flex
                    minCh={6}
                  />
                  <T>ข้อหา</T>
                  <Dot
                    aria-label="ข้อหา"
                    value={fields.criminalCharge}
                    onChange={(v) => onChange("criminalCharge", v)}
                    flex
                    minCh={8}
                  />
                </Row>
                <p style={{ margin: "1mm 0 0.4mm", fontSize: BODY, lineHeight: 1.45 }}>
                  ๓. ผู้อำนวยการชี้ตัวได้จัดให้มีการชี้ตัวข้าพเจ้าซึ่งเป็นผู้ต้องหา
                </p>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>ที่</T>
                  <Dot
                    aria-label="สถานที่ชี้ตัว"
                    value={fields.idPlace}
                    onChange={(v) => onChange("idPlace", v)}
                    flex
                    minCh={8}
                  />
                  <span style={{ flexShrink: 0 }}>ซึ่งมีแสงสว่างเป็นอย่างดี และมีที่กำบังมิให้ผู้ชี้ตัวเห็น</span>
                </Row>
                <Row>
                  <span style={{ flexShrink: 0 }}>ผู้ต้องหาก่อนจะเข้าชี้ตัว</span>
                  <T>เมื่อวันที่</T>
                  <Dot aria-label="วันที่ชี้ตัว" value={fields.idDay} onChange={(v) => onChange("idDay", v)} minCh={4} />
                  <T>เดือน</T>
                  <Dot
                    aria-label="เดือนที่ชี้ตัว"
                    value={fields.idMonth}
                    onChange={(v) => onChange("idMonth", v)}
                    minCh={5}
                  />
                  <T>พ.ศ.</T>
                  <Dot aria-label="พ.ศ. ที่ชี้ตัว" value={fields.idYear} onChange={(v) => onChange("idYear", v)} minCh={5} />
                  <T>เวลา</T>
                  <Dot aria-label="เวลาที่ชี้ตัว" value={fields.idTime} onChange={(v) => onChange("idTime", v)} minCh={5} />
                  <T>น.</T>
                </Row>
                <p
                  style={{
                    margin: "1.2mm 0 0.6mm",
                    textAlign: "justify",
                    fontSize: BODY,
                    lineHeight: 1.45,
                  }}
                >
                  ๔. ก่อนทำการชี้ตัว ผู้อำนวยการชี้ตัวมิได้ให้ผู้ที่จะทำการชี้ตัวเห็นผู้ต้องหา รูปภาพหรือตำหนิรูปพรรณ
                  ของผู้ต้องหา และสถานที่นั้นผู้ต้องหาไม่เห็นผู้ชี้ตัว ได้จัดให้ผู้ต้องหาแต่งกายลักษณะคล้ายคลึงกับเวลาที่เกิด
                  เหตุ โดยให้ปะปนกับบุคคลอื่นเพศเดียวกันซึ่งมีรูปร่าง ขนาด อายุ คล้ายคลึงกันกับผู้ต้องหา จำนวน{" "}
                  <input
                    aria-label="จำนวนคน"
                    value={fields.personCount}
                    onChange={(e) => onChange("personCount", e.target.value)}
                    spellCheck={false}
                    className="sp-word-field align-baseline inline"
                    style={{
                      width: `${Math.max(3, (fields.personCount || "").length + 1)}ch`,
                      fontSize: "inherit",
                      lineHeight: "inherit",
                      height: "auto",
                      paddingBottom: "1px",
                    }}
                  />{" "}
                  คน คือ
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    columnGap: "8mm",
                    rowGap: "0.3mm",
                    marginBottom: "1.2mm",
                  }}
                >
                  {people.slice(0, LINEUP_ID_PERSON_COUNT).map((person, i) => (
                    <div
                      key={`pe-${i}`}
                      style={{
                        display: "flex",
                        flexWrap: "nowrap",
                        alignItems: "baseline",
                        gap: "1.5mm",
                        minHeight: LINE,
                        lineHeight: LINE,
                      }}
                    >
                      <T>{thaiNumeral(i + 1)}.</T>
                      <Dot
                        aria-label={`บุคคลที่ ${i + 1}`}
                        value={person}
                        onChange={(v) => patchPerson(i, v)}
                        flex
                        minCh={8}
                      />
                    </div>
                  ))}
                </div>
                <p
                  style={{
                    margin: "0 0 0.6mm",
                    textAlign: "justify",
                    fontSize: BODY,
                    lineHeight: 1.45,
                  }}
                >
                  ๕. ผู้อำนวยการชี้ตัวได้จัดให้ชี้ตัวโดยวิธี ยืน/เดิน ผ่านที่ละคน และได้ถามผู้ต้องหาว่าตามที่จัดให้ชี้ตัวนี้
                  เป็นที่พอใจหรือไม่ หรือจะให้จัดการอย่างไร
                </p>
              </div>
            </>
          ) : null}

          {page.showPageNo ? (
            <p style={{ margin: "0 0 5mm", textAlign: "center", fontSize: BODY, flexShrink: 0 }}>
              {thaiNumeral(page.index + 1)}
            </p>
          ) : null}

          {page.answer ? (
            <FieldLines
              value={page.answer.text}
              onChange={(v) => patchAnswer(page.answer!.sliceIndex, v)}
              lines={page.answer.lines}
              ariaLabel={page.answer.sliceIndex === 0 ? "คำตอบผู้ต้องหาเรื่องการจัดชี้ตัว" : "คำตอบผู้ต้องหา (ต่อ)"}
            />
          ) : null}

          {page.showClosing ? (
            <p
              style={{
                margin: "1.6mm 0 2mm",
                textAlign: "justify",
                fontSize: BODY,
                lineHeight: 1.45,
                flexShrink: 0,
              }}
            >
              ๖. ผู้ต้องหามีความพอใจในการจัดให้ชี้ตัว ได้อ่านบันทึกนี้ให้ผู้ต้องหา และพยานในการชี้ตัวฟังแล้ว
              รับว่าถูกต้อง จึงให้ลงลายมือชื่อไว้เป็นหลักฐาน
            </p>
          ) : null}

          {page.showSigns ? (
            <div
              style={{
                width: "100%",
                flexShrink: 0,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: "4mm",
                rowGap: "1.2mm",
                alignItems: "start",
              }}
            >
              <SignBlock
                role="ผู้ต้องหา"
                name={fields.signSuspect}
                paren={fields.signSuspectParen}
                onName={(v) => onChange("signSuspect", v)}
                onParen={(v) => onChange("signSuspectParen", v)}
              />
              <SignBlock
                role="พยาน"
                name={fields.signWitness1}
                paren={fields.signWitness1Paren}
                onName={(v) => onChange("signWitness1", v)}
                onParen={(v) => onChange("signWitness1Paren", v)}
              />
              <SignBlock
                role="พยาน"
                name={fields.signWitness2}
                paren={fields.signWitness2Paren}
                onName={(v) => onChange("signWitness2", v)}
                onParen={(v) => onChange("signWitness2Paren", v)}
              />
              <SignBlock
                role="ผู้อำนวยการชี้ตัว"
                name={fields.signDirector}
                paren={fields.signDirectorParen}
                onName={(v) => onChange("signDirector", v)}
                onParen={(v) => onChange("signDirectorParen", v)}
              />
              <SignBlock
                role="พงส./บันทึก/อ่าน"
                name={fields.signOfficer}
                paren={fields.signOfficerParen}
                onName={(v) => onChange("signOfficer", v)}
                onParen={(v) => onChange("signOfficerParen", v)}
              />
            </div>
          ) : null}
        </Sheet>
      ))}
    </div>
  );
}
