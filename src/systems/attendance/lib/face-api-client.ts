"use client";

/**
 * โหลดโมเดล face-api จาก /models/face-api (โฮสต์ในโปรเจกต์) — ไม่เรียก API ภายนอกตอนรัน
 *
 * ชั้นความแม่นยำที่ใช้ (เรียงตามผลกระทบ):
 * 1. ตรวจจับด้วย SSD MobileNet v1 (สำรอง TinyFaceDetector) + แลนด์มาร์ก 68 จุดรุ่นเต็ม → จัดแนวใบหน้าแม่นขึ้น
 * 2. ด่านคุณภาพภาพ: คะแนนตรวจจับ · ขนาดใบหน้า · ความคมชัด (Laplacian) · แสง · มุมหน้า (roll/yaw) · ใบหน้าซ้อนหลายคน
 * 3. หลายเฟรม → ตัดเฟรมหลุด (medoid) → เฉลี่ย เพื่อลดผลของเฟรมเบลอ/แสงแวบ
 * 4. กันภาพนิ่ง/รูปถ่าย: เฟรมต้องมีความต่างระดับพิกเซลตามธรรมชาติ
 */

import {
  FACE_DESCRIPTOR_LENGTH,
  FACE_ENROLL_MAX_SAMPLES,
  averageDescriptors,
  filterOutlierSamples,
  l2Normalize,
} from "@/lib/attendance/face-descriptor";

const MODEL_URL = "/models/face-api";

/** คะแนนตรวจจับขั้นต่ำ */
export const FACE_MIN_DETECTION_SCORE = 0.6;
/** ใบหน้าต้องกว้างอย่างน้อยสัดส่วนนี้ของด้านสั้นของภาพ */
export const FACE_MIN_BOX_RATIO = 0.18;
/** ความคมชัดขั้นต่ำ (variance ของ Laplacian บนภาพใบหน้า 128×128) */
export const FACE_MIN_SHARPNESS = 6;
/** ความสว่างเฉลี่ยที่รับได้ (0–255) */
export const FACE_MIN_BRIGHTNESS = 42;
export const FACE_MAX_BRIGHTNESS = 232;
/** คอนทราสต์ขั้นต่ำ (ค่าเบี่ยงเบนมาตรฐานของความสว่าง) */
export const FACE_MIN_CONTRAST = 12;
/** เอียงหน้าซ้าย–ขวา (องศา) */
export const FACE_MAX_ROLL_DEG = 20;
/** หันหน้า (ความไม่สมมาตรจมูกเทียบระยะตา) */
export const FACE_MAX_YAW_RATIO = 0.38;
/** ใบหน้ารองใหญ่เกินสัดส่วนนี้ของใบหน้าหลัก = มีหลายคนในเฟรม */
export const FACE_MAX_SECOND_FACE_RATIO = 0.62;
/** จำนวนเฟรมที่ถ่ายต่อการสแกนหนึ่งครั้ง */
export const FACE_CAPTURE_FRAMES = 4;
/** ระยะห่างระหว่างเฟรม (ms) */
export const FACE_CAPTURE_GAP_MS = 260;
/** ความละเอียดกล้องที่ขอ */
export const FACE_CAMERA_IDEAL_WIDTH = 1280;
export const FACE_CAMERA_IDEAL_HEIGHT = 720;

const SSD_OPTS = { minConfidence: 0.5, maxResults: 5 };
const TINY_OPTS = { inputSize: 416 as const, scoreThreshold: 0.5 };

type FaceApi = typeof import("@vladmandic/face-api");

let modelsReady: Promise<{ faceapi: FaceApi; useTinyDetector: boolean; useTinyLandmarks: boolean }> | null =
  null;

async function loadModels() {
  const faceapi = (await import("@vladmandic/face-api")) as FaceApi;

  let useTinyDetector = false;
  let useTinyLandmarks = false;

  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

  try {
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  } catch {
    // อุปกรณ์/เครือข่ายโหลดโมเดลใหญ่ไม่ได้ → ถอยไปตัวเร็ว
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    useTinyDetector = true;
  }

  try {
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  } catch {
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
    useTinyLandmarks = true;
  }

  return { faceapi, useTinyDetector, useTinyLandmarks };
}

async function ensureModels() {
  if (!modelsReady) {
    modelsReady = loadModels().catch((e) => {
      modelsReady = null;
      throw e;
    });
  }
  return modelsReady;
}

