"use client";

import { type CarWashServiceStatus, normalizeCarWashServiceStatus } from "@/lib/car-wash/service-status";

export type { CarWashServiceStatus } from "@/lib/car-wash/service-status";

export type ServicePackage = {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
  description: string;
  is_active: boolean;
};

export type ComplaintStatus = "Pending" | "In Progress" | "Resolved";

export type Complaint = {
  id: number;
  subject: string;
  details: string;
  created_at: string;
  status: ComplaintStatus;
  photo_url: string;
};

export type ServiceVisit = {
  id: number;
  visit_at: string;
  customer_name: string;
  customer_phone: string;
  plate_number: string;
  package_id: number | null;
  package_name: string;
  listed_price: number;
  final_price: number;
  note: string;
  recorded_by_name: string;
  service_status: CarWashServiceStatus;
  /** รูปแนบ (สลิป/หลักฐาน) */
  photo_url: string;
  /** เหมาจ่าย: ยังไม่หักครั้งจนกว่า PAID (null หลังหักแล้วหรือไม่ใช่เหมา) */
  bundle_id: number | null;
};

/** PATCH รายการล้าง — ส่งเฉพาะฟิลด์ที่ต้องการเปลี่ยน */
export type ServiceVisitPatch = Partial<{
  customer_name: string;
  customer_phone: string;
  plate_number: string;
  package_id: number | null;
  package_name: string;
  listed_price: number;
  final_price: number;
  note: string;
  recorded_by_name: string;
  visit_at: string;
  service_status: CarWashServiceStatus;
  photo_url: string;
  bundle_id: number | null;
}>;

export type WashBundle = {
  id: number;
  customer_name: string;
  customer_phone: string;
  plate_number: string;
  package_id: number;
  package_name: string;
  paid_amount: number;
  total_uses: number;
  used_uses: number;
  is_active: boolean;
  /** สลิปชำระเงินซื้อแพ็กเหมา */
  slip_photo_url: string;
  created_at: string;
};

export type WashBundlePatch = Partial<{
  customer_name: string;
  customer_phone: string;
  plate_number: string;
  package_id: number;
  package_name: string;
  paid_amount: number;
  total_uses: number;
  is_active: boolean;
  slip_photo_url: string;
}>;

export type CostCategory = {
  id: number;
  name: string;
  created_at: string;
};

export type CostEntry = {
  id: number;
  category_id: number;
  category_name: string;
  spent_at: string;
  amount: number;
  /** รายการค่าใช้จ่าย (สิ่งที่ซื้อ/จ่าย) */
  item_label: string;
  note: string;
  /** รูปสลิป/บิล */
  slip_photo_url: string;
  created_at: string;
};

export type CostEntryInput = {
  category_id: number;
  spent_at: string;
  amount: number;
  item_label: string;
  note?: string;
  slip_photo_url?: string;
};

export type CostEntryPatch = Partial<{
  category_id: number;
  spent_at: string;
  amount: number;
  item_label: string;
  note: string;
  slip_photo_url: string;
}>;

export interface CarWashRepository {
  listPackages(): Promise<ServicePackage[]>;
  createPackage(input: Omit<ServicePackage, "id">): Promise<ServicePackage>;
  updatePackage(id: number, patch: Partial<Omit<ServicePackage, "id">>): Promise<ServicePackage | null>;
  deletePackage(id: number): Promise<boolean>;

  listComplaints(): Promise<Complaint[]>;
  createComplaint(input: Omit<Complaint, "id" | "created_at">): Promise<Complaint>;
  updateComplaint(id: number, patch: Partial<Omit<Complaint, "id" | "created_at">>): Promise<Complaint | null>;
  deleteComplaint(id: number): Promise<boolean>;

