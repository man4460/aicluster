import { prisma } from "@/lib/prisma";

const TARGET_EMAILS = ["admin@mawell.local", "user@mawell.local", "user@mawell.local.com"] as const;
const DEMO_ELECTRIC_IMAGE = "https://picsum.photos/seed/hf-electric/960/1280.jpg";
const DEMO_FUEL_IMAGE = "https://picsum.photos/seed/hf-fuel/960/1280.jpg";
const DEMO_INCOME_IMAGE = "https://picsum.photos/seed/hf-income/960/1280.jpg";

function ymdToDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

async function clearOldHomeFinanceData(ownerUserId: string) {
  await prisma.homeFinanceEntry.deleteMany({ where: { ownerUserId } });
  await prisma.homeFinanceReminder.deleteMany({ where: { ownerUserId } });
  await prisma.homeUtilityProfile.deleteMany({ where: { ownerUserId } });
  await prisma.homeVehicleProfile.deleteMany({ where: { ownerUserId } });
}

async function ensureUtility(ownerUserId: string) {
  const utility = await prisma.homeUtilityProfile.findFirst({
    where: { ownerUserId, label: "บ้านหลัก - มิเตอร์ไฟฟ้า", utilityType: "ELECTRIC" },
    select: { id: true },
  });
  if (utility) return utility.id;
  const created = await prisma.homeUtilityProfile.create({
    data: {
      ownerUserId,
      utilityType: "ELECTRIC",
      label: "บ้านหลัก - มิเตอร์ไฟฟ้า",
      provider: "MAWELL ENERGY",
      accountNumber: "EL-2026-9001",
      meterNumber: "MTR-110022",
      defaultDueDay: 20,
      dueDate: ymdToDate("2026-05-20"),
      note: "ข้อมูลตัวอย่าง",
      photoUrl: DEMO_ELECTRIC_IMAGE,
      isActive: true,
    },
    select: { id: true },
  });
  return created.id;
}

async function ensureVehicle(ownerUserId: string) {
  const vehicle = await prisma.homeVehicleProfile.findFirst({
    where: { ownerUserId, label: "รถครอบครัว A", vehicleType: "CAR" },
    select: { id: true },
  });
  if (vehicle) return vehicle.id;
  const created = await prisma.homeVehicleProfile.create({
    data: {
      ownerUserId,
      vehicleType: "CAR",
      label: "รถครอบครัว A",
      brand: "Toyota",
      model: "Corolla",
      plateNumber: "2กข4567",
      vehicleYear: 2022,
      note: "ข้อมูลตัวอย่าง",
      photoUrl: DEMO_FUEL_IMAGE,
      isActive: true,
    },
    select: { id: true },
  });
  return created.id;
}

async function ensureReminder(ownerUserId: string) {
  const existed = await prisma.homeFinanceReminder.findFirst({
    where: { ownerUserId, title: "เตือนชำระค่าไฟบ้านหลัก" },
    select: { id: true },
  });
  if (existed) return;
  await prisma.homeFinanceReminder.create({
    data: {
      ownerUserId,
      title: "เตือนชำระค่าไฟบ้านหลัก",
      dueDate: ymdToDate("2026-05-18"),
      note: "ข้อมูลตัวอย่าง",
      isDone: false,
    },
  });
}

async function ensureEntry(
  ownerUserId: string,
  data: {
    entryDate: string;
    type: "INCOME" | "EXPENSE";
    categoryKey: string;
    categoryLabel: string;
    title: string;
    amount: number;
    slipImageUrl?: string;
    attachmentUrls?: string[];
    paymentMethod?: string;
    note?: string;
    linkedUtilityId?: number;
    linkedVehicleId?: number;
  },
) {
  const entryDate = ymdToDate(data.entryDate);
  const existed = await prisma.homeFinanceEntry.findFirst({
    where: {
      ownerUserId,
      entryDate,
      title: data.title,
      amount: data.amount,
      type: data.type,
    },
    select: { id: true },
  });
  if (existed) return;

  await prisma.homeFinanceEntry.create({
    data: {
      ownerUserId,
      entryDate,
      type: data.type,
      categoryKey: data.categoryKey,
      categoryLabel: data.categoryLabel,
      title: data.title,
      amount: data.amount,
      paymentMethod: data.paymentMethod ?? null,
      note: data.note ?? "ข้อมูลตัวอย่าง",
      slipImageUrl: data.slipImageUrl ?? null,
      ...(data.attachmentUrls ? { attachmentUrls: data.attachmentUrls } : {}),
      linkedUtilityId: data.linkedUtilityId ?? null,
      linkedVehicleId: data.linkedVehicleId ?? null,
    },
  });
}

