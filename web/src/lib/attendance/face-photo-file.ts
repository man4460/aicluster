import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function saveAttendanceFacePhoto(ownerId: string, buf: Buffer, mime: string): Promise<string> {
  const ext = ALLOWED.get(mime);
  if (!ext) throw new Error("bad_type");
  if (buf.length > MAX_BYTES) throw new Error("too_large");
  const dir = path.join(process.cwd(), "public", "uploads", "attendance-faces");
  await mkdir(dir, { recursive: true });
  const safe = ownerId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
  const filename = `${safe || "owner"}-${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  await writeFile(path.join(dir, filename), buf);
  return `/uploads/attendance-faces/${filename}`;
}
