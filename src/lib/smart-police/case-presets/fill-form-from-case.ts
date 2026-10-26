/**
 * เติมช่องฟอร์มจากคดีจริง — ใช้กับหน้า preview แม่แบบทุกตัว
 *
 * ที่มา: SmartPoliceCase / parties / evidence + ค่าตั้งต้นจาก preset (starterFields)
 * หลักการ: ค่าที่ผู้ใช้พิมพ์ไว้แล้ว "ไม่ถูกทับ" ยกเว้นสั่ง overwrite
 */

export type FillSourceCase = {
  caseNumber: string;
  title: string;
  caseType: string;
  chargeText: string | null;
  lawRefs: string | null;
  incidentAt: string | null;
  incidentPlace: string | null;
  receivedAt: string | null;
  receivedTimeHm: string | null;
  courtType: string | null;
  custodyMode: string | null;
  summary: string | null;
  behaviorText: string | null;
  detainAt: string | null;
  parties: Array<{ role: string; fullName: string; caseRelation: string | null; idCard?: string | null; address?: string | null }>;
  evidence: Array<{ name: string; quantityLabel?: string | null; seizureNo?: string | null }>;
};

export type FillSourcePreset = {
  key: string;
  caseType: string;
  starterFields: Record<string, string>;
} | null;

/** แปลงวันที่ ISO → "วว/ดด/ปปปป" แบบไทย (พ.ศ.) */
export function thaiDateSlash(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear() + 543;
  return `${day}/${month}/${year}`;
}

/** "1 มกราคม 2566" (ไทย) */
export function thaiDateLong(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

type DateParts = { day: string; month: string; year: string; time: string };

/** แยกวันเกิดเหตุ/วันรับคดี เป็นชิ้นส่วนที่ฟอร์มใช้ (day/month/year/time) */
export function dateParts(iso: string | null | undefined): DateParts {
  if (!iso) return { day: "", month: "", year: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: "", month: "", year: "", time: "" };
  return {
    day: String(d.getDate()),
    month: THAI_MONTHS[d.getMonth()] ?? "",
    year: String(d.getFullYear() + 543),
    time: String(d.getHours()).padStart(2, "0") + "." + String(d.getMinutes()).padStart(2, "0"),
  };
}

function partyList(c: FillSourceCase, role: string): string {
  return c.parties
    .filter((p) => p.role === role)
    .map((p) => p.fullName)
    .filter(Boolean)
    .join(", ");
}

/**
 * การจับคู่ชื่อฟิลด์ ↔ ข้อมูลคดี
 * คีย์เป็นชื่อฟิลด์จริงของแต่ละฟอร์ม (ตรงกันหลายฟอร์มใช้ชื่อเดียวกัน)
 */
export function buildCaseFieldValues(
  c: FillSourceCase,
  preset: FillSourcePreset,
): Record<string, string> {
  const complainant = partyList(c, "COMPLAINANT");
  const suspect = partyList(c, "SUSPECT");
  const witnesses = partyList(c, "WITNESS");
  const evidenceText = c.evidence
    .map((e, i) => {
      const bits = [`${i + 1}. ${e.name}`];
      if (e.quantityLabel) bits.push(`จำนวน ${e.quantityLabel}`);
      if (e.seizureNo) bits.push(`เลขยึด ${e.seizureNo}`);
      return bits.join(" ");
    })
    .join("\n");

  const incident = dateParts(c.incidentAt);
  const report = dateParts(c.receivedAt);

  const shared: Record<string, string> = {
    // --- วันที่แบบแยกช่อง (ฟอร์มราชการไทย) ---
    day: report.day,
    month: report.month,
    year: report.year,
    incidentDay: incident.day,
    incidentMonth: incident.month,
    incidentYear: incident.year,
    incidentTime: incident.time,
    reportDay: report.day,
    reportMonth: report.month,
    reportYear: report.year,
    reportTime: report.time,
    inspectDay: report.day,
    inspectMonth: report.month,
    inspectYear: report.year,
    recordPlace: c.incidentPlace ?? "",
    // --- หัวเอกสาร (ใช้ชื่อต่างกันในแต่ละฟอร์ม) ---
    caseNo: c.caseNumber,
    caseNumber: c.caseNumber,
    caseTitle: c.title,
    title: c.title,
    station: "",
    courtType: c.courtType ?? "",
    // --- ข้อหา ---
    charge: c.chargeText ?? "",
    chargeText: c.chargeText ?? "",
    lawRefs: c.lawRefs ?? "",
    // --- คู่ความ ---
    victim: complainant,
    complainant,
    suspect,
    witness: witnesses,
    witness1: witnesses,
    // --- วันเวลา / สถานที่ ---
    reportDate: thaiDateSlash(c.receivedAt),
    receivedDate: thaiDateSlash(c.receivedAt),
    receivedTimeHm: c.receivedTimeHm ?? "",
    incidentDate: thaiDateSlash(c.incidentAt),
    incidentAt: thaiDateSlash(c.incidentAt),
    incidentPlace: c.incidentPlace ?? "",
    place: c.incidentPlace ?? "",
    detainAt: thaiDateLong(c.detainAt),
    // --- เนื้อเรื่อง ---
    summary: c.summary ?? "",
    behaviorText: c.behaviorText ?? "",
    evidence: evidenceText,
    evidenceLines: evidenceText,
    propertyList: evidenceText,
  };

  // ค่าตั้งต้นจาก preset มาก่อน แล้วค่าจากคดีทับ (คดีจริงชนะเสมอ)
  const fromPreset: Record<string, string> = {};
  for (const [path, value] of Object.entries(preset?.starterFields ?? {})) {
    // "form.field.key" → ใช้ท่อนสุดท้ายเป็นชื่อฟิลด์
    const fieldKey = path.split(".").pop() ?? path;
    if (!(fieldKey in fromPreset)) fromPreset[fieldKey] = value;
  }

  return { ...fromPreset, ...shared };
}

/** เติมค่าลง object ฟอร์ม: เว้นช่องที่ผู้ใช้กรอกไว้แล้ว (ไม่ clobber) */
export function applyCaseValues<T extends Record<string, unknown>>(
  current: T,
  values: Record<string, string>,
  opts: { overwrite?: boolean } = {},
): { next: T; filled: number; skipped: number } {
  let filled = 0;
  let skipped = 0;
  const next: T = { ...current };
  for (const [key, value] of Object.entries(values)) {
    if (!(key in next)) continue;
    if (typeof next[key] !== "string") continue;
    if (!value) continue;
    const existing = next[key] as string;
    if (!opts.overwrite && existing.trim()) {
      skipped++;
      continue;
    }
    if (existing === value) continue;
    (next as Record<string, unknown>)[key] = value;
    filled++;
  }
  return { next, filled, skipped };
}
