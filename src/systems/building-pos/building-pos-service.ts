"use client";

export type PosCategory = {
  id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
  image_url: string;
};

export type PosMenuItem = {
  id: number;
  category_id: number;
  name: string;
  price: number;
  description: string;
  is_active: boolean;
  image_url: string;
  /** ร้านตั้งเป็นเมนูแนะนำ (แสดงในแถวแนะนำหน้าลูกค้า) */
  is_featured?: boolean;
  /** จำนวนที่ขายสะสมจากออเดอร์ — ส่งเฉพาะจาก API สาธารณะ */
  sold_qty?: number;
};

export type PosOrderItem = {
  menu_item_id: number;
  name: string;
  price: number;
  qty: number;
  note: string;
};

export type PosOrder = {
  id: number;
  created_at: string;
  customer_name: string;
  table_no: string;
  status: "NEW" | "PREPARING" | "SERVED" | "PAID";
  items: PosOrderItem[];
  total_amount: number;
  note: string;
  /** รูปสลิปโอน — อัปโหลดจากแดชบอร์ด */
  payment_slip_url?: string;
};

type PosDB = {
  categories: PosCategory[];
  menu_items: PosMenuItem[];
  orders: PosOrder[];
  seq: { category: number; menu: number; order: number };
};

const STORAGE_KEY = "mawell.buildingpos.v1";
let STORAGE_SCOPE_KEY = "";

const seedDB: PosDB = {
  categories: [
    { id: 1, name: "อาหารจานเดียว", sort_order: 1, is_active: true, image_url: "" },
    { id: 2, name: "เครื่องดื่ม", sort_order: 2, is_active: true, image_url: "" },
  ],
  menu_items: [
    { id: 1, category_id: 1, name: "ข้าวกะเพราไก่", price: 55, description: "", is_active: true, image_url: "", is_featured: true },
    { id: 2, category_id: 2, name: "ชาเย็น", price: 35, description: "", is_active: true, image_url: "", is_featured: false },
  ],
  orders: [],
  seq: { category: 2, menu: 2, order: 0 },
};

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function activeStorageKey() {
  const scope = STORAGE_SCOPE_KEY.trim();
  if (!scope) return STORAGE_KEY;
  return `${STORAGE_KEY}.${scope}`;
}

export function setBuildingPosStorageScope(scopeKey?: string) {
  STORAGE_SCOPE_KEY = scopeKey?.trim() ?? "";
}

function normalizeDB(input: unknown): PosDB | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Partial<PosDB>;
  if (!Array.isArray(raw.categories) || !Array.isArray(raw.menu_items) || !Array.isArray(raw.orders)) return null;
  return {
    categories: raw.categories as PosCategory[],
    menu_items: raw.menu_items as PosMenuItem[],
    orders: raw.orders as PosOrder[],
    seq: {
      category: raw.seq?.category ?? raw.categories.reduce((m, x) => (x.id > m ? x.id : m), 0),
      menu: raw.seq?.menu ?? raw.menu_items.reduce((m, x) => (x.id > m ? x.id : m), 0),
      order: raw.seq?.order ?? raw.orders.reduce((m, x) => (x.id > m ? x.id : m), 0),
    },
  };
}

function loadDB(): PosDB {
  try {
    const raw = localStorage.getItem(activeStorageKey());
    if (raw) {
      const parsed = normalizeDB(JSON.parse(raw));
      if (parsed) {
        saveDB(parsed);
        return parsed;
      }
    }
    saveDB(seedDB);
    return clone(seedDB);
  } catch {
    saveDB(seedDB);
    return clone(seedDB);
  }
}

function saveDB(db: PosDB) {
  localStorage.setItem(activeStorageKey(), JSON.stringify(db));
}

