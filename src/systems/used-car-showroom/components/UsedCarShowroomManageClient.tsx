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
  usedCarShowroomInlineSearchFieldClass,
  usedCarShowroomInlineSubNavBtnClass,
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

type DetailKind = "vehicles" | "customers" | "staff" | "promotions" | "finance-companies";

const VEHICLE_STATUSES = ["PREP", "FOR_SALE", "RESERVED", "SOLD", "DELIVERED"] as const;

function baht(n: number) {
  return `฿${n.toLocaleString("th-TH")}`;
}

function matchKw(hay: string, kw: string) {
  if (!kw.trim()) return true;
  return hay.toLowerCase().includes(kw.trim().toLowerCase());
}

/** จำนวนรายการต่อหน้าในแท็บการจัดการ */
const LIST_PAGE_SIZE = 10;

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
  const [listPage, setListPage] = useState(0);

  const [addOpen, setAddOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);
  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [promoForm, setPromoForm] = useState(emptyPromoForm);
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
  const [busy, setBusy] = useState(false);

  const [detailKind, setDetailKind] = useState<DetailKind | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailEditing, setDetailEditing] = useState(false);
  const [detailSaving, setDetailSaving] = useState(false);
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

  const vehicleParam = searchParams.get("vehicle");

  const setTab = (next: UsedCarShowroomManageTabKey) => {
    router.push(usedCarShowroomManageHref(next));
  };

  useEffect(() => {
    setFilterOpen(true);
    setStatusFilter("ALL");
    setKeyword("");
    setListPage(0);
    setAddOpen(false);
    setDetailKind(null);
    setDetailId(null);
    setDetailEditing(false);
    setDetailSaving(false);
  }, [tab]);

  useEffect(() => {
    if (tab !== "vehicles" || !vehicleParam) return;
    if (detailKind === "vehicles" && detailId === vehicleParam) return;
    const v = vehicles.find((row) => row.id === vehicleParam);
    if (!v) return;
    setVehicleForm({
      brand: v.brand,
      model: v.model,
      year: v.year != null ? String(v.year) : "",
      askingPriceBaht: String(v.askingPriceBaht || ""),
      purchaseCostBaht: String(v.purchaseCostBaht || ""),
      plateNumber: v.plateNumber ?? "",
      description: v.description ?? "",
      status: v.status,
    });
    setDetailKind("vehicles");
    setDetailId(v.id);
    setDetailEditing(false);
  }, [tab, vehicleParam, vehicles, detailKind, detailId]);

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

  const listTotal =
    tab === "vehicles"
      ? filteredVehicles.length
      : tab === "pnl"
        ? pnlRows.length
        : tab === "customers"
          ? filteredCustomers.length
          : tab === "staff"
            ? filteredStaff.length
            : tab === "promotions"
              ? filteredPromos.length
              : filteredCompanies.length;

  const listTotalPages = Math.max(1, Math.ceil(listTotal / LIST_PAGE_SIZE));
  const listSafePage = Math.min(listPage, listTotalPages - 1);

  useEffect(() => {
    setListPage(0);
  }, [statusFilter, keyword]);

  useEffect(() => {
    setListPage((p) => Math.min(p, Math.max(0, listTotalPages - 1)));
  }, [listTotalPages]);

  const pageVehicles = useMemo(() => {
    const start = listSafePage * LIST_PAGE_SIZE;
    return filteredVehicles.slice(start, start + LIST_PAGE_SIZE);
  }, [filteredVehicles, listSafePage]);
  const pagePnl = useMemo(() => {
    const start = listSafePage * LIST_PAGE_SIZE;
    return pnlRows.slice(start, start + LIST_PAGE_SIZE);
  }, [pnlRows, listSafePage]);
  const pageCustomers = useMemo(() => {
    const start = listSafePage * LIST_PAGE_SIZE;
    return filteredCustomers.slice(start, start + LIST_PAGE_SIZE);
  }, [filteredCustomers, listSafePage]);
  const pageStaff = useMemo(() => {
    const start = listSafePage * LIST_PAGE_SIZE;
    return filteredStaff.slice(start, start + LIST_PAGE_SIZE);
  }, [filteredStaff, listSafePage]);
  const pagePromos = useMemo(() => {
    const start = listSafePage * LIST_PAGE_SIZE;
    return filteredPromos.slice(start, start + LIST_PAGE_SIZE);
  }, [filteredPromos, listSafePage]);
  const pageCompanies = useMemo(() => {
    const start = listSafePage * LIST_PAGE_SIZE;
    return filteredCompanies.slice(start, start + LIST_PAGE_SIZE);
  }, [filteredCompanies, listSafePage]);

  const selected =
    detailKind === "vehicles" && detailId
      ? (vehicles.find((v) => v.id === detailId) ?? null)
      : null;
  const detailCustomer =
    detailKind === "customers" && detailId
      ? (customers.find((c) => c.id === detailId) ?? null)
      : null;
  const detailStaff =
    detailKind === "staff" && detailId ? (staff.find((s) => s.id === detailId) ?? null) : null;
  const detailPromo =
    detailKind === "promotions" && detailId
      ? (promos.find((p) => p.id === detailId) ?? null)
      : null;
  const detailCompany =
    detailKind === "finance-companies" && detailId
      ? (companies.find((c) => c.id === detailId) ?? null)
      : null;

  function listRangeText(unit: string) {
    if (listTotal === 0) return null;
    return (
      <p className="text-[11px] font-semibold text-[#66638c]">
        หน้านี้ {listSafePage * LIST_PAGE_SIZE + 1}–
        {Math.min((listSafePage + 1) * LIST_PAGE_SIZE, listTotal)} จาก {listTotal} {unit}
      </p>
    );
  }

  function listPager() {
    if (listTotalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          className={usedCarShowroomOutlineButtonClass}
          disabled={listSafePage <= 0}
          onClick={() => setListPage((p) => Math.max(0, p - 1))}
          aria-label="หน้าก่อนหน้า"
        >
          ก่อนหน้า
        </button>
        <p className="text-xs font-semibold text-[#66638c]" aria-live="polite">
          หน้า {listSafePage + 1} / {listTotalPages}
        </p>
        <button
          type="button"
          className={usedCarShowroomOutlineButtonClass}
          disabled={listSafePage >= listTotalPages - 1}
          onClick={() => setListPage((p) => Math.min(listTotalPages - 1, p + 1))}
          aria-label="หน้าถัดไป"
        >
          ถัดไป
        </button>
      </div>
    );
  }

  function resetAddForms() {
    setVehicleForm(emptyVehicleForm);
    setCustomerForm(emptyCustomerForm);
    setStaffForm(emptyStaffForm);
    setPromoForm(emptyPromoForm());
    setCompanyForm(emptyCompanyForm);
  }

  function fillFormsForDetail(kind: DetailKind, id: string): boolean {
    if (kind === "vehicles") {
      const v = vehicles.find((row) => row.id === id);
      if (!v) return false;
      setVehicleForm({
        brand: v.brand,
        model: v.model,
        year: v.year != null ? String(v.year) : "",
        askingPriceBaht: String(v.askingPriceBaht || ""),
        purchaseCostBaht: String(v.purchaseCostBaht || ""),
        plateNumber: v.plateNumber ?? "",
        description: v.description ?? "",
        status: v.status,
      });
      return true;
    }
    if (kind === "customers") {
      const c = customers.find((row) => row.id === id);
      if (!c) return false;
      setCustomerForm({
        fullName: c.fullName,
        phone: c.phone,
        lineId: c.lineId ?? "",
        email: c.email ?? "",
        address: c.address ?? "",
        note: c.note ?? "",
      });
      return true;
    }
    if (kind === "staff") {
      const s = staff.find((row) => row.id === id);
      if (!s) return false;
      setStaffForm({
        fullName: s.fullName,
        phone: s.phone ?? "",
        role: s.role,
        commissionPercent: String(s.commissionPercent ?? 0),
        bonusNote: s.bonusNote ?? "",
        isActive: s.isActive,
        note: s.note ?? "",
      });
      return true;
    }
    if (kind === "promotions") {
      const p = promos.find((row) => row.id === id);
      if (!p) return false;
      setPromoForm({
        title: p.title,
        description: p.description ?? "",
        kind: p.kind,
        valueBaht: String(p.valueBaht || ""),
        valuePercent: String(p.valuePercent || ""),
        giftLabel: p.giftLabel ?? "",
        startsOn: p.startsOn,
        endsOn: p.endsOn,
        isActive: p.isActive,
      });
      return true;
    }
    const c = companies.find((row) => row.id === id);
    if (!c) return false;
    setCompanyForm({
      name: c.name,
      contactName: c.contactName ?? "",
      contactPhone: c.contactPhone ?? "",
      note: c.note ?? "",
      isActive: c.isActive,
    });
    return true;
  }

  function openDetail(kind: DetailKind, id: string, editing = false) {
    if (!fillFormsForDetail(kind, id)) return;
    setAddOpen(false);
    setDetailKind(kind);
    setDetailId(id);
    setDetailEditing(editing);
  }

  function closeDetail() {
    setDetailKind(null);
    setDetailId(null);
    setDetailEditing(false);
    setDetailSaving(false);
    if (vehicleParam) {
      router.replace(usedCarShowroomManageHref(tab === "pnl" ? "pnl" : "vehicles"));
    }
  }

  function startDetailEdit() {
    if (!detailKind || !detailId) return;
    if (!fillFormsForDetail(detailKind, detailId)) return;
    setDetailEditing(true);
  }

  function cancelDetailEdit() {
    if (!detailKind || !detailId) return;
    if (!fillFormsForDetail(detailKind, detailId)) return;
    setDetailEditing(false);
  }

  function detailModalTitle(): string {
    if (!detailKind) return "รายละเอียด";
    if (detailEditing) {
      switch (detailKind) {
        case "vehicles":
          return "แก้ไขรถ";
        case "customers":
          return "แก้ไขลูกค้า";
        case "staff":
          return "แก้ไขพนักงาน";
        case "promotions":
          return "แก้ไขโปร";
        case "finance-companies":
          return "แก้ไขไฟแนนซ์";
      }
    }
    switch (detailKind) {
      case "vehicles":
        return "รายละเอียดรถ";
      case "customers":
        return "รายละเอียดลูกค้า";
      case "staff":
        return "รายละเอียดพนักงาน";
      case "promotions":
        return "รายละเอียดโปร";
      case "finance-companies":
        return "รายละเอียดไฟแนนซ์";
    }
  }

  function clearFilters() {
    setStatusFilter("ALL");
    setKeyword("");
  }

  async function saveDetail() {
    if (!detailKind || !detailId) return;
    setDetailSaving(true);
    try {
      if (detailKind === "vehicles") {
        if (!vehicleForm.brand.trim() || !vehicleForm.model.trim()) {
          notice.error("กรอกยี่ห้อและรุ่น");
          return;
        }
        const res = await fetch(`/api/used-car-showroom/session/vehicles/${detailId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand: vehicleForm.brand,
            model: vehicleForm.model,
            year: vehicleForm.year ? Number(vehicleForm.year) : null,
            plateNumber: vehicleForm.plateNumber || null,
            purchaseCostBaht: Number(vehicleForm.purchaseCostBaht) || 0,
            askingPriceBaht: Number(vehicleForm.askingPriceBaht) || 0,
            description: vehicleForm.description || null,
            status: vehicleForm.status,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          notice.error(data.error || "บันทึกไม่สำเร็จ");
          return;
        }
        if (data.vehicle) {
          setVehicles((list) => list.map((v) => (v.id === detailId ? { ...v, ...data.vehicle } : v)));
        }
      } else if (detailKind === "customers") {
        if (!customerForm.fullName.trim() || !customerForm.phone.trim()) {
          notice.error("กรอกชื่อและเบอร์");
          return;
        }
        const res = await fetch("/api/used-car-showroom/session/customers", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: detailId,
            fullName: customerForm.fullName,
            phone: customerForm.phone,
            lineId: customerForm.lineId || null,
            email: customerForm.email || null,
            address: customerForm.address || null,
            note: customerForm.note || null,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          notice.error(data.error || "บันทึกไม่สำเร็จ");
          return;
        }
        if (data.customer) {
          setCustomers((list) => list.map((c) => (c.id === detailId ? data.customer : c)));
        }
      } else if (detailKind === "staff") {
        if (!staffForm.fullName.trim()) {
          notice.error("กรอกชื่อพนักงาน");
          return;
        }
        const res = await fetch("/api/used-car-showroom/session/staff", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: detailId,
            fullName: staffForm.fullName,
            phone: staffForm.phone || null,
            role: staffForm.role,
            commissionPercent: Number(staffForm.commissionPercent) || 0,
            isActive: staffForm.isActive,
            note: staffForm.note || null,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          notice.error(data.error || "บันทึกไม่สำเร็จ");
          return;
        }
        if (data.staff) {
          setStaff((list) =>
            list.map((s) => (s.id === detailId ? { ...s, ...data.staff, bonusNote: s.bonusNote } : s)),
          );
        }
      } else if (detailKind === "promotions") {
        if (!promoForm.title.trim()) {
          notice.error("กรอกชื่อโปร");
          return;
        }
        const res = await fetch("/api/used-car-showroom/session/promotions", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: detailId,
            title: promoForm.title,
            description: promoForm.description || null,
            kind: promoForm.kind,
            valueBaht: Number(promoForm.valueBaht) || 0,
            valuePercent: Number(promoForm.valuePercent) || 0,
            isActive: promoForm.isActive,
            startsOn: promoForm.startsOn || bangkokDateKey(),
            endsOn: promoForm.endsOn || bangkokDateKey(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          notice.error(data.error || "บันทึกไม่สำเร็จ");
          return;
        }
        if (data.promotion) {
          setPromos((list) => list.map((p) => (p.id === detailId ? { ...p, ...data.promotion } : p)));
        }
      } else if (detailKind === "finance-companies") {
        if (!companyForm.name.trim()) {
          notice.error("กรอกชื่อไฟแนนซ์");
          return;
        }
        const res = await fetch("/api/used-car-showroom/session/finance-companies", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: detailId,
            name: companyForm.name,
            contactName: companyForm.contactName || null,
            contactPhone: companyForm.contactPhone || null,
            note: companyForm.note || null,
            isActive: companyForm.isActive,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          notice.error(data.error || "บันทึกไม่สำเร็จ");
          return;
        }
        if (data.company) {
          setCompanies((list) => list.map((c) => (c.id === detailId ? data.company : c)));
        }
      }
      notice.show("บันทึกแล้ว");
      await load();
      setDetailEditing(false);
    } catch (e) {
      console.error(e);
      notice.error("บันทึกไม่สำเร็จ");
    } finally {
      setDetailSaving(false);
    }
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
    if (detailKind === "vehicles" && detailId === id) closeDetail();
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
    if (detailKind === kind && detailId === id) closeDetail();
    await load();
  }

  async function addCost() {
    if (detailKind !== "vehicles" || !detailId) return;
    const amount = Math.round(Number(costAmount) || 0);
    if (amount <= 0) {
      notice.error("ระบุจำนวนเงินต้นทุน");
      return;
    }
    const res = await fetch(`/api/used-car-showroom/session/vehicles/${detailId}/costs`, {
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
    if (detailKind !== "vehicles" || !detailId) return;
    const prepared = await prepareImageFileForUpload(file);
    const fd = new FormData();
    fd.set("file", prepared);
    const res = await fetch(`/api/used-car-showroom/session/vehicles/${detailId}/images`, {
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
    if (detailKind !== "vehicles" || !detailId || !ytUrl.trim()) return;
    const res = await fetch(`/api/used-car-showroom/session/vehicles/${detailId}/videos`, {
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
    <div className="flex shrink-0 flex-nowrap items-center gap-1">
      <button
        type="button"
        aria-expanded={filterOpen}
        aria-controls={filterPanelId}
        aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
        title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
        className={cn(
          usedCarShowroomInlineSubNavBtnClass(filterOpen),
          "relative",
          filtersActive && !filterOpen && "ring-1 ring-amber-300/80",
        )}
        onClick={() => setFilterOpen((o) => !o)}
      >
        <Filter className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
        {filtersActive && !filterOpen ? (
          <span
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#5b61ff] ring-2 ring-white"
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
            closeDetail();
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
      return chips.map((c) => (
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
      ));
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
    return [
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
    ));
  }

  const filterPanel = (
    <div id={filterPanelId} className={cn("space-y-3", filterOpen ? "block" : "hidden")}>
      <div
        className={usedCarShowroomFilterChipShellClass}
        role="tablist"
        aria-label="กรองรายการ"
      >
        <input
          id={`used-car-kw-${tab}-desk`}
          type="search"
          className={cn(usedCarShowroomInlineSearchFieldClass, "hidden sm:block")}
          placeholder="ชื่อ · เบอร์ · คำสำคัญ"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          aria-label="ค้นหา"
        />
        {tab === "vehicles" || tab === "pnl" ? renderStatusChips("vehicle") : null}
        {tab === "staff" || tab === "promotions" || tab === "finance-companies"
          ? renderStatusChips("active")
          : null}
        {filtersActive ? (
          <button
            type="button"
            className={cn(usedCarShowroomOutlineButtonClass, "hidden sm:inline-flex")}
            onClick={clearFilters}
          >
            ล้างกรอง
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 sm:hidden">
        <label className="min-w-0 flex-1" htmlFor={`used-car-kw-${tab}`}>
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
              <div className="space-y-2">
                {listRangeText("คัน")}
                <ul className="space-y-2">
                  {pageVehicles.map((v) => {
                    const tone = usedCarVehicleStatusTone(v.status);
                    return (
                      <li key={v.id}>
                        <div
                          role="button"
                          tabIndex={0}
                          className={cn(usedCarShowroomTonedRowCardClass(tone), "cursor-pointer")}
                          onClick={() => openDetail("vehicles", v.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openDetail("vehicles", v.id);
                            }
                          }}
                          aria-label={`ดูรายละเอียด ${v.title}`}
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            {v.coverImageUrl ? (
                              <AppImageThumb
                                src={v.coverImageUrl}
                                alt={v.title}
                                className="pointer-events-none h-14 w-14"
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
                              <p className="mt-1 text-[10px] font-semibold text-[#8b87a8]">แตะเพื่อดูรายละเอียด</p>
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void patchStatus(v.id, st);
                                    }}
                                  >
                                    {usedCarVehicleStatusLabel(st)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div
                            className="flex shrink-0 items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
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
                              onClick={() => openDetail("vehicles", v.id, true)}
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
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {listPager()}
              </div>
            )
          ) : null}

          {tab === "pnl" ? (
            pnlRows.length === 0 ? (
              <AppEmptyState>
                {vehicles.length === 0 ? "ยังไม่มีข้อมูล P&L" : "ไม่พบรายการตามตัวกรอง"}
              </AppEmptyState>
            ) : (
              <div className="space-y-2">
                {listRangeText("รายการ")}
                {pagePnl.map((r) => (
                  <div
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      usedCarShowroomTonedRowCardClass(r.profitBaht >= 0 ? "emerald" : "rose"),
                      "cursor-pointer",
                    )}
                    onClick={() => openDetail("vehicles", r.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openDetail("vehicles", r.id);
                      }
                    }}
                    aria-label={`ดูรายละเอียด ${r.title}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-[#1e1b4b]">{r.title}</p>
                      <p className="text-xs text-[#66638c]">
                        ทุน {baht(r.purchaseCostBaht)} + ปรับสภาพ {baht(r.prepCostBaht)} · ราคา{" "}
                        {baht(r.salePriceBaht)} · {r.statusLabel}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold text-[#8b87a8]">แตะเพื่อดูรายละเอียด</p>
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
                {listPager()}
              </div>
            )
          ) : null}

          {tab === "customers" ? (
            filteredCustomers.length === 0 ? (
              <AppEmptyState>
                {customers.length === 0 ? "ยังไม่มีลูกค้า" : "ไม่พบลูกค้าตามตัวกรอง"}
              </AppEmptyState>
            ) : (
              <div className="space-y-2">
                {listRangeText("คน")}
                <ul className="space-y-2">
                  {pageCustomers.map((c) => (
                    <li key={c.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        className={cn(usedCarShowroomTonedRowCardClass("violet"), "cursor-pointer")}
                        onClick={() => openDetail("customers", c.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openDetail("customers", c.id);
                          }
                        }}
                        aria-label={`ดูรายละเอียด ${c.fullName}`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-[#1e1b4b]">{c.fullName}</p>
                          <p className="text-xs text-[#66638c]">
                            {c.phone}
                            {c.lineId ? ` · LINE ${c.lineId}` : ""}
                          </p>
                          <p className="mt-1 text-[10px] font-semibold text-[#8b87a8]">แตะเพื่อดูรายละเอียด</p>
                        </div>
                        <div
                          className="flex shrink-0 items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className={assetRowEditIconButtonClass}
                            aria-label={`แก้ไข ${c.fullName}`}
                            title="แก้ไข"
                            onClick={() => openDetail("customers", c.id, true)}
                          >
                            <IconRowEdit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className={assetRowRemoveIconButtonClass}
                            aria-label={`ลบ ${c.fullName}`}
                            title="ลบ"
                            onClick={() => void removeRow("customers", c.id, c.fullName)}
                          >
                            <IconRowRemove className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {listPager()}
              </div>
            )
          ) : null}

          {tab === "staff" ? (
            filteredStaff.length === 0 ? (
              <AppEmptyState>
                {staff.length === 0 ? "ยังไม่มีพนักงาน" : "ไม่พบพนักงานตามตัวกรอง"}
              </AppEmptyState>
            ) : (
              <div className="space-y-2">
                {listRangeText("คน")}
                <ul className="space-y-2">
                  {pageStaff.map((s) => (
                    <li key={s.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        className={cn(usedCarShowroomTonedRowCardClass("sky"), "cursor-pointer")}
                        onClick={() => openDetail("staff", s.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openDetail("staff", s.id);
                          }
                        }}
                        aria-label={`ดูรายละเอียด ${s.fullName}`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-[#1e1b4b]">{s.fullName}</p>
                          <p className="text-xs text-[#66638c]">
                            {s.role} · {s.phone ?? "—"} · คอม {s.commissionPercent}% ·{" "}
                            {s.isActive ? "ทำงาน" : "ปิด"}
                          </p>
                          <p className="mt-1 text-[10px] font-semibold text-[#8b87a8]">แตะเพื่อดูรายละเอียด</p>
                        </div>
                        <div
                          className="flex shrink-0 items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className={assetRowEditIconButtonClass}
                            aria-label={`แก้ไข ${s.fullName}`}
                            title="แก้ไข"
                            onClick={() => openDetail("staff", s.id, true)}
                          >
                            <IconRowEdit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className={assetRowRemoveIconButtonClass}
                            aria-label={`ลบ ${s.fullName}`}
                            title="ลบ"
                            onClick={() => void removeRow("staff", s.id, s.fullName)}
                          >
                            <IconRowRemove className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {listPager()}
              </div>
            )
          ) : null}

          {tab === "promotions" ? (
            filteredPromos.length === 0 ? (
              <AppEmptyState>
                {promos.length === 0 ? "ยังไม่มีโปรโมชัน" : "ไม่พบโปรตามตัวกรอง"}
              </AppEmptyState>
            ) : (
              <div className="space-y-2">
                {listRangeText("รายการ")}
                <ul className="space-y-2">
                  {pagePromos.map((p) => (
                    <li key={p.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        className={cn(usedCarShowroomTonedRowCardClass("amber"), "cursor-pointer")}
                        onClick={() => openDetail("promotions", p.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openDetail("promotions", p.id);
                          }
                        }}
                        aria-label={`ดูรายละเอียด ${p.title}`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-[#1e1b4b]">{p.title}</p>
                          <p className="text-xs text-[#66638c]">
                            {p.startsOn} → {p.endsOn} · {p.isActive ? "เปิด" : "ปิด"}
                            {p.description ? ` · ${p.description}` : ""}
                          </p>
                          <p className="mt-1 text-[10px] font-semibold text-[#8b87a8]">แตะเพื่อดูรายละเอียด</p>
                        </div>
                        <div
                          className="flex shrink-0 items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className={assetRowEditIconButtonClass}
                            aria-label={`แก้ไข ${p.title}`}
                            title="แก้ไข"
                            onClick={() => openDetail("promotions", p.id, true)}
                          >
                            <IconRowEdit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className={assetRowRemoveIconButtonClass}
                            aria-label={`ลบ ${p.title}`}
                            title="ลบ"
                            onClick={() => void removeRow("promotions", p.id, p.title)}
                          >
                            <IconRowRemove className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {listPager()}
              </div>
            )
          ) : null}

          {tab === "finance-companies" ? (
            filteredCompanies.length === 0 ? (
              <AppEmptyState>
                {companies.length === 0 ? "ยังไม่มีบริษัทไฟแนนซ์" : "ไม่พบรายการตามตัวกรอง"}
              </AppEmptyState>
            ) : (
              <div className="space-y-2">
                {listRangeText("รายการ")}
                <ul className="space-y-2">
                  {pageCompanies.map((c) => (
                    <li key={c.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        className={cn(usedCarShowroomTonedRowCardClass("indigo"), "cursor-pointer")}
                        onClick={() => openDetail("finance-companies", c.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openDetail("finance-companies", c.id);
                          }
                        }}
                        aria-label={`ดูรายละเอียด ${c.name}`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-[#1e1b4b]">{c.name}</p>
                          <p className="text-xs text-[#66638c]">
                            {c.contactName ?? "—"} · {c.contactPhone ?? "—"} · {c.isActive ? "ใช้งาน" : "ปิด"}
                          </p>
                          <p className="mt-1 text-[10px] font-semibold text-[#8b87a8]">แตะเพื่อดูรายละเอียด</p>
                        </div>
                        <div
                          className="flex shrink-0 items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className={assetRowEditIconButtonClass}
                            aria-label={`แก้ไข ${c.name}`}
                            title="แก้ไข"
                            onClick={() => openDetail("finance-companies", c.id, true)}
                          >
                            <IconRowEdit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className={assetRowRemoveIconButtonClass}
                            aria-label={`ลบ ${c.name}`}
                            title="ลบ"
                            onClick={() => void removeRow("finance-companies", c.id, c.name)}
                          >
                            <IconRowRemove className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {listPager()}
              </div>
            )
          ) : null}
        </div>
      </UsedCarShowroomPageSubNav>

      <FormModal
        open={Boolean(detailKind && detailId)}
        onClose={closeDetail}
        title={detailModalTitle()}
        size="lg"
        mobileCentered
        footer={
          detailEditing ? (
            <FormModalFooterActions
              onCancel={cancelDetailEdit}
              cancelLabel="ยกเลิก"
              onSubmit={() => void saveDetail()}
              submitLabel="บันทึก"
              loading={detailSaving}
            />
          ) : (
            <FormModalFooterActions
              onCancel={closeDetail}
              cancelLabel="ปิด"
              onSubmit={startDetailEdit}
              submitLabel="แก้ไข"
            />
          )
        }
      >
        {detailKind === "vehicles" && selected ? (
          detailEditing ? (
            <div className="space-y-3">
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
                  สถานะ
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
                        alt={selected.title}
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
                  <select
                    className={usedCarShowroomFieldClass}
                    value={costKind}
                    onChange={(e) => setCostKind(e.target.value)}
                  >
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
          ) : (
            <div className="space-y-3">
              <div className="flex min-w-0 items-start gap-3">
                {selected.coverImageUrl ? (
                  <AppImageThumb
                    src={selected.coverImageUrl}
                    alt={selected.title}
                    className="h-20 w-20 shrink-0"
                    onOpen={() => selected.coverImageUrl && lb.open(selected.coverImageUrl)}
                  />
                ) : (
                  <span
                    className={cn(
                      usedCarShowroomCardIconTileClass(usedCarVehicleStatusTone(selected.status), "lg"),
                      "shrink-0",
                    )}
                    aria-hidden
                  >
                    <Car className="h-6 w-6" />
                  </span>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-black text-[#1e1b4b]">{selected.title}</p>
                  <p className="text-xs font-semibold text-[#66638c]">{selected.statusLabel}</p>
                  <p className="text-sm font-black text-emerald-700">{baht(selected.askingPriceBaht)}</p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-xs">
                <div>
                  <dt className="font-bold text-[#8b87a8]">ยี่ห้อ / รุ่น</dt>
                  <dd className="font-semibold text-[#1e1b4b]">
                    {selected.brand} {selected.model}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-[#8b87a8]">ปี</dt>
                  <dd className="font-semibold text-[#1e1b4b]">{selected.year ?? "—"}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[#8b87a8]">ทะเบียน</dt>
                  <dd className="font-semibold text-[#1e1b4b]">{selected.plateNumber || "—"}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[#8b87a8]">สถานะ</dt>
                  <dd className="font-semibold text-[#1e1b4b]">{selected.statusLabel}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[#8b87a8]">ทุนซื้อ</dt>
                  <dd className="font-semibold text-[#1e1b4b]">{baht(selected.purchaseCostBaht)}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[#8b87a8]">ราคาขาย</dt>
                  <dd className="font-semibold text-[#1e1b4b]">{baht(selected.askingPriceBaht)}</dd>
                </div>
                <div>
                  <dt className="font-bold text-[#8b87a8]">ปรับสภาพ</dt>
                  <dd className="font-semibold text-[#1e1b4b]">{baht(selected.prepCostBaht)}</dd>
                </div>
              </dl>
              {selected.description ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#4d47b6]">รายละเอียด</p>
                  <p className="whitespace-pre-wrap text-xs font-semibold text-[#66638c]">{selected.description}</p>
                </div>
              ) : null}
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
                        alt={selected.title}
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
                  <select
                    className={usedCarShowroomFieldClass}
                    value={costKind}
                    onChange={(e) => setCostKind(e.target.value)}
                  >
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
          )
        ) : null}

        {detailKind === "customers" && detailCustomer ? (
          detailEditing ? (
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
          ) : (
            <dl className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-xs sm:grid-cols-2">
              <div>
                <dt className="font-bold text-[#8b87a8]">ชื่อ</dt>
                <dd className="font-semibold text-[#1e1b4b]">{detailCustomer.fullName}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">เบอร์โทร</dt>
                <dd className="font-semibold text-[#1e1b4b]">{detailCustomer.phone}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">LINE</dt>
                <dd className="font-semibold text-[#1e1b4b]">{detailCustomer.lineId || "—"}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">อีเมล</dt>
                <dd className="font-semibold text-[#1e1b4b]">{detailCustomer.email || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-bold text-[#8b87a8]">ที่อยู่</dt>
                <dd className="whitespace-pre-wrap font-semibold text-[#1e1b4b]">
                  {detailCustomer.address || "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-bold text-[#8b87a8]">หมายเหตุ</dt>
                <dd className="whitespace-pre-wrap font-semibold text-[#1e1b4b]">{detailCustomer.note || "—"}</dd>
              </div>
            </dl>
          )
        ) : null}

        {detailKind === "staff" && detailStaff ? (
          detailEditing ? (
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
              <label className="col-span-full space-y-1 text-xs font-bold text-[#4d47b6]">
                หมายเหตุ
                <textarea
                  className={usedCarShowroomTextareaClass}
                  value={staffForm.note}
                  onChange={(e) => setStaffForm((f) => ({ ...f, note: e.target.value }))}
                />
              </label>
            </div>
          ) : (
            <dl className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-xs sm:grid-cols-2">
              <div>
                <dt className="font-bold text-[#8b87a8]">ชื่อ</dt>
                <dd className="font-semibold text-[#1e1b4b]">{detailStaff.fullName}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">เบอร์โทร</dt>
                <dd className="font-semibold text-[#1e1b4b]">{detailStaff.phone || "—"}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">บทบาท</dt>
                <dd className="font-semibold text-[#1e1b4b]">{detailStaff.role}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">ค่าคอม</dt>
                <dd className="font-semibold text-[#1e1b4b]">{detailStaff.commissionPercent}%</dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">สถานะ</dt>
                <dd className="font-semibold text-[#1e1b4b]">{detailStaff.isActive ? "ทำงาน" : "ปิด"}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">โบนัส / หมายเหตุคอม</dt>
                <dd className="font-semibold text-[#1e1b4b]">{detailStaff.bonusNote || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-bold text-[#8b87a8]">หมายเหตุ</dt>
                <dd className="whitespace-pre-wrap font-semibold text-[#1e1b4b]">{detailStaff.note || "—"}</dd>
              </div>
            </dl>
          )
        ) : null}

        {detailKind === "promotions" && detailPromo ? (
          detailEditing ? (
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
          ) : (
            <dl className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-xs sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="font-bold text-[#8b87a8]">ชื่อโปร</dt>
                <dd className="font-semibold text-[#1e1b4b]">{detailPromo.title}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-bold text-[#8b87a8]">คำอธิบาย</dt>
                <dd className="whitespace-pre-wrap font-semibold text-[#1e1b4b]">
                  {detailPromo.description || "—"}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">ประเภท</dt>
                <dd className="font-semibold text-[#1e1b4b]">{detailPromo.kind}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">สถานะ</dt>
                <dd className="font-semibold text-[#1e1b4b]">{detailPromo.isActive ? "เปิด" : "ปิด"}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">มูลค่า (บาท)</dt>
                <dd className="font-semibold text-[#1e1b4b]">{baht(detailPromo.valueBaht)}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">เปอร์เซ็นต์</dt>
                <dd className="font-semibold text-[#1e1b4b]">{detailPromo.valuePercent}%</dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">ของแถม</dt>
                <dd className="font-semibold text-[#1e1b4b]">{detailPromo.giftLabel || "—"}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">ช่วงวัน</dt>
                <dd className="font-semibold text-[#1e1b4b]">
                  {detailPromo.startsOn} → {detailPromo.endsOn}
                </dd>
              </div>
            </dl>
          )
        ) : null}

        {detailKind === "finance-companies" && detailCompany ? (
          detailEditing ? (
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
          ) : (
            <dl className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-xs sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="font-bold text-[#8b87a8]">ชื่อบริษัท</dt>
                <dd className="font-semibold text-[#1e1b4b]">{detailCompany.name}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">ผู้ติดต่อ</dt>
                <dd className="font-semibold text-[#1e1b4b]">{detailCompany.contactName || "—"}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">เบอร์ติดต่อ</dt>
                <dd className="font-semibold text-[#1e1b4b]">{detailCompany.contactPhone || "—"}</dd>
              </div>
              <div>
                <dt className="font-bold text-[#8b87a8]">สถานะ</dt>
                <dd className="font-semibold text-[#1e1b4b]">{detailCompany.isActive ? "ใช้งาน" : "ปิด"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-bold text-[#8b87a8]">หมายเหตุ</dt>
                <dd className="whitespace-pre-wrap font-semibold text-[#1e1b4b]">{detailCompany.note || "—"}</dd>
              </div>
            </dl>
          )
        ) : null}
      </FormModal>

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
