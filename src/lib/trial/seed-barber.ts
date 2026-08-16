import type { PrismaClient } from "@/generated/prisma/client";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import {
  BARBER_PACKAGE_SAMPLE_IMAGES,
  BARBER_PORTAL_SAMPLE_BANNER,
  BARBER_PORTAL_SAMPLE_CONTACT,
  BARBER_PORTAL_SAMPLE_GALLERY,
  BARBER_PORTAL_SAMPLE_LOGO,
  BARBER_STYLIST_SAMPLE_PHOTOS,
  barberNormalizePortalGallery,
  barberSerializePortalGallery,
} from "@/systems/barber/lib/portal-media";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

/** เมนูบริการรายครั้ง (เหมือนเมนูตัดผม) — ระยะเวลาเป็นพหุคูณของสล็อต 30 นาที */
export const BARBER_SINGLE_VISIT_PACKAGE_DEFS = [
  { name: "ตัดผม", price: 150, totalSessions: 1, durationMinutes: 30 },
  { name: "ตัด + สระ", price: 250, totalSessions: 1, durationMinutes: 60 },
  { name: "โกนหนวด", price: 80, totalSessions: 1, durationMinutes: 30 },
  { name: "ทำสี", price: 1200, totalSessions: 1, durationMinutes: 90 },
  { name: "ไดร์จัดทรง", price: 120, totalSessions: 1, durationMinutes: 30 },
] as const;

/** สร้างเมนูรายครั้งที่ยังไม่มีใน scope (idempotent) */
export async function ensureBarberSingleVisitPackages(
  db: PrismaClient | Tx,
  ownerUserId: string,
  trialSessionId: string,
): Promise<number> {
  const existing = await db.barberPackage.findMany({
    where: { ownerUserId, trialSessionId, totalSessions: 1 },
    select: { name: true },
  });
  const have = new Set(existing.map((p) => p.name));
  let created = 0;
  let i = 0;
  for (const def of BARBER_SINGLE_VISIT_PACKAGE_DEFS) {
    if (have.has(def.name)) {
      i += 1;
      continue;
    }
    await db.barberPackage.create({
      data: {
        ownerUserId,
        trialSessionId,
        name: def.name,
        price: def.price,
        totalSessions: 1,
        durationMinutes: def.durationMinutes,
        imageUrl: BARBER_PACKAGE_SAMPLE_IMAGES[i % BARBER_PACKAGE_SAMPLE_IMAGES.length]!,
      },
    });
    created += 1;
    i += 1;
  }
  return created;
}

/**
 * ข้อมูลตัวอย่างร้านตัดผม (~5 แถวต่อเมนูหลัก + รูป / พอร์ทัล)
 * เรียกเมื่อเริ่ม trial เท่านั้น — ผูกกับ trialSessionId
 */
