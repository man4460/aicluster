"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SCENE_INSPECT_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  packSceneInspectPages,
  type SceneInspectFields,
  type SceneInspectPageSlice,
} from "@/lib/smart-police/form-templates/scene-inspect";
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
  const indent = showLabel && label ? `calc(${label.length + 1}ch + 1.5mm)` : "0";
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
      {showLabel && label ? (
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
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          wordBreak: "break-word",
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

export function OfficialSceneInspectDocument({
  fields,
  onChange,
  onPageCount,
}: {
  fields: SceneInspectFields;
  onChange: <K extends keyof SceneInspectFields>(key: K, value: SceneInspectFields[K]) => void;
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

  const pages = useMemo(() => packSceneInspectPages(fields, countLines), [fields, countLines]);

  useLayoutEffect(() => {
    onPageCount?.(pages.length);
  }, [onPageCount, pages.length]);

  function patchSlice(key: SceneInspectPageSlice["key"], sliceIndex: number, text: string) {
    const parts = pages.flatMap((p) => p.slices.filter((s) => s.key === key));
    onChange(
      key,
      parts.map((s) => (s.sliceIndex === sliceIndex ? text : s.text)).join(""),
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      {pages.map((page) => (
        <Sheet key={`si-${page.index}`} index={page.index}>
          {page.showHeader ? (
            <>
              <header style={{ textAlign: "center", marginBottom: "1.5mm", flexShrink: 0 }}>
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
                  {SCENE_INSPECT_FORM_TITLE}
                </h1>
              </header>
              <div style={{ flexShrink: 0 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    columnGap: "1.5mm",
                    width: "100%",
                    marginBottom: "0.8mm",
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
                      <Dot
                        aria-label="เดือน"
                        value={fields.month}
                        onChange={(v) => onChange("month", v)}
                        flex
                        minCh={4}
                      />
                      <T>พ.ศ.</T>
                      <Dot aria-label="พ.ศ." value={fields.year} onChange={(v) => onChange("year", v)} flex minCh={4} />
                    </div>
                  </div>
                </div>
                <p style={{ margin: "0 0 1.2mm", fontSize: BODY, lineHeight: LINE, textAlign: "center" }}>
                  เจ้าพนักงานได้ตรวจสถานที่เกิดเหตุในคดีนี้ ปรากฏรายละเอียด ดังนี้.-
                </p>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>ข้อ ๑ ผู้ตรวจสถานที่เกิดเหตุ</T>
                  <Dot
                    aria-label="ผู้ตรวจสถานที่เกิดเหตุ"
                    value={fields.inspector}
                    onChange={(v) => onChange("inspector", v)}
                    flex
                    minCh={8}
                  />
                  <T>ตำแหน่ง</T>
                  <Dot
                    aria-label="ตำแหน่งผู้ตรวจ"
                    value={fields.inspectorPosition}
                    onChange={(v) => onChange("inspectorPosition", v)}
                    flex
                    minCh={6}
                  />
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>ข้อ ๒ ผู้กล่าวหา</T>
                  <Dot
                    aria-label="ผู้กล่าวหา"
                    value={fields.complainant}
                    onChange={(v) => onChange("complainant", v)}
                    flex
                    minCh={8}
                  />
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>ข้อ ๓ ผู้ต้องหา</T>
                  <Dot
                    aria-label="ผู้ต้องหา"
                    value={fields.suspect}
                    onChange={(v) => onChange("suspect", v)}
                    flex
                    minCh={8}
                  />
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>ข้อ ๔ ข้อหา</T>
                  <Dot
                    aria-label="ข้อหา"
                    value={fields.charge}
                    onChange={(v) => onChange("charge", v)}
                    flex
                    minCh={8}
                  />
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>ข้อ ๕ วัน เวลาเกิดเหตุ วันที่</T>
                  <Dot
                    aria-label="วันที่เกิดเหตุ"
                    value={fields.incidentDay}
                    onChange={(v) => onChange("incidentDay", v)}
                    minCh={3}
                  />
                  <T>เดือน</T>
                  <Dot
                    aria-label="เดือนเกิดเหตุ"
                    value={fields.incidentMonth}
                    onChange={(v) => onChange("incidentMonth", v)}
                    minCh={4}
                  />
                  <T>พ.ศ.</T>
                  <Dot
                    aria-label="พ.ศ. เกิดเหตุ"
                    value={fields.incidentYear}
                    onChange={(v) => onChange("incidentYear", v)}
                    minCh={4}
                  />
                  <T>เวลา</T>
                  <Dot
                    aria-label="เวลาเกิดเหตุ"
                    value={fields.incidentTime}
                    onChange={(v) => onChange("incidentTime", v)}
                    minCh={4}
                  />
                  <T>น.</T>
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>ข้อ ๖ วัน เวลารับแจ้งเหตุ วันที่</T>
                  <Dot
                    aria-label="วันที่รับแจ้งเหตุ"
                    value={fields.reportDay}
                    onChange={(v) => onChange("reportDay", v)}
                    minCh={3}
                  />
                  <T>เดือน</T>
                  <Dot
                    aria-label="เดือนรับแจ้งเหตุ"
                    value={fields.reportMonth}
                    onChange={(v) => onChange("reportMonth", v)}
                    minCh={4}
                  />
                  <T>พ.ศ.</T>
                  <Dot
                    aria-label="พ.ศ. รับแจ้งเหตุ"
                    value={fields.reportYear}
                    onChange={(v) => onChange("reportYear", v)}
                    minCh={4}
                  />
                  <T>เวลา</T>
                  <Dot
                    aria-label="เวลารับแจ้งเหตุ"
                    value={fields.reportTime}
                    onChange={(v) => onChange("reportTime", v)}
                    minCh={4}
                  />
                  <T>น.</T>
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>ป.จ.ว. ข้อ</T>
                  <Dot
                    aria-label="ป.จ.ว. ข้อ"
                    value={fields.dailyLogItem}
                    onChange={(v) => onChange("dailyLogItem", v)}
                    flex
                    minCh={8}
                  />
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>ข้อ ๗ วัน เวลาตรวจสถานที่เกิดเหตุ วันที่</T>
                  <Dot
                    aria-label="วันที่ตรวจสถานที่เกิดเหตุ"
                    value={fields.inspectDay}
                    onChange={(v) => onChange("inspectDay", v)}
                    minCh={3}
                  />
                  <T>เดือน</T>
                  <Dot
                    aria-label="เดือนตรวจสถานที่เกิดเหตุ"
                    value={fields.inspectMonth}
                    onChange={(v) => onChange("inspectMonth", v)}
                    minCh={4}
                  />
                  <T>พ.ศ.</T>
                  <Dot
                    aria-label="พ.ศ. ตรวจสถานที่เกิดเหตุ"
                    value={fields.inspectYear}
                    onChange={(v) => onChange("inspectYear", v)}
                    minCh={4}
                  />
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>เวลาระหว่าง</T>
                  <Dot
                    aria-label="เวลาเริ่มตรวจ"
                    value={fields.inspectFrom}
                    onChange={(v) => onChange("inspectFrom", v)}
                    minCh={4}
                  />
                  <T>น. ถึง</T>
                  <Dot
                    aria-label="เวลาสิ้นสุดตรวจ"
                    value={fields.inspectTo}
                    onChange={(v) => onChange("inspectTo", v)}
                    minCh={4}
                  />
                  <T>น.</T>
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>ข้อ ๘ สถานที่เกิดเหตุ</T>
                  <Dot
                    aria-label="สถานที่เกิดเหตุ"
                    value={fields.place}
                    onChange={(v) => onChange("place", v)}
                    flex
                    minCh={8}
                  />
                  <T>หมู่ที่</T>
                  <Dot aria-label="หมู่ที่" value={fields.moo} onChange={(v) => onChange("moo", v)} minCh={3} />
                  <T>ตรอก/ซอย</T>
                  <Dot
                    aria-label="ตรอกหรือซอย"
                    value={fields.alley}
                    onChange={(v) => onChange("alley", v)}
                    flex
                    minCh={6}
                  />
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>ถนน</T>
                  <Dot aria-label="ถนน" value={fields.road} onChange={(v) => onChange("road", v)} flex minCh={6} />
                  <T>ตำบล/แขวง</T>
                  <Dot
                    aria-label="ตำบลหรือแขวง"
                    value={fields.subdistrict}
                    onChange={(v) => onChange("subdistrict", v)}
                    flex
                    minCh={6}
                  />
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>อำเภอ/เขต</T>
                  <Dot
                    aria-label="อำเภอหรือเขต"
                    value={fields.district}
                    onChange={(v) => onChange("district", v)}
                    flex
                    minCh={6}
                  />
                  <T>จังหวัด</T>
                  <Dot
                    aria-label="จังหวัดเกิดเหตุ"
                    value={fields.province}
                    onChange={(v) => onChange("province", v)}
                    flex
                    minCh={6}
                  />
                </Row>
              </div>
            </>
          ) : null}

          {page.showPageNo ? (
            <p style={{ margin: "0 0 4mm", textAlign: "center", fontSize: BODY, flexShrink: 0 }}>
              -{thaiNumeral(page.index + 1)}-
            </p>
          ) : null}

          {page.slices.map((slice) => (
            <div key={`${slice.key}-${slice.sliceIndex}`} style={{ flexShrink: 0 }}>
              {slice.showHeading ? (
                <p
                  style={{
                    margin: "0.6mm 0 0.2mm",
                    fontSize: BODY,
                    lineHeight: LINE,
                    fontWeight: 700,
                  }}
                >
                  {slice.heading}
                </p>
              ) : null}
              <FieldLines
                label={slice.label}
                value={slice.text}
                onChange={(v) => patchSlice(slice.key, slice.sliceIndex, v)}
                lines={slice.lines}
                showLabel={slice.showLabel}
                ariaLabel={slice.showHeading ? slice.heading : `${slice.heading} (ต่อ)`}
              />
            </div>
          ))}

          {page.showSigns ? (
            <div
              style={{
                width: "62%",
                marginLeft: "auto",
                marginTop: "2mm",
                flexShrink: 0,
                display: "grid",
                gridTemplateColumns: "auto minmax(0, 1fr) auto",
                columnGap: "1.5mm",
                rowGap: "0.15mm",
                alignItems: "baseline",
              }}
            >
              <span style={{ flexShrink: 0, lineHeight: SIGN_LINE }}>ลงชื่อ</span>
              <Dot
                aria-label="ลงชื่อผู้ตรวจบันทึก"
                value={fields.signName}
                onChange={(v) => onChange("signName", v)}
                flex
                minCh={8}
              />
              <span style={{ flexShrink: 0, lineHeight: SIGN_LINE, whiteSpace: "nowrap" }}>
                ผู้ตรวจ/บันทึก
              </span>
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
                  aria-label="ชื่อผู้ตรวจบันทึก"
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
                aria-label="ตำแหน่งผู้ตรวจบันทึก"
                value={fields.signPosition}
                onChange={(v) => onChange("signPosition", v)}
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
