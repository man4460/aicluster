import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

export function newPublicProofToken(): string {
  return randomBytes(24).toString("hex");
}

/** สร้างโทเคนเมื่อยังไม่มี (สำหรับลิงก์อัปโหลดสลิปสาธารณะ) */
export async function ensurePaymentPublicProofToken(paymentId: number): Promise<string> {
  const row = await prisma.splitBillPayment.findUnique({
    where: { id: paymentId },
    select: { publicProofToken: true },
  });
  if (row?.publicProofToken) return row.publicProofToken;
  const token = newPublicProofToken();
  try {
    await prisma.splitBillPayment.update({
      where: { id: paymentId },
      data: { publicProofToken: token },
    });
    return token;
  } catch {
    const again = await prisma.splitBillPayment.findUnique({
      where: { id: paymentId },
      select: { publicProofToken: true },
    });
    if (again?.publicProofToken) return again.publicProofToken;
    throw new Error("token_failed");
  }
}
