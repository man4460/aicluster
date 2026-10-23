"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { BAIL_BOND_FORM_TITLE, BAIL_BOND_FORM_TITLE_P2_APPOINT, BAIL_BOND_FORM_TITLE_P2_ASSET } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  packBailBondPages,
  type BailBondAppointRow,
  type BailBondAssetRow,
  type BailBondFields,
  type BailBondFlowKey,
  type BailBondPageSlice,
} from "@/lib/smart-police/form-templates/bail-bond";
import { estimateArrestWrappedLines as estimateLines } from "@/lib/smart-police/form-templates/arrest-record";
import { thaiNumeral } from "@/lib/smart-police/form-templates/property-list";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "15pt";
const TITLE = "18pt";
const LINE = "7.2mm";
const RULE = "0.75pt solid #111";
const ROW_H = "7.8mm";

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
        gap: "0 1.4mm",
        minHeight: LINE,
        margin: "0 0 0.25mm",
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

function SignLine({
  role,
  value,
  onChange,
}: {
  role: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ width: "62%", marginLeft: "auto", flexShrink: 0 }}>
      <Row style={{ flexWrap: "wrap", marginBottom: "0.2mm" }}>
        <T>ลงชื่อ</T>
        <Dot aria-label={`ลงชื่อ${role}`} value={value} onChange={onChange} flex minCh={8} />
        <T>{role}</T>
      </Row>
    </div>
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
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const [indentPx, setIndentPx] = useState(0);

  useLayoutEffect(() => {
    if (!showLabel || !labelRef.current) {
      setIndentPx(0);
      return;
    }
    const parent = labelRef.current.parentElement;
    const labelW = labelRef.current.getBoundingClientRect().width;
    const max = parent ? Math.max(48, parent.clientWidth - 48) : labelW + 8;
    setIndentPx(Math.ceil(Math.min(labelW + 8, max)));
  }, [showLabel, label]);

  const indent = showLabel
    ? indentPx > 0
      ? `${indentPx}px`
      : `calc(${label.length + 1}ch + 1.5mm)`
    : "0";

  return (
    <div
      style={{
        position: "relative",
        margin: "0 0 0.3mm",
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
          ref={labelRef}
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
            whiteSpace: "nowrap",
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

function Cell({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  return (
    <input
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className="sp-word-field"
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        border: "none",
        borderBottom: "none",
        padding: "0 0.8mm",
        fontSize: BODY,
        background: "transparent",
      }}
    />
  );
}

function AppointTable({
  rows,
  offset,
  onRow,
}: {
  rows: BailBondAppointRow[];
  offset: number;
  onRow: (i: number, patch: Partial<BailBondAppointRow>) => void;
}) {
  const cols = "16mm 32mm 22mm minmax(0,1fr) 44mm";
  return (
    <div style={{ border: RULE, flexShrink: 0 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: cols,
          borderBottom: RULE,
          minHeight: "16mm",
          fontWeight: 700,
          fontSize: BODY,
          textAlign: "center",
        }}
      >
        <div style={{ borderRight: RULE, display: "flex", alignItems: "center", justifyContent: "center" }}>ครั้งที่</div>
        <div style={{ borderRight: RULE, display: "flex", alignItems: "center", justifyContent: "center" }}>วัน เดือน ปี</div>
        <div style={{ borderRight: RULE, display: "flex", alignItems: "center", justifyContent: "center" }}>เวลา</div>
        <div style={{ borderRight: RULE, display: "flex", alignItems: "center", justifyContent: "center" }}>สถานที่ส่งตัว</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1.2, padding: "0.5mm" }}>
          ลายมือชื่อผู้ประกัน
          <br />
          ทราบวันนัด
        </div>
      </div>
      {rows.map((row, i) => (
        <div
          key={`ap-${offset}-${i}`}
          style={{
            display: "grid",
            gridTemplateColumns: cols,
            height: ROW_H,
            borderBottom: i === rows.length - 1 ? "none" : "0.5pt solid #111",
          }}
        >
          <div style={{ borderRight: RULE, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {thaiNumeral(offset + i + 1)}
          </div>
          <div style={{ borderRight: RULE }}>
            <Cell ariaLabel={`วันนัดครั้งที่ ${offset + i + 1}`} value={row.date} onChange={(v) => onRow(i, { date: v })} />
          </div>
          <div style={{ borderRight: RULE }}>
            <Cell ariaLabel={`เวลานัดครั้งที่ ${offset + i + 1}`} value={row.time} onChange={(v) => onRow(i, { time: v })} />
          </div>
          <div style={{ borderRight: RULE }}>
            <Cell ariaLabel={`สถานที่ส่งตัวครั้งที่ ${offset + i + 1}`} value={row.place} onChange={(v) => onRow(i, { place: v })} />
          </div>
          <div>
            <Cell ariaLabel={`ลายมือชื่อผู้ประกันครั้งที่ ${offset + i + 1}`} value={row.sign} onChange={(v) => onRow(i, { sign: v })} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AssetTable({
  rows,
  offset,
  onRow,
}: {
  rows: BailBondAssetRow[];
  offset: number;
  onRow: (i: number, patch: Partial<BailBondAssetRow>) => void;
}) {
  const cols = "14mm minmax(0,1fr) 22mm 18mm 16mm 18mm 16mm 26mm";
  const headCell: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRight: RULE,
    fontWeight: 700,
    fontSize: BODY,
    textAlign: "center",
  };
  return (
    <div style={{ border: RULE, flexShrink: 0 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: cols,
          gridTemplateRows: "8mm 8mm",
          borderBottom: RULE,
        }}
      >
        <div style={{ ...headCell, gridRow: "1 / 3" }}>ลำดับ</div>
        <div style={{ ...headCell, gridRow: "1 / 3" }}>รายการทรัพย์สิน</div>
        <div style={{ ...headCell, gridRow: "1 / 3" }}>จำนวน</div>
        <div style={{ ...headCell, gridColumn: "4 / 6", borderBottom: RULE }}>ราคา</div>
        <div style={{ ...headCell, gridColumn: "6 / 8", borderBottom: RULE }}>รวมราคา</div>
        <div style={{ ...headCell, gridRow: "1 / 3", borderRight: "none" }}>หมายเหตุ</div>
        <div style={{ ...headCell, gridColumn: 4, gridRow: 2 }}>บาท</div>
        <div style={{ ...headCell, gridColumn: 5, gridRow: 2 }}>ส.ต.</div>
        <div style={{ ...headCell, gridColumn: 6, gridRow: 2 }}>บาท</div>
        <div style={{ ...headCell, gridColumn: 7, gridRow: 2 }}>ส.ต.</div>
      </div>
      {rows.map((row, i) => (
        <div
          key={`as-${offset}-${i}`}
          style={{
            display: "grid",
            gridTemplateColumns: cols,
            height: ROW_H,
            borderBottom: i === rows.length - 1 ? "none" : "0.5pt solid #111",
          }}
        >
          <div style={{ borderRight: RULE, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {thaiNumeral(offset + i + 1)}
          </div>
          <div style={{ borderRight: RULE }}>
            <Cell ariaLabel={`รายการทรัพย์สิน ${offset + i + 1}`} value={row.item} onChange={(v) => onRow(i, { item: v })} />
          </div>
          <div style={{ borderRight: RULE }}>
            <Cell ariaLabel={`จำนวน ${offset + i + 1}`} value={row.qty} onChange={(v) => onRow(i, { qty: v })} />
          </div>
          <div style={{ borderRight: RULE }}>
            <Cell ariaLabel={`ราคาบาท ${offset + i + 1}`} value={row.baht} onChange={(v) => onRow(i, { baht: v })} />
          </div>
          <div style={{ borderRight: RULE }}>
            <Cell ariaLabel={`ราคาสตางค์ ${offset + i + 1}`} value={row.satang} onChange={(v) => onRow(i, { satang: v })} />
          </div>
          <div style={{ borderRight: RULE }}>
            <Cell ariaLabel={`รวมราคาบาท ${offset + i + 1}`} value={row.totalBaht} onChange={(v) => onRow(i, { totalBaht: v })} />
          </div>
          <div style={{ borderRight: RULE }}>
            <Cell ariaLabel={`รวมราคาสตางค์ ${offset + i + 1}`} value={row.totalSatang} onChange={(v) => onRow(i, { totalSatang: v })} />
          </div>
          <div>
            <Cell ariaLabel={`หมายเหตุทรัพย์สิน ${offset + i + 1}`} value={row.note} onChange={(v) => onRow(i, { note: v })} />
          </div>
        </div>
      ))}
    </div>
  );
}

function measureHostLines(host: HTMLDivElement, text: string, indentCh: number): number {
  if (!text) return 0;
  host.style.textIndent = indentCh > 0 ? `${indentCh}ch` : "0";
  host.textContent = text;
  const linePx = parseFloat(getComputedStyle(host).lineHeight);
  if (!Number.isFinite(linePx) || linePx <= 0) return estimateLines(text, indentCh);
  return Math.max(1, Math.round(host.scrollHeight / linePx));
}

export function OfficialBailBondDocument({
  fields,
  onChange,
  onPageCount,
}: {
  fields: BailBondFields;
  onChange: <K extends keyof BailBondFields>(key: K, value: BailBondFields[K]) => void;
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

  const pages = useMemo(() => packBailBondPages(fields, countLines), [fields, countLines]);

  useLayoutEffect(() => {
    onPageCount?.(pages.length);
  }, [onPageCount, pages.length]);

  function patchFlow(key: BailBondFlowKey, sliceIndex: number, text: string) {
    const slices: BailBondPageSlice[] = [];
    for (const p of pages) {
      slices.push(
        ...p.petitionCharge.filter((b) => b.key === key),
        ...p.q1Answer.filter((b) => b.key === key),
        ...p.q2Answer.filter((b) => b.key === key),
        ...p.clause1Charge.filter((b) => b.key === key),
        ...p.clause3Given.filter((b) => b.key === key),
      );
    }
    onChange(key, slices.map((s, i) => (i === sliceIndex ? text : s.text)).join(""));
  }

  function patchAppoint(offset: number, i: number, patch: Partial<BailBondAppointRow>) {
    const next = fields.appointRows.map((row, idx) => (idx === offset + i ? { ...row, ...patch } : row));
    onChange("appointRows", next);
  }

  function patchAsset(offset: number, i: number, patch: Partial<BailBondAssetRow>) {
    const next = fields.assetRows.map((row, idx) => (idx === offset + i ? { ...row, ...patch } : row));
    onChange("assetRows", next);
  }

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      {pages.map((page) => (
        <article
          key={`bb-${page.index}`}
          data-sheet-index={page.index}
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
          {page.showPageNo ? (
            <p style={{ margin: "0 0 2mm", textAlign: "center", fontSize: BODY, flexShrink: 0 }}>
              ({thaiNumeral(page.index + 1)})
            </p>
          ) : null}

          {page.kind === "petition" ? (
            <>
              {page.showHeader ? (
                <>
                <header style={{ textAlign: "center", marginBottom: "1.5mm", flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/smart-police/garuda.png"
                    alt=""
                    width={84}
                    height={96}
                    style={{ display: "block", margin: "0 auto 1mm", height: "15mm", width: "auto" }}
                  />
                  <h1 style={{ margin: 0, fontSize: TITLE, fontWeight: 700, lineHeight: 1.2 }}>
                    {BAIL_BOND_FORM_TITLE}
                  </h1>
                </header>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    columnGap: "1.5mm",
                    width: "100%",
                    marginBottom: "1.2mm",
                    fontSize: BODY,
                    flexShrink: 0,
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
                      <T>สถานีตำรวจ</T>
                      <Dot
                        aria-label="สถานีตำรวจ"
                        value={fields.station}
                        onChange={(v) => onChange("station", v)}
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
                </>
              ) : null}

              {page.showName ? (
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>ตัว</T>
                  <T>ข้าพเจ้า</T>
                  <Dot
                    aria-label="ชื่อผู้ยื่นคำร้อง"
                    value={fields.petitioner}
                    onChange={(v) => onChange("petitioner", v)}
                    flex
                    minCh={10}
                  />
                  <T>อายุ</T>
                  <Dot
                    aria-label="อายุผู้ยื่นคำร้อง"
                    value={fields.petitionerAge}
                    onChange={(v) => onChange("petitionerAge", v)}
                    minCh={3}
                  />
                  <T>ปี ขอประกันตัว</T>
                </Row>
              ) : null}

              {page.petitionCharge.map((slice) => (
                <FieldLines
                  key={`pc-${slice.sliceIndex}`}
                  label={slice.label}
                  showLabel={slice.showLabel}
                  value={slice.text}
                  lines={slice.lines}
                  ariaLabel="ต้องหาว่า คำร้อง"
                  onChange={(v) => patchFlow("petitionCharge", slice.sliceIndex, v)}
                />
              ))}

              {page.showAfterCharge ? (
                <>
                  <Row>
                    <T>โดยข้าพเจ้ามีหลักทรัพย์ตามบัญชีท้ายสัญญานี้</T>
                  </Row>
                  <SignLine
                    role="ผู้ยื่นคำร้อง"
                    value={fields.signPetitioner}
                    onChange={(v) => onChange("signPetitioner", v)}
                  />
                </>
              ) : null}

              {page.showQuestIntro ? (
                <p style={{ margin: "1mm 0 0.4mm", textAlign: "justify", flexShrink: 0 }}>
                  กรณีการใช้บุคคลเป็นประกันหรือหลักประกัน พนักงานสอบสวนได้สอบถามนายประกันแล้วว่า
                </p>
              ) : null}
              {page.showQ1Label ? (
                <p style={{ margin: "0 0 0.2mm", flexShrink: 0 }}>๑. มีสถานภาพจะใช้สิทธิ์ ได้หรือไม่</p>
              ) : null}
              {page.q1Answer.map((slice) => (
                <FieldLines
                  key={`q1-${slice.sliceIndex}`}
                  label={slice.label}
                  showLabel={slice.showLabel}
                  value={slice.text}
                  lines={slice.lines}
                  ariaLabel="ตอบข้อ ๑"
                  onChange={(v) => patchFlow("q1Answer", slice.sliceIndex, v)}
                />
              ))}
              {page.showQ2Label ? (
                <p style={{ margin: "0.3mm 0 0.2mm", flexShrink: 0 }}>
                  ๒. ขณะทำสัญญาประกันอยู่ในระหว่างประกันตัวบุคคลใดหรือไม่ วงเงินเท่าใด
                </p>
              ) : null}
              {page.q2Answer.map((slice) => (
                <FieldLines
                  key={`q2-${slice.sliceIndex}`}
                  label={slice.label}
                  showLabel={slice.showLabel}
                  value={slice.text}
                  lines={slice.lines}
                  ariaLabel="ตอบข้อ ๒"
                  onChange={(v) => patchFlow("q2Answer", slice.sliceIndex, v)}
                />
              ))}

              {page.showPetitionClose ? (
                <>
                  <p style={{ margin: "0.6mm 0 0.8mm", textAlign: "justify", flexShrink: 0 }}>
                    ได้แจ้งนายประกันทราบแล้วว่า ถ้าไม่เป็นจริงตามนี้จะต้องถูกดำเนินคดีข้อหาแจ้งความเท็จ
                  </p>
                  <SignLine
                    role="นายประกัน"
                    value={fields.signSuretyAsk}
                    onChange={(v) => onChange("signSuretyAsk", v)}
                  />
                  <SignLine
                    role="พนักงานสอบสวน"
                    value={fields.signInquiryAsk}
                    onChange={(v) => onChange("signInquiryAsk", v)}
                  />
                </>
              ) : null}

              {page.showSuretyOpen ? (
                <>
                  <h2
                    style={{
                      margin: "1.4mm 0 1mm",
                      textAlign: "center",
                      fontSize: "18pt",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    สัญญาประกัน
                  </h2>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      columnGap: "1.5mm",
                      width: "100%",
                      marginBottom: "1mm",
                      fontSize: BODY,
                      flexShrink: 0,
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
                        <T>เขียนที่</T>
                        <Dot
                          aria-label="เขียนที่"
                          value={fields.writtenAt}
                          onChange={(v) => onChange("writtenAt", v)}
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
                        <Dot
                          aria-label="วันที่สัญญา"
                          value={fields.suretyDay}
                          onChange={(v) => onChange("suretyDay", v)}
                          flex
                          minCh={3}
                        />
                        <T>เดือน</T>
                        <Dot
                          aria-label="เดือนสัญญา"
                          value={fields.suretyMonth}
                          onChange={(v) => onChange("suretyMonth", v)}
                          flex
                          minCh={4}
                        />
                        <T>พ.ศ.</T>
                        <Dot
                          aria-label="พ.ศ. สัญญา"
                          value={fields.suretyYear}
                          onChange={(v) => onChange("suretyYear", v)}
                          flex
                          minCh={4}
                        />
                      </div>
                    </div>
                  </div>
                  <Row>
                    <T>ข้าพเจ้า</T>
                    <Dot
                      aria-label="ชื่อนายประกัน"
                      value={fields.suretyName}
                      onChange={(v) => onChange("suretyName", v)}
                      flex
                      minCh={10}
                    />
                    <T>อายุ</T>
                    <Dot aria-label="อายุนายประกัน" value={fields.suretyAge} onChange={(v) => onChange("suretyAge", v)} minCh={3} />
                    <T>ปี เชื้อชาติ</T>
                    <Dot aria-label="เชื้อชาติ" value={fields.race} onChange={(v) => onChange("race", v)} flex minCh={6} />
                  </Row>
                  <Row>
                    <T>สัญชาติ</T>
                    <Dot
                      aria-label="สัญชาติ"
                      value={fields.nationality}
                      onChange={(v) => onChange("nationality", v)}
                      minCh={6}
                    />
                    <T>อยู่บ้านเลขที่</T>
                    <Dot aria-label="บ้านเลขที่" value={fields.houseNo} onChange={(v) => onChange("houseNo", v)} minCh={5} />
                    <T>ตำบล/แขวง</T>
                    <Dot
                      aria-label="ตำบลหรือแขวง"
                      value={fields.subdistrict}
                      onChange={(v) => onChange("subdistrict", v)}
                      flex
                      minCh={6}
                    />
                  </Row>
                  <Row>
                    <T>อำเภอ/เขต</T>
                    <Dot aria-label="อำเภอหรือเขต" value={fields.district} onChange={(v) => onChange("district", v)} minCh={7} />
                    <T>จังหวัด</T>
                    <Dot aria-label="จังหวัด" value={fields.province} onChange={(v) => onChange("province", v)} minCh={7} />
                    <T>ทำสัญญาประกันให้ไว้แก่พนักงานสอบสวน (สถานี)</T>
                    <Dot
                      aria-label="สถานีที่ทำสัญญา"
                      value={fields.suretyStation}
                      onChange={(v) => onChange("suretyStation", v)}
                      flex
                      minCh={6}
                    />
                    <T>มีข้อความดังต่อไปนี้</T>
                  </Row>
                  <Row>
                    <T>ข้อ  ๑.  ข้าพเจ้าได้ประกันตัว</T>
                    <Dot
                      aria-label="ผู้ต้องหาที่ประกัน"
                      value={fields.clause1Suspect}
                      onChange={(v) => onChange("clause1Suspect", v)}
                      flex
                      minCh={10}
                    />
                  </Row>
                </>
              ) : null}

              {page.clause1Charge.map((slice) => (
                <FieldLines
                  key={`c1-${slice.sliceIndex}`}
                  label={slice.label}
                  showLabel={slice.showLabel}
                  value={slice.text}
                  lines={slice.lines}
                  ariaLabel="ต้องหาว่า ข้อ ๑"
                  onChange={(v) => patchFlow("clause1Charge", slice.sliceIndex, v)}
                />
              ))}

              {page.showClause2 ? (
                <>
                  <p style={{ margin: "0.3mm 0 0.5mm", textAlign: "justify", flexShrink: 0 }}>
                    ไปจากความควบคุมของเจ้าพนักงานตำรวจ และสัญญาว่าจะส่งตัวผู้ต้องหาให้ตามกำหนดนัดของเจ้าพนักงาน
                  </p>
                  <Row>
                    <T>ข้อ  ๒.  ถ้าข้าพเจ้าผิดสัญญาข้อ ๑. ข้าพเจ้ายินยอมใช้เงิน (ตัวเลข)</T>
                    <Dot
                      aria-label="จำนวนเงินตัวเลข"
                      value={fields.amountNumber}
                      onChange={(v) => onChange("amountNumber", v)}
                      flex
                      minCh={8}
                    />
                    <T>บาท</T>
                  </Row>
                  <Row>
                    <T>(ตัวอักษร)</T>
                    <Dot
                      aria-label="จำนวนเงินตัวอักษร"
                      value={fields.amountText}
                      onChange={(v) => onChange("amountText", v)}
                      flex
                      minCh={10}
                    />
                    <T>นับแต่วันที่ผิดนัดส่งตัวผู้ต้องหา</T>
                  </Row>
                </>
              ) : null}

              {page.clause3Given.map((slice) => (
                <FieldLines
                  key={`c3-${slice.sliceIndex}`}
                  label={slice.label}
                  showLabel={slice.showLabel}
                  value={slice.text}
                  lines={slice.lines}
                  ariaLabel="หลักทรัพย์ข้อ ๓"
                  onChange={(v) => patchFlow("clause3Given", slice.sliceIndex, v)}
                />
              ))}

              {page.showSuretyClose ? (
                <>
                  <p style={{ margin: "0.3mm 0 0.2mm", flexShrink: 0 }}>ให้พนักงานไว้เป็นหลักฐาน และรับรองว่า</p>
                  <p style={{ margin: "0 0 0.2mm", textAlign: "justify", flexShrink: 0 }}>
                    ทรัพย์สินเหล่านี้เป็นกรรมสิทธิ์ของข้าพเจ้าแต่ผู้เดียว และไม่อยู่ในภาระติดพันใด ๆ
                  </p>
                  <p style={{ margin: "0 0 1mm", textAlign: "center", flexShrink: 0 }}>
                    ข้าพเจ้าเข้าใจข้อความในสัญญานี้ดีตลอดแล้ว
                  </p>
                  <SignLine role="ผู้ประกัน" value={fields.signSurety} onChange={(v) => onChange("signSurety", v)} />
                  <SignLine role="ผู้รับสัญญา" value={fields.signReceiver} onChange={(v) => onChange("signReceiver", v)} />
                  <SignLine role="พยาน" value={fields.signWitness1} onChange={(v) => onChange("signWitness1", v)} />
                  <SignLine
                    role="พยาน/ผู้เขียน"
                    value={fields.signWitness2}
                    onChange={(v) => onChange("signWitness2", v)}
                  />
                </>
              ) : null}
            </>
          ) : (
            <>
              {page.appointRows.length ? (
                <>
                  <h2
                    style={{
                      margin: "0 0 2mm",
                      textAlign: "center",
                      fontSize: "18pt",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {BAIL_BOND_FORM_TITLE_P2_APPOINT}
                  </h2>
                  <AppointTable
                    rows={page.appointRows}
                    offset={page.appointOffset}
                    onRow={(i, patch) => patchAppoint(page.appointOffset, i, patch)}
                  />
                </>
              ) : null}
              {page.showAsset ? (
                <>
                  <h2
                    style={{
                      margin: "5mm 0 2mm",
                      textAlign: "center",
                      fontSize: BODY,
                      fontWeight: 700,
                      lineHeight: 1.35,
                      flexShrink: 0,
                    }}
                  >
                    {BAIL_BOND_FORM_TITLE_P2_ASSET}
                  </h2>
                  <AssetTable
                    rows={page.assetRows}
                    offset={page.assetOffset}
                    onRow={(i, patch) => patchAsset(page.assetOffset, i, patch)}
                  />
                </>
              ) : null}
              {page.showAssetSign ? (
                <div style={{ marginTop: "3mm" }}>
                  <SignLine role="ผู้ประกัน" value={fields.signAsset} onChange={(v) => onChange("signAsset", v)} />
                </div>
              ) : null}
            </>
          )}
        </article>
      ))}
    </div>
  );
}