  listVisits(): Promise<ServiceVisit[]>;
  createVisit(
    input: Omit<ServiceVisit, "id" | "visit_at" | "service_status"> & { visit_at?: string; service_status?: CarWashServiceStatus },
  ): Promise<ServiceVisit>;
  updateVisit(id: number, patch: ServiceVisitPatch): Promise<ServiceVisit | null>;
  updateVisitStatus(id: number, service_status: CarWashServiceStatus): Promise<ServiceVisit | null>;
  deleteVisit(id: number): Promise<boolean>;

  listBundles(): Promise<WashBundle[]>;
  createBundle(input: Omit<WashBundle, "id" | "created_at" | "used_uses">): Promise<WashBundle>;
  updateBundle(id: number, patch: WashBundlePatch): Promise<WashBundle | null>;
  consumeBundleUse(id: number): Promise<WashBundle | null>;
  deleteBundle(id: number): Promise<boolean>;

  listCostCategories(): Promise<CostCategory[]>;
  createCostCategory(name: string): Promise<CostCategory>;
  updateCostCategory(id: number, patch: { name: string }): Promise<CostCategory | null>;
  deleteCostCategory(id: number): Promise<boolean>;

  listCostEntries(): Promise<CostEntry[]>;
  createCostEntry(input: CostEntryInput): Promise<CostEntry>;
  updateCostEntry(id: number, patch: CostEntryPatch): Promise<CostEntry | null>;
  deleteCostEntry(id: number): Promise<boolean>;
}

type CarWashDB = {
  packages: ServicePackage[];
  complaints: Complaint[];
  visits: ServiceVisit[];
  bundles: WashBundle[];
  seq: { package: number; complaint: number; visit: number; bundle: number };
};

const STORAGE_KEY = "mawell.carwash.db.v5";
const LEGACY_STORAGE_KEYS = ["mawell.carwash.db.v4", "mawell.carwash.db.v2", "mawell.carwash.db.v1"] as const;
let STORAGE_SCOPE_KEY = "";

const seedDB: CarWashDB = {
  packages: [
    {
      id: 1,
      name: "Basic Wash",
      price: 250,
      duration_minutes: 30,
      description: "Exterior wash and dry",
      is_active: true,
    },
    {
      id: 2,
      name: "Premium Wash",
      price: 590,
      duration_minutes: 60,
      description: "Exterior + interior cleaning + tire shine",
      is_active: true,
    },
  ],
  complaints: [
    {
      id: 1,
      subject: "Water spot on windshield",
      details: "Customer found water spots after drying.",
      created_at: new Date().toISOString(),
      status: "Pending",
      photo_url: "",
    },
  ],
  visits: [
    {
      id: 1,
      visit_at: new Date().toISOString(),
      customer_name: "Walk-in",
      customer_phone: "0812345678",
      plate_number: "กข-1234",
      package_id: 1,
      package_name: "Basic Wash",
      listed_price: 250,
      final_price: 250,
      note: "",
      recorded_by_name: "ตัวอย่าง",
      service_status: "COMPLETED",
      photo_url: "",
      bundle_id: null,
    },
  ],
  bundles: [
    {
      id: 1,
      customer_name: "Walk-in",
      customer_phone: "0812345678",
      plate_number: "กข-1234",
      package_id: 1,
      package_name: "Basic Wash",
      paid_amount: 1000,
      total_uses: 10,
      used_uses: 1,
      is_active: true,
      slip_photo_url: "",
      created_at: new Date().toISOString(),
    },
  ],
  seq: { package: 2, complaint: 1, visit: 1, bundle: 1 },
};

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function activeStorageKey(): string {
  const scope = STORAGE_SCOPE_KEY.trim();
  if (!scope) return STORAGE_KEY;
  return `${STORAGE_KEY}.${scope}`;
}

export function setCarWashStorageScope(scopeKey?: string) {
  STORAGE_SCOPE_KEY = scopeKey?.trim() ?? "";
}

