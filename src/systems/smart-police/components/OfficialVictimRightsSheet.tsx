"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  VICTIM_RIGHTS_FORM_TITLE_P1,
  VICTIM_RIGHTS_FORM_TITLE_P2,
  VICTIM_RIGHTS_SUBTITLE_P1,
} from "@/lib/smart-police/form-templates/official-form-catalog";
import type { VictimInvolvement, VictimRightsFields } from "@/lib/smart-police/form-templates/victim-rights";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "13pt";
const SMALL = "11pt";
const LIST = "10.5pt";
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
  return <span style={{ flexShrink: 0 }}>{children}</span>;
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
        padding: "12mm 14mm 10mm",
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

function SignPair({
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
    <div style={{ margin: "0 0 2.2mm" }}>
      <Row style={{ flexWrap: "nowrap", marginBottom: "0.2mm" }}>
        <T>(ลงชื่อ)</T>
        <Dot aria-label={`ลงชื่อ${role}`} value={sign} onChange={onSign} flex minCh={8} />
        <T>{role}</T>
      </Row>
      <Row style={{ flexWrap: "nowrap", width: "78%", marginLeft: "12mm", marginBottom: 0 }}>
        <T>(</T>
        <Dot aria-label={`ชื่อตัวบรรจง${role}`} value={paren} onChange={onParen} flex minCh={6} />
        <T>)</T>
      </Row>
    </div>
  );
}

function InvolvementBox({
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
        display: "flex",
        alignItems: "flex-start",
        gap: "2.2mm",
        width: "100%",
        margin: "0 0 1.4mm",
        padding: 0,
        border: "none",
        background: "transparent",
        font: "inherit",
        textAlign: "left",
        cursor: "pointer",
        lineHeight: 1.4,
        fontSize: SMALL,
      }}
    >
      <span
        aria-hidden
        style={{
          width: "4.2mm",
          height: "4.2mm",
          marginTop: "1.1mm",
          flexShrink: 0,
          border: RULE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "9pt",
          lineHeight: 1,
        }}
      >
        {checked ? "✓" : ""}
      </span>
      <span>{label}</span>
    </button>
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
    <div style={{ position: "relative", margin: "0 0 1.5mm" }}>
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

