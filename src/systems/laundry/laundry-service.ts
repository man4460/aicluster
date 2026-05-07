"use client";

import type { LaundryOrderStatus } from "@/systems/laundry/laundry-order-status";
import {
  LAUNDRY_DURATION_HOURS_MIN,
  roundLaundryDurationHours,
} from "@/systems/laundry/laundry-duration-hours";

export type { LaundryOrderStatus };
export {
  LAUNDRY_ORDER_STATUSES,
  laundryOrderStatusLabelTh,
} from "@/systems/laundry/laundry-order-status";

/** ราคาตามขนาดตะกร้า (แสดงบนการ์ด POS) */
export type LaundryBasketTier = {
  label: string;
  price: number;
};

export type LaundryPackage = {
  id: number;
  name: string;
  pricing_model: "PER_KG" | "PER_ITEM" | "FLAT";
  base_price: number;
  /** เวลาประมาณเป็นชั่วโมง (ทศนิยมได้ — เก็บปัดมิลลิชั่วโมง) */
  duration_hours: number;
  description: string;
  /** URL รูปการ์ด — อัปโหลดผ่าน `uploadLaundrySessionImage` */
  image_url?: string | null;
  /** รายการตะกร้า×ราคา — ถ้ามี ให้เลือกขั้นตอนก่อนบันทึกออเดอร์ */
  basket_tiers?: LaundryBasketTier[] | null;
  is_active: boolean;
};

export type LaundryOrder = {
  id: number;
  order_at: string;
  customer_name: string;
  customer_phone: string;
  pickup_address: string;
  dropoff_address: string;
  service_type: string;
  package_id: number | null;
  package_name: string;
  weight_kg: number;
  item_count: number;
  final_price: number;
  note: string;
  recorded_by_name: string;
  status: LaundryOrderStatus;
};

/** หมวดรายจ่าย — เทียบ `CostCategory` คาร์แคร์ */
export type LaundryCostCategory = {
  id: number;
  name: string;
  created_at: string;
};

/** รายการรายจ่าย — เทียบ `CostEntry` คาร์แคร์ */
export type LaundryCostEntry = {
  id: number;
  category_id: number;
  category_name: string;
  spent_at: string;
  amount: number;
  item_label: string;
  note: string;
  slip_photo_url: string;
  created_at: string;
};

export type LaundryCostEntryInput = {
  category_id: number;
  spent_at: string;
  amount: number;
  item_label: string;
  note?: string;
  slip_photo_url?: string;
};

export type LaundryCostEntryPatch = Partial<{
  category_id: number;
  spent_at: string;
  amount: number;
  item_label: string;
  note: string;
  slip_photo_url: string;
}>;

export interface LaundryRepository {
  listPackages(): Promise<LaundryPackage[]>;
  createPackage(input: Omit<LaundryPackage, "id">): Promise<LaundryPackage>;
  updatePackage(id: number, patch: Partial<Omit<LaundryPackage, "id">>): Promise<LaundryPackage | null>;
  deletePackage(id: number): Promise<boolean>;

  listOrders(): Promise<LaundryOrder[]>;
  createOrder(
    input: Omit<LaundryOrder, "id" | "order_at" | "status"> & { order_at?: string; status?: LaundryOrderStatus },
  ): Promise<LaundryOrder>;
  updateOrder(id: number, patch: Partial<Omit<LaundryOrder, "id" | "order_at">>): Promise<LaundryOrder | null>;
  deleteOrder(id: number): Promise<boolean>;

  listCostCategories(): Promise<LaundryCostCategory[]>;
  createCostCategory(name: string): Promise<LaundryCostCategory>;
  updateCostCategory(id: number, patch: { name: string }): Promise<LaundryCostCategory | null>;
  deleteCostCategory(id: number): Promise<boolean>;

  listCostEntries(): Promise<LaundryCostEntry[]>;
  createCostEntry(input: LaundryCostEntryInput): Promise<LaundryCostEntry>;
  updateCostEntry(id: number, patch: LaundryCostEntryPatch): Promise<LaundryCostEntry | null>;
  deleteCostEntry(id: number): Promise<boolean>;
}