function normalizeDB(input: unknown): CarWashDB | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Partial<CarWashDB> & {
    bundles?: Array<
      Partial<WashBundle> & {
        title?: string;
      }
    >;
    seq?: Partial<CarWashDB["seq"]>;
  };
  if (!Array.isArray(raw.packages) || !Array.isArray(raw.complaints) || !Array.isArray(raw.visits)) return null;

  const visits: ServiceVisit[] = raw.visits.map((v, idx) => {
    const rv = v as Record<string, unknown>;
    const pkgId = rv.package_id;
    return {
      id: typeof rv.id === "number" ? rv.id : idx + 1,
      visit_at: typeof rv.visit_at === "string" ? rv.visit_at : new Date().toISOString(),
      customer_name: typeof rv.customer_name === "string" ? rv.customer_name : "",
      customer_phone: typeof rv.customer_phone === "string" ? rv.customer_phone : "",
      plate_number: typeof rv.plate_number === "string" ? rv.plate_number : "",
      package_id: typeof pkgId === "number" ? pkgId : pkgId === null ? null : null,
      package_name: typeof rv.package_name === "string" ? rv.package_name : "",
      listed_price: typeof rv.listed_price === "number" ? rv.listed_price : 0,
      final_price: typeof rv.final_price === "number" ? rv.final_price : 0,
      note: typeof rv.note === "string" ? rv.note : "",
      recorded_by_name: typeof rv.recorded_by_name === "string" ? rv.recorded_by_name : "",
      service_status: normalizeCarWashServiceStatus(
        typeof rv.service_status === "string" ? rv.service_status : "COMPLETED",
      ),
      photo_url: typeof rv.photo_url === "string" ? rv.photo_url : "",
      bundle_id: typeof rv.bundle_id === "number" ? rv.bundle_id : null,
    };
  });

  const bundles: WashBundle[] = Array.isArray(raw.bundles)
    ? raw.bundles.map((b, idx) => {
        const entry = b as Partial<WashBundle> & { title?: string };
        const fallbackTitle = (typeof entry.title === "string" ? entry.title : "").trim();
        const packageName = (typeof entry.package_name === "string" ? entry.package_name : fallbackTitle).trim();
        return {
          id: typeof entry.id === "number" ? entry.id : idx + 1,
          customer_name: typeof entry.customer_name === "string" ? entry.customer_name : "",
          customer_phone: typeof entry.customer_phone === "string" ? entry.customer_phone : "",
          plate_number: typeof entry.plate_number === "string" ? entry.plate_number : "",
          package_id: typeof entry.package_id === "number" ? entry.package_id : 0,
          package_name: packageName || "ไม่ระบุแพ็กเกจ",
          paid_amount: typeof entry.paid_amount === "number" ? entry.paid_amount : 0,
          total_uses: typeof entry.total_uses === "number" ? entry.total_uses : 0,
          used_uses: typeof entry.used_uses === "number" ? entry.used_uses : 0,
          is_active: typeof entry.is_active === "boolean" ? entry.is_active : true,
          slip_photo_url: typeof entry.slip_photo_url === "string" ? entry.slip_photo_url : "",
          created_at: typeof entry.created_at === "string" ? entry.created_at : new Date().toISOString(),
        };
      })
    : [];

  const maxPackage = raw.packages.reduce((m, x) => (typeof x.id === "number" && x.id > m ? x.id : m), 0);
  const maxComplaint = raw.complaints.reduce((m, x) => (typeof x.id === "number" && x.id > m ? x.id : m), 0);
  const maxVisit = visits.reduce((m, x) => (x.id > m ? x.id : m), 0);
  const maxBundle = bundles.reduce((m, x) => (x.id > m ? x.id : m), 0);

  return {
    packages: raw.packages as ServicePackage[],
    complaints: raw.complaints as Complaint[],
    visits,
    bundles,
    seq: {
      package: Math.max(raw.seq?.package ?? 0, maxPackage),
      complaint: Math.max(raw.seq?.complaint ?? 0, maxComplaint),
      visit: Math.max(raw.seq?.visit ?? 0, maxVisit),
      bundle: Math.max(raw.seq?.bundle ?? 0, maxBundle),
    },
  };
}

