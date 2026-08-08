import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  hotelResortNormalizeRoomImageUrls,
  hotelResortSampleRoomImageUrls,
} from "../src/systems/hotel-resort/lib/room-images";

const prisma = new PrismaClient();

async function main() {
  const rooms = await prisma.hotelResortRoom.findMany({
    select: { id: true, imageUrlsJson: true, sortOrder: true },
    orderBy: [{ sortOrder: "asc" }, { roomNumber: "asc" }],
  });
  let updated = 0;
  for (let i = 0; i < rooms.length; i++) {
    const r = rooms[i]!;
    const existing = hotelResortNormalizeRoomImageUrls(r.imageUrlsJson);
    if (existing.length > 0) continue;
    await prisma.hotelResortRoom.update({
      where: { id: r.id },
      data: { imageUrlsJson: hotelResortSampleRoomImageUrls(r.sortOrder ?? i, 3) },
    });
    updated++;
  }
  console.log(`rooms=${rooms.length} filled=${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
