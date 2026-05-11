import type {
  InventoryCategoryRow,
  InventoryItemRow,
  InventoryMovementRow,
  InventoryWarehouseRow,
} from "@/systems/inventory/components/types";

async function jsonOrEmpty<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchInventoryWarehouses(): Promise<{
  ok: true;
  warehouses: InventoryWarehouseRow[];
} | { ok: false; error: string }> {
  const res = await fetch("/api/inventory/warehouses", { cache: "no-store" });
  const j = await jsonOrEmpty<{ warehouses?: InventoryWarehouseRow[]; error?: string }>(res);
  if (!res.ok)
    return { ok: false, error: j?.error?.trim() || `โหลดคลังไม่สำเร็จ (รหัส ${res.status})` };
  return { ok: true, warehouses: j?.warehouses ?? [] };
}

export async function fetchInventoryCategories(): Promise<{
  ok: true;
  categories: InventoryCategoryRow[];
} | { ok: false; error: string }> {
  const res = await fetch("/api/inventory/categories", { cache: "no-store" });
  const j = await jsonOrEmpty<{ categories?: InventoryCategoryRow[]; error?: string }>(res);
  if (!res.ok)
    return { ok: false, error: j?.error?.trim() || `โหลดหมวดไม่สำเร็จ (รหัส ${res.status})` };
  return { ok: true, categories: j?.categories ?? [] };
}

export async function fetchInventoryItems(): Promise<{
  ok: true;
  items: InventoryItemRow[];
} | { ok: false; error: string }> {
  const res = await fetch("/api/inventory/items", { cache: "no-store" });
  const j = await jsonOrEmpty<{ items?: InventoryItemRow[]; error?: string }>(res);
  if (!res.ok)
    return { ok: false, error: j?.error?.trim() || `โหลดสินค้าไม่สำเร็จ (รหัส ${res.status})` };
  return { ok: true, items: j?.items ?? [] };
}

export async function fetchInventoryMovements(limit = 50): Promise<{
  ok: true;
  movements: InventoryMovementRow[];
} | { ok: false; error: string }> {
  const res = await fetch(`/api/inventory/movements?limit=${limit}`, { cache: "no-store" });
  const j = await jsonOrEmpty<{ movements?: InventoryMovementRow[]; error?: string }>(res);
  if (!res.ok)
    return { ok: false, error: j?.error?.trim() || `โหลดประวัติไม่สำเร็จ (รหัส ${res.status})` };
  return { ok: true, movements: j?.movements ?? [] };
}

export function inventoryFetchErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "เชื่อมต่อล้มเหลว";
}

export function formatThb(n: number): string {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(n);
}

export function formatDateTimeShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