async function seedForUser(ownerUserId: string, email: string | null) {
  await clearOldHomeFinanceData(ownerUserId);
  const utilityId = await ensureUtility(ownerUserId);
  const vehicleId = await ensureVehicle(ownerUserId);
  await ensureReminder(ownerUserId);

  await ensureEntry(ownerUserId, {
    entryDate: "2026-05-01",
    type: "INCOME",
    categoryKey: "salary",
    categoryLabel: "เงินเดือน",
    title: "รายรับเงินเดือน",
    amount: 32000,
    paymentMethod: "โอนธนาคาร",
    slipImageUrl: DEMO_INCOME_IMAGE,
    attachmentUrls: [DEMO_INCOME_IMAGE],
    note: "ข้อมูลตัวอย่าง",
  });

  await ensureEntry(ownerUserId, {
    entryDate: "2026-05-04",
    type: "INCOME",
    categoryKey: "extra-income",
    categoryLabel: "รายได้เสริม",
    title: "รายรับงานฟรีแลนซ์",
    amount: 5800,
    paymentMethod: "โอนพร้อมเพย์",
    slipImageUrl: DEMO_INCOME_IMAGE,
    attachmentUrls: [DEMO_INCOME_IMAGE],
    note: "ข้อมูลตัวอย่าง",
  });

  await ensureEntry(ownerUserId, {
    entryDate: "2026-05-06",
    type: "INCOME",
    categoryKey: "other-income",
    categoryLabel: "รายรับอื่นๆ",
    title: "รายรับค่าคอมมิชชั่น",
    amount: 2750,
    paymentMethod: "โอนธนาคาร",
    slipImageUrl: DEMO_INCOME_IMAGE,
    attachmentUrls: [DEMO_INCOME_IMAGE],
    note: "ข้อมูลตัวอย่าง",
  });

  await ensureEntry(ownerUserId, {
    entryDate: "2026-05-07",
    type: "INCOME",
    categoryKey: "online-sales",
    categoryLabel: "รายรับขายออนไลน์",
    title: "รายรับออเดอร์ออนไลน์",
    amount: 4190,
    paymentMethod: "โอนธนาคาร",
    slipImageUrl: DEMO_INCOME_IMAGE,
    attachmentUrls: [DEMO_INCOME_IMAGE],
    note: "ข้อมูลตัวอย่าง",
  });

  await ensureEntry(ownerUserId, {
    entryDate: "2026-05-08",
    type: "INCOME",
    categoryKey: "cashback",
    categoryLabel: "เงินคืน/โบนัส",
    title: "รายรับเงินคืนบัตรเครดิต",
    amount: 1260,
    paymentMethod: "เครดิตเข้าบัญชี",
    slipImageUrl: DEMO_INCOME_IMAGE,
    attachmentUrls: [DEMO_INCOME_IMAGE],
    note: "ข้อมูลตัวอย่าง",
  });

  await ensureEntry(ownerUserId, {
    entryDate: "2026-05-03",
    type: "EXPENSE",
    categoryKey: "utility-electric",
    categoryLabel: "ค่าไฟฟ้า",
    title: "ชำระค่าไฟบ้านหลัก",
    amount: 2042,
    paymentMethod: "พร้อมเพย์",
    slipImageUrl: DEMO_ELECTRIC_IMAGE,
    attachmentUrls: [DEMO_ELECTRIC_IMAGE],
    linkedUtilityId: utilityId,
    note: "ข้อมูลตัวอย่าง",
  });

  await ensureEntry(ownerUserId, {
    entryDate: "2026-05-06",
    type: "EXPENSE",
    categoryKey: "vehicle-fuel",
    categoryLabel: "ค่าน้ำมันรถ",
    title: "เติมน้ำมันรถครอบครัว A",
    amount: 1354,
    paymentMethod: "บัตรเครดิต",
    slipImageUrl: DEMO_FUEL_IMAGE,
    attachmentUrls: [DEMO_FUEL_IMAGE],
    linkedVehicleId: vehicleId,
    note: "ข้อมูลตัวอย่าง",
  });

  await ensureEntry(ownerUserId, {
    entryDate: "2026-05-09",
    type: "EXPENSE",
    categoryKey: "food",
    categoryLabel: "ค่าอาหาร",
    title: "ซื้อของเข้าบ้าน",
    amount: 890,
    paymentMethod: "เงินสด",
    slipImageUrl: DEMO_FUEL_IMAGE,
    attachmentUrls: [DEMO_FUEL_IMAGE],
    note: "ข้อมูลตัวอย่าง",
  });

  console.log(`Reset and seeded home-finance demo entries with images for ${email ?? ownerUserId}`);
}

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { in: [...TARGET_EMAILS] } },
    select: { id: true, email: true },
  });
  if (users.length === 0) {
    console.log("No target demo users found.");
    return;
  }

  for (const user of users) {
    await seedForUser(user.id, user.email);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

