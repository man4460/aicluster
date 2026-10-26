"use client";

import { useLayoutEffect, type ReactNode } from "react";
import {
  createEmptyInterestingCaseReportFields,
  type InterestingCaseReportFields,
} from "@/lib/smart-police/form-templates/interesting-case-report";
import { INTERESTING_CASE_REPORT_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "16pt";
const LINE = "7.76mm";

function Fill({
  aria,
  value,
  onChange,
  w,
  center,
}: {
  aria: string;
  value: string;
  onChange: (v: string) => void;
  w: string;
  center?: boolean;
}) {
  return (
    <input
      aria-label={aria}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className="sp-word-field"
      style={{
        display: "inline-block",
        width: w,
        minWidth: 0,
        fontFamily: "inherit",
        fontSize: BODY,
        lineHeight: LINE,
        textAlign: center ? "center" : "left",
        verticalAlign: "baseline",
        paddingBottom: "1px",
      }}
    />
  );
}

function HeadRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "1mm",
        fontSize: BODY,
        lineHeight: LINE,
        flexShrink: 0,
      }}
    >
      <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "baseline", flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

export function OfficialInterestingCaseReportDocument({
  fields,
  onChange,
  onPageCount,
}: {
  fields: InterestingCaseReportFields;
  onChange: <K extends keyof InterestingCaseReportFields>(
    key: K,
    value: InterestingCaseReportFields[K],
  ) => void;
  onPageCount?: (n: number) => void;
}) {
  useLayoutEffect(() => {
    onPageCount?.(1);
  }, [onPageCount]);

  const para = {
    margin: 0,
    fontSize: BODY,
    lineHeight: LINE,
    textAlign: "justify" as const,
    flexShrink: 0,
  };

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      <article
        data-sheet-index={0}
        className="sp-a4-sheet relative mx-auto bg-white text-[#111] shadow-xl print:shadow-none"
        style={{
          width: PAGE.w,
          height: PAGE.h,
          boxSizing: "border-box",
          overflow: "hidden",
          padding: "14mm 16mm 16mm",
          fontFamily: FONT,
          fontSize: BODY,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h1
          style={{
            margin: "0 0 4mm",
            fontSize: "18pt",
            fontWeight: 700,
            lineHeight: 1.2,
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          บันทึกข้อความ
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.6mm", flexShrink: 0 }}>
          <HeadRow label="ส่วนราชการ">
            <Fill
              aria="ส่วนราชการ"
              value={fields.station}
              onChange={(v) => onChange("station", v)}
              w="122mm"
            />
            <span style={{ whiteSpace: "nowrap", fontWeight: 700, marginLeft: "2mm" }}>โทร.</span>
            <Fill
              aria="โทร."
              value={fields.stationPhone}
              onChange={(v) => onChange("stationPhone", v)}
              w="30mm"
            />
          </HeadRow>
          <HeadRow label="ที่">
            <Fill aria="ที่" value={fields.docNo} onChange={(v) => onChange("docNo", v)} w="80mm" />
            <span style={{ whiteSpace: "nowrap", fontWeight: 700, marginLeft: "6mm" }}>วันที่</span>
            <Fill aria="วันที่" value={fields.date} onChange={(v) => onChange("date", v)} w="52mm" />
          </HeadRow>
          <HeadRow label="เรื่อง">
            <span style={{ fontWeight: 700 }}>{INTERESTING_CASE_REPORT_FORM_TITLE}</span>
          </HeadRow>
        </div>

        <div
          aria-hidden
          style={{ borderTop: "1pt solid #111", margin: "1.6mm 0 2.4mm", flexShrink: 0 }}
        />

        <div style={{ display: "flex", alignItems: "baseline", fontSize: BODY, lineHeight: LINE, flexShrink: 0 }}>
          <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>เรียน</span>
          <Fill
            aria="เรียน"
            value={fields.learnTo}
            onChange={(v) => onChange("learnTo", v)}
            w="168mm"
          />
        </div>

        <p style={{ ...para, marginTop: "1.6mm", textIndent: "12mm" }}>
          ด้วยเมื่อวันที่
          <Fill
            aria="วันที่เกิดเหตุ (วรรคเปิด)"
            value={fields.incidentDate}
            onChange={(v) => onChange("incidentDate", v)}
            w="40mm"
            center
          />
          เวลาประมาณ
          <Fill
            aria="เวลาที่เกิดเหตุ (วรรคเปิด)"
            value={fields.incidentTime}
            onChange={(v) => onChange("incidentTime", v)}
            w="20mm"
            center
          />
          น. ตาม ปจว.ข้อ
          <Fill aria="ปจว.ข้อ" value={fields.pjvNo} onChange={(v) => onChange("pjvNo", v)} w="28mm" center />
          นาย
          <Fill
            aria="ชื่อผู้แจ้งความ"
            value={fields.complainantName}
            onChange={(v) => onChange("complainantName", v)}
            w="52mm"
          />
          อายุ
          <Fill
            aria="อายุผู้แจ้งความ"
            value={fields.complainantAge}
            onChange={(v) => onChange("complainantAge", v)}
            w="14mm"
            center
          />
          ปี ที่อยู่
          <Fill
            aria="ที่อยู่ผู้แจ้งความ"
            value={fields.complainantAddress}
            onChange={(v) => onChange("complainantAddress", v)}
            w="70mm"
          />
          ได้มาแจ้งความร้องทุกข์ต่อพนักงานสอบสวน ให้ดำเนินคดีกับ นาย
          <Fill
            aria="ชื่อผู้ถูกกล่าวหา"
            value={fields.accusedName}
            onChange={(v) => onChange("accusedName", v)}
            w="52mm"
          />
          โดยกล่าวหาว่า
          <Fill
            aria="ข้อกล่าวหา"
            value={fields.allegation}
            onChange={(v) => onChange("allegation", v)}
            w="40mm"
          />
          เหตุเกิด
          <Fill aria="สถานที่เกิดเหตุ" value={fields.place} onChange={(v) => onChange("place", v)} w="72mm" />
          เมื่อวันที่
          <Fill
            aria="วันที่เกิดเหตุ"
            value={fields.eventDate}
            onChange={(v) => onChange("eventDate", v)}
            w="36mm"
            center
          />
          เวลาประมาณ
          <Fill
            aria="เวลาที่เกิดเหตุ"
            value={fields.eventTime}
            onChange={(v) => onChange("eventTime", v)}
            w="20mm"
            center
          />
          น. ซึ่งพนักงานสอบสวนได้รับคำร้องทุกข์ไว้เป็นคดีอาญาที่
          <Fill aria="คดีอาญาที่" value={fields.caseNo} onChange={(v) => onChange("caseNo", v)} w="42mm" />
          ลงวันที่
          <Fill
            aria="วันที่รับคำร้องทุกข์"
            value={fields.caseDate}
            onChange={(v) => onChange("caseDate", v)}
            w="34mm"
            center
          />
          ปจว.ข้อ
          <Fill
            aria="ปจว.ข้อ (คดี)"
            value={fields.pjvNo2}
            onChange={(v) => onChange("pjvNo2", v)}
            w="26mm"
            center
          />
          เวลา
          <Fill
            aria="เวลา ปจว."
            value={fields.pjvTime}
            onChange={(v) => onChange("pjvTime", v)}
            w="20mm"
            center
          />
          น.
        </p>

        <p style={{ ...para, marginTop: "1.6mm", textIndent: "12mm" }}>
          สน.
          <Fill
            aria="สน."
            value={fields.stationShort}
            onChange={(v) => onChange("stationShort", v)}
            w="46mm"
          />
          จึงมาเรียนมายังท่านเพื่อโปรดทราบ และแนบแบบรายงาน เหตุที่น่าสนใจมาข้างท้ายนี้ จำนวน ๑ ฉบับ
        </p>

        <p style={{ ...para, marginTop: "3.2mm", textIndent: "12mm" }}>จึงเรียนมาเพื่อโปรดพิจารณา</p>

        <div
          style={{
            marginTop: "6mm",
            marginLeft: "auto",
            width: "92mm",
            display: "flex",
            flexDirection: "column",
            gap: "0.6mm",
            fontSize: BODY,
            lineHeight: LINE,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>ยศ</span>
            <Fill
              aria="ยศผู้ลงนาม"
              value={fields.officerRank}
              onChange={(v) => onChange("officerRank", v)}
              w="74mm"
            />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "1mm" }}>
            <span>(</span>
            <Fill
              aria="ชื่อผู้ลงนาม"
              value={fields.officerName}
              onChange={(v) => onChange("officerName", v)}
              w="70mm"
              center
            />
            <span>)</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>ตำแหน่ง</span>
            <Fill
              aria="ตำแหน่งผู้ลงนาม"
              value={fields.officerPosition}
              onChange={(v) => onChange("officerPosition", v)}
              w="66mm"
            />
          </div>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>โทร.</span>
            <Fill
              aria="โทรผู้ลงนาม"
              value={fields.officerPhone}
              onChange={(v) => onChange("officerPhone", v)}
              w="76mm"
            />
          </div>
        </div>
      </article>
    </div>
  );
}

export { createEmptyInterestingCaseReportFields };
