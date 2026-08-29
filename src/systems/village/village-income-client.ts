import { prepareImageFileForUpload } from "@/components/app-templates";

export type VillageIncomeCategory = {
  id: string;
  name: string;
  kind: "COMMON_FEE" | "CUSTOM";
  isBuiltin: boolean;
  sortOrder: number;
  createdAt: string;
};

export type VillageIncomeEntry = {
  id: string;
  label: string;
  amountBaht: number;
  earnedAt: string;
  note: string | null;
  paymentSlipUrl: string | null;
  categoryId: string;
  categoryName: string;
  categoryKind: "COMMON_FEE" | "CUSTOM";
};

export type VillageFeePaymentRow = {
  id: number;
  house_id: number;
  house_no: string;
  owner_name: string | null;
  year_month: string;
  amount_due: number;
  amount_paid: number;
  status: string;
  note: string | null;
  paid_at: string | null;
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

export async function fetchVillageIncomeCategories(): Promise<VillageIncomeCategory[]> {
  const res = await fetch("/api/village/income-categories", { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { categories?: VillageIncomeCategory[] };
  return d.categories ?? [];
}

export async function createVillageIncomeCategory(name: string): Promise<VillageIncomeCategory> {
  const res = await fetch("/api/village/income-categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const j = (await res.json()) as { category?: VillageIncomeCategory };
  if (!j.category) throw new Error("รูปแบบตอบกลับไม่ถูกต้อง");
  return j.category;
}

export async function updateVillageIncomeCategory(id: string, name: string): Promise<VillageIncomeCategory> {
  const res = await fetch(`/api/village/income-categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const j = (await res.json()) as { category?: VillageIncomeCategory };
  if (!j.category) throw new Error("รูปแบบตอบกลับไม่ถูกต้อง");
  return j.category;
}

export async function deleteVillageIncomeCategory(id: string): Promise<void> {
  const res = await fetch(`/api/village/income-categories/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function fetchVillageIncomeEntries(from?: string, to?: string): Promise<VillageIncomeEntry[]> {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const q = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetch(`/api/village/incomes${q}`, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { incomes?: VillageIncomeEntry[] };
  return d.incomes ?? [];
}

export async function createVillageIncomeEntry(input: {
  label: string;
  amountBaht: number;
  categoryId: string;
  note?: string | null;
  paymentSlipUrl?: string | null;
}): Promise<VillageIncomeEntry> {
  const res = await fetch("/api/village/incomes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const j = (await res.json()) as { income?: VillageIncomeEntry };
  if (!j.income) throw new Error("รูปแบบตอบกลับไม่ถูกต้อง");
  return j.income;
}

export async function updateVillageIncomeEntry(
  id: string,
  patch: {
    label?: string;
    amountBaht?: number;
    categoryId?: string;
    note?: string | null;
    paymentSlipUrl?: string | null;
  },
): Promise<VillageIncomeEntry> {
  const res = await fetch(`/api/village/incomes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const j = (await res.json()) as { income?: VillageIncomeEntry };
  if (!j.income) throw new Error("รูปแบบตอบกลับไม่ถูกต้อง");
  return j.income;
}

export async function deleteVillageIncomeEntry(id: string): Promise<void> {
  const res = await fetch(`/api/village/incomes/${id}`, { method: "DELETE", credentials: "include" });
  if (!res.ok) throw new Error(await parseErr(res));
}

export async function fetchVillageFeePaymentHistory(): Promise<VillageFeePaymentRow[]> {
  const res = await fetch("/api/village/fee-payments/history", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await parseErr(res));
  const d = (await res.json()) as { items?: VillageFeePaymentRow[] };
  return d.items ?? [];
}

export async function uploadVillageIncomeSlip(file: File): Promise<string> {
  const prepared = await prepareImageFileForUpload(file);
  const form = new FormData();
  form.append("file", prepared);
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
