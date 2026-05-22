export type MassageCostCategory = {
  id: number;
  name: string;
  created_at: string;
};

export type MassageCostEntry = {
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

export async function fetchMassageCostCategories(): Promise<MassageCostCategory[]> {
  const res = await fetch("/api/massage/cost-categories", { credentials: "include" });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { categories?: MassageCostCategory[] };
  return d.categories ?? [];
}

export async function createMassageCostCategory(name: string): Promise<MassageCostCategory> {
  const res = await fetch("/api/massage/cost-categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { category?: MassageCostCategory };
  if (!d.category) throw new Error("รูปแบบตอบกลับไม่ถูกต้อง");
  return d.category;
}

export async function updateMassageCostCategory(id: number, name: string): Promise<MassageCostCategory> {
  const res = await fetch(`/api/massage/cost-categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { category?: MassageCostCategory };
  if (!d.category) throw new Error("รูปแบบตอบกลับไม่ถูกต้อง");
  return d.category;
}

export async function deleteMassageCostCategory(id: number): Promise<void> {
  const res = await fetch(`/api/massage/cost-categories/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function fetchMassageCostEntries(): Promise<MassageCostEntry[]> {
  const res = await fetch("/api/massage/cost-entries", { credentials: "include" });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { entries?: MassageCostEntry[] };
  return d.entries ?? [];
}

export type MassageCostEntryInput = {
  category_id: number;
  spent_at: string;
  amount: number;
  item_label: string;
  note: string;
  slip_photo_url?: string;
};

export async function createMassageCostEntry(input: MassageCostEntryInput): Promise<MassageCostEntry> {
  const res = await fetch("/api/massage/cost-entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { entry?: MassageCostEntry };
  if (!d.entry) throw new Error("รูปแบบตอบกลับไม่ถูกต้อง");
  return d.entry;
}

export type MassageCostEntryPatch = Partial<{
  category_id: number;
  spent_at: string;
  amount: number;
  item_label: string;
  note: string;
  slip_photo_url: string;
}>;

export async function updateMassageCostEntry(id: number, patch: MassageCostEntryPatch): Promise<MassageCostEntry> {
  const res = await fetch(`/api/massage/cost-entries/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { entry?: MassageCostEntry };
  if (!d.entry) throw new Error("รูปแบบตอบกลับไม่ถูกต้อง");
  return d.entry;
}

export async function deleteMassageCostEntry(id: number): Promise<void> {
  const res = await fetch(`/api/massage/cost-entries/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function uploadMassageCostSlip(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/massage/cash-receipt/upload", {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { imageUrl?: string; error?: string };
  if (!d.imageUrl?.trim()) throw new Error(d.error ?? "อัปโหลดรูปไม่สำเร็จ");
  return d.imageUrl.trim();
}
