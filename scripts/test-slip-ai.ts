import { readFile } from "fs/promises";
import "dotenv/config";
import { ollamaCallVisionText } from "../src/lib/ollama/ollama-vision";
import { OLLAMA_DEFAULT_SLIP_VISION_MODEL } from "../src/lib/home-finance/slip-vision-prompts";

function normalizeYmdLike(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const slash = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const d = slash[1].padStart(2, "0");
    const m = slash[2].padStart(2, "0");
    return `${slash[3]}-${m}-${d}`;
  }
  return null;
}

function parseAmount(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const n = Number(value.replace(/[,\s]/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

function normalizeAiSuggestion(aiRaw: unknown) {
  const root = aiRaw && typeof aiRaw === "object" ? (aiRaw as Record<string, unknown>) : {};
  const rawTextCandidate =
    typeof root.text === "string"
      ? root.text
      : typeof root.ocrText === "string"
        ? root.ocrText
        : typeof root.rawText === "string"
          ? root.rawText
          : "";
  const fields =
    root.fields && typeof root.fields === "object"
      ? (root.fields as Record<string, unknown>)
      : (root as Record<string, unknown>);

  const amount = parseAmount(fields.amount) ?? parseAmount(fields.total);
  const entryDate = normalizeYmdLike(fields.entryDate) ?? normalizeYmdLike(fields.date);
  const typeRaw = typeof fields.type === "string" ? fields.type.trim().toUpperCase() : "";

  return {
    providerRawKeys: Object.keys(root),
    type: typeRaw === "INCOME" || typeRaw === "EXPENSE" ? typeRaw : null,
    amount,
    entryDate,
    title:
      typeof fields.title === "string"
        ? fields.title
        : typeof fields.merchant === "string"
          ? fields.merchant
          : null,
    merchant: typeof fields.merchant === "string" ? fields.merchant : null,
    billNumber:
      typeof fields.referenceNo === "string"
        ? fields.referenceNo
        : typeof fields.billNumber === "string"
          ? fields.billNumber
          : null,
    paymentMethod: typeof fields.paymentMethod === "string" ? fields.paymentMethod : null,
    confidence: typeof fields.confidence === "number" ? fields.confidence : root.confidence ?? null,
    rawTextPreview: rawTextCandidate.slice(0, 240),
    raw: aiRaw,
  };
}

function extractJsonObjectText(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const content = fence ? fence[1].trim() : trimmed;
  if (content.startsWith("{") && content.endsWith("}")) return content;
  const start = content.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < content.length; i += 1) {
    const ch = content[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }
    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return content.slice(start, i + 1);
    }
  }
  return null;
}

async function callOpenClaw(imageBase64: string, mimeType: string) {
  const endpoint = process.env.OPENCLAW_URL?.trim() || process.env.OPENCLAW_API_URL?.trim() || "";
  const apiKey = process.env.OPENCLAW_API_KEY?.trim() || "";
  if (!endpoint) return null;
  const payload = {
    task: "receipt_ocr",
    mimeType,
    imageBase64,
  };
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) {
    return { provider: "openclaw", ok: false, status: res.status, data: await res.text() };
  }
  return { provider: "openclaw", ok: true, status: 200, data: await res.json() };
}

async function callOllama(imageBase64: string) {
  const endpoint = process.env.OLLAMA_API_URL?.trim() || process.env.OLLAMA_URL?.trim() || "";
  const model =
    process.env.OLLAMA_VISION_MODEL?.trim() ||
    process.env.OLLAMA_MODEL?.trim() ||
    OLLAMA_DEFAULT_SLIP_VISION_MODEL;
  if (!endpoint) return null;
  const prompt =
    'อ่านข้อความจากสลิป/บิล แล้วตอบเฉพาะ JSON object ที่มี fields.amount, fields.entryDate, fields.title, fields.merchant, fields.referenceNo, fields.paymentMethod, fields.type, fields.confidence และ text';
  let rawResponse: string;
  try {
    rawResponse = await ollamaCallVisionText({
      apiUrlFromEnv: endpoint,
      model,
      userPrompt: prompt,
      imageBase64,
      temperature: 0.1,
      signal: AbortSignal.timeout(180_000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { provider: "ollama" as const, ok: false as const, status: 502, data: msg };
  }
  const jsonText = extractJsonObjectText(rawResponse);
  const parsed: unknown = jsonText
    ? JSON.parse(jsonText)
    : (() => {
        try {
          return JSON.parse(rawResponse) as unknown;
        } catch {
          return { raw: rawResponse };
        }
      })();
  return { provider: "ollama" as const, ok: true as const, status: 200, data: parsed };
}

async function main() {
  const imagePath = process.argv[2];
  if (!imagePath) {
    console.error("Usage: npx tsx scripts/test-slip-ai.ts <image-path>");
    process.exit(1);
  }

  const file = await readFile(imagePath);
  const imageBase64 = file.toString("base64");
  const mimeType = imagePath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";

  const openclaw = await callOpenClaw(imageBase64, mimeType);
  if (openclaw?.ok) {
    console.log("provider=openclaw status=ok");
    console.log(JSON.stringify(normalizeAiSuggestion(openclaw.data), null, 2));
    return;
  }
  if (openclaw && !openclaw.ok) {
    console.log(`provider=openclaw status=error http=${openclaw.status}`);
  }

  const ollama = await callOllama(imageBase64);
  if (ollama?.ok) {
    console.log("provider=ollama status=ok");
    console.log(JSON.stringify(normalizeAiSuggestion(ollama.data), null, 2));
    return;
  }
  if (ollama && !ollama.ok) {
    console.log(`provider=ollama status=error http=${ollama.status}`);
  }

  console.log("No AI provider configured or all providers failed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
