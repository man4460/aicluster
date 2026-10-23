"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { COMPENSATION_SETTLEMENT_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  COMPENSATION_AGREEMENT_LINES,
  type CompensationSettlementFields,
} from "@/lib/smart-police/form-templates/compensation-settlement";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "15pt";
const TITLE = "15pt";
const LINE = "7.2mm";
const INDENT = "12mm";

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
      autoComplete="off"
      suppressHydrationWarning
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

function T({ children }: { children: ReactNode }) {
  return <span style={{ flexShrink: 0 }}>{children}</span>;
}

function SignRow({
  role,
  sign,
  paren,
  onSign,
  onParen,
}: {
  role: string;
  sign: string;
  paren: string;
  onSign: (v: string) => void;
  onParen: (v: string) => void;
}) {
  return (
    <div style={{ margin: 0 }}>
      <Row style={{ flexWrap: "wrap", marginBottom: "0.2mm" }}>
        <T>ลงชื่อ</T>
        <Dot aria-label={`ลงชื่อ${role}`} value={sign} onChange={onSign} flex minCh={6} />
        <span style={{ flexShrink: 0 }}>{role}</span>
      </Row>
      <Row style={{ flexWrap: "nowrap", width: "78%", marginLeft: "12mm", marginBottom: 0 }}>
        <T>(</T>
        <Dot aria-label={`ชื่อตัวบรรจง${role}`} value={paren} onChange={onParen} flex minCh={6} />
        <T>)</T>
      </Row>
    </div>
  );
}

