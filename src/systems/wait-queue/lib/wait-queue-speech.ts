/**
 * ประกาศคิวด้วยเสียง
 * 1) Google Cloud TTS ฝั่งเซิร์ฟ (ถ้าตั้งคีย์) — เล่นผ่าน Web Audio API (นิ่งกว่า <audio> หลัง fetch)
 * 2) Web Speech API — fallback
 */

let serverTtsConfiguredCache: boolean | null = null;

async function fetchServerTtsConfigured(): Promise<boolean> {
  if (serverTtsConfiguredCache !== null) return serverTtsConfiguredCache;
  try {
    const r = await fetch("/api/wait-queue/tts", { credentials: "same-origin" });
    const j = (await r.json()) as { configured?: boolean };
    serverTtsConfiguredCache = Boolean(j.configured);
  } catch {
    serverTtsConfiguredCache = false;
  }
  return serverTtsConfiguredCache;
}

/** เรียกจาก onPointerDown คู่กับปุ่มพูด — ช่วยให้เบราว์เซอร์ปลดล็อกการเล่นเสียงหลัง fetch (โดยเฉพาะมือถือ) */
export function primeWaitQueueAudioContext(): void {
  if (typeof window === "undefined") return;
  try {
    void getSharedAudioContext()?.resume();
  } catch {
    /* ignore */
  }
}

let sharedAudioContext: AudioContext | null = null;
let currentBufferSource: AudioBufferSourceNode | null = null;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (sharedAudioContext) return sharedAudioContext;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  sharedAudioContext = new AC();
  return sharedAudioContext;
}

type WaitQueueTtsLanguage = "th-TH" | "en-US";

async function tryPlayServerTts(text: string, languageCode: WaitQueueTtsLanguage = "en-US"): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const res = await fetch("/api/wait-queue/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, languageCode }),
      credentials: "same-origin",
    });
    if (!res.ok) return false;
    const ct = (res.headers.get("content-type") ?? "").toLowerCase();
    if (ct.includes("application/json")) return false;
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0) return false;

    const ctx = getSharedAudioContext();
    if (!ctx) return false;
    await ctx.resume();

    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await ctx.decodeAudioData(buf.slice(0));
    } catch {
      return false;
    }

    try {
      currentBufferSource?.stop();
    } catch {
      /* ignore */
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    currentBufferSource = source;
    source.onended = () => {
      if (currentBufferSource === source) currentBufferSource = null;
    };
    source.start(0);
    return true;
  } catch {
    return false;
  }
}

/** fallback ถ้า Web Audio ล้มเหลว */
let fallbackHtmlAudio: HTMLAudioElement | null = null;

async function tryPlayServerTtsHtmlAudio(text: string, languageCode: WaitQueueTtsLanguage = "en-US"): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const res = await fetch("/api/wait-queue/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, languageCode }),
      credentials: "same-origin",
    });
    if (!res.ok) return false;
    const blob = await res.blob();
    if (blob.size === 0) return false;
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    audio.setAttribute("playsinline", "true");
    audio.volume = 1;
    audio.src = url;
    fallbackHtmlAudio = audio;
    const cleanup = () => {
      URL.revokeObjectURL(url);
      if (fallbackHtmlAudio === audio) fallbackHtmlAudio = null;
    };
    audio.onended = cleanup;
    audio.onerror = cleanup;
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined" &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

function normalizeLang(lang: string): string {
  return lang.trim().toLowerCase().replace(/_/g, "-");
}

function isThaiVoice(v: SpeechSynthesisVoice): boolean {
  const lang = normalizeLang(v.lang ?? "");
  if (lang.startsWith("en-")) return false;
  if (lang === "th" || lang.startsWith("th-")) return true;
  const name = `${v.name} ${v.voiceURI ?? ""}`.toLowerCase();
  return (
    /\bthai\s*\(\s*thailand\s*\)|ไทย\s*\(\s*ประเทศไทย\s*\)|\(thailand\).*thai|ภาษาไทย|premwadee|microsoft.*\bthai\b|google.*ไทย|^ไทย\b/i.test(
      name,
    ) || (/\bthai\b/.test(name) && /\bthailand\b/.test(name))
  );
}

