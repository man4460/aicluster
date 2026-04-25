import { ollamaCallVisionText } from "@/lib/ollama/ollama-vision";
import { callNvidiaSlipVision, nvidiaSlipModel, nvidiaSlipOcrConfigured } from "@/lib/vision/nvidia-slip-vision";

const DEFAULT_GLM_OCR_MODEL = "glm-ocr:latest";

export type GlmOcrReadPipeline = {
  /** โมเดลรอบแรก (เช่น kimi-k2.5) */
  primaryModel: string;
  /** ใช้ GLM-OCR หลัง primary อ่อนหรือ error */
  usedGlmFallback: boolean;
  primaryError?: string;
};

export type GlmOcrSlipResult = {
  entryDateYmd: string | null;
  entryTime: string | null;
  amountBaht: number | null;
  transferFrom: string | null;
  transferTo: string | null;
  bankName: string | null;
  reference: string | null;
  slipNote: string | null;
  directionGuess: "out" | "in" | "unknown";
  rawText: string;
  parseWarning?: string;
  /** สร้างเมื่ออ่านผ่าน readSlipWithKimiThenGlmOcr */
  readPipeline?: GlmOcrReadPipeline;
};

type GlmOcrJson = {
  entryDateYmd?: string | null;
  entryTime?: string | null;
  amountBaht?: number | null;
  transferFrom?: string | null;
  transferTo?: string | null;
  bankName?: string | null;
  reference?: string | null;
  slipNote?: string | null;
  directionGuess?: string | null;
};

function envGlmOcrBaseUrl(): string {
  return (
    process.env.OLLAMA_GLM_OCR_URL?.trim() ||
    process.env.OLLAMA_VISION_API_URL?.trim() ||
    process.env.OLLAMA_API_URL?.trim() ||
    process.env.OLLAMA_URL?.trim() ||
    ""
  );
}

function envGlmOcrModel(): string {
  return process.env.OLLAMA_GLM_OCR_MODEL?.trim() || DEFAULT_GLM_OCR_MODEL;
}

export function dataUrlToBase64Raw(imageDataUrl: string): string | null {
  const m = imageDataUrl.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
  return m?.[1] ?? null;
}

function extractJsonObject(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const body = (fence ? fence[1] : t).trim();
  const start = body.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inS = false;
  let esc = false;
  for (let i = start; i < body.length; i++) {
    const c = body[i]!;
    if (esc) {
      esc = false;
      continue;
    }
    if (c === "\\" && inS) {
      esc = true;
      continue;
    }
    if (c === '"') {
      inS = !inS;
      continue;
    }
    if (inS) continue;
    if (c === "{") depth++;
    if (c === "}") {
      depth--;
      if (depth === 0) return body.slice(start, i + 1);
    }
  }
  return null;
}

function parseAmount(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
  if (typeof v !== "string") return null;
  const n = Number(v.replace(/[,\s฿]/g, "").replace(/บาท/g, "").trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalizeYmd(v: string | null | undefined): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    let y = parseInt(iso[1]!, 10);
    if (y >= 2400) y -= 543;
    if (y < 1990 || y > 2110) return null;
    return `${y}-${iso[2]}-${iso[3]}`;
  }
  const th = t.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (th) {
    const d = th[1]!.padStart(2, "0");
    const m = th[2]!.padStart(2, "0");
    let y = parseInt(th[3]!, 10);
    if (y >= 2400) y -= 543;
    if (y < 1990 || y > 2110) return null;
    return `${y}-${m}-${d}`;
  }
  return null;
}

/** รองรับ เช่น 20/04/69 = 20 เม.ย. 2569, 20/04/2569, 20-04-23 (2 หลัก = พ.ศ. 25xx) */
function normalizeYmdThaiSlipVariants(t: string): string | null {
  const s = t.replace(/\s+/g, "").trim();
  const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!m) return null;
  const dd = m[1]!.padStart(2, "0");
  const mm = m[2]!.padStart(2, "0");
  const yPart = m[3]!;
  let yCe: number;
  if (yPart.length === 2) {
    const n = parseInt(yPart, 10);
    yCe = 2500 + n - 543;
  } else {
    yCe = parseInt(yPart, 10);
    if (yCe >= 2400) yCe -= 543;
  }
  if (!Number.isFinite(yCe) || yCe < 1990 || yCe > 2110) return null;
  return `${yCe}-${mm}-${dd}`;
}