type LaundryDB = {
  packages: LaundryPackage[];
  orders: LaundryOrder[];
  seq: { package: number; order: number };
};

const STORAGE_KEY = "mawell.laundry.db.v1";
let STORAGE_SCOPE_KEY = "";

function activeStorageKey(): string {
  const scope = STORAGE_SCOPE_KEY.trim();
  return scope ? `${STORAGE_KEY}.${scope}` : STORAGE_KEY;
}

export function setLaundryStorageScope(scopeKey?: string) {
  STORAGE_SCOPE_KEY = scopeKey?.trim() ?? "";
}

const seedDB: LaundryDB = {
  packages: [
    {
      id: 1,
      name: "ซัก-อบ-พับ",
      pricing_model: "PER_KG",
      base_price: 45,
      duration_hours: 24,
      description: "คิดราคาต่อกิโล เหมาะกับผ้าทั่วไป",
      image_url: null,
      basket_tiers: [
        { label: "ตะกร้า S", price: 120 },
        { label: "ตะกร้า M", price: 180 },
        { label: "ตะกร้า L", price: 240 },
      ],
      is_active: true,
    },
    {
      id: 2,
      name: "ซักผ้านวม",
      pricing_model: "PER_ITEM",
      base_price: 150,
      duration_hours: 36,
      description: "คิดราคาต่อชิ้นสำหรับผ้าห่ม/ผ้านวม",
      image_url: null,
      basket_tiers: [{ label: "ต่อชิ้น", price: 150 }],
      is_active: true,
    },
  ],
  orders: [
    {
      id: 1,
      order_at: new Date().toISOString(),
      customer_name: "ลูกค้าตัวอย่าง",
      customer_phone: "0812345678",
      pickup_address: "บ้านเลขที่ 99 ซอยตัวอย่าง",
      dropoff_address: "บ้านเลขที่ 99 ซอยตัวอย่าง",
      service_type: "ซัก-อบ-พับ",
      package_id: 1,
      package_name: "ซัก-อบ-พับ",
      weight_kg: 4.5,
      item_count: 15,
      final_price: 200,
      note: "",
      recorded_by_name: "เจ้าของร้าน",
      status: "PENDING_PICKUP",
    },
  ],
  seq: { package: 2, order: 1 },
};

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function loadDB(): LaundryDB {
  try {
    const raw = localStorage.getItem(activeStorageKey());
    if (!raw) {
      localStorage.setItem(activeStorageKey(), JSON.stringify(seedDB));
      return clone(seedDB);
    }
    const parsed = JSON.parse(raw) as LaundryDB;
    if (!Array.isArray(parsed.packages) || !Array.isArray(parsed.orders) || !parsed.seq) {
      localStorage.setItem(activeStorageKey(), JSON.stringify(seedDB));
      return clone(seedDB);
    }
    for (const p of parsed.packages) {
      if (!("image_url" in p)) (p as LaundryPackage).image_url = null;
      if (!("basket_tiers" in p)) (p as LaundryPackage).basket_tiers = null;
      const rawPkg = p as Record<string, unknown>;
      let hours: number | undefined;
      if (
        typeof rawPkg.duration_hours === "number" &&
        Number.isFinite(rawPkg.duration_hours) &&
        rawPkg.duration_hours >= LAUNDRY_DURATION_HOURS_MIN
      ) {
        hours = rawPkg.duration_hours as number;
      } else if (
        typeof rawPkg.duration_minutes === "number" &&
        Number.isFinite(rawPkg.duration_minutes) &&
        rawPkg.duration_minutes >= 1
      ) {
        hours = (rawPkg.duration_minutes as number) / 60;
      }
      if (hours == null || hours < LAUNDRY_DURATION_HOURS_MIN) hours = 24;
      (p as LaundryPackage).duration_hours = roundLaundryDurationHours(hours);
      delete rawPkg.duration_minutes;
    }
    return parsed;
  } catch {
    localStorage.setItem(activeStorageKey(), JSON.stringify(seedDB));
    return clone(seedDB);
  }
}

