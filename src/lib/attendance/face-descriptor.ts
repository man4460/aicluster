/** เวกเตอร์ใบหน้า face-api (128 มิติ) — เก็บ/เทียบในระบบ ไม่เรียก API ภายนอก */

export const FACE_DESCRIPTOR_LENGTH = 128;

/**
 * ระยะยูคลิดหลัง L2-normalize — ค่ายิ่งน้อยยิ่งเหมือน
 * face-api มักใช้ ~0.6 เป็นเกณฑ์หลวม · เราใช้เกณฑ์เข้มขึ้นเพื่อลดจับคู่ผิดคน
 * (แลกกับอาจ reject แสง/มุมแย่ — แก้ด้วยลงทะเบียนหลายมุม)
 */
export const FACE_MATCH_MAX_DISTANCE = 0.42;

/** อันดับ 1 ต้องดีกว่าอันดับ 2 อย่างน้อยเท่านี้ — กันคนหน้าคล้ายกัน */
export const FACE_MATCH_MIN_MARGIN = 0.08;

/**
 * Ratio test (แนวเดียวกับ SIFT) — อันดับ 1 / อันดับ 2 ต้องไม่เกินค่านี้
 * ทำงานคู่กับ margin: เมื่อทั้งคู่ใกล้กันมาก (ratio สูง) ถือว่าคลุมเครือ
 */
export const FACE_MATCH_MAX_RATIO = 0.9;

/**
 * ถ้าโพรบใกล้ตัวอย่างของคนเดียวกัน ≥ 2 ตัวอย่าง (support) — ผ่อนเกณฑ์ระยะได้ถึงค่านี้
 * เพราะการยืนยันซ้ำหลายมุมของคนเดียวกันคือหลักฐานที่แข็งกว่าเฟรมเดี่ยว
 */
export const FACE_MATCH_STRONG_MAX_DISTANCE = 0.48;

/** ตัวอย่างในธนาคารที่ถือว่า "สนับสนุน" การจับคู่ */
export const FACE_MATCH_SUPPORT_DISTANCE = 0.5;

/** จำนวนตัวอย่างสูงสุดตอนลงทะเบียน (หลายมุม/เฟรม) */
export const FACE_ENROLL_MAX_SAMPLES = 8;

/** ใกล้กว่านี้ = น่าจะเป็นคนเดียวกับที่ลงทะเบียนไว้แล้ว (กันลงทะเบียนซ้ำ/สลับคน) */
export const FACE_ENROLL_DUPLICATE_DISTANCE = 0.34;

/** ตัวอย่างชุดเดียวกันห่างจากตัวกลางเกินนี้ = เฟรมเสีย/คนละคน → ตัดออก */
export const FACE_SAMPLE_MAX_SPREAD = 0.45;

export type FaceDescriptorBank = {
  v: 2;
  samples: number[][];
};

function isFiniteNumberArray(arr: unknown, len: number): arr is number[] {
  if (!Array.isArray(arr) || arr.length !== len) return false;
  for (const v of arr) {
    if (typeof v !== "number" || !Number.isFinite(v)) return false;
  }
  return true;
}

/** L2 normalize — ทำให้ระยะเทียบเสถียรขึ้น */
export function l2Normalize(desc: number[]): number[] {
  let sum = 0;
  for (const v of desc) sum += v * v;
  const n = Math.sqrt(sum);
  if (!Number.isFinite(n) || n < 1e-12) return desc.slice();
  return desc.map((v) => v / n);
}

export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i]! - b[i]!;
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/** เฉลี่ยหลาย descriptor แล้ว normalize */
export function averageDescriptors(samples: number[][]): number[] | null {
  if (samples.length === 0) return null;
  const acc = new Array<number>(FACE_DESCRIPTOR_LENGTH).fill(0);
  for (const s of samples) {
    if (!isFiniteNumberArray(s, FACE_DESCRIPTOR_LENGTH)) return null;
    const n = l2Normalize(s);
    for (let i = 0; i < FACE_DESCRIPTOR_LENGTH; i++) acc[i]! += n[i]!;
  }
  for (let i = 0; i < FACE_DESCRIPTOR_LENGTH; i++) acc[i]! /= samples.length;
  return l2Normalize(acc);
}

