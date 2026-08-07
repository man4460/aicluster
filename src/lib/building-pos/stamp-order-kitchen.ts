import { prisma } from "@/lib/prisma";

type OrderItemLike = {
  menu_item_id: number;
  name: string;
  price: number;
  qty: number;
  note: string;
  kitchen_department_id?: number | null;
  kitchen_status?: "NEW" | "PREPARING" | "SERVED";
};

/** ติดแผนกครัวจากเมนูตอนสร้างออเดอร์ */
export async function stampBuildingPosOrderItemsKitchenDept(
  ownerUserId: string,
  trialSessionId: string,
  items: OrderItemLike[],
): Promise<OrderItemLike[]> {
  const menuIds = [...new Set(items.map((i) => i.menu_item_id).filter((id) => Number.isFinite(id) && id > 0))];
  if (menuIds.length === 0) {
    return items.map((it) => ({
      ...it,
      kitchen_department_id: it.kitchen_department_id ?? null,
      kitchen_status: it.kitchen_status ?? "NEW",
    }));
  }
  const menus = await prisma.buildingPosMenuItem.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      id: { in: menuIds },
    },
    select: { id: true, kitchenDepartmentId: true },
  });
  const map = new Map(menus.map((m) => [m.id, m.kitchenDepartmentId]));
  return items.map((it) => ({
    ...it,
    kitchen_department_id: map.get(it.menu_item_id) ?? it.kitchen_department_id ?? null,
    kitchen_status: it.kitchen_status ?? "NEW",
  }));
}