export type FaceQuality = {
  detectionScore: number;
  boxRatio: number;
  sharpness: number;
  brightness: number;
  contrast: number;
  rollDeg: number;
  yawRatio: number;
};

export type FaceExtractResult =
  | ({ ok: true; descriptor: number[] } & FaceQuality)
  | { ok: false; error: string };

type MediaSource = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;

function sourceSize(source: MediaSource): { w: number; h: number } {
  if (source instanceof HTMLVideoElement) {
    return { w: source.videoWidth || source.clientWidth, h: source.videoHeight || source.clientHeight };
  }
  if (source instanceof HTMLCanvasElement) {
    return { w: source.width, h: source.height };
  }
  return { w: source.naturalWidth || source.width, h: source.naturalHeight || source.height };
}

type Box = { x: number; y: number; width: number; height: number };

/** ตัดเฉพาะกรอบใบหน้าเป็นภาพเทา size×size สำหรับวัดคุณภาพ */
function grayFaceCrop(source: MediaSource, box: Box, size = 128): Float32Array | null {
  const { w, h } = sourceSize(source);
  if (w < 2 || h < 2) return null;
  const sx = Math.max(0, Math.min(w - 1, Math.round(box.x)));
  const sy = Math.max(0, Math.min(h - 1, Math.round(box.y)));
  const sw = Math.max(2, Math.min(w - sx, Math.round(box.width)));
  const sh = Math.max(2, Math.min(h - sy, Math.round(box.height)));

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const gray = new Float32Array(size * size);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    gray[p] = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
  }
  return gray;
}

function brightnessStats(gray: Float32Array): { mean: number; std: number } {
  let sum = 0;
  for (const v of gray) sum += v;
  const mean = sum / gray.length;
  let acc = 0;
  for (const v of gray) {
    const d = v - mean;
    acc += d * d;
  }
  return { mean, std: Math.sqrt(acc / gray.length) };
}

/** variance ของ Laplacian — ค่าต่ำ = ภาพเบลอ */
function laplacianVariance(gray: Float32Array, size = 128): number {
  const resp: number[] = [];
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const i = y * size + x;
      const v =
        4 * gray[i]! - gray[i - 1]! - gray[i + 1]! - gray[i - size]! - gray[i + size]!;
      resp.push(v);
    }
  }
  if (resp.length === 0) return 0;
  let sum = 0;
  for (const v of resp) sum += v;
  const mean = sum / resp.length;
  let acc = 0;
  for (const v of resp) {
    const d = v - mean;
    acc += d * d;
  }
  return acc / resp.length;
}

type Pt = { x: number; y: number };

function centroid(points: Pt[]): Pt {
  if (points.length === 0) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / points.length, y: sy / points.length };
}

/** roll = เอียงหัว · yawRatio = หันซ้าย/ขวา (จมูกเยื้องจากกลางระหว่างตา) */
function poseFromLandmarks(leftEye: Pt[], rightEye: Pt[], nose: Pt[]): { rollDeg: number; yawRatio: number } {
  const l = centroid(leftEye);
  const r = centroid(rightEye);
  const n = centroid(nose);
  const dx = r.x - l.x;
  const dy = r.y - l.y;
  const eyeDist = Math.hypot(dx, dy);
  const rollDeg = Math.abs((Math.atan2(dy, dx) * 180) / Math.PI);
  if (eyeDist < 1) return { rollDeg, yawRatio: 1 };
  const mid = { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2 };
  const yawRatio = Math.abs(n.x - mid.x) / eyeDist;
  return { rollDeg: rollDeg > 90 ? 180 - rollDeg : rollDeg, yawRatio };
}