export async function seedBarberTrialData(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  await tx.barberShopProfile.create({
    data: {
      ownerUserId,
      trialSessionId,
      displayName: "MAWELL Barber Studio (ทดลอง)",
      tagline: "ตัดผม · สระ · ทำสี — จองคิวออนไลน์",
      logoUrl: BARBER_PORTAL_SAMPLE_LOGO,
      contactPhone: "0890001122",
      contactLine: BARBER_PORTAL_SAMPLE_CONTACT.contactLine,
      facebookUrl: BARBER_PORTAL_SAMPLE_CONTACT.facebookUrl,
      mapUrl: BARBER_PORTAL_SAMPLE_CONTACT.mapUrl,
      address: "123 ถ.ตัวอย่าง แขวงทดลอง เขตสาธิต กทม. 10110",
      taxId: "0123456789012",
      openTime: "09:00",
      closeTime: "20:00",
      slotMinutes: 30,
      portalBannerUrl: BARBER_PORTAL_SAMPLE_BANNER,
      portalGalleryJson: barberSerializePortalGallery([...BARBER_PORTAL_SAMPLE_GALLERY]),
    },
  });

  const packageDefs = [
    ...BARBER_SINGLE_VISIT_PACKAGE_DEFS.map((p) => ({ ...p })),
    { name: "ตัดผม 10 ครั้ง", price: 1200, totalSessions: 10, durationMinutes: 30 },
    { name: "ตัด + สระ 8 ครั้ง", price: 2400, totalSessions: 8, durationMinutes: 60 },
    { name: "ทำสี Short 5 ครั้ง", price: 5500, totalSessions: 5, durationMinutes: 90 },
    { name: "ตัดนักเรียน 12 ครั้ง", price: 900, totalSessions: 12, durationMinutes: 30 },
    { name: "แพ็กพรีเมียม 6 ครั้ง", price: 4200, totalSessions: 6, durationMinutes: 60 },
  ];

  const packages = await Promise.all(
    packageDefs.map((p, i) =>
      tx.barberPackage.create({
        data: {
          ownerUserId,
          trialSessionId,
          name: p.name,
          price: p.price,
          totalSessions: p.totalSessions,
          durationMinutes: p.durationMinutes,
          imageUrl: BARBER_PACKAGE_SAMPLE_IMAGES[i % BARBER_PACKAGE_SAMPLE_IMAGES.length]!,
        },
      }),
    ),
  );

  const stylistDefs = [
    { name: "พี่หมู หัวหน้าช่าง", phone: "0811110001", workStartTime: "09:00", workEndTime: "20:00", workWeekdaysJson: "[1,2,3,4,5,6]" },
    { name: "พี่ดำ สไตล์สุภาพ", phone: "0811110002", workStartTime: "10:00", workEndTime: "19:00", workWeekdaysJson: "[2,3,4,5,6]" },
    { name: "น้องมิ้นท์ ช่างสระ", phone: "0811110003", workStartTime: "09:00", workEndTime: "18:00", workWeekdaysJson: "[1,2,3,4,5,6]" },
    { name: "พี่เบิร์ด ทำสี", phone: "0811110004", workStartTime: "11:00", workEndTime: "20:00", workWeekdaysJson: "[1,2,4,5,6]" },
    { name: "น้องเฟิร์น ตัดเด็ก", phone: "0811110005", workStartTime: "09:00", workEndTime: "17:00", workWeekdaysJson: "[1,2,3,4,5]" },
  ];

  const stylists = await Promise.all(
    stylistDefs.map((s, i) =>
      tx.barberStylist.create({
        data: {
          ownerUserId,
          trialSessionId,
          name: s.name,
          phone: s.phone,
          photoUrl: BARBER_STYLIST_SAMPLE_PHOTOS[i % BARBER_STYLIST_SAMPLE_PHOTOS.length]!,
          isActive: true,
          workStartTime: s.workStartTime,
          workEndTime: s.workEndTime,
          workWeekdaysJson: s.workWeekdaysJson,
        },
      }),
    ),
  );

  const customerDefs = [
    { phone: "0898881001", name: "คุณแป้ง" },
    { phone: "0898881002", name: "คุณบัว" },
    { phone: "0898881003", name: "คุณชาติ" },
    { phone: "0898881004", name: "คุณดาว" },
    { phone: "0898881005", name: "คุณเอ็ม" },
  ];

  const customers = await Promise.all(
    customerDefs.map((c) =>
      tx.barberCustomer.create({
        data: {
          ownerUserId,
          trialSessionId,
          phone: c.phone,
          name: c.name,
        },
      }),
    ),
  );

  const subStatuses = ["ACTIVE", "ACTIVE", "ACTIVE", "EXHAUSTED", "CANCELLED"] as const;

  const multiPackages = packages.filter((p) => p.totalSessions > 1);
  const subscriptions = await Promise.all(
    customers.map((customer, i) => {
      const pkg = multiPackages[i % multiPackages.length]!;
      const stylist = stylists[i % stylists.length]!;
      const st = subStatuses[i]!;
      const remaining =
        st === "ACTIVE" ? Math.max(1, pkg.totalSessions - i - 2) : st === "EXHAUSTED" ? 0 : 3;
      const withSlip = i % 2 === 0;
      return tx.barberCustomerSubscription.create({
        data: {
          ownerUserId,
          trialSessionId,
          barberCustomerId: customer.id,
          packageId: pkg.id,
          soldByStylistId: stylist.id,
          remainingSessions: remaining,
          status: st,
          saleReceiptImageUrl: withSlip
            ? BARBER_PACKAGE_SAMPLE_IMAGES[i % BARBER_PACKAGE_SAMPLE_IMAGES.length]!
            : null,
        },
      });
    }),
  );

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  await Promise.all(
    [0, 1, 2, 3, 4].map((i) => {
      const sub = subscriptions[i];
      const customer = customers[i]!;
      const stylist = stylists[i % stylists.length]!;
      if (i < 3 && sub?.status === "ACTIVE") {
        return tx.barberServiceLog.create({
          data: {
            ownerUserId,
            trialSessionId,
            subscriptionId: sub.id,
            barberCustomerId: customer.id,
            visitType: "PACKAGE_USE",
            stylistId: stylist.id,
            note: "หักแพ็ก — ทดลอง",
            createdAt: new Date(now - (i + 1) * day),
          },
        });
      }
      return tx.barberServiceLog.create({
        data: {
          ownerUserId,
          trialSessionId,
          subscriptionId: null,
          barberCustomerId: customer.id,
          visitType: "CASH_WALK_IN",
          stylistId: stylist.id,
          amountBaht: 180 + i * 20,
          receiptImageUrl: BARBER_PACKAGE_SAMPLE_IMAGES[i % BARBER_PACKAGE_SAMPLE_IMAGES.length]!,
          note: i === 3 ? "Walk-in ไม่ระบุแพ็ก" : null,
          createdAt: new Date(now - (i + 2) * day),
        },
      });
    }),
  );

  const bookingStatuses = ["SCHEDULED", "SCHEDULED", "ARRIVED", "NO_SHOW", "CANCELLED"] as const;

  await Promise.all(
    [0, 1, 2, 3, 4].map((i) => {
      const customer = customers[i]!;
      const stylist = stylists[i % stylists.length]!;
      const pkg = packages[i % packages.length]!;
      return tx.barberBooking.create({
        data: {
          ownerUserId,
          trialSessionId,
          barberCustomerId: customer.id,
          phone: customer.phone,
          customerName: customer.name,
          scheduledAt: new Date(now + (i + 1) * day + i * 3600_000),
          durationMinutes: pkg.durationMinutes,
          stylistId: stylist.id,
          packageId: pkg.id,
          status: bookingStatuses[i]!,
        },
      });
    }),
  );

  const catDefs = ["วัสดุสิ้นเปลือง", "ค่าสาธารณูปโภค", "การตลาด"];
  const categories = await Promise.all(
    catDefs.map((name) =>
      tx.barberCostCategory.create({
        data: { ownerUserId, trialSessionId, name },
      }),
    ),
  );

  const costLabels = [
    "แชมพูแกลลอน",
    "มีดโกนใบมีด",
    "ค่าไฟเดือนนี้",
    "โปรโมทเฟซบุ๊ก",
    "อุปกรณ์ไดร์เป่าผม",
  ];

  await Promise.all(
    costLabels.map((itemLabel, i) => {
      const cat = categories[i % categories.length]!;
      return tx.barberCostEntry.create({
        data: {
          ownerUserId,
          trialSessionId,
          categoryId: cat.id,
          spentAt: new Date(now - (i + 3) * day),
          amount: 450 + i * 120,
          itemLabel,
          note: "รายการตัวอย่างโหมดทดลอง",
          slipPhotoUrl: BARBER_PACKAGE_SAMPLE_IMAGES[i % BARBER_PACKAGE_SAMPLE_IMAGES.length]!,
        },
      });
    }),
  );
}