function loadDB(): CarWashDB {
  const scopedStorageKey = activeStorageKey();
  try {
    const currentRaw = localStorage.getItem(scopedStorageKey);
    if (currentRaw) {
      const parsed = normalizeDB(JSON.parse(currentRaw));
      if (parsed) {
        saveDB(parsed);
        return parsed;
      }
    }

    if (scopedStorageKey === STORAGE_KEY) {
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        const legacyRaw = localStorage.getItem(legacyKey);
        if (!legacyRaw) continue;
        const migrated = normalizeDB(JSON.parse(legacyRaw));
        if (!migrated) continue;
        saveDB(migrated);
        return migrated;
      }
    }

    saveDB(seedDB);
    return clone(seedDB);
  } catch {
    saveDB(seedDB);
    return clone(seedDB);
  }
}

function saveDB(db: CarWashDB) {
  localStorage.setItem(activeStorageKey(), JSON.stringify(db));
}

export class LocalStorageCarWashRepository implements CarWashRepository {
  async listPackages(): Promise<ServicePackage[]> {
    const db = loadDB();
    return db.packages.sort((a, b) => a.id - b.id);
  }

  async createPackage(input: Omit<ServicePackage, "id">): Promise<ServicePackage> {
    const db = loadDB();
    const row: ServicePackage = { ...input, id: db.seq.package + 1 };
    db.seq.package = row.id;
    db.packages.push(row);
    saveDB(db);
    return row;
  }