export async function extractFaceDescriptorFromImage(source: MediaSource): Promise<FaceExtractResult> {
  let faceapi: FaceApi;
  let useTinyDetector: boolean;
  let useTinyLandmarks: boolean;
  try {
    ({ faceapi, useTinyDetector, useTinyLandmarks } = await ensureModels());
  } catch (e) {
    console.error("[attendance face] load models", e);
    return { ok: false, error: "โหลดโมเดลจดจำใบหน้าไม่สำเร็จ — รีเฟรชหน้าแล้วลองใหม่" };
  }

  try {
    const options = useTinyDetector
      ? new faceapi.TinyFaceDetectorOptions(TINY_OPTS)
      : new faceapi.SsdMobilenetv1Options(SSD_OPTS);

    const results = await faceapi
      .detectAllFaces(source, options)
      .withFaceLandmarks(useTinyLandmarks)
      .withFaceDescriptors();

    if (!results.length) {
      return { ok: false, error: "ไม่พบใบหน้าชัดเจน — จัดใบหน้ากลางเฟรม ใกล้ขึ้น แล้วลองใหม่" };
    }

    const sorted = [...results].sort(
      (a, b) => b.detection.box.width * b.detection.box.height - a.detection.box.width * a.detection.box.height,
    );
    const main = sorted[0]!;
    const runnerUp = sorted[1];
    if (runnerUp) {
      const mainArea = main.detection.box.width * main.detection.box.height;
      const nextArea = runnerUp.detection.box.width * runnerUp.detection.box.height;
      if (mainArea > 0 && nextArea / mainArea > FACE_MAX_SECOND_FACE_RATIO) {
        return { ok: false, error: "มีหลายใบหน้าในเฟรม — ให้เหลือคนเดียวหน้ากล้อง" };
      }
    }

    if (!main.descriptor || main.descriptor.length !== FACE_DESCRIPTOR_LENGTH) {
      return { ok: false, error: "อ่านลักษณะใบหน้าไม่สำเร็จ — ลองใหม่" };
    }

    const detectionScore = main.detection.score;
    if (detectionScore < FACE_MIN_DETECTION_SCORE) {
      return {
        ok: false,
        error: `ใบหน้าไม่ชัดพอ (คะแนน ${(detectionScore * 100).toFixed(0)}%) — เพิ่มแสงและมองตรงกล้อง`,
      };
    }

    const box = main.detection.box;
    const { w, h } = sourceSize(source);
    const minSide = Math.max(1, Math.min(w, h));
    const boxRatio = Math.min(box.width, box.height) / minSide;
    if (boxRatio < FACE_MIN_BOX_RATIO) {
      return { ok: false, error: "ใบหน้าเล็กเกินไปในเฟรม — เข้าใกล้กล้องให้ใบหน้าใหญ่ขึ้น" };
    }

    const { rollDeg, yawRatio } = poseFromLandmarks(
      main.landmarks.getLeftEye(),
      main.landmarks.getRightEye(),
      main.landmarks.getNose(),
    );
    if (rollDeg > FACE_MAX_ROLL_DEG) {
      return { ok: false, error: "หน้าเอียงมากเกินไป — ตั้งหัวตรงแล้วลองใหม่" };
    }
    if (yawRatio > FACE_MAX_YAW_RATIO) {
      return { ok: false, error: "หันหน้ามากเกินไป — มองตรงเข้ากล้อง" };
    }

    const gray = grayFaceCrop(source, box);
    let sharpness = FACE_MIN_SHARPNESS;
    let brightness = (FACE_MIN_BRIGHTNESS + FACE_MAX_BRIGHTNESS) / 2;
    let contrast = FACE_MIN_CONTRAST;
    if (gray) {
      sharpness = laplacianVariance(gray);
      const stats = brightnessStats(gray);
      brightness = stats.mean;
      contrast = stats.std;

      if (sharpness < FACE_MIN_SHARPNESS) {
        return { ok: false, error: "ภาพเบลอ — อยู่นิ่ง ๆ แล้วลองใหม่" };
      }
      if (brightness < FACE_MIN_BRIGHTNESS) {
        return { ok: false, error: "แสงน้อยเกินไป — หาที่สว่างขึ้นแล้วลองใหม่" };
      }
      if (brightness > FACE_MAX_BRIGHTNESS) {
        return { ok: false, error: "แสงจ้าเกินไป — เลี่ยงแสงย้อนหลังแล้วลองใหม่" };
      }
      if (contrast < FACE_MIN_CONTRAST) {
        return { ok: false, error: "ภาพใบหน้าไม่ชัด (แสงแบน) — ปรับแสงแล้วลองใหม่" };
      }
    }

    return {
      ok: true,
      descriptor: l2Normalize(Array.from(main.descriptor)),
      detectionScore,
      boxRatio,
      sharpness,
      brightness,
      contrast,
      rollDeg,
      yawRatio,
    };
  } catch (e) {
    console.error("[attendance face]", e);
    return { ok: false, error: "ประมวลผลใบหน้าไม่สำเร็จ — ลองใหม่อีกครั้ง" };
  }
}