/** ลบชุดข้อมูลร้านตัดผมใน scope — ใช้ก่อน seed prod ใหม่เมื่อมีโปรไฟล์เปล่า */
async function deleteBarberScopeRows(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  await tx.barberServiceLog.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.barberBooking.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.barberCustomerSubscription.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.barberPortalStaffPing.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.barberCustomer.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.barberPackage.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.barberStylist.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.barberCostEntry.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.barberCostCategory.deleteMany({ where: { ownerUserId, trialSessionId } });
  await tx.barberShopProfile.deleteMany({ where: { ownerUserId, trialSessionId } });
}

/**
 * ข้อมูลตัวอย่าง prod — ดูจากแพ็กเกจ (ไม่ใช้แค่โปรไฟล์ เพราะโปรไฟล์เปล่าจะทำให้ข้าม seed ผิด)
 * @param opts.refreshDaily — ล้างแล้วใส่ใหม่ (ค่าเริ่ม true) ให้แดชบอร์ดรายวันไม่ค้างวันเก่า
 */
export async function seedBarberProdDemoForOwner(
  db: PrismaClient,
  ownerUserId: string,
  opts?: { refreshDaily?: boolean },
): Promise<void> {
  const refresh = opts?.refreshDaily !== false;
  const pkgCount = await db.barberPackage.count({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE },
  });
  if (pkgCount > 0 && !refresh) return;

  await db.$transaction(async (tx) => {
    await deleteBarberScopeRows(tx, ownerUserId, TRIAL_PROD_SCOPE);
    await seedBarberTrialData(tx, ownerUserId, TRIAL_PROD_SCOPE);
  });
}

