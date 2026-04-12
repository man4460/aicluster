import type { ModuleCostPanelOps } from "@/systems/barber/module-cost-panel-ops";
import type {
  BarberCostCategory,
  BarberCostEntry,
  BarberCostEntryInput,
  BarberCostEntryPatch,
} from "@/systems/barber/barber-cost-client";

async function parseErr(res: Response): Promise<string> {
  const status = res.status;
  const text = await res.text();
  let msg = "";
  try {
    const j = JSON.parse(text) as { error?: string; message?: string };
    msg = (j.error ?? j.message ?? "").trim();
  } catch {
    const t = text.trim();
    if (t && !t.startsWith("<") && !t.startsWith("<!")) msg = t.slice(0, 400);
  }
  if (status === 401 && (!msg || msg === "Unauthorized")) return "กรุณาเข้าสู่ระบบใหม่";
  if (status === 403 && !msg) return "ไม่มีสิทธิ์ใช้งาน";
  if (!msg) {
    return `เซิร์ฟเวอร์ตอบกลับไม่สามารถอ่านได้ (รหัส ${status}) — ลองรีเฟรชหรือตรวจสอบการเชื่อมต่อ`;
  }
  return msg;
}

export async function fetchVillageCostCategories(): Promise<BarberCostCategory[]> {
  const res = await fetch("/api/village/cost-categories", { credentials: "include" });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { categories?: BarberCostCategory[] };
  return d.categories ?? [];
}

export async function createVillageCostCategory(name: string): Promise<BarberCostCategory> {
  const res = await fetch("/api/village/cost-categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const j = (await res.json()) as { category?: BarberCostCategory };
  if (!j.category) throw new Error("รูปแบบตอบกลับไม่ถูกต้อง");
  return j.category;
}

export async function updateVillageCostCategory(id: number, name: string): Promise<BarberCostCategory> {
  const res = await fetch(`/api/village/cost-categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const j = (await res.json()) as { category?: BarberCostCategory };
  if (!j.category) throw new Error("รูปแบบตอบกลับไม่ถูกต้อง");
  return j.category;
}

export async function deleteVillageCostCategory(id: number): Promise<void> {
  const res = await fetch(`/api/village/cost-categories/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function fetchVillageCostEntries(): Promise<BarberCostEntry[]> {
  const res = await fetch("/api/village/cost-entries", { credentials: "include" });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { entries?: BarberCostEntry[] };
  return d.entries ?? [];
}

export async function createVillageCostEntry(input: BarberCostEntryInput): Promise<BarberCostEntry> {
  const res = await fetch("/api/village/cost-entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const j = (await res.json()) as { entry?: BarberCostEntry };
  if (!j.entry) throw new Error("รูปแบบตอบกลับไม่ถูกต้อง");
  return j.entry;
}

export async function updateVillageCostEntry(id: number, patch: BarberCostEntryPatch): Promise<BarberCostEntry> {
  const res = await fetch(`/api/village/cost-entries/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const j = (await res.json()) as { entry?: BarberCostEntry };
  if (!j.entry) throw new Error("รูปแบบตอบกลับไม่ถูกต้อง");
  return j.entry;
}

export async function deleteVillageCostEntry(id: number): Promise<void> {
  const res = await fetch(`/api/village/cost-entries/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function uploadVillageCostSlip(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/village/cost-slip/upload", {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { imageUrl?: string; error?: string };
  if (!d.imageUrl?.trim()) throw new Error(d.error ?? "อัปโหลดรูปไม่สำเร็จ");
  return d.imageUrl.trim();
}

export const villageCostPanelOps: ModuleCostPanelOps = {
  createCategory: createVillageCostCategory,
  updateCategory: updateVillageCostCategory,
  deleteCategory: deleteVillageCostCategory,
  createEntry: createVillageCostEntry,
  updateEntry: updateVillageCostEntry,
  deleteEntry: deleteVillageCostEntry,
  uploadSlip: uploadVillageCostSlip,
};