/** แปลง JSON สลิปรูปแบบ OpenClaw/บุคคลทั่วไป (date/amount/sender/…) ให้ตรง GlmOcrJson */
function applySlipJsonFieldAliases(j: GlmOcrJson & Record<string, unknown>): GlmOcrJson {
  const o = j;
  const out: GlmOcrJson = { ...o };
  if (!out.entryDateYmd || String(out.entryDateYmd).trim() === "") {
    const d = o.date ?? o.entryDate;
    if (typeof d === "string" && d.trim()) {
      out.entryDateYmd = normalizeYmd(d) ?? normalizeYmdThaiSlipVariants(d);
    }
  }
  if (out.amountBaht == null || (typeof out.amountBaht === "number" && !Number.isFinite(out.amountBaht))) {
    const a = o.amount ?? o.total;
    if (a != null) {
      const n = parseAmount(a);
      if (n != null) out.amountBaht = n;
    }
  }
  if (!out.transferFrom || !String(out.transferFrom).trim()) {
    const t = o.sender ?? o.from;
    if (typeof t === "string" && t.trim()) out.transferFrom = t.trim().slice(0, 200);
  }
  if (!out.transferTo || !String(out.transferTo).trim()) {
    const t = o.receiver ?? o.to ?? o.recipient;
    if (typeof t === "string" && t.trim()) out.transferTo = t.trim().slice(0, 200);
  }
  if (!out.bankName || !String(out.bankName).trim()) {
    const b = o.bank ?? o.bankName;
    if (typeof b === "string" && b.trim()) out.bankName = b.trim().slice(0, 100);
  }
  if (!out.reference || !String(out.reference).trim()) {
    const r = o.ref ?? o.referenceNo;
    if (typeof r === "string" && r.trim()) out.reference = r.trim().slice(0, 100);
  }
  if (!out.slipNote || !String(out.slipNote).trim()) {
    const n = o.note ?? o.slipNote;
    if (typeof n === "string" && n.trim()) out.slipNote = n.trim().slice(0, 500);
  }
  if (!out.entryTime || !String(out.entryTime).trim()) {
    const tm = o.time ?? o.entryTime;
    if (typeof tm === "string" && tm.trim()) {
      const short = tm.match(/([01]?\d|2[0-3]):([0-5]\d)/);
      if (short) out.entryTime = `${short[1]!.padStart(2, "0")}:${short[2]}`;
    }
  }
  return out;
}

function stripReasoningNoise(s: string): string {
  let t = s;
  const tagPairs = [
    "think",
    "redacted_thinking",
    "thinking",
    "reasoning",
    "analysis",
    "redacted_reasoning",
  ];
  for (const tag of tagPairs) {
    const re = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
    t = t.replace(re, "");
  }
  return t.replace(/\n{3,}/g, "\n\n").trim();
}

function tryRepairJsonObjectString(jsonStr: string): string {
  let s = jsonStr.trim();
  s = s.replace(/,\s*([}\]])/g, "$1");
  s = s.replace(/([{,]\s*)'([^']*)'\s*:/g, '$1"$2":');
  return s;
}

function parseGlmJson(raw: string): { value: GlmOcrJson; warning?: string } {
  const cleaned = stripReasoningNoise(raw);
  const jsonStr = extractJsonObject(cleaned);
  if (!jsonStr) {
    return { value: {}, warning: "ไม่พบ JSON ในคำตอบ — แสดงข้อความดิบให้แก้มือ" };
  }
  let parsed: GlmOcrJson;
  try {
    parsed = JSON.parse(jsonStr) as GlmOcrJson;
  } catch {
    try {
      parsed = JSON.parse(tryRepairJsonObjectString(jsonStr)) as GlmOcrJson;
    } catch {
      return { value: {}, warning: "แปลง JSON ไม่สำเร็จ — กรุณาแก้มือ" };
    }
  }
  return { value: applySlipJsonFieldAliases({ ...parsed } as GlmOcrJson & Record<string, unknown>) };
}

