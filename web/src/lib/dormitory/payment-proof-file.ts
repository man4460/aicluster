import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function saveDormPaymentProofImage(
  paymentId: number,
  buf: Buffer,
  mime: string,
): Promise<string> {
  const ext = ALLOWED.get(mime);
  if (!ext) throw new Error("bad_type");
  if (buf.length > MAX_BYTES) throw new Error("too_large");
  const dir = path.join(process.cwd(), "public", "uploads", "dorm-payment-proofs");
  await mkdir(dir, { recursive: true });
  const filename = `p${paymentId}-${Date.now()}.${ext}`;
  await writeFile(path.join(dir, filename), buf);
  return `/uploads/dorm-payment-proofs/${filename}`;
}
