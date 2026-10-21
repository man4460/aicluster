"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SCENE_MAP_FORM_TITLE } from "@/lib/smart-police/form-templates/official-form-catalog";
import type { SceneMapFields } from "@/lib/smart-police/form-templates/scene-map";

const PAGE = { w: "297mm", h: "210mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "13pt";
const SMALL = "11pt";
const TITLE = "15pt";
const LINE = "6.2mm";
const RULE = "0.55pt solid #111";

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
        margin: "0 0 0.6mm",
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

function SignRow({
  value,
  onChange,
  role,
}: {
  value: string;
  onChange: (v: string) => void;
  role: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "1.5mm",
        minHeight: LINE,
        lineHeight: LINE,
        fontSize: BODY,
      }}
    >
      <span style={{ flexShrink: 0 }}>(ลงชื่อ)</span>
      <Dot aria-label={`ลงชื่อ${role}`} value={value} onChange={onChange} flex minCh={8} />
      <span style={{ flexShrink: 0 }}>{role}</span>
    </div>
  );
}

export function OfficialSceneMapDocument({
  fields,
  onChange,
  onPickMap,
}: {
  fields: SceneMapFields;
  onChange: <K extends keyof SceneMapFields>(key: K, value: SceneMapFields[K]) => void;
  onPickMap?: () => void;
}) {
  return (
    <article
      data-sheet-index={0}
      className="sp-a4-sheet sp-a4-landscape relative mx-auto bg-white text-[#111] shadow-xl print:shadow-none"
      style={{
        width: PAGE.w,
        height: PAGE.h,
        boxSizing: "border-box",
        overflow: "hidden",
        padding: "14mm 14mm 12mm",
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
            lineHeight: 1.2,
            textDecoration: "underline",
            textUnderlineOffset: "1mm",
          }}
        >
          {SCENE_MAP_FORM_TITLE}
        </h1>
      </header>

      <div style={{ flexShrink: 0, marginBottom: "2.5mm" }}>
        <Row>
          <L>คดีระหว่าง</L>
          <Dot
            aria-label="คดีระหว่าง"
            value={fields.caseBetween}
            onChange={(v) => onChange("caseBetween", v)}
            flex
            minCh={5}
          />
          <L>ผู้กล่าวหา</L>
          <Dot
            aria-label="ผู้กล่าวหา"
            value={fields.complainantLine}
            onChange={(v) => onChange("complainantLine", v)}
            flex
            minCh={5}
          />
          <L>ผู้ต้องหา</L>
          <Dot
            aria-label="ผู้ต้องหา"
            value={fields.suspectLine}
            onChange={(v) => onChange("suspectLine", v)}
            flex
            minCh={5}
          />
          <L>ฐานความผิด</L>
          <Dot
            aria-label="ฐานความผิด"
            value={fields.chargeText}
            onChange={(v) => onChange("chargeText", v)}
            flex
            minCh={6}
          />
        </Row>
        <Row>
          <L>ที่เกิดเหตุ</L>
          <Dot
            aria-label="ที่เกิดเหตุ"
            value={fields.location}
            onChange={(v) => onChange("location", v)}
            flex
            minCh={6}
          />
          <L>หมู่ที่</L>
          <Dot aria-label="หมู่ที่" value={fields.moo} onChange={(v) => onChange("moo", v)} minCh={3} />
          <L>ตรอก/ซอย</L>
          <Dot
            aria-label="ตรอกหรือซอย"
            value={fields.alley}
            onChange={(v) => onChange("alley", v)}
            flex
            minCh={4}
          />
          <L>ถนน</L>
          <Dot aria-label="ถนน" value={fields.road} onChange={(v) => onChange("road", v)} flex minCh={4} />
          <L>ตำบล</L>
          <Dot
            aria-label="ตำบล"
            value={fields.tambon}
            onChange={(v) => onChange("tambon", v)}
            flex
            minCh={4}
          />
          <L>อำเภอ</L>
          <Dot
            aria-label="อำเภอ"
            value={fields.amphoe}
            onChange={(v) => onChange("amphoe", v)}
            flex
            minCh={4}
          />
          <L>จังหวัด</L>
          <Dot
            aria-label="จังหวัด"
            value={fields.province}
            onChange={(v) => onChange("province", v)}
            flex
            minCh={4}
          />
        </Row>
        <Row>
          <L>เมื่อวันที่</L>
          <Dot aria-label="วันที่เกิดเหตุ" value={fields.day} onChange={(v) => onChange("day", v)} minCh={3} />
          <L>เดือน</L>
          <Dot
            aria-label="เดือนเกิดเหตุ"
            value={fields.month}
            onChange={(v) => onChange("month", v)}
            flex
            minCh={6}
          />
          <L>พ.ศ.</L>
          <Dot
            aria-label="พ.ศ. เกิดเหตุ"
            value={fields.yearBe}
            onChange={(v) => onChange("yearBe", v)}
            minCh={5}
          />
          <L>เวลาประมาณ</L>
          <Dot
            aria-label="เวลาประมาณ"
            value={fields.approxTime}
            onChange={(v) => onChange("approxTime", v)}
            flex
            minCh={8}
          />
          <L>น.</L>
        </Row>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "1.15fr 0.85fr",
          columnGap: "4mm",
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            position: "relative",
            border: RULE,
            background: "#fff",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {fields.mapImageUrl ? (
            <img
              src={fields.mapImageUrl}
              alt="แผนที่สังเขปสถานที่เกิดเหตุ"
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          ) : null}
          <button
            type="button"
            className="sp-scene-map-pick"
            onClick={onPickMap}
            aria-label={fields.mapImageUrl ? "เปลี่ยนรูปแผนที่สังเขป" : "แทรกรูปแผนที่สังเขป"}
            style={{
              position: "absolute",
              inset: 0,
              border: "none",
              background: "transparent",
              cursor: onPickMap ? "pointer" : "default",
              padding: 0,
            }}
          />
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: "2mm",
              right: "2.5mm",
              fontSize: SMALL,
              fontWeight: 700,
              lineHeight: 1.2,
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            ↑เหนือ
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            minHeight: 0,
          }}
        >
          <p
            style={{
              margin: "0 0 1mm",
              textAlign: "center",
              fontWeight: 700,
              fontSize: BODY,
              flexShrink: 0,
            }}
          >
            คำอธิบายแผนที่
          </p>
          <div style={{ position: "relative", flex: 1, minHeight: 0, overflow: "hidden" }}>
            <div aria-hidden>
              {Array.from({ length: 22 }, (_, i) => (
                <div
                  key={`note-rule-${i}`}
                  style={{
                    height: LINE,
                    borderBottom: "0.5pt dotted #111",
                    boxSizing: "border-box",
                  }}
                />
              ))}
            </div>
            <textarea
              aria-label="คำอธิบายแผนที่"
              value={fields.notes}
              onChange={(e) => onChange("notes", e.target.value)}
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

          <div
            style={{
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.4mm",
              marginTop: "2.5mm",
            }}
          >
            <SignRow
              role="ผู้กล่าวหา"
              value={fields.signComplainant}
              onChange={(v) => onChange("signComplainant", v)}
            />
            <SignRow
              role="ผู้ต้องหา"
              value={fields.signSuspect1}
              onChange={(v) => onChange("signSuspect1", v)}
            />
            <SignRow
              role="ผู้ต้องหา"
              value={fields.signSuspect2}
              onChange={(v) => onChange("signSuspect2", v)}
            />
            <SignRow
              role="พยาน"
              value={fields.signWitness1}
              onChange={(v) => onChange("signWitness1", v)}
            />
            <SignRow
              role="พยาน"
              value={fields.signWitness2}
              onChange={(v) => onChange("signWitness2", v)}
            />
            <SignRow
              role="บันทึก / อ่าน / ผู้จัดทำ"
              value={fields.signOfficer}
              onChange={(v) => onChange("signOfficer", v)}
            />
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "1.5mm",
                minHeight: LINE,
                lineHeight: LINE,
              }}
            >
              <span style={{ flexShrink: 0 }}>(</span>
              <Dot
                aria-label="ชื่อผู้จัดทำในวงเล็บ"
                value={fields.signOfficerParen}
                onChange={(v) => onChange("signOfficerParen", v)}
                flex
                minCh={8}
              />
              <span style={{ flexShrink: 0 }}>)</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "1.5mm",
                minHeight: LINE,
                lineHeight: LINE,
              }}
            >
              <span style={{ flexShrink: 0 }}>(ตำแหน่ง)</span>
              <Dot
                aria-label="ตำแหน่งผู้จัดทำ"
                value={fields.signOfficerPosition}
                onChange={(v) => onChange("signOfficerPosition", v)}
                flex
                minCh={8}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