function heuristicExtractFromSlipText(raw: string): GlmOcrJson {
  const t = raw.replace(/\u00a0/g, " ");
  const j: GlmOcrJson = {};

  const amountPatterns: RegExp[] = [
    /(?:จำนวน(?:เงิน)?|ยอด(?:เงิน)?(?:โอน)?|Amount|amount)[^\d]{0,24}(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d{1,6}(?:\.\d{1,2})?)/iu,
    /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d{1,6}(?:\.\d{1,2})?)\s*(?:บาท|THB|฿)/u,
    /฿\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d{1,6}(?:\.\d{1,2})?)/u,
  ];
  for (const p of amountPatterns) {
    const m = t.match(p);
    if (m?.[1]) {
      const n = parseAmount(m[1]);
      if (n != null) {
        j.amountBaht = n;
        break;
      }
    }
  }

  const iso = t.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) j.entryDateYmd = `${iso[1]}-${iso[2]}-${iso[3]}`;

  const thDate = t.match(/\b(\d{1,2})[./-](\d{1,2})[./-](25\d{2}|24\d{2})\b/);
  if (thDate && !iso) {
    const d = thDate[1]!.padStart(2, "0");
    const mo = thDate[2]!.padStart(2, "0");
    let y = parseInt(thDate[3]!, 10);
    if (y >= 2400) y -= 543;
    if (y >= 1990 && y <= 2110) j.entryDateYmd = `${y}-${mo}-${d}`;
  }

  const timeM = t.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (timeM) j.entryTime = `${timeM[1]!.padStart(2, "0")}:${timeM[2]}`;

  const refM = t.match(/\b(?:Ref|REF|รหัส|อ้างอิง)[\s.:]*([A-Za-z0-9-]{6,32})\b/u);
  if (refM?.[1]) j.reference = refM[1]!.slice(0, 100);

  const longNum = t.match(/\b(\d{10,16})\b/);
  if (!j.reference && longNum?.[1]) j.reference = longNum[1]!.slice(0, 100);

  const bankHints = [
    "กสิกร",
    "กรุงเทพ",
    "ไทยพาณิชย์",
    "กรุงไทย",
    "ทหารไทย",
    "ยูโอบี",
    "ซีไอเอ็มบี",
    "ทีเอ็มบี",
    "SCB",
    "KBANK",
    "BBL",
    "KTB",
    "TTB",
    "BAY",
    "GSB",
    "BAAC",
    "TrueMoney",
    "PromptPay",
    "พร้อมเพย์",
  ];
  for (const b of bankHints) {
    if (t.includes(b)) {
      j.bankName = b.slice(0, 100);
      break;
    }
  }

  return j;
}

function mergeSlipJsonParsedWithHeuristic(parsed: GlmOcrJson, heuristic: GlmOcrJson): GlmOcrJson {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const pickStr = (a: unknown, b: unknown, maxLen: number) => {
    const sa = str(a);
    if (sa) return sa.slice(0, maxLen);
    const sb = str(b);
    return sb ? sb.slice(0, maxLen) : undefined;
  };
  const out: GlmOcrJson = { ...heuristic, ...parsed };
  if (parsed.amountBaht == null && heuristic.amountBaht != null) out.amountBaht = heuristic.amountBaht;
  if (!str(parsed.entryDateYmd) && str(heuristic.entryDateYmd)) out.entryDateYmd = heuristic.entryDateYmd;
  if (!str(parsed.entryTime) && str(heuristic.entryTime)) out.entryTime = heuristic.entryTime;
  out.transferFrom = pickStr(parsed.transferFrom, heuristic.transferFrom, 200) ?? out.transferFrom;
  out.transferTo = pickStr(parsed.transferTo, heuristic.transferTo, 200) ?? out.transferTo;
  out.bankName = pickStr(parsed.bankName, heuristic.bankName, 100) ?? out.bankName;
  out.reference = pickStr(parsed.reference, heuristic.reference, 100) ?? out.reference;
  out.slipNote = pickStr(parsed.slipNote, heuristic.slipNote, 500) ?? out.slipNote;
  if (!parsed.directionGuess && heuristic.directionGuess) out.directionGuess = heuristic.directionGuess;
  return out;
}

function slipHasAnySignal(r: Pick<GlmOcrSlipResult, "amountBaht" | "entryDateYmd" | "reference" | "bankName" | "transferFrom" | "transferTo">): boolean {
  return (
    r.amountBaht != null ||
    r.entryDateYmd != null ||
    (r.reference != null && r.reference.trim().length > 0) ||
    (r.bankName != null && r.bankName.trim().length > 0) ||
    (r.transferFrom != null && r.transferFrom.trim().length > 0) ||
    (r.transferTo != null && r.transferTo.trim().length > 0)
  );
}

