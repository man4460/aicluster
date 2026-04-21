"use client";

export type LaundryOrderStatus =
  | "PENDING_PICKUP"
  | "PICKED_UP"
  | "SORTING"
  | "WASHING"
  | "DRYING"
  | "IRONING"
  | "READY_TO_DELIVER"
  | "DELIVERING"
  | "COMPLETED"
  | "CANCELLED";

export const LAUNDRY_ORDER_STATUSES: LaundryOrderStatus[] = [
  "PENDING_PICKUP",
  "PICKED_UP",
  "SORTING",
  "WASHING",
  "DRYING",
  "IRONING",
  "READY_TO_DELIVER",
  "DELIVERING",
  "COMPLETED",
  "CANCELLED",
];

export function laundryOrderStatusLabelTh(status: LaundryOrderStatus): string {
  switch (status) {
    case "PENDING_PICKUP":
      return "รอรับผ้า";
    case "PICKED_UP":
      return "รับผ้าแล้ว";
    case "SORTING":
      return "คัดแยกผ้า";
    case "WASHING":
      return "กำลังซัก";
    case "DRYING":
      return "กำลังอบ/ตาก";
    case "IRONING":
      return "กำลังรีด/พับ";
    case "READY_TO_DELIVER":
      return "พร้อมส่งคืน";
    case "DELIVERING":
      return "กำลังส่งคืน";
    case "COMPLETED":
      return "ส่งคืนสำเร็จ";
    case "CANCELLED":
      return "ยกเลิก";
    default:
      return status;
  }
}

export type LaundryPackage = {
  id: number;
  name: string;
  pricing_model: "PER_KG" | "PER_ITEM" | "FLAT";
  base_price: number;
  duration_hours: number;
  description: string;
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
      is_active: true,
    },
    {
      id: 2,
      name: "ซักผ้านวม",
      pricing_model: "PER_ITEM",
      base_price: 150,
      duration_hours: 36,
      description: "คิดราคาต่อชิ้นสำหรับผ้าห่ม/ผ้านวม",
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
    return await fetch(input, init);
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
      }),
    });
    return (await readJson<{ package: LaundryPackage }>(res)).package;
  }

  async updatePackage(id: number, patch: Partial<Omit<LaundryPackage, "id">>): Promise<LaundryPackage | null> {
    const res = await sessionFetch(`/api/laundry/session/packages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.status === 404) return null;
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
