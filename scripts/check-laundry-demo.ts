import { prisma } from "../src/lib/prisma";
import { listSubscribedModuleIds } from "../src/lib/modules/subscriptions-store";
import { resolveDataScopeBySlug } from "../src/lib/trial/scope";

async function main() {
  const emails = ["user@mawell.local.com", "user@mawell.local", "admin@mawell.local"];
  for (const email of emails) {
    const u = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
    if (!u) {
      console.log(email, "NOT FOUND");
      continue;
    }
    const scope = await resolveDataScopeBySlug(u.id, "laundry");
    const [pkgScope, ordScope, pkgProd, ordProd] = await Promise.all([
      prisma.laundryPackage.count({ where: { ownerUserId: u.id, trialSessionId: scope.trialSessionId } }),
      prisma.laundryOrder.count({ where: { ownerUserId: u.id, trialSessionId: scope.trialSessionId } }),
      prisma.laundryPackage.count({ where: { ownerUserId: u.id, trialSessionId: "prod" } }),
      prisma.laundryOrder.count({ where: { ownerUserId: u.id, trialSessionId: "prod" } }),
    ]);
    const ordRows = await prisma.laundryOrder.findMany({
      where: { ownerUserId: u.id, trialSessionId: scope.trialSessionId },
      select: { id: true, customerName: true, status: true, orderAt: true },
      take: 8,
    });
    const subs = await listSubscribedModuleIds(u.id);
    const mod = await prisma.appModule.findFirst({ where: { slug: "laundry" }, select: { id: true } });
    const trial = mod
      ? await prisma.trialSession.findFirst({
          where: { userId: u.id, moduleId: mod.id, status: "ACTIVE" },
          select: { id: true, expiresAt: true },
        })
      : null;

    console.log("---", email);
    console.log(" scope:", scope.trialSessionId.slice(0, 12), "sandbox:", scope.isTrialSandbox);
    console.log(" subscribed laundry:", mod ? subs.includes(mod.id) : "?");
    console.log(" active trial:", trial?.id?.slice(0, 12) ?? "none");
    console.log(" in-scope packages/orders:", pkgScope, ordScope);
    console.log(" prod packages/orders:", pkgProd, ordProd);
    console.log(" orders:", ordRows);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