/** prompt เดียวกันสำหรับ primary (Kimi K2.5) และ fallback GLM-OCR */
export const SLIP_OCR_JSON_PROMPT = `คุณคือระบบ OCR อ่านสลิปโอนเงิน/หลักฐานการชำระเงิน (ภาษาไทย/อังกฤษ)

กฎสำคัญ:
- ตอบเฉพาะวัตถุ JSON เดียวเท่านั้น
- ห้าม markdown ห้าม \`\`\` ห้ามคำอธิบายก่อนหรือหลัง JSON
- ห้ามใส่ข้อความวิเคราะห์หรือแท็กอื่น — มีแต่ JSON

คีย์ที่ต้องส่ง (ค่า null ถ้าไม่พบ):
- "entryDateYmd": วันที่ในรูปแบบ "YYYY-MM-DD" ใช้ปี ค.ศ. เท่านั้น (ถ้าเป็นพ.ศ. ให้ลบ 543 เปลี่ยนเป็นค.ศ.)
- "entryTime": "HH:mm" หรือ null
- "amountBaht": ตัวเลขบาท (เช่น 1500.5) หรือ null
- "transferFrom": ชื่อ/บัญชีผู้โอน
- "transferTo": ชื่อ/บัญชีผู้รับ
- "bankName": ชื่อธนาคารหรือแอป (เช่น SCB, กสิกร, TrueMoney)
- "reference": เลขอ้างอิง/Ref/รหัสรายการ
- "slipNote": ข้อความเพิ่มเติมบนสลิป
- "directionGuess": ต้องเป็น "out" | "in" | "unknown" — out=เงินออกของผู้ใช้, in=เงินเข้า, unknown=ไม่แน่ใจ

ตัวอย่างรูปแบบ (สมมติ):
{"entryDateYmd":"2025-04-24","entryTime":"14:05","amountBaht":1000,"transferFrom":null,"transferTo":null,"bankName":"SCB","reference":"1234567890","slipNote":null,"directionGuess":"out"}`.trim();

const GLM_OCR_PROMPT = SLIP_OCR_JSON_PROMPT;

const DEFAULT_KIMI_SLIP_MODEL = "kimi-k2.5:cloud";

function envPrimarySlipOcrBaseUrl(): string {
  return (
    process.env.OLLAMA_SLIP_VISION_PRIMARY_URL?.trim() ||
    process.env.OLLAMA_API_URL?.trim() ||
    process.env.OLLAMA_VISION_API_URL?.trim() ||
    process.env.OLLAMA_URL?.trim() ||
    ""
  );
}

function envPrimarySlipOcrModel(): string {
  return process.env.OLLAMA_SLIP_VISION_PRIMARY_MODEL?.trim() || DEFAULT_KIMI_SLIP_MODEL;
}