function saveDB(db: LaundryDB) {
  localStorage.setItem(activeStorageKey(), JSON.stringify(db));
}

export class LocalStorageLaundryRepository implements LaundryRepository {
  async listPackages(): Promise<LaundryPackage[]> {
    return loadDB().packages.sort((a, b) => a.id - b.id);
  }

  async createPackage(input: Omit<LaundryPackage, "id">): Promise<LaundryPackage> {
    const db = loadDB();
    const row: LaundryPackage = { ...input, id: db.seq.package + 1 };
    db.seq.package = row.id;
    db.packages.push(row);
    saveDB(db);
    return row;
  }

  async updatePackage(id: number, patch: Partial<Omit<LaundryPackage, "id">>): Promise<LaundryPackage | null> {
    const db = loadDB();
    const idx = db.packages.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    db.packages[idx] = { ...db.packages[idx], ...patch };
    saveDB(db);
    return db.packages[idx];
  }

  async deletePackage(id: number): Promise<boolean> {
    const db = loadDB();
    const prev = db.packages.length;
    db.packages = db.packages.filter((x) => x.id !== id);
    saveDB(db);
    return db.packages.length < prev;
  }

  async listOrders(): Promise<LaundryOrder[]> {
    return loadDB().orders.sort((a, b) => (a.order_at < b.order_at ? 1 : -1));
  }

  async createOrder(
    input: Omit<LaundryOrder, "id" | "order_at" | "status"> & { order_at?: string; status?: LaundryOrderStatus },
  ): Promise<LaundryOrder> {
    const db = loadDB();
    const row: LaundryOrder = {
      ...input,
      id: db.seq.order + 1,
      order_at: input.order_at ?? new Date().toISOString(),
      status: input.status ?? "PENDING_PICKUP",
    };
    db.seq.order = row.id;
    db.orders.push(row);
    saveDB(db);
    return row;
  }

  async updateOrder(
    id: number,
    patch: Partial<Omit<LaundryOrder, "id" | "order_at">>,
  ): Promise<LaundryOrder | null> {
    const db = loadDB();
    const idx = db.orders.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    db.orders[idx] = { ...db.orders[idx], ...patch };
    saveDB(db);
    return db.orders[idx];
  }

  async deleteOrder(id: number): Promise<boolean> {
    const db = loadDB();
    const prev = db.orders.length;
    db.orders = db.orders.filter((x) => x.id !== id);
    saveDB(db);
    return db.orders.length < prev;
  }

  async listCostCategories(): Promise<LaundryCostCategory[]> {
    return [];
  }

  async createCostCategory(_name: string): Promise<LaundryCostCategory> {
    throw new Error("การเงินและต้นทุนต้องใช้ผ่านบัญชีที่เชื่อม API — โหมดทดสอบในเบราว์เซอร์เท่านั้นไม่รองรับรายจ่าย");
  }

  async updateCostCategory(_id: number, _patch: { name: string }): Promise<LaundryCostCategory | null> {
    throw new Error("การเงินและต้นทุนต้องใช้ผ่านบัญชีที่เชื่อม API");
  }

  async deleteCostCategory(_id: number): Promise<boolean> {
    throw new Error("การเงินและต้นทุนต้องใช้ผ่านบัญชีที่เชื่อม API");
  }

  async listCostEntries(): Promise<LaundryCostEntry[]> {
    return [];
  }

  async createCostEntry(_input: LaundryCostEntryInput): Promise<LaundryCostEntry> {
    throw new Error("การเงินและต้นทุนต้องใช้ผ่านบัญชีที่เชื่อม API");
  }

  async updateCostEntry(_id: number, _patch: LaundryCostEntryPatch): Promise<LaundryCostEntry | null> {
    throw new Error("การเงินและต้นทุนต้องใช้ผ่านบัญชีที่เชื่อม API");
  }

  async deleteCostEntry(_id: number): Promise<boolean> {
    throw new Error("การเงินและต้นทุนต้องใช้ผ่านบัญชีที่เชื่อม API");
  }
}

