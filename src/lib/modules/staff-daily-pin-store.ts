import { STAFF_LINK_PERMANENT_SESSION_ID } from "@/lib/modules/permanent-staff-link";
import {
  assertStaffDailyUnlock,
  hashStaffDailyPin,
  normalizeStaffDailyPinInput,
  validateStaffDailyPinPlain,
  verifyStaffDailyPin,
  signStaffDailyUnlock,
  type StaffDailyPinModule,
} from "@/lib/modules/staff-daily-pin";
import { prisma } from "@/lib/prisma";
import { BUILDING_POS_MODULE_SLUG } from "@/lib/modules/config";
import { NextResponse } from "next/server";

export async function loadDrinkPosStaffDailyPinHash(ownerId: string): Promise<string | null> {
  const row = await prisma.drinkPosShopProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: ownerId,
        trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
      },
    },
    select: { staffDailyPinHash: true },
  });
  return row?.staffDailyPinHash?.trim() || null;
}

export async function loadBuildingPosStaffDailyPinHash(ownerId: string): Promise<string | null> {
  const row = await prisma.moduleShopBranding.findUnique({
    where: {
      ownerUserId_trialSessionId_moduleSlug: {
        ownerUserId: ownerId,
        trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
        moduleSlug: BUILDING_POS_MODULE_SLUG,
      },
    },
    select: { staffDailyPinHash: true },
  });
  return row?.staffDailyPinHash?.trim() || null;
}

export async function loadHotelResortStaffDailyPinHash(ownerId: string): Promise<string | null> {
  const row = await prisma.hotelResortProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: ownerId,
        trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
      },
    },
    select: { staffDailyPinHash: true },
  });
  return row?.staffDailyPinHash?.trim() || null;
}

export async function loadFootballTurfStaffDailyPinHash(ownerId: string): Promise<string | null> {
  const row = await prisma.footballTurfShopProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: ownerId,
        trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
      },
    },
    select: { staffDailyPinHash: true },
  });
  return row?.staffDailyPinHash?.trim() || null;
}

export async function loadBarberStaffDailyPinHash(
  ownerId: string,
  trialSessionId: string,
): Promise<string | null> {
  const row = await prisma.barberShopProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: {
        ownerUserId: ownerId,
        trialSessionId,
      },
    },
    select: { staffDailyPinHash: true },
  });
  return row?.staffDailyPinHash?.trim() || null;
}

export async function gateStaffDailyPin(
  req: Request,
  module: StaffDailyPinModule,
  ownerId: string,
  pinHash: string | null,
): Promise<NextResponse | null> {
  return assertStaffDailyUnlock({ req, module, ownerId, pinHash });
}

export async function handleStaffDailyUnlockPost(opts: {
  req: Request;
  module: StaffDailyPinModule;
  ownerId: string;
  pinHash: string | null;
}): Promise<NextResponse> {
  let json: unknown;
  try {
    json = await opts.req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const pin = normalizeStaffDailyPinInput(
    typeof json === "object" && json && "pin" in json ? (json as { pin: unknown }).pin : null,
  );
  if (!pin) return NextResponse.json({ error: "กรุณาใส่รหัส" }, { status: 400 });
  if (!opts.pinHash?.trim()) {
    const unlockToken = signStaffDailyUnlock({ module: opts.module, ownerId: opts.ownerId });
    return NextResponse.json({ unlockToken });
  }
  const ok = await verifyStaffDailyPin(pin, opts.pinHash);
  if (!ok) return NextResponse.json({ error: "รหัสไม่ถูกต้อง" }, { status: 401 });
  const unlockToken = signStaffDailyUnlock({ module: opts.module, ownerId: opts.ownerId });
  return NextResponse.json({ unlockToken });
}

export async function applyStaffDailyPinPatch(opts: {
  ownerId: string;
  module: StaffDailyPinModule;
  staffDailyPin?: string | null;
  staffDailyPinClear?: boolean;
  /** ร้านตัดผม — ใช้ trial session ของร้าน */
  trialSessionId?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (opts.staffDailyPinClear) {
    await writeStaffDailyPinHash(opts.module, opts.ownerId, null, opts.trialSessionId);
    return { ok: true };
  }
  if (opts.staffDailyPin === undefined) return { ok: true };
  const pin = normalizeStaffDailyPinInput(opts.staffDailyPin);
  if (pin == null) return { ok: true };
  const err = validateStaffDailyPinPlain(pin);
  if (err) return { ok: false, error: err };
  const hash = await hashStaffDailyPin(pin);
  await writeStaffDailyPinHash(opts.module, opts.ownerId, hash, opts.trialSessionId);
  return { ok: true };
}

async function writeStaffDailyPinHash(
  module: StaffDailyPinModule,
  ownerId: string,
  hash: string | null,
  trialSessionId?: string,
) {
  if (module === "barber") {
    const tid = trialSessionId?.trim() || "prod";
    await prisma.barberShopProfile.upsert({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: ownerId,
          trialSessionId: tid,
        },
      },
      create: {
        ownerUserId: ownerId,
        trialSessionId: tid,
        staffDailyPinHash: hash,
      },
      update: { staffDailyPinHash: hash },
    });
    return;
  }
  if (module === "drink-pos") {
    await prisma.drinkPosShopProfile.upsert({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: ownerId,
          trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
        },
      },
      create: {
        ownerUserId: ownerId,
        trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
        staffDailyPinHash: hash,
      },
      update: { staffDailyPinHash: hash },
    });
    return;
  }
  if (module === "hotel-resort") {
    await prisma.hotelResortProfile.upsert({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: ownerId,
          trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
        },
      },
      create: {
        ownerUserId: ownerId,
        trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
        staffDailyPinHash: hash,
      },
      update: { staffDailyPinHash: hash },
    });
    return;
  }
  if (module === "football-turf") {
    const { ensureFootballTurfProfile } = await import("@/systems/football-turf/lib/ensure-profile");
    await ensureFootballTurfProfile(ownerId, STAFF_LINK_PERMANENT_SESSION_ID);
    await prisma.footballTurfShopProfile.update({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: ownerId,
          trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
        },
      },
      data: { staffDailyPinHash: hash },
    });
    return;
  }
  await prisma.moduleShopBranding.upsert({
    where: {
      ownerUserId_trialSessionId_moduleSlug: {
        ownerUserId: ownerId,
        trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
        moduleSlug: BUILDING_POS_MODULE_SLUG,
      },
    },
    create: {
      ownerUserId: ownerId,
      trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
      moduleSlug: BUILDING_POS_MODULE_SLUG,
      staffDailyPinHash: hash,
    },
    update: { staffDailyPinHash: hash },
  });
}
