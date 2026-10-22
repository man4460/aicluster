"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CHARGE_NOTICE_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  CHARGE_NOTICE_APPEARANCES,
  packChargeNoticePages,
  type ChargeNoticeAppearance,
  type ChargeNoticeFields,
  type ChargeNoticeFlowFieldKey,
  type ChargeNoticePageBodySlice,
} from "@/lib/smart-police/form-templates/charge-notice";
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

function Tick({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onToggle}
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: "1mm",
        padding: 0,
        border: "none",
        background: "transparent",
        font: "inherit",
        cursor: "pointer",
        flexShrink: 0,
        lineHeight: "inherit",
      }}
    >
      <span aria-hidden>
        ({checked ? "/" : "\u00a0\u00a0"})
      </span>
      <span>{label}</span>
    </button>
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
    <Row style={{ flexWrap: "nowrap", marginBottom: "0.2mm", minHeight: SIGN_LINE, lineHeight: SIGN_LINE }}>
      <span style={{ flexShrink: 0 }}>(ลงชื่อ)</span>
      <Dot aria-label={ariaLabel} value={value} onChange={onChange} flex minCh={10} />
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

export function OfficialChargeNoticeDocument({
  fields,
  onChange,
  onPageCount,
}: {
  fields: ChargeNoticeFields;
  onChange: <K extends keyof ChargeNoticeFields>(key: K, value: ChargeNoticeFields[K]) => void;
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

  const pages = useMemo(() => packChargeNoticePages(fields, countLines), [fields, countLines]);

  useLayoutEffect(() => {
    onPageCount?.(pages.length);
  }, [onPageCount, pages.length]);

  function patchFlow(key: ChargeNoticeFlowFieldKey, sliceIndex: number, text: string) {
    const slices: ChargeNoticePageBodySlice[] = [];
    for (const p of pages) {
      slices.push(...p.body.filter((b) => b.key === key));
      if (p.plea?.key === key) slices.push(p.plea);
    }
    const next = slices.map((s, i) => (i === sliceIndex ? text : s.text)).join("");
    onChange(key, next);
  }

  function toggleAppearance(id: ChargeNoticeAppearance) {
    onChange("appearance", fields.appearance === id ? "" : id);
  }

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      {pages.map((page) => (
        <Sheet key={`cn-${page.index}`} index={page.index}>
          {page.showHeader ? (
            <>
              <header style={{ textAlign: "center", marginBottom: "2mm", flexShrink: 0 }}>
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
                  {CHARGE_NOTICE_FORM_TITLE}
                </h1>
              </header>

              <div style={{ flexShrink: 0 }}>
                <Row style={{ flexWrap: "nowrap", justifyContent: "flex-end" }}>
                  <T>ที่</T>
                  <Dot
                    aria-label="ที่"
                    value={fields.docNo}
                    onChange={(v) => onChange("docNo", v)}
                    minCh={16}
                  />
                </Row>
                <Row style={{ flexWrap: "nowrap", justifyContent: "center" }}>
                  <T>วันที่</T>
                  <Dot aria-label="วันที่" value={fields.day} onChange={(v) => onChange("day", v)} minCh={4} />
                  <T>เดือน</T>
                  <Dot
                    aria-label="เดือน"
                    value={fields.month}
                    onChange={(v) => onChange("month", v)}
                    minCh={6}
                  />
                  <T>พ.ศ.</T>
                  <Dot aria-label="พ.ศ." value={fields.year} onChange={(v) => onChange("year", v)} minCh={5} />
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>วันนี้</T>
                  <Dot
                    aria-label="วันนี้"
                    value={fields.today}
                    onChange={(v) => onChange("today", v)}
                    flex
                    minCh={8}
                  />
                  <T>เวลา</T>
                  <Dot aria-label="เวลา" value={fields.time} onChange={(v) => onChange("time", v)} minCh={5} />
                  <T>น. ตาม ป.จ.ว.ข้อ</T>
                  <Dot
                    aria-label="ป.จ.ว. ข้อ"
                    value={fields.dailyLogItem}
                    onChange={(v) => onChange("dailyLogItem", v)}
                    flex
                    minCh={4}
                  />
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>ได้มี</T>
                  <Dot
                    aria-label="ชื่อผู้ต้องหา"
                    value={fields.name}
                    onChange={(v) => onChange("name", v)}
                    flex
                    minCh={10}
                  />
                  <T>อายุ</T>
                  <Dot aria-label="อายุ" value={fields.age} onChange={(v) => onChange("age", v)} minCh={3} />
                  <T>ปี</T>
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
                  <T>ที่อยู่</T>
                  <Dot
                    aria-label="ที่อยู่"
                    value={fields.address}
                    onChange={(v) => onChange("address", v)}
                    flex
                    minCh={8}
                  />
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>หมู่ที่</T>
                  <Dot aria-label="หมู่ที่" value={fields.moo} onChange={(v) => onChange("moo", v)} minCh={3} />
                  <T>ถนน</T>
                  <Dot
                    aria-label="ถนน"
                    value={fields.road}
                    onChange={(v) => onChange("road", v)}
                    flex
                    minCh={6}
                  />
                  <T>ตำบล/แขวง</T>
                  <Dot
                    aria-label="ตำบลหรือแขวง"
                    value={fields.tambon}
                    onChange={(v) => onChange("tambon", v)}
                    flex
                    minCh={5}
                  />
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>อำเภอ/เขต</T>
                  <Dot
                    aria-label="อำเภอหรือเขต"
                    value={fields.amphoe}
                    onChange={(v) => onChange("amphoe", v)}
                    flex
                    minCh={5}
                  />
                  <T>จังหวัด</T>
                  <Dot
                    aria-label="จังหวัด"
                    value={fields.province}
                    onChange={(v) => onChange("province", v)}
                    flex
                    minCh={5}
                  />
                  <T>โทรศัพท์</T>
                  <Dot
                    aria-label="โทรศัพท์"
                    value={fields.phone}
                    onChange={(v) => onChange("phone", v)}
                    flex
                    minCh={6}
                  />
                </Row>
                <Row>
                  <T>เป็นผู้ต้องหาในคดีที่</T>
                  <Dot
                    aria-label="เป็นผู้ต้องหาในคดีที่"
                    value={fields.caseRef}
                    onChange={(v) => onChange("caseRef", v)}
                    flex
                    minCh={8}
                  />
                  <T>ซึ่ง</T>
                  {CHARGE_NOTICE_APPEARANCES.map((opt) => (
                    <Tick
                      key={opt.id}
                      checked={fields.appearance === opt.id}
                      onToggle={() => toggleAppearance(opt.id)}
                      label={opt.label}
                    />
                  ))}
                </Row>
                <Row style={{ flexWrap: "nowrap" }}>
                  <T>พนักงานสอบสวน คือ</T>
                  <Dot
                    aria-label="พนักงานสอบสวน"
                    value={fields.investigator}
                    onChange={(v) => onChange("investigator", v)}
                    flex
                    minCh={8}
                  />
                  <T>ตำแหน่ง</T>
                  <Dot
                    aria-label="ตำแหน่งพนักงานสอบสวน"
                    value={fields.investigatorRank}
                    onChange={(v) => onChange("investigatorRank", v)}
                    flex
                    minCh={6}
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

          {page.showRights ? (
            <p
              style={{
                margin: "1.2mm 0 1.6mm",
                textAlign: "justify",
                fontSize: BODY,
                lineHeight: 1.45,
                flexShrink: 0,
              }}
            >
              และได้แจ้งสิทธิของผู้ต้องหาให้ทราบว่า ผู้ต้องหามีสิทธิที่จะให้การหรือไม่ให้การก็ได้ ถ้าให้การ
              คำให้การของผู้ต้องหานั้นอาจใช้เป็นพยานหลักฐานในการพิจารณาคดีได้ และผู้ต้องหามีสิทธิให้ทนายความหรือผู้ซึ่งตนไว้วางใจเข้าฟังการสอบสวนปากคำตนได้
            </p>
          ) : null}

          {page.plea ? (
            <FieldLines
              label={page.plea.label}
              value={page.plea.text}
              onChange={(v) => patchFlow("plea", page.plea!.sliceIndex, v)}
              lines={page.plea.lines}
              showLabel={page.plea.showLabel}
              ariaLabel={page.plea.showLabel ? page.plea.label : `${page.plea.label} (ต่อ)`}
            />
          ) : null}

          {page.showClosing ? (
            <>
              <p
                style={{
                  margin: "1.6mm 0 1.2mm",
                  textAlign: "justify",
                  fontSize: BODY,
                  lineHeight: 1.45,
                  flexShrink: 0,
                }}
              >
                พนักงานสอบสวนได้รับตัวผู้ต้องหาและของกลาง (ถ้ามี) ไว้เพื่อดำเนินคดีต่อไป ได้ทำการสอบปากคำแล้วปล่อยตัวผู้ต้องหาไป
                โดยไม่ได้จับกุมหรือควบคุมตัวไว้ ซึ่งผู้ต้องหารับว่าจะมาตามกำหนดนัดของพนักงานสอบสวน เพื่อดำเนินการสอบสวนต่อไป
                จึงให้ผู้ต้องหาลงลายมือชื่อไว้เป็นหลักฐาน และรับรองว่าถูกต้องตรงกับความเป็นจริงทุกประการ
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
            <>
              <div style={{ width: "62%", marginLeft: "auto", flexShrink: 0, marginTop: "1mm" }}>
                <SignLine
                  role="ผู้ต้องหา/ผู้มอบตัว/ผู้เข้าพบ"
                  ariaLabel="ลงชื่อผู้ต้องหา ผู้มอบตัว หรือผู้เข้าพบ"
                  value={fields.signAccused}
                  onChange={(v) => onChange("signAccused", v)}
                />
                <SignLine
                  role="พยาน"
                  ariaLabel="ลงชื่อพยาน"
                  value={fields.signWitness}
                  onChange={(v) => onChange("signWitness", v)}
                />
                <SignLine
                  role="แจ้งข้อกล่าวหา/บันทึก/อ่าน"
                  ariaLabel="ลงชื่อผู้แจ้งข้อกล่าวหา บันทึก อ่าน"
                  value={fields.signRecorder}
                  onChange={(v) => onChange("signRecorder", v)}
                />
                <Row style={{ flexWrap: "nowrap", marginBottom: "2mm", minHeight: SIGN_LINE, lineHeight: SIGN_LINE }}>
                  <span style={{ flexShrink: 0 }}>ตำแหน่ง</span>
                  <Dot
                    aria-label="ตำแหน่งผู้บันทึก"
                    value={fields.recorderPosition}
                    onChange={(v) => onChange("recorderPosition", v)}
                    flex
                    minCh={10}
                  />
                </Row>
              </div>
              <p
                style={{
                  margin: "1.2mm 0 1mm",
                  textAlign: "center",
                  fontSize: BODY,
                  lineHeight: LINE,
                  flexShrink: 0,
                }}
              >
                ได้รับสำเนาบันทึกนี้ไว้แล้ว
              </p>
              <div style={{ width: "62%", marginLeft: "auto", flexShrink: 0 }}>
                <SignLine
                  role="ผู้ต้องหา"
                  ariaLabel="ลงชื่อผู้ต้องหาที่รับสำเนา"
                  value={fields.signCopyAccused}
                  onChange={(v) => onChange("signCopyAccused", v)}
                />
              </div>
            </>
          ) : null}
        </Sheet>
      ))}
    </div>
  );
}
