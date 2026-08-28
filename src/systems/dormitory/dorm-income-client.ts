import { prepareImageFileForUpload } from "@/components/app-templates";

export type DormIncomeCategory = {
  id: string;
  name: string;
  kind: "TENANT_RENT" | "CUSTOM";
  isBuiltin: boolean;
  sortOrder: number;
  createdAt: string;
};

export type DormIncomeEntry = {
  id: string;
  label: string;
  amountBaht: number;
  earnedAt: string;
  note: string | null;
  paymentSlipUrl: string | null;
  categoryId: string;
  categoryName: string;
  categoryKind: "TENANT_RENT" | "CUSTOM";
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

export async function fetchDormIncomeCategories(): Promise<DormIncomeCategory[]> {
  const res = await fetch("/api/dorm/income-categories", { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { categories?: DormIncomeCategory[] };
  return d.categories ?? [];
}

export async function createDormIncomeCategory(name: string): Promise<DormIncomeCategory> {
  const res = await fetch("/api/dorm/income-categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const j = (await res.json()) as { category?: DormIncomeCategory };
  if (!j.category) throw new Error("รูปแบบตอบกลับไม่ถูกต้อง");
  return j.category;
}

export async function updateDormIncomeCategory(id: string, name: string): Promise<DormIncomeCategory> {
  const res = await fetch(`/api/dorm/income-categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const j = (await res.json()) as { category?: DormIncomeCategory };
  if (!j.category) throw new Error("รูปแบบตอบกลับไม่ถูกต้อง");
  return j.category;
}

export async function deleteDormIncomeCategory(id: string): Promise<void> {
  const res = await fetch(`/api/dorm/income-categories/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function fetchDormIncomeEntries(from?: string, to?: string): Promise<DormIncomeEntry[]> {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const q = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetch(`/api/dorm/incomes${q}`, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { incomes?: DormIncomeEntry[] };
  return d.incomes ?? [];
}

export async function createDormIncomeEntry(input: {
  label: string;
  amountBaht: number;
  categoryId: string;
  note?: string | null;
  paymentSlipUrl?: string | null;
}): Promise<DormIncomeEntry> {
  const res = await fetch("/api/dorm/incomes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const j = (await res.json()) as { income?: DormIncomeEntry };
  if (!j.income) throw new Error("รูปแบบตอบกลับไม่ถูกต้อง");
  return j.income;
}

export async function updateDormIncomeEntry(
  id: string,
  patch: {
    label?: string;
    amountBaht?: number;
    categoryId?: string;
    note?: string | null;
    paymentSlipUrl?: string | null;
  },
): Promise<DormIncomeEntry> {
  const res = await fetch(`/api/dorm/incomes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const j = (await res.json()) as { income?: DormIncomeEntry };
  if (!j.income) throw new Error("รูปแบบตอบกลับไม่ถูกต้อง");
  return j.income;
}

export async function deleteDormIncomeEntry(id: string): Promise<void> {
  const res = await fetch(`/api/dorm/incomes/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function uploadDormIncomeSlip(file: File): Promise<string> {
  const prepared = await prepareImageFileForUpload(file);
  const form = new FormData();
  form.append("file", prepared);
  const res = await fetch("/api/dorm/cost-slip/upload", {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { imageUrl?: string; error?: string };
  if (!d.imageUrl?.trim()) throw new Error(d.error ?? "อัปโหลดรูปไม่สำเร็จ");
  return d.imageUrl.trim();
}
