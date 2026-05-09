import type { PrismaClient } from "@/generated/prisma/client";
import { bangkokDateKey } from "@/lib/time/bangkok";

export async function nextMediaRegisterNo(db: PrismaClient, ownerUserId: string): Promise<string> {
  const year = bangkokDateKey().slice(0, 4);
  const prefix = `MR-${year}-`;
  const count = await db.mediaRegistryItem.count({
    where: { ownerUserId, registerNo: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

export function nextBorrowNo(): string {
  return `BR-${Date.now().toString(36).toUpperCase()}`;
}
