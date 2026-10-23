"use client";

import { type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CASE_PHOTO_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import {
  type CasePhotoExtraPage,
  type CasePhotoFields,
} from "@/lib/smart-police/form-templates/case-photo";
import { thaiNumeral } from "@/lib/smart-police/form-templates/property-list";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "15pt";
const TITLE = "15pt";
const LINE = "7.2mm";
const SIGN_LINE = "6.7mm";
const RULE = "0.6pt solid #111";

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
        margin: "1mm 0 1.2mm",
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

function PhotoPane({
  imageUrl,
  onPick,
  alt,
}: {
  imageUrl: string;
  onPick?: () => void;
  alt: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        minHeight: "70mm",
        border: RULE,
        background: "#fff",
        overflow: "hidden",
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
      ) : null}
      <button
        type="button"
        className="sp-scene-map-pick"
        onClick={onPick}
        aria-label={imageUrl ? "เปลี่ยนภาพถ่ายประกอบคดี" : "แทรกภาพถ่ายประกอบคดี"}
        style={{
          position: "absolute",
          inset: 0,
          border: "none",
          background: "transparent",
          cursor: onPick ? "pointer" : "default",
          padding: 0,
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
      <Dot aria-label={ariaLabel} value={value} onChange={onChange} flex minCh={6} />
      <span style={{ flexShrink: 0 }}>{role}</span>
    </Row>
  );
}

export function OfficialCasePhotoDocument({
  fields,
  onChange,
  onPickPhoto,
}: {
  fields: CasePhotoFields;
  onChange: <K extends keyof CasePhotoFields>(key: K, value: CasePhotoFields[K]) => void;
  onPickPhoto?: (pageIdx: number) => void;
}) {
  const extraPages = fields.extraPages ?? [];

  function patchExtra<K extends keyof CasePhotoExtraPage>(idx: number, key: K, value: CasePhotoExtraPage[K]) {
    onChange(
      "extraPages",
      extraPages.map((p, i) => (i === idx ? { ...p, [key]: value } : p)),
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      <Sheet index={0}>
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
            {CASE_PHOTO_FORM_TITLE}
          </h1>
        </header>

        <div style={{ flexShrink: 0 }}>
          <Row style={{ flexWrap: "nowrap" }}>
            <T>คดีที่</T>
            <Dot aria-label="คดีที่" value={fields.caseNo} onChange={(v) => onChange("caseNo", v)} flex minCh={8} />
            <T>สถานีตำรวจ</T>
            <Dot
              aria-label="สถานีตำรวจ"
              value={fields.station}
              onChange={(v) => onChange("station", v)}
              flex
              minCh={8}
            />
          </Row>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto auto 1fr",
              alignItems: "stretch",
              columnGap: "2mm",
              margin: "2mm 0 2.5mm",
              height: "22mm",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <T>คดีระหว่าง</T>
            </div>
            <div aria-hidden style={{ width: "6mm", height: "100%" }}>
              <svg
                viewBox="0 0 24 100"
                preserveAspectRatio="none"
                style={{ width: "100%", height: "100%", display: "block" }}
              >
                <path
                  d="M20 1 C9 1 7 14 7 25 L7 40 C7 47 3 50 3 50 C3 50 7 53 7 60 L7 75 C7 86 9 99 20 99"
                  fill="none"
                  stroke="#111"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
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
                  aria-label="ผู้กล่าวหาในคดี"
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
                  aria-label="ผู้ต้องหาในคดี"
                  value={fields.suspect}
                  onChange={(v) => onChange("suspect", v)}
                  flex
                  minCh={10}
                />
                <T>ผู้ต้องหา</T>
              </div>
            </div>
          </div>
          <Row style={{ flexWrap: "nowrap" }}>
            <T>ต้องหาว่า</T>
            <Dot
              aria-label="ต้องหาว่า"
              value={fields.charge}
              onChange={(v) => onChange("charge", v)}
              flex
              minCh={10}
            />
          </Row>
          <Row style={{ flexWrap: "nowrap" }}>
            <T>วันเวลาที่เกิดเหตุ</T>
            <Dot
              aria-label="วันเวลาที่เกิดเหตุ"
              value={fields.incidentDateTime}
              onChange={(v) => onChange("incidentDateTime", v)}
              flex
              minCh={10}
            />
          </Row>
          <Row style={{ flexWrap: "nowrap" }}>
            <T>เหตุเกิด</T>
            <Dot
              aria-label="เหตุเกิด"
              value={fields.incidentPlace}
              onChange={(v) => onChange("incidentPlace", v)}
              flex
              minCh={10}
            />
          </Row>
        </div>

        <PhotoPane
          imageUrl={fields.imageUrl}
          onPick={onPickPhoto ? () => onPickPhoto(0) : undefined}
          alt="ภาพถ่ายประกอบคดี"
        />
        <FieldLines
          value={fields.caption}
          onChange={(v) => onChange("caption", v)}
          lines={3}
          ariaLabel="คำอธิบายภาพถ่าย"
        />

        <p
          style={{
            margin: "0 0 1mm",
            textAlign: "justify",
            fontSize: BODY,
            lineHeight: 1.45,
            flexShrink: 0,
          }}
        >
          ขอรับรองว่าภาพถ่ายดังปรากฏข้างต้น ได้ถ่ายจากสถานที่เกิดเหตุในคดีนี้จริง และสามารถใช้เป็นพยานหลักฐานในการพิจารณาของศาลได้
        </p>
        <p
          style={{
            margin: "0 0 1.6mm",
            textAlign: "justify",
            fontSize: BODY,
            lineHeight: 1.45,
            flexShrink: 0,
          }}
        >
          ได้ตรวจดูและอ่านให้ฟังแล้ว รับว่าเป็นความจริงถูกต้อง จึงได้ลงลายมือชื่อไว้เป็นหลักฐาน
        </p>

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
            role="ผู้ต้องหาที่ ๑"
            ariaLabel="ลงชื่อผู้ต้องหาที่ 1"
            value={fields.signSuspect1}
            onChange={(v) => onChange("signSuspect1", v)}
          />
          <SignLine
            role="ผู้ต้องหาที่ ๒"
            ariaLabel="ลงชื่อผู้ต้องหาที่ 2"
            value={fields.signSuspect2}
            onChange={(v) => onChange("signSuspect2", v)}
          />
          <SignLine
            role="ผู้กล่าวหา"
            ariaLabel="ลงชื่อผู้กล่าวหา"
            value={fields.signComplainant}
            onChange={(v) => onChange("signComplainant", v)}
          />
          <SignLine
            role="พงส./บันทึก/อ่าน"
            ariaLabel="ลงชื่อพงส. บันทึก อ่าน"
            value={fields.signOfficer}
            onChange={(v) => onChange("signOfficer", v)}
          />
          <Row
            style={{
              flexWrap: "nowrap",
              marginBottom: 0,
              minHeight: SIGN_LINE,
              lineHeight: SIGN_LINE,
              gridColumn: "1 / -1",
            }}
          >
            <span style={{ flexShrink: 0 }}>ตำแหน่ง</span>
            <Dot
              aria-label="ตำแหน่งพนักงานสอบสวน"
              value={fields.officerPosition}
              onChange={(v) => onChange("officerPosition", v)}
              flex
              minCh={8}
            />
          </Row>
        </div>
      </Sheet>

      {extraPages.map((page, extraIdx) => {
        const sheetIndex = extraIdx + 1;
        return (
          <Sheet key={page.id} index={sheetIndex}>
            <p style={{ margin: "0 0 5mm", textAlign: "center", fontSize: BODY, flexShrink: 0 }}>
              {thaiNumeral(sheetIndex + 1)}
            </p>
            <PhotoPane
              imageUrl={page.imageUrl}
              onPick={onPickPhoto ? () => onPickPhoto(sheetIndex) : undefined}
              alt={`ภาพถ่ายประกอบคดี หน้า ${sheetIndex + 1}`}
            />
            <FieldLines
              value={page.caption}
              onChange={(v) => patchExtra(extraIdx, "caption", v)}
              lines={6}
              ariaLabel={`คำอธิบายภาพถ่าย หน้า ${sheetIndex + 1}`}
            />
          </Sheet>
        );
      })}
    </div>
  );
}
