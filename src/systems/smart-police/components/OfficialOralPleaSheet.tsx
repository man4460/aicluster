"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  ORAL_PLEA_FORM_SUBTITLE,
  ORAL_PLEA_FORM_TITLE,
} from "@/lib/smart-police/form-templates/official-form-catalog";
import { flowOralPleaQaOverflow, type OralPleaFields } from "@/lib/smart-police/form-templates/oral-plea";
import {
  lastQaKind,
  StatementQaEditor,
  StatementReadbackSignOff,
} from "@/systems/smart-police/components/StatementQaEditor";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "13pt";
const SMALL = "11pt";
const TITLE = "15pt";
const LINE = "6.2mm";
const STMT_LINE = "7.8mm";
/** ย่อหน้าเอกสารราชการ */
const INDENT = "12mm";
const THAI_DIGITS = "๐๑๒๓๔๕๖๗๘๙";

function thaiPageNo(n: number): string {
  return String(n)
    .split("")
    .map((d) => THAI_DIGITS[Number(d)] ?? d)
    .join("");
}

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
        margin: "0 0 0.55mm",
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

function L({ children }: { children: ReactNode }) {
  return <span style={{ fontWeight: 700, flexShrink: 0 }}>{children}</span>;
}

function T({ children }: { children: ReactNode }) {
  return <span style={{ flexShrink: 0 }}>{children}</span>;
}

const CHARGE_PREFIX = "พฤติการณ์และการกระทำของผู้ต้องหาเป็นความผิดฐาน “";

function ChargeWrap({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const prefixRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [indent, setIndent] = useState(0);
  const [lines, setLines] = useState(1);

  useLayoutEffect(() => {
    if (prefixRef.current) setIndent(prefixRef.current.offsetWidth);
  }, []);

  useLayoutEffect(() => {
    const text = textRef.current;
    const line = lineRef.current;
    if (!text || !line) return;
    const one = line.offsetHeight || 1;
    setLines(Math.min(3, Math.max(1, Math.ceil(text.scrollHeight / one))));
  }, [value, indent]);

  const firstIndent = indent ? `calc(${INDENT} + ${indent + 4}px)` : INDENT;

  return (
    <div style={{ position: "relative", margin: "0 0 1mm", width: "100%" }}>
      <div ref={lineRef} aria-hidden style={{ height: LINE, position: "absolute", visibility: "hidden" }} />
      <span
        ref={prefixRef}
        aria-hidden
        style={{
          position: "absolute",
          left: INDENT,
          top: 0,
          zIndex: 1,
          fontSize: BODY,
          lineHeight: LINE,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        {CHARGE_PREFIX}
      </span>
      <div
        ref={textRef}
        aria-hidden
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          width: "100%",
          fontSize: BODY,
          lineHeight: LINE,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
          textIndent: firstIndent,
        }}
      >
        {value || "\u00a0"}
      </div>
      <div aria-hidden>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            style={{ height: LINE, borderBottom: "0.5pt dotted #111", boxSizing: "border-box" }}
          />
        ))}
      </div>
      <textarea
        aria-label="พฤติการณ์ ความผิดฐาน"
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
          textIndent: firstIndent,
        }}
      />
    </div>
  );
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
        padding: "12mm 14mm 12mm",
        fontFamily: FONT,
        fontSize: BODY,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {children}
    </article>
  );
}