export class LocalStorageBuildingPosRepository {
  async listCategories() {
    return loadDB().categories.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  }
  async createCategory(input: Omit<PosCategory, "id">) {
    const db = loadDB();
    const row: PosCategory = { ...input, id: db.seq.category + 1 };
    db.seq.category = row.id;
    db.categories.push(row);
    saveDB(db);
    return row;
  }
  async updateCategory(id: number, patch: Partial<Omit<PosCategory, "id">>) {
    const db = loadDB();
    const idx = db.categories.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    db.categories[idx] = { ...db.categories[idx], ...patch };
    saveDB(db);
    return db.categories[idx];
  }
  async deleteCategory(id: number) {
    const db = loadDB();
    const prev = db.categories.length;
    db.categories = db.categories.filter((x) => x.id !== id);
    saveDB(db);
    return db.categories.length < prev;
  }

  async listMenuItems() {
    return loadDB().menu_items.sort((a, b) => a.id - b.id);
  }
  async createMenuItem(input: Omit<PosMenuItem, "id" | "sold_qty">) {
    const db = loadDB();
    const row: PosMenuItem = { ...input, is_featured: input.is_featured ?? false, id: db.seq.menu + 1 };
    db.seq.menu = row.id;
    db.menu_items.push(row);
    saveDB(db);
    return row;
  }
  async updateMenuItem(id: number, patch: Partial<Omit<PosMenuItem, "id">>) {
    const db = loadDB();
    const idx = db.menu_items.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    db.menu_items[idx] = { ...db.menu_items[idx], ...patch };
    saveDB(db);
    return db.menu_items[idx];
  }
  async deleteMenuItem(id: number) {
    const db = loadDB();
    const prev = db.menu_items.length;
    db.menu_items = db.menu_items.filter((x) => x.id !== id);
    saveDB(db);
    return db.menu_items.length < prev;
  }

  async listOrders() {
    return loadDB().orders.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }
  async createOrder(input: Omit<PosOrder, "id" | "created_at">) {
    const db = loadDB();
    const row: PosOrder = {
      ...input,
      payment_slip_url: input.payment_slip_url?.trim() ?? "",
      id: db.seq.order + 1,
      created_at: new Date().toISOString(),
      total_amount: input.items.reduce((s, x) => s + x.price * x.qty, 0),
    };
    db.seq.order = row.id;
    db.orders.push(row);
    saveDB(db);
    return row;
  }
  async updateOrder(id: number, patch: Partial<Omit<PosOrder, "id" | "created_at">>) {
    const db = loadDB();
    const idx = db.orders.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    const next = { ...db.orders[idx], ...patch };
    next.total_amount = next.items.reduce((s, x) => s + x.price * x.qty, 0);
    db.orders[idx] = next;
    saveDB(db);
    return db.orders[idx];
  }
}

export function createBuildingPosRepository() {
  return new LocalStorageBuildingPosRepository();
}

/** อัปโหลดรูปไปที่ session building-pos — ส่ง cookie เซสชันเสมอ */
export async function uploadBuildingPosSessionImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/building-pos/session/images/upload", {
    method: "POST",
    body: form,
    credentials: "include",
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; imageUrl?: string; debug?: string };
  if (!res.ok) {
    let msg =
      typeof data.error === "string" && data.error.trim() ?
        data.error
      : `${res.status} ${res.statusText}`.trim() || "อัปโหลดรูปไม่สำเร็จ";
    if (typeof data.debug === "string" && data.debug.trim()) {
      msg += `\n\n--- รายละเอียด (dev) ---\n${data.debug.slice(0, 3500)}`;
    }
    throw new Error(msg);
  }
  const url = data.imageUrl?.trim();
  if (!url) throw new Error("อัปโหลดรูปไม่สำเร็จ");
  return url;
}

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; debug?: string };
  if (!res.ok) {
    const fromBody = (data as { error?: unknown }).error;
    let msg =
      typeof fromBody === "string" && fromBody.trim() ?
        fromBody
      : `${res.status} ${res.statusText}`.trim() || "Request failed";
    const dbg = (data as { debug?: unknown }).debug;
    if (typeof dbg === "string" && dbg.trim()) {
      msg += `\n\n--- รายละเอียด (dev) ---\n${dbg.slice(0, 3500)}`;
    }
    throw new Error(msg);
  }
  return data;
}