/** ตัวอย่างที่อยู่ "กลางกลุ่ม" ที่สุด — ทนต่อเฟรมเสียกว่าค่าเฉลี่ย */
export function medoidIndex(samples: number[][]): number {
  if (samples.length <= 1) return 0;
  let bestIdx = 0;
  let bestSum = Number.POSITIVE_INFINITY;
  for (let i = 0; i < samples.length; i++) {
    let sum = 0;
    for (let j = 0; j < samples.length; j++) {
      if (i === j) continue;
      sum += euclideanDistance(samples[i]!, samples[j]!);
    }
    if (sum < bestSum) {
      bestSum = sum;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/**
 * ตัดเฟรมหลุด (ระยะจากตัวกลางเกิน maxSpread) — กันเฉลี่ยรวมเฟรมเบลอ/คนอื่นเดินผ่าน
 * คืน { kept, dropped, spread } โดย spread = ระยะไกลสุดที่ยังเก็บไว้
 */
export function filterOutlierSamples(
  samples: number[][],
  maxSpread = FACE_SAMPLE_MAX_SPREAD,
): { kept: number[][]; dropped: number; spread: number } {
  const norm = samples
    .filter((s) => isFiniteNumberArray(s, FACE_DESCRIPTOR_LENGTH))
    .map((s) => l2Normalize(s));
  if (norm.length <= 2) return { kept: norm, dropped: 0, spread: 0 };

  const center = norm[medoidIndex(norm)]!;
  const kept: number[][] = [];
  let spread = 0;
  for (const s of norm) {
    const d = euclideanDistance(center, s);
    if (d > maxSpread) continue;
    kept.push(s);
    if (d > spread) spread = d;
  }
  return { kept: kept.length >= 2 ? kept : norm, dropped: norm.length - kept.length, spread };
}

/**
 * รวมตัวอย่างเดิม + ใหม่ (ลงทะเบียนเพิ่มมุม) — คงความหลากหลาย ตัดตัวที่ซ้ำใกล้กันเกินไป
 * จำกัดไม่เกิน FACE_ENROLL_MAX_SAMPLES โดยให้ตัวอย่างใหม่มาก่อน
 */
export function mergeFaceDescriptorSamples(
  existing: number[][],
  incoming: number[][],
  maxSamples = FACE_ENROLL_MAX_SAMPLES,
): number[][] {
  const pool = [...incoming, ...existing]
    .filter((s) => isFiniteNumberArray(s, FACE_DESCRIPTOR_LENGTH))
    .map((s) => l2Normalize(s));
  const out: number[][] = [];
  for (const s of pool) {
    if (out.length >= maxSamples) break;
    // ตัวอย่างที่แทบเหมือนของเดิมไม่เพิ่มข้อมูล — ข้าม เพื่อเก็บที่ให้มุมต่างกันจริง
    const tooSimilar = out.some((k) => euclideanDistance(k, s) < 0.12);
    if (tooSimilar) continue;
    out.push(s);
  }
  if (out.length === 0 && pool.length > 0) out.push(pool[0]!);
  return out;
}

/** อ่านธนาคารตัวอย่าง — รองรับทั้ง array เดี่ยว (legacy) และ { v:2, samples } */
export function parseFaceDescriptorBank(raw: unknown): number[][] | null {
  let data: unknown = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  }
  if (isFiniteNumberArray(data, FACE_DESCRIPTOR_LENGTH)) {
    return [l2Normalize(data)];
  }
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    (data as FaceDescriptorBank).v === 2 &&
    Array.isArray((data as FaceDescriptorBank).samples)
  ) {
    const out: number[][] = [];
    for (const s of (data as FaceDescriptorBank).samples) {
      if (!isFiniteNumberArray(s, FACE_DESCRIPTOR_LENGTH)) continue;
      out.push(l2Normalize(s));
    }
    return out.length > 0 ? out : null;
  }
  return null;
}

/** เข้ากันได้กับโค้ดเก่า — คืนตัวอย่างแรกหรือค่าเฉลี่ย */
export function parseFaceDescriptor(raw: unknown): number[] | null {
  const bank = parseFaceDescriptorBank(raw);
  if (!bank || bank.length === 0) return null;
  return averageDescriptors(bank) ?? bank[0]!;
}

export function serializeFaceDescriptor(desc: number[]): string {
  if (!isFiniteNumberArray(desc, FACE_DESCRIPTOR_LENGTH)) {
    throw new Error("BAD_DESCRIPTOR");
  }
  return JSON.stringify(l2Normalize(desc));
}

/** บันทึกหลายตัวอย่าง (แนะนำตอนลงทะเบียน) */
export function serializeFaceDescriptorBank(samples: number[][]): string {
  const cleaned: number[][] = [];
  for (const s of samples) {
    if (!isFiniteNumberArray(s, FACE_DESCRIPTOR_LENGTH)) continue;
    cleaned.push(l2Normalize(s));
    if (cleaned.length >= FACE_ENROLL_MAX_SAMPLES) break;
  }
  if (cleaned.length === 0) throw new Error("BAD_DESCRIPTOR");
  const payload: FaceDescriptorBank = { v: 2, samples: cleaned };
  return JSON.stringify(payload);
}

export type FaceMatchCandidate = {
  id: number;
  displayName: string;
  phone: string;
  /** หนึ่งหรือหลาย descriptor ของคนเดียวกัน */
  descriptors: number[][];
};

/** @deprecated ใช้ descriptors[] — แปลงจาก descriptor เดี่ยวได้ */
export type FaceMatchCandidateLegacy = {
  id: number;
  displayName: string;
  phone: string;
  descriptor: number[];
};

function scoreAgainstBank(
  probe: number[],
  bank: number[][],
): { distance: number; support: number } {
  let best = Number.POSITIVE_INFINITY;
  let support = 0;
  for (const s of bank) {
    const d = euclideanDistance(probe, s);
    if (d < best) best = d;
    if (d <= FACE_MATCH_SUPPORT_DISTANCE) support += 1;
  }
  return { distance: best, support };
}

export type FaceMatchResult =
  | {
      ok: true;
      entry: FaceMatchCandidate;
      distance: number;
      margin: number;
      /** จำนวนตัวอย่างของคนนี้ที่ยืนยันตรงกัน */
      support: number;
    }
  | {
      ok: false;
      reason: "NO_CANDIDATES" | "NO_MATCH" | "AMBIGUOUS";
      bestDistance: number | null;
      margin: number | null;
    };

export function matchFaceDescriptor(
  probe: number[],
  candidates: Array<FaceMatchCandidate | FaceMatchCandidateLegacy>,
  maxDistance = FACE_MATCH_MAX_DISTANCE,
  minMargin = FACE_MATCH_MIN_MARGIN,
): FaceMatchResult {
  if (candidates.length === 0) {
    return { ok: false, reason: "NO_CANDIDATES", bestDistance: null, margin: null };
  }

  const normalized: FaceMatchCandidate[] = candidates.map((c) => {
    if ("descriptors" in c && Array.isArray(c.descriptors)) return c;
    return {
      id: c.id,
      displayName: c.displayName,
      phone: c.phone,
      descriptors: [(c as FaceMatchCandidateLegacy).descriptor],
    };
  });

  const p = l2Normalize(probe);
  type Ranked = { entry: FaceMatchCandidate; distance: number; support: number };
  const ranked: Ranked[] = [];
  for (const c of normalized) {
    if (!c.descriptors.length) continue;
    const { distance, support } = scoreAgainstBank(p, c.descriptors);
    ranked.push({ entry: c, distance, support });
  }
  ranked.sort((a, b) => a.distance - b.distance);

  if (ranked.length === 0) {
    return { ok: false, reason: "NO_CANDIDATES", bestDistance: null, margin: null };
  }

  const best = ranked[0]!;
  const second = ranked[1];
  const margin = second ? second.distance - best.distance : Number.POSITIVE_INFINITY;
  const ratio = second && second.distance > 0 ? best.distance / second.distance : 0;

  // ผ่อนเกณฑ์ระยะได้เมื่อมีหลายตัวอย่างของคนเดียวกันยืนยันตรงกัน (ลงทะเบียนหลายมุม)
  const effectiveMax =
    best.support >= 2 ? Math.max(maxDistance, FACE_MATCH_STRONG_MAX_DISTANCE) : maxDistance;

  if (best.distance > effectiveMax) {
    return {
      ok: false,
      reason: "NO_MATCH",
      bestDistance: best.distance,
      margin: Number.isFinite(margin) ? margin : null,
    };
  }

  if (second && (margin < minMargin || ratio > FACE_MATCH_MAX_RATIO)) {
    return { ok: false, reason: "AMBIGUOUS", bestDistance: best.distance, margin };
  }

  return {
    ok: true,
    entry: best.entry,
    distance: best.distance,
    margin: Number.isFinite(margin) ? margin : 99,
    support: best.support,
  };
}

/**
 * จับคู่จากหลายเฟรมของผู้สแกน (probe หลายตัว) แล้วโหวต
 * ต้องได้เสียงข้างมากและไม่มีคนอื่นเสมอกัน — ลดทั้งจับผิดคนและปฏิเสธคนถูก
 */
export function matchFaceDescriptorMulti(
  probes: number[][],
  candidates: Array<FaceMatchCandidate | FaceMatchCandidateLegacy>,
  maxDistance = FACE_MATCH_MAX_DISTANCE,
  minMargin = FACE_MATCH_MIN_MARGIN,
): FaceMatchResult {
  const usable = probes.filter((p) => isFiniteNumberArray(p, FACE_DESCRIPTOR_LENGTH));
  if (usable.length === 0) {
    return { ok: false, reason: "NO_CANDIDATES", bestDistance: null, margin: null };
  }
  if (usable.length === 1) {
    return matchFaceDescriptor(usable[0]!, candidates, maxDistance, minMargin);
  }

  const avg = averageDescriptors(usable);
  const rounds = avg ? [avg, ...usable] : usable;

  const votes = new Map<
    number,
    { count: number; best: Extract<FaceMatchResult, { ok: true }> }
  >();
  let fallback: Extract<FaceMatchResult, { ok: false }> = {
    ok: false,
    reason: "NO_MATCH",
    bestDistance: null,
    margin: null,
  };
  let sawAmbiguous = false;

  for (const probe of rounds) {
    const r = matchFaceDescriptor(probe, candidates, maxDistance, minMargin);
    if (!r.ok) {
      if (r.reason === "NO_CANDIDATES") return r;
      if (r.reason === "AMBIGUOUS") sawAmbiguous = true;
      if (
        fallback.bestDistance === null ||
        (r.bestDistance !== null && r.bestDistance < fallback.bestDistance)
      ) {
        fallback = r;
      }
      continue;
    }
    const cur = votes.get(r.entry.id);
    if (!cur) {
      votes.set(r.entry.id, { count: 1, best: r });
    } else {
      cur.count += 1;
      if (r.distance < cur.best.distance) cur.best = r;
    }
  }

  if (votes.size === 0) {
    return sawAmbiguous && fallback.reason !== "AMBIGUOUS"
      ? { ...fallback, reason: "AMBIGUOUS" }
      : fallback;
  }

  const tally = [...votes.values()].sort((a, b) =>
    b.count === a.count ? a.best.distance - b.best.distance : b.count - a.count,
  );
  const top = tally[0]!;
  const runnerUp = tally[1];

  // คนละคนได้คะแนนเท่ากัน = เชื่อไม่ได้
  if (runnerUp && runnerUp.count === top.count) {
    return { ok: false, reason: "AMBIGUOUS", bestDistance: top.best.distance, margin: top.best.margin };
  }
  // ต้องผ่านเกินครึ่งของรอบที่ตรวจ
  if (top.count * 2 <= rounds.length) {
    return {
      ok: false,
      reason: sawAmbiguous ? "AMBIGUOUS" : "NO_MATCH",
      bestDistance: top.best.distance,
      margin: top.best.margin,
    };
  }

  return top.best;
}

/** หาคนที่ลงทะเบียนไว้แล้วและใกล้เกินไป — ใช้กันลงทะเบียนซ้ำ/สลับคน */
export function findDuplicateFaceOwner(
  probe: number[],
  candidates: FaceMatchCandidate[],
  maxDistance = FACE_ENROLL_DUPLICATE_DISTANCE,
): { entry: FaceMatchCandidate; distance: number } | null {
  const p = l2Normalize(probe);
  let best: { entry: FaceMatchCandidate; distance: number } | null = null;
  for (const c of candidates) {
    if (!c.descriptors.length) continue;
    const { distance } = scoreAgainstBank(p, c.descriptors);
    if (distance <= maxDistance && (!best || distance < best.distance)) {
      best = { entry: c, distance };
    }
  }
  return best;
}
