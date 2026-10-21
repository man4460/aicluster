"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { WITHDRAW_COMPLAINT_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import type { WithdrawComplaintFields } from "@/lib/smart-police/form-templates/withdraw-complaint";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "13pt";
const TITLE = "15pt";
const LINE = "6.2mm";
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

function Line({
  value,
  onChange,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  "aria-label"?: string;
}) {
  return (
    <input
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className="sp-word-field w-full min-w-0"
      style={{ fontSize: "inherit", lineHeight: "inherit", height: "auto", paddingBottom: "1px" }}
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
        margin: "0 0 0.7mm",
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

function SignBlock({
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
    <div style={{ margin: "0 0 5mm" }}>
      <Row style={{ flexWrap: "nowrap" }}>
        <T>(ลงชื่อ)</T>
        <Dot aria-label={`ลงชื่อ${role}`} value={sign} onChange={onSign} flex minCh={10} />
        <T>{role}</T>
      </Row>
      <Row style={{ flexWrap: "nowrap", width: "78%", marginLeft: "10mm" }}>
        <T>(</T>
        <Dot aria-label={`ชื่อตัวบรรจง${role}`} value={paren} onChange={onParen} flex minCh={8} />
        <T>)</T>
      </Row>
    </div>
  );
}

export function OfficialWithdrawComplaintDocument({
  fields,
  onChange,
}: {
  fields: WithdrawComplaintFields;
  onChange: <K extends keyof WithdrawComplaintFields>(key: K, value: WithdrawComplaintFields[K]) => void;
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
        padding: "16mm 18mm 16mm",
        fontFamily: FONT,
        fontSize: BODY,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "6mm", flexShrink: 0 }}>
        <h1
          style={{
            margin: 0,
            fontSize: TITLE,
            fontWeight: 700,
            lineHeight: 1.3,
            textDecoration: "underline",
            textUnderlineOffset: "1mm",
          }}
        >
          {WITHDRAW_COMPLAINT_FORM_TITLE}
        </h1>
      </header>

      <div style={{ width: "58%", marginLeft: "auto", flexShrink: 0, marginBottom: "5mm" }}>
        <Row style={{ flexWrap: "nowrap" }}>
          <T>ที่</T>
          <Dot aria-label="ที่" value={fields.docNo} onChange={(v) => onChange("docNo", v)} flex minCh={8} />
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
            minCh={6}
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

      <div style={{ flex: 1, minHeight: 0 }}>
        <Row style={{ paddingLeft: INDENT }}>
          <T>บันทึกนี้แจ้งว่า ตามที่ผู้เสียหายร้องทุกข์กล่าวหาว่า นาย/นาง/นางสาว</T>
          <Dot
            aria-label="ชื่อผู้ถูกกล่าวหา"
            value={fields.victimName}
            onChange={(v) => onChange("victimName", v)}
            flex
            minCh={8}
          />
        </Row>
        <Row>
          <Line
            aria-label="ชื่อผู้ถูกกล่าวหาบรรทัด 2"
            value={fields.victimName2}
            onChange={(v) => onChange("victimName2", v)}
          />
        </Row>
        <Row>
          <T>กระทำความผิดฐาน</T>
          <Dot
            aria-label="กระทำความผิดฐาน"
            value={fields.charge}
            onChange={(v) => onChange("charge", v)}
            flex
            minCh={10}
          />
        </Row>
        <Row>
          <Line
            aria-label="ความผิดฐานบรรทัด 2"
            value={fields.charge2}
            onChange={(v) => onChange("charge2", v)}
          />
        </Row>
        <Row>
          <T>และได้มอบคดีให้กับพนักงานสอบสวนดำเนินคดีไว้ตาม ป.จ.ว. ข้อ</T>
          <Dot
            aria-label="ป.จ.ว. ข้อ"
            value={fields.dailyLogItem}
            onChange={(v) => onChange("dailyLogItem", v)}
            flex
            minCh={8}
          />
          <T>เวลา</T>
          <Dot
            aria-label="เวลาที่มอบคดี"
            value={fields.reportTime}
            onChange={(v) => onChange("reportTime", v)}
            minCh={4}
          />
          <T>น. ของ</T>
        </Row>
        <Row>
          <T>วันที่</T>
          <Dot
            aria-label="วันที่มอบคดี"
            value={fields.reportDay}
            onChange={(v) => onChange("reportDay", v)}
            minCh={3}
          />
          <T>เดือน</T>
          <Dot
            aria-label="เดือนที่มอบคดี"
            value={fields.reportMonth}
            onChange={(v) => onChange("reportMonth", v)}
            flex
            minCh={6}
          />
          <T>พ.ศ.</T>
          <Dot
            aria-label="พ.ศ. ที่มอบคดี"
            value={fields.reportYear}
            onChange={(v) => onChange("reportYear", v)}
            minCh={5}
          />
          <T>นั้น</T>
        </Row>
        <Row style={{ paddingLeft: INDENT }}>
          <T>บัดนี้ผู้เสียหายไม่มีความประสงค์จะให้พนักงานสอบสวนดำเนินคดีกับ</T>
          <Dot
            aria-label="ผู้ต้องหาที่ขอถอน"
            value={fields.suspect}
            onChange={(v) => onChange("suspect", v)}
            flex
            minCh={8}
          />
        </Row>
        <Row>
          <Dot
            aria-label="ผู้ต้องหาที่ขอถอนบรรทัด 2"
            value={fields.suspect2}
            onChange={(v) => onChange("suspect2", v)}
            flex
            minCh={8}
          />
          <T>ต่อไปอีก เนื่องจาก</T>
          <Dot
            aria-label="เหตุที่ขอถอน"
            value={fields.reason}
            onChange={(v) => onChange("reason", v)}
            flex
            minCh={8}
          />
        </Row>
        <Row style={{ paddingLeft: INDENT }}>
          <T>จึงขอถอนคำร้องทุกข์</T>
          <Dot
            aria-label="รายละเอียดการถอน"
            value={fields.withdrawNote}
            onChange={(v) => onChange("withdrawNote", v)}
            flex
            minCh={10}
          />
        </Row>
        <Row>
          <Dot
            aria-label="รายละเอียดการถอนบรรทัด 2"
            value={fields.withdrawNote2}
            onChange={(v) => onChange("withdrawNote2", v)}
            flex
            minCh={10}
          />
          <T>ได้รับแจ้งไว้</T>
        </Row>
        <p style={{ margin: "0 0 0.7mm", lineHeight: LINE, fontSize: BODY }}>แล้ว</p>
        <p style={{ margin: "0 0 0.4mm", lineHeight: 1.55, fontSize: BODY, textAlign: "justify" }}>
          เห็นว่าเป็นความผิดอาญาอันยอมความกันได้ เมื่อผู้เสียหายไม่ติดใจที่จะให้พนักงานสอบสวนดำเนินคดีต่อ
          และถอนคำร้องทุกข์แล้ว จึงให้ถอนคำร้องทุกข์ไปแต่เวลานี้
        </p>
      </div>

      <div style={{ flexShrink: 0, marginTop: "4mm" }}>
        <p style={{ margin: "0 0 8mm", textAlign: "center", fontSize: BODY, lineHeight: LINE }}>
          อ่านให้ฟังแล้ว รับว่าถูกต้อง
        </p>
        <div style={{ width: "78%", marginLeft: "auto" }}>
          <SignBlock
            role="ผู้ถอนคำร้องทุกข์"
            sign={fields.signWithdrawer}
            paren={fields.signWithdrawerParen}
            onSign={(v) => onChange("signWithdrawer", v)}
            onParen={(v) => onChange("signWithdrawerParen", v)}
          />
          <SignBlock
            role="ผู้ต้องหา"
            sign={fields.signSuspect}
            paren={fields.signSuspectParen}
            onSign={(v) => onChange("signSuspect", v)}
            onParen={(v) => onChange("signSuspectParen", v)}
          />
          <SignBlock
            role="พยาน"
            sign={fields.signWitness}
            paren={fields.signWitnessParen}
            onSign={(v) => onChange("signWitness", v)}
            onParen={(v) => onChange("signWitnessParen", v)}
          />
          <SignBlock
            role="สอบสวน/บันทึก/อ่าน"
            sign={fields.signOfficer}
            paren={fields.signOfficerParen}
            onSign={(v) => onChange("signOfficer", v)}
            onParen={(v) => onChange("signOfficerParen", v)}
          />
          <Row style={{ flexWrap: "nowrap", width: "86%", marginLeft: "10mm" }}>
            <T>ตำแหน่ง</T>
            <Dot
              aria-label="ตำแหน่งผู้สอบสวน"
              value={fields.signOfficerPosition}
              onChange={(v) => onChange("signOfficerPosition", v)}
              flex
              minCh={8}
            />
          </Row>
        </div>
      </div>
    </article>
  );
}