class SessionApiBuildingPosRepository {
  async listCategories() {
    const res = await fetch("/api/building-pos/session/categories", { cache: "no-store" });
    return (await readJson<{ categories: PosCategory[] }>(res)).categories;
  }
  async createCategory(input: Omit<PosCategory, "id">) {
    const res = await fetch("/api/building-pos/session/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await readJson<{ category: PosCategory }>(res)).category;
  }
  async updateCategory(id: number, patch: Partial<Omit<PosCategory, "id">>) {
    const res = await fetch(`/api/building-pos/session/categories?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return (await readJson<{ category: PosCategory }>(res)).category;
  }
  async deleteCategory(id: number) {
    const res = await fetch(`/api/building-pos/session/categories?id=${id}`, { method: "DELETE" });
    await readJson<{ ok: boolean }>(res);
  }
  async listMenuItems() {
    const res = await fetch("/api/building-pos/session/menu-items", { cache: "no-store" });
    return (await readJson<{ menu_items: PosMenuItem[] }>(res)).menu_items;
  }
  async createMenuItem(input: Omit<PosMenuItem, "id" | "sold_qty">) {
    const res = await fetch("/api/building-pos/session/menu-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await readJson<{ menu_item: PosMenuItem }>(res)).menu_item;
  }
  async updateMenuItem(
    id: number,
    patch: Partial<{
      category_id: number;
      name: string;
      image_url: string;
      price: number;
      description: string;
      is_active: boolean;
      is_featured: boolean;
    }>,
  ) {
    const res = await fetch(`/api/building-pos/session/menu-items?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return (await readJson<{ menu_item: PosMenuItem }>(res)).menu_item;
  }
  async patchMenuItem(id: number, patch: { is_featured: boolean }) {
    return this.updateMenuItem(id, patch);
  }
  async deleteMenuItem(id: number) {
    const res = await fetch(`/api/building-pos/session/menu-items?id=${id}`, { method: "DELETE" });
    await readJson<{ ok: boolean }>(res);
  }
  async listOrders() {
    const res = await fetch("/api/building-pos/session/orders", { cache: "no-store" });
    return (await readJson<{ orders: PosOrder[] }>(res)).orders;
  }
  async updateOrder(id: number, patch: Partial<Omit<PosOrder, "id" | "created_at">>) {
    const res = await fetch(`/api/building-pos/session/orders?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return (await readJson<{ order: PosOrder }>(res)).order;
  }
}

class PublicApiBuildingPosRepository {
  constructor(private readonly ownerId: string, private readonly trialSessionId?: string) {}
  async listCategories() {
    const params = new URLSearchParams({ ownerId: this.ownerId });
    if (this.trialSessionId) params.set("t", this.trialSessionId);
    const res = await fetch(`/api/building-pos/public/menu?${params.toString()}`, { cache: "no-store" });
    return (await readJson<{ categories: PosCategory[] }>(res)).categories;
  }
  async listMenuItems() {
    const params = new URLSearchParams({ ownerId: this.ownerId });
    if (this.trialSessionId) params.set("t", this.trialSessionId);
    const res = await fetch(`/api/building-pos/public/menu?${params.toString()}`, { cache: "no-store" });
    return (await readJson<{ menu_items: PosMenuItem[] }>(res)).menu_items;
  }
  async createOrder(input: Omit<PosOrder, "id" | "created_at">) {
    const res = await fetch("/api/building-pos/public/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerId: this.ownerId,
        trialSessionId: this.trialSessionId ?? null,
        customer_name: input.customer_name,
        table_no: input.table_no,
        items: input.items,
      }),
    });
    await readJson<{ ok: boolean; orderId: number }>(res);
    return {
      ...input,
      payment_slip_url: "",
      id: 0,
      created_at: new Date().toISOString(),
      total_amount: input.items.reduce((s, x) => s + x.price * x.qty, 0),
    } as PosOrder;
  }
}

export function createBuildingPosSessionApiRepository() {
  return new SessionApiBuildingPosRepository();
}

export function createBuildingPosPublicApiRepository(ownerId: string, trialSessionId?: string) {
  return new PublicApiBuildingPosRepository(ownerId, trialSessionId);
}
