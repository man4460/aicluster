import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

export function newPublicProofToken(): string {
  return randomBytes(24).toString("hex");
}

/** สร้างโทเคนเมื่อยังไม่มี (สำหรับลิงก์อัปโหลดสลิปสาธารณะของบิลค่าส่วนกลาง) */
export async function ensureFeeRowPublicProofToken(feeRowId: number): Promise<string> {
  const row = await prisma.villageCommonFeeRow.findUnique({
    where: { id: feeRowId },
    select: { publicProofToken: true },
  });
  if (row?.publicProofToken) return row.publicProofToken;
  const token = newPublicProofToken();
  try {
    await prisma.villageCommonFeeRow.update({
      where: { id: feeRowId },
      data: { publicProofToken: token },
    });
    return token;
  } catch {
    const again = await prisma.villageCommonFeeRow.findUnique({
      where: { id: feeRowId },
      select: { publicProofToken: true },
    });
    if (again?.publicProofToken) return again.publicProofToken;
    throw new Error("token_failed");
  }
}
