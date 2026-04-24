/**
 * Ollama vision: หลายโมเดล (เช่น qwen2.5-vl) อ่านรูปดีกว่าผ่าน /api/chat + messages
 * /api/generate ยังใช้รอง (เช่น llava เดิม) — รองรับ OLLAMA_API_URL ทั้งแบบมี path / ไม่มี
 */

export function ollamaBaseUrl(ollamaUrl: string): string {
  return ollamaUrl
    .trim()
    .replace(/\/api\/.*$/, "")
    .replace(/\/$/, "");
}

function ollamaApiChat(ollamaUrl: string): string {
  return `${ollamaBaseUrl(ollamaUrl)}/api/chat`;
}

function ollamaApiGenerate(ollamaUrl: string): string {
  return `${ollamaBaseUrl(ollamaUrl)}/api/generate`;
}

function isThinkingChunk(o: Record<string, unknown>): boolean {
  const t = typeof o.type === "string" ? o.type.toLowerCase() : "";
  return (
    t === "thinking" ||
    t === "reasoning" ||
    t === "redacted_reasoning" ||
    t === "analysis" ||
    t === "tool_call"
  );
}

function extractMessageContentText(content: unknown): string | null {
  if (typeof content === "string" && content.trim()) return content.trim();
  if (Array.isArray(content)) {
    const parts: string[] = [];
    for (const item of content) {
      if (typeof item === "string") parts.push(item);
      else if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        if (isThinkingChunk(o)) continue;
        if (typeof o.text === "string") parts.push(o.text);
        else if (typeof o.content === "string") parts.push(o.content);
      }
    }
    const joined = parts.join("\n").trim();
    if (joined) return joined;
    /** บางโมเดลส่ง JSON อยู่ท้าย chunk เดียว — ลองเอาเฉพาะ chunk สุดท้ายที่ไม่ใช่ thinking */
    const tail: string[] = [];
    for (let i = content.length - 1; i >= 0; i--) {
      const item = content[i];
      if (typeof item === "string" && item.trim()) {
        tail.push(item.trim());
        break;
      }
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        if (isThinkingChunk(o)) continue;
        if (typeof o.text === "string" && o.text.trim()) {
          tail.push(o.text.trim());
          break;
        }
        if (typeof o.content === "string" && o.content.trim()) {
          tail.push(o.content.trim());
          break;
        }
      }
    }
    return tail[0] ?? null;
  }
  return null;
}

function extractOllamaReplyText(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (o.message && typeof o.message === "object") {
    const content = (o.message as { content?: unknown }).content;
    const asText = extractMessageContentText(content);
    if (asText) return asText;
  }
  if (typeof o.response === "string" && o.response.trim()) return o.response.trim();
  return null;
}

function readOllamaError(data: unknown): string {
  if (data && typeof data === "object" && "error" in (data as object)) {
    const e = (data as { error?: string }).error;
    if (typeof e === "string" && e.trim()) return e.trim();
  }
  return "";
}

export type OllamaVisionTextArgs = {
  /** ค่าจาก env (อาลงท้าย /api/generate หรือ bare host) */
  apiUrlFromEnv: string;
  model: string;
  userPrompt: string;
  imageBase64: string;
  temperature: number;
  signal: AbortSignal;
};

/**
 * อ่านรูป + prompt — ลอง /api/chat ก่อน แล้วค่อย /api/generate
 */
export async function ollamaCallVisionText(args: OllamaVisionTextArgs): Promise<string> {
  const { model, userPrompt, imageBase64, temperature, signal } = args;
  const chatUrl = ollamaApiChat(args.apiUrlFromEnv);
  const generateUrl = ollamaApiGenerate(args.apiUrlFromEnv);

  const resChat = await fetch(chatUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        {
          role: "user",
          content: userPrompt,
          images: [imageBase64],
        },
      ],
      options: { temperature },
    }),
    signal,
  });
  const rawChat = await resChat.text();
  let dataChat: unknown;
  try {
    dataChat = JSON.parse(rawChat) as unknown;
  } catch {
    dataChat = null;
  }
  const textChat = dataChat != null ? extractOllamaReplyText(dataChat) : null;
  if (resChat.ok && textChat) {
    return textChat;
  }

  const resGen = await fetch(generateUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      prompt: userPrompt,
      images: [imageBase64],
      options: { temperature },
    }),
    signal,
  });
  const rawGen = await resGen.text();
  let dataGen: unknown;
  try {
    dataGen = JSON.parse(rawGen) as unknown;
  } catch {
    dataGen = null;
  }
  const textGen = dataGen != null ? extractOllamaReplyText(dataGen) : null;
  if (resGen.ok && textGen) {
    return textGen;
  }

  const p1 = resChat.ok ? (textChat ? "empty" : readOllamaError(dataChat) || rawChat.slice(0, 300)) : `HTTP ${resChat.status}: ${rawChat.slice(0, 400)}`;
  const p2 = resGen.ok ? (textGen ? "empty" : readOllamaError(dataGen) || rawGen.slice(0, 300)) : `HTTP ${resGen.status}: ${rawGen.slice(0, 400)}`;
  throw new Error(
    `Ollama อ่านรูปไม่สำเร็จ (ลอง /api/chat แล้ว /api/generate): chat: ${p1} | generate: ${p2}`,
  );
}