function slipSkipKimiFirst(): boolean {
  const v = process.env.OLLAMA_SLIP_SKIP_KIMI?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function shouldFallbackToGlmAfterPrimary(r: GlmOcrSlipResult): boolean {
  if (r.parseWarning && /ไม่พบ JSON|แปลง JSON ไม่สำเร็จ/u.test(r.parseWarning)) {
    return true;
  }
  if (r.amountBaht != null || r.entryDateYmd != null) {
    return false;
  }
  if (r.reference != null || r.bankName != null) {
    return false;
  }
  return true;
}

export function buildGlmOcrResultFromModelText(rawText: string): GlmOcrSlipResult {
  const cleaned = stripReasoningNoise(rawText);
  const { value: jParsed, warning } = parseGlmJson(rawText);
  const h = heuristicExtractFromSlipText(cleaned);
  const j = mergeSlipJsonParsedWithHeuristic(jParsed, h);
  const amount = parseAmount(j.amountBaht);
  const entryDateYmd = normalizeYmd(j.entryDateYmd);

  let directionGuess: "out" | "in" | "unknown" = "unknown";
  if (j.directionGuess === "out" || j.directionGuess === "in" || j.directionGuess === "unknown") {
    directionGuess = j.directionGuess;
  }

  const draft: GlmOcrSlipResult = {
    entryDateYmd,
    entryTime: typeof j.entryTime === "string" && j.entryTime.trim() ? j.entryTime.trim().slice(0, 5) : null,
    amountBaht: amount,
    transferFrom: typeof j.transferFrom === "string" && j.transferFrom.trim() ? j.transferFrom.trim().slice(0, 200) : null,
    transferTo: typeof j.transferTo === "string" && j.transferTo.trim() ? j.transferTo.trim().slice(0, 200) : null,
    bankName: typeof j.bankName === "string" && j.bankName.trim() ? j.bankName.trim().slice(0, 100) : null,
    reference: typeof j.reference === "string" && j.reference.trim() ? j.reference.trim().slice(0, 100) : null,
    slipNote: typeof j.slipNote === "string" && j.slipNote.trim() ? j.slipNote.trim().slice(0, 500) : null,
    directionGuess,
    rawText,
    parseWarning: warning,
  };
  if (warning && slipHasAnySignal(draft)) {
    draft.parseWarning = undefined;
  }
  return draft;
}

/**
 * อ่านสลิป: ลำดับรอบแรก
 * 1) NVIDIA Kimi (ถ้าตั้ง NVIDIA_API_KEY) — รูปแบบเดียวกับ integrate.api.nvidia.com/v1/chat/completions
 * 2) Ollama Kimi (OLLAMA_SLIP_VISION_PRIMARY_* / OLLAMA_API_URL)
 * 3) GLM-OCR รอง
 *
 * - ตั้ง OLLAMA_SLIP_SKIP_KIMI=1 เพื่อข้ามทั้ง NVIDIA + Ollama primary ใช้แค่ GLM
 * - ตั้ง NVIDIA_SLIP_SKIP=1 เพื่อไม่เรียก NVIDIA (ใช้ Ollama ก่อนตามเดิม)
 */
export async function readSlipWithKimiThenGlmOcr(
  imageBase64Raw: string,
  signal?: AbortSignal,
): Promise<GlmOcrSlipResult> {
  const effectiveSignal = signal ?? AbortSignal.timeout(120_000);

  if (slipSkipKimiFirst()) {
    return readSlipWithGlmOcr(imageBase64Raw, effectiveSignal);
  }

  const hasNvidia = nvidiaSlipOcrConfigured();
  const hasOllamaPrimary = Boolean(envPrimarySlipOcrBaseUrl());

  if (!hasNvidia && !hasOllamaPrimary) {
    return readSlipWithGlmOcr(imageBase64Raw, effectiveSignal);
  }

  let primaryError: string | undefined;
  let lastTriedModel: string | undefined;

  if (hasNvidia) {
    const nm = nvidiaSlipModel();
    lastTriedModel = nm;
    try {
      const rawText = await callNvidiaSlipVision(imageBase64Raw, SLIP_OCR_JSON_PROMPT, effectiveSignal);
      const parsed = buildGlmOcrResultFromModelText(rawText);
      if (!shouldFallbackToGlmAfterPrimary(parsed)) {
        return { ...parsed, readPipeline: { primaryModel: nm, usedGlmFallback: false } };
      }
    } catch (e) {
      primaryError = e instanceof Error ? e.message : String(e);
    }
  }

  if (hasOllamaPrimary) {
    const primaryBase = envPrimarySlipOcrBaseUrl()!;
    const primaryModel = envPrimarySlipOcrModel();
    lastTriedModel = primaryModel;
    try {
      const rawText = await ollamaCallVisionText({
        apiUrlFromEnv: primaryBase,
        model: primaryModel,
        userPrompt: SLIP_OCR_JSON_PROMPT,
        imageBase64: imageBase64Raw,
        temperature: 0.1,
        signal: effectiveSignal,
      });
      const parsed = buildGlmOcrResultFromModelText(rawText);
      if (!shouldFallbackToGlmAfterPrimary(parsed)) {
        return { ...parsed, readPipeline: { primaryModel, usedGlmFallback: false } };
      }
    } catch (e) {
      primaryError = e instanceof Error ? e.message : String(e);
    }
  }

  const fromGlm = await readSlipWithGlmOcr(imageBase64Raw, effectiveSignal);
  return {
    ...fromGlm,
    readPipeline: {
      primaryModel: lastTriedModel ?? envGlmOcrModel(),
      usedGlmFallback: true,
      primaryError,
    },
  };
}

/**
 * อ่านสลิปด้วยโมเดล GLM-OCR บน Ollama (local) — ใช้ OLLAMA_GLM_OCR_URL หรือ OLLAMA_VISION_API_URL / OLLAMA_API_URL
 */
export async function readSlipWithGlmOcr(imageBase64Raw: string, signal?: AbortSignal): Promise<GlmOcrSlipResult> {
  const base = envGlmOcrBaseUrl();
  if (!base) {
    throw new Error("ยังไม่ตั้ง OLLAMA_GLM_OCR_URL, OLLAMA_VISION_API_URL หรือ OLLAMA_API_URL");
  }
  const model = envGlmOcrModel();
  const userPrompt = GLM_OCR_PROMPT;
  const rawText = await ollamaCallVisionText({
    apiUrlFromEnv: base,
    model,
    userPrompt,
    imageBase64: imageBase64Raw,
    temperature: 0.1,
    signal: signal ?? AbortSignal.timeout(120_000),
  });
  return buildGlmOcrResultFromModelText(rawText);
}
