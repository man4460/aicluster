"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  WITNESS_SUMMONS_AUTHORITY,
  WITNESS_SUMMONS_RECEIPT_TEXT,
  WITNESS_SUMMONS_RECEIPT_TAIL,
  WITNESS_SUMMONS_WARNING,
  packWitnessSummonsPages,
  type WitnessSummonsFields,
  type WitnessSummonsFlowKey,
  type WitnessSummonsPageSlice,
} from "@/lib/smart-police/form-templates/witness-summons";
import { estimateArrestWrappedLines as estimateLines } from "@/lib/smart-police/form-templates/arrest-record";
import { thaiNumeral } from "@/lib/smart-police/form-templates/property-list";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "15pt";
const TITLE = "18pt";
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
        flexWrap: "nowrap",
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

function CaseBrace() {
  return (
    <div aria-hidden style={{ width: "4.2mm", height: "100%" }}>
      <svg viewBox="0 0 24 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%", display: "block" }}>
        <path
          d="M20 1 C9 1 7 14 7 25 L7 40 C7 47 3 50 3 50 C3 50 7 53 7 60 L7 75 C7 86 9 99 20 99"
          fill="none"
          stroke="#111"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
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
        padding: "10mm 16mm 12mm",
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
        margin: "0 0 0.4mm",
        height: `calc(${lines} * ${LINE})`,
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      <div aria-hidden>
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} style={{ height: LINE, borderBottom: "0.5pt dotted #111", boxSizing: "border-box" }} />
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

function measureHostLines(host: HTMLDivElement, text: string, indentCh: number): number {
  if (!text) return 0;
  host.style.textIndent = indentCh > 0 ? `calc(${indentCh}ch + 1.5mm)` : "0";
  host.textContent = text;
  const linePx = parseFloat(getComputedStyle(host).lineHeight);
  if (!Number.isFinite(linePx) || linePx <= 0) return estimateLines(text, indentCh);
  return Math.max(1, Math.round(host.scrollHeight / linePx));
}