export function OfficialVictimRightsDocument({
  fields,
  onChange,
}: {
  fields: VictimRightsFields;
  onChange: <K extends keyof VictimRightsFields>(key: K, value: VictimRightsFields[K]) => void;
}) {
  function setInvolvement(next: VictimInvolvement) {
    onChange("involvement", fields.involvement === next ? "" : next);
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <Sheet index={0}>
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
            {VICTIM_RIGHTS_FORM_TITLE_P1}
          </h1>
          <p style={{ margin: "1mm 0 0", fontSize: SMALL, fontWeight: 700, lineHeight: 1.35 }}>
            {VICTIM_RIGHTS_SUBTITLE_P1}
          </p>
        </header>

        <div style={{ width: "58%", marginLeft: "auto", flexShrink: 0, marginBottom: "2mm" }}>
          <Row style={{ flexWrap: "nowrap" }}>
            <T>สถานที่บันทึก</T>
            <Dot aria-label="สถานที่บันทึก" value={fields.place} onChange={(v) => onChange("place", v)} flex />
          </Row>
          <Row style={{ flexWrap: "nowrap" }}>
            <T>วันที่</T>
            <Dot aria-label="วันที่" value={fields.datedDay} onChange={(v) => onChange("datedDay", v)} minCh={3} />
            <T>เดือน</T>
            <Dot aria-label="เดือน" value={fields.datedMonth} onChange={(v) => onChange("datedMonth", v)} flex minCh={5} />
            <T>พ.ศ.</T>
            <Dot aria-label="พ.ศ." value={fields.datedYear} onChange={(v) => onChange("datedYear", v)} minCh={5} />
          </Row>
        </div>

        <Row>
          <T>ในคดีอาญาที่</T>
          <Dot
            aria-label="ในคดีอาญาที่"
            value={fields.caseNumber}
            onChange={(v) => onChange("caseNumber", v)}
            flex
          />
          <T>ข้าพเจ้า (ยศ, ชื่อ-ชื่อสกุล)</T>
          <Dot
            aria-label="ชื่อผู้แจ้งสิทธิ"
            value={fields.officerName}
            onChange={(v) => onChange("officerName", v)}
            flex
          />
        </Row>
        <Row>
          <T>ตำแหน่ง</T>
          <Dot
            aria-label="ตำแหน่งผู้แจ้งสิทธิ"
            value={fields.officerPosition}
            onChange={(v) => onChange("officerPosition", v)}
            flex
          />
          <T>ได้แจ้งให้</T>
        </Row>
        <Row>
          <T>ผู้เสียหาย/ทายาทผู้เสียหาย ที่อยู่</T>
          <Dot
            aria-label="ที่อยู่ผู้เสียหาย"
            value={fields.victimAddress}
            onChange={(v) => onChange("victimAddress", v)}
            flex
          />
        </Row>
        <Row>
          <T>ซึ่งเป็นผู้เสียหายหรือทายาทผู้เสียหาย ในกรณีความผิดฐาน</T>
          <Dot aria-label="ความผิดฐาน" value={fields.charge} onChange={(v) => onChange("charge", v)} flex />
        </Row>
        <p style={{ margin: "0.8mm 0 0.4mm", lineHeight: LINE, fontSize: BODY }}>
          โดยมีพฤติการณ์แห่งคดีโดยย่อดังนี้
        </p>
        <LinedNotes
          value={fields.caseBrief}
          onChange={(v) => onChange("caseBrief", v)}
          lines={3}
          ariaLabel="พฤติการณ์แห่งคดีโดยย่อ"
        />
        <p style={{ margin: "0.4mm 0 1mm", lineHeight: LINE, fontSize: BODY }}>
          จากการสอบสวนเบื้องต้นพบว่าผู้เสียหาย
        </p>
        <InvolvementBox
          checked={fields.involvement === "unrelated"}
          onToggle={() => setInvolvement("unrelated")}
          label="ไม่มีส่วนเกี่ยวข้องกับการกระทำความผิด และหากปรากฏในภายหลังว่าผู้เสียหายมีส่วนเกี่ยวข้องกับการกระทำความผิด จะแจ้งให้กรมคุ้มครองสิทธิและเสรีภาพ หรือสำนักงานยุติธรรมจังหวัดทราบ ต่อไป"
        />
        <InvolvementBox
          checked={fields.involvement === "related"}
          onToggle={() => setInvolvement("related")}
          label="อาจมีส่วนเกี่ยวข้องกับการกระทำความผิด"
        />
        <p style={{ margin: "1mm 0 1mm", fontSize: SMALL, lineHeight: 1.4 }}>
          โดยแจ้งให้ทราบว่า ผู้เสียหาย/ทายาทผู้เสียหาย อาจมีสิทธิดังนี้
        </p>
        <div style={{ fontSize: LIST, lineHeight: 1.38, flex: 1, minHeight: 0 }}>
          <p style={{ margin: "0 0 0.6mm" }}>
            ๑. กรณีได้รับบาดเจ็บสาหัสหรือกรณีทางเพศ
          </p>
          <p style={{ margin: "0 0 0.35mm", paddingLeft: "6mm" }}>
            ๑.๑ ค่าใช้จ่ายในการรักษาพยาบาล (ไม่เกิน ๓๐,๐๐๐ บาท)
          </p>
          <p style={{ margin: "0 0 0.35mm", paddingLeft: "6mm" }}>
            ๑.๒ ค่าฟื้นฟูสมรรถภาพทางร่างกายและจิตใจ (ไม่เกิน ๒๐,๐๐๐ บาท)
          </p>
          <p style={{ margin: "0 0 0.35mm", paddingLeft: "6mm" }}>
            ๑.๓ ค่าขาดประโยชน์ทำมาหาได้ในระหว่างที่ไม่สามารถประกอบการงานได้ตามปกติ (วันละไม่เกิน ๒๐๐
            บาท เป็นระยะเวลาไม่เกิน ๑ ปี)
          </p>
          <p style={{ margin: "0 0 1mm", paddingLeft: "6mm" }}>
            ๑.๔ ค่าตอบแทนความเสียหายอื่น ตามที่คณะกรรมการเห็นสมควร (ไม่เกิน ๓๐,๐๐๐ บาท)
          </p>
          <p style={{ margin: "0 0 0.6mm" }}>๒. กรณีถึงแก่ความตาย</p>
          <p style={{ margin: "0 0 0.35mm", paddingLeft: "6mm" }}>
            ๒.๑ ค่าตอบแทน (ตั้งแต่ ๓๐,๐๐๐ บาท – ๑๐๐,๐๐๐ บาท)
          </p>
          <p style={{ margin: "0 0 0.35mm", paddingLeft: "6mm" }}>๒.๒ ค่าจัดการศพ (๒๐,๐๐๐ บาท)</p>
          <p style={{ margin: "0 0 0.35mm", paddingLeft: "6mm" }}>
            ๒.๓ ค่าขาดอุปการะเลี้ยงดู (ไม่เกิน ๓๐,๐๐๐ บาท)
          </p>
          <p style={{ margin: "0 0 1mm", paddingLeft: "6mm" }}>
            ๒.๔ ค่าเสียหายอื่น ตามที่คณะกรรมการเห็นสมควร (ไม่เกิน ๓๐,๐๐๐ บาท)
          </p>
          <p style={{ margin: "0 0 1mm" }}>
            ๓. ในการยื่นขอรับค่าตอบแทนผู้เสียหาย ผู้เสียหายไม่ต้องเสียค่าธรรมเนียมใด ๆ โดยไปยื่นขอรับค่าตอบแทนผู้เสียหายที่
            สำนักงานช่วยเหลือทางการเงินแก่ผู้เสียหายและจำเลยในคดีอาญา หรือสำนักงานยุติธรรมจังหวัด
          </p>
          <p style={{ margin: "0 0 1mm" }}>
            ๔. ในการยื่นคำขอรับค่าตอบแทนผู้เสียหาย ต้องยื่นภายในหนึ่งปี นับแต่วันที่ได้รู้ถึงการกระทำผิด
          </p>
          <p style={{ margin: "0 0 1.5mm" }}>
            ๕. การยื่นขอรับค่าตอบแทนผู้เสียหาย ตาม พ.ร.บ. นี้ไม่เป็นการตัดสิทธิหรือประโยชน์ที่ผู้เสียหายพึงได้รับตามกฎหมายอื่น
          </p>
          <p style={{ margin: 0 }}>
            พนักงานสอบสวนได้จัดทำบันทึกนี้ขึ้นสองฉบับ และมอบสำเนาให้ผู้เสียหาย/ทายาทผู้เสียหาย รับไว้แล้ว
            จึงให้ลงลายมือชื่อไว้เป็นหลักฐาน
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: "8mm",
            marginTop: "3mm",
            flexShrink: 0,
          }}
        >
          <SignPair
            role="ผู้เสียหาย/ทายาทผู้เสียหาย"
            sign={fields.signVictim}
            paren={fields.signVictimParen}
            onSign={(v) => onChange("signVictim", v)}
            onParen={(v) => onChange("signVictimParen", v)}
          />
          <SignPair
            role="ผู้แจ้งสิทธิ/บันทึก"
            sign={fields.signOfficer}
            paren={fields.signOfficerParen}
            onSign={(v) => onChange("signOfficer", v)}
            onParen={(v) => onChange("signOfficerParen", v)}
          />
        </div>
        <p
          style={{
            margin: "auto 0 0",
            fontSize: "9pt",
            textAlign: "center",
            lineHeight: 1.35,
            flexShrink: 0,
          }}
        >
          หากมีข้อสงสัยประการใด โปรดติดต่อกรมคุ้มครองสิทธิและเสรีภาพ กระทรวงยุติธรรม โทร. ๑๑๑๑ กด ๗๗
        </p>
      </Sheet>

      <Sheet index={1}>
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
            {VICTIM_RIGHTS_FORM_TITLE_P2}
          </h1>
        </header>

        <div style={{ width: "58%", marginLeft: "auto", flexShrink: 0, marginBottom: "3mm" }}>
          <Row style={{ flexWrap: "nowrap" }}>
            <T>สถานที่บันทึก</T>
            <Dot aria-label="สถานที่บันทึกหน้า 2" value={fields.place} onChange={(v) => onChange("place", v)} flex />
          </Row>
          <Row style={{ flexWrap: "nowrap" }}>
            <T>วันที่</T>
            <Dot aria-label="วันที่หน้า 2" value={fields.datedDay} onChange={(v) => onChange("datedDay", v)} minCh={3} />
            <T>เดือน</T>
            <Dot
              aria-label="เดือนหน้า 2"
              value={fields.datedMonth}
              onChange={(v) => onChange("datedMonth", v)}
              flex
              minCh={5}
            />
            <T>พ.ศ.</T>
            <Dot aria-label="พ.ศ. หน้า 2" value={fields.datedYear} onChange={(v) => onChange("datedYear", v)} minCh={5} />
          </Row>
        </div>

        <Row>
          <T>วันนี้เวลา</T>
          <Dot aria-label="เวลาที่แจ้งสิทธิ" value={fields.time} onChange={(v) => onChange("time", v)} minCh={6} />
          <T>น. ข้าพเจ้า (ยศ, ชื่อ-ชื่อสกุล)</T>
          <Dot
            aria-label="ชื่อผู้แจ้งสิทธิหน้า 2"
            value={fields.officerName}
            onChange={(v) => onChange("officerName", v)}
            flex
          />
        </Row>
        <Row>
          <T>ตำแหน่ง</T>
          <Dot
            aria-label="ตำแหน่งหน้า 2"
            value={fields.officerPosition}
            onChange={(v) => onChange("officerPosition", v)}
            flex
          />
          <T>ได้แจ้งให้ผู้เสียหาย</T>
        </Row>
        <Row>
          <T>ที่อยู่</T>
          <Dot
            aria-label="ที่อยู่ผู้เสียหายหน้า 2"
            value={fields.victimAddress}
            onChange={(v) => onChange("victimAddress", v)}
            flex
          />
        </Row>
        <Row>
          <T>ซึ่งมี</T>
          <Dot
            aria-label="ผู้ต้องหาหรือผู้ซึ่งอาจตกเป็นจำเลย"
            value={fields.suspect}
            onChange={(v) => onChange("suspect", v)}
            flex
          />
          <T>เป็นผู้ต้องหาหรือผู้ซึ่งอาจตกเป็นจำเลย</T>
        </Row>
        <Row>
          <T>ในคดีอาญาฐาน</T>
          <Dot
            aria-label="คดีอาญาฐาน"
            value={fields.charge}
            onChange={(v) => onChange("charge", v)}
            flex
          />
        </Row>
        <p style={{ margin: "2mm 0 1.5mm", lineHeight: LINE, fontSize: BODY }}>
          ทราบถึงสิทธิตามกฎหมายดังต่อไปนี้
        </p>
        <p style={{ margin: "0 0 4mm", textAlign: "justify", fontSize: BODY, lineHeight: 1.55 }}>
          ผู้เสียหายมีสิทธิที่จะเรียกเอาค่าสินไหมทดแทนเพราะเหตุได้รับอันตรายแก่ชีวิต ร่างกาย จิตใจ หรือได้รับความเสื่อมเสียต่อเสรีภาพในร่างกายชื่อเสียงหรือได้รับความเสียหายในทางทรัพย์สินอันเนื่องมาจากการกระทำความผิดของจำเลย
          ผู้เสียหายจะยื่นคำร้องต่อศาลที่พิจารณาคดีอาญาขอให้บังคับจำเลยชดใช้ค่าสินไหมทดแทนแก่ตนก็ได้
          (ตามประมวลกฎหมายวิธีพิจารณาความอาญา มาตรา ๔๔/๑ และตาม พ.ร.บ. ค่าตอบแทนและค่าทดแทนและค่าใช้จ่ายแก่จำเลยในคดีอาญา
          พ.ศ. ๒๕๔๔ มาตรา ๑๗, ๑๘)
        </p>
        <p style={{ margin: "0 0 8mm", textAlign: "justify", fontSize: BODY, lineHeight: 1.55 }}>
          ผู้เสียหายได้รับทราบสิทธิของผู้เสียหายดังกล่าวข้างต้นแล้ว จึงลงลายมือชื่อไว้เป็นหลักฐาน อ่านให้ฟังแล้วรับว่าถูกต้อง
        </p>

        <div style={{ width: "72%", marginLeft: "auto", flexShrink: 0 }}>
          <SignPair
            role="ผู้เสียหาย"
            sign={fields.p2SignVictim}
            paren={fields.p2SignVictimParen}
            onSign={(v) => onChange("p2SignVictim", v)}
            onParen={(v) => onChange("p2SignVictimParen", v)}
          />
          <SignPair
            role="ผู้แจ้งสิทธิ/บันทึก/อ่าน"
            sign={fields.p2SignOfficer}
            paren={fields.p2SignOfficerParen}
            onSign={(v) => onChange("p2SignOfficer", v)}
            onParen={(v) => onChange("p2SignOfficerParen", v)}
          />
          <Row style={{ flexWrap: "nowrap", width: "86%", marginLeft: "10mm" }}>
            <T>ตำแหน่ง</T>
            <Dot
              aria-label="ตำแหน่งผู้แจ้งสิทธิตัวบรรจง"
              value={fields.p2OfficerPosition}
              onChange={(v) => onChange("p2OfficerPosition", v)}
              flex
            />
          </Row>
          <SignPair
            role="พยาน"
            sign={fields.p2SignWitness}
            paren={fields.p2SignWitnessParen}
            onSign={(v) => onChange("p2SignWitness", v)}
            onParen={(v) => onChange("p2SignWitnessParen", v)}
          />
        </div>

        <div style={{ marginTop: "auto", width: "55%" }}>
          <T>หมายเหตุ</T>
          <LinedNotes
            value={fields.note}
            onChange={(v) => onChange("note", v)}
            lines={3}
            ariaLabel="หมายเหตุ"
          />
        </div>
      </Sheet>
    </div>
  );
}
