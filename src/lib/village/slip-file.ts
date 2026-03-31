import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function saveVillageSlipImage(ownerId: string, buf: Buffer, mime: string): Promise<string> {
  const ext = ALLOWED.get(mime);
  if (!ext) throw new Error("bad_type");
  if (buf.length > MAX_BYTES) throw new Error("too_large");
  const dir = path.join(process.cwd(), "public", "uploads", "village-slips");
  await mkdir(dir, { recursive: true });
  const safeOwner = ownerId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "o";
  const filename = `${safeOwner}-${Date.now()}.${ext}`;
  await writeFile(path.join(dir, filename), buf);
  return `/uploads/village-slips/${filename}`;
}
