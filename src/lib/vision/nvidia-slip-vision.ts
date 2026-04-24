/**
 * NVIDIA integrate.api.nvidia.com — multimodal chat completions (เช่น Kimi K2.5)
 * ใช้เฉพาะอ่านสลิปเมื่อตั้ง NVIDIA_API_KEY
 */

function nvidiaSlipSkip(): boolean {
  const v = process.env.NVIDIA_SLIP_SKIP?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function nvidiaSlipOcrConfigured(): boolean {
  if (nvidiaSlipSkip()) return false;
  return Boolean(process.env.NVIDIA_API_KEY?.trim());
}

export function nvidiaSlipModel(): string {
  return process.env.NVIDIA_SLIP_VISION_MODEL?.trim() || "moonshotai/kimi-k2.5";
}

function nvidiaChatCompletionsUrl(): string {
  return (
    process.env.NVIDIA_CHAT_COMPLETIONS_URL?.trim() ||
    "https://integrate.api.nvidia.com/v1/chat/completions"
  );
}

/** data URL สำหรับ image_url.url — ดีฟอลต์ jpeg ให้สอดคล้องกับ prepareImageFileForVisionOcr */
function imageDataUrlForNvidia(imageBase64Raw: string): string {
  const mime = process.env.NVIDIA_SLIP_IMAGE_MIME?.trim() || "image/jpeg";
  const normalized = mime.includes("/") ? mime : `image/${mime}`;
  return `data:${normalized};base64,${imageBase64Raw}`;
}

function extractOpenAiStyleAssistantText(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const err = o.error;
  if (err && typeof err === "object") {
    const msg = (err as { message?: string }).message;
    if (typeof msg === "string" && msg.trim()) return null;
  }
  const choices = o.choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const c0 = choices[0];
  if (!c0 || typeof c0 !== "object") return null;
  const message = (c0 as Record<string, unknown>).message;
  if (!message || typeof message !== "object") return null;
  const content = (message as Record<string, unknown>).content;
  if (typeof content === "string" && content.trim()) return content.trim();
  if (Array.isArray(content)) {
    const parts: string[] = [];
    for (const item of content) {
      if (typeof item === "string" && item.trim()) parts.push(item.trim());
      else if (item && typeof item === "object") {
        const x = item as Record<string, unknown>;
        if (x.type === "text" && typeof x.text === "string" && x.text.trim()) parts.push(x.text.trim());
      }
    }
    const joined = parts.join("\n").trim();
    return joined || null;
  }
  return null;
}

/**
 * เรียก NVIDIA /v1/chat/completions พร้อมข้อความ + รูปแบบ data URL
 */
export async function callNvidiaSlipVision(
  imageBase64Raw: string,
  userPrompt: string,
  signal: AbortSignal,
): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ยังไม่ได้ตั้ง NVIDIA_API_KEY");
  }
  const url = nvidiaChatCompletionsUrl();
  const model = nvidiaSlipModel();
  const dataUrl = imageDataUrlForNvidia(imageBase64Raw);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.1,
    }),
    signal,
  });

  const raw = await res.text();
  let data: unknown = null;
  try {
    data = JSON.parse(raw) as unknown;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "error" in (data as object)
        ? JSON.stringify((data as { error?: unknown }).error).slice(0, 400)
        : raw.slice(0, 400);
    throw new Error(`NVIDIA chat/completions ไม่สำเร็จ (${res.status}): ${msg}`);
  }

  const text = extractOpenAiStyleAssistantText(data);
  if (!text) {
    throw new Error("NVIDIA ไม่ได้ส่งข้อความตอบกลับที่อ่านได้");
  }
  return text;
}