export async function extractFaceDescriptorFromBlob(blob: Blob): Promise<FaceExtractResult> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("bad_image"));
      el.src = url;
    });
    return extractFaceDescriptorFromImage(img);
  } catch {
    return { ok: false, error: "อ่านรูปไม่สำเร็จ" };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function sleep(ms: number) {
  return new Promise((r) => window.setTimeout(r, ms));
}

/** ภาพเทาย่อสำหรับเทียบว่าเฟรมขยับจริง (กันถือรูปถ่าย/ภาพค้าง) */
function tinyGraySnapshot(source: MediaSource, w = 48, h = 36): Float32Array | null {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  try {
    ctx.drawImage(source, 0, 0, w, h);
  } catch {
    return null;
  }
  const { data } = ctx.getImageData(0, 0, w, h);
  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    gray[p] = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
  }
  return gray;
}

function meanAbsDiff(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return 0;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i]! - b[i]!);
  return sum / a.length;
}

/** ต่ำกว่านี้ = ภาพแทบไม่เปลี่ยนเลย (สัญญาณของภาพนิ่ง/สตรีมค้าง) */
export const FACE_MIN_FRAME_MOTION = 0.35;

export type MultiFrameResult =
  | ({ ok: true; descriptor: number[]; samples: number[][]; framesUsed: number; motion: number } & FaceQuality)
  | { ok: false; error: string };

/**
 * ถ่ายหลายเฟรม → ตัดเฟรมหลุด → เฉลี่ย descriptor
 * แม่นกว่าเฟรมเดียวและทนต่อการกะพริบตา/แสงแวบ
 */
export async function captureMultiFrameDescriptor(
  video: HTMLVideoElement,
  opts?: { frames?: number; gapMs?: number; requireMotion?: boolean },
): Promise<MultiFrameResult> {
  const frames = Math.min(FACE_ENROLL_MAX_SAMPLES, Math.max(2, opts?.frames ?? FACE_CAPTURE_FRAMES));
  const gapMs = opts?.gapMs ?? FACE_CAPTURE_GAP_MS;
  const requireMotion = opts?.requireMotion ?? true;

  const samples: number[][] = [];
  const snapshots: Float32Array[] = [];
  let lastErr = "ไม่พบใบหน้าชัดเจน";
  let best: FaceQuality | null = null;

  for (let i = 0; i < frames; i++) {
    if (i > 0) await sleep(gapMs);
    const snap = tinyGraySnapshot(video);
    if (snap) snapshots.push(snap);
    const one = await extractFaceDescriptorFromImage(video);
    if (!one.ok) {
      lastErr = one.error;
      continue;
    }
    samples.push(one.descriptor);
    if (!best || one.detectionScore > best.detectionScore) {
      best = {
        detectionScore: one.detectionScore,
        boxRatio: one.boxRatio,
        sharpness: one.sharpness,
        brightness: one.brightness,
        contrast: one.contrast,
        rollDeg: one.rollDeg,
        yawRatio: one.yawRatio,
      };
    }
  }

  if (samples.length < 2 || !best) {
    return { ok: false, error: `${lastErr} (ได้ชัด ${samples.length}/${frames} เฟรม)` };
  }

  let motion = 0;
  for (let i = 1; i < snapshots.length; i++) {
    motion = Math.max(motion, meanAbsDiff(snapshots[i - 1]!, snapshots[i]!));
  }
  if (requireMotion && snapshots.length >= 2 && motion < FACE_MIN_FRAME_MOTION) {
    return {
      ok: false,
      error: "ภาพไม่เปลี่ยนแปลงเลย — ต้องเป็นคนจริงหน้ากล้อง (ไม่ใช่รูปถ่าย/หน้าจอ)",
    };
  }

  const { kept } = filterOutlierSamples(samples);
  const avg = averageDescriptors(kept);
  if (!avg) return { ok: false, error: "ประมวลผลใบหน้าไม่สำเร็จ" };

  return {
    ok: true,
    descriptor: avg,
    samples: kept,
    framesUsed: kept.length,
    motion,
    ...best,
  };
}

export async function preloadAttendanceFaceModels(): Promise<void> {
  await ensureModels();
}
