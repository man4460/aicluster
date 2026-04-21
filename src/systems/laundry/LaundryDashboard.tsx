"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { HomeFinanceList, HomeFinanceListHeading } from "@/systems/home-finance/components/HomeFinanceUi";
import {
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  downloadPosterPng,
  createShopQrPosterCanvas,
  resolveAssetUrl,
} from "@/components/qr/shop-qr-template";
import {
  createLaundrySessionApiRepository,
  LAUNDRY_ORDER_STATUSES,
  laundryOrderStatusLabelTh,
  type LaundryOrder,
  type LaundryOrderStatus,
  type LaundryPackage,
} from "@/systems/laundry/laundry-service";

type TabKey = "overview" | "orders" | "packages" | "staff_qr";

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e1e3ff] bg-white p-4">
      <p className="text-xs text-[#66638c]">{title}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-[#2e2a58]">{value}</p>
    </div>
  );
}

export function LaundryDashboard({
  shopLabel,
  logoUrl,
  baseUrl,
  recorderDisplayName,
  trialSessionId,
  isTrialSandbox,
  layoutVariant = "full",
}: {
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  recorderDisplayName: string;
  trialSessionId: string;
  isTrialSandbox: boolean;
  layoutVariant?: "full" | "staff_lane";
}) {
  const repo = useMemo(() => createLaundrySessionApiRepository(), []);
  const isStaffLaneOnly = layoutVariant === "staff_lane";
  const [tab, setTab] = useState<TabKey>(isStaffLaneOnly ? "orders" : "overview");
  const [orders, setOrders] = useState<LaundryOrder[]>([]);
  const [packages, setPackages] = useState<LaundryPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [staffQrBusy, setStaffQrBusy] = useState(false);
  const [staffQrPng, setStaffQrPng] = useState<string | null>(null);
  const [staffPosterPreview, setStaffPosterPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    pickup_address: "",
    dropoff_address: "",
    service_type: "",
    package_id: "",
    weight_kg: "",
    item_count: "",
    final_price: "",
    note: "",
  });

  const loadAll = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const [orderRows, packageRows] = await Promise.all([repo.listOrders(), repo.listPackages()]);
      setOrders(orderRows);
      setPackages(packageRows);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [repo]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAll({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      void loadAll({ silent: true });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [loadAll]);

  useEffect(() => {
    const onFocusOrVisible = () => {
      if (document.hidden) return;
      void loadAll({ silent: true });
    };
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [loadAll]);

  const staffPageUrl = useMemo(() => {
    const root =
      baseUrl.startsWith("http://") || baseUrl.startsWith("https://") ? baseUrl.replace(/\/$/, "") : "";
    if (!root) return "";
    const u = new URL("/dashboard/laundry/staff", root);
    if (isTrialSandbox && trialSessionId) u.searchParams.set("t", trialSessionId);
    return u.toString();
  }, [baseUrl, isTrialSandbox, trialSessionId]);

  useEffect(() => {
    if (!staffPageUrl) {
      setStaffQrPng(null);
      return;
    }
    void QRCode.toDataURL(staffPageUrl, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setStaffQrPng)
      .catch(() => setStaffQrPng(null));
  }, [staffPageUrl]);

  useEffect(() => {
    if (!staffQrPng) {
      setStaffPosterPreview(null);
      return;
    }
    void createShopQrPosterDataUrl({
      qrDataUrl: staffQrPng,
      shopLabel: shopLabel.trim() || "Laundry",
      logoUrl: resolveAssetUrl(logoUrl, baseUrl),
      tagline: "สแกนเข้าหน้าพนักงานรับ-ส่งผ้า (ต้องล็อกอินร้าน)",
    })
      .then(setStaffPosterPreview)
      .catch(() => setStaffPosterPreview(null));
  }, [staffQrPng, shopLabel, logoUrl, baseUrl]);

  async function createOrder() {
    if (!form.customer_name.trim() || !form.pickup_address.trim()) return;
    const selectedPackage = form.package_id ? packages.find((p) => p.id === Number(form.package_id)) ?? null : null;
    await repo.createOrder({
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      pickup_address: form.pickup_address.trim(),
      dropoff_address: form.dropoff_address.trim() || form.pickup_address.trim(),
      service_type: form.service_type.trim() || selectedPackage?.name || "ซัก-อบ-พับ",
      package_id: selectedPackage?.id ?? null,
      package_name: selectedPackage?.name ?? "งานทั่วไป",
      weight_kg: Number(form.weight_kg) || 0,
      item_count: Number(form.item_count) || 0,
      final_price: Number(form.final_price) || 0,
      note: form.note.trim(),
      recorded_by_name: recorderDisplayName,
    });
    setShowCreate(false);
    setForm({
      customer_name: "",
      customer_phone: "",
      pickup_address: "",
      dropoff_address: "",
      service_type: "",
      package_id: "",
      weight_kg: "",
      item_count: "",
      final_price: "",
      note: "",
    });
    await loadAll();
  }

  async function setOrderStatus(id: number, status: LaundryOrderStatus) {
    await repo.updateOrder(id, { status });
    await loadAll({ silent: true });
  }

  async function downloadStaffQrPdf() {
    if (!staffQrPng) return;
    setStaffQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: staffQrPng,
        shopLabel: shopLabel.trim() || "Laundry",
        logoUrl: resolveAssetUrl(logoUrl, baseUrl),
        tagline: "สแกนเข้าหน้าพนักงานรับ-ส่งผ้า (ต้องล็อกอินร้าน)",
      });
      await downloadPosterPdf(canvas, "laundry-staff-qr-a4.pdf", "a4");
    } finally {
      setStaffQrBusy(false);
    }
  }

  async function downloadStaffQrPng() {
    if (!staffQrPng) return;
    setStaffQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: staffQrPng,
        shopLabel: shopLabel.trim() || "Laundry",
        logoUrl: resolveAssetUrl(logoUrl, baseUrl),
        tagline: "สแกนเข้าหน้าพนักงานรับ-ส่งผ้า (ต้องล็อกอินร้าน)",
      });
      await downloadPosterPng(canvas, "laundry-staff-qr.png");
    } finally {
      setStaffQrBusy(false);
    }
  }

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED"),
    [orders],
  );

  const todayStats = useMemo(() => {
    const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    const todayRows = orders.filter(
      (o) => new Date(o.order_at).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }) === todayKey,
    );
    return {
      totalOrders: todayRows.length,
      waitingPickup: todayRows.filter((o) => o.status === "PENDING_PICKUP").length,
      activeOrders: todayRows.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED").length,
      revenue: todayRows.reduce((sum, o) => sum + o.final_price, 0),
    };
  }, [orders]);

  return (
    <div className="max-w-full space-y-4 sm:space-y-6">
      {!isStaffLaneOnly ? (
        <>
          <header className="app-surface rounded-2xl px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight text-[#2e2a58] sm:text-2xl">รับฝากซักผ้า</h1>
                <p className="mt-1 text-sm text-[#66638c]">รับผ้าที่บ้าน · ซัก/อบ/รีด · ส่งคืนลูกค้า</p>
              </div>
              <button
                type="button"
                onClick={() => void refreshData()}
                disabled={refreshing}
                className="app-btn-soft rounded-xl border border-[#dcd8f0] px-4 py-2.5 text-sm font-semibold text-[#4d47b6] disabled:opacity-60"
              >
                {refreshing ? "กำลังรีเฟรช..." : "รีเฟรช"}
              </button>
            </div>
          </header>

          <nav className="app-surface rounded-2xl p-3 sm:p-4">
            <ul className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
              {[
                ["overview", "แดชบอร์ด"],
                ["orders", "งานซักวันนี้"],
                ["packages", "ราคา/แพ็กเกจ"],
                ["staff_qr", "QR พนักงาน"],
              ].map(([k, label]) => (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => setTab(k as TabKey)}
                    className={cn(
                      "min-h-[44px] rounded-xl px-3 py-2 text-sm font-semibold",
                      tab === k ? "bg-[#ecebff] text-[#4d47b6] ring-1 ring-[#4d47b6]/20" : "app-btn-soft text-[#66638c]",
                    )}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </>
      ) : (
        <div className="app-surface rounded-2xl px-4 py-4 sm:px-6">
          <h1 className="text-lg font-bold text-[#2e2a58] sm:text-xl">งานรับ-ส่งผ้าวันนี้ (พนักงาน)</h1>
          <p className="mt-0.5 text-xs text-[#66638c]">เฉพาะคิวงานที่ยังไม่ปิด</p>
        </div>
      )}

      {(tab === "overview" || isStaffLaneOnly) && (
        <div className="space-y-4">
          {!isStaffLaneOnly ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title="รับงานวันนี้" value={String(todayStats.totalOrders)} />
              <StatCard title="รอรับผ้า" value={String(todayStats.waitingPickup)} />
              <StatCard title="งานค้าง" value={String(todayStats.activeOrders)} />
              <StatCard title="รายรับวันนี้" value={`฿${todayStats.revenue.toLocaleString("th-TH")}`} />
            </div>
          ) : null}

          <AppDashboardSection tone="violet">
            <AppSectionHeader
              tone="violet"
              title="งานที่กำลังดำเนินการ"
              action={
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void refreshData()}
                    disabled={refreshing}
                    className="app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] disabled:opacity-60"
                  >
                    {refreshing ? "กำลังรีเฟรช..." : "รีเฟรช"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold"
                  >
                    + บันทึกรายการ
                  </button>
                </div>
              }
            />
            {loading ? <p className="text-sm text-[#66638c]">กำลังโหลด...</p> : null}
            {!loading && activeOrders.length === 0 ? <AppEmptyState tone="violet">ไม่มีงานค้าง</AppEmptyState> : null}
            {!loading && activeOrders.length > 0 ? (
              <HomeFinanceList listRole="งานซักค้าง">
                {activeOrders.map((o) => (
                  <article key={o.id} className="rounded-xl border border-[#e1e3ff] bg-white px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-[#2e2a58]">
                        #{o.id} · {o.customer_name}
                      </p>
                      <span className="rounded-full bg-[#ecebff] px-2 py-0.5 text-[11px] font-semibold text-[#4d47b6]">
                        {laundryOrderStatusLabelTh(o.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#66638c]">รับผ้า: {o.pickup_address}</p>
                    <p className="text-xs text-[#66638c]">ส่งคืน: {o.dropoff_address}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {o.service_type} · {o.weight_kg} กก. · {o.item_count} ชิ้น · ฿{o.final_price.toLocaleString("th-TH")}
                    </p>
                    <select
                      className="app-input mt-2 min-h-[40px] w-full rounded-xl px-3 py-2 text-sm"
                      value={o.status}
                      onChange={(e) => void setOrderStatus(o.id, e.target.value as LaundryOrderStatus)}
                    >
                      {LAUNDRY_ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {laundryOrderStatusLabelTh(s)}
                        </option>
                      ))}
                    </select>
                  </article>
                ))}
              </HomeFinanceList>
            ) : null}
          </AppDashboardSection>
        </div>
      )}

      {!isStaffLaneOnly && tab === "orders" ? (
        <AppDashboardSection tone="slate">
          <HomeFinanceListHeading>รายการรับ-ส่งทั้งหมด</HomeFinanceListHeading>
          <div className="mt-3 space-y-2">
            {orders.map((o) => (
              <article key={o.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    #{o.id} · {o.customer_name} ({o.customer_phone || "-"})
                  </p>
                  <span className="text-xs font-medium text-slate-500">
                    {new Date(o.order_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{o.pickup_address}</p>
                <p className="text-xs text-slate-600">{o.dropoff_address}</p>
              </article>
            ))}
          </div>
        </AppDashboardSection>
      ) : null}

      {!isStaffLaneOnly && tab === "packages" ? (
        <AppDashboardSection tone="slate">
          <HomeFinanceListHeading>ราคา/แพ็กเกจ</HomeFinanceListHeading>
          <div className="mt-3 space-y-2">
            {packages.map((p) => (
              <article key={p.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                  <span className="text-xs font-medium text-slate-500">{p.pricing_model}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{p.description || "-"}</p>
                <p className="mt-1 text-sm font-bold text-[#2e2a58]">฿{p.base_price.toLocaleString("th-TH")}</p>
              </article>
            ))}
          </div>
        </AppDashboardSection>
      ) : null}

      {!isStaffLaneOnly && tab === "staff_qr" ? (
        <AppDashboardSection tone="violet">
          <AppSectionHeader tone="violet" title="QR พนักงาน" />
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(staffPageUrl || "")}
                className="app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6]"
              >
                คัดลอกลิงก์
              </button>
              <button
                type="button"
                onClick={() => void downloadStaffQrPdf()}
                disabled={staffQrBusy || !staffQrPng}
                className="app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60"
              >
                ดาวน์โหลด PDF (A4)
              </button>
              <button
                type="button"
                onClick={() => void downloadStaffQrPng()}
                disabled={staffQrBusy || !staffQrPng}
                className="app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] disabled:opacity-60"
              >
                ดาวน์โหลด PNG
              </button>
            </div>
            <p className="break-all rounded-lg bg-[#f8f8ff] px-3 py-2 text-xs text-[#4d47b6]">{staffPageUrl || "-"}</p>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-4">
              {staffPosterPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={staffPosterPreview} alt="QR พนักงานซักผ้า" className="mx-auto w-[340px] rounded-3xl shadow-md" />
              ) : (
                <div className="mx-auto flex h-[560px] w-[340px] items-center justify-center rounded-3xl border border-slate-300 bg-white text-xs text-slate-500">
                  กำลังเรนเดอร์ตัวอย่าง...
                </div>
              )}
            </div>
          </div>
        </AppDashboardSection>
      ) : null}

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="app-surface w-full max-w-2xl rounded-2xl p-4 sm:p-5">
            <h3 className="text-lg font-bold text-[#2e2a58]">บันทึกรายการรับผ้า</h3>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input className="app-input rounded-xl px-3 py-2 text-sm" placeholder="ชื่อลูกค้า" value={form.customer_name} onChange={(e) => setForm((s) => ({ ...s, customer_name: e.target.value }))} />
              <input className="app-input rounded-xl px-3 py-2 text-sm" placeholder="เบอร์โทร" value={form.customer_phone} onChange={(e) => setForm((s) => ({ ...s, customer_phone: e.target.value }))} />
              <input className="app-input rounded-xl px-3 py-2 text-sm sm:col-span-2" placeholder="ที่อยู่รับผ้า" value={form.pickup_address} onChange={(e) => setForm((s) => ({ ...s, pickup_address: e.target.value }))} />
              <input className="app-input rounded-xl px-3 py-2 text-sm sm:col-span-2" placeholder="ที่อยู่ส่งคืน" value={form.dropoff_address} onChange={(e) => setForm((s) => ({ ...s, dropoff_address: e.target.value }))} />
              <select className="app-input rounded-xl px-3 py-2 text-sm" value={form.package_id} onChange={(e) => setForm((s) => ({ ...s, package_id: e.target.value }))}>
                <option value="">เลือกแพ็กเกจ</option>
                {packages.filter((p) => p.is_active).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input className="app-input rounded-xl px-3 py-2 text-sm" placeholder="ประเภทบริการ" value={form.service_type} onChange={(e) => setForm((s) => ({ ...s, service_type: e.target.value }))} />
              <input className="app-input rounded-xl px-3 py-2 text-sm" type="number" placeholder="น้ำหนัก (กก.)" value={form.weight_kg} onChange={(e) => setForm((s) => ({ ...s, weight_kg: e.target.value }))} />
              <input className="app-input rounded-xl px-3 py-2 text-sm" type="number" placeholder="จำนวนชิ้น" value={form.item_count} onChange={(e) => setForm((s) => ({ ...s, item_count: e.target.value }))} />
              <input className="app-input rounded-xl px-3 py-2 text-sm sm:col-span-2" type="number" placeholder="ราคาสุทธิ" value={form.final_price} onChange={(e) => setForm((s) => ({ ...s, final_price: e.target.value }))} />
              <textarea className="app-input rounded-xl px-3 py-2 text-sm sm:col-span-2" rows={3} placeholder="หมายเหตุ" value={form.note} onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="app-btn-soft rounded-xl px-4 py-2 text-sm font-semibold text-[#4d47b6]">
                ยกเลิก
              </button>
              <button type="button" onClick={() => void createOrder()} className="app-btn-primary rounded-xl px-4 py-2 text-sm font-semibold">
                บันทึก
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
