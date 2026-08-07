import { buffetTierMaxGroup } from "@/lib/modules/config";
import type { UserAccessFields } from "@/lib/modules/access";
import type { PlanFeaturePolicyDto } from "@/lib/modules/plan-feature-policy";

type KitchenOrderItem = {
  kitchen_department_id?: number | null;
  kitchen_status?: "NEW" | "PREPARING" | "SERVED" | string | null;
  /** สถานะเสิร์ฟต่อรายการ — ขึ้นแผนกเสิร์ฟได้ทันทีเมื่อครัวทำเสร็จ */
  serve_status?: "READY" | "SERVING" | "DELIVERED" | string | null;
  name?: string;
  qty?: number;
  menu_item_id?: number;
  price?: number;
  note?: string;
};

/** แพ็ก 299 ขึ้นไป (กลุ่ม 2+) หรือแอดมิน */
export function isBuffetTier299OrAbove(
  user: Pick<UserAccessFields, "role" | "subscriptionType" | "subscriptionTier">,
): boolean {
  if (user.role === "ADMIN") return true;
  if (user.subscriptionType !== "BUFFET") return false;
  return buffetTierMaxGroup(user.subscriptionTier) >= 2;
}

export function canUseMultiKitchenFeature(
  user: Pick<UserAccessFields, "role" | "subscriptionType" | "subscriptionTier">,
  policy: Pick<PlanFeaturePolicyDto, "multiKitchenGateEnabled">,
): boolean {
  if (!policy.multiKitchenGateEnabled) return true;
  return isBuffetTier299OrAbove(user);
}

