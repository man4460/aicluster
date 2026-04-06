export type BarberCostCategory = {
  id: number;
  name: string;
  created_at: string;
};

export type BarberCostEntry = {
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

export async function fetchBarberCostCategories(): Promise<BarberCostCategory[]> {
  const res = await fetch("/api/barber/cost-categories", { credentials: "include" });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { categories?: BarberCostCategory[] };
  return d.categories ?? [];
}

export async function createBarberCostCategory(name: string): Promise<BarberCostCategory> {
  const res = await fetch("/api/barber/cost-categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { category?: BarberCostCategory };
  if (!d.category) throw new Error("รูปแบบตอบกลับไม่ถูกต้อง");
  return d.category;
}

export async function updateBarberCostCategory(id: number, name: string): Promise<BarberCostCategory> {
  const res = await fetch(`/api/barber/cost-categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { category?: BarberCostCategory };
  if (!d.category) throw new Error("รูปแบบตอบกลับไม่ถูกต้อง");
  return d.category;
}

export async function deleteBarberCostCategory(id: number): Promise<void> {
  const res = await fetch(`/api/barber/cost-categories/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function fetchBarberCostEntries(): Promise<BarberCostEntry[]> {
  const res = await fetch("/api/barber/cost-entries", { credentials: "include" });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { entries?: BarberCostEntry[] };
  return d.entries ?? [];
}

export type BarberCostEntryInput = {
  category_id: number;
  spent_at: string;
  amount: number;
  item_label: string;
  note: string;
  slip_photo_url?: string;
};

export async function createBarberCostEntry(input: BarberCostEntryInput): Promise<BarberCostEntry> {
  const res = await fetch("/api/barber/cost-entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { entry?: BarberCostEntry };
  if (!d.entry) throw new Error("รูปแบบตอบกลับไม่ถูกต้อง");
  return d.entry;
}

export type BarberCostEntryPatch = Partial<{
  category_id: number;
  spent_at: string;
  amount: number;
  item_label: string;
  note: string;
  slip_photo_url: string;
}>;

export async function updateBarberCostEntry(id: number, patch: BarberCostEntryPatch): Promise<BarberCostEntry> {
  const res = await fetch(`/api/barber/cost-entries/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { entry?: BarberCostEntry };
  if (!d.entry) throw new Error("รูปแบบตอบกลับไม่ถูกต้อง");
  return d.entry;
}

export async function deleteBarberCostEntry(id: number): Promise<void> {
  const res = await fetch(`/api/barber/cost-entries/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function uploadBarberCostSlip(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/barber/cash-receipt/upload", {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { imageUrl?: string; error?: string };
  if (!d.imageUrl?.trim()) throw new Error(d.error ?? "อัปโหลดรูปไม่สำเร็จ");
  return d.imageUrl.trim();
}
