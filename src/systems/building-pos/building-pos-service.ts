"use client";

import { readStoredStaffDailyUnlock, staffDailyUnlockHeaders } from "@/lib/modules/staff-daily-pin";

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
  /** แผนกครัวที่รับเมนูนี้ (หลายครัว — แพ็ก 299+) */
  kitchen_department_id?: number | null;
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

/** รายการของ / วัตถุดิบ (ใช้ในบันทึกรายจ่าย + สูตร) */
export type PosIngredient = {
  id: number;
  name: string;
  unit_label: string;
  sort_order: number;
};

export type PosPurchaseLine = {
  id: number;
  ingredient_id: number;
  quantity: number;
  unit_price_baht: number;
  line_total_baht: number;
};

/** หนึ่งครั้งของการบันทึกรายจ่าย (ซื้อของ) */
export type PosPurchaseOrder = {
  id: number;
  purchased_on: string;
  note: string;
  /** รูปสลิปโอน / หลักฐานรายจ่าย */
  payment_slip_url?: string;
  created_at: string;
  lines: PosPurchaseLine[];
};

/** หมวดรายจ่ายทั่วไป (ไม่ใช่ซื้อวัตถุดิบ) */
export type PosCostCategory = {
  id: number;
  name: string;
  sort_order: number;
};

/** รายจ่ายทั่วไป (ค่าเช่า / สาธารณูปโภค ฯลฯ) */
export type PosCostEntry = {
  id: number;
  label: string;
  amount_baht: number;
  spent_at: string;
  note: string;
  category_id: number | null;
  category_name: string | null;
  payment_slip_url?: string;
};

export type PosRecipeLine = {
  ingredient_id: number;
  qty_per_portion: number;
};

export type PosEstimatedCosts = {
  estimated_cost_baht: Record<string, number>;
  margin_baht: Record<string, number | null>;
  ingredient_last_unit_price_baht: Record<string, number>;
};

export type PosOrderItem = {
  menu_item_id: number;
  name: string;
  price: number;
  qty: number;
  note: string;
  kitchen_department_id?: number | null;
  kitchen_status?: "NEW" | "PREPARING" | "SERVED";
  /** พร้อมเสิร์ฟ / กำลังเสิร์ฟ / เสิร์ฟแล้ว — ขึ้นแผนกเสิร์ฟได้ทันทีเมื่อครัวทำเสร็จ */
  serve_status?: "READY" | "SERVING" | "DELIVERED";
};