export function OfficialWitnessSummonsDocument({
  fields,
  onChange,
  onPageCount,
}: {
  fields: WitnessSummonsFields;
  onChange: <K extends keyof WitnessSummonsFields>(key: K, value: WitnessSummonsFields[K]) => void;
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

  const pages = useMemo(() => packWitnessSummonsPages(fields, countLines), [fields, countLines]);

  useLayoutEffect(() => {
    onPageCount?.(pages.length);
  }, [onPageCount, pages.length]);

  function patchFlow(key: WitnessSummonsFlowKey, sliceIndex: number, text: string) {
    const slices: WitnessSummonsPageSlice[] = [];
    for (const p of pages) {
      slices.push(...p.reason.filter((b) => b.key === key), ...p.orderText.filter((b) => b.key === key));
    }
    onChange(key, slices.map((s, i) => (i === sliceIndex ? text : s.text)).join(""));
  }

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      {pages.map((page) => (
        <Sheet key={`ws-${page.index}`} index={page.index}>
          {page.showPageNo ? (
            <p style={{ margin: "0 0 3mm", textAlign: "center", fontSize: BODY, flexShrink: 0 }}>
              -{thaiNumeral(page.index + 1)}-
            </p>
          ) : null}

          {page.showHeader ? (
            <>
              <header style={{ flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/smart-police/garuda.png"
                  alt=""
                  width={96}
                  height={110}
                  style={{ display: "block", height: "24mm", width: "auto", margin: "0 auto" }}
                />
                <p
                  style={{
                    margin: "1mm 0 0",
                    textAlign: "center",
                    fontSize: TITLE,
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  สำนักงานตำรวจแห่งชาติ
                </p>
                <p
                  style={{
                    margin: "1mm 0 2mm",
                    textAlign: "center",
                    fontSize: BODY,
                    fontWeight: 700,
                    textDecoration: "underline",
                    textUnderlineOffset: "1mm",
                    lineHeight: 1.2,
                  }}
                >
                  หมายเรียกพยาน
                </p>
              </header>

              {/* §หัวสถานที่บันทึก — กริด 3 ส่วน ช่องที่ 3 ชิดขวา */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  columnGap: "2mm",
                  rowGap: "0.6mm",
                  flexShrink: 0,
                }}
              >
                <span aria-hidden />
                <span aria-hidden />
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <Row style={{ marginBottom: "0.6mm" }}>
                    <T>สถานที่ออกหมาย</T>
                    <Dot
                      aria-label="สถานที่ออกหมาย"
                      value={fields.issuePlace}
                      onChange={(v) => onChange("issuePlace", v)}
                      flex
                      minCh={6}
                    />
                  </Row>
                  <Row style={{ marginBottom: 0 }}>
                    <T>วันที่</T>
                    <Dot
                      aria-label="วันที่ออกหมาย"
                      value={fields.issueDay}
                      onChange={(v) => onChange("issueDay", v)}
                      minCh={3}
                    />
                    <T>เดือน</T>
                    <Dot
                      aria-label="เดือนที่ออกหมาย"
                      value={fields.issueMonth}
                      onChange={(v) => onChange("issueMonth", v)}
                      minCh={4}
                    />
                    <T>พ.ศ.</T>
                    <Dot
                      aria-label="ปีพุทธศักราชที่ออกหมาย"
                      value={fields.issueYear}
                      onChange={(v) => onChange("issueYear", v)}
                      minCh={4}
                    />
                  </Row>
                </div>
              </div>

              <div style={{ flexShrink: 0 }}>
                <Row>
                  <T>คดีอาญาที่</T>
                  <Dot
                    aria-label="คดีอาญาที่"
                    value={fields.caseNo}
                    onChange={(v) => onChange("caseNo", v)}
                    flex
                    minCh={10}
                  />
                </Row>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto auto 1fr",
                    alignItems: "stretch",
                    columnGap: "2mm",
                    margin: "0.4mm 0 1.6mm",
                    height: "14.5mm",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", paddingTop: "0.4mm" }}>
                    <T>คดีระหว่าง</T>
                  </div>
                  <CaseBrace />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      gap: "3.6mm",
                      minWidth: 0,
                      height: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "2mm",
                        width: "100%",
                        lineHeight: LINE,
                        fontSize: BODY,
                      }}
                    >
                      <Dot
                        aria-label="ผู้กล่าวหา"
                        value={fields.complainant}
                        onChange={(v) => onChange("complainant", v)}
                        flex
                        minCh={10}
                      />
                      <T>ผู้กล่าวหา</T>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "2mm",
                        width: "100%",
                        lineHeight: LINE,
                        fontSize: BODY,
                      }}
                    >
                      <Dot
                        aria-label="ผู้ต้องหา"
                        value={fields.suspect}
                        onChange={(v) => onChange("suspect", v)}
                        flex
                        minCh={10}
                      />
                      <T>ผู้ต้องหา</T>
                    </div>
                  </div>
                </div>

                <Row style={{ marginBottom: "1.2mm" }}>
                  <span style={{ lineHeight: LINE }}>{WITNESS_SUMMONS_AUTHORITY}</span>
                </Row>

                <Row>
                  <T>หมายมายัง</T>
                  <Dot
                    aria-label="หมายมายัง"
                    value={fields.witnessName}
                    onChange={(v) => onChange("witnessName", v)}
                    flex
                    minCh={10}
                  />
                </Row>
                <Row>
                  <T>บ้านเลขที่</T>
                  <Dot
                    aria-label="บ้านเลขที่"
                    value={fields.houseNo}
                    onChange={(v) => onChange("houseNo", v)}
                    minCh={6}
                  />
                  <T>ถนน</T>
                  <Dot aria-label="ถนน" value={fields.road} onChange={(v) => onChange("road", v)} flex minCh={6} />
                  <T>แขวง/ตำบล</T>
                  <Dot
                    aria-label="แขวงหรือตำบล"
                    value={fields.subDistrict}
                    onChange={(v) => onChange("subDistrict", v)}
                    minCh={6}
                  />
                </Row>
                <Row>
                  <T>เขต/อำเภอ</T>
                  <Dot
                    aria-label="เขตหรืออำเภอ"
                    value={fields.district}
                    onChange={(v) => onChange("district", v)}
                    minCh={6}
                  />
                  <T>จังหวัด</T>
                  <Dot
                    aria-label="จังหวัด"
                    value={fields.province}
                    onChange={(v) => onChange("province", v)}
                    flex
                    minCh={6}
                  />
                </Row>
                <Row>
                  <T>ผู้ใหญ่บ้าน/กำนัน</T>
                  <Dot
                    aria-label="ผู้ใหญ่บ้านหรือกำนัน"
                    value={fields.headman}
                    onChange={(v) => onChange("headman", v)}
                    flex
                    minCh={10}
                  />
                </Row>
              </div>
            </>
          ) : null}

          {page.reason.map((slice) => (
            <FieldLines
              key={`rs-${slice.sliceIndex}`}
              label={slice.label}
              showLabel={slice.showLabel}
              value={slice.text}
              lines={slice.lines}
              ariaLabel="ด้วยเหตุ"
              onChange={(v) => patchFlow("reason", slice.sliceIndex, v)}
            />
          ))}

          {page.orderText.map((slice) => (
            <FieldLines
              key={`or-${slice.sliceIndex}`}
              label={slice.label}
              showLabel={slice.showLabel}
              value={slice.text}
              lines={slice.lines}
              ariaLabel="ฉะนั้นให้"
              onChange={(v) => patchFlow("orderText", slice.sliceIndex, v)}
            />
          ))}

          {page.showAppoint ? (
            <div style={{ flexShrink: 0 }}>
              <Row style={{ marginBottom: "0.4mm" }}>
                <T>ไป ณ ที่</T>
                <Dot
                  aria-label="สถานที่ให้ไปพบ"
                  value={fields.placeToGo}
                  onChange={(v) => onChange("placeToGo", v)}
                  flex
                  minCh={10}
                />
              </Row>
              <Row style={{ flexWrap: "wrap", marginBottom: "1.2mm" }}>
                <T>ในวันที่</T>
                <Dot
                  aria-label="วันนัดพบ"
                  value={fields.appointDay}
                  onChange={(v) => onChange("appointDay", v)}
                  minCh={3}
                />
                <T>เดือน</T>
                <Dot
                  aria-label="เดือนนัดพบ"
                  value={fields.appointMonth}
                  onChange={(v) => onChange("appointMonth", v)}
                  minCh={4}
                />
                <T>พ.ศ.</T>
                <Dot
                  aria-label="ปีพุทธศักราชนัดพบ"
                  value={fields.appointYear}
                  onChange={(v) => onChange("appointYear", v)}
                  minCh={4}
                />
                <T>เวลา</T>
                <Dot
                  aria-label="เวลานัดพบ"
                  value={fields.appointTime}
                  onChange={(v) => onChange("appointTime", v)}
                  minCh={4}
                />
                <T>นาฬิกา</T>
              </Row>
            </div>
          ) : null}

          {page.showTail ? (
            <>
              <div
                style={{
                  width: "62%",
                  marginLeft: "auto",
                  marginTop: "2mm",
                  flexShrink: 0,
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0, 1fr) auto",
                  columnGap: "1.5mm",
                  rowGap: "0.2mm",
                  alignItems: "baseline",
                }}
              >
                <span style={{ flexShrink: 0, lineHeight: SIGN_LINE }}>ลงชื่อ</span>
                <Dot
                  aria-label="ลงชื่อผู้ออกหมาย"
                  value={fields.signName}
                  onChange={(v) => onChange("signName", v)}
                  flex
                  minCh={8}
                />
                <span style={{ flexShrink: 0, lineHeight: SIGN_LINE }}>ผู้ออกหมาย</span>
                <span aria-hidden />
                <div
                  style={{
                    display: "flex",
                    flexWrap: "nowrap",
                    alignItems: "baseline",
                    gap: "1.5mm",
                    minHeight: SIGN_LINE,
                    lineHeight: SIGN_LINE,
                    minWidth: 0,
                  }}
                >
                  <span style={{ flexShrink: 0 }}>(</span>
                  <Dot
                    aria-label="ชื่อตัวบรรจงผู้ออกหมาย"
                    value={fields.signPrinted}
                    onChange={(v) => onChange("signPrinted", v)}
                    flex
                    minCh={8}
                  />
                  <span style={{ flexShrink: 0 }}>)</span>
                </div>
                <span aria-hidden />
                <span style={{ flexShrink: 0, lineHeight: SIGN_LINE }}>ตำแหน่ง</span>
                <Dot
                  aria-label="ตำแหน่งผู้ออกหมาย"
                  value={fields.signPosition}
                  onChange={(v) => onChange("signPosition", v)}
                  flex
                  minCh={8}
                />
                <span aria-hidden />
              </div>

              <div
                style={{
                  border: "0.55pt solid #111",
                  padding: "1.2mm 2mm",
                  margin: "2.5mm 0 0",
                  flexShrink: 0,
                  fontSize: BODY,
                  lineHeight: 1.25,
                }}
              >
                <span style={{ fontWeight: 700 }}>คำเตือน&nbsp;&nbsp;</span>
                {WITNESS_SUMMONS_WARNING}
              </div>

              {/* ใบรับหมายตำรวจ — ท่อนที่ผู้นำส่งหมายนำกลับมาคืน */}
              <div
                aria-hidden
                style={{ borderTop: "0.5pt dashed #111", margin: "3mm 0 1.5mm", flexShrink: 0 }}
              />

              <p
                style={{
                  margin: "0 0 0.6mm",
                  textAlign: "center",
                  fontWeight: 700,
                  textDecoration: "underline",
                  textUnderlineOffset: "0.8mm",
                  lineHeight: LINE,
                  flexShrink: 0,
                }}
              >
                ใบรับหมายตำรวจ
              </p>
              <Row style={{ flexWrap: "wrap" }}>
                <T>วันที่</T>
                <Dot
                  aria-label="วันที่รับหมาย"
                  value={fields.receiptDay}
                  onChange={(v) => onChange("receiptDay", v)}
                  minCh={3}
                />
                <T>เดือน</T>
                <Dot
                  aria-label="เดือนที่รับหมาย"
                  value={fields.receiptMonth}
                  onChange={(v) => onChange("receiptMonth", v)}
                  minCh={4}
                />
                <T>พ.ศ.</T>
                <Dot
                  aria-label="ปีพุทธศักราชที่รับหมาย"
                  value={fields.receiptYear}
                  onChange={(v) => onChange("receiptYear", v)}
                  minCh={4}
                />
                <T>เวลา</T>
                <Dot
                  aria-label="เวลารับหมาย"
                  value={fields.receiptTime}
                  onChange={(v) => onChange("receiptTime", v)}
                  minCh={4}
                />
                <T>นาฬิกา</T>
              </Row>
              <Row style={{ flexWrap: "wrap" }}>
                <span style={{ flexShrink: 0 }}>{WITNESS_SUMMONS_RECEIPT_TEXT}</span>
                <Dot
                  aria-label="สถานที่ที่กำหนดให้ไปในใบรับหมาย"
                  value={fields.receiptPlace}
                  onChange={(v) => onChange("receiptPlace", v)}
                  flex
                  minCh={10}
                />
              </Row>
              <Row style={{ flexWrap: "wrap", marginBottom: "2mm" }}>
                <T>ในวันที่</T>
                <Dot
                  aria-label="วันนัดพบในใบรับหมาย"
                  value={fields.appointDay2}
                  onChange={(v) => onChange("appointDay2", v)}
                  minCh={3}
                />
                <T>เดือน</T>
                <Dot
                  aria-label="เดือนนัดพบในใบรับหมาย"
                  value={fields.appointMonth2}
                  onChange={(v) => onChange("appointMonth2", v)}
                  minCh={4}
                />
                <T>พ.ศ.</T>
                <Dot
                  aria-label="ปีพุทธศักราชนัดพบในใบรับหมาย"
                  value={fields.appointYear2}
                  onChange={(v) => onChange("appointYear2", v)}
                  minCh={4}
                />
                <T>เวลา</T>
                <Dot
                  aria-label="เวลานัดพบในใบรับหมาย"
                  value={fields.appointTime2}
                  onChange={(v) => onChange("appointTime2", v)}
                  minCh={4}
                />
                <T>นาฬิกา</T>
                <span style={{ flexShrink: 0 }}>{WITNESS_SUMMONS_RECEIPT_TAIL}</span>
              </Row>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  columnGap: "8mm",
                  flexShrink: 0,
                  fontSize: BODY,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: "1.5mm", minWidth: 0 }}>
                  <span style={{ flexShrink: 0 }}>(ลงชื่อ)</span>
                  <Dot
                    aria-label="ชื่อผู้รับหมาย"
                    value={fields.receiverName}
                    onChange={(v) => onChange("receiverName", v)}
                    flex
                    minCh={6}
                  />
                  <span style={{ flexShrink: 0 }}>ผู้รับหมาย</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "1.5mm", minWidth: 0 }}>
                  <span style={{ flexShrink: 0 }}>(ลงชื่อ)</span>
                  <Dot
                    aria-label="ชื่อผู้ส่งหมาย"
                    value={fields.delivererName}
                    onChange={(v) => onChange("delivererName", v)}
                    flex
                    minCh={6}
                  />
                  <span style={{ flexShrink: 0 }}>ผู้ส่งหมาย</span>
                </div>
              </div>
            </>
          ) : null}
        </Sheet>
      ))}
    </div>
  );
}
