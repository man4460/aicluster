"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Entry = {
  id: number;
  entryDate: string;
  type: "INCOME" | "EXPENSE";
  categoryKey: string;
  categoryLabel: string;
  title: string;
  amount: number;
  dueDate: string | null;
  billNumber: string | null;
  vehicleType: string | null;
  serviceCenter: string | null;
  paymentMethod: string | null;
  note: string | null;
};

type Category = { id: number; name: string; isActive: boolean; sortOrder: number };
type Utility = {
  id: number;
  utilityType: "ELECTRIC" | "WATER";
  label: string;
  accountNumber: string | null;
  dueDate: string | null;
  isActive: boolean;
};
type Vehicle = {
  id: number;
  vehicleType: "CAR" | "MOTORCYCLE";
  label: string;
  plateNumber: string | null;
  taxDueDate: string | null;
  serviceDueDate: string | null;
  insuranceDueDate: string | null;
  isActive: boolean;
};
type Reminder = {
  id: number;
  title: string;
  dueDate: string;
  note: string | null;
  isDone: boolean;
};

const CATEGORIES = [
  { key: "UTILITIES_ELECTRIC", label: "ค่าไฟฟ้า" },
  { key: "UTILITIES_WATER", label: "ค่าน้ำประปา" },
  { key: "VEHICLE_CAR", label: "รถยนต์" },
  { key: "VEHICLE_MOTORCYCLE", label: "รถจักรยานยนต์" },
  { key: "VEHICLE_SERVICE", label: "ซ่อม/เข้าศูนย์รถ" },
  { key: "GENERAL_FOOD", label: "ค่าอาหาร" },
  { key: "GENERAL_HOME_REPAIR", label: "ค่าซ่อมบ้าน" },
  { key: "GENERAL_SHOPPING", label: "ของใช้ในบ้าน" },
  { key: "GENERAL_HEALTH", label: "สุขภาพ/ยา" },
  { key: "GENERAL_EDUCATION", label: "การศึกษา" },
  { key: "GENERAL_TRAVEL", label: "เดินทาง" },
  { key: "GENERAL_INCOME", label: "รายรับทั่วไป" },
  { key: "OTHER", label: "อื่นๆ" },
] as const;

function todayKey() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function monthStartKey() {
  const now = new Date();
  const y = now.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }).slice(0, 4);
  const m = now.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }).slice(5, 7);
  return `${y}-${m}-01`;
}

const inputClz =
  "min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0000BF]/40";

