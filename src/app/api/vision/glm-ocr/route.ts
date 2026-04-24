import { NextResponse } from "next/server";
import { z } from "zod";
import { requireChatAiPermission } from "@/lib/chat-ai/permission-middleware";
import { dataUrlToBase64Raw, readSlipWithKimiThenGlmOcr } from "@/lib/vision/glm-ocr-service";

const bodySchema = z.object({
  imageDataUrl: z.string().min(20).max(8_000_000),
});

/**
 * POST /api/vision/glm-ocr — อ่านสลิป: Kimi (OLLAMA_SLIP_VISION_*) ก่อน แล้วค่อย GLM-OCR รอง; ก่อนยืนยันบันทึก
 */
export async function POST(req: Request) {
  const guard = await requireChatAiPermission();
  if (!guard.ok) return guard.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ส่ง imageDataUrl ไม่ถูกต้อง" }, { status: 400 });
  }

  const b64 = dataUrlToBase64Raw(parsed.data.imageDataUrl);
  if (!b64) {
    return NextResponse.json({ error: "รูปต้องเป็น data URL แบบ base64" }, { status: 400 });
  }

  try {
    const result = await readSlipWithKimiThenGlmOcr(b64, AbortSignal.timeout(85_000));
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "GLM-OCR ล้มเหลว";
    console.warn("glm-ocr:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
