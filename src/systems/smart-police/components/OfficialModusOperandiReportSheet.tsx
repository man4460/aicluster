"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { splitArrestTextByLines } from "@/lib/smart-police/form-templates/arrest-record";
import {
  MODUS_EQUIPMENT_ITEMS,
  MODUS_METHOD_ITEMS,
  MODUS_MOTIVE_ITEMS,
  MODUS_PLACE_ITEMS,
  MODUS_PROFILE_FOUND,
  MODUS_PROFILE_NOT_FOUND,
  MODUS_PROPERTY_ITEMS,
  MODUS_TRACE_ITEMS,
  MODUS_VEHICLE_ITEMS,
  MODUS_WEAPON_ITEMS,
  type ModusOperandiReportFields,
} from "@/lib/smart-police/form-templates/modus-operandi-report";

const PAGE = { w: "210mm", h: "297mm" };
const FONT = '"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif';
const BODY = "12pt";
const LINE = "6mm";
const LABEL_COL = "22mm";
const NARR_W = 119;

type Fields = ModusOperandiReportFields;
type Patch = <K extends keyof Fields>(key: K, value: Fields[K]) => void;

function Fill({
  aria,
  value,
  onChange,
  w,
  grow,
  center,
}: {
  aria: string;
  value: string;
  onChange: (v: string) => void;
  w?: string;
  grow?: boolean;
  center?: boolean;
}) {
  const input = (
    <input
      aria-label={aria}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
      className="sp-word-field"
      style={{
        display: "inline-block",
        width: grow ? "100%" : w ?? "30mm",
        minWidth: 0,
        fontFamily: "inherit",
        fontSize: BODY,
        lineHeight: LINE,
        textAlign: center ? "center" : "left",
        textIndent: "1.5mm",
        verticalAlign: "baseline",
      }}
    />
  );
  if (grow) {
    return (
      <span style={{ display: "inline-flex", flex: "1 1 24mm", minWidth: "14mm" }}>{input}</span>
    );
  }
  return input;
}

function Check({
  label,
  on,
  onToggle,
  after,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
  after?: ReactNode;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: "1.2mm",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      <span
        role="checkbox"
        aria-checked={on}
        aria-label={label}
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onToggle();
          }
        }}
        style={{
          display: "inline-block",
          width: "3.6mm",
          height: "3.6mm",
          border: "1pt solid #111",
          lineHeight: "3.4mm",
          textAlign: "center",
          fontSize: "9pt",
          cursor: "pointer",
          flexShrink: 0,
          alignSelf: "center",
        }}
      >
        {on ? "✓" : ""}
      </span>
      <span>{label}</span>
      {after}
    </span>
  );
}

type Item = { id: string; label: string; after?: ReactNode };

function toItems(labels: readonly string[], prefix: string): Item[] {
  return labels.map((label) => ({ id: `${prefix}|${label}`, label }));
}

function CheckWrap({
  list,
  on,
  toggle,
}: {
  list: Item[];
  on: (id: string) => boolean;
  toggle: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "baseline",
        columnGap: "5mm",
        rowGap: "0mm",
        lineHeight: LINE,
        minWidth: 0,
      }}
    >
      {list.map((it) => (
        <Check
          key={it.id}
          label={it.label}
          on={on(it.id)}
          onToggle={() => toggle(it.id)}
          after={it.after}
        />
      ))}
    </div>
  );
}

function Row({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "baseline",
        columnGap: "2mm",
        lineHeight: LINE,
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Dots({ w }: { w?: string }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        flex: w ? undefined : 1,
        width: w,
        minWidth: "12mm",
        borderBottom: "0.5pt dotted #111",
        height: "1em",
        alignSelf: "flex-end",
      }}
    />
  );
}

function Labelled({
  label,
  list,
  on,
  toggle,
  w = LABEL_COL,
  extra,
}: {
  label: string;
  list: Item[];
  on: (label: string) => boolean;
  toggle: (label: string) => void;
  w?: string;
  extra?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", flexShrink: 0 }}>
      <div style={{ width: w, flexShrink: 0, fontWeight: 700, lineHeight: LINE }}>{label}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <CheckWrap list={list} on={on} toggle={toggle} />
        {extra}
      </div>
    </div>
  );
}

