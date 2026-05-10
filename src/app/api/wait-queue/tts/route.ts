import { NextResponse } from "next/server";
import { getWaitQueueOwnerContext } from "@/systems/wait-queue/lib/wait-queue-api-auth";

const MAX_TEXT_LEN = 1200;

function getGoogleTtsApiKey(): string | undefined {
  const k = process.env.GOOGLE_CLOUD_TTS_API_KEY ?? process.env.GOOGLE_TTS_API_KEY;
  return k?.trim() || undefined;
}

/** ไม่ต้องล็อกอิน — ใช้บอกไคลเอนต์ว่ามี TTS ฝั่งเซิร์ฟหรือไม่ (ไม่เปิดเผยคีย์) */
export async function GET() {
  return NextResponse.json({ configured: Boolean(getGoogleTtsApiKey()) });
}

/**
 * POST { text, languageCode? } → MP3
 * - languageCode ไม่ส่งหรือไม่ใช่ th-TH → en-US (ค่าเริ่มต้นสำหรับประกาศคิวภาษาอังกฤษ)
 * - languageCode th-TH → เสียงไทย (GOOGLE_CLOUD_TTS_VOICE / th-TH-Standard-A)
 */
export async function POST(req: Request) {
  const ctx = await getWaitQueueOwnerContext();
  if (!ctx) {
    return NextResponse.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }

  const apiKey = getGoogleTtsApiKey();
  if (!apiKey) {
    return NextResponse.json({ ok: false, fallback: true }, { status: 503 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const text =
    typeof raw === "object" && raw !== null && "text" in raw ? String((raw as { text: unknown }).text) : "";
  const languageCode =
    typeof raw === "object" &&
    raw !== null &&
    "languageCode" in raw &&
    String((raw as { languageCode?: unknown }).languageCode) === "th-TH"
      ? "th-TH"
      : "en-US";

  const trimmed = text.trim().slice(0, MAX_TEXT_LEN);
  if (!trimmed) {
    return NextResponse.json({ error: "ไม่มีข้อความ" }, { status: 400 });
  }

  const voiceName =
    languageCode === "en-US"
      ? process.env.GOOGLE_CLOUD_TTS_VOICE_EN?.trim() ||
        process.env.GOOGLE_TTS_VOICE_EN?.trim() ||
        "en-US-Neural2-F"
      : process.env.GOOGLE_CLOUD_TTS_VOICE?.trim() || process.env.GOOGLE_TTS_VOICE?.trim() || "th-TH-Standard-A";

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text: trimmed },
      voice: {
        languageCode,
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.95,
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[wait-queue/tts] Google TTS error", res.status, errBody.slice(0, 500));
    return NextResponse.json({ error: "สังเคราะห์เสียงไม่สำเร็จ" }, { status: 502 });
  }

  const json = (await res.json()) as { audioContent?: string };
  if (!json.audioContent) {
    return NextResponse.json({ error: "ไม่มีข้อมูลเสียง" }, { status: 502 });
  }

  const buf = Buffer.from(json.audioContent, "base64");
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