/**
 * เติมรูป/ข้อมูลพอร์ทัลที่ขาดให้ร้านที่มีแพ็กอยู่แล้ว (ไม่ลบข้อมูลเดิม)
 * — ใช้หลังเพิ่มฟิลด์พอร์ทัล/รูปแพ็กใน seed
 */
const BROKEN_UNSPLASH_FRAGMENTS = ["photo-1599351431202-1e0f013fd2e0"] as const;
const BROKEN_UNSPLASH_REPLACEMENT = "photo-1605497788044-5a32c7078486";

function rewriteBrokenUnsplashUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  let next = url.trim();
  for (const frag of BROKEN_UNSPLASH_FRAGMENTS) {
    if (next.includes(frag)) next = next.replaceAll(frag, BROKEN_UNSPLASH_REPLACEMENT);
  }
  return next === url.trim() ? null : next;
}

function isBrokenOrMissingRemote(url: string | null | undefined): boolean {
  if (!url?.trim()) return true;
  if (url.includes("picsum.photos")) return true;
  return BROKEN_UNSPLASH_FRAGMENTS.some((f) => url.includes(f));
}

export async function fillBarberPortalDemoMedia(db: PrismaClient): Promise<{
  profiles: number;
  packages: number;
  stylists: number;
  singleVisit: number;
}> {
  const packageDurations: Record<string, number> = {
    ตัดผม: 30,
    "ตัด + สระ": 60,
    โกนหนวด: 30,
    ทำสี: 90,
    ไดร์จัดทรง: 30,
    "ตัดผม 10 ครั้ง": 30,
    "ตัด + สระ 8 ครั้ง": 60,
    "ทำสี Short 5 ครั้ง": 90,
    "ตัดนักเรียน 12 ครั้ง": 30,
    "แพ็กพรีเมียม 6 ครั้ง": 60,
  };

  let profiles = 0;
  let packages = 0;
  let stylists = 0;
  let singleVisit = 0;

  const shopProfiles = await db.barberShopProfile.findMany();
  for (const profile of shopProfiles) {
    const gallery = barberNormalizePortalGallery(profile.portalGalleryJson);
    const galleryEmpty = gallery.length === 0;
    const galleryFixed = gallery.map((u) => rewriteBrokenUnsplashUrl(u) ?? u);
    const galleryChanged = galleryFixed.some((u, i) => u !== gallery[i]);
    const bannerFixed = rewriteBrokenUnsplashUrl(profile.portalBannerUrl);
    const logoBroken = isBrokenOrMissingRemote(profile.logoUrl) && !profile.logoUrl?.startsWith("/uploads/");
    const needsPortal =
      !profile.portalBannerUrl ||
      Boolean(bannerFixed) ||
      galleryEmpty ||
      galleryChanged ||
      !profile.tagline ||
      !profile.contactLine ||
      !profile.facebookUrl ||
      !profile.mapUrl ||
      logoBroken;

    if (needsPortal) {
      await db.barberShopProfile.update({
        where: { id: profile.id },
        data: {
          tagline: profile.tagline?.trim() || "ตัดผม · สระ · ทำสี — จองคิวออนไลน์",
          logoUrl: logoBroken
            ? BARBER_PORTAL_SAMPLE_LOGO
            : profile.logoUrl,
          portalBannerUrl:
            bannerFixed || profile.portalBannerUrl?.trim() || BARBER_PORTAL_SAMPLE_BANNER,
          portalGalleryJson: galleryEmpty
            ? barberSerializePortalGallery([...BARBER_PORTAL_SAMPLE_GALLERY])
            : galleryChanged
              ? barberSerializePortalGallery(galleryFixed)
              : profile.portalGalleryJson,
          contactLine: profile.contactLine?.trim() || BARBER_PORTAL_SAMPLE_CONTACT.contactLine,
          facebookUrl: profile.facebookUrl?.trim() || BARBER_PORTAL_SAMPLE_CONTACT.facebookUrl,
          mapUrl: profile.mapUrl?.trim() || BARBER_PORTAL_SAMPLE_CONTACT.mapUrl,
          contactPhone: profile.contactPhone?.trim() || "0890001122",
        },
      });
      profiles += 1;
    }
  }

  const pkgs = await db.barberPackage.findMany({
    select: { id: true, name: true, imageUrl: true, durationMinutes: true },
  });
  let pkgIndex = 0;
  for (const pkg of pkgs) {
    const wantDuration = packageDurations[pkg.name];
    const rewritten = rewriteBrokenUnsplashUrl(pkg.imageUrl);
    const needsImage = isBrokenOrMissingRemote(pkg.imageUrl);
    const needsDuration = wantDuration != null && pkg.durationMinutes !== wantDuration;
    if (!needsImage && !needsDuration && !rewritten) {
      pkgIndex += 1;
      continue;
    }
    await db.barberPackage.update({
      where: { id: pkg.id },
      data: {
        ...(needsImage
          ? {
              imageUrl:
                BARBER_PACKAGE_SAMPLE_IMAGES[pkgIndex % BARBER_PACKAGE_SAMPLE_IMAGES.length]!,
            }
          : rewritten
            ? { imageUrl: rewritten }
            : {}),
        ...(needsDuration && wantDuration != null ? { durationMinutes: wantDuration } : {}),
      },
    });
    packages += 1;
    pkgIndex += 1;
  }

  const stylistRows = await db.barberStylist.findMany({
    select: { id: true, photoUrl: true },
  });
  for (let i = 0; i < stylistRows.length; i++) {
    const s = stylistRows[i]!;
    const rewritten = rewriteBrokenUnsplashUrl(s.photoUrl);
    if (!isBrokenOrMissingRemote(s.photoUrl) && !rewritten) continue;
    await db.barberStylist.update({
      where: { id: s.id },
      data: {
        photoUrl:
          rewritten ??
          BARBER_STYLIST_SAMPLE_PHOTOS[i % BARBER_STYLIST_SAMPLE_PHOTOS.length]!,
      },
    });
    stylists += 1;
  }

  const scopes = await db.barberShopProfile.findMany({
    select: { ownerUserId: true, trialSessionId: true },
  });
  for (const scope of scopes) {
    singleVisit += await ensureBarberSingleVisitPackages(db, scope.ownerUserId, scope.trialSessionId);
  }

  return { profiles, packages, stylists, singleVisit };
}