  async updatePackage(id: number, patch: Partial<Omit<ServicePackage, "id">>): Promise<ServicePackage | null> {
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

  async listComplaints(): Promise<Complaint[]> {
    const db = loadDB();
    return db.complaints.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }

  async createComplaint(input: Omit<Complaint, "id" | "created_at">): Promise<Complaint> {
    const db = loadDB();
    const row: Complaint = {
      ...input,
      id: db.seq.complaint + 1,
      created_at: new Date().toISOString(),
    };
    db.seq.complaint = row.id;
    db.complaints.push(row);
    saveDB(db);
    return row;
  }

  async updateComplaint(
    id: number,
    patch: Partial<Omit<Complaint, "id" | "created_at">>,
  ): Promise<Complaint | null> {
    const db = loadDB();
    const idx = db.complaints.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    db.complaints[idx] = { ...db.complaints[idx], ...patch };
    saveDB(db);
    return db.complaints[idx];
  }

  async deleteComplaint(id: number): Promise<boolean> {
    const db = loadDB();
    const prev = db.complaints.length;
    db.complaints = db.complaints.filter((x) => x.id !== id);
    saveDB(db);
    return db.complaints.length < prev;
  }

  async listVisits(): Promise<ServiceVisit[]> {
    const db = loadDB();
    return db.visits.sort((a, b) => (a.visit_at < b.visit_at ? 1 : -1));
  }

  async createVisit(
    input: Omit<ServiceVisit, "id" | "visit_at" | "service_status"> & { visit_at?: string; service_status?: CarWashServiceStatus },
  ): Promise<ServiceVisit> {
    const db = loadDB();
    const bundleId = input.bundle_id ?? null;
    if (bundleId != null) {
      const b = db.bundles.find((x) => x.id === bundleId);
      if (!b || !b.is_active || b.used_uses >= b.total_uses) {
        throw new Error("แพ็กเกจเหมาไม่พร้อมใช้งาน หรือจำนวนครั้งคงเหลือหมดแล้ว");
      }
    }
    const status = input.service_status ?? "WASHING";
    let storedBundleId = bundleId;
    if (bundleId != null && status === "PAID") {
      const consumed = await this.consumeBundleUse(bundleId);
      if (!consumed) throw new Error("แพ็กเกจเหมาไม่พร้อมใช้งาน หรือจำนวนครั้งคงเหลือหมดแล้ว");
      storedBundleId = null;
    }
    const row: ServiceVisit = {
      id: db.seq.visit + 1,
      visit_at: input.visit_at ?? new Date().toISOString(),
      customer_name: input.customer_name,
      customer_phone: input.customer_phone ?? "",
      plate_number: input.plate_number,
      package_id: input.package_id,
      package_name: input.package_name,
      listed_price: input.listed_price,
      final_price: input.final_price,
      note: input.note,
      recorded_by_name: input.recorded_by_name ?? "",
      service_status: status,
      photo_url: input.photo_url ?? "",
      bundle_id: storedBundleId,
    };
    db.seq.visit = row.id;
    db.visits.push(row);
    saveDB(db);
    return row;
  }

  async updateVisit(id: number, patch: ServiceVisitPatch): Promise<ServiceVisit | null> {
    const db = loadDB();
    const idx = db.visits.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    const cur = db.visits[idx];
    const next: ServiceVisit = { ...cur, bundle_id: cur.bundle_id ?? null };
    if (patch.customer_name !== undefined) next.customer_name = patch.customer_name;
    if (patch.customer_phone !== undefined) next.customer_phone = patch.customer_phone;
    if (patch.plate_number !== undefined) next.plate_number = patch.plate_number;
    if (patch.package_id !== undefined) next.package_id = patch.package_id;
    if (patch.package_name !== undefined) next.package_name = patch.package_name;
    if (patch.listed_price !== undefined) next.listed_price = patch.listed_price;
    if (patch.final_price !== undefined) next.final_price = patch.final_price;
    if (patch.note !== undefined) next.note = patch.note ?? "";
    if (patch.recorded_by_name !== undefined) next.recorded_by_name = patch.recorded_by_name ?? "";
    if (patch.visit_at !== undefined) next.visit_at = patch.visit_at;
    if (patch.service_status !== undefined) next.service_status = patch.service_status;
    if (patch.photo_url !== undefined) next.photo_url = patch.photo_url ?? "";
    if (patch.bundle_id !== undefined) next.bundle_id = patch.bundle_id;

    const becamePaid =
      patch.service_status === "PAID" && normalizeCarWashServiceStatus(cur.service_status) !== "PAID";
    if (becamePaid && next.bundle_id != null) {
      const consumed = await this.consumeBundleUse(next.bundle_id);
      if (!consumed) {
        throw new Error("แพ็กเกจเหมาไม่พร้อมใช้งาน หรือจำนวนครั้งคงเหลือหมดแล้ว");
      }
      next.bundle_id = null;
    }

    db.visits[idx] = next;
    saveDB(db);
    return next;
  }

  async updateVisitStatus(id: number, service_status: CarWashServiceStatus): Promise<ServiceVisit | null> {
    return this.updateVisit(id, { service_status });
  }

  async deleteVisit(id: number): Promise<boolean> {
    const db = loadDB();
    const prev = db.visits.length;
    db.visits = db.visits.filter((x) => x.id !== id);
    saveDB(db);
    return db.visits.length < prev;
  }

  async listBundles(): Promise<WashBundle[]> {
    const db = loadDB();
    return db.bundles.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }

  async createBundle(input: Omit<WashBundle, "id" | "created_at" | "used_uses">): Promise<WashBundle> {
    const db = loadDB();
    const row: WashBundle = {
      ...input,
      slip_photo_url: input.slip_photo_url ?? "",
      id: db.seq.bundle + 1,
      used_uses: 0,
      created_at: new Date().toISOString(),
    };
    db.seq.bundle = row.id;
    db.bundles.push(row);
    saveDB(db);
    return row;
  }

  async updateBundle(id: number, patch: WashBundlePatch): Promise<WashBundle | null> {
    const db = loadDB();
    const idx = db.bundles.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    const cur = db.bundles[idx];
    const nextTotal = patch.total_uses !== undefined ? patch.total_uses : cur.total_uses;
    if (nextTotal < cur.used_uses) return null;
    const next: WashBundle = {
      ...cur,
      ...(patch.customer_name !== undefined && { customer_name: patch.customer_name }),
      ...(patch.customer_phone !== undefined && { customer_phone: patch.customer_phone }),
      ...(patch.plate_number !== undefined && { plate_number: patch.plate_number }),
      ...(patch.package_id !== undefined && { package_id: patch.package_id }),
      ...(patch.package_name !== undefined && { package_name: patch.package_name }),
      ...(patch.paid_amount !== undefined && { paid_amount: patch.paid_amount }),
      ...(patch.total_uses !== undefined && { total_uses: patch.total_uses }),
      ...(patch.is_active !== undefined && { is_active: patch.is_active }),
      ...(patch.slip_photo_url !== undefined && { slip_photo_url: patch.slip_photo_url ?? "" }),
    };
    db.bundles[idx] = next;
    saveDB(db);
    return next;
  }

  async consumeBundleUse(id: number): Promise<WashBundle | null> {
    const db = loadDB();
    const idx = db.bundles.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    const row = db.bundles[idx];
    if (!row.is_active || row.used_uses >= row.total_uses) return null;
    db.bundles[idx] = { ...row, used_uses: row.used_uses + 1 };
    saveDB(db);
    return db.bundles[idx];
  }

  async deleteBundle(id: number): Promise<boolean> {
    const db = loadDB();
    const prev = db.bundles.length;
    db.bundles = db.bundles.filter((x) => x.id !== id);
    saveDB(db);
    return db.bundles.length < prev;
  }

  async listCostCategories(): Promise<CostCategory[]> {
    return [];
  }

  async createCostCategory(_name: string): Promise<CostCategory> {
    throw new Error("หมวดต้นทุนใช้ได้เมื่อเชื่อมต่อเซิร์ฟเวอร์ (ไม่รองรับโหมดจำลองในเครื่อง)");
  }

  async updateCostCategory(_id: number, _patch: { name: string }): Promise<CostCategory | null> {
    throw new Error("หมวดต้นทุนใช้ได้เมื่อเชื่อมต่อเซิร์ฟเวอร์ (ไม่รองรับโหมดจำลองในเครื่อง)");
  }

  async deleteCostCategory(_id: number): Promise<boolean> {
    throw new Error("หมวดต้นทุนใช้ได้เมื่อเชื่อมต่อเซิร์ฟเวอร์ (ไม่รองรับโหมดจำลองในเครื่อง)");
  }

  async listCostEntries(): Promise<CostEntry[]> {
    return [];
  }

  async createCostEntry(_input: CostEntryInput): Promise<CostEntry> {
    throw new Error("รายการต้นทุนใช้ได้เมื่อเชื่อมต่อเซิร์ฟเวอร์ (ไม่รองรับโหมดจำลองในเครื่อง)");
  }

  async updateCostEntry(_id: number, _patch: CostEntryPatch): Promise<CostEntry | null> {
    throw new Error("รายการต้นทุนใช้ได้เมื่อเชื่อมต่อเซิร์ฟเวอร์ (ไม่รองรับโหมดจำลองในเครื่อง)");
  }

  async deleteCostEntry(_id: number): Promise<boolean> {
    throw new Error("รายการต้นทุนใช้ได้เมื่อเชื่อมต่อเซิร์ฟเวอร์ (ไม่รองรับโหมดจำลองในเครื่อง)");
  }
}

export function createCarWashRepository(): CarWashRepository {
  return new LocalStorageCarWashRepository();
}

function errorMessageFromApiBody(data: unknown, res: Response, rawText: string): string {
  const obj =
    data !== null && typeof data === "object" && !Array.isArray(data) ?
      (data as Record<string, unknown>)
    : null;
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

/** แปลง TypeError จาก fetch (เช่น เซิร์ฟเวอร์ไม่รัน) เป็นข้อความที่เข้าใจได้ */
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
        throw new Error(
          "เชื่อมต่อแอปไม่ได้ — ตรวจว่าเซิร์ฟเวอร์รันอยู่ (npm run dev) แล้วรีเฟรชหน้า",
        );
      }
    }
    throw e;
  }
}

