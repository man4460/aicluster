"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { PHOTO_ID_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  PHOTO_ID_PHOTO_COUNT,
  packPhotoIdPages,
  type PhotoIdFields,
} from "@/lib/smart-police/form-templates/photo-id";
import { estimateArrestWrappedLines as estimateLines } from "@/lib/smart-police/form-templates/arrest-record";
import { thaiNumeral } from "@/lib/smart-police/form-templates/property-list";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "13pt";
const TITLE = "15pt";
const LINE = "6.2mm";
const SIGN_LINE = "5.8mm";

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
  label,
  value,
  onChange,
  lines,
  ariaLabel,
  showLabel = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  lines: number;
  ariaLabel: string;
  showLabel?: boolean;
}) {
  const indent = showLabel ? `calc(${label.length + 1}ch + 1.5mm)` : "0";
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
      {showLabel ? (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: LINE,
            lineHeight: LINE,
            fontWeight: 700,
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          {label}
        </span>
      ) : null}
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
          textIndent: indent,
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
    <>
      <span style={{ flexShrink: 0, lineHeight: SIGN_LINE }}>ลงชื่อ</span>
      <Dot aria-label={`ลงชื่อ${role}`} value={name} onChange={onName} flex minCh={8} />
      <span style={{ flexShrink: 0, lineHeight: SIGN_LINE, whiteSpace: "nowrap" }}>{role}</span>
      <span aria-hidden />
      <div
        style={{
          display: "flex",
          flexWrap: "nowrap",
          alignItems: "baseline",
          gap: "1.5mm",
          minHeight: SIGN_LINE,
          lineHeight: SIGN_LINE,
          paddingLeft: "4mm",
          marginBottom: "1.2mm",
          minWidth: 0,
        }}
      >
        <span style={{ flexShrink: 0 }}>(</span>
        <Dot aria-label={`ชื่อวงเล็บ${role}`} value={paren} onChange={onParen} flex minCh={8} />
        <span style={{ flexShrink: 0 }}>)</span>
      </div>
      <span aria-hidden />
    </>
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

export function OfficialPhotoIdDocument({
  fields,
  onChange,
  onPageCount,
}: {
  fields: PhotoIdFields;
  onChange: <K extends keyof PhotoIdFields>(key: K, value: PhotoIdFields[K]) => void;
  onPageCount?: (n: number) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [measureReady, setMeasureReady] = useState(false);
  const photos = fields.photos.length >= PHOTO_ID_PHOTO_COUNT
    ? fields.photos
    : [...fields.photos, ...Array.from({ length: PHOTO_ID_PHOTO_COUNT - fields.photos.length }, () => "")];

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

  const pages = useMemo(() => packPhotoIdPages(fields, countLines), [fields, countLines]);

  useLayoutEffect(() => {
    onPageCount?.(pages.length);
  }, [onPageCount, pages.length]);

  function patchPhoto(i: number, v: string) {
    onChange(
      "photos",
      photos.map((p, idx) => (idx === i ? v : p)),
    );
  }

  function patchResult(sliceIndex: number, text: string) {
    const slices = pages.filter((p) => p.result).map((p) => p.result!);
    onChange("result", slices.map((s, i) => (i === sliceIndex ? text : s.text)).join(""));
  }

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      {pages.map((page) => (
        <Sheet key={`pid-${page.index}`} index={page.index}>
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
                  {PHOTO_ID_FORM_TITLE}
                </h1>
              </header>
              <div style={{ flexShrink: 0 }}>
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
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>๑. ชื่อ และตำแหน่งผู้อำนวยการชี้รูป</T>
                  <Dot
                    aria-label="ชื่อและตำแหน่งผู้อำนวยการชี้รูป"
                    value={fields.director}
                    onChange={(v) => onChange("director", v)}
                    flex
                    minCh={8}
                  />
                </Row>
                <Row>
                  <T>๒. จัดให้มีการชี้รูปผู้ต้องหาในคดีที่ ข้อหา</T>
                  <Dot
                    aria-label="ข้อหาในคดีที่ชี้รูป"
                    value={fields.caseCharge}
                    onChange={(v) => onChange("caseCharge", v)}
                    flex
                    minCh={8}
                  />
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>คือ ผู้ต้องหา</T>
                  <Dot
                    aria-label="ชื่อผู้ต้องหา"
                    value={fields.suspectName}
                    onChange={(v) => onChange("suspectName", v)}
                    flex
                    minCh={10}
                  />
                </Row>
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
                    aria-label="ข้อหาคดีอาญา"
                    value={fields.criminalCharge}
                    onChange={(v) => onChange("criminalCharge", v)}
                    flex
                    minCh={8}
                  />
                </Row>
                <Row>
                  <T>โดยจัดให้ นาย/นาง/นางสาว</T>
                  <Dot
                    aria-label="ผู้เข้าชี้รูป"
                    value={fields.identifierName}
                    onChange={(v) => onChange("identifierName", v)}
                    flex
                    minCh={8}
                  />
                  <T>ผู้กล่าวหา, พยาน , เข้าชี้รูป</T>
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>ผู้ต้องหาที่</T>
                  <Dot
                    aria-label="ผู้ต้องหาที่"
                    value={fields.suspectNo}
                    onChange={(v) => onChange("suspectNo", v)}
                    flex
                    minCh={8}
                  />
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>เมื่อวันที่</T>
                  <Dot aria-label="วันที่ชี้รูป" value={fields.idDay} onChange={(v) => onChange("idDay", v)} minCh={4} />
                  <T>เดือน</T>
                  <Dot
                    aria-label="เดือนที่ชี้รูป"
                    value={fields.idMonth}
                    onChange={(v) => onChange("idMonth", v)}
                    minCh={5}
                  />
                  <T>พ.ศ.</T>
                  <Dot aria-label="พ.ศ. ที่ชี้รูป" value={fields.idYear} onChange={(v) => onChange("idYear", v)} minCh={5} />
                  <T>เวลา</T>
                  <Dot aria-label="เวลาที่ชี้รูป" value={fields.idTime} onChange={(v) => onChange("idTime", v)} minCh={5} />
                  <T>น.</T>
                </Row>
                <p
                  style={{
                    margin: "1mm 0 1.2mm",
                    textAlign: "justify",
                    fontSize: BODY,
                    lineHeight: 1.45,
                  }}
                >
                  ๓. ก่อนทำการชี้รูปได้นำรูปภาพผู้ต้องหามาคละรวมกันกับภาพของบุคคลอื่นที่เหมือนหรือใกล้ความเป็นจริงกับตัวจริงของผู้ต้องหาตามที่เห็นอยู่ในเวลาที่ต้องหานั้น โดยมิได้มีเครื่องหมายใด ๆ ในรูปนั้น
                </p>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>จำนวนรูป คือ.-</T>
                  <Dot
                    aria-label="จำนวนรูป"
                    value={fields.photoCount}
                    onChange={(v) => onChange("photoCount", v)}
                    minCh={4}
                  />
                  <T>(รวมแล้วต้องไม่น้อยกว่า ๕ รูป)</T>
                </Row>
                {photos.slice(0, PHOTO_ID_PHOTO_COUNT).map((photo, i) => (
                  <Row key={`ph-${i}`} style={{ flexWrap: "nowrap" }}>
                    <T>({thaiNumeral(i + 1)})</T>
                    <Dot
                      aria-label={`รูปที่ ${i + 1}`}
                      value={photo}
                      onChange={(v) => patchPhoto(i, v)}
                      flex
                      minCh={10}
                    />
                  </Row>
                ))}
                <Row>
                  <T>แล้วจึงให้ นาย/นาง/นางสาว</T>
                  <Dot
                    aria-label="ผู้ดูรูปและชี้"
                    value={fields.identifierName2}
                    onChange={(v) => onChange("identifierName2", v)}
                    flex
                    minCh={8}
                  />
                  <T>ผู้กล่าวหา, พยาน ดูรูปและให้ชี้</T>
                </Row>
                <p style={{ margin: "0 0 1.2mm", fontSize: BODY, lineHeight: LINE }}>
                  ในเวลานั้นว่า รูปใด เป็นรูปของผู้ต้องหา
                </p>
              </div>
            </>
          ) : null}

          {page.showPageNo ? (
            <p style={{ margin: "0 0 5mm", textAlign: "center", fontSize: BODY, flexShrink: 0 }}>
              {thaiNumeral(page.index + 1)}
            </p>
          ) : null}

          {page.result ? (
            <FieldLines
              label={page.result.label}
              value={page.result.text}
              onChange={(v) => patchResult(page.result!.sliceIndex, v)}
              lines={page.result.lines}
              showLabel={page.result.showLabel}
              ariaLabel={page.result.showLabel ? page.result.label : `${page.result.label} (ต่อ)`}
            />
          ) : null}

          {page.showLog ? (
            <div style={{ flexShrink: 0, marginTop: "1mm" }}>
              <Row style={{ flexWrap: "nowrap" }}>
                <T>ได้ลงหลักฐานการชี้รูปผู้ต้องหาไว้ตาม ป.จ.ว. ข้อ</T>
                <Dot
                  aria-label="ป.จ.ว. ข้อ"
                  value={fields.dailyLogItem}
                  onChange={(v) => onChange("dailyLogItem", v)}
                  minCh={4}
                />
                <T>เวลา</T>
                <Dot
                  aria-label="เวลา ป.จ.ว."
                  value={fields.dailyLogTime}
                  onChange={(v) => onChange("dailyLogTime", v)}
                  minCh={5}
                />
                <T>น.</T>
                <T>วันที่</T>
                <Dot aria-label="วันที่ลงหลักฐาน" value={fields.logDay} onChange={(v) => onChange("logDay", v)} minCh={4} />
                <T>เดือน</T>
                <Dot
                  aria-label="เดือนลงหลักฐาน"
                  value={fields.logMonth}
                  onChange={(v) => onChange("logMonth", v)}
                  minCh={5}
                />
                <T>พ.ศ.</T>
                <Dot aria-label="พ.ศ. ลงหลักฐาน" value={fields.logYear} onChange={(v) => onChange("logYear", v)} minCh={5} />
              </Row>
              <p
                style={{
                  margin: "1.6mm 0 2mm",
                  textAlign: "center",
                  fontSize: BODY,
                  lineHeight: 1.45,
                }}
              >
                อ่านบันทึกนี้ให้ผู้กล่าวหาหรือพยานฟังแล้วรับว่าถูกต้อง จึงให้ลงลายมือชื่อไว้เป็นหลักฐาน
              </p>
            </div>
          ) : null}

          {page.showSigns ? (
            <div
              style={{
                width: "62%",
                marginLeft: "auto",
                flexShrink: 0,
                display: "grid",
                gridTemplateColumns: "auto minmax(0, 1fr) auto",
                columnGap: "1.5mm",
                rowGap: "0.15mm",
                alignItems: "baseline",
              }}
            >
              <SignBlock
                role="ผู้กล่าวหา ชี้รูป"
                name={fields.signComplainant}
                paren={fields.signComplainantParen}
                onName={(v) => onChange("signComplainant", v)}
                onParen={(v) => onChange("signComplainantParen", v)}
              />
              <SignBlock
                role="พยาน ชี้รูป"
                name={fields.signWitnessId}
                paren={fields.signWitnessIdParen}
                onName={(v) => onChange("signWitnessId", v)}
                onParen={(v) => onChange("signWitnessIdParen", v)}
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
                role="ผู้อำนวยการชี้รูป"
                name={fields.signDirector}
                paren={fields.signDirectorParen}
                onName={(v) => onChange("signDirector", v)}
                onParen={(v) => onChange("signDirectorParen", v)}
              />
              <SignBlock
                role="พนักงานสอบสวน / บันทึก / อ่าน"
                name={fields.signOfficer}
                paren={fields.signOfficerParen}
                onName={(v) => onChange("signOfficer", v)}
                onParen={(v) => onChange("signOfficerParen", v)}
              />
              <span style={{ flexShrink: 0, lineHeight: SIGN_LINE }}>ตำแหน่ง</span>
              <Dot
                aria-label="ตำแหน่งผู้บันทึก"
                value={fields.officerPosition}
                onChange={(v) => onChange("officerPosition", v)}
                flex
                minCh={8}
              />
              <span aria-hidden />
            </div>
          ) : null}
        </Sheet>
      ))}
    </div>
  );
}
