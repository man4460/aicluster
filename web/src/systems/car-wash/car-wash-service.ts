"use client";

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
};

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
  created_at: string;
};

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
  createVisit(input: Omit<ServiceVisit, "id" | "visit_at"> & { visit_at?: string }): Promise<ServiceVisit>;
  deleteVisit(id: number): Promise<boolean>;

  listBundles(): Promise<WashBundle[]>;
  createBundle(input: Omit<WashBundle, "id" | "created_at" | "used_uses">): Promise<WashBundle>;
  consumeBundleUse(id: number): Promise<WashBundle | null>;
  deleteBundle(id: number): Promise<boolean>;
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

  async createVisit(input: Omit<ServiceVisit, "id" | "visit_at"> & { visit_at?: string }): Promise<ServiceVisit> {
    const db = loadDB();
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
    };
    db.seq.visit = row.id;
    db.visits.push(row);
    saveDB(db);
    return row;
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
      id: db.seq.bundle + 1,
      used_uses: 0,
      created_at: new Date().toISOString(),
    };
    db.seq.bundle = row.id;
    db.bundles.push(row);
    saveDB(db);
    return row;
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
}

export function createCarWashRepository(): CarWashRepository {
  return new LocalStorageCarWashRepository();
}

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    const msg = typeof (data as { error?: unknown }).error === "string" ? (data as { error: string }).error : "Request failed";
    throw new Error(msg);
  }
  return data;
}

class SessionApiCarWashRepository implements CarWashRepository {
  async listPackages(): Promise<ServicePackage[]> {
    const res = await fetch("/api/car-wash/session/packages", { cache: "no-store" });
    const data = await readJson<{ packages: ServicePackage[] }>(res);
    return data.packages;
  }
  async createPackage(input: Omit<ServicePackage, "id">): Promise<ServicePackage> {
    const res = await fetch("/api/car-wash/session/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await readJson<{ package: ServicePackage }>(res)).package;
  }
  async updatePackage(id: number, patch: Partial<Omit<ServicePackage, "id">>): Promise<ServicePackage | null> {
    const res = await fetch(`/api/car-wash/session/packages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.status === 404) return null;
    return (await readJson<{ package: ServicePackage }>(res)).package;
  }
  async deletePackage(id: number): Promise<boolean> {
    const res = await fetch(`/api/car-wash/session/packages/${id}`, { method: "DELETE" });
    return (await readJson<{ ok: boolean }>(res)).ok;
  }

  async listComplaints(): Promise<Complaint[]> {
    const res = await fetch("/api/car-wash/session/complaints", { cache: "no-store" });
    return (await readJson<{ complaints: Complaint[] }>(res)).complaints;
  }
  async createComplaint(input: Omit<Complaint, "id" | "created_at">): Promise<Complaint> {
    const res = await fetch("/api/car-wash/session/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await readJson<{ complaint: Complaint }>(res)).complaint;
  }
  async updateComplaint(id: number, patch: Partial<Omit<Complaint, "id" | "created_at">>): Promise<Complaint | null> {
    const res = await fetch(`/api/car-wash/session/complaints/${id}`, {
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
    const res = await fetch("/api/car-wash/session/visits", { cache: "no-store" });
    return (await readJson<{ visits: ServiceVisit[] }>(res)).visits;
  }
  async createVisit(input: Omit<ServiceVisit, "id" | "visit_at"> & { visit_at?: string }): Promise<ServiceVisit> {
    const res = await fetch("/api/car-wash/session/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await readJson<{ visit: ServiceVisit }>(res)).visit;
  }
  async deleteVisit(id: number): Promise<boolean> {
    const res = await fetch(`/api/car-wash/session/visits/${id}`, { method: "DELETE" });
    return (await readJson<{ ok: boolean }>(res)).ok;
  }

  async listBundles(): Promise<WashBundle[]> {
    const res = await fetch("/api/car-wash/session/bundles", { cache: "no-store" });
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
  async consumeBundleUse(id: number): Promise<WashBundle | null> {
    const res = await fetch(`/api/car-wash/session/bundles/${id}/consume`, { method: "POST" });
    return (await readJson<{ bundle: WashBundle | null }>(res)).bundle;
  }
  async deleteBundle(id: number): Promise<boolean> {
    const res = await fetch(`/api/car-wash/session/bundles/${id}`, { method: "DELETE" });
    return (await readJson<{ ok: boolean }>(res)).ok;
  }
}

export function createCarWashSessionApiRepository(): CarWashRepository {
  return new SessionApiCarWashRepository();
}
