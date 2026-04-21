import { z } from "zod";
import type { LaundryOrderStatus } from "@/systems/laundry/laundry-service";
import { LAUNDRY_ORDER_STATUSES } from "@/systems/laundry/laundry-service";

export const laundryOrderStatusZod = z.enum(LAUNDRY_ORDER_STATUSES as [LaundryOrderStatus, ...LaundryOrderStatus[]]);

export function normalizeLaundryOrderStatus(raw: string): LaundryOrderStatus {
  const t = raw.trim().toUpperCase();
  if (LAUNDRY_ORDER_STATUSES.includes(t as LaundryOrderStatus)) return t as LaundryOrderStatus;
  return "PENDING_PICKUP";
}
