import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export const dynamic = "force-dynamic";

/**
 * ดึงรูปสลิป barber-cash-receipts ด้วย session — ใช้เป็น src ของรูปในแดชบอร์ด
 * (กรณีเสิร์ฟไฟล์จาก public ไม่เสถียร หรือต้องการให้โหลดเฉพาะผู้ล็อกอิน)
 */
export async function GET(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name")?.trim() ?? "";
  const ownerPrefix = own.ownerId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 16) || "u";

  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
    return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
  }
  if (!name.startsWith(`${ownerPrefix}-`)) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(name) || name.length > 220) {
    return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
  }

  const ext = name.includes(".") ? (name.split(".").pop()?.toLowerCase() ?? "") : "";
  const mime = EXT_MIME[ext];
  if (!mime) {
    return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "uploads", "barber-cash-receipts");
  const fp = path.join(dir, name);
  const resolvedDir = path.resolve(dir);
  const resolvedFile = path.resolve(fp);
  if (!resolvedFile.startsWith(resolvedDir + path.sep)) {
    return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
  }

  try {
    const buf = await readFile(resolvedFile);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 404 });
  }
}
