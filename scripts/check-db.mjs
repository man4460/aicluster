import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
try {
  const mods = await p.appModule.findMany({ select: { id: true, slug: true, isActive: true } });
  console.log("=== appModules ===");
  console.log(JSON.stringify(mods, null, 2));
  
  const user = await p.user.findFirst({ where: { id: "cmn1pz7w00001uaog0dbxhx5" }, select: { id: true, email: true, role: true } });
  console.log("=== user (production id) ===");
  console.log(JSON.stringify(user, null, 2));
  
  const users = await p.user.findMany({ select: { id: true, email: true, role: true }, take: 5 });
  console.log("=== local users (first 5) ===");
  console.log(JSON.stringify(users, null, 2));
} finally {
  await p.$disconnect();
}