export type PosKitchenDepartment = {
  id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type PosOrder = {
  id: number;
  created_at: string;
  customer_name: string;
  table_no: string;
  /** ถ้ามีค่า แปลว่าสร้างจากหน้า QR ลูกค้า */
  customer_session_id?: string;
  status: "NEW" | "PREPARING" | "SERVED" | "SERVING" | "DELIVERED" | "PAID";
  items: PosOrderItem[];
  total_amount: number;
  note: string;
  /** รูปสลิปโอน — อัปโหลดจากแดชบอร์ด */
  payment_slip_url?: string;
  /** คีย์การ์ดบนกระดานเสิร์ฟ (ออเดอร์เดียวแยกหลายการ์ดตามชุดเมนูที่พร้อม) */
  board_key?: string;
  member_phone?: string;
  points_earned?: number;
  points_redeemed?: number;
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
  async updateOrder(id: number, patch: Partial<Omit<PosOrder, "id">>) {
    const db = loadDB();
    const idx = db.orders.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    const next = { ...db.orders[idx], ...patch };
    next.total_amount = next.items.reduce((s, x) => s + x.price * x.qty, 0);
    db.orders[idx] = next;
    saveDB(db);
    return db.orders[idx];
  }
  async deleteOrder(id: number) {
    const db = loadDB();
    const prev = db.orders.length;
    db.orders = db.orders.filter((x) => x.id !== id);
    saveDB(db);
    return db.orders.length < prev;
  }
}

export function createBuildingPosRepository() {
  return new LocalStorageBuildingPosRepository();
}

/** อัปโหลดรูปไปที่ session building-pos — ส่ง cookie เซสชันเสมอ */
export async function uploadBuildingPosStaffImage(
  file: File,
  ctx: { ownerId: string; trialSessionId: string; k: string },
): Promise<string> {
  const q = new URLSearchParams({ ownerId: ctx.ownerId, t: ctx.trialSessionId, k: ctx.k });
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`/api/building-pos/staff/images/upload?${q}`, { method: "POST", body: form });
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
  /** ส่งคุกกี้เซสชันเสมอ — กันกรณีโดเมน/ทางลัดที่ lax + default ไม่แนบคุกกี้ */
  private fetchSession(input: string | URL, init?: RequestInit): Promise<Response> {
    return fetch(input, { ...init, credentials: "include" });
  }

  async listCategories() {
    const res = await this.fetchSession("/api/building-pos/session/categories", { cache: "no-store" });
    return (await readJson<{ categories: PosCategory[] }>(res)).categories;
  }
  async createCategory(input: Omit<PosCategory, "id">) {
    const res = await this.fetchSession("/api/building-pos/session/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await readJson<{ category: PosCategory }>(res)).category;
  }
  async updateCategory(id: number, patch: Partial<Omit<PosCategory, "id">>) {
    const res = await this.fetchSession(`/api/building-pos/session/categories?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return (await readJson<{ category: PosCategory }>(res)).category;
  }
  async deleteCategory(id: number) {
    const res = await this.fetchSession(`/api/building-pos/session/categories?id=${id}`, { method: "DELETE" });
    await readJson<{ ok: boolean }>(res);
  }
  async listMenuItems() {
    const res = await this.fetchSession("/api/building-pos/session/menu-items", { cache: "no-store" });
    return (await readJson<{ menu_items: PosMenuItem[] }>(res)).menu_items;
  }
  async createMenuItem(input: Omit<PosMenuItem, "id" | "sold_qty">) {
    const res = await this.fetchSession("/api/building-pos/session/menu-items", {
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
      kitchen_department_id: number | null;
      name: string;
      image_url: string;
      price: number;
      description: string;
      is_active: boolean;
      is_featured: boolean;
    }>,
  ) {
    const res = await this.fetchSession(`/api/building-pos/session/menu-items?id=${id}`, {
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
    const res = await this.fetchSession(`/api/building-pos/session/menu-items?id=${id}`, { method: "DELETE" });
    await readJson<{ ok: boolean }>(res);
  }

  async listKitchenDepartments() {
    const res = await this.fetchSession("/api/building-pos/session/kitchen-departments", { cache: "no-store" });
    return readJson<{ departments: PosKitchenDepartment[]; features?: { multiKitchen?: boolean } }>(res);
  }
  async createKitchenDepartment(input: Omit<PosKitchenDepartment, "id">) {
    const res = await this.fetchSession("/api/building-pos/session/kitchen-departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await readJson<{ department: PosKitchenDepartment }>(res)).department;
  }
  async updateKitchenDepartment(id: number, patch: Partial<Omit<PosKitchenDepartment, "id">>) {
    const res = await this.fetchSession(`/api/building-pos/session/kitchen-departments?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return (await readJson<{ department: PosKitchenDepartment }>(res)).department;
  }
  async deleteKitchenDepartment(id: number) {
    const res = await this.fetchSession(`/api/building-pos/session/kitchen-departments?id=${id}`, {
      method: "DELETE",
    });
    await readJson<{ ok: boolean }>(res);
  }

  async listIngredients() {
    const res = await this.fetchSession("/api/building-pos/session/ingredients", { cache: "no-store" });
    return (await readJson<{ ingredients: PosIngredient[] }>(res)).ingredients;
  }
  async createIngredient(input: Omit<PosIngredient, "id">) {
    const res = await this.fetchSession("/api/building-pos/session/ingredients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        unit_label: input.unit_label,
        sort_order: input.sort_order,
      }),
    });
    return (await readJson<{ ingredient: PosIngredient }>(res)).ingredient;
  }
  async updateIngredient(id: number, patch: Partial<Omit<PosIngredient, "id">>) {
    const res = await this.fetchSession(`/api/building-pos/session/ingredients?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return (await readJson<{ ingredient: PosIngredient }>(res)).ingredient;
  }
  async deleteIngredient(id: number) {
    const res = await this.fetchSession(`/api/building-pos/session/ingredients?id=${id}`, { method: "DELETE" });
    await readJson<{ ok: boolean }>(res);
  }

  async listPurchaseOrders() {
    const res = await this.fetchSession("/api/building-pos/session/purchase-orders", { cache: "no-store" });
    return (await readJson<{ purchase_orders: PosPurchaseOrder[] }>(res)).purchase_orders;
  }
  async createPurchaseOrder(input: {
    purchased_on: string;
    note?: string | null;
    payment_slip_url?: string | null;
    lines: Omit<PosPurchaseLine, "id" | "line_total_baht">[];
  }) {
    const res = await this.fetchSession("/api/building-pos/session/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await readJson<{ purchase_order: PosPurchaseOrder }>(res)).purchase_order;
  }
  async updatePurchaseOrder(
    id: number,
    patch: {
      purchased_on?: string;
      note?: string | null;
      payment_slip_url?: string | null;
      lines?: Omit<PosPurchaseLine, "id" | "line_total_baht">[];
    },
  ) {
    const res = await this.fetchSession(`/api/building-pos/session/purchase-orders?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return (await readJson<{ purchase_order: PosPurchaseOrder }>(res)).purchase_order;
  }
  async deletePurchaseOrder(id: number) {
    const res = await this.fetchSession(`/api/building-pos/session/purchase-orders?id=${id}`, { method: "DELETE" });
    await readJson<{ ok: boolean }>(res);
  }

  async listCostCategories() {
    const res = await this.fetchSession("/api/building-pos/session/cost-categories", { cache: "no-store" });
    return (await readJson<{ categories: PosCostCategory[] }>(res)).categories;
  }
  async createCostCategory(input: { name: string; sort_order?: number }) {
    const res = await this.fetchSession("/api/building-pos/session/cost-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await readJson<{ category: PosCostCategory }>(res)).category;
  }
  async updateCostCategory(id: number, patch: { name: string; sort_order?: number }) {
    const res = await this.fetchSession(`/api/building-pos/session/cost-categories?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return (await readJson<{ category: PosCostCategory }>(res)).category;
  }
  async deleteCostCategory(id: number) {
    const res = await this.fetchSession(`/api/building-pos/session/cost-categories?id=${id}`, { method: "DELETE" });
    await readJson<{ ok: boolean }>(res);
  }

  async listCostEntries() {
    const res = await this.fetchSession("/api/building-pos/session/costs", { cache: "no-store" });
    return (await readJson<{ costs: PosCostEntry[] }>(res)).costs;
  }
  async createCostEntry(input: {
    label: string;
    amount_baht: number;
    category_id: number;
    note?: string | null;
    payment_slip_url?: string | null;
    spent_at?: string;
  }) {
    const res = await this.fetchSession("/api/building-pos/session/costs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await readJson<{ cost: PosCostEntry }>(res)).cost;
  }
  async updateCostEntry(
    id: number,
    patch: {
      label?: string;
      amount_baht?: number;
      category_id?: number;
      note?: string | null;
      payment_slip_url?: string | null;
      spent_at?: string;
    },
  ) {
    const res = await this.fetchSession(`/api/building-pos/session/costs?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return (await readJson<{ cost: PosCostEntry }>(res)).cost;
  }
  async deleteCostEntry(id: number) {
    const res = await this.fetchSession(`/api/building-pos/session/costs?id=${id}`, { method: "DELETE" });
    await readJson<{ ok: boolean }>(res);
  }

  async listRecipesByMenu() {
    const res = await this.fetchSession("/api/building-pos/session/menu-recipes", { cache: "no-store" });
    return (await readJson<{ recipes_by_menu: Record<string, PosRecipeLine[]> }>(res)).recipes_by_menu;
  }
  async putMenuRecipe(menuItemId: number, lines: PosRecipeLine[]) {
    const res = await this.fetchSession(`/api/building-pos/session/menu-recipes?menu_item_id=${menuItemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines }),
    });
    return (await readJson<{ menu_item_id: number; lines: PosRecipeLine[] }>(res)).lines;
  }

  async getEstimatedCosts() {
    const res = await this.fetchSession("/api/building-pos/session/estimated-costs", { cache: "no-store" });
    return readJson<PosEstimatedCosts>(res);
  }

  async listOrders() {
    const res = await this.fetchSession("/api/building-pos/session/orders", { cache: "no-store" });
    return (await readJson<{ orders: PosOrder[] }>(res)).orders;
  }
  async updateOrder(id: number, patch: Partial<Omit<PosOrder, "id">>) {
    const res = await this.fetchSession(`/api/building-pos/session/orders?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return (await readJson<{ order: PosOrder }>(res)).order;
  }
  async deleteOrder(id: number) {
    const res = await this.fetchSession(`/api/building-pos/session/orders?id=${id}`, { method: "DELETE" });
    await readJson<{ ok: boolean }>(res);
  }
}

class StaffApiBuildingPosRepository {
  constructor(
    private readonly ownerId: string,
    private readonly trialSessionId: string,
    private readonly k: string,
  ) {}

  private qs() {
    const p = new URLSearchParams({ ownerId: this.ownerId, t: this.trialSessionId, k: this.k });
    const du = readStoredStaffDailyUnlock("building-pos", this.ownerId);
    if (du) p.set("du", du);
    return p.toString();
  }

  private unlockHeaders(): HeadersInit {
    return staffDailyUnlockHeaders("building-pos", this.ownerId);
  }

  async listOrders() {
    const res = await fetch(`/api/building-pos/staff/orders?${this.qs()}`, {
      cache: "no-store",
      headers: this.unlockHeaders(),
    });
    return (await readJson<{ orders: PosOrder[] }>(res)).orders;
  }

  async updateOrder(id: number, patch: Partial<Omit<PosOrder, "id">>) {
    const res = await fetch(`/api/building-pos/staff/orders?id=${id}&${this.qs()}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...this.unlockHeaders() },
      body: JSON.stringify(patch),
    });
    return (await readJson<{ order: PosOrder }>(res)).order;
  }
}

class PublicApiBuildingPosRepository {
  constructor(private readonly ownerId: string, private readonly trialSessionId?: string) {}

  private menuParams() {
    const params = new URLSearchParams({ ownerId: this.ownerId });
    if (this.trialSessionId) params.set("t", this.trialSessionId);
    return params;
  }

  async listCategories() {
    const res = await fetch(`/api/building-pos/public/menu?${this.menuParams().toString()}`, { cache: "no-store" });
    return (await readJson<{ categories: PosCategory[] }>(res)).categories;
  }
  async listMenuItems() {
    const res = await fetch(`/api/building-pos/public/menu?${this.menuParams().toString()}`, { cache: "no-store" });
    return (await readJson<{ menu_items: PosMenuItem[] }>(res)).menu_items;
  }
  async getPublicMenuBootstrap() {
    const res = await fetch(`/api/building-pos/public/menu?${this.menuParams().toString()}`, { cache: "no-store" });
    return readJson<{
      categories: PosCategory[];
      menu_items: PosMenuItem[];
      loyalty?: {
        enabled?: boolean;
        rule_preview?: string;
        rewards?: Array<{
          id: number;
          title: string;
          menu_item_id: number | null;
          points_cost: number;
          sort_order: number;
          is_active: boolean;
          image_url?: string;
        }>;
      };
    }>(res);
  }
  async createOrder(
    input: Omit<PosOrder, "id" | "created_at">,
    opts?: { customerSessionId?: string },
  ) {
    const total = input.items.reduce((s, x) => s + x.price * x.qty, 0);
    const res = await fetch("/api/building-pos/public/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerId: this.ownerId,
        trialSessionId: this.trialSessionId ?? null,
        customer_name: input.customer_name,
        table_no: input.table_no,
        member_phone: input.member_phone?.trim() || null,
        items: input.items,
        note: input.note?.trim() ? input.note.trim() : null,
        customer_session_id: opts?.customerSessionId?.trim() || null,
      }),
    });
    const data = await readJson<{ ok: boolean; orderId: number }>(res);
    return {
      ...input,
      payment_slip_url: "",
      id: data.orderId,
      created_at: new Date().toISOString(),
      total_amount: total,
    } as PosOrder;
  }

  async listMyOrders(tableNo: string, customerSessionId: string) {
    const params = new URLSearchParams({
      ownerId: this.ownerId,
      table: tableNo.trim(),
      session: customerSessionId.trim(),
    });
    if (this.trialSessionId) params.set("t", this.trialSessionId);
    const res = await fetch(`/api/building-pos/public/my-orders?${params}`, { cache: "no-store" });
    return (await readJson<{ orders: PosOrder[] }>(res)).orders;
  }
}

export function createBuildingPosSessionApiRepository() {
  return new SessionApiBuildingPosRepository();
}

export function createBuildingPosPublicApiRepository(ownerId: string, trialSessionId?: string) {
  return new PublicApiBuildingPosRepository(ownerId, trialSessionId);
}

export function createBuildingPosStaffApiRepository(ownerId: string, trialSessionId: string, staffKey: string) {
  return new StaffApiBuildingPosRepository(ownerId, trialSessionId, staffKey);
}