class SessionApiCarWashRepository implements CarWashRepository {
  async listPackages(): Promise<ServicePackage[]> {
    const res = await sessionFetch("/api/car-wash/session/packages", { cache: "no-store" });
    const data = await readJson<{ packages: ServicePackage[] }>(res);
    return data.packages;
  }
  async createPackage(input: Omit<ServicePackage, "id">): Promise<ServicePackage> {
    const res = await sessionFetch("/api/car-wash/session/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await readJson<{ package: ServicePackage }>(res)).package;
  }
  async updatePackage(id: number, patch: Partial<Omit<ServicePackage, "id">>): Promise<ServicePackage | null> {
    const res = await sessionFetch(`/api/car-wash/session/packages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.status === 404) return null;
    return (await readJson<{ package: ServicePackage }>(res)).package;
  }
  async deletePackage(id: number): Promise<boolean> {
    const res = await sessionFetch(`/api/car-wash/session/packages/${id}`, { method: "DELETE" });
    return (await readJson<{ ok: boolean }>(res)).ok;
  }

  async listComplaints(): Promise<Complaint[]> {
    const res = await sessionFetch("/api/car-wash/session/complaints", { cache: "no-store" });
    return (await readJson<{ complaints: Complaint[] }>(res)).complaints;
  }
  async createComplaint(input: Omit<Complaint, "id" | "created_at">): Promise<Complaint> {
    const res = await sessionFetch("/api/car-wash/session/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await readJson<{ complaint: Complaint }>(res)).complaint;
  }
  async updateComplaint(id: number, patch: Partial<Omit<Complaint, "id" | "created_at">>): Promise<Complaint | null> {
    const res = await sessionFetch(`/api/car-wash/session/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.status === 404) return null;
    return (await readJson<{ complaint: Complaint }>(res)).complaint;
  }
  async deleteComplaint(id: number): Promise<boolean> {
    const res = await fetch(`/api/car-wash/session/complaints/${id}`, { method: "DELETE" });
    return (await readJson<{ ok: boolean }>(res)).ok;
  }

  async listVisits(): Promise<ServiceVisit[]> {
    const res = await sessionFetch("/api/car-wash/session/visits", { cache: "no-store" });
    return (await readJson<{ visits: ServiceVisit[] }>(res)).visits;
  }
  async createVisit(
    input: Omit<ServiceVisit, "id" | "visit_at" | "service_status"> & { visit_at?: string; service_status?: CarWashServiceStatus },
  ): Promise<ServiceVisit> {
    const res = await sessionFetch("/api/car-wash/session/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await readJson<{ visit: ServiceVisit }>(res)).visit;
  }
  async updateVisit(id: number, patch: ServiceVisitPatch): Promise<ServiceVisit | null> {
    const body = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined),
    ) as Record<string, unknown>;
    const res = await sessionFetch(`/api/car-wash/session/visits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 404) return null;
    return (await readJson<{ visit: ServiceVisit }>(res)).visit;
  }

  async updateVisitStatus(id: number, service_status: CarWashServiceStatus): Promise<ServiceVisit | null> {
    return this.updateVisit(id, { service_status });
  }
  async deleteVisit(id: number): Promise<boolean> {
    const res = await fetch(`/api/car-wash/session/visits/${id}`, { method: "DELETE" });
    return (await readJson<{ ok: boolean }>(res)).ok;
  }

  async listBundles(): Promise<WashBundle[]> {
    const res = await sessionFetch("/api/car-wash/session/bundles", { cache: "no-store" });
    return (await readJson<{ bundles: WashBundle[] }>(res)).bundles;
  }
  async createBundle(input: Omit<WashBundle, "id" | "created_at" | "used_uses">): Promise<WashBundle> {
    const res = await fetch("/api/car-wash/session/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await readJson<{ bundle: WashBundle }>(res)).bundle;
  }
  async updateBundle(id: number, patch: WashBundlePatch): Promise<WashBundle | null> {
    const body = Object.fromEntries(
      Object.entries(patch).filter(([, v]) => v !== undefined),
    ) as Record<string, unknown>;
    const res = await sessionFetch(`/api/car-wash/session/bundles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 404) return null;
    return (await readJson<{ bundle: WashBundle }>(res)).bundle;
  }
  async consumeBundleUse(id: number): Promise<WashBundle | null> {
    const res = await sessionFetch(`/api/car-wash/session/bundles/${id}/consume`, { method: "POST" });
    return (await readJson<{ bundle: WashBundle | null }>(res)).bundle;
  }
  async deleteBundle(id: number): Promise<boolean> {
    const res = await fetch(`/api/car-wash/session/bundles/${id}`, { method: "DELETE" });
    return (await readJson<{ ok: boolean }>(res)).ok;
  }

