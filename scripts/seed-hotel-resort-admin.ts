import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedHotelResortProdDemoForOwner } from "../src/lib/trial/seed-hotel-resort";

async function main() {
  const prisma = new PrismaClient();
  try {
    const admin = await prisma.user.findFirst({
      where: { email: "admin@mawell.local" },
      select: { id: true },
    });
    if (!admin) {
      console.log("admin@mawell.local not found");
      return;
    }
    await seedHotelResortProdDemoForOwner(prisma, admin.id);
    const buildings = await prisma.hotelResortBuilding.count({ where: { ownerUserId: admin.id } });
    const rooms = await prisma.hotelResortRoom.count({ where: { ownerUserId: admin.id } });
    console.log(`hotel-resort seeded: ${buildings} buildings, ${rooms} rooms`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
