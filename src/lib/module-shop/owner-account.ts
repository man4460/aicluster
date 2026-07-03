import { prisma } from "@/lib/prisma";

export type ModuleOwnerAccountDto = {
  ownerName: string;
  ownerEmail: string;
};

export async function getModuleOwnerAccount(userId: string): Promise<ModuleOwnerAccountDto> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, email: true, username: true },
  });
  return {
    ownerName: user?.fullName?.trim() || user?.username || "—",
    ownerEmail: user?.email ?? "—",
  };
}
