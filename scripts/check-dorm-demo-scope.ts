import { prisma } from "@/lib/prisma";
import { listSubscribedModuleIds } from "@/lib/modules/subscriptions-store";

const EMAILS = ["admin@mawell.local", "user@mawell.local", "user@mawell.local.com"] as const;
const DORM_SLUG = "dormitory";

async function main() {
  const mod = await prisma.appModule.findFirst({
    where: { slug: DORM_SLUG },
    select: { id: true },
  });
  if (!mod) {
    console.log("Dormitory module not found");
    return;
  }

  for (const email of EMAILS) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });
    if (!user) {
      console.log(email, "user-not-found");
      continue;
    }
    const subscribed = (await listSubscribedModuleIds(user.id)).includes(mod.id);
    const trials = await prisma.trialSession.findMany({
      where: { userId: user.id, moduleId: mod.id, status: "ACTIVE", expiresAt: { gt: new Date() } },
      select: { id: true, expiresAt: true },
    });
    const prodRooms = await prisma.room.count({ where: { ownerUserId: user.id, trialSessionId: "prod" } });
    const trialRoomCounts = await Promise.all(
      trials.map(async (t) => ({
        id: t.id,
        rooms: await prisma.room.count({ where: { ownerUserId: user.id, trialSessionId: t.id } }),
      })),
    );
    console.log(
      JSON.stringify({
        email: user.email,
        subscribed,
        activeTrials: trials.map((t) => t.id),
        prodRooms,
        trialRoomCounts,
      }),
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

