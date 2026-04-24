import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireChatAiPermission } from "@/lib/chat-ai/permission-middleware";
import type { Prisma } from "@/generated/prisma/client";

const actionSchema = z.discriminatedUnion("tool", [
  z.object({
    tool: z.literal("saveNote"),
    content: z.string().min(1).max(4000),
    tags: z.array(z.string().min(1).max(40)).max(10).optional(),
  }),
  z.object({
    tool: z.literal("getNotes"),
    query: z.string().max(120).optional(),
    limit: z.number().int().min(1).max(50).optional(),
  }),
  z.object({
    tool: z.literal("createPlan"),
    title: z.string().min(1).max(200),
    steps: z.array(z.string().min(1).max(300)).min(1).max(30),
    dueDate: z.string().datetime().optional(),
  }),
  z.object({
    tool: z.literal("parseSlip"),
    imageUrl: z.string().url().max(2048),
    parsedData: z.record(z.string(), z.unknown()).optional(),
    amount: z.number().positive().optional(),
    date: z.string().datetime().optional(),
    category: z.string().max(120).optional(),
  }),
  z.object({
    tool: z.literal("webSearch"),
    query: z.string().min(1).max(200),
  }),
]);

export async function POST(req: Request) {
  const guard = await requireChatAiPermission();
  if (!guard.ok) return guard.response;
  const { user } = guard;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "พารามิเตอร์ของเครื่องมือไม่ถูกต้อง" }, { status: 400 });
  }

  const action = parsed.data;

  if (action.tool === "saveNote") {
    const note = await prisma.personalAiNote.create({
      data: {
        userId: user.id,
        content: action.content.trim(),
        tags: action.tags ?? [],
      },
      select: { id: true, content: true, tags: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, tool: action.tool, note });
  }

  if (action.tool === "getNotes") {
    const notes = await prisma.personalAiNote.findMany({
      where: {
        userId: user.id,
        ...(action.query
          ? {
              content: {
                contains: action.query.trim(),
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: action.limit ?? 10,
      select: { id: true, content: true, tags: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, tool: action.tool, notes });
  }

  if (action.tool === "createPlan") {
    const plan = await prisma.personalAiPlan.create({
      data: {
        userId: user.id,
        title: action.title.trim(),
        steps: action.steps,
        dueDate: action.dueDate ? new Date(action.dueDate) : null,
      },
      select: { id: true, title: true, steps: true, status: true, dueDate: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, tool: action.tool, plan });
  }

  if (action.tool === "parseSlip") {
    const rec = await prisma.personalAiSlipRecord.create({
      data: {
        userId: user.id,
        imageUrl: action.imageUrl,
        parsedData: (action.parsedData ?? {}) as Prisma.InputJsonValue,
        amount: action.amount ?? null,
        slipDate: action.date ? new Date(action.date) : null,
        category: action.category ?? null,
      },
      select: { id: true, imageUrl: true, parsedData: true, amount: true, slipDate: true, category: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, tool: action.tool, slipRecord: rec });
  }

  const searchUrl = new URL("https://api.duckduckgo.com/");
  searchUrl.searchParams.set("q", action.query);
  searchUrl.searchParams.set("format", "json");
  searchUrl.searchParams.set("no_html", "1");
  searchUrl.searchParams.set("no_redirect", "1");

  try {
    const res = await fetch(searchUrl.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json()) as Record<string, unknown>;
    return NextResponse.json({
      ok: true,
      tool: action.tool,
      result: {
        abstract: typeof data.AbstractText === "string" ? data.AbstractText : "",
        source: typeof data.AbstractSource === "string" ? data.AbstractSource : "",
        heading: typeof data.Heading === "string" ? data.Heading : "",
      },
    });
  } catch {
    return NextResponse.json({ error: "ค้นหาข้อมูลไม่สำเร็จ" }, { status: 502 });
  }
}