function Sheet({ index, children }: { index: number; children: ReactNode }) {
  return (
    <article
      data-sheet-index={index}
      className="sp-a4-sheet relative mx-auto bg-white text-[#111] shadow-xl print:shadow-none"
      style={{
        width: PAGE.w,
        minHeight: PAGE.h,
        boxSizing: "border-box",
        padding: "12mm 15mm 12mm",
        fontFamily: FONT,
        fontSize: BODY,
        lineHeight: LINE,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {children}
    </article>
  );
}

function useLineCounter(widthMm: number): (text: string) => number {
  const ref = useRef<HTMLDivElement | null>(null);
  const [, setReady] = useState(false);
  useEffect(() => {
    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = [
      "position:absolute",
      "left:-9999px",
      "top:0",
      `width:${widthMm}mm`,
      "visibility:hidden",
      "pointer-events:none",
      `font-family:${FONT}`,
      `font-size:${BODY}`,
      `line-height:${LINE}`,
      "white-space:pre-wrap",
      "overflow-wrap:anywhere",
    ].join(";");
    document.body.appendChild(host);
    ref.current = host;
    setReady(true);
    return () => {
      host.remove();
      ref.current = null;
    };
  }, [widthMm]);
  return (text: string): number => {
    const host = ref.current;
    if (!host) return Math.max(1, Math.ceil(text.length / 55));
    host.textContent = text;
    const lh = parseFloat(getComputedStyle(host).lineHeight) || 0;
    if (!(lh > 0)) return Math.max(1, Math.ceil(text.length / 55));
    return Math.max(1, Math.round(host.scrollHeight / lh));
  };
}

function splitNarrative(
  text: string,
  countFirst: (t: string) => number,
  firstCap: number,
  countRest: (t: string) => number,
  restCap: number,
): string[] {
  const out: string[] = [];
  let rest = text;
  let cap = firstCap;
  let counter = countFirst;
  for (let guard = 0; guard < 80; guard += 1) {
    if (!rest) break;
    if (counter(rest) <= cap) {
      out.push(rest);
      rest = "";
      break;
    }
    const [head, tail] = splitArrestTextByLines(rest, cap, 0, (t) => counter(t));
    if (!tail) {
      out.push(rest);
      rest = "";
      break;
    }
    out.push(head);
    rest = tail;
    cap = restCap;
    counter = countRest;
  }
  if (out.length === 0) out.push("");
  return out;
}

function LinedArea({
  aria,
  value,
  onChange,
  lines,
}: {
  aria: string;
  value: string;
  onChange: (v: string) => void;
  lines: number;
}) {
  const h = `calc(${LINE} * ${lines})`;
  return (
    <div style={{ position: "relative", height: h, flexShrink: 0 }}>
      {Array.from({ length: lines }, (_, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `calc(${LINE} * ${i + 1} - 1mm)`,
            borderTop: "0.5pt dotted #111",
          }}
        />
      ))}
      <textarea
        aria-label={aria}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="sp-lined-notes"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: h,
          fontFamily: "inherit",
          fontSize: BODY,
          lineHeight: LINE,
          resize: "none",
          overflow: "hidden",
        }}
      />
    </div>
  );
}

function SignBlock({
  name,
  position,
  onName,
  onPosition,
}: {
  name: string;
  position: string;
  onName: (v: string) => void;
  onPosition: (v: string) => void;
}) {
  return (
    <div style={{ width: "56mm", flexShrink: 0, textAlign: "center" }}>
      <div style={{ lineHeight: LINE }}>(ลงชื่อ) .....……………………………</div>
      <div style={{ lineHeight: LINE, display: "flex", alignItems: "baseline", columnGap: "0mm" }}>
        <span>(</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <Fill aria="ชื่อผู้ลงนาม" value={name} onChange={onName} grow />
        </span>
        <span>)</span>
      </div>
      <div style={{ lineHeight: LINE, display: "flex", alignItems: "baseline" }}>
        <span>(ตำแหน่ง </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <Fill aria="ตำแหน่งผู้ลงนาม" value={position} onChange={onPosition} grow />
        </span>
        <span>)</span>
      </div>
    </div>
  );
}