export function OfficialCompensationSettlementDocument({
  fields,
  onChange,
}: {
  fields: CompensationSettlementFields;
  onChange: <K extends keyof CompensationSettlementFields>(
    key: K,
    value: CompensationSettlementFields[K],
  ) => void;
}) {
  return (
    <article
      data-sheet-index={0}
      className="sp-a4-sheet relative mx-auto bg-white text-[#111] shadow-xl print:shadow-none"
      style={{
        width: PAGE.w,
        height: PAGE.h,
        boxSizing: "border-box",
        overflow: "hidden",
        padding: "14mm 16mm 12mm",
        fontFamily: FONT,
        fontSize: BODY,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "4mm", flexShrink: 0 }}>
        <h1
          style={{
            margin: 0,
            fontSize: TITLE,
            fontWeight: 700,
            lineHeight: 1.25,
            textDecoration: "underline",
            textUnderlineOffset: "1mm",
          }}
        >
          {COMPENSATION_SETTLEMENT_FORM_TITLE}
        </h1>
      </header>

      <div style={{ width: "58%", marginLeft: "auto", flexShrink: 0, marginBottom: "3.5mm" }}>
        <Row style={{ flexWrap: "nowrap" }}>
          <T>สถานที่บันทึก</T>
          <Dot aria-label="สถานที่บันทึก" value={fields.place} onChange={(v) => onChange("place", v)} flex minCh={8} />
        </Row>
        <Row style={{ flexWrap: "nowrap" }}>
          <T>วันที่</T>
          <Dot
            aria-label="วันที่บันทึก"
            value={fields.datedDay}
            onChange={(v) => onChange("datedDay", v)}
            minCh={3}
          />
          <T>เดือน</T>
          <Dot
            aria-label="เดือนบันทึก"
            value={fields.datedMonth}
            onChange={(v) => onChange("datedMonth", v)}
            flex
            minCh={5}
          />
          <T>พ.ศ.</T>
          <Dot
            aria-label="พ.ศ. บันทึก"
            value={fields.datedYear}
            onChange={(v) => onChange("datedYear", v)}
            minCh={5}
          />
        </Row>
      </div>

      <div style={{ flexShrink: 0 }}>
        <Row>
          <T>วันนี้</T>
          <Dot
            aria-label="วันนี้"
            value={fields.todayDate}
            onChange={(v) => onChange("todayDate", v)}
            flex
            minCh={8}
          />
          <T>เวลา</T>
          <Dot aria-label="เวลา" value={fields.time} onChange={(v) => onChange("time", v)} minCh={5} />
          <T>น. ได้มี</T>
        </Row>
        <Row>
          <Dot
            aria-label="คู่กรณีฝ่ายที่ 1"
            value={fields.party1}
            onChange={(v) => onChange("party1", v)}
            flex
            minCh={8}
          />
          <T>ซึ่งเป็น คู่กรณีฝ่ายที่ ๑ และ</T>
          <Dot
            aria-label="คู่กรณีฝ่ายที่ 2"
            value={fields.party2}
            onChange={(v) => onChange("party2", v)}
            flex
            minCh={8}
          />
          <T>ซึ่งเป็น คู่กรณีฝ่ายที่ ๒</T>
        </Row>
        <Row>
          <T>ได้มาพบพนักงานสอบสวน กรณี</T>
          <Dot
            aria-label="ผู้กล่าวหา"
            value={fields.complainant}
            onChange={(v) => onChange("complainant", v)}
            flex
            minCh={8}
          />
          <T>ผู้กล่าวหา ได้มาแจ้งความร้องทุกข์</T>
        </Row>
        <Row>
          <T>ให้ดำเนินคดีกับ</T>
          <Dot
            aria-label="ผู้ต้องหา"
            value={fields.suspect}
            onChange={(v) => onChange("suspect", v)}
            flex
            minCh={10}
          />
          <T>ผู้ต้องหา</T>
        </Row>
        <Row>
          <T>ในข้อหา</T>
          <Dot
            aria-label="ข้อหา"
            value={fields.charge}
            onChange={(v) => onChange("charge", v)}
            flex
            minCh={10}
          />
        </Row>
        <Row>
          <T>เหตุเกิด เมื่อวันที่</T>
          <Dot
            aria-label="วันที่เกิดเหตุ"
            value={fields.incidentDay}
            onChange={(v) => onChange("incidentDay", v)}
            flex
            minCh={8}
          />
          <T>เวลาประมาณ</T>
          <Dot
            aria-label="เวลาประมาณเกิดเหตุ"
            value={fields.incidentTime}
            onChange={(v) => onChange("incidentTime", v)}
            flex
            minCh={6}
          />
          <T>น.</T>
        </Row>
        <p style={{ margin: "1mm 0 0.5mm", lineHeight: LINE, fontSize: BODY }}>
          คู่กรณีได้ตกลงเรียกร้องค่าเสียหายกันดังนี้
        </p>
      </div>

      <div style={{ position: "relative", flexShrink: 0, marginBottom: "2.5mm" }}>
        <div aria-hidden>
          {Array.from({ length: COMPENSATION_AGREEMENT_LINES }, (_, i) => (
            <div
              key={`ag-${i}`}
              style={{
                height: LINE,
                borderBottom: "0.5pt dotted #111",
                boxSizing: "border-box",
              }}
            />
          ))}
        </div>
        <textarea
          aria-label="รายละเอียดการตกลงค่าเสียหาย"
          value={fields.agreementNotes}
          onChange={(e) => onChange("agreementNotes", e.target.value)}
          autoComplete="off"
          suppressHydrationWarning
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

      <div style={{ flexShrink: 0, fontSize: BODY, lineHeight: LINE, marginBottom: "2.5mm" }}>
        <p style={{ margin: "0 0 1.5mm", textAlign: "left", textIndent: INDENT }}>
          คู่กรณีทั้งสองฝ่าย สามารถตกลงกันได้ และต่างฝ่ายต่างไม่ติดใจที่จะเรียกร้องสิ่งใดกันอีกต่อไป
          ทั้งในทางแพ่ง และไม่ติดใจในผลแห่งคดีอาญา อนึ่ง การตกลงชดใช้ค่าเสียหายนี้
          ได้ทำด้วยความสมัครใจของคู่กรณีเอง ไม่มีผู้หนึ่งผู้ใดบังคับ ขู่เข็ญ
          หรือหลอกลวงซึ่งกันและกัน ด้วยประการใด ๆ ทั้งสิ้น
        </p>
        <p style={{ margin: 0, textAlign: "left", textIndent: INDENT }}>
          ได้อ่านให้ฟัง และคู่กรณีเข้าใจโดยตลอดแล้ว รับว่าถูกต้องตรงกับความเป็นจริงทุกประการ
          จึงได้ลงลายมือชื่อไว้เป็นหลักฐาน
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: "4mm",
          rowGap: "1mm",
          alignItems: "start",
          flexShrink: 0,
        }}
      >
        <SignRow
          role="คู่กรณีฝ่ายที่ ๑"
          sign={fields.signParty1}
          paren={fields.signParty1Paren}
          onSign={(v) => onChange("signParty1", v)}
          onParen={(v) => onChange("signParty1Paren", v)}
        />
        <SignRow
          role="คู่กรณีฝ่ายที่ ๒"
          sign={fields.signParty2}
          paren={fields.signParty2Paren}
          onSign={(v) => onChange("signParty2", v)}
          onParen={(v) => onChange("signParty2Paren", v)}
        />
        <SignRow
          role="พยาน"
          sign={fields.signWitness1}
          paren={fields.signWitness1Paren}
          onSign={(v) => onChange("signWitness1", v)}
          onParen={(v) => onChange("signWitness1Paren", v)}
        />
        <SignRow
          role="พยาน"
          sign={fields.signWitness2}
          paren={fields.signWitness2Paren}
          onSign={(v) => onChange("signWitness2", v)}
          onParen={(v) => onChange("signWitness2Paren", v)}
        />
        <SignRow
          role="พงส./บันทึก/อ่าน"
          sign={fields.signOfficer}
          paren={fields.signOfficerParen}
          onSign={(v) => onChange("signOfficer", v)}
          onParen={(v) => onChange("signOfficerParen", v)}
        />
      </div>
    </article>
  );
}
