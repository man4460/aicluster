export type GeneralStorePosCategoryRow = {
  id: string;
  name: string;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
};

export type GeneralStorePosProductRow = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  priceBaht: number;
  imageUrl: string | null;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type GeneralStorePosSaleLineRow = {
  id: string;
  productName: string;
  unitPriceBaht: number;
  quantity: number;
  lineTotalBaht: number;
};

export type GeneralStorePosSaleRow = {
  id: string;
  note: string | null;
  totalBaht: number;
  createdAt: string;
  lines: GeneralStorePosSaleLineRow[];
};

export function generalStorePosFetchErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "เชื่อมต่อล้มเหลว";
}

async function parseJson(res: Response): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: res.statusText || "อ่านข้อมูลไม่ได้" };
  }
  if (!res.ok) {
    const err =
      typeof data === "object" && data !== null && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `HTTP ${res.status}`;
    return { ok: false, error: err };
  }
  return { ok: true, data };
}

export async function fetchGeneralStorePosCategories(): Promise<
  { ok: true; categories: GeneralStorePosCategoryRow[] } | { ok: false; error: string }
> {
  const res = await fetch("/api/general-store-pos/categories", { credentials: "include" });
  const p = await parseJson(res);
  if (!p.ok) return p;
  const d = p.data as { categories?: GeneralStorePosCategoryRow[] };
  return { ok: true, categories: d.categories ?? [] };
}

export async function fetchGeneralStorePosProducts(): Promise<
  { ok: true; products: GeneralStorePosProductRow[] } | { ok: false; error: string }
> {
  const res = await fetch("/api/general-store-pos/products", { credentials: "include" });
  const p = await parseJson(res);
  if (!p.ok) return p;
  const d = p.data as { products?: GeneralStorePosProductRow[] };
  return { ok: true, products: d.products ?? [] };
}

export async function fetchGeneralStorePosSales(take = 60): Promise<
  { ok: true; sales: GeneralStorePosSaleRow[] } | { ok: false; error: string }
> {
  const res = await fetch(`/api/general-store-pos/sales?take=${take}`, { credentials: "include" });
  const p = await parseJson(res);
  if (!p.ok) return p;
  const d = p.data as { sales?: GeneralStorePosSaleRow[] };
  return { ok: true, sales: d.sales ?? [] };
}