async function waitForVoicesReady(): Promise<void> {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;

  await new Promise<void>((resolve) => {
    synth.getVoices();
    if (synth.getVoices().length > 0) {
      resolve();
      return;
    }
    synth.addEventListener("voiceschanged", () => resolve(), { once: true });
    window.setTimeout(() => resolve(), 2800);
  });

  for (let i = 0; i < 35; i++) {
    synth.getVoices();
    if (synth.getVoices().some(isThaiVoice)) return;
    await new Promise((r) => window.setTimeout(r, 100));
  }
}

function isThailandThaiVoice(v: SpeechSynthesisVoice): boolean {
  const lang = normalizeLang(v.lang ?? "");
  return lang === "th-th" || lang.startsWith("th-th-");
}

function voiceHaystack(v: SpeechSynthesisVoice): string {
  return `${v.name} ${v.voiceURI ?? ""}`.toLowerCase();
}

function isExplicitMaleThaiVoice(v: SpeechSynthesisVoice): boolean {
  const s = voiceHaystack(v);
  if (/\bfemale\b|\bหญิง\b|\bwoman\b/i.test(s)) return false;
  return /\bmale\b|\bชาย\b|\bmale voice\b|\b(paul|daniel|david)\b.*\bth/i.test(s);
}

function isKnownFemaleThaiTtsName(v: SpeechSynthesisVoice): boolean {
  return /premwadee|ปรีมวดี|pattara|ปัทรา|achara|อัจฉรา|google.*th.*female|thai.*\(.*female|natural.*th-th.*female|เสียงผู้หญิง/i.test(
    v.name,
  );
}

function isEnglishUsVoice(v: SpeechSynthesisVoice): boolean {
  const lang = normalizeLang(v.lang ?? "");
  return lang === "en-us" || lang.startsWith("en-us-") || lang === "en" || lang.startsWith("en-");
}

function pickEnglishVoice(): SpeechSynthesisVoice | undefined {
  window.speechSynthesis.getVoices();
  const voices = window.speechSynthesis.getVoices().filter(isEnglishUsVoice);
  if (voices.length === 0) return undefined;
  const female = voices.filter((v) =>
    /female|samantha|zira|aria|jenny|karen|victoria/i.test(`${v.name} ${v.voiceURI ?? ""}`),
  );
  return female[0] ?? voices[0];
}

function isLikelyFemaleThaiVoice(v: SpeechSynthesisVoice): boolean {
  const s = voiceHaystack(v);
  if (isExplicitMaleThaiVoice(v)) return false;
  if (/\bfemale\b|\bหญิง\b|\bwoman\b|\bgirl\b|\bfeminine\b/i.test(s)) return true;
  if (isKnownFemaleThaiTtsName(v)) return true;
  return false;
}

function pickThaiFemaleVoice(): SpeechSynthesisVoice | undefined {
  window.speechSynthesis.getVoices();
  const voices = window.speechSynthesis.getVoices();
  const thAll = voices.filter(isThaiVoice);
  if (thAll.length === 0) {
    return undefined;
  }

  const thTH = thAll.filter(isThailandThaiVoice);
  const poolPrimary = thTH.length > 0 ? thTH : thAll;

  const femalePrimary = poolPrimary.filter((v) => isLikelyFemaleThaiVoice(v));
  if (femalePrimary.length > 0) return femalePrimary[0];

  const notMalePrimary = poolPrimary.filter((v) => !isExplicitMaleThaiVoice(v));
  if (notMalePrimary.length > 0) return notMalePrimary[0];

  if (poolPrimary.length > 0) return poolPrimary[0];

  const femaleAny = thAll.filter((v) => isLikelyFemaleThaiVoice(v));
  if (femaleAny.length > 0) return femaleAny[0];

  const notMaleAny = thAll.filter((v) => !isExplicitMaleThaiVoice(v));
  if (notMaleAny.length > 0) return notMaleAny[0];

  return thAll[0];
}

export type WaitQueueAnnouncementParams = {
  ticketLabel: string;
  /** เก็บไว้เพื่อความเข้ากันกับผู้เรียก — ไม่ใช้ในข้อความประกาศเสียง */
  callMessage: string;
  note?: string | null;
  customerName?: string | null;
  partySize: number;
};

const EN_DIGIT_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"] as const;

/** อ่านเฉพาะตัวเลขในป้ายคิวเป็นภาษาอังกฤษทีละหลัก (เช่น 006 → zero, zero, six) */
export function queueTicketLabelToEnglishDigitWords(label: string): string {
  const digits = label.replace(/\D/g, "");
  const seq = digits.length > 0 ? digits : "0";
  return [...seq]
    .map((ch) => {
      const n = Number(ch);
      return n >= 0 && n <= 9 ? EN_DIGIT_WORDS[n] : ch;
    })
    .join(", ");
}

/** ข้อความสำหรับ TTS — เฉพาะเลขคิว (อังกฤษทีละหลัก) ตามด้วย Please come in. */
export function buildWaitQueueAnnouncementPhrase(p: WaitQueueAnnouncementParams): string {
  const spoken = queueTicketLabelToEnglishDigitWords(p.ticketLabel);
  return `${spoken}. Please come in.`;
}

function speakWithBrowserTts(text: string, language: WaitQueueTtsLanguage): boolean {
  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.92;
  utter.pitch = 1;

  if (language === "en-US") {
    let en = pickEnglishVoice();
    if (!en) {
      synth.getVoices();
      en = pickEnglishVoice();
    }
    if (en) {
      utter.voice = en;
      const lang = normalizeLang(en.lang ?? "");
      utter.lang = lang.startsWith("en") ? (lang === "en" ? "en-US" : lang) : "en-US";
    } else {
      utter.lang = "en-US";
    }
    synth.speak(utter);
    return true;
  }

  let th = pickThaiFemaleVoice();
  if (!th) {
    synth.getVoices();
    th = pickThaiFemaleVoice();
  }

  if (th) {
    utter.voice = th;
    const lang = normalizeLang(th.lang ?? "");
    let utterLang = "th-TH";
    if (lang.startsWith("th")) {
      utterLang = lang === "th" ? "th-TH" : lang;
    }
    utter.lang = utterLang;
  } else {
    /** ไม่มีรายการเสียงไทย — บังคับ locale ให้เบราว์เซอร์เลือกคู่ภาษา (ได้ยินอะไรดีกว่าเงียบ) */
    utter.lang = "th-TH";
  }

  synth.speak(utter);
  return true;
}

export type SpeakWaitQueueAnnouncementOptions = {
  /** ค่าเริ่มต้น en-US — ให้สอดคล้องกับประกาศเลข + Please come in. */
  language?: WaitQueueTtsLanguage;
};

/**
 * @returns true ถ้ามีการเริ่มเล่นเสียง (หรือใส่คิวพูดแล้ว)
 */
export async function speakWaitQueueAnnouncement(
  text: string,
  options?: SpeakWaitQueueAnnouncementOptions,
): Promise<boolean> {
  const t = text.trim();
  if (!t) return false;

  const language = options?.language ?? "en-US";

  primeWaitQueueAudioContext();
  cancelWaitQueueSpeech();

  const serverConfigured = await fetchServerTtsConfigured();
  if (serverConfigured) {
    let played = await tryPlayServerTts(t, language);
    if (!played) {
      played = await tryPlayServerTtsHtmlAudio(t, language);
    }
    if (played) return true;
  }

  if (!isSpeechSynthesisSupported()) return false;

  const synth = window.speechSynthesis;
  synth.cancel();
  await waitForVoicesReady();

  return speakWithBrowserTts(t, language);
}

export function hasInstalledThaiSpeechVoice(): boolean {
  if (!isSpeechSynthesisSupported()) return false;
  try {
    const synth = window.speechSynthesis;
    synth.getVoices();
    let ok = synth.getVoices().some(isThaiVoice);
    if (!ok) {
      synth.getVoices();
      ok = synth.getVoices().some(isThaiVoice);
    }
    return ok;
  } catch {
    return false;
  }
}

export function cancelWaitQueueSpeech(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  try {
    currentBufferSource?.stop();
  } catch {
    /* ignore */
  }
  currentBufferSource = null;
  if (fallbackHtmlAudio) {
    try {
      fallbackHtmlAudio.pause();
      fallbackHtmlAudio.src = "";
    } catch {
      /* ignore */
    }
    fallbackHtmlAudio = null;
  }
}