function Tail({
  fields,
  onChange,
  on,
  toggle,
}: {
  fields: Fields;
  onChange: Patch;
  on: (label: string) => boolean;
  toggle: (label: string) => void;
}) {
  return (
    <div style={{ flexShrink: 0 }}>
      <Row>
        <span style={{ fontWeight: 700 }}>ที่</span>
        <Fill aria="ที่" value={fields.reportTo} onChange={(v) => onChange("reportTo", v)} grow />
      </Row>
      <Row>
        <span>เรียน</span>
        <span style={{ marginLeft: "9mm" }}>พนักงานสอบสวน</span>
      </Row>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          paddingLeft: "12mm",
          flexShrink: 0,
        }}
      >
        <Check
          label={MODUS_PROFILE_FOUND}
          on={on(MODUS_PROFILE_FOUND)}
          onToggle={() => toggle(MODUS_PROFILE_FOUND)}
        />
        <Check
          label={MODUS_PROFILE_NOT_FOUND}
          on={on(MODUS_PROFILE_NOT_FOUND)}
          onToggle={() => toggle(MODUS_PROFILE_NOT_FOUND)}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
        <SignBlock
          name={fields.reporterName}
          position={fields.reporterPosition}
          onName={(v) => onChange("reporterName", v)}
          onPosition={(v) => onChange("reporterPosition", v)}
        />
      </div>
      <Row style={{ justifyContent: "flex-end", columnGap: "3mm" }}>
        <Fill aria="วันที่" value={fields.signDate} onChange={(v) => onChange("signDate", v)} w="60mm" center />
      </Row>
    </div>
  );
}