export function OfficialOralPleaDocument({
  fields,
  onChange,
  onQaPagesChange,
}: {
  fields: OralPleaFields;
  onChange: <K extends keyof OralPleaFields>(key: K, value: OralPleaFields[K]) => void;
  onQaPagesChange: (updater: (pages: string[]) => string[]) => void;
}) {
  const qaPages = fields.qaPages.length >= 2 ? fields.qaPages : [...fields.qaPages, ""];

  function setQaPage(i: number, text: string) {
    onQaPagesChange((pages) => {
      const next = pages.length >= 2 ? [...pages] : [...pages, ""];
      next[i] = text;
      return next;
    });
  }

  function overflowQa(i: number, moved: string) {
    onQaPagesChange((pages) => flowOralPleaQaOverflow(pages, i, moved));
  }

  function continuesBefore(i: number) {
    for (let j = i - 1; j >= 0; j--) {
      const k = lastQaKind(qaPages[j] ?? "");
      if (k) return k;
    }
    return null;
  }

  const signOff = (
    <StatementReadbackSignOff
      roleLabel="ผู้ต้องหา"
      signParty={fields.signComplainant}
      signOfficer={fields.signOfficer}
      onSignParty={(v) => onChange("signComplainant", v)}
      onSignOfficer={(v) => onChange("signOfficer", v)}
      lineHeight={STMT_LINE}
      fontSize={BODY}
    />
  );

  return (
    <div className="flex flex-col gap-6 pb-8">
      <Sheet index={0}>
        <div style={{ position: "relative", marginBottom: "2.5mm", flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/smart-police/garuda.png"
            alt=""
            width={84}
            height={96}
            style={{
              display: "block",
              position: "absolute",
              left: "50%",
              top: 0,
              transform: "translateX(-50%)",
              height: "22mm",
              width: "auto",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              minHeight: "22mm",
            }}
          >
            <div
              style={{
                width: "58mm",
                fontSize: SMALL,
                textAlign: "right",
                display: "flex",
                flexDirection: "column",
                gap: "0.4mm",
              }}
            >
              <p style={{ margin: 0, fontWeight: 700, lineHeight: 1.35 }}>บัตรประจำตัวประชาชน</p>
              <Row style={{ flexWrap: "nowrap", fontSize: SMALL, minHeight: "5.5mm", lineHeight: "5.5mm", margin: 0 }}>
                <T>เลขที่</T>
                <Dot
                  aria-label="เลขที่บัตรประชาชน"
                  value={fields.idCardNo}
                  onChange={(v) => onChange("idCardNo", v)}
                  flex
                  minCh={6}
                />
              </Row>
              <div
                style={{
                  display: "flex",
                  flexWrap: "nowrap",
                  alignItems: "baseline",
                  gap: "1.5mm",
                  minHeight: "5.5mm",
                  lineHeight: "5.5mm",
                  fontSize: SMALL,
                }}
              >
                <T>ยศ</T>
                <Dot aria-label="ยศ" value={fields.rank} onChange={(v) => onChange("rank", v)} flex minCh={6} />
                <T>บันทึก</T>
              </div>
            </div>
          </div>
          <p style={{ margin: "1.5mm 0 0", fontSize: "20pt", fontWeight: 700, lineHeight: 1.15, textAlign: "center" }}>
            สำนักงานตำรวจแห่งชาติ
          </p>
          <h1
            style={{
              margin: "1mm 0 0",
              fontSize: TITLE,
              fontWeight: 700,
              lineHeight: 1.25,
              textAlign: "center",
              textDecoration: "underline",
              textUnderlineOffset: "1mm",
            }}
          >
            {ORAL_PLEA_FORM_TITLE}
          </h1>
          <p
            style={{
              margin: "0.5mm 0 0",
              fontSize: TITLE,
              fontWeight: 700,
              lineHeight: 1.25,
              textAlign: "center",
              textDecoration: "underline",
              textUnderlineOffset: "1mm",
            }}
          >
            {ORAL_PLEA_FORM_SUBTITLE}
          </p>
        </div>

        <Row>
          <L>สถานีตำรวจ</L>
          <Dot
            aria-label="สถานีตำรวจ"
            value={fields.stationName}
            onChange={(v) => onChange("stationName", v)}
            flex
          />
          <L>เขต</L>
          <Dot aria-label="เขต" value={fields.district} onChange={(v) => onChange("district", v)} flex minCh={5} />
          <L>จังหวัด</L>
          <Dot
            aria-label="จังหวัด"
            value={fields.province}
            onChange={(v) => onChange("province", v)}
            flex
            minCh={6}
          />
        </Row>
        <Row>
          <L>วันที่</L>
          <Dot aria-label="วันที่" value={fields.dayThai} onChange={(v) => onChange("dayThai", v)} minCh={3} />
          <L>เดือน</L>
          <Dot
            aria-label="เดือน"
            value={fields.monthThai}
            onChange={(v) => onChange("monthThai", v)}
            flex
            minCh={6}
          />
          <L>พุทธศักราช ๒๕</L>
          <Dot aria-label="พ.ศ." value={fields.yearThai} onChange={(v) => onChange("yearThai", v)} minCh={3} />
        </Row>
        <Row>
          <L>สอบสวนที่</L>
          <Dot
            aria-label="สอบสวนที่"
            value={fields.interviewPlace}
            onChange={(v) => onChange("interviewPlace", v)}
            flex
          />
        </Row>
        <Row>
          <L>ชื่อ-สกุล</L>
          <Dot aria-label="ชื่อ-สกุล" value={fields.fullName} onChange={(v) => onChange("fullName", v)} flex />
          <L>อายุ</L>
          <Dot aria-label="อายุ" value={fields.age} onChange={(v) => onChange("age", v)} minCh={3} />
          <L>ปี</L>
        </Row>
        <Row>
          <L>เชื้อชาติ</L>
          <Dot
            aria-label="เชื้อชาติ"
            value={fields.ethnicity}
            onChange={(v) => onChange("ethnicity", v)}
            flex
            minCh={4}
          />
          <L>สัญชาติ</L>
          <Dot
            aria-label="สัญชาติ"
            value={fields.nationality}
            onChange={(v) => onChange("nationality", v)}
            flex
            minCh={4}
          />
          <L>ศาสนา</L>
          <Dot
            aria-label="ศาสนา"
            value={fields.religion}
            onChange={(v) => onChange("religion", v)}
            flex
            minCh={4}
          />
          <L>อาชีพ</L>
          <Dot
            aria-label="อาชีพ"
            value={fields.occupation}
            onChange={(v) => onChange("occupation", v)}
            flex
            minCh={5}
          />
        </Row>
        <Row>
          <L>อยู่บ้านเลขที่</L>
          <Dot
            aria-label="บ้านเลขที่"
            value={fields.houseNo}
            onChange={(v) => onChange("houseNo", v)}
            flex
            minCh={4}
          />
          <L>หมู่ที่</L>
          <Dot aria-label="หมู่ที่" value={fields.moo} onChange={(v) => onChange("moo", v)} minCh={3} />
          <L>ถนน</L>
          <Dot aria-label="ถนน" value={fields.road} onChange={(v) => onChange("road", v)} flex minCh={5} />
        </Row>
        <Row>
          <L>ตำบล</L>
          <Dot aria-label="ตำบล" value={fields.tambon} onChange={(v) => onChange("tambon", v)} flex minCh={5} />
          <L>อำเภอ</L>
          <Dot aria-label="อำเภอ" value={fields.amphoe} onChange={(v) => onChange("amphoe", v)} flex minCh={5} />
          <L>จังหวัด</L>
          <Dot
            aria-label="จังหวัดที่อยู่"
            value={fields.addressProvince}
            onChange={(v) => onChange("addressProvince", v)}
            flex
            minCh={5}
          />
        </Row>
        <Row>
          <L>ชื่อบิดา-มารดา</L>
          <Dot
            aria-label="ชื่อบิดา-มารดา"
            value={fields.parentsName}
            onChange={(v) => onChange("parentsName", v)}
            flex
          />
        </Row>
        <Row>
          <L>เกิดที่ตำบล</L>
          <Dot
            aria-label="เกิดที่ตำบล"
            value={fields.birthTambon}
            onChange={(v) => onChange("birthTambon", v)}
            flex
            minCh={5}
          />
          <L>อำเภอ</L>
          <Dot
            aria-label="เกิดอำเภอ"
            value={fields.birthAmphoe}
            onChange={(v) => onChange("birthAmphoe", v)}
            flex
            minCh={5}
          />
          <L>จังหวัด</L>
          <Dot
            aria-label="เกิดจังหวัด"
            value={fields.birthProvince}
            onChange={(v) => onChange("birthProvince", v)}
            flex
            minCh={5}
          />
        </Row>

        <p style={{ margin: "1.5mm 0 0.8mm", fontSize: BODY, lineHeight: 1.5, textAlign: "justify", textIndent: INDENT }}>
          พนักงานสอบสวนได้แจ้งข้อกล่าวหาให้ข้าพเจ้าทราบ และได้แจ้งให้ทราบด้วยว่าคำให้การนี้อาจนำไปเป็นพยานหลักฐานในชั้นพิจารณาของศาลได้
        </p>
        <p style={{ margin: "0 0 2mm", fontSize: BODY, lineHeight: 1.5, textIndent: INDENT }}>
          ข้าพเจ้าทราบข้อกล่าวหาตลอดแล้ว ขอให้การด้วยความเต็มใจ ดังต่อไปนี้
        </p>
        <p style={{ margin: "0 0 1mm", fontSize: BODY, lineHeight: 1.5, textIndent: INDENT }}>
          พนักงานสอบสวนได้แจ้งข้อเท็จจริงและข้อกล่าวหาให้ทราบว่า
        </p>
        <Row>
          <T>เหตุเกิด เมื่อวันที่</T>
          <Dot
            aria-label="วันที่เกิดเหตุ"
            value={fields.incidentDay}
            onChange={(v) => onChange("incidentDay", v)}
            flex
            minCh={6}
          />
          <T>เวลาประมาณ</T>
          <Dot
            aria-label="เวลาเกิดเหตุ"
            value={fields.incidentTime}
            onChange={(v) => onChange("incidentTime", v)}
            flex
            minCh={5}
          />
          <T>น.</T>
        </Row>
        <div style={{ width: "100%", margin: "0 0 1.5mm" }}>
          <ChargeWrap value={fields.charge} onChange={(v) => onChange("charge", v)} />
          <p style={{ margin: "0.4mm 0 0", fontSize: BODY, lineHeight: 1.5, textAlign: "justify" }}>
            ” และได้แจ้งสิทธิของผู้ต้องหาให้ทราบว่า ผู้ต้องหามีสิทธิที่จะให้การหรือไม่ก็ได้ ถ้าผู้ต้องหาให้การถ้อยคำที่ผู้ต้องหาให้การนั้นอาจใช้เป็นพยานหลักฐานในการพิจารณาคดีได้ และผู้ต้องหามีสิทธิให้ทนายความหรือผู้ซึ่งตนไว้วางใจเข้าฟังการสอบปากคำตนได้
          </p>
        </div>
        <div style={{ flex: 1, minHeight: "48mm", display: "flex", flexDirection: "column" }}>
          <StatementQaEditor
            ariaLabel="ถาม–ตอบ ฟ้องวาจา หน้า 1"
            minHeight="48mm"
            fill
            value={qaPages[0] ?? ""}
            onChange={(t) => setQaPage(0, t)}
            onOverflow={(moved) => overflowQa(0, moved)}
            emptyKind="ask"
            lineHeight={STMT_LINE}
            fontSize={BODY}
            footer={qaPages.length === 1 ? signOff : undefined}
          />
        </div>
      </Sheet>

      {qaPages.slice(1).map((text, offset) => {
        const pageIdx = offset + 1;
        const isLast = pageIdx === qaPages.length - 1;
        return (
          <Sheet key={`oral-qa-${pageIdx}`} index={pageIdx}>
            <p style={{ margin: "0 0 3mm", textAlign: "center", fontSize: BODY, flexShrink: 0 }}>
              ({thaiPageNo(pageIdx + 1)})
            </p>
            <div style={{ flex: 1, minHeight: "80mm", display: "flex", flexDirection: "column" }}>
              <StatementQaEditor
                ariaLabel={`ถาม–ตอบ ฟ้องวาจา หน้า ${pageIdx + 1}`}
                minHeight="80mm"
                fill
                value={text}
                onChange={(t) => setQaPage(pageIdx, t)}
                onOverflow={(moved) => overflowQa(pageIdx, moved)}
                continuesKind={continuesBefore(pageIdx)}
                emptyKind="ask"
                lineHeight={STMT_LINE}
                fontSize={BODY}
                footer={isLast ? signOff : undefined}
              />
            </div>
          </Sheet>
        );
      })}
    </div>
  );
}