export type PosKitchenDepartment = {
  id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export function mapKitchenDepartmentRow(r: {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
}): PosKitchenDepartment {
  return {
    id: r.id,
    name: r.name,
    sort_order: r.sortOrder,
    is_active: r.isActive,
  };
}

export type KitchenLineStatus = "NEW" | "PREPARING" | "SERVED";
export type ServeLineStatus = "READY" | "SERVING" | "DELIVERED";

export function normalizeKitchenLineStatus(value: unknown): KitchenLineStatus {
  if (value === "PREPARING" || value === "SERVED") return value;
  return "NEW";
}

export function orderUsesLineKitchenTracking(items: KitchenOrderItem[]): boolean {
  return items.some(
    (it) =>
      it.kitchen_status != null ||
      (it.kitchen_department_id != null && it.kitchen_department_id > 0) ||
      it.serve_status != null,
  );
}

/** สถานะเสิร์ฟของรายการที่ครัวทำเสร็จแล้ว — ยังไม่เสร็จครัว = null */
export function normalizeServeLineStatus(item: KitchenOrderItem): ServeLineStatus | null {
  if (normalizeKitchenLineStatus(item.kitchen_status) !== "SERVED") return null;
  if (item.serve_status === "SERVING" || item.serve_status === "DELIVERED") return item.serve_status;
  return "READY";
}

/** สถานะรวมของรายการในแผนก (หรือทั้งออเดอร์) */
export function aggregateKitchenLineStatus(statuses: KitchenLineStatus[]): KitchenLineStatus {
  if (statuses.length === 0) return "NEW";
  if (statuses.every((s) => s === "SERVED")) return "SERVED";
  if (statuses.some((s) => s === "PREPARING" || s === "SERVED")) return "PREPARING";
  return "NEW";
}

export function itemMatchesKitchenDepartment(
  item: Pick<KitchenOrderItem, "kitchen_department_id">,
  departmentId: number,
): boolean {
  const id = item.kitchen_department_id;
  if (id == null || id === 0) return true;
  return id === departmentId;
}

export function filterOrderItemsForKitchenDepartment<T extends KitchenOrderItem>(
  items: T[],
  departmentId: number | null | undefined,
): T[] {
  if (departmentId == null || !Number.isFinite(departmentId) || departmentId <= 0) {
    return items;
  }
  return items.filter((it) => itemMatchesKitchenDepartment(it, departmentId));
}

export function kitchenBoardStatusForOrder(
  items: KitchenOrderItem[],
  departmentId: number | null | undefined,
  orderStatus: string,
): KitchenLineStatus | string {
  if (departmentId == null || departmentId <= 0) {
    return orderStatus;
  }
  const mine = filterOrderItemsForKitchenDepartment(items, departmentId);
  if (mine.length === 0) return orderStatus;
  return aggregateKitchenLineStatus(mine.map((it) => normalizeKitchenLineStatus(it.kitchen_status)));
}

/** อัปเดต kitchen_status ของรายการในแผนก — ทำเสร็จแล้วส่งเข้าคิวเสิร์ฟทันที (serve_status READY) */
export function applyKitchenDepartmentStatusAdvance<T extends KitchenOrderItem>(
  items: T[],
  departmentId: number,
  nextStatus: KitchenLineStatus,
): { items: T[]; kitchenAggregate: KitchenLineStatus } {
  const nextItems = items.map((it) => {
    if (!itemMatchesKitchenDepartment(it, departmentId)) return it;
    const base = {
      ...it,
      kitchen_status: nextStatus,
      kitchen_department_id: it.kitchen_department_id ?? null,
    };
    if (nextStatus === "SERVED") {
      const prevServe = it.serve_status;
      return {
        ...base,
        serve_status:
          prevServe === "SERVING" || prevServe === "DELIVERED" ? prevServe : ("READY" as const),
      };
    }
    if (nextStatus === "NEW" || nextStatus === "PREPARING") {
      const rest = { ...base } as T & { serve_status?: string };
      delete rest.serve_status;
      return rest as T;
    }
    return base;
  });
  const kitchenAggregate = aggregateKitchenLineStatus(
    nextItems.map((it) => normalizeKitchenLineStatus(it.kitchen_status)),
  );
  return { items: nextItems, kitchenAggregate };
}

/**
 * สถานะออเดอร์รวม — รายการที่ครัวทำเสร็จแล้วขึ้นเสิร์ฟได้ทันที
 * ไม่ต้องรอทุกเมนูเสร็จครบ
 */
export function resolveOrderStatusFromLineProgress(
  items: KitchenOrderItem[],
  currentOrderStatus: string,
): string {
  if (currentOrderStatus === "PAID") return "PAID";

  if (!orderUsesLineKitchenTracking(items)) {
    return currentOrderStatus;
  }

  const kitchenAggregate = aggregateKitchenLineStatus(
    items.map((it) => normalizeKitchenLineStatus(it.kitchen_status)),
  );
  const readyBatch = items.filter((it) => normalizeServeLineStatus(it) != null);
  if (readyBatch.length === 0) {
    return kitchenAggregate;
  }

  const serveStatuses = readyBatch.map((it) => normalizeServeLineStatus(it)!);
  const allDelivered = serveStatuses.every((s) => s === "DELIVERED");
  if (allDelivered && kitchenAggregate === "SERVED") return "DELIVERED";
  if (allDelivered) {
    return kitchenAggregate === "NEW" ? "NEW" : "PREPARING";
  }
  if (serveStatuses.some((s) => s === "SERVING")) return "SERVING";
  if (serveStatuses.some((s) => s === "READY")) return "SERVED";
  return kitchenAggregate;
}

/** @deprecated ใช้ resolveOrderStatusFromLineProgress */
export function resolveOrderStatusAfterKitchenAggregate(
  currentOrderStatus: string,
  kitchenAggregate: KitchenLineStatus,
): string {
  if (
    currentOrderStatus === "SERVING" ||
    currentOrderStatus === "DELIVERED" ||
    currentOrderStatus === "PAID"
  ) {
    return currentOrderStatus;
  }
  return kitchenAggregate;
}

/** แผนกเสิร์ฟกดเริ่มเสิร์ฟ / เสร็จ — อัปเดตรายการที่พร้อมในคิวนั้น */
export function applyServeLineStatusAdvance<T extends KitchenOrderItem>(
  items: T[],
  nextBoardStatus: "SERVED" | "SERVING" | "DELIVERED",
): T[] {
  return items.map((it) => {
    const serve = normalizeServeLineStatus(it);
    if (serve == null) return it;
    if (nextBoardStatus === "SERVING" && serve === "READY") {
      return { ...it, serve_status: "SERVING" as const };
    }
    if (nextBoardStatus === "DELIVERED" && (serve === "SERVING" || serve === "READY")) {
      return { ...it, serve_status: "DELIVERED" as const };
    }
    if (nextBoardStatus === "SERVED" && serve === "SERVING") {
      return { ...it, serve_status: "READY" as const };
    }
    return it;
  });
}

export type ServeBoardOrderProjection<T extends { id: number; status: string; items: KitchenOrderItem[] }> = T & {
  board_key: string;
};

/**
 * แยกการ์ดเสิร์ฟตามรายการที่ครัวทำเสร็จแล้ว — ขึ้นคิวเสิร์ฟทันทีไม่รอเมนูอื่น
 * คอลัมน์ SERVED = READY · SERVING · DELIVERED
 */
export function projectOrdersForServeBoard<T extends { id: number; status: string; items: KitchenOrderItem[] }>(
  orders: T[],
): ServeBoardOrderProjection<T>[] {
  const out: ServeBoardOrderProjection<T>[] = [];
  for (const order of orders) {
    if (!orderUsesLineKitchenTracking(order.items)) {
      if (order.status === "SERVED" || order.status === "SERVING" || order.status === "DELIVERED") {
        out.push({ ...order, board_key: String(order.id) });
      }
      continue;
    }

    const byCol: Record<"SERVED" | "SERVING" | "DELIVERED", KitchenOrderItem[]> = {
      SERVED: [],
      SERVING: [],
      DELIVERED: [],
    };
    for (const it of order.items) {
      const serve = normalizeServeLineStatus(it);
      if (serve === "READY") byCol.SERVED.push(it);
      else if (serve === "SERVING") byCol.SERVING.push(it);
      else if (serve === "DELIVERED") byCol.DELIVERED.push(it);
    }
    for (const col of ["SERVED", "SERVING", "DELIVERED"] as const) {
      if (byCol[col].length === 0) continue;
      out.push({
        ...order,
        items: byCol[col] as T["items"],
        status: col,
        board_key: `${order.id}-${col}`,
      });
    }
  }
  return out;
}