export function OfficialModusOperandiReportDocument({
  fields,
  onChange,
  onPageCount,
}: {
  fields: Fields;
  onChange: Patch;
  onPageCount?: (n: number) => void;
}) {
  const countNarrow = useLineCounter(NARR_W);
  const countWide = useLineCounter(180);
  const NARR_FIRST = 10;
  const NARR_CONT = 40;
  const chunks = splitNarrative(fields.narrative, countNarrow, NARR_FIRST, countWide, NARR_CONT);
  const pageCount = 1 + chunks.length;
  const lastIndex = chunks.length - 1;

  useLayoutEffect(() => {
    onPageCount?.(pageCount);
  }, [onPageCount, pageCount]);

  const legacyOf = (id: string) => (id.includes("|") ? id.slice(id.indexOf("|") + 1) : id);
  const on = (id: string) => Boolean(fields.checks[id] ?? fields.checks[legacyOf(id)]);
  const toggle = (id: string) => {
    const next = { ...fields.checks };
    const value = !on(id);
    const legacy = legacyOf(id);
    if (legacy !== id) delete next[legacy];
    next[id] = value;
    onChange("checks", next);
  };

  const joinChunk = (index: number, value: string) => {
    const next = chunks.slice();
    next[index] = value;
    return next.join("");
  };

  const propertyList: Item[] = toItems(MODUS_PROPERTY_ITEMS.slice(0, 15), "prop").map((it) =>
    it.label === "รถยนต์"
      ? {
          ...it,
          after: (
            <span style={{ display: "inline-flex", alignItems: "baseline", columnGap: "1.5mm" }}>
              <span>(ล้อ</span>
              <Fill
                aria="ล้อรถยนต์"
                value={fields.propertyWheel}
                onChange={(v) => onChange("propertyWheel", v)}
                w="16mm"
              />
              <span>ประเภท</span>
              <Fill
                aria="ประเภทรถยนต์"
                value={fields.propertyCarType}
                onChange={(v) => onChange("propertyCarType", v)}
                w="26mm"
              />
              <span>)</span>
            </span>
          ),
        }
      : it,
  );

  return (
    <div className="flex flex-col gap-6 pb-8 print:gap-0">
      <Sheet index={0}>
        <h1
          style={{
            margin: 0,
            fontSize: "15pt",
            fontWeight: 700,
            textAlign: "center",
            lineHeight: "1.2",
            flexShrink: 0,
          }}
        >
          แบบรายการแผนประทุษกรรม
        </h1>
        <p style={{ margin: 0, fontSize: "9.5pt", lineHeight: "5mm", flexShrink: 0 }}>
          (เติมข้อความในช่องว่าง และกาเครื่องหมาย ✓ ใน{" "}
          <span
            style={{
              display: "inline-block",
              width: "3mm",
              height: "3mm",
              border: "0.8pt solid #111",
              verticalAlign: "middle",
              marginRight: "1mm",
            }}
          />{" "}
          หน้าข้อความที่ต้องการได้มากกว่าหนึ่งรายการ)
        </p>

        <Row>
          <span>ส่วนราชการ</span>
          <span>สถานีตำรวจ/หน่วยงาน</span>
          <Fill aria="สถานีตำรวจ/หน่วยงาน" value={fields.station} onChange={(v) => onChange("station", v)} grow />
          <span>กก.</span>
          <Fill aria="กก." value={fields.kk} onChange={(v) => onChange("kk", v)} w="18mm" />
          <span>บก.</span>
          <Fill aria="บก." value={fields.bk} onChange={(v) => onChange("bk", v)} w="18mm" />
        </Row>
        <Row>
          <span>ที่</span>
          <Fill aria="ที่" value={fields.docNo} onChange={(v) => onChange("docNo", v)} w="52mm" />
          <span>วันที่</span>
          <Fill aria="วันที่" value={fields.docDate} onChange={(v) => onChange("docDate", v)} w="38mm" />
          <span>บัญชีของกลางที่</span>
          <Fill
            aria="บัญชีของกลางที่"
            value={fields.evidenceBook}
            onChange={(v) => onChange("evidenceBook", v)}
            grow
          />
        </Row>
        <Row>
          <span>เรียน</span>
          <Fill aria="เรียน" value={fields.learnTo} onChange={(v) => onChange("learnTo", v)} grow />
        </Row>
        <Row>
          <span>เลขคดีที่</span>
          <Fill aria="เลขคดีที่" value={fields.caseNo} onChange={(v) => onChange("caseNo", v)} w="60mm" />
          <span>ข้อหา</span>
          <Fill aria="ข้อหา" value={fields.charge} onChange={(v) => onChange("charge", v)} grow />
        </Row>
        <Row>
          <span>ชื่อผู้ต้องหา</span>
          <Fill aria="ชื่อผู้ต้องหา" value={fields.suspectName} onChange={(v) => onChange("suspectName", v)} w="66mm" />
          <span>ชื่อผู้เสียหาย</span>
          <Fill aria="ชื่อผู้เสียหาย" value={fields.victimName} onChange={(v) => onChange("victimName", v)} grow />
        </Row>
        <Row>
          <span>สถานที่เกิดเหตุ</span>
          <Fill aria="สถานที่เกิดเหตุ" value={fields.placeName} onChange={(v) => onChange("placeName", v)} w="52mm" />
          <span>ซอย</span>
          <Fill aria="ซอย" value={fields.soi} onChange={(v) => onChange("soi", v)} w="32mm" />
          <span>ถนน</span>
          <Fill aria="ถนน" value={fields.road} onChange={(v) => onChange("road", v)} grow />
        </Row>
        <Row>
          <span>หมู่บ้าน/หมู่ที่</span>
          <Fill aria="หมู่บ้าน/หมู่ที่" value={fields.village} onChange={(v) => onChange("village", v)} w="30mm" />
          <span>ตำบล/แขวง</span>
          <Fill aria="ตำบล/แขวง" value={fields.subdistrict} onChange={(v) => onChange("subdistrict", v)} w="30mm" />
          <span>อำเภอ/เขต</span>
          <Fill aria="อำเภอ/เขต" value={fields.district} onChange={(v) => onChange("district", v)} w="30mm" />
          <span>จังหวัด</span>
          <Fill aria="จังหวัด" value={fields.province} onChange={(v) => onChange("province", v)} grow />
        </Row>
        <Row>
          <span>วัน เดือน ปี ที่เกิดเหตุ</span>
          <Fill aria="วันเกิดเหตุ" value={fields.eventDate} onChange={(v) => onChange("eventDate", v)} w="38mm" />
          <span>เวลา</span>
          <Fill aria="เวลาที่เกิดเหตุ" value={fields.eventTime} onChange={(v) => onChange("eventTime", v)} w="16mm" />
          <span>น. วันรับคำร้องทุกข์</span>
          <Fill
            aria="วันรับคำร้องทุกข์"
            value={fields.complaintDate}
            onChange={(v) => onChange("complaintDate", v)}
            w="32mm"
          />
          <span>ปจว.ข้อ</span>
          <Fill aria="ปจว.ข้อ" value={fields.pjvNo} onChange={(v) => onChange("pjvNo", v)} grow />
        </Row>
        <Row>
          <span>จำนวนคนร้าย</span>
          <Fill aria="จำนวนคนร้าย" value={fields.robberCount} onChange={(v) => onChange("robberCount", v)} w="16mm" />
          <span>คน (ผู้ใหญ่ ชาย</span>
          <Fill aria="คนร้ายผู้ใหญ่ชาย" value={fields.adultMale} onChange={(v) => onChange("adultMale", v)} w="14mm" />
          <span>คน หญิง</span>
          <Fill aria="คนร้ายผู้ใหญ่หญิง" value={fields.adultFemale} onChange={(v) => onChange("adultFemale", v)} w="14mm" />
          <span>คน), (เด็ก/เยาวชน ชาย</span>
          <Fill aria="คนร้ายเยาวชนชาย" value={fields.youthMale} onChange={(v) => onChange("youthMale", v)} w="14mm" />
          <span>คน หญิง</span>
          <Fill aria="คนร้ายเยาวชนหญิง" value={fields.youthFemale} onChange={(v) => onChange("youthFemale", v)} w="14mm" />
          <span>คน)</span>
        </Row>
        <Row>
          <span>จับกุมผู้ต้องหาได้</span>
          <Fill aria="จับกุมผู้ต้องหาได้" value={fields.arrestedCount} onChange={(v) => onChange("arrestedCount", v)} w="16mm" />
          <span>คน ยังหลบหนีอยู่</span>
          <Fill aria="ยังหลบหนีอยู่" value={fields.escapedCount} onChange={(v) => onChange("escapedCount", v)} w="16mm" />
          <span>คน</span>
        </Row>

        <div style={{ display: "flex", alignItems: "flex-start", flexShrink: 0 }}>
          <div style={{ width: "26mm", flexShrink: 0, fontWeight: 700 }}>ผู้เสียหายเป็น</div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", columnGap: "3mm" }}>
            <div style={{ flex: "1 1 34mm", minWidth: 0 }}>
              <Row style={{ columnGap: "1.5mm" }}>
                <Check
                  label="ผู้ใหญ่"
                  on={on("ผู้ใหญ่")}
                  onToggle={() => toggle("ผู้ใหญ่")}
                  after={
                    <span style={{ display: "inline-flex", alignItems: "baseline", columnGap: "1.5mm" }}>
                      <span>อายุ</span>
                      <Fill
                        aria="ผู้เสียหายผู้ใหญ่อายุ"
                        value={fields.victimAdultAge}
                        onChange={(v) => onChange("victimAdultAge", v)}
                        w="14mm"
                      />
                      <span>ปี</span>
                    </span>
                  }
                />
              </Row>
              <Row style={{ columnGap: "1.5mm" }}>
                <Check
                  label="เด็ก/เยาวชน"
                  on={on("เด็ก/เยาวชน")}
                  onToggle={() => toggle("เด็ก/เยาวชน")}
                  after={
                    <span style={{ display: "inline-flex", alignItems: "baseline", columnGap: "1.5mm" }}>
                      <span>อายุ</span>
                      <Fill
                        aria="ผู้เสียหายเยาวชนอายุ"
                        value={fields.victimYouthAge}
                        onChange={(v) => onChange("victimYouthAge", v)}
                        w="14mm"
                      />
                      <span>ปี</span>
                    </span>
                  }
                />
              </Row>
            </div>
            <div style={{ flex: "0 0 18mm" }}>
              <Check label="เพศชาย" on={on("เพศชาย")} onToggle={() => toggle("เพศชาย")} />
              <Check label="เพศหญิง" on={on("เพศหญิง")} onToggle={() => toggle("เพศหญิง")} />
            </div>
            <div style={{ flex: "1 1 46mm", minWidth: 0 }}>
              <Check label="คนไทย" on={on("คนไทย")} onToggle={() => toggle("คนไทย")} />
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: "2mm" }}>
                <Check
                  label="ชาวต่างประเทศ"
                  on={on("ชาวต่างประเทศ")}
                  onToggle={() => toggle("ชาวต่างประเทศ")}
                  after={<span>(</span>}
                />
                <Check label="นักท่องเที่ยว" on={on("นักท่องเที่ยว")} onToggle={() => toggle("นักท่องเที่ยว")} />
                <Check label="ไม่ใช่" on={on("ไม่ใช่")} onToggle={() => toggle("ไม่ใช่")} after={<span>)</span>} />
              </div>
            </div>
            <div style={{ flex: "0 0 auto" }}>
              <Row style={{ columnGap: "2mm" }}>
                <span>จำนวนผู้เสียหาย</span>
                <Fill aria="จำนวนผู้เสียหาย" value={fields.victimCount} onChange={(v) => onChange("victimCount", v)} w="14mm" />
                <span>คน</span>
              </Row>
            </div>
          </div>
        </div>

        <Labelled
          label="จุดเกิดเหตุ"
          list={[
            ...toItems(MODUS_PLACE_ITEMS, "place"),
            {
              id: "place|อื่น ๆ",
              label: "อื่น ๆ",
              after: <Fill aria="จุดเกิดเหตุอื่น ๆ" value={fields.placeOther} onChange={(v) => onChange("placeOther", v)} w="44mm" />,
            },
          ]}
          on={on}
          toggle={toggle}
        />

        <div style={{ borderTop: "1.2pt solid #111", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <div style={{ width: "26mm", flexShrink: 0, fontWeight: 700, lineHeight: LINE }}>
              <div>ทรัพย์สินที่</div>
              <div>ถูกประทุษร้าย</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <CheckWrap
                list={[
                  ...propertyList,
                  {
                    id: "propElectric",
                    label: "เครื่องใช้ไฟฟ้า (ระบุ)",
                    after: (
                      <Fill
                        aria="เครื่องใช้ไฟฟ้า"
                        value={fields.propertyElectric}
                        onChange={(v) => onChange("propertyElectric", v)}
                        w="36mm"
                      />
                    ),
                  },
                  {
                    id: "propOther",
                    label: "อื่น ๆ",
                    after: (
                      <Fill aria="ทรัพย์สินอื่น ๆ" value={fields.propertyOther} onChange={(v) => onChange("propertyOther", v)} w="44mm" />
                    ),
                  },
                  {
                    id: "propValue",
                    label: "รวมมูลค่า",
                    after: (
                      <span style={{ display: "inline-flex", alignItems: "baseline", columnGap: "1.5mm" }}>
                        <Fill aria="รวมมูลค่า" value={fields.propertyValue} onChange={(v) => onChange("propertyValue", v)} w="36mm" />
                        <span>บาท</span>
                      </span>
                    ),
                  },
                ]}
                on={on}
                toggle={toggle}
              />
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1.2pt solid #111", flexShrink: 0 }}>
          <Labelled
            label="ยานพาหนะที่ใช้"
            w="26mm"
            list={[
              ...toItems(MODUS_VEHICLE_ITEMS, "veh"),
              {
                id: "veh|อื่น ๆ",
                label: "อื่น ๆ",
                after: (
                  <Fill aria="ยานพาหนะอื่น ๆ" value={fields.vehicleOther} onChange={(v) => onChange("vehicleOther", v)} w="40mm" />
                ),
              },
            ]}
            on={on}
            toggle={toggle}
          />
          <Row>
            <span>(ประเภท</span>
            <Fill aria="ประเภทยานพาหนะ" value={fields.vehicleType} onChange={(v) => onChange("vehicleType", v)} w="30mm" />
            <span>ยี่ห้อ</span>
            <Fill aria="ยี่ห้อยานพาหนะ" value={fields.vehicleBrand} onChange={(v) => onChange("vehicleBrand", v)} w="28mm" />
            <span>รุ่น</span>
            <Fill aria="รุ่นยานพาหนะ" value={fields.vehicleModel} onChange={(v) => onChange("vehicleModel", v)} w="26mm" />
            <span>สี</span>
            <Fill aria="สียานพาหนะ" value={fields.vehicleColor} onChange={(v) => onChange("vehicleColor", v)} w="22mm" />
            <span>หมายเลขทะเบียน</span>
            <Fill aria="หมายเลขทะเบียน" value={fields.vehiclePlate} onChange={(v) => onChange("vehiclePlate", v)} grow />
            <span>)</span>
          </Row>
        </div>

        <div style={{ borderTop: "1.2pt solid #111", flexShrink: 0 }}>
          <Labelled
            label="อาวุธที่ใช้"
            w="26mm"
            list={toItems(MODUS_WEAPON_ITEMS.slice(0, 5), "wpn")}
            on={on}
            toggle={toggle}
          />
          <Row style={{ paddingLeft: "26mm" }}>
            <Check
              label="ปืนสงคราม"
              on={on("wpn|ปืนสงคราม")}
              onToggle={() => toggle("wpn|ปืนสงคราม")}
              after={
                <span style={{ display: "inline-flex", alignItems: "baseline", columnGap: "1.5mm" }}>
                  <span>ชนิด</span>
                  <Fill aria="ปืนสงครามชนิด" value={fields.warWeaponType} onChange={(v) => onChange("warWeaponType", v)} w="34mm" />
                </span>
              }
            />
            <span>ขนาดกระสุนปืน</span>
            <Fill aria="ขนาดกระสุนนิ้ว" value={fields.bulletInch} onChange={(v) => onChange("bulletInch", v)} w="16mm" />
            <span>นิ้ว/</span>
            <Fill aria="ขนาดกระสุนมิลลิเมตร" value={fields.bulletMm} onChange={(v) => onChange("bulletMm", v)} w="16mm" />
            <span>มม./เบอร์</span>
            <Fill aria="ขนาดกระสุนเบอร์" value={fields.bulletNo} onChange={(v) => onChange("bulletNo", v)} w="16mm" />
            <Check label="ปืนปลอม" on={on("wpn|ปืนปลอม")} onToggle={() => toggle("wpn|ปืนปลอม")} />
          </Row>
          <Row style={{ paddingLeft: "26mm" }}>
            <Check
              label="ระเบิด"
              on={on("wpn|ระเบิด")}
              onToggle={() => toggle("wpn|ระเบิด")}
              after={
                <span style={{ display: "inline-flex", alignItems: "baseline", columnGap: "1.5mm" }}>
                  <span>ชนิด</span>
                  <Fill aria="ระเบิดชนิด" value={fields.bombType} onChange={(v) => onChange("bombType", v)} w="34mm" />
                </span>
              }
            />
            <Check label="ระเบิดปลอม" on={on("wpn|ระเบิดปลอม")} onToggle={() => toggle("wpn|ระเบิดปลอม")} />
            <Check label="ของแหลม/มีคม" on={on("wpn|ของแหลม/มีคม")} onToggle={() => toggle("wpn|ของแหลม/มีคม")} />
            <Check label="มีด" on={on("wpn|มีด")} onToggle={() => toggle("wpn|มีด")} />
          </Row>
          <Row style={{ paddingLeft: "26mm" }}>
            <Check label="ท่อนเหล็ก/ไม้" on={on("wpn|ท่อนเหล็ก/ไม้")} onToggle={() => toggle("wpn|ท่อนเหล็ก/ไม้")} />
            <Check label="ค้อน" on={on("wpn|ค้อน")} onToggle={() => toggle("wpn|ค้อน")} />
            <Check
              label="อื่น ๆ"
              on={on("wpn|อื่น ๆ")}
              onToggle={() => toggle("wpn|อื่น ๆ")}
              after={
                <Fill aria="อาวุธอื่น ๆ" value={fields.weaponOther} onChange={(v) => onChange("weaponOther", v)} w="50mm" />
              }
            />
          </Row>
        </div>

        <div style={{ borderTop: "1.2pt solid #111", flexShrink: 0 }}>
          <Labelled
            label="อุปกรณ์ที่ใช้"
            w="26mm"
            list={toItems(MODUS_EQUIPMENT_ITEMS.slice(0, 7), "eqp")}
            on={on}
            toggle={toggle}
          />
          <Row style={{ paddingLeft: "26mm" }}>
            <CheckWrap list={toItems(MODUS_EQUIPMENT_ITEMS.slice(7, 14), "eqp")} on={on} toggle={toggle} />
          </Row>
          <Row style={{ paddingLeft: "26mm" }}>
            <Check
              label="วิทยุสื่อสาร"
              on={on("eqp|วิทยุสื่อสาร")}
              onToggle={() => toggle("eqp|วิทยุสื่อสาร")}
            />
            <Check
              label="อื่น ๆ"
              on={on("eqp|อื่น ๆ")}
              onToggle={() => toggle("eqp|อื่น ๆ")}
              after={
                <Fill
                  aria="อุปกรณ์อื่น ๆ"
                  value={fields.equipmentOther}
                  onChange={(v) => onChange("equipmentOther", v)}
                  w="50mm"
                />
              }
            />
          </Row>
        </div>
      </Sheet>

      <Sheet index={1}>
        <Labelled
          label="วิธีการของคนร้าย"
          w="34mm"
          list={[
            ...toItems(MODUS_METHOD_ITEMS, "method"),
            {
              id: "method|อื่น ๆ",
              label: "อื่น ๆ",
              after: <Fill aria="วิธีการอื่น ๆ" value={fields.methodOther} onChange={(v) => onChange("methodOther", v)} w="50mm" />,
            },
          ]}
          on={on}
          toggle={toggle}
        />

        <div style={{ borderTop: "1.2pt solid #111", flexShrink: 0 }}>
          <Labelled
            label="ร่อยรอย/พยานหลักฐานในที่เกิดเหตุ"
            w="34mm"
            list={[
              ...toItems(MODUS_TRACE_ITEMS.slice(0, 2), "trace"),
              {
                id: "trace|ปลอกกระสุน",
                label: "ปลอกกระสุน จำนวน",
                after: (
                  <Fill
                    aria="ปลอกกระสุนจำนวน"
                    value={fields.bulletShellCount}
                    onChange={(v) => onChange("bulletShellCount", v)}
                    w="34mm"
                  />
                ),
              },
              {
                id: "trace|อื่น ๆ",
                label: "อื่น ๆ",
                after: (
                  <Fill aria="ร่อยรอยอื่น ๆ" value={fields.traceOther} onChange={(v) => onChange("traceOther", v)} w="46mm" />
                ),
              },
            ]}
            on={on}
            toggle={toggle}
          />
        </div>

        <div style={{ borderTop: "1.2pt solid #111", flexShrink: 0 }}>
          <div style={{ fontWeight: 700, lineHeight: LINE }}>มูลเหตุ (สำหรับคดีประทุษร้ายต่อชีวิต)</div>
          <div style={{ paddingLeft: "34mm" }}>
            <CheckWrap
              list={[
                ...toItems(MODUS_MOTIVE_ITEMS, "motive"),
                {
                  id: "motive|อื่น ๆ",
                  label: "อื่น ๆ",
                  after: <Fill aria="มูลเหตุอื่น ๆ" value={fields.motiveOther} onChange={(v) => onChange("motiveOther", v)} w="46mm" />,
                },
              ]}
              on={on}
              toggle={toggle}
            />
            <CheckWrap
              list={[
                { id: "motive|จ้างวาน", label: "เป็นการใช้จ้างวาน" },
                { id: "motive|มือปืนรับจ้าง", label: "มือปืนรับจ้าง" },
              ]}
              on={on}
              toggle={toggle}
            />
          </div>
        </div>

        <div
          style={{
            borderTop: "1.2pt solid #111",
            display: "flex",
            alignItems: "flex-start",
            columnGap: "5mm",
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <Row>
              <span style={{ fontWeight: 700 }}>พฤติการณ์แห่งคดี</span>
              <Dots />
            </Row>
            <LinedArea
              aria="พฤติการณ์แห่งคดี"
              value={chunks[0] ?? ""}
              onChange={(v) => onChange("narrative", joinChunk(0, v))}
              lines={NARR_FIRST}
            />
          </div>
          {lastIndex === 0 ? (
            <SignBlock
              name={fields.signerName}
              position={fields.signerPosition}
              onName={(v) => onChange("signerName", v)}
              onPosition={(v) => onChange("signerPosition", v)}
            />
          ) : null}
        </div>

        {lastIndex === 0 ? <Tail fields={fields} onChange={onChange} on={on} toggle={toggle} /> : null}
      </Sheet>

      {chunks.slice(1).map((chunk, i) => {
        const idx = i + 2;
        const isLast = i === lastIndex - 1;
        return (
          <Sheet key={idx} index={idx}>
            <div style={{ display: "flex", flexShrink: 0 }}>
              <div style={{ width: "34mm", flexShrink: 0, fontWeight: 700 }}>พฤติการณ์แห่งคดี</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Dots />
                <span style={{ marginLeft: "3mm", fontStyle: "italic", fontSize: "10pt" }}>
                  (ต่อ — หน้า {idx + 1})
                </span>
              </div>
            </div>
            <LinedArea
              aria={`พฤติการณ์แห่งคดี หน้า ${idx + 1}`}
              value={chunk}
              onChange={(v) => onChange("narrative", joinChunk(i + 1, v))}
              lines={NARR_CONT}
            />
            {isLast ? <Tail fields={fields} onChange={onChange} on={on} toggle={toggle} /> : null}
          </Sheet>
        );
      })}
    </div>
  );
}