function errorMessageFromApiBody(data: unknown, res: Response, rawText: string): string {
  const obj =
    data !== null && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
  const err = obj?.error;
  if (typeof err === "string" && err.trim()) return err.trim();
  const msg = obj?.message;
  if (typeof msg === "string" && msg.trim()) return msg.trim();
  const t = rawText.trim();
  if (t && !t.startsWith("<") && t.length <= 400) return t.slice(0, 400);
  if (res.status === 401) return "กรุณาเข้าสู่ระบบ";
  if (res.status === 403) return "ไม่มีสิทธิ์เข้าถึง";
  if (res.status === 404) return "ไม่พบข้อมูล";
  if (res.status >= 500) {
    return "เซิร์ฟเวอร์ผิดพลาด — ลองใหม่ภายหลัง หรือรัน npx prisma migrate deploy แล้วรีสตาร์ท next dev (ดู log ในเทอร์มินัลเซิร์ฟเวอร์)";
  }
  const line = `${res.status} ${res.statusText}`.trim();
  return line || "ขอข้อมูลไม่สำเร็จ";
}

async function readJson<T>(res: Response): Promise<T> {
  const rawText = await res.text();
  let data: unknown;
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    if (!res.ok) throw new Error(errorMessageFromApiBody(null, res, rawText));
    throw new Error("รูปแบบการตอบกลับไม่ถูกต้อง");
  }
  if (!res.ok) {
    throw new Error(errorMessageFromApiBody(data, res, rawText));
  }
  return data as T;
}

async function sessionFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, {
      ...init,
      credentials: init?.credentials ?? "include",
    });
  } catch (e) {
    if (e instanceof TypeError) {
      const m = (e.message || "").toLowerCase();
      if (
        m.includes("failed to fetch") ||
        m.includes("load failed") ||
        m.includes("network") ||
        m.includes("fetch")
      ) {
        throw new Error("เชื่อมต่อแอปไม่ได้ — ตรวจว่าเซิร์ฟเวอร์รันอยู่ (npm run dev) แล้วรีเฟรชหน้า");
      }
    }
    throw e;
  }
}

class SessionApiLaundryRepository implements LaundryRepository {
  async listPackages(): Promise<LaundryPackage[]> {
    const res = await sessionFetch("/api/laundry/session/packages", { cache: "no-store" });
    const data = await readJson<{ packages: LaundryPackage[] }>(res);
    return data.packages;
  }

