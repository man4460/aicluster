import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/car-wash/http";

const MIN_PHONE_DIGITS = 9;

/**
 * Upsert `LaundryCustomer` by owner + trial + phone so walk-in / POS / pickup
 * phones are searchable later (same as package sale / cash check-in).
 * Returns null when phone is empty or too short.
 */
export async function upsertLaundryCustomerByPhone(input: {
  ownerUserId: string;
  trialSessionId: string;
  phoneRaw: string;
  name?: string | null;
}): Promise<{ id: number; phone: string; name: string | null } | null> {
  const phone = normalizePhone(input.phoneRaw);
  if (phone.length < MIN_PHONE_DIGITS) return null;

  const name =
    input.name != null && String(input.name).trim().length > 0
      ? String(input.name).trim().slice(0, 100)
      : null;

  const whereCustomer = {
    ownerUserId_phone_trialSessionId: {
      ownerUserId: input.ownerUserId,
      phone,
      trialSessionId: input.trialSessionId,
    },
  } as const;

  let customer = await prisma.laundryCustomer.findUnique({ where: whereCustomer });
  if (!customer) {
    customer = await prisma.laundryCustomer.create({
      data: {
        ownerUserId: input.ownerUserId,
        trialSessionId: input.trialSessionId,
        phone,
        name,
      },
    });
  } else if (name != null && name.length > 0 && name !== customer.name) {
    customer = await prisma.laundryCustomer.update({
      where: { id: customer.id },
      data: { name },
    });
  }

  return { id: customer.id, phone: customer.phone, name: customer.name };
}
