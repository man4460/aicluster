/**
 * Home-finance — persistence ฝั่ง browser
 *
 * ตอนนี้เก็บแบบ device-wide (ไม่ scope ตาม user) เพราะ component ฝั่ง client
 * ไม่มี userId อยู่ในมือโดยตรง — เครื่องใช้งานปกติเป็น 1 user ต่อ 1 browser
 * ถ้าจะ scope ตาม user ในอนาคต ส่ง `userKey` เพิ่มได้
 */

export type HomeFinanceFilterPrefs = {
  /** ymd */
  from?: string;
  /** ymd */
  to?: string;
  /** "" | INCOME | EXPENSE */
  typeFilter?: string;
  /** category key */
  categoryFilter?: string;
  /** keyword */
  q?: string;
  /** หน้าประวัติ — แสดงกราฟหรือไม่ */
  historyChartsOpen?: boolean;
};

export type HomeFinanceBudgetItem = {
  label: string;
  amount: number;
};

export const HOME_FINANCE_FILTER_STORAGE_KEY = "mawell:hf:filter:v1";
export const HOME_FINANCE_BUDGET_STORAGE_KEY = "mawell:hf:budgets:v1";

export const DEFAULT_HOME_FINANCE_BUDGETS: HomeFinanceBudgetItem[] = [
  { label: "ค่าไฟฟ้า", amount: 3500 },
  { label: "ค่าน้ำมันรถ", amount: 5000 },
  { label: "ค่าอาหาร", amount: 7000 },
];

/** อ่าน prefs จาก localStorage; SSR-safe (คืน {} ถ้าไม่มี window) */
export function loadHomeFinanceFilterPrefs(): HomeFinanceFilterPrefs {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(HOME_FINANCE_FILTER_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const p = parsed as Record<string, unknown>;
    const out: HomeFinanceFilterPrefs = {};
    if (typeof p.from === "string") out.from = p.from;
    if (typeof p.to === "string") out.to = p.to;
    if (typeof p.typeFilter === "string") out.typeFilter = p.typeFilter;
    if (typeof p.categoryFilter === "string") out.categoryFilter = p.categoryFilter;
    if (typeof p.q === "string") out.q = p.q;
    if (typeof p.historyChartsOpen === "boolean") {
      out.historyChartsOpen = p.historyChartsOpen;
    }
    return out;
  } catch {
    return {};
  }
}

export function saveHomeFinanceFilterPrefs(prefs: HomeFinanceFilterPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HOME_FINANCE_FILTER_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota / private mode */
  }
}

/** อ่าน budgets; คืน default ถ้ายังไม่มีหรืออ่านไม่ได้ */
export function loadHomeFinanceBudgets(): HomeFinanceBudgetItem[] {
  if (typeof window === "undefined") return DEFAULT_HOME_FINANCE_BUDGETS;
  try {
    const raw = window.localStorage.getItem(HOME_FINANCE_BUDGET_STORAGE_KEY);
    if (!raw) return DEFAULT_HOME_FINANCE_BUDGETS;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_HOME_FINANCE_BUDGETS;
    const out: HomeFinanceBudgetItem[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const label = typeof o.label === "string" ? o.label.trim() : "";
      const amount = typeof o.amount === "number" && Number.isFinite(o.amount) ? o.amount : NaN;
      if (!label || !Number.isFinite(amount) || amount < 0) continue;
      out.push({ label, amount });
    }
    return out.length > 0 ? out : DEFAULT_HOME_FINANCE_BUDGETS;
  } catch {
    return DEFAULT_HOME_FINANCE_BUDGETS;
  }
}

export function saveHomeFinanceBudgets(list: HomeFinanceBudgetItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HOME_FINANCE_BUDGET_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