  async createPackage(input: Omit<LaundryPackage, "id">): Promise<LaundryPackage> {
    const res = await sessionFetch("/api/laundry/session/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        pricing_model: input.pricing_model,
        base_price: input.base_price,
        duration_hours: input.duration_hours,
        description: input.description,
        is_active: input.is_active,
        ...(input.image_url != null && input.image_url !== "" ? { image_url: input.image_url } : {}),
        ...(input.basket_tiers != null && input.basket_tiers.length > 0 ? { basket_tiers: input.basket_tiers } : {}),
      }),
    });
    return (await readJson<{ package: LaundryPackage }>(res)).package;
  }

  async updatePackage(id: number, patch: Partial<Omit<LaundryPackage, "id">>): Promise<LaundryPackage | null> {
    const body = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as Record<string, unknown>;
    const res = await sessionFetch(`/api/laundry/session/packages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await readJson<{ package: LaundryPackage }>(res)).package;
  }

  async deletePackage(id: number): Promise<boolean> {
    const res = await sessionFetch(`/api/laundry/session/packages/${id}`, { method: "DELETE" });
    return (await readJson<{ ok: boolean }>(res)).ok;
  }

  async listOrders(): Promise<LaundryOrder[]> {
    const res = await sessionFetch("/api/laundry/session/orders", { cache: "no-store" });
    return (await readJson<{ orders: LaundryOrder[] }>(res)).orders;
  }

  async createOrder(
    input: Omit<LaundryOrder, "id" | "order_at" | "status"> & { order_at?: string; status?: LaundryOrderStatus },
  ): Promise<LaundryOrder> {
    const res = await sessionFetch("/api/laundry/session/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        pickup_address: input.pickup_address,
        dropoff_address: input.dropoff_address,
        service_type: input.service_type,
        package_id: input.package_id,
        package_name: input.package_name,
        weight_kg: input.weight_kg,
        item_count: input.item_count,
        final_price: input.final_price,
        note: input.note,
        recorded_by_name: input.recorded_by_name,
        ...(input.order_at ? { order_at: input.order_at } : {}),
        ...(input.status ? { status: input.status } : {}),
      }),
    });
    return (await readJson<{ order: LaundryOrder }>(res)).order;
  }

  async updateOrder(id: number, patch: Partial<Omit<LaundryOrder, "id" | "order_at">>): Promise<LaundryOrder | null> {
    const body = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as Record<string, unknown>;
    const res = await sessionFetch(`/api/laundry/session/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 404) return null;
    return (await readJson<{ order: LaundryOrder }>(res)).order;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const res = await sessionFetch(`/api/laundry/session/orders/${id}`, { method: "DELETE" });
    return (await readJson<{ ok: boolean }>(res)).ok;
  }

  async listCostCategories(): Promise<LaundryCostCategory[]> {
    const res = await sessionFetch("/api/laundry/session/cost-categories", { cache: "no-store" });
    return (await readJson<{ categories: LaundryCostCategory[] }>(res)).categories;
  }

  async createCostCategory(name: string): Promise<LaundryCostCategory> {
    const res = await sessionFetch("/api/laundry/session/cost-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    return (await readJson<{ category: LaundryCostCategory }>(res)).category;
  }

  async updateCostCategory(id: number, patch: { name: string }): Promise<LaundryCostCategory | null> {
    const res = await sessionFetch(`/api/laundry/session/cost-categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    return (await readJson<{ category: LaundryCostCategory }>(res)).category;
  }

  async deleteCostCategory(id: number): Promise<boolean> {
    const res = await sessionFetch(`/api/laundry/session/cost-categories/${id}`, { method: "DELETE" });
    return (await readJson<{ ok: boolean }>(res)).ok;
  }

  async listCostEntries(): Promise<LaundryCostEntry[]> {
    const res = await sessionFetch("/api/laundry/session/cost-entries", { cache: "no-store" });
    return (await readJson<{ entries: LaundryCostEntry[] }>(res)).entries;
  }

  async createCostEntry(input: LaundryCostEntryInput): Promise<LaundryCostEntry> {
    const res = await sessionFetch("/api/laundry/session/cost-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: input.category_id,
        spent_at: input.spent_at,
        amount: input.amount,
        item_label: input.item_label,
        note: input.note ?? "",
        ...(input.slip_photo_url != null && input.slip_photo_url.trim() !== "" ?
          { slip_photo_url: input.slip_photo_url.trim() }
        : {}),
      }),
    });
    return (await readJson<{ entry: LaundryCostEntry }>(res)).entry;
  }

  async updateCostEntry(id: number, patch: LaundryCostEntryPatch): Promise<LaundryCostEntry | null> {
    const body = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as Record<string, unknown>;
    const res = await sessionFetch(`/api/laundry/session/cost-entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await readJson<{ entry: LaundryCostEntry }>(res)).entry;
  }

  async deleteCostEntry(id: number): Promise<boolean> {
    const res = await sessionFetch(`/api/laundry/session/cost-entries/${id}`, { method: "DELETE" });
    return (await readJson<{ ok: boolean }>(res)).ok;
  }
}

export function createLaundryRepository(): LaundryRepository {
  return new LocalStorageLaundryRepository();
}

export function createLaundrySessionApiRepository(): LaundryRepository {
  return new SessionApiLaundryRepository();
}

export async function uploadLaundrySessionImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await sessionFetch("/api/laundry/session/images/upload", {
    method: "POST",
    body: form,
    credentials: "include",
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; imageUrl?: string };
  if (!res.ok) {
    const msg = typeof data.error === "string" && data.error.trim() ? data.error.trim() : "อัปโหลดรูปไม่สำเร็จ";
    throw new Error(msg);
  }
  const url = data.imageUrl?.trim();
  if (!url) throw new Error("อัปโหลดรูปไม่สำเร็จ");
  return url;
}
