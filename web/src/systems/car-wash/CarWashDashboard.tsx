"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  createShopQrPosterCanvas,
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  downloadPosterPng,
  resolveAssetUrl,
} from "@/components/qr/shop-qr-template";
import {
  type Complaint,
  type ComplaintStatus,
  createCarWashSessionApiRepository,
  type ServiceVisit,
  type ServicePackage,
  type WashBundle,
} from "@/systems/car-wash/car-wash-service";

type TabKey = "overview" | "visits" | "packages" | "bundles" | "complaints";

function statusBadgeClass(status: ComplaintStatus): string {
  if (status === "Resolved") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "In Progress") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-rose-100 text-rose-700 border-rose-200";
}

function statusLabelTh(status: ComplaintStatus): string {
  if (status === "Pending") return "รอดำเนินการ";
  if (status === "In Progress") return "กำลังดำเนินการ";
  return "แก้ไขแล้ว";
}

function icon(kind: "add" | "edit" | "delete" | "status") {
  if (kind === "add") return <span aria-hidden>➕</span>;
  if (kind === "edit") return <span aria-hidden>✏️</span>;
  if (kind === "delete") return <span aria-hidden>🗑️</span>;
  return <span aria-hidden>🔄</span>;
}

function normalizePlate(s: string): string {
  return s.trim().replace(/\s+/g, "").toLowerCase();
}

function phoneLooseMatch(storedPhone: string, queryDigits: string): boolean {
  const a = storedPhone.replace(/\D/g, "");
  if (!a || !queryDigits) return false;
  if (a === queryDigits) return true;
  if (queryDigits.length >= 6 && (a.endsWith(queryDigits) || queryDigits.endsWith(a))) return true;
  return false;
}

function plateLooseMatch(storedPlate: string, query: string): boolean {
  const b = normalizePlate(query);
  if (b.length < 2) return false;
  const a = normalizePlate(storedPlate);
  return a.includes(b) || b.includes(a);
}

type CustomerLookupMatch =
  | { kind: "bundle"; b: WashBundle }
  | { kind: "visit"; v: ServiceVisit };

function findCustomerLookupMatch(
  q: string,
  bundleRows: WashBundle[],
  visitRows: ServiceVisit[],
): CustomerLookupMatch | null {
  const trimmed = q.trim();
  if (!trimmed) return null;
  const qDigits = trimmed.replace(/\D/g, "");

  const pickBundle = (list: WashBundle[]) =>
    list
      .filter((x) => x.is_active && x.used_uses < x.total_uses)
      .sort((xa, xb) => xb.total_uses - xb.used_uses - (xa.total_uses - xa.used_uses))[0] ?? list[0];

  if (qDigits.length >= 6) {
    const byPhone = bundleRows.filter((b) => phoneLooseMatch(b.customer_phone, qDigits));
    const pb = pickBundle(byPhone);
    if (pb) return { kind: "bundle", b: pb };
  }
  if (trimmed.length >= 2) {
    const byPlate = bundleRows.filter((b) => plateLooseMatch(b.plate_number, trimmed));
    const pl = pickBundle(byPlate);
    if (pl) return { kind: "bundle", b: pl };
  }

  const visSorted = [...visitRows].sort((a, b) => (a.visit_at < b.visit_at ? 1 : -1));
  if (qDigits.length >= 6) {
    const v = visSorted.find((x) => phoneLooseMatch(x.customer_phone, qDigits));
    if (v) return { kind: "visit", v };
  }
  if (trimmed.length >= 2) {
    const v2 = visSorted.find((x) => plateLooseMatch(x.plate_number, trimmed));
    if (v2) return { kind: "visit", v: v2 };
  }

  return null;
}

