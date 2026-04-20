import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function safeFilename(raw: string): string | null {
  const name = raw.trim();
  if (!name || name.length > 180) return null;
  if (name.includes("..") || name.includes("/") || name.includes("\\")) return null;
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) return null;
  return name;
}

export async function GET(_: Request, ctx: { params: Promise<{ filename: string }> }) {
  const { filename: raw } = await ctx.params;
  const filename = safeFilename(raw);
  if (!filename) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME_BY_EXT[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const absolute = path.join(process.cwd(), "public", "uploads", "module-cards", filename);
  let buf: Buffer;
  try {
    buf = await readFile(absolute);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = new Uint8Array(buf);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}