  async listCostCategories(): Promise<CostCategory[]> {
    const res = await sessionFetch("/api/car-wash/session/cost-categories", { cache: "no-store" });
    return (await readJson<{ categories: CostCategory[] }>(res)).categories;
  }

  async createCostCategory(name: string): Promise<CostCategory> {
    const res = await sessionFetch("/api/car-wash/session/cost-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    return (await readJson<{ category: CostCategory }>(res)).category;
  }

  async updateCostCategory(id: number, patch: { name: string }): Promise<CostCategory | null> {
    const res = await sessionFetch(`/api/car-wash/session/cost-categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: patch.name.trim() }),
    });
    if (res.status === 404) return null;
    return (await readJson<{ category: CostCategory }>(res)).category;
  }

  async deleteCostCategory(id: number): Promise<boolean> {
    const res = await sessionFetch(`/api/car-wash/session/cost-categories/${id}`, { method: "DELETE" });
    return (await readJson<{ ok: boolean }>(res)).ok;
  }

  async listCostEntries(): Promise<CostEntry[]> {
    const res = await sessionFetch("/api/car-wash/session/cost-entries", { cache: "no-store" });
    return (await readJson<{ entries: CostEntry[] }>(res)).entries;
  }

  async createCostEntry(input: CostEntryInput): Promise<CostEntry> {
    const res = await sessionFetch("/api/car-wash/session/cost-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: input.category_id,
        spent_at: input.spent_at,
        amount: input.amount,
        item_label: input.item_label.trim(),
        note: input.note ?? "",
        ...(input.slip_photo_url != null && input.slip_photo_url.trim() !== "" ?
          { slip_photo_url: input.slip_photo_url.trim() }
        : {}),
      }),
    });
    return (await readJson<{ entry: CostEntry }>(res)).entry;
  }

  async updateCostEntry(id: number, patch: CostEntryPatch): Promise<CostEntry | null> {
    const body = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as Record<
      string,
      unknown
    >;
    const res = await sessionFetch(`/api/car-wash/session/cost-entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 404) return null;
    return (await readJson<{ entry: CostEntry }>(res)).entry;
  }

  async deleteCostEntry(id: number): Promise<boolean> {
    const res = await sessionFetch(`/api/car-wash/session/cost-entries/${id}`, { method: "DELETE" });
    return (await readJson<{ ok: boolean }>(res)).ok;
  }
}

export function createCarWashSessionApiRepository(): CarWashRepository {
  return new SessionApiCarWashRepository();
}

export async function uploadCarWashSessionImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await sessionFetch("/api/car-wash/session/images/upload", {
    method: "POST",
    body: form,
    credentials: "include",
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; imageUrl?: string };
  if (!res.ok) {
    const msg =
      typeof data.error === "string" && data.error.trim() ? data.error : "อัปโหลดรูปไม่สำเร็จ";
    throw new Error(msg);
  }
  const url = data.imageUrl?.trim();
  if (!url) throw new Error("อัปโหลดรูปไม่สำเร็จ");
  return url;
}
