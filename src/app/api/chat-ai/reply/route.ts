import { NextResponse } from "next/server";
import { z } from "zod";
import { runPersonalAiChat } from "@/lib/chat-ai/personal-ai-service";
import { requireChatAiPermission } from "@/lib/chat-ai/permission-middleware";

const bodySchema = z.object({
  message: z.string().min(1).max(4000).nullish(),
  imageDataUrl: z.string().max(8_000_000).nullish(),
  sessionId: z.string().nullish(),
  reset: z.boolean().nullish(),
});

export async function POST(req: Request) {
  const guard = await requireChatAiPermission();
  if (!guard.ok) return guard.response;
  const { user } = guard;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลข้อความไม่ถูกต้อง" }, { status: 400 });
  }
  const result = await runPersonalAiChat({
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    sessionId: parsed.data.sessionId ?? undefined,
    message: parsed.data.message ?? undefined,
    imageDataUrl: parsed.data.imageDataUrl ?? undefined,
    reset: parsed.data.reset ?? undefined,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
