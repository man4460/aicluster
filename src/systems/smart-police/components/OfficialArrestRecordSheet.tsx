"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ARREST_RECORD_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  ARREST_SIGN_MIN,
  addArrestSignSlot,
  estimateArrestWrappedLines,
  packArrestRecordPages,
  removeLastArrestSignSlot,
  type ArrestFlowFieldKey,
  type ArrestPageBodySlice,
  type ArrestRecordFields,
} from "@/lib/smart-police/form-templates/arrest-record";
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

function LinedNotes({
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
        margin: "0 0 1mm",
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
        }}
      />
    </div>
  );
}

function SignName({
  role,
  value,
  onChange,
  index,
}: {
  role: string;
  value: string;
  onChange: (v: string) => void;
  index: number;
}) {
  return (
    <Row style={{ flexWrap: "wrap", marginBottom: 0, minHeight: SIGN_LINE, lineHeight: SIGN_LINE }}>
      <span style={{ flexShrink: 0 }}>ลงชื่อ</span>
      <Dot aria-label={`ลงชื่อ${role} คนที่ ${index + 1}`} value={value} onChange={onChange} flex minCh={6} />
      <span style={{ flexShrink: 0 }}>{role}</span>
    </Row>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconMinus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function SignGroupTools({
  addAria,
  removeAria,
  onAdd,
  onRemove,
  canRemove,
}: {
  addAria: string;
  removeAria: string;
  onAdd: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-px print:hidden" style={{ margin: "0 0 0.8mm" }}>
      <button
        type="button"
        aria-label={addAria}
        title={addAria}
        className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-[#4d47b6] hover:bg-slate-100"
        onClick={onAdd}
      >
        <IconPlus className="h-2.5 w-2.5" />
      </button>
      {canRemove ? (
        <button
          type="button"
          aria-label={removeAria}
          title={removeAria}
          className="inline-flex h-4 w-4 items-center justify-center rounded-sm text-rose-500 hover:bg-rose-50"
          onClick={onRemove}
        >
          <IconMinus className="h-2.5 w-2.5" />
        </button>
      ) : null}
    </div>
  );
}

function measureHostLines(host: HTMLDivElement, text: string, indentCh: number): number {
  if (!text) return 0;
  host.style.textIndent = indentCh > 0 ? `calc(${indentCh}ch + 1.5mm)` : "0";
  host.textContent = text;
  const linePx = parseFloat(getComputedStyle(host).lineHeight);
  if (!Number.isFinite(linePx) || linePx <= 0) return estimateArrestWrappedLines(text, indentCh);
  return Math.max(1, Math.round(host.scrollHeight / linePx));
}

export function OfficialArrestRecordDocument({
  fields,
  onChange,
  onPageCount,
}: {
  fields: ArrestRecordFields;
  onChange: <K extends keyof ArrestRecordFields>(key: K, value: ArrestRecordFields[K]) => void;
  onPageCount?: (n: number) => void;
}) {
  const arrestees = fields.signArrestees;
  const officers = fields.signOfficers;
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

  const countLines = useCallback((text: string, indentCh: number) => {
    const host = hostRef.current;
    if (!host) return estimateArrestWrappedLines(text, indentCh);
    return measureHostLines(host, text, indentCh);
  }, [measureReady]);

  const pages = useMemo(() => packArrestRecordPages(fields, countLines), [fields, countLines]);

  useLayoutEffect(() => {
    onPageCount?.(pages.length);
  }, [onPageCount, pages.length]);

  function patchArrestee(i: number, v: string) {
    onChange(
      "signArrestees",
      arrestees.map((s, idx) => (idx === i ? v : s)),
    );
  }

  function patchOfficer(i: number, v: string) {
    onChange(
      "signOfficers",
      officers.map((s, idx) => (idx === i ? v : s)),
    );
  }

  function patchFlow(key: ArrestFlowFieldKey, sliceIndex: number, text: string) {
    const slices: ArrestPageBodySlice[] = [];
    for (const p of pages) {
      slices.push(...p.body.filter((b) => b.key === key));
      if (p.statement?.key === key) slices.push(p.statement);
    }
    const next = slices.map((s, i) => (i === sliceIndex ? text : s.text)).join("");
    onChange(key, next);
  }

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      {pages.map((page) => (
        <Sheet key={`ar-${page.index}`} index={page.index}>
          {page.showHeader ? (
            <>
        <div style={{ width: "58%", marginLeft: "auto", flexShrink: 0, marginBottom: "2mm" }}>
          <Row style={{ flexWrap: "nowrap" }}>
            <T>ป.จ.ว. ข้อ</T>
            <Dot
              aria-label="ป.จ.ว. ข้อ"
              value={fields.dailyLogItem}
              onChange={(v) => onChange("dailyLogItem", v)}
              flex
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
          </Row>
          <Row style={{ flexWrap: "nowrap" }}>
            <T>คดีอาญาที่</T>
            <Dot
              aria-label="คดีอาญาที่"
              value={fields.criminalCaseNo}
              onChange={(v) => onChange("criminalCaseNo", v)}
              flex
              minCh={8}
            />
          </Row>
          <Row style={{ flexWrap: "nowrap" }}>
            <T>บัญชีของกลางลำดับที่</T>
            <Dot
              aria-label="บัญชีของกลางลำดับที่"
              value={fields.exhibitAccountNo}
              onChange={(v) => onChange("exhibitAccountNo", v)}
              flex
              minCh={8}
            />
          </Row>
        </div>

        <header style={{ textAlign: "center", marginBottom: "3mm", flexShrink: 0 }}>
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
            {ARREST_RECORD_FORM_TITLE}
          </h1>
        </header>

        <div style={{ flexShrink: 0 }}>
          <Row style={{ flexWrap: "nowrap" }}>
            <T>สถานที่ทำการบันทึก</T>
            <Dot
              aria-label="สถานที่ทำการบันทึก"
              value={fields.recordPlace}
              onChange={(v) => onChange("recordPlace", v)}
              flex
              minCh={8}
            />
          </Row>
          <Row style={{ flexWrap: "nowrap" }}>
            <T>วัน/เดือน/ปี ที่บันทึก</T>
            <Dot
              aria-label="วันเดือนปีที่บันทึก"
              value={fields.recordDate}
              onChange={(v) => onChange("recordDate", v)}
              flex
              minCh={10}
            />
          </Row>
          <Row style={{ flexWrap: "nowrap" }}>
            <T>วัน/เดือน/ปี ที่จับกุม</T>
            <Dot
              aria-label="วันเดือนปีที่จับกุม"
              value={fields.arrestDate}
              onChange={(v) => onChange("arrestDate", v)}
              flex
              minCh={10}
            />
          </Row>
          <Row style={{ flexWrap: "nowrap" }}>
            <T>สถานที่จับกุม ที่</T>
            <Dot
              aria-label="สถานที่จับกุม"
              value={fields.arrestPlace}
              onChange={(v) => onChange("arrestPlace", v)}
              flex
              minCh={8}
            />
          </Row>
          <Row style={{ flexWrap: "nowrap" }}>
            <T>ตำบล/แขวง</T>
            <Dot
              aria-label="ตำบลหรือแขวงที่จับกุม"
              value={fields.arrestTambon}
              onChange={(v) => onChange("arrestTambon", v)}
              flex
              minCh={5}
            />
            <T>อำเภอ/เขต</T>
            <Dot
              aria-label="อำเภอหรือเขตที่จับกุม"
              value={fields.arrestAmphoe}
              onChange={(v) => onChange("arrestAmphoe", v)}
              flex
              minCh={5}
            />
            <T>จังหวัด</T>
            <Dot
              aria-label="จังหวัดที่จับกุม"
              value={fields.arrestProvince}
              onChange={(v) => onChange("arrestProvince", v)}
              flex
              minCh={5}
            />
          </Row>
        </div>
            </>
          ) : null}

          {page.showPageNo ? (
            <p
              style={{
                margin: "0 0 5mm",
                textAlign: "center",
                fontSize: BODY,
                flexShrink: 0,
              }}
            >
              {thaiNumeral(page.index + 1)}
            </p>
          ) : null}

          {page.body.map((slice) => (
            <FieldLines
              key={`${slice.key}-${slice.sliceIndex}`}
              label={slice.label}
              value={slice.text}
              onChange={(v) => patchFlow(slice.key, slice.sliceIndex, v)}
              lines={slice.lines}
              showLabel={slice.showLabel}
              ariaLabel={slice.showLabel ? slice.label : `${slice.label} (ต่อ)`}
            />
          ))}

          {page.showRights13 ? (
            <>
        <p style={{ margin: "1.5mm 0 1mm", lineHeight: LINE, fontSize: BODY, flexShrink: 0 }}>
          พร้อมทั้งแจ้งให้ผู้ถูกจับทราบถึงสิทธิว่า
        </p>
        <div
          style={{
            flexShrink: 0,
            fontSize: BODY,
            lineHeight: 1.45,
            textAlign: "justify",
          }}
        >
          <p style={{ margin: "0 0 0.8mm" }}>๑. ผู้ถูกจับมีสิทธิที่จะให้การหรือไม่ก็ได้</p>
          <p style={{ margin: "0 0 0.8mm" }}>
            ๒. ถ้อยคำของผู้ถูกจับนี้อาจใช้เป็นพยานหลักฐานในการพิจารณาคดีได้
          </p>
          <p style={{ margin: 0 }}>๓. ผู้ถูกจับมีสิทธิจะพบและปรึกษาทนายหรือผู้ซึ่งจะเป็นทนายความ</p>
        </div>
            </>
          ) : null}

          {page.showRights4 ? (
        <p
          style={{
            margin: "0 0 2mm",
            textAlign: "justify",
            fontSize: BODY,
            lineHeight: 1.5,
            flexShrink: 0,
          }}
        >
          ๔. ถ้าผู้ถูกจับประสงค์จะแจ้งให้ญาติ หรือผู้ซึ่งตนไว้วางใจทราบถึงการจับกุมที่สามารถดำเนินการได้
          โดยสะดวกและไม่เป็นการขัดขวางการจับหรือการควบคุมผู้ถูกจับ หรือทำให้เกิดความไม่ปลอดภัยแก่บุคคลหนึ่ง
          บุคคลใด เจ้าพนักงานสามารถอนุญาตให้ผู้ถูกจับดำเนินการได้ตามสมควรแก่กรณี
        </p>
          ) : null}

          {page.showStatementLead ? (
        <p
          style={{
            margin: "0 0 0.5mm",
            textAlign: "justify",
            fontSize: BODY,
            lineHeight: LINE,
            flexShrink: 0,
          }}
        >
          ขณะจับกุมผู้ถูกจับรับทราบข้อกล่าวหาและสิทธิ ของผู้ถูกจับดังกล่าวข้างต้นแล้วและให้การ
        </p>
          ) : null}

          {page.statement ? (
        <LinedNotes
          value={page.statement.text}
          onChange={(v) => patchFlow("statement", page.statement!.sliceIndex, v)}
          lines={page.statement.lines}
          ariaLabel="คำให้การขณะจับกุม"
        />
          ) : null}

          {page.showIncidentCert ? (
            <>
        <Row style={{ flexWrap: "nowrap" }}>
          <T>เหตุเกิดที่</T>
          <Dot
            aria-label="เหตุเกิดที่"
            value={fields.incidentPlace}
            onChange={(v) => onChange("incidentPlace", v)}
            flex
            minCh={8}
          />
        </Row>
        <Row style={{ flexWrap: "nowrap", marginBottom: "2mm" }}>
          <T>เมื่อวันที่</T>
          <Dot
            aria-label="วันที่เกิดเหตุ"
            value={fields.incidentDate}
            onChange={(v) => onChange("incidentDate", v)}
            flex
            minCh={10}
          />
        </Row>

        <p
          style={{
            margin: "0 0 1.5mm",
            textAlign: "justify",
            fontSize: BODY,
            lineHeight: 1.5,
            flexShrink: 0,
          }}
        >
          อนึ่งในการจับกุมครั้งนี้ เจ้าพนักงานตำรวจผู้จับ มิได้ทำให้ทรัพย์สินของผู้ใดเสียหาย สูญหาย
          หรือเสื่อมค่าแต่ประการใด และมิได้ทำให้ผู้ใดได้รับอันตรายแก่กาย หรือจิตใจแต่อย่างใด
        </p>
        <p
          style={{
            margin: "0 0 3mm",
            textAlign: "justify",
            fontSize: BODY,
            lineHeight: 1.5,
            flexShrink: 0,
          }}
        >
          ได้อ่านบันทึกนี้ให้ผู้ถูกจับฟังแล้ว รับว่าถูกต้อง จึงให้ลงชื่อไว้เป็นหลักฐาน
        </p>
            </>
          ) : null}

          {page.signArresteeSlice ? (
            <>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: "8mm",
            rowGap: "0.4mm",
            flexShrink: 0,
          }}
        >
          {Array.from({ length: page.signArresteeSlice.count }, (_, n) => {
            const i = page.signArresteeSlice!.start + n;
            return (
            <SignName
              key={`arr-${i}`}
              role="ผู้ถูกจับ"
              index={i}
              value={arrestees[i] ?? ""}
              onChange={(v) => patchArrestee(i, v)}
            />
            );
          })}
        </div>
        {page.signArresteeSlice.start + page.signArresteeSlice.count >= arrestees.length ? (
          <SignGroupTools
            addAria="เพิ่มผู้ถูกจับ"
            removeAria="ลบผู้ถูกจับคนสุดท้าย"
            onAdd={() => onChange("signArrestees", addArrestSignSlot(arrestees))}
            onRemove={() => onChange("signArrestees", removeLastArrestSignSlot(arrestees))}
            canRemove={arrestees.length > ARREST_SIGN_MIN}
          />
        ) : null}
            </>
          ) : null}

          {page.signOfficerSlice ? (
            <>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: "8mm",
            rowGap: "0.4mm",
            marginTop: page.signArresteeSlice ? "2mm" : 0,
            flexShrink: 0,
          }}
        >
          {Array.from({ length: page.signOfficerSlice.count }, (_, n) => {
            const i = page.signOfficerSlice!.start + n;
            return (
            <SignName
              key={`off-${i}`}
              role="ผู้จับกุม"
              index={i}
              value={officers[i] ?? ""}
              onChange={(v) => patchOfficer(i, v)}
            />
            );
          })}
        </div>
        {page.signOfficerSlice.start + page.signOfficerSlice.count >= officers.length ? (
          <SignGroupTools
            addAria="เพิ่มผู้จับกุม"
            removeAria="ลบผู้จับกุมคนสุดท้าย"
            onAdd={() => onChange("signOfficers", addArrestSignSlot(officers))}
            onRemove={() => onChange("signOfficers", removeLastArrestSignSlot(officers))}
            canRemove={officers.length > ARREST_SIGN_MIN}
          />
        ) : null}
            </>
          ) : null}

          {page.showRecorder ? (
        <div style={{ width: "58%", marginLeft: "auto", marginTop: "4mm", flexShrink: 0 }}>
          <Row style={{ flexWrap: "wrap", marginBottom: 0, minHeight: SIGN_LINE, lineHeight: SIGN_LINE }}>
            <span style={{ flexShrink: 0 }}>ลงชื่อ</span>
            <Dot
              aria-label="ลงชื่อผู้จับกุมบันทึกอ่าน"
              value={fields.signRecorder}
              onChange={(v) => onChange("signRecorder", v)}
              flex
              minCh={8}
            />
            <span style={{ flexShrink: 0 }}>ผู้จับกุม/บันทึก/อ่าน</span>
          </Row>
        </div>
          ) : null}
        </Sheet>
      ))}
    </div>
  );
}
