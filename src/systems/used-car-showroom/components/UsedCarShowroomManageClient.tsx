"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Car, Filter, Plus } from "lucide-react";
import {
  AppEmptyState,
  AppImageThumb,
  AppImageLightbox,
  prepareImageFileForUpload,
  useAppImageLightbox,
  useAppNoticePopup,
  useAppYoutubeLightbox,
  AppYoutubeLightbox,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { bangkokDateKey } from "@/lib/time/bangkok";
import {
  USED_CAR_SHOWROOM_MANAGE_TAB_ITEMS,
  parseUsedCarShowroomManageTab,
  usedCarShowroomManageHref,
  type UsedCarShowroomManageTabKey,
} from "@/systems/used-car-showroom/used-car-showroom-module-nav";
import { UsedCarShowroomPageSubNav } from "@/systems/used-car-showroom/components/UsedCarShowroomPageSubNav";
import {
  usedCarShowroomCardIconTileClass,
  usedCarShowroomTonedRowCardClass,
} from "@/systems/used-car-showroom/lib/card-tones";
import type { UsedCarShopDto } from "@/systems/used-car-showroom/lib/mappers";
import {
  usedCarShowroomManageTabIcon,
  usedCarShowroomPageTitleIcon,
  usedCarShowroomPageTitleTone,
} from "@/systems/used-car-showroom/lib/page-menu-icons";
import { usedCarCostKindLabel, usedCarVehicleStatusLabel, usedCarVehicleStatusTone } from "@/systems/used-car-showroom/lib/status";
import {
  USED_CAR_PAYMENT_METHODS,
  usedCarPaymentMethodLabel,
  type UsedCarPaymentMethod,
} from "@/systems/used-car-showroom/lib/payment-method";
import {
  usedCarShowroomFieldClass,
  usedCarShowroomFilterChipClass,
  usedCarShowroomFilterChipShellClass,
  usedCarShowroomOutlineButtonClass,
  usedCarShowroomPageStackClass,
  usedCarShowroomPrimaryButtonClass,
  usedCarShowroomTextareaClass,
  usedCarShowroomYoutubeCardGridClass,
} from "@/systems/used-car-showroom/lib/ui-tokens";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";

type Vehicle = {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number | null;
  status: string;
  statusLabel: string;
  purchaseCostBaht: number;
  askingPriceBaht: number;
  prepCostBaht: number;
  coverImageUrl: string | null;
  description: string | null;
  plateNumber: string | null;
  images: { id: string; imageUrl: string; isCover: boolean }[];
  videos: { id: string; title: string; youtubeUrl: string }[];
  costLines: { id: string; kind: string; label: string; amountBaht: number }[];
};

type Customer = {
  id: string;
  fullName: string;
  phone: string;
  lineId: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
};

type Staff = {
  id: string;
  fullName: string;
  role: string;
  phone: string | null;
  commissionPercent: number;
  bonusNote: string | null;
  isActive: boolean;
  note: string | null;
};

type Promo = {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  valueBaht: number;
  valuePercent: number;
  giftLabel: string | null;
  startsOn: string;
  endsOn: string;
  isActive: boolean;
};

type Company = {
  id: string;
  name: string;
  contactName: string | null;
  contactPhone: string | null;
  note: string | null;
  isActive: boolean;
};

const MANAGE_TABS = USED_CAR_SHOWROOM_MANAGE_TAB_ITEMS.map((i) => ({
  ...i,
  icon: usedCarShowroomManageTabIcon(i.key),
}));

const VEHICLE_STATUSES = ["PREP", "FOR_SALE", "RESERVED", "SOLD", "DELIVERED"] as const;

function baht(n: number) {
  return `฿${n.toLocaleString("th-TH")}`;
}

function matchKw(hay: string, kw: string) {
  if (!kw.trim()) return true;
  return hay.toLowerCase().includes(kw.trim().toLowerCase());
}

const emptyVehicleForm = {
  brand: "",
  model: "",
  year: "",
  askingPriceBaht: "",
  purchaseCostBaht: "",
  plateNumber: "",
  description: "",
  status: "PREP",
};

const emptyCustomerForm = {
  fullName: "",
  phone: "",
  lineId: "",
  email: "",
  address: "",
  note: "",
};

const emptyStaffForm = {
  fullName: "",
  phone: "",
  role: "SALES",
  commissionPercent: "0",
  bonusNote: "",
  isActive: true,
  note: "",
};

function emptyPromoForm() {
  const today = bangkokDateKey();
  const end = bangkokDateKey(new Date(Date.now() + 30 * 864e5));
  return {
    title: "",
    description: "",
    kind: "AMOUNT",
    valueBaht: "",
    valuePercent: "",
    giftLabel: "",
    startsOn: today,
    endsOn: end,
    isActive: true,
  };
}

const emptyCompanyForm = {
  name: "",
  contactName: "",
  contactPhone: "",
  note: "",
  isActive: true,
};

function addLabel(tab: UsedCarShowroomManageTabKey): string {
  switch (tab) {
    case "vehicles":
      return "เพิ่มรถ";
    case "customers":
      return "เพิ่มลูกค้า";
    case "staff":
      return "เพิ่มพนักงาน";
    case "promotions":
      return "เพิ่มโปร";
    case "finance-companies":
      return "เพิ่มไฟแนนซ์";
    default:
      return "เพิ่ม";
  }
}

export function UsedCarShowroomManageClient({ initialShop }: { initialShop: UsedCarShopDto }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseUsedCarShowroomManageTab(searchParams.get("tab"));
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();
  const yt = useAppYoutubeLightbox();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const [filterOpen, setFilterOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [keyword, setKeyword] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);
  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [promoForm, setPromoForm] = useState(emptyPromoForm);
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
  const [busy, setBusy] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [costKind, setCostKind] = useState("REPAIR");
  const [costAmount, setCostAmount] = useState("");
  const [costLabel, setCostLabel] = useState("");
  const [ytUrl, setYtUrl] = useState("");

  const [sellOpen, setSellOpen] = useState(false);
  const [sellBusy, setSellBusy] = useState(false);
  const [sellForm, setSellForm] = useState({
    vehicleId: "",
    salePriceBaht: "",
    discountBaht: "",
    paymentMethod: "CASH" as UsedCarPaymentMethod,
    customerId: "",
  });

  const setTab = (next: UsedCarShowroomManageTabKey) => {
    router.push(usedCarShowroomManageHref(next));
  };

  useEffect(() => {
    setFilterOpen(true);
    setStatusFilter("ALL");
    setKeyword("");
    setAddOpen(false);
    setEditId(null);
  }, [tab]);

  const load = useCallback(async () => {
    try {
      const [v, c, s, p, f] = await Promise.all([
        fetch("/api/used-car-showroom/session/vehicles", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/used-car-showroom/session/customers", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/used-car-showroom/session/staff", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/used-car-showroom/session/promotions", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/used-car-showroom/session/finance-companies", { credentials: "include" }).then((r) => r.json()),
      ]);
      setVehicles(Array.isArray(v.vehicles) ? v.vehicles : []);
      setCustomers(Array.isArray(c.customers) ? c.customers : []);
      setStaff(Array.isArray(s.staff) ? s.staff : []);
      setPromos(Array.isArray(p.promotions) ? p.promotions : []);
      setCompanies(Array.isArray(f.companies) ? f.companies : []);
    } catch (e) {
      console.error(e);
      notice.error("โหลดข้อมูลไม่สำเร็จ");
    }
  }, [notice]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtersActive = statusFilter !== "ALL" || Boolean(keyword.trim());

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (statusFilter !== "ALL" && v.status !== statusFilter) return false;
      return matchKw(`${v.title} ${v.plateNumber ?? ""} ${v.description ?? ""}`, keyword);
    });
  }, [vehicles, statusFilter, keyword]);

  const pnlRows = useMemo(
    () =>
      filteredVehicles.map((row) => ({
        id: row.id,
        title: row.title,
        purchaseCostBaht: row.purchaseCostBaht,
        prepCostBaht: row.prepCostBaht,
        salePriceBaht: row.askingPriceBaht,
        profitBaht: row.askingPriceBaht - row.purchaseCostBaht - row.prepCostBaht,
        statusLabel: row.statusLabel,
        status: row.status,
      })),
    [filteredVehicles],
  );

  const filteredCustomers = useMemo(
    () => customers.filter((c) => matchKw(`${c.fullName} ${c.phone} ${c.lineId ?? ""}`, keyword)),
    [customers, keyword],
  );

  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      if (statusFilter === "ACTIVE" && !s.isActive) return false;
      if (statusFilter === "INACTIVE" && s.isActive) return false;
      return matchKw(`${s.fullName} ${s.phone ?? ""} ${s.role}`, keyword);
    });
  }, [staff, statusFilter, keyword]);

  const filteredPromos = useMemo(() => {
    return promos.filter((p) => {
      if (statusFilter === "ACTIVE" && !p.isActive) return false;
      if (statusFilter === "INACTIVE" && p.isActive) return false;
      return matchKw(`${p.title} ${p.description ?? ""}`, keyword);
    });
  }, [promos, statusFilter, keyword]);

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (statusFilter === "ACTIVE" && !c.isActive) return false;
      if (statusFilter === "INACTIVE" && c.isActive) return false;
      return matchKw(`${c.name} ${c.contactPhone ?? ""} ${c.contactName ?? ""}`, keyword);
    });
  }, [companies, statusFilter, keyword]);

  const selected = editId ? vehicles.find((v) => v.id === editId) ?? null : null;

  function resetAddForms() {
    setVehicleForm(emptyVehicleForm);
    setCustomerForm(emptyCustomerForm);
    setStaffForm(emptyStaffForm);
    setPromoForm(emptyPromoForm());
    setCompanyForm(emptyCompanyForm);
  }

  function clearFilters() {
    setStatusFilter("ALL");
    setKeyword("");
  }

  async function saveAdd() {
    setBusy(true);
    try {
      if (tab === "vehicles") {
        if (!vehicleForm.brand.trim() || !vehicleForm.model.trim()) {
          notice.error("กรอกยี่ห้อและรุ่น");
          return;
        }
        const res = await fetch("/api/used-car-showroom/session/vehicles", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand: vehicleForm.brand,
            model: vehicleForm.model,
            year: vehicleForm.year ? Number(vehicleForm.year) : null,
            askingPriceBaht: Number(vehicleForm.askingPriceBaht) || 0,
            purchaseCostBaht: Number(vehicleForm.purchaseCostBaht) || 0,
            plateNumber: vehicleForm.plateNumber || null,
            description: vehicleForm.description || null,
            status: vehicleForm.status,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          notice.error(data.error || "บันทึกไม่สำเร็จ");
          return;
        }
      } else if (tab === "customers") {
        if (!customerForm.fullName.trim() || !customerForm.phone.trim()) {
          notice.error("กรอกชื่อและเบอร์");
          return;
        }
        const res = await fetch("/api/used-car-showroom/session/customers", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: customerForm.fullName,
            phone: customerForm.phone,
            lineId: customerForm.lineId || null,
            email: customerForm.email || null,
            address: customerForm.address || null,
            note: customerForm.note || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          notice.error(data.error || "บันทึกไม่สำเร็จ");
          return;
        }
      } else if (tab === "staff") {
        if (!staffForm.fullName.trim()) {
          notice.error("กรอกชื่อพนักงาน");
          return;
        }
        const res = await fetch("/api/used-car-showroom/session/staff", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: staffForm.fullName,
            phone: staffForm.phone || null,
            role: staffForm.role,
            commissionPercent: Number(staffForm.commissionPercent) || 0,
            bonusNote: staffForm.bonusNote || null,
            isActive: staffForm.isActive,
            note: staffForm.note || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          notice.error(data.error || "บันทึกไม่สำเร็จ");
          return;
        }
      } else if (tab === "promotions") {
        if (!promoForm.title.trim()) {
          notice.error("กรอกชื่อโปร");
          return;
        }
        const res = await fetch("/api/used-car-showroom/session/promotions", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: promoForm.title,
            description: promoForm.description || null,
            kind: promoForm.kind,
            valueBaht: Number(promoForm.valueBaht) || 0,
            valuePercent: Number(promoForm.valuePercent) || 0,
            giftLabel: promoForm.giftLabel || null,
            startsOn: promoForm.startsOn || bangkokDateKey(),
            endsOn: promoForm.endsOn || bangkokDateKey(),
            isActive: promoForm.isActive,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          notice.error(data.error || "บันทึกไม่สำเร็จ");
          return;
        }
      } else if (tab === "finance-companies") {
        if (!companyForm.name.trim()) {
          notice.error("กรอกชื่อไฟแนนซ์");
          return;
        }
        const res = await fetch("/api/used-car-showroom/session/finance-companies", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: companyForm.name,
            contactName: companyForm.contactName || null,
            contactPhone: companyForm.contactPhone || null,
            note: companyForm.note || null,
            isActive: companyForm.isActive,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          notice.error(data.error || "บันทึกไม่สำเร็จ");
          return;
        }
      } else {
        return;
      }
      setAddOpen(false);
      resetAddForms();
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function patchStatus(id: string, status: string) {
    const res = await fetch(`/api/used-car-showroom/session/vehicles/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      notice.error(data.error || "อัปเดตสถานะไม่สำเร็จ");
      return;
    }
    await load();
  }

  async function removeVehicle(id: string, title: string) {
    const ok = await notice.confirm(`ลบรถ «${title}» ใช่หรือไม่?`);
    if (!ok) return;
    const res = await fetch(`/api/used-car-showroom/session/vehicles/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      notice.error("ลบไม่สำเร็จ");
      return;
    }
    if (editId === id) setEditId(null);
    await load();
  }

  async function removeRow(kind: "customers" | "staff" | "promotions" | "finance-companies", id: string, label: string) {
    const ok = await notice.confirm(`ลบ «${label}» ใช่หรือไม่?`);
    if (!ok) return;
    const url = `/api/used-car-showroom/session/${kind}?id=${encodeURIComponent(id)}`;
    const res = await fetch(url, { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      notice.error("ลบไม่สำเร็จ");
      return;
    }
    await load();
  }

  async function addCost() {
    if (!editId) return;
    const amount = Math.round(Number(costAmount) || 0);
    if (amount <= 0) {
      notice.error("ระบุจำนวนเงินต้นทุน");
      return;
    }
    const res = await fetch(`/api/used-car-showroom/session/vehicles/${editId}/costs`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: costKind, amountBaht: amount, label: costLabel || usedCarCostKindLabel(costKind) }),
    });
    if (!res.ok) {
      notice.error("บันทึกต้นทุนไม่สำเร็จ");
      return;
    }
    setCostAmount("");
    setCostLabel("");
    await load();
  }

  async function uploadImage(file: File) {
    if (!editId) return;
    const prepared = await prepareImageFileForUpload(file);
    const fd = new FormData();
    fd.set("file", prepared);
    const res = await fetch(`/api/used-car-showroom/session/vehicles/${editId}/images`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    if (!res.ok) {
      notice.error("อัปโหลดรูปไม่สำเร็จ");
      return;
    }
    await load();
  }

  async function addYoutube() {
    if (!editId || !ytUrl.trim()) return;
    const res = await fetch(`/api/used-car-showroom/session/vehicles/${editId}/videos`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ youtubeUrl: ytUrl }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      notice.error(data.error || "เพิ่มวิดีโอไม่สำเร็จ");
      return;
    }
    setYtUrl("");
    await load();
  }

  function openSell(v: Vehicle) {
    setSellForm({
      vehicleId: v.id,
      salePriceBaht: String(v.askingPriceBaht || ""),
      discountBaht: "0",
      paymentMethod: "CASH",
      customerId: "",
    });
    setSellOpen(true);
  }

  async function saveSale() {
    if (!sellForm.vehicleId) {
      notice.error("เลือกรถ");
      return;
    }
    const salePriceBaht = Math.round(Number(sellForm.salePriceBaht) || 0);
    if (salePriceBaht <= 0) {
      notice.error("ระบุราคาขาย");
      return;
    }
    setSellBusy(true);
    try {
      const res = await fetch("/api/used-car-showroom/session/sales", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: sellForm.vehicleId,
          salePriceBaht,
          discountBaht: Math.max(0, Math.round(Number(sellForm.discountBaht) || 0)),
          paymentMethod: sellForm.paymentMethod,
          customerId: sellForm.customerId || null,
          soldOn: bangkokDateKey(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notice.error(data.error || "บันทึกขายไม่สำเร็จ");
        return;
      }
      setSellOpen(false);
      notice.show("บันทึกขายแล้ว · สร้างรายรับอัตโนมัติ");
      await load();
    } finally {
      setSellBusy(false);
    }
  }

  const canAdd = tab !== "pnl";
  const filterPanelId = `used-car-manage-filter-${tab}`;

  const headerAction = (
    <div className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5">
      <button
        type="button"
        aria-expanded={filterOpen}
        aria-controls={filterPanelId}
        aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
        title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
        className={cn(
          usedCarShowroomOutlineButtonClass,
          "relative min-h-[40px] min-w-[40px] sm:min-w-0",
          filterOpen && "border-[#0000BF]/45 bg-[#0000BF]/10 ring-2 ring-[#0000BF]/20",
          filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
        )}
        onClick={() => setFilterOpen((o) => !o)}
      >
        <Filter className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
        {filtersActive ? (
          <span
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white"
            aria-hidden
          />
        ) : null}
      </button>
      {canAdd ? (
        <button
          type="button"
          className={usedCarShowroomPrimaryButtonClass}
          onClick={() => {
            resetAddForms();
            setAddOpen(true);
          }}
          aria-label={addLabel(tab)}
        >
          <Plus className="h-4 w-4 sm:hidden" aria-hidden />
          <span className="hidden sm:inline">+ {addLabel(tab)}</span>
        </button>
      ) : (
        <button
          type="button"
          className={usedCarShowroomPrimaryButtonClass}
          disabled
          aria-label="P&L ไม่มีปุ่มเพิ่ม"
          title="P&L อ่านจากสต็อกรถ"
        >
          <Plus className="h-4 w-4 opacity-40 sm:hidden" aria-hidden />
          <span className="hidden sm:inline opacity-60">+ เพิ่ม</span>
        </button>
      )}
    </div>
  );

  function renderStatusChips(mode: "vehicle" | "active") {
    if (mode === "vehicle") {
      const chips: { key: string; label: string; count: number }[] = [
        { key: "ALL", label: "ทั้งหมด", count: vehicles.length },
        ...VEHICLE_STATUSES.map((s) => ({
          key: s,
          label: usedCarVehicleStatusLabel(s),
          count: vehicles.filter((v) => v.status === s).length,
        })),
      ];
      return (
        <div className={usedCarShowroomFilterChipShellClass} role="tablist" aria-label="กรองสถานะ">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={statusFilter === c.key}
              className={usedCarShowroomFilterChipClass(statusFilter === c.key)}
              onClick={() => setStatusFilter(c.key)}
            >
              {c.label} ({c.count})
            </button>
          ))}
        </div>
      );
    }
    const activeCount =
      tab === "staff"
        ? staff.filter((s) => s.isActive).length
        : tab === "promotions"
          ? promos.filter((p) => p.isActive).length
          : companies.filter((c) => c.isActive).length;
    const inactiveCount =
      tab === "staff"
        ? staff.filter((s) => !s.isActive).length
        : tab === "promotions"
          ? promos.filter((p) => !p.isActive).length
          : companies.filter((c) => !c.isActive).length;
    const total =
      tab === "staff" ? staff.length : tab === "promotions" ? promos.length : companies.length;
    return (
      <div className={usedCarShowroomFilterChipShellClass} role="tablist" aria-label="กรองสถานะ">
        {[
          { key: "ALL", label: "ทั้งหมด", count: total },
          { key: "ACTIVE", label: "ใช้งาน", count: activeCount },
          { key: "INACTIVE", label: "ปิด", count: inactiveCount },
        ].map((c) => (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={statusFilter === c.key}
            className={usedCarShowroomFilterChipClass(statusFilter === c.key)}
            onClick={() => setStatusFilter(c.key)}
          >
            {c.label} ({c.count})
          </button>
        ))}
      </div>
    );
  }

  const filterPanel = (
    <div id={filterPanelId} className={cn("space-y-3", filterOpen ? "block" : "hidden")}>
      {tab === "vehicles" || tab === "pnl" ? renderStatusChips("vehicle") : null}
      {tab === "staff" || tab === "promotions" || tab === "finance-companies"
        ? renderStatusChips("active")
        : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="min-w-0 flex-1 sm:max-w-[20rem]" htmlFor={`used-car-kw-${tab}`}>
          <span className="text-xs font-bold text-[#4d47b6]">ค้นหา</span>
          <input
            id={`used-car-kw-${tab}`}
            className={cn(usedCarShowroomFieldClass, "mt-1")}
            placeholder="ชื่อ · เบอร์ · คำสำคัญ"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </label>
        {filtersActive ? (
          <button type="button" className={usedCarShowroomOutlineButtonClass} onClick={clearFilters}>
            ล้างกรอง
          </button>
        ) : null}
      </div>
      <p className="text-xs font-semibold tabular-nums text-[#66638c]">
        {tab === "vehicles"
          ? `แสดง ${filteredVehicles.length}/${vehicles.length}`
          : tab === "pnl"
            ? `แสดง ${pnlRows.length}/${vehicles.length}`
            : tab === "customers"
              ? `แสดง ${filteredCustomers.length}/${customers.length}`
              : tab === "staff"
                ? `แสดง ${filteredStaff.length}/${staff.length}`
                : tab === "promotions"
                  ? `แสดง ${filteredPromos.length}/${promos.length}`
                  : `แสดง ${filteredCompanies.length}/${companies.length}`}
      </p>
    </div>
  );

  return (
    <div className={usedCarShowroomPageStackClass}>
      {notice.popup}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปรถ" />
      <AppYoutubeLightbox youtubeUrl={yt.youtubeUrl} title={yt.title} onClose={yt.close} />

      <UsedCarShowroomPageSubNav
        title="การจัดการ"
        titleIcon={usedCarShowroomPageTitleIcon("manage")}
        titleTone={usedCarShowroomPageTitleTone("manage")}
        items={MANAGE_TABS}
        activeKey={tab}
        onSelect={(k) => setTab(k as UsedCarShowroomManageTabKey)}
        ariaLabel="เมนูย่อยการจัดการ"
        action={headerAction}
      >
        <div className="space-y-4">
          <p className="text-xs text-[#66638c]">{initialShop.displayName}</p>
          {filterPanel}

          {tab === "vehicles" ? (
            filteredVehicles.length === 0 ? (
              <AppEmptyState>
                {vehicles.length === 0 ? "ยังไม่มีรถ — กดเพิ่มรถเพื่อรับซื้อเข้าสต็อก" : "ไม่พบรถตามตัวกรอง"}
              </AppEmptyState>
            ) : (
              <ul className="space-y-2">
                {filteredVehicles.map((v) => {
                  const tone = usedCarVehicleStatusTone(v.status);
                  return (
                    <li key={v.id} className={usedCarShowroomTonedRowCardClass(tone)}>
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        {v.coverImageUrl ? (
                          <AppImageThumb
                            src={v.coverImageUrl}
                            alt={v.title}
                            className="h-14 w-14"
                            onOpen={() => lb.open(v.coverImageUrl!)}
                          />
                        ) : (
                          <span className={usedCarShowroomCardIconTileClass(tone, "lg")}>
                            <Car className="h-6 w-6" aria-hidden />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-[#1e1b4b]">{v.title}</p>
                          <p className="text-xs text-[#66638c]">
                            {v.statusLabel} · ขาย {baht(v.askingPriceBaht)} · ทุน {baht(v.purchaseCostBaht)} ·
                            ปรับสภาพ {baht(v.prepCostBaht)}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {VEHICLE_STATUSES.map((st) => (
                              <button
                                key={st}
                                type="button"
                                className={cn(
                                  usedCarShowroomOutlineButtonClass,
                                  "min-h-7 px-2 text-[10px]",
                                  v.status === st && usedCarShowroomPrimaryButtonClass,
                                )}
                                onClick={() => void patchStatus(v.id, st)}
                              >
                                {usedCarVehicleStatusLabel(st)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {v.status === "FOR_SALE" || v.status === "RESERVED" ? (
                          <button
                            type="button"
                            className={cn(
                              usedCarShowroomOutlineButtonClass,
                              "min-h-[40px] px-2 text-[11px] font-bold text-emerald-700",
                            )}
                            aria-label={`บันทึกขาย ${v.title}`}
                            title="บันทึกขาย"
                            onClick={() => openSell(v)}
                          >
                            ขาย
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={assetRowEditIconButtonClass}
                          aria-label={`แก้ไข ${v.title}`}
                          title="แก้ไข"
                          onClick={() => setEditId(v.id)}
                        >
                          <IconRowEdit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={assetRowRemoveIconButtonClass}
                          aria-label={`ลบ ${v.title}`}
                          title="ลบ"
                          onClick={() => void removeVehicle(v.id, v.title)}
                        >
                          <IconRowRemove className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )
          ) : null}

          {tab === "vehicles" && selected ? (
            <div className="space-y-3 rounded-xl border border-slate-200 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[#1e1b4b]">รายละเอียด · {selected.title}</h3>
                <button type="button" className={usedCarShowroomOutlineButtonClass} onClick={() => setEditId(null)}>
                  ปิด
                </button>
              </div>
              <div>
                <p className="mb-1 text-xs font-bold text-[#4d47b6]">รูปรถ</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadImage(f);
                    e.target.value = "";
                  }}
                />
                <ul className="mt-2 flex flex-wrap gap-2">
                  {selected.images.map((img) => (
                    <li key={img.id}>
                      <AppImageThumb
                        src={img.imageUrl}
                        alt=""
                        className="h-16 w-16"
                        onOpen={() => lb.open(img.imageUrl)}
                      />
                      {img.isCover ? (
                        <span className="block text-center text-[10px] font-bold text-emerald-700">ปก</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-xs font-bold text-[#4d47b6]">YouTube</p>
                <div className="flex gap-2">
                  <input
                    className={usedCarShowroomFieldClass}
                    placeholder="วางลิงก์ YouTube"
                    value={ytUrl}
                    onChange={(e) => setYtUrl(e.target.value)}
                  />
                  <button type="button" className={usedCarShowroomPrimaryButtonClass} onClick={() => void addYoutube()}>
                    เพิ่ม
                  </button>
                </div>
                <ul className={cn(usedCarShowroomYoutubeCardGridClass, "mt-2")}>
                  {selected.videos.map((v) => (
                    <li key={v.id}>
                      <button
                        type="button"
                        className="aspect-video w-full rounded-lg bg-slate-900 text-xs font-bold text-white"
                        onClick={() => yt.open(v.youtubeUrl, v.title)}
                      >
                        เล่น
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-xs font-bold text-[#4d47b6]">ต้นทุนปรับสภาพ (ไม่มีค่าคอม)</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <select className={usedCarShowroomFieldClass} value={costKind} onChange={(e) => setCostKind(e.target.value)}>
                    <option value="REPAIR">ซ่อม</option>
                    <option value="WASH">ล้าง</option>
                    <option value="TAX">ภาษี/ทะเบียน</option>
                    <option value="OTHER">อื่น ๆ</option>
                  </select>
                  <input
                    className={usedCarShowroomFieldClass}
                    placeholder="ยอด"
                    value={costAmount}
                    onChange={(e) => setCostAmount(e.target.value)}
                  />
                  <input
                    className={usedCarShowroomFieldClass}
                    placeholder="ชื่อรายการ"
                    value={costLabel}
                    onChange={(e) => setCostLabel(e.target.value)}
                  />
                  <button type="button" className={usedCarShowroomPrimaryButtonClass} onClick={() => void addCost()}>
                    เพิ่มต้นทุน
                  </button>
                </div>
                <ul className="mt-2 space-y-1">
                  {selected.costLines.map((c) => (
                    <li key={c.id} className="text-xs text-[#66638c]">
                      {usedCarCostKindLabel(c.kind)} · {c.label} · {baht(c.amountBaht)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {tab === "pnl" ? (
            pnlRows.length === 0 ? (
              <AppEmptyState>
                {vehicles.length === 0 ? "ยังไม่มีข้อมูล P&L" : "ไม่พบรายการตามตัวกรอง"}
              </AppEmptyState>
            ) : (
              <div className="space-y-2">
                {pnlRows.map((r) => (
                  <div
                    key={r.id}
                    className={usedCarShowroomTonedRowCardClass(r.profitBaht >= 0 ? "emerald" : "rose")}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-[#1e1b4b]">{r.title}</p>
                      <p className="text-xs text-[#66638c]">
                        ทุน {baht(r.purchaseCostBaht)} + ปรับสภาพ {baht(r.prepCostBaht)} · ราคา{" "}
                        {baht(r.salePriceBaht)} · {r.statusLabel}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "shrink-0 text-lg font-black tabular-nums",
                        r.profitBaht >= 0 ? "text-emerald-700" : "text-rose-600",
                      )}
                    >
                      {baht(r.profitBaht)}
                    </p>
                  </div>
                ))}
              </div>
            )
          ) : null}

          {tab === "customers" ? (
            filteredCustomers.length === 0 ? (
              <AppEmptyState>
                {customers.length === 0 ? "ยังไม่มีลูกค้า" : "ไม่พบลูกค้าตามตัวกรอง"}
              </AppEmptyState>
            ) : (
              <ul className="space-y-2">
                {filteredCustomers.map((c) => (
                  <li key={c.id} className={usedCarShowroomTonedRowCardClass("violet")}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-[#1e1b4b]">{c.fullName}</p>
                      <p className="text-xs text-[#66638c]">
                        {c.phone}
                        {c.lineId ? ` · LINE ${c.lineId}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ลบ ${c.fullName}`}
                      title="ลบ"
                      onClick={() => void removeRow("customers", c.id, c.fullName)}
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {tab === "staff" ? (
            filteredStaff.length === 0 ? (
              <AppEmptyState>
                {staff.length === 0 ? "ยังไม่มีพนักงาน" : "ไม่พบพนักงานตามตัวกรอง"}
              </AppEmptyState>
            ) : (
              <ul className="space-y-2">
                {filteredStaff.map((s) => (
                  <li key={s.id} className={usedCarShowroomTonedRowCardClass("sky")}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-[#1e1b4b]">{s.fullName}</p>
                      <p className="text-xs text-[#66638c]">
                        {s.role} · {s.phone ?? "—"} · คอม {s.commissionPercent}% ·{" "}
                        {s.isActive ? "ทำงาน" : "ปิด"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ลบ ${s.fullName}`}
                      title="ลบ"
                      onClick={() => void removeRow("staff", s.id, s.fullName)}
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {tab === "promotions" ? (
            filteredPromos.length === 0 ? (
              <AppEmptyState>
                {promos.length === 0 ? "ยังไม่มีโปรโมชัน" : "ไม่พบโปรตามตัวกรอง"}
              </AppEmptyState>
            ) : (
              <ul className="space-y-2">
                {filteredPromos.map((p) => (
                  <li key={p.id} className={usedCarShowroomTonedRowCardClass("amber")}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-[#1e1b4b]">{p.title}</p>
                      <p className="text-xs text-[#66638c]">
                        {p.startsOn} → {p.endsOn} · {p.isActive ? "เปิด" : "ปิด"}
                        {p.description ? ` · ${p.description}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ลบ ${p.title}`}
                      title="ลบ"
                      onClick={() => void removeRow("promotions", p.id, p.title)}
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {tab === "finance-companies" ? (
            filteredCompanies.length === 0 ? (
              <AppEmptyState>
                {companies.length === 0 ? "ยังไม่มีบริษัทไฟแนนซ์" : "ไม่พบรายการตามตัวกรอง"}
              </AppEmptyState>
            ) : (
              <ul className="space-y-2">
                {filteredCompanies.map((c) => (
                  <li key={c.id} className={usedCarShowroomTonedRowCardClass("indigo")}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-[#1e1b4b]">{c.name}</p>
                      <p className="text-xs text-[#66638c]">
                        {c.contactName ?? "—"} · {c.contactPhone ?? "—"} · {c.isActive ? "ใช้งาน" : "ปิด"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ลบ ${c.name}`}
                      title="ลบ"
                      onClick={() => void removeRow("finance-companies", c.id, c.name)}
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </div>
      </UsedCarShowroomPageSubNav>

      <FormModal
        open={addOpen && canAdd}
        onClose={() => {
          setAddOpen(false);
          resetAddForms();
        }}
        title={addLabel(tab)}
        size="lg"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => {
              setAddOpen(false);
              resetAddForms();
            }}
            onSubmit={() => void saveAdd()}
            submitLabel="บันทึก"
            loading={busy}
          />
        }
      >
        {tab === "vehicles" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              ยี่ห้อ
              <input
                className={usedCarShowroomFieldClass}
                value={vehicleForm.brand}
                onChange={(e) => setVehicleForm((f) => ({ ...f, brand: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              รุ่น
              <input
                className={usedCarShowroomFieldClass}
                value={vehicleForm.model}
                onChange={(e) => setVehicleForm((f) => ({ ...f, model: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              ปี
              <input
                className={usedCarShowroomFieldClass}
                value={vehicleForm.year}
                onChange={(e) => setVehicleForm((f) => ({ ...f, year: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              ทะเบียน
              <input
                className={usedCarShowroomFieldClass}
                value={vehicleForm.plateNumber}
                onChange={(e) => setVehicleForm((f) => ({ ...f, plateNumber: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              ทุนซื้อ (บาท)
              <input
                className={usedCarShowroomFieldClass}
                value={vehicleForm.purchaseCostBaht}
                onChange={(e) => setVehicleForm((f) => ({ ...f, purchaseCostBaht: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              ราคาขาย (บาท)
              <input
                className={usedCarShowroomFieldClass}
                value={vehicleForm.askingPriceBaht}
                onChange={(e) => setVehicleForm((f) => ({ ...f, askingPriceBaht: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              สถานะเริ่มต้น
              <select
                className={usedCarShowroomFieldClass}
                value={vehicleForm.status}
                onChange={(e) => setVehicleForm((f) => ({ ...f, status: e.target.value }))}
              >
                {VEHICLE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {usedCarVehicleStatusLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="col-span-full space-y-1 text-xs font-bold text-[#4d47b6]">
              รายละเอียด
              <textarea
                className={usedCarShowroomTextareaClass}
                value={vehicleForm.description}
                onChange={(e) => setVehicleForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
          </div>
        ) : null}

        {tab === "customers" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              ชื่อ-นามสกุล
              <input
                className={usedCarShowroomFieldClass}
                value={customerForm.fullName}
                onChange={(e) => setCustomerForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              เบอร์โทร
              <input
                className={usedCarShowroomFieldClass}
                value={customerForm.phone}
                onChange={(e) => setCustomerForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              LINE
              <input
                className={usedCarShowroomFieldClass}
                value={customerForm.lineId}
                onChange={(e) => setCustomerForm((f) => ({ ...f, lineId: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              อีเมล
              <input
                className={usedCarShowroomFieldClass}
                value={customerForm.email}
                onChange={(e) => setCustomerForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
            <label className="col-span-full space-y-1 text-xs font-bold text-[#4d47b6]">
              ที่อยู่
              <textarea
                className={usedCarShowroomTextareaClass}
                value={customerForm.address}
                onChange={(e) => setCustomerForm((f) => ({ ...f, address: e.target.value }))}
              />
            </label>
            <label className="col-span-full space-y-1 text-xs font-bold text-[#4d47b6]">
              หมายเหตุ
              <textarea
                className={usedCarShowroomTextareaClass}
                value={customerForm.note}
                onChange={(e) => setCustomerForm((f) => ({ ...f, note: e.target.value }))}
              />
            </label>
          </div>
        ) : null}

        {tab === "staff" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              ชื่อพนักงาน
              <input
                className={usedCarShowroomFieldClass}
                value={staffForm.fullName}
                onChange={(e) => setStaffForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              เบอร์โทร
              <input
                className={usedCarShowroomFieldClass}
                value={staffForm.phone}
                onChange={(e) => setStaffForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              บทบาท
              <select
                className={usedCarShowroomFieldClass}
                value={staffForm.role}
                onChange={(e) => setStaffForm((f) => ({ ...f, role: e.target.value }))}
              >
                <option value="SALES">ขาย</option>
                <option value="MANAGER">ผู้จัดการ</option>
                <option value="ADMIN">แอดมิน</option>
                <option value="OTHER">อื่น ๆ</option>
              </select>
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              ค่าคอม (%)
              <input
                className={usedCarShowroomFieldClass}
                value={staffForm.commissionPercent}
                onChange={(e) => setStaffForm((f) => ({ ...f, commissionPercent: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              สถานะ
              <select
                className={usedCarShowroomFieldClass}
                value={staffForm.isActive ? "1" : "0"}
                onChange={(e) => setStaffForm((f) => ({ ...f, isActive: e.target.value === "1" }))}
              >
                <option value="1">ทำงาน</option>
                <option value="0">ปิด</option>
              </select>
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              โบนัส / หมายเหตุคอม
              <input
                className={usedCarShowroomFieldClass}
                value={staffForm.bonusNote}
                onChange={(e) => setStaffForm((f) => ({ ...f, bonusNote: e.target.value }))}
              />
            </label>
            <label className="col-span-full space-y-1 text-xs font-bold text-[#4d47b6]">
              หมายเหตุ
              <textarea
                className={usedCarShowroomTextareaClass}
                value={staffForm.note}
                onChange={(e) => setStaffForm((f) => ({ ...f, note: e.target.value }))}
              />
            </label>
          </div>
        ) : null}

        {tab === "promotions" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="col-span-full space-y-1 text-xs font-bold text-[#4d47b6]">
              ชื่อโปร
              <input
                className={usedCarShowroomFieldClass}
                value={promoForm.title}
                onChange={(e) => setPromoForm((f) => ({ ...f, title: e.target.value }))}
              />
            </label>
            <label className="col-span-full space-y-1 text-xs font-bold text-[#4d47b6]">
              คำอธิบาย
              <textarea
                className={usedCarShowroomTextareaClass}
                value={promoForm.description}
                onChange={(e) => setPromoForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              ประเภท
              <select
                className={usedCarShowroomFieldClass}
                value={promoForm.kind}
                onChange={(e) => setPromoForm((f) => ({ ...f, kind: e.target.value }))}
              >
                <option value="AMOUNT">ลดเป็นบาท</option>
                <option value="PERCENT">ลด %</option>
                <option value="GIFT">ของแถม</option>
              </select>
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              มูลค่า (บาท)
              <input
                className={usedCarShowroomFieldClass}
                value={promoForm.valueBaht}
                onChange={(e) => setPromoForm((f) => ({ ...f, valueBaht: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              เปอร์เซ็นต์
              <input
                className={usedCarShowroomFieldClass}
                value={promoForm.valuePercent}
                onChange={(e) => setPromoForm((f) => ({ ...f, valuePercent: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              ของแถม
              <input
                className={usedCarShowroomFieldClass}
                value={promoForm.giftLabel}
                onChange={(e) => setPromoForm((f) => ({ ...f, giftLabel: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              เริ่ม (YYYY-MM-DD · เวลาไทย)
              <input
                type="date"
                className={usedCarShowroomFieldClass}
                value={promoForm.startsOn}
                onChange={(e) => setPromoForm((f) => ({ ...f, startsOn: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              สิ้นสุด (YYYY-MM-DD · เวลาไทย)
              <input
                type="date"
                className={usedCarShowroomFieldClass}
                value={promoForm.endsOn}
                onChange={(e) => setPromoForm((f) => ({ ...f, endsOn: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              สถานะ
              <select
                className={usedCarShowroomFieldClass}
                value={promoForm.isActive ? "1" : "0"}
                onChange={(e) => setPromoForm((f) => ({ ...f, isActive: e.target.value === "1" }))}
              >
                <option value="1">เปิด</option>
                <option value="0">ปิด</option>
              </select>
            </label>
          </div>
        ) : null}

        {tab === "finance-companies" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="col-span-full space-y-1 text-xs font-bold text-[#4d47b6]">
              ชื่อบริษัท
              <input
                className={usedCarShowroomFieldClass}
                value={companyForm.name}
                onChange={(e) => setCompanyForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              ผู้ติดต่อ
              <input
                className={usedCarShowroomFieldClass}
                value={companyForm.contactName}
                onChange={(e) => setCompanyForm((f) => ({ ...f, contactName: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              เบอร์ติดต่อ
              <input
                className={usedCarShowroomFieldClass}
                value={companyForm.contactPhone}
                onChange={(e) => setCompanyForm((f) => ({ ...f, contactPhone: e.target.value }))}
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-[#4d47b6]">
              สถานะ
              <select
                className={usedCarShowroomFieldClass}
                value={companyForm.isActive ? "1" : "0"}
                onChange={(e) => setCompanyForm((f) => ({ ...f, isActive: e.target.value === "1" }))}
              >
                <option value="1">ใช้งาน</option>
                <option value="0">ปิด</option>
              </select>
            </label>
            <label className="col-span-full space-y-1 text-xs font-bold text-[#4d47b6]">
              หมายเหตุ
              <textarea
                className={usedCarShowroomTextareaClass}
                value={companyForm.note}
                onChange={(e) => setCompanyForm((f) => ({ ...f, note: e.target.value }))}
              />
            </label>
          </div>
        ) : null}
      </FormModal>

      <FormModal
        open={sellOpen}
        onClose={() => setSellOpen(false)}
        title="บันทึกขายรถ"
        size="md"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setSellOpen(false)}
            onSubmit={() => void saveSale()}
            submitLabel="ยืนยันขาย"
            loading={sellBusy}
          />
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-[#66638c]">
            รถ: {vehicles.find((v) => v.id === sellForm.vehicleId)?.title ?? "—"}
          </p>
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            ราคาขาย
            <input
              className={usedCarShowroomFieldClass}
              inputMode="numeric"
              value={sellForm.salePriceBaht}
              onChange={(e) => setSellForm((f) => ({ ...f, salePriceBaht: e.target.value }))}
            />
          </label>
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            ส่วนลด
            <input
              className={usedCarShowroomFieldClass}
              inputMode="numeric"
              value={sellForm.discountBaht}
              onChange={(e) => setSellForm((f) => ({ ...f, discountBaht: e.target.value }))}
            />
          </label>
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            ช่องทางชำระ
            <select
              className={usedCarShowroomFieldClass}
              value={sellForm.paymentMethod}
              onChange={(e) =>
                setSellForm((f) => ({ ...f, paymentMethod: e.target.value as UsedCarPaymentMethod }))
              }
            >
              {USED_CAR_PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {usedCarPaymentMethodLabel(m)}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            ลูกค้า (ไม่บังคับ)
            <select
              className={usedCarShowroomFieldClass}
              value={sellForm.customerId}
              onChange={(e) => setSellForm((f) => ({ ...f, customerId: e.target.value }))}
            >
              <option value="">—</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} · {c.phone}
                </option>
              ))}
            </select>
          </label>
        </div>
      </FormModal>
    </div>
  );
}
