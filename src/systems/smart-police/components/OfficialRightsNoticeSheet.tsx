"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { RIGHTS_NOTICE_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import { packRightsNoticePages, type RightsNoticeFields } from "@/lib/smart-police/form-templates/rights-notice";
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

function SignLine({
  role,
  value,
  onChange,
  ariaLabel,
}: {
  role: string;
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  return (
    <Row style={{ flexWrap: "wrap", marginBottom: "0.2mm", minHeight: SIGN_LINE, lineHeight: SIGN_LINE }}>
      <span style={{ flexShrink: 0 }}>ลงชื่อ</span>
      <span style={{ flexShrink: 0 }}>(</span>
      <Dot aria-label={ariaLabel} value={value} onChange={onChange} flex minCh={8} />
      <span style={{ flexShrink: 0 }}>)</span>
      <span style={{ flexShrink: 0 }}>{role}</span>
    </Row>
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

export function OfficialRightsNoticeDocument({
  fields,
  onChange,
  onPageCount,
}: {
  fields: RightsNoticeFields;
  onChange: <K extends keyof RightsNoticeFields>(key: K, value: RightsNoticeFields[K]) => void;
  onPageCount?: (n: number) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [measureReady, setMeasureReady] = useState(false);

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

  const pages = useMemo(() => packRightsNoticePages(fields, countLines), [fields, countLines]);

  useLayoutEffect(() => {
    onPageCount?.(pages.length);
  }, [onPageCount, pages.length]);

  function patchCharge(sliceIndex: number, text: string) {
    const slices = pages.filter((p) => p.charge).map((p) => p.charge!);
    onChange("charge", slices.map((s, i) => (i === sliceIndex ? text : s.text)).join(""));
  }

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      {pages.map((page) => (
        <Sheet key={`rn-${page.index}`} index={page.index}>
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
                  {RIGHTS_NOTICE_FORM_TITLE}
                </h1>
              </header>

              <div style={{ flexShrink: 0 }}>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>สถานที่บันทึก</T>
                  <Dot
                    aria-label="สถานที่บันทึก"
                    value={fields.recordPlace}
                    onChange={(v) => onChange("recordPlace", v)}
                    flex
                    minCh={10}
                  />
                </Row>
                <Row style={{ flexWrap: "nowrap", justifyContent: "center" }}>
                  <T>วันที่</T>
                  <Dot aria-label="วันที่" value={fields.day} onChange={(v) => onChange("day", v)} minCh={4} />
                  <T>เดือน</T>
                  <Dot aria-label="เดือน" value={fields.month} onChange={(v) => onChange("month", v)} minCh={6} />
                  <T>พ.ศ.</T>
                  <Dot aria-label="พ.ศ." value={fields.year} onChange={(v) => onChange("year", v)} minCh={5} />
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>วันนี้เวลา</T>
                  <Dot aria-label="เวลา" value={fields.time} onChange={(v) => onChange("time", v)} minCh={5} />
                  <T>น. ข้าพเจ้า</T>
                  <Dot
                    aria-label="ชื่อผู้บันทึก"
                    value={fields.officer}
                    onChange={(v) => onChange("officer", v)}
                    flex
                    minCh={10}
                  />
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>ตำแหน่ง</T>
                  <Dot
                    aria-label="ตำแหน่งผู้บันทึก"
                    value={fields.officerRank}
                    onChange={(v) => onChange("officerRank", v)}
                    flex
                    minCh={8}
                  />
                  <T>ได้แจ้งให้ผู้ถูกจับหรือผู้ต้องหา ทราบถึงสิทธิตามกฎหมาย</T>
                </Row>
                <p
                  style={{
                    margin: "1mm 0 1.4mm",
                    textAlign: "justify",
                    fontSize: BODY,
                    lineHeight: 1.45,
                  }}
                >
                  คือ ผู้ถูกจับหรือผู้ต้องหาซึ่งถูกควบคุมหรือขัง มีสิทธิแจ้งหรือขอให้เจ้าพนักงานแจ้งให้ญาติหรือผู้ซึ่งถูกจับหรือผู้ต้องหาไว้วางใจทราบถึงการถูกจับกุมและสถานที่ที่ถูกควบคุมในโอกาสแรกและให้ผู้ถูกจับหรือผู้ต้องหามีสิทธิดังต่อไปนี้ด้วย
                </p>
                <div style={{ fontSize: BODY, lineHeight: 1.5, marginBottom: "1.6mm" }}>
                  <p style={{ margin: "0 0 0.6mm" }}>๑. พบและปรึกษาผู้ซึ่งจะเป็นทนายความเป็นการเฉพาะตัว</p>
                  <p style={{ margin: "0 0 0.6mm" }}>
                    ๒. ให้ทนายความหรือผู้ซึ่งตนไว้วางใจเข้าฟังคำสอบสวนปากคำตนในชั้นสอบสวน
                  </p>
                  <p style={{ margin: "0 0 0.6mm" }}>๓. ได้รับการเยี่ยมหรือติดต่อกับญาติได้ตามสมควร</p>
                  <p style={{ margin: 0 }}>๔. ได้รับการรักษาพยาบาลโดยเร็วเมื่อเกิดการเจ็บป่วย</p>
                </div>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>ผู้ถูกจับหรือผู้ต้องหา ชื่อ</T>
                  <Dot
                    aria-label="ชื่อผู้ถูกจับหรือผู้ต้องหา"
                    value={fields.name}
                    onChange={(v) => onChange("name", v)}
                    flex
                    minCh={10}
                  />
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>เชื้อชาติ</T>
                  <Dot
                    aria-label="เชื้อชาติ"
                    value={fields.ethnicity}
                    onChange={(v) => onChange("ethnicity", v)}
                    minCh={6}
                  />
                  <T>สัญชาติ</T>
                  <Dot
                    aria-label="สัญชาติ"
                    value={fields.nationality}
                    onChange={(v) => onChange("nationality", v)}
                    minCh={6}
                  />
                  <T>อายุ</T>
                  <Dot aria-label="อายุ" value={fields.age} onChange={(v) => onChange("age", v)} minCh={3} />
                  <T>ปี</T>
                </Row>
              </div>
            </>
          ) : null}

          {page.showPageNo ? (
            <p style={{ margin: "0 0 5mm", textAlign: "center", fontSize: BODY, flexShrink: 0 }}>
              {thaiNumeral(page.index + 1)}
            </p>
          ) : null}

          {page.charge ? (
            <FieldLines
              label={page.charge.label}
              value={page.charge.text}
              onChange={(v) => patchCharge(page.charge!.sliceIndex, v)}
              lines={page.charge.lines}
              showLabel={page.charge.showLabel}
              ariaLabel={page.charge.showLabel ? page.charge.label : `${page.charge.label} (ต่อ)`}
            />
          ) : null}

          {page.showMeta ? (
            <Row style={{ flexWrap: "nowrap", marginTop: "1mm" }}>
              <T>เมื่อวันที่</T>
              <Dot
                aria-label="วันที่ถูกจับ"
                value={fields.arrestDay}
                onChange={(v) => onChange("arrestDay", v)}
                minCh={4}
              />
              <T>เดือน</T>
              <Dot
                aria-label="เดือนที่ถูกจับ"
                value={fields.arrestMonth}
                onChange={(v) => onChange("arrestMonth", v)}
                minCh={6}
              />
              <T>พ.ศ.</T>
              <Dot
                aria-label="พ.ศ. ที่ถูกจับ"
                value={fields.arrestYear}
                onChange={(v) => onChange("arrestYear", v)}
                minCh={5}
              />
              <T>ตาม ป.จ.ว. ข้อ</T>
              <Dot
                aria-label="ป.จ.ว. ข้อ"
                value={fields.dailyLogItem}
                onChange={(v) => onChange("dailyLogItem", v)}
                flex
                minCh={4}
              />
            </Row>
          ) : null}

          {page.showClosing ? (
            <>
              <p
                style={{
                  margin: "1.4mm 0 1mm",
                  textAlign: "justify",
                  fontSize: BODY,
                  lineHeight: 1.45,
                  flexShrink: 0,
                }}
              >
                ผู้ถูกจับหรือผู้ต้องหาได้รับทราบสิทธิดังกล่าวข้างต้นแล้ว จึงลงลายมือชื่อไว้เป็นหลักฐาน
              </p>
              <p
                style={{
                  margin: "0 0 1.6mm",
                  textAlign: "center",
                  fontSize: BODY,
                  lineHeight: LINE,
                  flexShrink: 0,
                }}
              >
                อ่านให้ฟังแล้วรับว่าถูกต้อง
              </p>
            </>
          ) : null}

          {page.showSigns ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: "4mm",
                rowGap: "0.6mm",
                width: "100%",
                flexShrink: 0,
              }}
            >
              <SignLine
                role="ผู้ต้องหา"
                ariaLabel="ลงชื่อผู้ต้องหา"
                value={fields.signAccused}
                onChange={(v) => onChange("signAccused", v)}
              />
              <SignLine
                role="ผู้แจ้งสิทธิ/บันทึก/อ่าน"
                ariaLabel="ลงชื่อผู้แจ้งสิทธิ บันทึก อ่าน"
                value={fields.signRecorder}
                onChange={(v) => onChange("signRecorder", v)}
              />
              <Row style={{ flexWrap: "nowrap", marginBottom: 0, minHeight: SIGN_LINE, lineHeight: SIGN_LINE }}>
                <span style={{ flexShrink: 0 }}>ตำแหน่ง</span>
                <span style={{ flexShrink: 0 }}>(</span>
                <Dot
                  aria-label="ตำแหน่งผู้แจ้งสิทธิ"
                  value={fields.recorderPosition}
                  onChange={(v) => onChange("recorderPosition", v)}
                  flex
                  minCh={8}
                />
                <span style={{ flexShrink: 0 }}>)</span>
              </Row>
              <SignLine
                role="พยาน"
                ariaLabel="ลงชื่อพยาน"
                value={fields.signWitness}
                onChange={(v) => onChange("signWitness", v)}
              />
            </div>
          ) : null}
        </Sheet>
      ))}
    </div>
  );
}