export function CarWashDashboard({
  shopLabel,
  logoUrl,
  baseUrl,
  recorderDisplayName,
  ownerId,
  trialSessionId,
  isTrialSandbox,
}: {
  shopLabel: string;
  logoUrl: string | null;
  baseUrl: string;
  recorderDisplayName: string;
  ownerId: string;
  trialSessionId: string;
  isTrialSandbox: boolean;
}) {
  const repo = useMemo(() => createCarWashSessionApiRepository(), []);

  const [tab, setTab] = useState<TabKey>("overview");
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [bundles, setBundles] = useState<WashBundle[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [visits, setVisits] = useState<ServiceVisit[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showPkgModal, setShowPkgModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<ServicePackage | null>(null);
  const [pkgForm, setPkgForm] = useState({
    name: "",
    price: "",
    duration_minutes: "",
    description: "",
    is_active: true,
  });

  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    subject: "",
    details: "",
    status: "Pending" as ComplaintStatus,
    photo_url: "",
  });
  const [statusTarget, setStatusTarget] = useState<Complaint | null>(null);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [portalUrl, setPortalUrl] = useState("");
  const [portalQr, setPortalQr] = useState<string | null>(null);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const [visitLookupHint, setVisitLookupHint] = useState<string | null>(null);
  const [visitForm, setVisitForm] = useState({
    customer_lookup: "",
    customer_name: "",
    customer_phone: "",
    plate_number: "",
    package_id: "",
    bundle_id: "",
    final_price: "",
    note: "",
    recorded_by_override: "",
  });
  const [bundleForm, setBundleForm] = useState({
    customer_name: "",
    customer_phone: "",
    plate_number: "",
    package_id: "",
    paid_amount: "1000",
    total_uses: "10",
    is_active: true,
  });

  const activeBundles = useMemo(
    () => bundles.filter((b) => b.is_active && b.used_uses < b.total_uses),
    [bundles],
  );

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [pkgRows, bundleRows, complaintRows, visitRows] = await Promise.all([
        repo.listPackages(),
        repo.listBundles(),
        repo.listComplaints(),
        repo.listVisits(),
      ]);
      setPackages(pkgRows);
      setBundles(bundleRows);
      setComplaints(complaintRows);
      setVisits(visitRows);
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, [repo]);

  const resolvedLogoUrl = useMemo(() => resolveAssetUrl(logoUrl, baseUrl), [logoUrl, baseUrl]);

  useEffect(() => {
    const root = baseUrl.startsWith("http://") || baseUrl.startsWith("https://") ? baseUrl : "";
    if (!root) {
      setPortalUrl("");
      return;
    }
    const params = new URLSearchParams();
    if (isTrialSandbox) params.set("t", trialSessionId);
    const q = params.toString();
    const base = `${root.replace(/\/$/, "")}/car-wash/check-in/${ownerId}`;
    setPortalUrl(q ? `${base}?${q}` : base);
  }, [baseUrl, ownerId, trialSessionId, isTrialSandbox]);

  useEffect(() => {
    if (!portalUrl) return;
    QRCode.toDataURL(portalUrl, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setPortalQr)
      .catch(() => setPortalQr(null));
  }, [portalUrl]);

  useEffect(() => {
    if (!portalQr) {
      setPosterPreviewUrl(null);
      return;
    }
    let cancelled = false;
    void createShopQrPosterDataUrl({
      qrDataUrl: portalQr,
      shopLabel: shopLabel.trim() || "คาร์แคร์",
      logoUrl: resolvedLogoUrl,
      tagline: "สแกน กรอกเบอร์ ยืนยันใช้บริการ — หักสิทธิ์อัตโนมัติ",
    })
      .then((url) => {
        if (!cancelled) setPosterPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPosterPreviewUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [portalQr, resolvedLogoUrl, shopLabel]);

  async function copyPortalLink() {
    if (!portalUrl) return;
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopyMsg("คัดลอกลิงก์แล้ว");
      setTimeout(() => setCopyMsg(null), 1800);
    } catch {
      setError("คัดลอกลิงก์ไม่สำเร็จ");
    }
  }

  async function downloadQrPng() {
    if (!portalUrl || !portalQr) return;
    setQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: portalQr,
        shopLabel: shopLabel.trim() || "คาร์แคร์",
        logoUrl: resolvedLogoUrl,
        tagline: "สแกน กรอกเบอร์ ยืนยันใช้บริการ — หักสิทธิ์อัตโนมัติ",
      });
      await downloadPosterPng(canvas, "car-wash-qr-poster.png");
    } finally {
      setQrBusy(false);
    }
  }

  async function downloadQrPdf() {
    if (!portalUrl || !portalQr) return;
    setQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: portalQr,
        shopLabel: shopLabel.trim() || "คาร์แคร์",
        logoUrl: resolvedLogoUrl,
        tagline: "สแกน กรอกเบอร์ ยืนยันใช้บริการ — หักสิทธิ์อัตโนมัติ",
      });
      await downloadPosterPdf(canvas, "car-wash-qr-poster-a4.pdf", "a4");
    } finally {
      setQrBusy(false);
    }
  }

  const complaintCountByStatus = useMemo(() => {
    return {
      pending: complaints.filter((x) => x.status === "Pending").length,
      progress: complaints.filter((x) => x.status === "In Progress").length,
      resolved: complaints.filter((x) => x.status === "Resolved").length,
    };
  }, [complaints]);

  const todayStats = useMemo(() => {
    const now = new Date();
    const isSameDay = (iso: string) => {
      const d = new Date(iso);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    };
    const todayRows = visits.filter((v) => isSameDay(v.visit_at));
    const uniqueCustomers = new Set(todayRows.map((v) => `${v.customer_name}|${v.plate_number}`)).size;
    const packageUses = todayRows.filter((v) => v.package_id != null).length;
    const revenue = todayRows.reduce((sum, v) => sum + v.final_price, 0);
    return {
      totalVisits: todayRows.length,
      uniqueCustomers,
      packageUses,
      revenue,
    };
  }, [visits]);

  function openCreatePackage() {
    setEditingPkg(null);
    setPkgForm({ name: "", price: "", duration_minutes: "", description: "", is_active: true });
    setShowPkgModal(true);
  }

  function openEditPackage(row: ServicePackage) {
    setEditingPkg(row);
    setPkgForm({
      name: row.name,
      price: String(row.price),
      duration_minutes: String(row.duration_minutes),
      description: row.description ?? "",
      is_active: row.is_active,
    });
    setShowPkgModal(true);
  }

  async function submitPackage(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(pkgForm.price);
    const duration = Number(pkgForm.duration_minutes);
    if (!pkgForm.name.trim() || !Number.isFinite(price) || !Number.isFinite(duration)) return;
    if (editingPkg) {
      await repo.updatePackage(editingPkg.id, {
        name: pkgForm.name.trim(),
        price,
        duration_minutes: duration,
        description: pkgForm.description.trim(),
        is_active: pkgForm.is_active,
      });
    } else {
      await repo.createPackage({
        name: pkgForm.name.trim(),
        price,
        duration_minutes: duration,
        description: pkgForm.description.trim(),
        is_active: pkgForm.is_active,
      });
    }
    setShowPkgModal(false);
    await loadAll();
  }

  async function removePackage(id: number) {
    if (!confirm("ยืนยันลบแพ็กเกจนี้?")) return;
    await repo.deletePackage(id);
    await loadAll();
  }

  async function submitComplaint(e: React.FormEvent) {
    e.preventDefault();
    if (!complaintForm.subject.trim() || !complaintForm.details.trim()) return;
    await repo.createComplaint({
      subject: complaintForm.subject.trim(),
      details: complaintForm.details.trim(),
      status: complaintForm.status,
      photo_url: complaintForm.photo_url.trim(),
    });
    setShowComplaintModal(false);
    setComplaintForm({ subject: "", details: "", status: "Pending", photo_url: "" });
    await loadAll();
  }

  async function changeComplaintStatus(status: ComplaintStatus) {
    if (!statusTarget) return;
    await repo.updateComplaint(statusTarget.id, { status });
    setStatusTarget(null);
    await loadAll();
  }

  async function removeComplaint(id: number) {
    if (!confirm("ยืนยันลบรายการร้องเรียนนี้?")) return;
    await repo.deleteComplaint(id);
    await loadAll();
  }

  function openVisitModal() {
    setError(null);
    setVisitLookupHint(null);
    setVisitForm({
      customer_lookup: "",
      customer_name: "",
      customer_phone: "",
      plate_number: "",
      package_id: "",
      bundle_id: "",
      final_price: "",
      note: "",
      recorded_by_override: "",
    });
    setShowVisitModal(true);
  }

  function runVisitLookup() {
    setError(null);
    const q = visitForm.customer_lookup.trim();
    if (!q) {
      setVisitLookupHint("กรุณากรอกเบอร์โทรหรือทะเบียนรถ");
      return;
    }
    const m = findCustomerLookupMatch(q, bundles, visits);
    if (m?.kind === "bundle") {
      const b = m.b;
      setVisitForm((s) => ({
        ...s,
        bundle_id: String(b.id),
        customer_name: b.customer_name,
        customer_phone: b.customer_phone,
        plate_number: b.plate_number,
        package_id: String(b.package_id),
        final_price: "0",
      }));
      setVisitLookupHint("พบข้อมูลจากแพ็กเกจเหมา — ระบบเติมข้อมูลแล้ว (ตัดสิทธิ์ 1 ครั้งเมื่อบันทึก)");
      return;
    }
    if (m?.kind === "visit") {
      const v = m.v;
      setVisitForm((s) => ({
        ...s,
        bundle_id: "",
        customer_name: v.customer_name,
        customer_phone: v.customer_phone || "",
        plate_number: v.plate_number,
        package_id: "",
        final_price: "",
      }));
      setVisitLookupHint("พบจากประวัติการใช้บริการ — เลือกแพ็กเกจหรือราคาด้านล่าง");
      return;
    }
    setVisitForm((s) => ({
      ...s,
      bundle_id: "",
      customer_name: "",
      customer_phone: "",
      plate_number: "",
      package_id: "",
      final_price: "",
      note: "",
    }));
    setVisitLookupHint("ไม่พบข้อมูล — กรอกชื่อ เบอร์ ทะเบียนเป็น Walk-in");
  }

  async function submitVisit(e: React.FormEvent) {
    e.preventDefault();
    const customerName = visitForm.customer_name.trim();
    const plateNumber = visitForm.plate_number.trim();
    const phoneDigits = visitForm.customer_phone.replace(/\D/g, "").trim();
    if (!customerName || !plateNumber) return;
    if (phoneDigits.length > 0 && phoneDigits.length < 9) {
      setError("เบอร์โทรต้องอย่างน้อย 9 หลัก หรือเว้นว่าง");
      return;
    }
    setError(null);
    const recordedBy = visitForm.recorded_by_override.trim() || recorderDisplayName;
    const bundleId = visitForm.bundle_id ? Number(visitForm.bundle_id) : null;
    if (bundleId != null) {
      const consumed = await repo.consumeBundleUse(bundleId);
      if (!consumed) {
        setError("แพ็กเกจเหมาไม่พร้อมใช้งาน หรือจำนวนครั้งคงเหลือหมดแล้ว");
        return;
      }
      await repo.createVisit({
        customer_name: customerName,
        customer_phone: consumed.customer_phone,
        plate_number: plateNumber,
        package_id: consumed.package_id,
        package_name: `เหมาจ่าย: ${consumed.package_name}`,
        listed_price: 0,
        final_price: 0,
        note: visitForm.note.trim(),
        recorded_by_name: recordedBy,
      });
      setShowVisitModal(false);
      setVisitLookupHint(null);
      setVisitForm({
        customer_lookup: "",
        customer_name: "",
        customer_phone: "",
        plate_number: "",
        package_id: "",
        bundle_id: "",
        final_price: "",
        note: "",
        recorded_by_override: "",
      });
      await loadAll();
      return;
    }
    const pkgId = visitForm.package_id ? Number(visitForm.package_id) : null;
    const pkg = pkgId != null ? packages.find((p) => p.id === pkgId) ?? null : null;
    const listedPrice = pkg?.price ?? 0;
    const finalPriceRaw = Number(visitForm.final_price);
    const finalPrice = Number.isFinite(finalPriceRaw) ? finalPriceRaw : listedPrice;
    await repo.createVisit({
      customer_name: customerName,
      customer_phone: phoneDigits,
      plate_number: plateNumber,
      package_id: pkg?.id ?? null,
      package_name: pkg?.name ?? "บริการพิเศษ",
      listed_price: listedPrice,
      final_price: finalPrice,
      note: visitForm.note.trim(),
      recorded_by_name: recordedBy,
    });
    setShowVisitModal(false);
    setVisitLookupHint(null);
    setVisitForm({
      customer_lookup: "",
      customer_name: "",
      customer_phone: "",
      plate_number: "",
      package_id: "",
      bundle_id: "",
      final_price: "",
      note: "",
      recorded_by_override: "",
    });
    await loadAll();
  }

  async function removeVisit(id: number) {
    if (!confirm("ยืนยันลบบันทึกการใช้บริการนี้?")) return;
    await repo.deleteVisit(id);
    await loadAll();
  }

  async function submitBundle(e: React.FormEvent) {
    e.preventDefault();
    const totalUses = Number(bundleForm.total_uses);
    const paidAmount = Number(bundleForm.paid_amount);
    const customerName = bundleForm.customer_name.trim();
    const customerPhone = bundleForm.customer_phone.replace(/\D/g, "").trim();
    const plateNumber = bundleForm.plate_number.trim();
    const packageId = Number(bundleForm.package_id);
    const selectedPackage = packages.find((p) => p.id === packageId) ?? null;
    if (!customerName || !plateNumber || !selectedPackage) return;
    if (customerPhone.length < 9) {
      setError("สมัครแพ็กเกจเหมาต้องใส่เบอร์โทรลูกค้าอย่างน้อย 9 หลัก");
      return;
    }
    if (!Number.isFinite(totalUses) || totalUses <= 0) return;
    if (!Number.isFinite(paidAmount) || paidAmount < 0) return;
    setError(null);
    await repo.createBundle({
      customer_name: customerName,
      customer_phone: customerPhone,
      plate_number: plateNumber,
      package_id: selectedPackage.id,
      package_name: selectedPackage.name,
      paid_amount: paidAmount,
      total_uses: totalUses,
      is_active: bundleForm.is_active,
    });
    setShowBundleModal(false);
    setBundleForm({
      customer_name: "",
      customer_phone: "",
      plate_number: "",
      package_id: "",
      paid_amount: "1000",
      total_uses: "10",
      is_active: true,
    });
    await loadAll();
  }

  async function removeBundle(id: number) {
    if (!confirm("ยืนยันลบแพ็กเกจเหมารายการนี้?")) return;
    await repo.deleteBundle(id);
    await loadAll();
  }

  return (
    <div className="space-y-6">
      <div className="app-surface sticky top-2 z-20 rounded-2xl p-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "overview" as const, label: "ภาพรวมวันนี้" },
            { key: "visits" as const, label: "บันทึกการใช้บริการ" },
            { key: "packages" as const, label: "แพ็กเกจบริการ" },
            { key: "bundles" as const, label: "แพ็กเกจเหมา" },
            { key: "complaints" as const, label: "ร้องเรียน/ข้อเสนอแนะ" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                tab === item.key
                  ? "bg-[#ecebff] text-[#4d47b6]"
                  : "app-btn-soft text-[#66638c]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="app-surface rounded-2xl p-5">
        <h1 className="text-2xl font-bold text-[#2e2a58]">ระบบจัดการคาร์แคร์</h1>
        <p className="mt-1 text-sm text-[#66638c]">แพ็กเกจบริการ · บันทึกการเข้ารับบริการ · ร้องเรียนและการปรับปรุงคุณภาพ</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openVisitModal}
            className="app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold"
          >
            {icon("add")} บันทึกการใช้บริการ
          </button>
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6]"
          >
            QR ให้ลูกค้าเช็กอิน
          </button>
        </div>
      </div>

      {tab === "overview" ? (
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">สถิติวันนี้</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="app-surface-strong rounded-2xl p-4">
            <p className="text-xs text-[#66638c]">ลูกค้าวันนี้ (ไม่ซ้ำ)</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{todayStats.uniqueCustomers}</p>
          </div>
          <div className="app-surface-strong rounded-2xl p-4">
            <p className="text-xs text-[#66638c]">เข้าใช้บริการรวม</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#4d47b6]">{todayStats.totalVisits}</p>
          </div>
          <div className="app-surface-strong rounded-2xl p-4">
            <p className="text-xs text-[#66638c]">ใช้แพ็กเกจ</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{todayStats.packageUses}</p>
          </div>
          <div className="app-surface-strong rounded-2xl p-4">
            <p className="text-xs text-[#66638c]">รายรับวันนี้</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-amber-800">
              ฿ {todayStats.revenue.toLocaleString()}
            </p>
          </div>
        </div>
      </section>
      ) : null}

      {tab === "visits" || tab === "overview" ? (
      <section className="app-surface rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#2e2a58]">รายการใช้บริการล่าสุด</h2>
        </div>
        <div className="overflow-x-auto rounded-xl border border-[#e1e3ff]">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-[#f4f3ff] text-[#4d47b6]">
              <tr>
                <th className="px-3 py-2 text-left">เวลา</th>
                <th className="px-3 py-2 text-left">ลูกค้า</th>
                <th className="px-3 py-2 text-left">เบอร์โทร</th>
                <th className="px-3 py-2 text-left">ทะเบียน</th>
                <th className="px-3 py-2 text-left">แพ็กเกจ</th>
                <th className="px-3 py-2 text-left">ราคา</th>
                <th className="px-3 py-2 text-left">ผู้บันทึก</th>
                <th className="px-3 py-2 text-left">รายละเอียด</th>
                <th className="px-3 py-2 text-right">ลบ</th>
              </tr>
            </thead>
            <tbody>
              {visits.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-[#66638c]" colSpan={9}>
                    ยังไม่มีบันทึกการใช้บริการ
                  </td>
                </tr>
              ) : (
                visits.map((v) => (
                  <tr key={v.id} className="border-t border-[#ecebff]">
                    <td className="px-3 py-2 text-[#66638c]">{new Date(v.visit_at).toLocaleString("th-TH")}</td>
                    <td className="px-3 py-2 font-semibold text-[#2e2a58]">{v.customer_name}</td>
                    <td className="px-3 py-2 tabular-nums text-[#5f5a8a]">{v.customer_phone || "-"}</td>
                    <td className="px-3 py-2 text-[#5f5a8a]">{v.plate_number}</td>
                    <td className="px-3 py-2 text-[#5f5a8a]">{v.package_name}</td>
                    <td className="px-3 py-2 font-semibold text-amber-800">฿ {v.final_price.toLocaleString()}</td>
                    <td className="px-3 py-2 text-[#5f5a8a]">{v.recorded_by_name || "-"}</td>
                    <td className="px-3 py-2 text-[#5f5a8a]">{v.note || "-"}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => void removeVisit(v.id)}
                        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        {icon("delete")} ลบ
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      ) : null}

      {tab === "packages" || tab === "bundles" || tab === "complaints" ? (
        <section className="app-surface rounded-2xl p-4">
          {loading ? <p className="text-sm text-[#66638c]">กำลังโหลด...</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {!loading && tab === "packages" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#2e2a58]">แพ็กเกจบริการ</h2>
                <button type="button" onClick={openCreatePackage} className="app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold">
                  {icon("add")} เพิ่มแพ็กเกจ
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {packages.map((p) => (
                  <article key={p.id} className="app-surface-strong rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-[#2e2a58]">{p.name}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          p.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {p.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#5f5a8a]">{p.description || "-"}</p>
                    <p className="mt-3 text-sm font-medium text-[#4d47b6]">฿ {p.price.toLocaleString()}</p>
                    <p className="text-xs text-[#66638c]">{p.duration_minutes} นาที</p>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => openEditPackage(p)} className="app-btn-soft rounded-lg px-3 py-1.5 text-xs font-semibold">
                        {icon("edit")} แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => void removePackage(p.id)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        {icon("delete")} ลบ
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {!loading && tab === "complaints" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[#2e2a58]">ร้องเรียน / ข้อเสนอแนะจากลูกค้า</h2>
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(true)}
                  className="app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold"
                >
                  {icon("add")} เพิ่มรายการร้องเรียน
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="app-surface-strong rounded-xl p-3 text-sm">รอดำเนินการ: {complaintCountByStatus.pending}</div>
                <div className="app-surface-strong rounded-xl p-3 text-sm">กำลังดำเนินการ: {complaintCountByStatus.progress}</div>
                <div className="app-surface-strong rounded-xl p-3 text-sm">แก้ไขแล้ว: {complaintCountByStatus.resolved}</div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#e1e3ff]">
                <table className="min-w-[760px] w-full text-sm">
                  <thead className="bg-[#f4f3ff] text-[#4d47b6]">
                    <tr>
                      <th className="px-3 py-2 text-left">หัวข้อ</th>
                      <th className="px-3 py-2 text-left">รายละเอียด</th>
                      <th className="px-3 py-2 text-left">วันที่แจ้ง</th>
                      <th className="px-3 py-2 text-left">สถานะ</th>
                      <th className="px-3 py-2 text-left">รูป</th>
                      <th className="px-3 py-2 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((c) => (
                      <tr key={c.id} className="border-t border-[#ecebff]">
                        <td className="px-3 py-2 font-semibold text-[#2e2a58]">{c.subject}</td>
                        <td className="px-3 py-2 text-[#5f5a8a]">{c.details}</td>
                        <td className="px-3 py-2 text-[#66638c]">
                          {new Date(c.created_at).toLocaleString("th-TH")}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(c.status)}`}>
                            {statusLabelTh(c.status)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[#66638c]">{c.photo_url || "-"}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              onClick={() => setStatusTarget(c)}
                              className="app-btn-soft rounded-lg px-2.5 py-1 text-xs font-semibold"
                            >
                              {icon("status")} เปลี่ยนสถานะ
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeComplaint(c.id)}
                              className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                            >
                              {icon("delete")} ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {!loading && tab === "bundles" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-[#2e2a58]">แพ็กเกจเหมา (ซื้อครั้งเดียว ใช้ได้หลายครั้ง)</h2>
                <button
                  type="button"
                  onClick={() => setShowBundleModal(true)}
                  className="app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold"
                >
                  {icon("add")} เพิ่มแพ็กเกจเหมา
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#e1e3ff]">
                <table className="min-w-[860px] w-full text-sm">
                  <thead className="bg-[#f4f3ff] text-[#4d47b6]">
                    <tr>
                      <th className="px-3 py-2 text-left">ลูกค้า</th>
                      <th className="px-3 py-2 text-left">เบอร์โทร</th>
                      <th className="px-3 py-2 text-left">ทะเบียน</th>
                      <th className="px-3 py-2 text-left">แพ็กเกจ</th>
                      <th className="px-3 py-2 text-left">ยอดชำระ</th>
                      <th className="px-3 py-2 text-left">คงเหลือ</th>
                      <th className="px-3 py-2 text-left">สถานะ</th>
                      <th className="px-3 py-2 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundles.length === 0 ? (
                      <tr>
                        <td className="px-3 py-3 text-[#66638c]" colSpan={8}>
                          ยังไม่มีแพ็กเกจเหมา
                        </td>
                      </tr>
                    ) : (
                      bundles.map((b) => {
                        const remaining = Math.max(0, b.total_uses - b.used_uses);
                        const canUse = b.is_active && remaining > 0;
                        return (
                          <tr key={b.id} className="border-t border-[#ecebff]">
                            <td className="px-3 py-2 font-semibold text-[#2e2a58]">{b.customer_name}</td>
                            <td className="px-3 py-2 text-[#5f5a8a]">{b.customer_phone || "-"}</td>
                            <td className="px-3 py-2 text-[#5f5a8a]">{b.plate_number}</td>
                            <td className="px-3 py-2 text-[#5f5a8a]">{b.package_name}</td>
                            <td className="px-3 py-2 font-semibold text-amber-800">฿ {b.paid_amount.toLocaleString()}</td>
                            <td className="px-3 py-2 text-[#5f5a8a]">
                              {remaining} / {b.total_uses}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  canUse ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                                }`}
                              >
                                {canUse ? "ใช้งานได้" : "หมดสิทธิ์"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => void removeBundle(b.id)}
                                className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                              >
                                {icon("delete")} ลบ
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {showPkgModal ? (
        <Modal title={editingPkg ? "แก้ไขแพ็กเกจ" : "เพิ่มแพ็กเกจ"} onClose={() => setShowPkgModal(false)}>
          <form className="space-y-3" onSubmit={(e) => void submitPackage(e)}>
            <input
              className="app-input w-full rounded-xl px-3 py-2 text-sm"
              placeholder="ชื่อแพ็กเกจ"
              value={pkgForm.name}
              onChange={(e) => setPkgForm((s) => ({ ...s, name: e.target.value }))}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                type="number"
                placeholder="ราคา"
                value={pkgForm.price}
                onChange={(e) => setPkgForm((s) => ({ ...s, price: e.target.value }))}
                required
              />
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                type="number"
                placeholder="ระยะเวลา (นาที)"
                value={pkgForm.duration_minutes}
                onChange={(e) => setPkgForm((s) => ({ ...s, duration_minutes: e.target.value }))}
                required
              />
            </div>
            <textarea
              className="app-input w-full rounded-xl px-3 py-2 text-sm"
              placeholder="รายละเอียด"
              value={pkgForm.description}
              onChange={(e) => setPkgForm((s) => ({ ...s, description: e.target.value }))}
              rows={3}
            />
            <label className="flex items-center gap-2 text-sm text-[#55517d]">
              <input
                type="checkbox"
                checked={pkgForm.is_active}
                onChange={(e) => setPkgForm((s) => ({ ...s, is_active: e.target.checked }))}
              />
              เปิดใช้งานแพ็กเกจ
            </label>
            <div className="flex justify-end">
              <button type="submit" className="app-btn-primary rounded-xl px-4 py-2 text-sm font-semibold">
                บันทึก
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {showComplaintModal ? (
        <Modal title="เพิ่มรายการร้องเรียน" onClose={() => setShowComplaintModal(false)}>
          <form className="space-y-3" onSubmit={(e) => void submitComplaint(e)}>
            <input
              className="app-input w-full rounded-xl px-3 py-2 text-sm"
              placeholder="หัวข้อ"
              value={complaintForm.subject}
              onChange={(e) => setComplaintForm((s) => ({ ...s, subject: e.target.value }))}
              required
            />
            <textarea
              className="app-input w-full rounded-xl px-3 py-2 text-sm"
              placeholder="รายละเอียด"
              value={complaintForm.details}
              onChange={(e) => setComplaintForm((s) => ({ ...s, details: e.target.value }))}
              rows={4}
              required
            />
            <select
              className="app-input w-full rounded-xl px-3 py-2 text-sm"
              value={complaintForm.status}
              onChange={(e) => setComplaintForm((s) => ({ ...s, status: e.target.value as ComplaintStatus }))}
            >
              <option value="Pending">รอดำเนินการ</option>
              <option value="In Progress">กำลังดำเนินการ</option>
              <option value="Resolved">แก้ไขแล้ว</option>
            </select>
            <input
              className="app-input w-full rounded-xl px-3 py-2 text-sm"
              placeholder="ลิงก์รูปภาพ (ถ้ามี)"
              value={complaintForm.photo_url}
              onChange={(e) => setComplaintForm((s) => ({ ...s, photo_url: e.target.value }))}
            />
            <div className="flex justify-end">
              <button type="submit" className="app-btn-primary rounded-xl px-4 py-2 text-sm font-semibold">
                บันทึก
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {statusTarget ? (
        <Modal title={`เปลี่ยนสถานะ: ${statusTarget.subject}`} onClose={() => setStatusTarget(null)}>
          <div className="space-y-2">
            {(["Pending", "In Progress", "Resolved"] as ComplaintStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                className="app-btn-soft block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold"
                onClick={() => void changeComplaintStatus(s)}
              >
                {statusLabelTh(s)}
              </button>
            ))}
          </div>
        </Modal>
      ) : null}

      {showVisitModal ? (
        <Modal
          title="บันทึกการใช้บริการ"
          onClose={() => {
            setShowVisitModal(false);
            setVisitLookupHint(null);
          }}
        >
          <form className="space-y-3" onSubmit={(e) => void submitVisit(e)}>
            <div className="rounded-xl border border-[#e1e3ff] bg-[#f8f8ff] px-3 py-2 text-sm">
              <p className="text-xs font-semibold text-[#4d47b6]">ผู้บันทึก</p>
              <p className="mt-0.5 font-medium text-[#2e2a58]">{recorderDisplayName}</p>
              <input
                className="app-input mt-2 w-full rounded-xl px-3 py-2 text-sm"
                placeholder="แก้ชื่อผู้บันทึก (ถ้าไม่ใช่ผู้ใช้นี้)"
                value={visitForm.recorded_by_override}
                onChange={(e) => setVisitForm((s) => ({ ...s, recorded_by_override: e.target.value }))}
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-[#4d47b6]">ค้นหาจากเบอร์โทรหรือทะเบียน</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="app-input min-w-0 flex-1 rounded-xl px-3 py-2 text-sm"
                  placeholder="เช่น 0812345678 หรือ กข 1234"
                  value={visitForm.customer_lookup}
                  onChange={(e) => setVisitForm((s) => ({ ...s, customer_lookup: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={runVisitLookup}
                  className="app-btn-soft shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-[#4d47b6]"
                >
                  ค้นหา
                </button>
              </div>
              {visitLookupHint ? <p className="mt-1 text-xs text-[#5f5a8a]">{visitLookupHint}</p> : null}
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <select
              className="app-input w-full rounded-xl px-3 py-2 text-sm"
              value={visitForm.bundle_id}
              onChange={(e) => {
                const bundleId = e.target.value;
                const selected = bundleId ? activeBundles.find((b) => b.id === Number(bundleId)) ?? null : null;
                setVisitForm((s) => ({
                  ...s,
                  bundle_id: bundleId,
                  customer_name: selected?.customer_name ?? s.customer_name,
                  customer_phone: selected?.customer_phone ?? s.customer_phone,
                  plate_number: selected?.plate_number ?? s.plate_number,
                  package_id: selected ? String(selected.package_id) : s.package_id,
                  final_price: selected ? "0" : s.final_price,
                }));
              }}
            >
              <option value="">เลือกลูกค้าเหมาจ่าย (ระบบเติมข้อมูลอัตโนมัติ)</option>
              {activeBundles.map((b) => {
                const remaining = b.total_uses - b.used_uses;
                return (
                  <option key={b.id} value={b.id}>
                    {b.customer_name} / {b.plate_number} / {b.package_name} - เหลือ {remaining} ครั้ง
                  </option>
                );
              })}
            </select>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                placeholder="ชื่อลูกค้า (Walk-in กรอกเอง)"
                value={visitForm.customer_name}
                onChange={(e) => setVisitForm((s) => ({ ...s, customer_name: e.target.value }))}
                required
                disabled={Boolean(visitForm.bundle_id)}
              />
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                placeholder="เบอร์โทร (ไม่บังคับ — อย่างน้อย 9 หลักถ้ากรอก)"
                value={visitForm.customer_phone}
                onChange={(e) =>
                  setVisitForm((s) => ({ ...s, customer_phone: e.target.value.replace(/\D/g, "").slice(0, 15) }))
                }
                inputMode="numeric"
                disabled={Boolean(visitForm.bundle_id)}
              />
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm sm:col-span-2"
                placeholder="ทะเบียนรถ"
                value={visitForm.plate_number}
                onChange={(e) => setVisitForm((s) => ({ ...s, plate_number: e.target.value }))}
                required
                disabled={Boolean(visitForm.bundle_id)}
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                value={visitForm.package_id}
                onChange={(e) => {
                  const pkgId = e.target.value;
                  const pkg = pkgId ? packages.find((p) => p.id === Number(pkgId)) ?? null : null;
                  setVisitForm((s) => ({
                    ...s,
                    package_id: pkgId,
                    bundle_id: s.bundle_id,
                    final_price: pkg ? String(pkg.price) : s.final_price,
                  }));
                }}
                disabled={Boolean(visitForm.bundle_id)}
              >
                <option value="">เลือกแพ็กเกจ (หรือบริการพิเศษ)</option>
                {packages
                  .filter((p) => p.is_active)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (฿ {p.price})
                    </option>
                  ))}
              </select>
              <div className="rounded-xl border border-[#e1e3ff] bg-[#f8f8ff] px-3 py-2 text-xs text-[#5f5a8a]">
                {visitForm.bundle_id
                  ? "เลือกแพ็กเกจเหมาแล้ว ระบบจะหักสิทธิ์อัตโนมัติ 1 ครั้ง"
                  : "ถ้าไม่เลือกเหมาจ่าย ให้เลือกแพ็กเกจหรือกรอกราคาเอง"}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                placeholder="ราคาที่คิดจริง"
                type="number"
                value={visitForm.final_price}
                onChange={(e) => setVisitForm((s) => ({ ...s, final_price: e.target.value }))}
                disabled={Boolean(visitForm.bundle_id)}
              />
            </div>
            <textarea
              className="app-input w-full rounded-xl px-3 py-2 text-sm"
              placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
              value={visitForm.note}
              onChange={(e) => setVisitForm((s) => ({ ...s, note: e.target.value }))}
              rows={3}
            />
            <div className="flex justify-end">
              <button type="submit" className="app-btn-primary rounded-xl px-4 py-2 text-sm font-semibold">
                บันทึก
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {showBundleModal ? (
        <Modal title="เพิ่มแพ็กเกจเหมา" onClose={() => setShowBundleModal(false)}>
          <form className="space-y-3" onSubmit={(e) => void submitBundle(e)}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                placeholder="ชื่อลูกค้า"
                value={bundleForm.customer_name}
                onChange={(e) => setBundleForm((s) => ({ ...s, customer_name: e.target.value }))}
                required
              />
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                placeholder="เบอร์โทรลูกค้า"
                value={bundleForm.customer_phone}
                onChange={(e) =>
                  setBundleForm((s) => ({ ...s, customer_phone: e.target.value.replace(/\D/g, "").slice(0, 15) }))
                }
                inputMode="numeric"
                required
              />
            </div>
            <p className="text-xs text-[#66638c]">เบอร์โทรนี้จะใช้สำหรับค้นหาและให้ลูกค้าเช็กอินผ่าน QR</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                placeholder="ทะเบียนรถ"
                value={bundleForm.plate_number}
                onChange={(e) => setBundleForm((s) => ({ ...s, plate_number: e.target.value }))}
                required
              />
              <select
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                value={bundleForm.package_id}
                onChange={(e) => {
                  const packageId = e.target.value;
                  const selectedPackage = packageId
                    ? packages.find((p) => p.id === Number(packageId)) ?? null
                    : null;
                  setBundleForm((s) => ({
                    ...s,
                    package_id: packageId,
                    paid_amount: selectedPackage ? String(selectedPackage.price) : s.paid_amount,
                  }));
                }}
                required
              >
                <option value="">เลือกแพ็กเกจบริการ</option>
                {packages
                  .filter((p) => p.is_active)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (฿ {p.price})
                    </option>
                  ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                placeholder="ยอดชำระรวม"
                type="number"
                value={bundleForm.paid_amount}
                onChange={(e) => setBundleForm((s) => ({ ...s, paid_amount: e.target.value }))}
                required
              />
              <input
                className="app-input w-full rounded-xl px-3 py-2 text-sm"
                placeholder="จำนวนครั้งที่ใช้ได้"
                type="number"
                value={bundleForm.total_uses}
                onChange={(e) => setBundleForm((s) => ({ ...s, total_uses: e.target.value }))}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#55517d]">
              <input
                type="checkbox"
                checked={bundleForm.is_active}
                onChange={(e) => setBundleForm((s) => ({ ...s, is_active: e.target.checked }))}
              />
              เปิดใช้งานแพ็กเกจนี้
            </label>
            <div className="flex justify-end">
              <button type="submit" className="app-btn-primary rounded-xl px-4 py-2 text-sm font-semibold">
                บันทึก
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {showQrModal ? (
        <Modal title="QR สำหรับลูกค้าเช็กอินคาร์แคร์" onClose={() => setShowQrModal(false)}>
          <div className="space-y-3">
            <p className="text-sm text-[#5f5a8a]">เทมเพลตเดียวกับร้านตัดผม: ลูกค้าสแกน กรอกเบอร์ และยืนยันใช้สิทธิ์</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copyPortalLink()}
                className="app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6]"
              >
                คัดลอกลิงก์
              </button>
              <button
                type="button"
                disabled={qrBusy || !portalUrl}
                onClick={() => void downloadQrPdf()}
                className="app-btn-primary rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60"
              >
                ดาวน์โหลด PDF (A4)
              </button>
              <button
                type="button"
                disabled={qrBusy || !portalUrl}
                onClick={() => void downloadQrPng()}
                className="app-btn-soft rounded-xl px-3 py-2 text-sm font-semibold text-[#4d47b6] disabled:opacity-60"
              >
                ดาวน์โหลด PNG
              </button>
            </div>
            {copyMsg ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">{copyMsg}</p> : null}
            <p className="break-all rounded-lg bg-[#f8f8ff] px-3 py-2 text-xs text-[#4d47b6]">{portalUrl || "-"}</p>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-4">
              {posterPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={posterPreviewUrl} alt="ตัวอย่างโปสเตอร์ QR คาร์แคร์" className="mx-auto w-[340px] rounded-3xl shadow-md" />
              ) : (
                <div className="mx-auto flex h-[560px] w-[340px] items-center justify-center rounded-3xl border border-slate-300 bg-white text-xs text-slate-500">
                  กำลังเรนเดอร์ตัวอย่าง...
                </div>
              )}
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#271f54]/45 p-4">
      <div className="app-surface-strong w-full max-w-lg rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#2e2a58]">{title}</h3>
          <button type="button" onClick={onClose} className="app-btn-soft rounded-lg px-2 py-1 text-sm">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
