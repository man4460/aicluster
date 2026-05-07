import { z } from "zod";
import type { LaundryOrderStatus } from "@/systems/laundry/laundry-order-status";
import { LAUNDRY_ORDER_STATUSES } from "@/systems/laundry/laundry-order-status";

export const laundryOrderStatusZod = z.enum(LAUNDRY_ORDER_STATUSES as [LaundryOrderStatus, ...LaundryOrderStatus[]]);

export function normalizeLaundryOrderStatus(raw: string): LaundryOrderStatus {
  const t = raw.trim().toUpperCase();
  if (LAUNDRY_ORDER_STATUSES.includes(t as LaundryOrderStatus)) return t as LaundryOrderStatus;
  return "PENDING_PICKUP";
}