export function HomeFinanceClient() {
  const [tab, setTab] = useState<"entries" | "categories" | "utilities" | "vehicles" | "reminders">("entries");
  const [from, setFrom] = useState(monthStartKey);
  const [to, setTo] = useState(todayKey);
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [q, setQ] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState({ count: 0, income: 0, expense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleCounts, setVehicleCounts] = useState({ cars: 0, motorcycles: 0 });
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const [entryDate, setEntryDate] = useState(todayKey);
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [categoryKey, setCategoryKey] = useState<string>("UTILITIES_ELECTRIC");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [serviceCenter, setServiceCenter] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editForm, setEditForm] = useState({
    entryDate: todayKey(),
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    categoryKey: "UTILITIES_ELECTRIC",
    title: "",
    amount: "",
    note: "",
  });

  const [customCategoryName, setCustomCategoryName] = useState("");
  const [utilityForm, setUtilityForm] = useState({
    utilityType: "ELECTRIC" as "ELECTRIC" | "WATER",
    label: "",
    accountNumber: "",
    dueDate: "",
  });
  const [editingUtilityId, setEditingUtilityId] = useState<number | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    vehicleType: "CAR" as "CAR" | "MOTORCYCLE",
    label: "",
    plateNumber: "",
    taxDueDate: "",
    serviceDueDate: "",
    insuranceDueDate: "",
  });
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [reminderForm, setReminderForm] = useState({
    title: "",
    dueDate: todayKey(),
    note: "",
  });

  const categoryOptions = useMemo(
    () => [
      ...CATEGORIES.map((c) => ({ key: c.key, label: c.label })),
      ...categories.filter((c) => c.isActive).map((c) => ({ key: `CUSTOM_${c.id}`, label: c.name })),
    ],
    [categories],
  );
  const showVehicleFields = categoryKey.startsWith("VEHICLE_");

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    const sp = new URLSearchParams({ from, to });
    if (typeFilter) sp.set("type", typeFilter);
    if (categoryFilter) sp.set("category", categoryFilter);
    if (q.trim()) sp.set("q", q.trim());
    const res = await fetch(`/api/home-finance/entries?${sp}`);
    const j = (await res.json().catch(() => ({}))) as {
      error?: string;
      entries?: Entry[];
      summary?: { count: number; income: number; expense: number; balance: number };
    };
    if (!res.ok) {
      setError(j.error ?? "โหลดไม่สำเร็จ");
      setEntries([]);
      setSummary({ count: 0, income: 0, expense: 0, balance: 0 });
      setLoading(false);
      return;
    }
    setEntries(j.entries ?? []);
    setSummary(j.summary ?? { count: 0, income: 0, expense: 0, balance: 0 });
    setLoading(false);
  }, [from, to, typeFilter, categoryFilter, q]);

  const loadMeta = useCallback(async () => {
    const [cRes, uRes, vRes, rRes] = await Promise.all([
      fetch("/api/home-finance/categories"),
      fetch("/api/home-finance/utilities"),
      fetch("/api/home-finance/vehicles"),
      fetch("/api/home-finance/reminders"),
    ]);
    const cJ = (await cRes.json().catch(() => ({}))) as { categories?: Category[] };
    const uJ = (await uRes.json().catch(() => ({}))) as { items?: Utility[] };
    const vJ = (await vRes.json().catch(() => ({}))) as { items?: Vehicle[]; counts?: { cars: number; motorcycles: number } };
    const rJ = (await rRes.json().catch(() => ({}))) as { items?: Reminder[] };
    if (cRes.ok) setCategories(cJ.categories ?? []);
    if (uRes.ok) setUtilities(uJ.items ?? []);
    if (vRes.ok) {
      setVehicles(vJ.items ?? []);
      setVehicleCounts(vJ.counts ?? { cars: 0, motorcycles: 0 });
    }
    if (rRes.ok) setReminders(rJ.items ?? []);
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);
  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const n = Number(amount);
      if (!Number.isFinite(n) || n <= 0) {
        setError("จำนวนเงินต้องมากกว่า 0");
        return;
      }
      const res = await fetch("/api/home-finance/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryDate,
          type,
          categoryKey,
          categoryLabel: categoryOptions.find((c) => c.key === categoryKey)?.label ?? categoryKey,
          title: title.trim(),
          amount: n,
          dueDate: dueDate || null,
          billNumber: billNumber || null,
          vehicleType: showVehicleFields ? vehicleType || null : null,
          serviceCenter: showVehicleFields ? serviceCenter || null : null,
          paymentMethod: paymentMethod || null,
          note: note || null,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(j.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setTitle("");
      setAmount("");
      setDueDate("");
      setBillNumber("");
      setVehicleType("");
      setServiceCenter("");
      setPaymentMethod("");
      setNote("");
      setEntryModalOpen(false);
      await loadEntries();
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(id: number) {
    if (!confirm("ลบรายการนี้?")) return;
    await fetch(`/api/home-finance/entries/${id}`, { method: "DELETE" });
    await loadEntries();
  }

  function openEdit(entry: Entry) {
    setError(null);
    setEditingEntry(entry);
    setEditForm({
      entryDate: entry.entryDate,
      type: entry.type,
      categoryKey: entry.categoryKey,
      title: entry.title,
      amount: String(entry.amount),
      note: entry.note ?? "",
    });
  }

  async function onSubmitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEntry) return;
    setSaving(true);
    setError(null);
    try {
      const n = Number(editForm.amount);
      if (!Number.isFinite(n) || n <= 0) {
        setError("จำนวนเงินต้องมากกว่า 0");
        return;
      }
      const res = await fetch(`/api/home-finance/entries/${editingEntry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryDate: editForm.entryDate,
          type: editForm.type,
          categoryKey: editForm.categoryKey,
          categoryLabel: categoryOptions.find((c) => c.key === editForm.categoryKey)?.label ?? editForm.categoryKey,
          title: editForm.title.trim(),
          amount: n,
          note: editForm.note.trim() || null,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(j.error ?? "แก้ไขไม่สำเร็จ");
        return;
      }
      setEditingEntry(null);
      await loadEntries();
    } finally {
      setSaving(false);
    }
  }

  async function addCategory() {
    if (!customCategoryName.trim()) return;
    await fetch("/api/home-finance/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: customCategoryName.trim() }),
    });
    setCustomCategoryName("");
    await loadMeta();
  }

  async function renameCategory(id: number, current: string) {
    const name = prompt("ชื่อหมวดใหม่", current);
    if (!name || !name.trim()) return;
    await fetch(`/api/home-finance/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    await loadMeta();
  }

  async function deleteCategory(id: number) {
    if (!confirm("ลบหมวดนี้?")) return;
    await fetch(`/api/home-finance/categories/${id}`, { method: "DELETE" });
    await loadMeta();
  }

  async function addUtility() {
    if (!utilityForm.label.trim()) return;
    if (editingUtilityId) {
      await fetch(`/api/home-finance/utilities/${editingUtilityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utilityType: utilityForm.utilityType,
          label: utilityForm.label.trim(),
          accountNumber: utilityForm.accountNumber || null,
          dueDate: utilityForm.dueDate || null,
        }),
      });
    } else {
      await fetch("/api/home-finance/utilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utilityType: utilityForm.utilityType,
          label: utilityForm.label.trim(),
          accountNumber: utilityForm.accountNumber || null,
          dueDate: utilityForm.dueDate || null,
        }),
      });
    }
    setEditingUtilityId(null);
    setUtilityForm({ utilityType: "ELECTRIC", label: "", accountNumber: "", dueDate: "" });
    await loadMeta();
  }

  function editUtility(item: Utility) {
    setEditingUtilityId(item.id);
    setUtilityForm({
      utilityType: item.utilityType,
      label: item.label,
      accountNumber: item.accountNumber ?? "",
      dueDate: item.dueDate ? item.dueDate.slice(0, 10) : "",
    });
  }

  async function toggleUtilityActive(id: number, isActive: boolean) {
    await fetch(`/api/home-finance/utilities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    await loadMeta();
  }

  async function removeUtility(id: number) {
    if (!confirm("ลบรายการบิลนี้?")) return;
    await fetch(`/api/home-finance/utilities/${id}`, { method: "DELETE" });
    await loadMeta();
  }

  async function addVehicle() {
    if (!vehicleForm.label.trim()) return;
    if (editingVehicleId) {
      await fetch(`/api/home-finance/vehicles/${editingVehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleType: vehicleForm.vehicleType,
          label: vehicleForm.label.trim(),
          plateNumber: vehicleForm.plateNumber || null,
          taxDueDate: vehicleForm.taxDueDate || null,
          serviceDueDate: vehicleForm.serviceDueDate || null,
          insuranceDueDate: vehicleForm.insuranceDueDate || null,
        }),
      });
    } else {
      await fetch("/api/home-finance/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleType: vehicleForm.vehicleType,
          label: vehicleForm.label.trim(),
          plateNumber: vehicleForm.plateNumber || null,
          taxDueDate: vehicleForm.taxDueDate || null,
          serviceDueDate: vehicleForm.serviceDueDate || null,
          insuranceDueDate: vehicleForm.insuranceDueDate || null,
        }),
      });
    }
    setEditingVehicleId(null);
    setVehicleForm({
      vehicleType: "CAR",
      label: "",
      plateNumber: "",
      taxDueDate: "",
      serviceDueDate: "",
      insuranceDueDate: "",
    });
    await loadMeta();
  }

  function editVehicle(item: Vehicle) {
    setEditingVehicleId(item.id);
    setVehicleForm({
      vehicleType: item.vehicleType,
      label: item.label,
      plateNumber: item.plateNumber ?? "",
      taxDueDate: item.taxDueDate ? item.taxDueDate.slice(0, 10) : "",
      serviceDueDate: item.serviceDueDate ? item.serviceDueDate.slice(0, 10) : "",
      insuranceDueDate: item.insuranceDueDate ? item.insuranceDueDate.slice(0, 10) : "",
    });
  }

  async function toggleVehicleActive(id: number, isActive: boolean) {
    await fetch(`/api/home-finance/vehicles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    await loadMeta();
  }

  async function removeVehicle(id: number) {
    if (!confirm("ลบรายการรถนี้?")) return;
    await fetch(`/api/home-finance/vehicles/${id}`, { method: "DELETE" });
    await loadMeta();
  }

  async function addReminder() {
    if (!reminderForm.title.trim() || !reminderForm.dueDate) return;
    await fetch("/api/home-finance/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: reminderForm.title.trim(),
        dueDate: reminderForm.dueDate,
        note: reminderForm.note.trim() || null,
      }),
    });
    setReminderForm({ title: "", dueDate: todayKey(), note: "" });
    await loadMeta();
  }

  async function toggleReminderDone(id: number, isDone: boolean) {
    await fetch(`/api/home-finance/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDone: !isDone }),
    });
    await loadMeta();
  }

  async function removeReminder(id: number) {
    if (!confirm("ลบรายการแจ้งเตือนนี้?")) return;
    await fetch(`/api/home-finance/reminders/${id}`, { method: "DELETE" });
    await loadMeta();
  }

  const thb = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const today = todayKey();
  const dueAlerts = useMemo(() => {
    const items: Array<{ kind: string; title: string; dueDate: string; note?: string | null }> = [];
    for (const u of utilities) {
      if (u.isActive && u.dueDate) items.push({ kind: u.utilityType === "ELECTRIC" ? "ค่าไฟ" : "ค่าน้ำ", title: u.label, dueDate: u.dueDate.slice(0, 10) });
    }
    for (const v of vehicles) {
      if (!v.isActive) continue;
      if (v.taxDueDate) items.push({ kind: "ยานพาหนะ", title: `${v.label} (ต่อภาษี)`, dueDate: v.taxDueDate.slice(0, 10) });
      if (v.serviceDueDate) items.push({ kind: "ยานพาหนะ", title: `${v.label} (เข้าศูนย์)`, dueDate: v.serviceDueDate.slice(0, 10) });
      if (v.insuranceDueDate) items.push({ kind: "ยานพาหนะ", title: `${v.label} (ประกันภัย)`, dueDate: v.insuranceDueDate.slice(0, 10) });
    }
    for (const r of reminders) {
      if (!r.isDone) items.push({ kind: "อื่นๆ", title: r.title, dueDate: r.dueDate.slice(0, 10), note: r.note });
    }
    return items
      .map((x) => ({ ...x, diff: Math.ceil((new Date(`${x.dueDate}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / (24 * 60 * 60 * 1000)) }))
      .filter((x) => x.diff <= 7)
      .sort((a, b) => a.diff - b.diff);
  }, [utilities, vehicles, reminders, today]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Tab active={tab === "entries"} onClick={() => setTab("entries")}>บันทึกรายรับรายจ่าย</Tab>
        <Tab active={tab === "categories"} onClick={() => setTab("categories")}>จัดการหมวด</Tab>
        <Tab active={tab === "utilities"} onClick={() => setTab("utilities")}>ค่าไฟ/ค่าน้ำ</Tab>
        <Tab active={tab === "vehicles"} onClick={() => setTab("vehicles")}>ยานพาหนะ</Tab>
        <Tab active={tab === "reminders"} onClick={() => setTab("reminders")}>บันทึกแจ้งเตือนอื่นๆ</Tab>
      </div>

      {tab === "entries" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat title="รายการ" value={String(summary.count)} />
            <Stat title="รายรับ" value={`${thb(summary.income)} บาท`} tone="green" />
            <Stat title="รายจ่าย" value={`${thb(summary.expense)} บาท`} tone="red" />
            <Stat title="คงเหลือ" value={`${thb(summary.balance)} บาท`} tone={summary.balance >= 0 ? "blue" : "red"} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">เพิ่มข้อมูลใหม่ผ่านฟอร์ม popup</p>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setEntryModalOpen(true);
                }}
                className="rounded-xl bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0000a6]"
              >
                + เพิ่มรายการ
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClz} />
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClz} />
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={inputClz}><option value="">ทุกประเภท</option><option value="INCOME">รายรับ</option><option value="EXPENSE">รายจ่าย</option></select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={inputClz}><option value="">ทุกหมวด</option>{categoryOptions.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select>
              <input value={q} onChange={(e) => setQ(e.target.value)} className={inputClz} placeholder="ค้นหา ชื่อ/บิล/หมายเหตุ" />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? <p className="p-6 text-center text-sm text-slate-500">กำลังโหลด…</p> : entries.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">ยังไม่มีรายการในช่วงที่เลือก</p> : (
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-600">
                  <tr>
                    <th className="px-3 py-2">วันที่</th><th className="px-3 py-2">ประเภท</th><th className="px-3 py-2">หมวด</th><th className="px-3 py-2">รายการ</th><th className="px-3 py-2">จำนวน</th><th className="px-3 py-2">หมายเหตุ</th><th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">{e.entryDate}</td>
                      <td className="px-3 py-2"><span className={e.type === "INCOME" ? "text-emerald-700" : "text-red-700"}>{e.type === "INCOME" ? "รายรับ" : "รายจ่าย"}</span></td>
                      <td className="px-3 py-2">{e.categoryLabel}</td>
                      <td className="px-3 py-2">{e.title}</td>
                      <td className="px-3 py-2 font-semibold">{thb(e.amount)}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{e.note ?? "-"}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(e)} className="text-xs font-semibold text-[#0000BF] hover:underline">แก้ไข</button>
                          <button onClick={() => void removeEntry(e.id)} className="text-xs font-semibold text-red-700 hover:underline">ลบ</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {entryModalOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
              <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">เพิ่มรายการใหม่</h2>
                  <button
                    type="button"
                    onClick={() => setEntryModalOpen(false)}
                    className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
                  >
                    ปิด
                  </button>
                </div>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="วันที่รายการ"><input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className={inputClz} /></Field>
                    <Field label="ประเภท">
                      <select value={type} onChange={(e) => setType(e.target.value as "INCOME" | "EXPENSE")} className={inputClz}>
                        <option value="EXPENSE">รายจ่าย</option><option value="INCOME">รายรับ</option>
                      </select>
                    </Field>
                    <Field label="หมวด">
                      <select value={categoryKey} onChange={(e) => setCategoryKey(e.target.value)} className={inputClz}>
                        {categoryOptions.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                      </select>
                    </Field>
                    <Field label="จำนวนเงิน"><input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className={inputClz} placeholder="0.00" /></Field>
                  </div>
                  <Field label="ชื่อรายการ"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClz} placeholder="เช่น ค่าไฟฟ้าเดือนนี้ / ค่าเข้าศูนย์รถ" required /></Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {showVehicleFields ? <Field label="ประเภทรถ"><input value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className={inputClz} placeholder="รถยนต์/มอเตอร์ไซค์" /></Field> : null}
                  </div>
                  {showVehicleFields ? <Field label="ศูนย์บริการ/อู่"><input value={serviceCenter} onChange={(e) => setServiceCenter(e.target.value)} className={inputClz} /></Field> : null}
                  <Field label="หมายเหตุ"><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputClz} /></Field>
                  {error ? <p className="text-sm text-red-700">{error}</p> : null}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEntryModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">ยกเลิก</button>
                    <button disabled={saving} className="rounded-xl bg-[#0000BF] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "กำลังบันทึก..." : "บันทึกรายการ"}</button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}

          {editingEntry ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
              <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">แก้ไขรายการ</h2>
                  <button type="button" onClick={() => setEditingEntry(null)} className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">ปิด</button>
                </div>
                <form onSubmit={onSubmitEdit} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="วันที่รายการ"><input type="date" value={editForm.entryDate} onChange={(e) => setEditForm((s) => ({ ...s, entryDate: e.target.value }))} className={inputClz} /></Field>
                    <Field label="ประเภท">
                      <select value={editForm.type} onChange={(e) => setEditForm((s) => ({ ...s, type: e.target.value as "INCOME" | "EXPENSE" }))} className={inputClz}>
                        <option value="EXPENSE">รายจ่าย</option><option value="INCOME">รายรับ</option>
                      </select>
                    </Field>
                    <Field label="หมวด">
                      <select value={editForm.categoryKey} onChange={(e) => setEditForm((s) => ({ ...s, categoryKey: e.target.value }))} className={inputClz}>
                        {categoryOptions.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                      </select>
                    </Field>
                    <Field label="จำนวนเงิน"><input value={editForm.amount} onChange={(e) => setEditForm((s) => ({ ...s, amount: e.target.value }))} inputMode="decimal" className={inputClz} /></Field>
                  </div>
                  <Field label="ชื่อรายการ"><input value={editForm.title} onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))} className={inputClz} required /></Field>
                  <Field label="หมายเหตุ"><textarea value={editForm.note} onChange={(e) => setEditForm((s) => ({ ...s, note: e.target.value }))} rows={2} className={inputClz} /></Field>
                  {error ? <p className="text-sm text-red-700">{error}</p> : null}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingEntry(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">ยกเลิก</button>
                    <button disabled={saving} className="rounded-xl bg-[#0000BF] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}</button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {tab === "categories" ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">เพิ่ม/แก้ไข/ลบ หมวดแบบกำหนดเอง</h2>
          <div className="flex gap-2">
            <input value={customCategoryName} onChange={(e) => setCustomCategoryName(e.target.value)} className={inputClz} placeholder="ชื่อหมวดใหม่" />
            <button onClick={() => void addCategory()} className="rounded-xl bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white">เพิ่มหมวด</button>
          </div>
          <div className="space-y-2">
            {categories.length === 0 ? <p className="text-sm text-slate-500">ยังไม่มีหมวดกำหนดเอง</p> : categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <div><p className="text-sm font-medium text-slate-800">{c.name}</p><p className="text-xs text-slate-500">{c.isActive ? "ใช้งาน" : "ปิดใช้งาน"}</p></div>
                <div className="flex gap-2">
                  <button onClick={() => void renameCategory(c.id, c.name)} className="text-xs font-semibold text-[#0000BF]">แก้ไข</button>
                  <button onClick={() => void deleteCategory(c.id)} className="text-xs font-semibold text-red-700">ลบ</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "utilities" ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">รายการค่าไฟ/ค่าน้ำ</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="ประเภทบิล">
              <select value={utilityForm.utilityType} onChange={(e) => setUtilityForm((s) => ({ ...s, utilityType: e.target.value as "ELECTRIC" | "WATER" }))} className={inputClz}><option value="ELECTRIC">ค่าไฟ</option><option value="WATER">ค่าน้ำ</option></select>
            </Field>
            <Field label="ชื่อรายการ">
              <input value={utilityForm.label} onChange={(e) => setUtilityForm((s) => ({ ...s, label: e.target.value }))} className={inputClz} placeholder="เช่น บ้านหลัก" />
            </Field>
            <Field label="เลขผู้ใช้น้ำ/ไฟ">
              <input value={utilityForm.accountNumber} onChange={(e) => setUtilityForm((s) => ({ ...s, accountNumber: e.target.value }))} className={inputClz} placeholder="เช่น 1234567890" />
            </Field>
            <Field label="วันครบชำระ">
              <input type="date" value={utilityForm.dueDate} onChange={(e) => setUtilityForm((s) => ({ ...s, dueDate: e.target.value }))} className={inputClz} />
            </Field>
            <div className="flex items-end">
              <button onClick={() => void addUtility()} className="h-[44px] w-full rounded-xl bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white">{editingUtilityId ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}</button>
            </div>
          </div>
          {editingUtilityId ? (
            <div>
              <button onClick={() => { setEditingUtilityId(null); setUtilityForm({ utilityType: "ELECTRIC", label: "", accountNumber: "", dueDate: "" }); }} className="text-xs font-semibold text-slate-600 hover:underline">ยกเลิกการแก้ไข</button>
            </div>
          ) : null}
          <div className="space-y-2">
            {utilities.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <p className="text-sm text-slate-800">
                  {u.utilityType === "ELECTRIC" ? "ค่าไฟ" : "ค่าน้ำ"} · {u.label} {u.accountNumber ? `· ${u.accountNumber}` : ""} {u.dueDate ? `· ครบชำระ ${u.dueDate.slice(0, 10)}` : ""}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => editUtility(u)} className="text-xs font-semibold text-[#0000BF]">แก้ไข</button>
                  <button onClick={() => void toggleUtilityActive(u.id, u.isActive)} className="text-xs font-semibold text-[#0000BF]">{u.isActive ? "ปิด" : "เปิด"}</button>
                  <button onClick={() => void removeUtility(u.id)} className="text-xs font-semibold text-red-700">ลบ</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "vehicles" ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">รายการยานพาหนะ</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat title="จำนวนรถยนต์ (active)" value={String(vehicleCounts.cars)} />
            <Stat title="จำนวนรถจักรยานยนต์ (active)" value={String(vehicleCounts.motorcycles)} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="ประเภทยานพาหนะ">
              <select value={vehicleForm.vehicleType} onChange={(e) => setVehicleForm((s) => ({ ...s, vehicleType: e.target.value as "CAR" | "MOTORCYCLE" }))} className={inputClz}><option value="CAR">รถยนต์</option><option value="MOTORCYCLE">รถจักรยานยนต์</option></select>
            </Field>
            <Field label="ชื่อเรียกรถ">
              <input value={vehicleForm.label} onChange={(e) => setVehicleForm((s) => ({ ...s, label: e.target.value }))} className={inputClz} placeholder="เช่น คันหลัก" />
            </Field>
            <Field label="ทะเบียนรถ">
              <input value={vehicleForm.plateNumber} onChange={(e) => setVehicleForm((s) => ({ ...s, plateNumber: e.target.value }))} className={inputClz} placeholder="เช่น กข 1234" />
            </Field>
            <Field label="วันครบต่อภาษี">
              <input type="date" value={vehicleForm.taxDueDate} onChange={(e) => setVehicleForm((s) => ({ ...s, taxDueDate: e.target.value }))} className={inputClz} />
            </Field>
            <Field label="วันเข้าศูนย์บริการ">
              <input type="date" value={vehicleForm.serviceDueDate} onChange={(e) => setVehicleForm((s) => ({ ...s, serviceDueDate: e.target.value }))} className={inputClz} />
            </Field>
            <Field label="วันครบประกันภัย">
              <input type="date" value={vehicleForm.insuranceDueDate} onChange={(e) => setVehicleForm((s) => ({ ...s, insuranceDueDate: e.target.value }))} className={inputClz} />
            </Field>
            <div className="flex items-end">
              <button onClick={() => void addVehicle()} className="h-[44px] w-full rounded-xl bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white">{editingVehicleId ? "บันทึกการแก้ไข" : "เพิ่มรถ"}</button>
            </div>
          </div>
          {editingVehicleId ? (
            <div>
              <button onClick={() => { setEditingVehicleId(null); setVehicleForm({ vehicleType: "CAR", label: "", plateNumber: "", taxDueDate: "", serviceDueDate: "", insuranceDueDate: "" }); }} className="text-xs font-semibold text-slate-600 hover:underline">ยกเลิกการแก้ไข</button>
            </div>
          ) : null}
          <div className="space-y-2">
            {vehicles.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <p className="text-sm text-slate-800">
                  {v.vehicleType === "CAR" ? "รถยนต์" : "รถจักรยานยนต์"} · {v.label} {v.plateNumber ? `· ${v.plateNumber}` : ""}
                  {v.taxDueDate ? ` · ต่อภาษี ${v.taxDueDate.slice(0, 10)}` : ""}
                  {v.serviceDueDate ? ` · เข้าศูนย์ ${v.serviceDueDate.slice(0, 10)}` : ""}
                  {v.insuranceDueDate ? ` · ประกันภัย ${v.insuranceDueDate.slice(0, 10)}` : ""}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => editVehicle(v)} className="text-xs font-semibold text-[#0000BF]">แก้ไข</button>
                  <button onClick={() => void toggleVehicleActive(v.id, v.isActive)} className="text-xs font-semibold text-[#0000BF]">{v.isActive ? "ปิด" : "เปิด"}</button>
                  <button onClick={() => void removeVehicle(v.id)} className="text-xs font-semibold text-red-700">ลบ</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "reminders" ? (
        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">เพิ่มหัวข้อแจ้งเตือนอื่นๆ</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="หัวข้อแจ้งเตือน">
                <input value={reminderForm.title} onChange={(e) => setReminderForm((s) => ({ ...s, title: e.target.value }))} className={inputClz} placeholder="เช่น ค่าส่วนกลางหมู่บ้าน" />
              </Field>
              <Field label="วันครบกำหนดการแจ้งเตือน">
                <input type="date" value={reminderForm.dueDate} onChange={(e) => setReminderForm((s) => ({ ...s, dueDate: e.target.value }))} className={inputClz} />
              </Field>
              <Field label="หมายเหตุ">
                <input value={reminderForm.note} onChange={(e) => setReminderForm((s) => ({ ...s, note: e.target.value }))} className={inputClz} />
              </Field>
              <div className="flex items-end">
                <button onClick={() => void addReminder()} className="h-[44px] w-full rounded-xl bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white">เพิ่มแจ้งเตือน</button>
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">แจ้งเตือนครบกำหนด (ภายใน 7 วัน)</h2>
            {dueAlerts.length === 0 ? <p className="text-sm text-slate-500">ยังไม่มีรายการครบกำหนดในช่วงนี้</p> : dueAlerts.map((a, i) => (
              <div key={`${a.kind}-${a.title}-${a.dueDate}-${i}`} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800">
                {a.kind} · {a.title} · ครบกำหนด {a.dueDate} {a.diff < 0 ? `(เกินกำหนด ${Math.abs(a.diff)} วัน)` : a.diff === 0 ? "(ครบวันนี้)" : `(อีก ${a.diff} วัน)`}
              </div>
            ))}
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">รายการแจ้งเตือนอื่นๆทั้งหมด</h2>
            {reminders.length === 0 ? <p className="text-sm text-slate-500">ยังไม่มีรายการ</p> : reminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-800">{r.title}</p>
                  <p className="text-xs text-slate-500">ครบกำหนด {r.dueDate.slice(0, 10)} {r.note ? `· ${r.note}` : ""} {r.isDone ? "· เสร็จแล้ว" : ""}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => void toggleReminderDone(r.id, r.isDone)} className="text-xs font-semibold text-[#0000BF]">{r.isDone ? "เปิดใหม่" : "ทำเสร็จแล้ว"}</button>
                  <button onClick={() => void removeReminder(r.id)} className="text-xs font-semibold text-red-700">ลบ</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-slate-600">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Stat({
  title,
  value,
  tone = "blue",
}: {
  title: string;
  value: string;
  tone?: "blue" | "green" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "red"
        ? "border-red-200 bg-red-50"
        : "border-[#0000BF]/20 bg-[#0000BF]/[0.03]";
  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-xl bg-[#0000BF]/12 px-3.5 py-2 text-sm font-semibold text-[#0000BF]"
          : "rounded-xl bg-slate-100 px-3.5 py-2 text-sm font-semibold text-slate-700"
      }
    >
      {children}
    </button>
  );
}

function QuickChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-[#0000BF] px-3 py-1.5 text-xs font-semibold text-white"
          : "rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
      }
    >
      {children}
    </button>
  );
}
