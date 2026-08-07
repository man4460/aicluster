"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { AppEmptyState, AppImageLightbox, appTemplateOutlineButtonClass, printDataUrlImagePoster, useAppImageLightbox } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  createShopQrPosterCanvas,
  createShopQrPosterDataUrl,
  downloadPosterPdf,
  downloadPosterPng,
  shopQrTemplateGeneratedPosterThumbClass,
} from "@/components/qr/shop-qr-template";
import {
  createBuildingPosSessionApiRepository,
  type PosCategory,
  type PosIngredient,
  type PosKitchenDepartment,
  type PosMenuItem,
  type PosOrder,
  type PosPurchaseOrder,
} from "@/systems/building-pos/building-pos-service";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { BuildingPosOpenTablesPanel, BuildingPosSalesHistoryPanel } from "@/systems/building-pos/BuildingPosSalesAnalytics";
import { BuildingPosIngredientsPanel, BuildingPosPurchasesPanel } from "@/systems/building-pos/components/BuildingPosInventoryPanels";
import { BuildingPosStaffQrSection } from "@/systems/building-pos/components/BuildingPosStaffQrSection";
import { BUILDING_POS_ORDER_HREF, parseBuildingPosNav } from "@/systems/building-pos/building-pos-nav";
import {
  buildingPosStationPublicUrl,
} from "@/systems/building-pos/lib/station-role";
import {
  buildingPosChipActiveClass,
  buildingPosChipIdleClass,
  buildingPosContentPanelClass,
  buildingPosListRowCardClass,
  buildingPosQrHubOuterClass,
  buildingPosStatCardEmeraldClass,
  buildingPosStatCardIndigoClass,
  buildingPosStatCardVioletClass,
} from "@/systems/building-pos/components/building-pos-ui-tokens";
import { BuildingPosRemoteImg } from "@/systems/building-pos/components/building-pos-remote-image";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";

function tableQrStorageKey(ownerId: string) {
  return `mawell.buildingpos.tableQrLabels.${ownerId}`;
}

function PosThumb({ url, size = "md" }: { url: string; size?: "sm" | "md" }) {
  const box =
    size === "sm"
      ? "h-8 w-8 rounded-[0.65rem] text-[6px] leading-tight"
      : "h-14 w-14 rounded-[1.25rem] text-[9px] leading-tight";
  const placeholder = (
    <div
      className={`flex ${box} shrink-0 items-center justify-center border border-dashed border-[#d8d6ec] bg-[#f4f3ff] px-0.5 text-center text-[#9b98c4]`}
      aria-hidden
    >
      —
    </div>
  );
  return (
    <BuildingPosRemoteImg
      src={url}
      className={`${box} shrink-0 border border-[#e1e3ff] bg-white object-cover`}
      fallback={placeholder}
    />
  );
}

export function BuildingPosDashboardClient({
  ownerId,
  trialSessionId,
  isTrialSandbox,
  baseUrl,
  shopLabel,
  logoUrl,
  paymentChannelsNote,
}: {
  ownerId: string;
  trialSessionId: string;
  isTrialSandbox: boolean;
  baseUrl: string;
  shopLabel: string;
  logoUrl: string | null;
  /** จากโปรไฟล์ส่วนกลาง — แสดงบนบิล / QR */
  paymentChannelsNote?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const repo = useMemo(() => createBuildingPosSessionApiRepository(), []);
  const slipLightbox = useAppImageLightbox();

  const nav = useMemo(
    () => parseBuildingPosNav(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  useLayoutEffect(() => {
    const tabQ = searchParams.get("tab");
    if (tabQ === "ingredients" || tabQ === "purchases") {
      router.replace("/dashboard/building-pos?tab=finance&fin=costs");
      return;
    }
    if (tabQ === "orders") {
      router.replace("/dashboard/building-pos?tab=qr", { scroll: false });
      return;
    }
    if (tabQ === "categories") {
      router.replace("/dashboard/building-pos?tab=menu", { scroll: false });
      return;
    }
  }, [searchParams, router]);

  const [categories, setCategories] = useState<PosCategory[]>([]);
  const [kitchenDepartments, setKitchenDepartments] = useState<PosKitchenDepartment[]>([]);
  const [multiKitchenEnabled, setMultiKitchenEnabled] = useState(false);
  const [menuItems, setMenuItems] = useState<PosMenuItem[]>([]);
  const [orders, setOrders] = useState<PosOrder[]>([]);
  const [orderQrUrl, setOrderQrUrl] = useState("");
  const [orderQrPng, setOrderQrPng] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [catUploading, setCatUploading] = useState(false);
  const [menuUploading, setMenuUploading] = useState(false);
  const [posTableQrLabel, setPosTableQrLabel] = useState("");
  const [posTableQrPng, setPosTableQrPng] = useState<string | null>(null);
  const [posTablePosterUrl, setPosTablePosterUrl] = useState<string | null>(null);
  const [posTableQrBusy, setPosTableQrBusy] = useState(false);
  const [qrCardFocus, setQrCardFocus] = useState<"shop" | string>("shop");
  const [tableQrCards, setTableQrCards] = useState<string[] | null>(null);
  const [newTableCardInput, setNewTableCardInput] = useState("");
  const [ingredients, setIngredients] = useState<PosIngredient[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PosPurchaseOrder[]>([]);

  const [catForm, setCatForm] = useState({ name: "", image_url: "", sort_order: "1", is_active: true });
  const [menuForm, setMenuForm] = useState({
    category_id: "",
    kitchen_department_id: "",
    name: "",
    image_url: "",
    price: "",
    description: "",
    is_active: true,
    is_featured: false,
  });
  const [catManageOpen, setCatManageOpen] = useState(false);
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [catEditing, setCatEditing] = useState<PosCategory | null>(null);
  const [catSaving, setCatSaving] = useState(false);
  const [kitchenManageOpen, setKitchenManageOpen] = useState(false);
  const [kitchenFormOpen, setKitchenFormOpen] = useState(false);
  const [kitchenEditing, setKitchenEditing] = useState<PosKitchenDepartment | null>(null);
  const [kitchenSaving, setKitchenSaving] = useState(false);
  const [kitchenForm, setKitchenForm] = useState({ name: "", sort_order: "1", is_active: true });
  const [filterCat, setFilterCat] = useState<number | "all">("all");
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [menuEditing, setMenuEditing] = useState<PosMenuItem | null>(null);
  const [menuSaving, setMenuSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showStaffQrModal, setShowStaffQrModal] = useState(false);
  const [stationModal, setStationModal] = useState<"serve" | "kitchen" | null>(null);
  const [kitchenLinkDeptId, setKitchenLinkDeptId] = useState<number | null>(null);
  const [stationCopied, setStationCopied] = useState<string | null>(null);

  const kitchenUrl = useMemo(
    () => buildingPosStationPublicUrl(baseUrl, "kitchen", ownerId, trialSessionId),
    [baseUrl, ownerId, trialSessionId],
  );
  const serveUrl = useMemo(
    () => buildingPosStationPublicUrl(baseUrl, "serve", ownerId, trialSessionId),
    [baseUrl, ownerId, trialSessionId],
  );
  const activeKitchenDepartments = useMemo(
    () => kitchenDepartments.filter((d) => d.is_active),
    [kitchenDepartments],
  );
  const kitchenDeptNameById = useMemo(() => {
    const m = new Map<number, string>();
    kitchenDepartments.forEach((d) => m.set(d.id, d.name));
    return m;
  }, [kitchenDepartments]);

  const stationModalUrl = useMemo(() => {
    if (stationModal === "serve") return serveUrl;
    if (stationModal === "kitchen" && kitchenLinkDeptId != null) {
      return buildingPosStationPublicUrl(baseUrl, "kitchen", ownerId, trialSessionId, kitchenLinkDeptId);
    }
    return kitchenUrl;
  }, [baseUrl, kitchenLinkDeptId, kitchenUrl, ownerId, serveUrl, stationModal, trialSessionId]);

  const stationModalTitle = useMemo(() => {
    if (stationModal === "serve") return "ลิงก์แผนกเสิร์ฟ";
    if (kitchenLinkDeptId != null) {
      const name = kitchenDeptNameById.get(kitchenLinkDeptId) ?? "แผนกครัว";
      return `ลิงก์ครัว · ${name}`;
    }
    return "ลิงก์แผนกครัว";
  }, [kitchenDeptNameById, kitchenLinkDeptId, stationModal]);

  async function copyStationLink(copyKey: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setStationCopied(copyKey);
      window.setTimeout(() => setStationCopied(null), 1600);
    } catch {
      window.prompt("คัดลอกลิงก์:", url);
    }
  }

  const dashboardStats = useMemo(() => {
    const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    const ordersToday = orders.filter(
      (o) =>
        new Date(o.created_at).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }) === todayKey,
    );

    const paidRevenue = ordersToday.filter((o) => o.status === "PAID").reduce((s, o) => s + o.total_amount, 0);
    const customerSet = new Set(
      ordersToday
        .map((o) => `${o.customer_name.trim()}|${o.table_no.trim()}`)
        .filter((x) => x !== "|"),
    );

    const menuToCategory = new Map<number, number>();
    menuItems.forEach((m) => menuToCategory.set(m.id, m.category_id));
    const qtyByCategory = new Map<number, number>();
    ordersToday.forEach((o) => {
      o.items.forEach((it) => {
        const catId = menuToCategory.get(it.menu_item_id);
        if (!catId) return;
        qtyByCategory.set(catId, (qtyByCategory.get(catId) ?? 0) + it.qty);
      });
    });
    let bestCategoryLabel = "-";
    let bestQty = 0;
    qtyByCategory.forEach((qty, catId) => {
      if (qty > bestQty) {
        bestQty = qty;
        bestCategoryLabel = categories.find((c) => c.id === catId)?.name ?? "-";
      }
    });

    return {
      paidRevenue,
      uniqueCustomers: customerSet.size,
      bestCategoryLabel,
      bestCategoryQty: bestQty,
    };
  }, [orders, menuItems, categories]);

  const menuImageById = useMemo(() => {
    const m = new Map<number, string>();
    menuItems.forEach((x) => m.set(x.id, x.image_url ?? ""));
    return m;
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    if (filterCat === "all") return menuItems;
    return menuItems.filter((m) => m.category_id === filterCat);
  }, [menuItems, filterCat]);

  async function loadAll() {
    try {
      const [c, m, o, k] = await Promise.all([
        repo.listCategories(),
        repo.listMenuItems(),
        repo.listOrders(),
        repo.listKitchenDepartments().catch(() => ({ departments: [] as PosKitchenDepartment[], features: { multiKitchen: false } })),
      ]);
      setCategories(c);
      setMenuItems(m);
      setOrders(o);
      setKitchenDepartments(k.departments ?? []);
      setMultiKitchenEnabled(k.features?.multiKitchen === true);

      const inv = await Promise.allSettled([repo.listIngredients(), repo.listPurchaseOrders()]);
      setIngredients(inv[0].status === "fulfilled" ? inv[0].value : []);
      setPurchaseOrders(inv[1].status === "fulfilled" ? inv[1].value : []);
      setSyncError(null);
    } catch (e) {
      console.error("[building-pos] loadAll", e);
      const msg =
        e instanceof TypeError ?
          "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ — ตรวจว่าแอปยังรันอยู่ ฐานข้อมูลพร้อม และลองรีเฟรชหน้า"
        : e instanceof Error ? e.message
        : "โหลดข้อมูลไม่สำเร็จ";
      setSyncError(msg);
    }
  }

  async function refreshData() {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, [repo]);

  /** SSE — อัปเดตโต๊ะค้างเมื่อคิวเปลี่ยนจากออร์เดอร์ / ครัว / จัดส่ง */
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/building-pos/session/orders/board/stream");
      es.onmessage = () => {
        if (document.hidden) return;
        void loadAll();
      };
    } catch {
      /* SSE ไม่พร้อม — คงโพลตามช่วงเวลา */
    }
    return () => {
      es?.close();
    };
  }, [repo]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      void refreshData();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [refreshData]);

  useEffect(() => {
    const onFocusOrVisible = () => {
      if (document.hidden) return;
      void refreshData();
    };
    window.addEventListener("focus", onFocusOrVisible);
    document.addEventListener("visibilitychange", onFocusOrVisible);
    return () => {
      window.removeEventListener("focus", onFocusOrVisible);
      document.removeEventListener("visibilitychange", onFocusOrVisible);
    };
  }, [refreshData]);

  useEffect(() => {
    let cancelled = false;
    try {
      const raw = localStorage.getItem(tableQrStorageKey(ownerId));
      let next: string[];
      if (raw === null) {
        next = ["1", "2", "3", "4", "5", "6"];
      } else {
        const arr = JSON.parse(raw) as unknown;
        next =
          Array.isArray(arr) && arr.every((x) => typeof x === "string")
            ? (arr as string[]).map((s) => s.trim()).filter(Boolean).slice(0, 48)
            : ["1", "2", "3", "4", "5", "6"];
      }
      if (!cancelled) setTableQrCards(next);
    } catch {
      if (!cancelled) setTableQrCards(["1", "2", "3", "4", "5", "6"]);
    }
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  useEffect(() => {
    setQrCardFocus("shop");
  }, [ownerId]);

  useEffect(() => {
    if (tableQrCards === null) return;
    try {
      localStorage.setItem(tableQrStorageKey(ownerId), JSON.stringify(tableQrCards));
    } catch {
      /* ignore */
    }
  }, [ownerId, tableQrCards]);

  useEffect(() => {
    if (qrCardFocus === "shop") {
      setPosTableQrLabel("");
      return;
    }
    setPosTableQrLabel(qrCardFocus);
  }, [qrCardFocus]);

  useEffect(() => {
    const root = baseUrl.startsWith("http://") || baseUrl.startsWith("https://") ? baseUrl.replace(/\/$/, "") : "";
    if (!root) return;
    const params = new URLSearchParams();
    if (isTrialSandbox) params.set("t", trialSessionId);
    const q = params.toString();
    const url = `${root}/building-pos/order/${ownerId}${q ? `?${q}` : ""}`;
    setOrderQrUrl(url);
  }, [baseUrl, ownerId, isTrialSandbox, trialSessionId]);

  useEffect(() => {
    if (!orderQrUrl) return;
    QRCode.toDataURL(orderQrUrl, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setOrderQrPng)
      .catch(() => setOrderQrPng(null));
  }, [orderQrUrl]);

  useEffect(() => {
    if (!orderQrPng) return;
    void createShopQrPosterDataUrl({
      qrDataUrl: orderQrPng,
      shopLabel: shopLabel.trim() || "POS ร้านอาหารอาคาร",
      logoUrl: logoUrl?.trim() || null,
      tagline: "สแกนเพื่อสั่งอาหารด้วยตนเอง",
      subtitle: "เลือกเมนู ระบุโต๊ะ แล้วส่งออเดอร์เข้าครัว",
    }).then(setPosterUrl).catch(() => setPosterUrl(null));
  }, [orderQrPng, shopLabel, logoUrl]);

  const posTableOrderUrl = useMemo(() => {
    const root = baseUrl.startsWith("http://") || baseUrl.startsWith("https://") ? baseUrl.replace(/\/$/, "") : "";
    const table = posTableQrLabel.trim();
    if (!root || !table) return "";
    const params = new URLSearchParams();
    if (isTrialSandbox) params.set("t", trialSessionId);
    params.set("table", table);
    return `${root}/building-pos/order/${ownerId}?${params.toString()}`;
  }, [baseUrl, ownerId, isTrialSandbox, trialSessionId, posTableQrLabel]);

  useEffect(() => {
    if (!posTableOrderUrl) {
      setPosTableQrPng(null);
      return;
    }
    QRCode.toDataURL(posTableOrderUrl, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setPosTableQrPng)
      .catch(() => setPosTableQrPng(null));
  }, [posTableOrderUrl]);

  useEffect(() => {
    if (!posTableQrPng || !posTableQrLabel.trim()) {
      setPosTablePosterUrl(null);
      return;
    }
    const table = posTableQrLabel.trim();
    void createShopQrPosterDataUrl({
      qrDataUrl: posTableQrPng,
      shopLabel: shopLabel.trim() || "POS ร้านอาหารอาคาร",
      logoUrl: logoUrl?.trim() || null,
      tagline: "สแกนเพื่อสั่งอาหาร",
      subtitle: `โต๊ะ ${table} — ลูกค้าแสกนแล้วกรอกโต๊ะให้อัตโนมัติ`,
    })
      .then(setPosTablePosterUrl)
      .catch(() => setPosTablePosterUrl(null));
  }, [posTableQrPng, posTableQrLabel, shopLabel, logoUrl]);

  function openCatManage() {
    setCatFormOpen(false);
    setCatEditing(null);
    setCatManageOpen(true);
  }

  function openCatCreate() {
    setCatEditing(null);
    setCatForm({ name: "", image_url: "", sort_order: "1", is_active: true });
    setCatFormOpen(true);
    setCatManageOpen(true);
  }

  function openCatEdit(c: PosCategory) {
    setCatEditing(c);
    setCatForm({
      name: c.name,
      image_url: c.image_url ?? "",
      sort_order: String(c.sort_order),
      is_active: c.is_active,
    });
    setCatFormOpen(true);
    setCatManageOpen(true);
  }

  function closeCatForm() {
    if (catSaving) return;
    setCatFormOpen(false);
    setCatEditing(null);
  }

  async function submitCatModal() {
    const name = catForm.name.trim();
    const sort = Number(catForm.sort_order);
    if (!name || !Number.isFinite(sort)) return;
    setCatSaving(true);
    try {
      const payload = {
        name,
        image_url: catForm.image_url.trim(),
        sort_order: sort,
        is_active: catForm.is_active,
      };
      if (catEditing) {
        await repo.updateCategory(catEditing.id, payload);
      } else {
        await repo.createCategory(payload);
      }
      setCatFormOpen(false);
      setCatEditing(null);
      await loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setCatSaving(false);
    }
  }

  async function deleteCategoryRow(c: PosCategory) {
    if (!window.confirm(`ลบหมวดหมู่ "${c.name}" ?\n(ถ้ามีเมนูในหมวดนี้ต้องลบหรือย้ายเมนูก่อน)`)) return;
    try {
      await repo.deleteCategory(c.id);
      if (filterCat === c.id) setFilterCat("all");
      await loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  function openMenuCreate() {
    setMenuEditing(null);
    setMenuForm({
      category_id: filterCat === "all" ? "" : String(filterCat),
      kitchen_department_id: "",
      name: "",
      image_url: "",
      price: "",
      description: "",
      is_active: true,
      is_featured: false,
    });
    setMenuModalOpen(true);
  }

  function openMenuEdit(m: PosMenuItem) {
    setMenuEditing(m);
    setMenuForm({
      category_id: String(m.category_id),
      kitchen_department_id: m.kitchen_department_id != null ? String(m.kitchen_department_id) : "",
      name: m.name,
      image_url: m.image_url ?? "",
      price: String(m.price),
      description: m.description ?? "",
      is_active: m.is_active,
      is_featured: !!m.is_featured,
    });
    setMenuModalOpen(true);
  }

  async function submitMenuModal() {
    const categoryId = Number(menuForm.category_id);
    const price = Number(menuForm.price);
    if (!categoryId || !menuForm.name.trim() || !Number.isFinite(price)) return;
    setMenuSaving(true);
    try {
      const kitchenDeptRaw = menuForm.kitchen_department_id.trim();
      const kitchenDepartmentId =
        kitchenDeptRaw && Number.isFinite(Number(kitchenDeptRaw)) && Number(kitchenDeptRaw) > 0
          ? Number(kitchenDeptRaw)
          : null;
      const payload = {
        category_id: categoryId,
        kitchen_department_id: multiKitchenEnabled ? kitchenDepartmentId : null,
        name: menuForm.name.trim(),
        image_url: menuForm.image_url.trim(),
        price,
        description: menuForm.description.trim(),
        is_active: menuForm.is_active,
        is_featured: menuForm.is_featured,
      };
      if (menuEditing) {
        await repo.updateMenuItem(menuEditing.id, payload);
      } else {
        await repo.createMenuItem(payload);
      }
      setMenuModalOpen(false);
      setMenuEditing(null);
      await loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setMenuSaving(false);
    }
  }

  function openKitchenCreate() {
    setKitchenEditing(null);
    setKitchenForm({ name: "", sort_order: String(kitchenDepartments.length + 1), is_active: true });
    setKitchenFormOpen(true);
  }

  function openKitchenEdit(d: PosKitchenDepartment) {
    setKitchenEditing(d);
    setKitchenForm({
      name: d.name,
      sort_order: String(d.sort_order),
      is_active: d.is_active,
    });
    setKitchenFormOpen(true);
  }

  async function submitKitchenModal() {
    if (!kitchenForm.name.trim()) return;
    const sortOrder = Number(kitchenForm.sort_order);
    if (!Number.isFinite(sortOrder)) return;
    setKitchenSaving(true);
    try {
      const payload = {
        name: kitchenForm.name.trim(),
        sort_order: sortOrder,
        is_active: kitchenForm.is_active,
      };
      if (kitchenEditing) {
        await repo.updateKitchenDepartment(kitchenEditing.id, payload);
      } else {
        await repo.createKitchenDepartment(payload);
      }
      setKitchenFormOpen(false);
      setKitchenEditing(null);
      await loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setKitchenSaving(false);
    }
  }

  async function deleteKitchenRow(d: PosKitchenDepartment) {
    if (!window.confirm(`ลบแผนกครัว "${d.name}" ?\nเมนูที่ผูกแผนกนี้จะถูกยกเลิกการผูก`)) return;
    try {
      await repo.deleteKitchenDepartment(d.id);
      await loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  async function deleteMenuRow(m: PosMenuItem) {
    if (!window.confirm(`ลบเมนู "${m.name}" ?`)) return;
    try {
      await repo.deleteMenuItem(m.id);
      await loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  async function toggleMenuFeatured(m: PosMenuItem) {
    try {
      await repo.patchMenuItem(m.id, { is_featured: !m.is_featured });
      await loadAll();
    } catch {
      /* ignore */
    }
  }

  async function downloadQrPng() {
    if (!orderQrPng) return;
    setQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: orderQrPng,
        shopLabel: shopLabel.trim() || "POS ร้านอาหารอาคาร",
        logoUrl: logoUrl?.trim() || null,
        tagline: "สแกนเพื่อสั่งอาหารด้วยตนเอง",
        subtitle: "เลือกเมนู ระบุโต๊ะ แล้วส่งออเดอร์เข้าครัว",
      });
      await downloadPosterPng(canvas, "building-pos-qr-poster.png");
    } finally {
      setQrBusy(false);
    }
  }

  async function downloadQrPdf() {
    if (!orderQrPng) return;
    setQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: orderQrPng,
        shopLabel: shopLabel.trim() || "POS ร้านอาหารอาคาร",
        logoUrl: logoUrl?.trim() || null,
        tagline: "สแกนเพื่อสั่งอาหารด้วยตนเอง",
        subtitle: "เลือกเมนู ระบุโต๊ะ แล้วส่งออเดอร์เข้าครัว",
      });
      await downloadPosterPdf(canvas, "building-pos-qr-poster-a4.pdf", "a4");
    } finally {
      setQrBusy(false);
    }
  }

  async function downloadQrPdfA5() {
    if (!orderQrPng) return;
    setQrBusy(true);
    try {
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: orderQrPng,
        shopLabel: shopLabel.trim() || "POS ร้านอาหารอาคาร",
        logoUrl: logoUrl?.trim() || null,
        tagline: "สแกนเพื่อสั่งอาหารด้วยตนเอง",
        subtitle: "เลือกเมนู ระบุโต๊ะ แล้วส่งออเดอร์เข้าครัว",
      });
      await downloadPosterPdf(canvas, "building-pos-qr-poster-a5.pdf", "a5");
    } finally {
      setQrBusy(false);
    }
  }

  function printQrPoster(size: "A4" | "A5") {
    if (!posterUrl) return;
    const ok = printDataUrlImagePoster({
      dataUrl: posterUrl,
      documentTitle: "พิมพ์ QR สั่งอาหาร",
      pageSize: size,
    });
    if (!ok) window.alert("เปิดหน้าต่างพิมพ์ไม่ได้ — ลองอนุญาตป๊อปอัปหรือใช้ดาวน์โหลด PDF แทน");
  }

  function printPosTablePoster(size: "A4" | "A5") {
    if (!posTablePosterUrl) return;
    const ok = printDataUrlImagePoster({
      dataUrl: posTablePosterUrl,
      documentTitle: "พิมพ์ QR โต๊ะ",
      pageSize: size,
    });
    if (!ok) window.alert("เปิดหน้าต่างพิมพ์ไม่ได้ — ลองอนุญาตป๊อปอัปหรือใช้ดาวน์โหลด PDF แทน");
  }

  async function copyOrderLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.alert("คัดลอกไม่สำเร็จ — ลองเลือกลิงก์ด้วยตนเอง");
    }
  }

  async function downloadPosTablePng() {
    if (!posTableQrPng || !posTableQrLabel.trim()) return;
    setPosTableQrBusy(true);
    try {
      const table = posTableQrLabel.trim().replace(/[^\w\u0E00-\u0E7F-]+/g, "-");
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: posTableQrPng,
        shopLabel: shopLabel.trim() || "POS ร้านอาหารอาคาร",
        logoUrl: logoUrl?.trim() || null,
        tagline: "สแกนเพื่อสั่งอาหาร",
        subtitle: `โต๊ะ ${posTableQrLabel.trim()}`,
      });
      await downloadPosterPng(canvas, `building-pos-table-${table || "qr"}.png`);
    } finally {
      setPosTableQrBusy(false);
    }
  }

  async function downloadPosTablePdf(size: "a4" | "a5") {
    if (!posTableQrPng || !posTableQrLabel.trim()) return;
    setPosTableQrBusy(true);
    try {
      const table = posTableQrLabel.trim().replace(/[^\w\u0E00-\u0E7F-]+/g, "-");
      const canvas = await createShopQrPosterCanvas({
        qrDataUrl: posTableQrPng,
        shopLabel: shopLabel.trim() || "POS ร้านอาหารอาคาร",
        logoUrl: logoUrl?.trim() || null,
        tagline: "สแกนเพื่อสั่งอาหาร",
        subtitle: `โต๊ะ ${posTableQrLabel.trim()}`,
      });
      const suffix = size === "a5" ? "a5" : "a4";
      await downloadPosterPdf(canvas, `building-pos-table-${table || "qr"}-${suffix}.pdf`, size);
    } finally {
      setPosTableQrBusy(false);
    }
  }

  async function uploadImage(file: File): Promise<string | null> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/building-pos/session/images/upload", {
      method: "POST",
      body: form,
      credentials: "include",
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; imageUrl?: string };
    if (!res.ok) throw new Error(data.error || "อัปโหลดรูปไม่สำเร็จ");
    return data.imageUrl ?? null;
  }

  async function moveOrderStatus(
    id: number,
    status: PosOrder["status"],
    extra?: { member_phone?: string },
  ) {
    await repo.updateOrder(id, {
      status,
      ...(extra?.member_phone ? { member_phone: extra.member_phone } : {}),
    });
    await loadAll();
  }

  async function saveOrderPaymentSlip(orderId: number, imageUrl: string) {
    await repo.updateOrder(orderId, { payment_slip_url: imageUrl });
    await loadAll();
  }

  async function onSalesHistoryOrderStatusChange(
    id: number,
    status: PosOrder["status"],
    extra?: { member_phone?: string },
  ) {
    await repo.updateOrder(id, {
      status,
      ...(extra?.member_phone ? { member_phone: extra.member_phone } : {}),
    });
    await loadAll();
  }

  async function onSalesHistoryOrderDelete(id: number) {
    if (!window.confirm(`ลบออเดอร์ #${id} ?`)) return;
    await repo.deleteOrder(id);
    await loadAll();
  }

  function addTableQrCard() {
    const t = newTableCardInput.trim();
    if (!t || tableQrCards === null) return;
    if (tableQrCards.includes(t)) {
      setNewTableCardInput("");
      setQrCardFocus(t);
      return;
    }
    setTableQrCards((prev) => (prev ? [...prev, t] : [t]));
    setNewTableCardInput("");
    setQrCardFocus(t);
  }

  function removeTableQrCard(label: string) {
    setTableQrCards((prev) => (prev ? prev.filter((x) => x !== label) : prev));
    setQrCardFocus((f) => (f === label ? "shop" : f));
  }

  return (
    <div className="max-w-full space-y-4 sm:space-y-6">
      {syncError ? (
        <div
          role="alert"
          className="rounded-[1.25rem] border border-rose-200 bg-rose-50/95 px-4 py-3 text-sm text-rose-900 shadow-sm"
        >
          <p className="font-semibold">ซิงค์ข้อมูล POS ไม่สำเร็จ</p>
          <p className="mt-1 text-rose-800/90">{syncError}</p>
          <button
            type="button"
            className="mt-3 rounded-xl bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-800"
            onClick={() => void loadAll()}
          >
            ลองอีกครั้ง
          </button>
        </div>
      ) : null}
      {nav.main === "overview" ? (
        <div className="space-y-5 sm:space-y-6">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className={buildingPosStatCardEmeraldClass}>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800/70">รายรับวันนี้</p>
              <p className="mt-3 text-2xl font-black tabular-nums tracking-tight text-emerald-800 sm:text-3xl">
                ฿{dashboardStats.paidRevenue.toLocaleString()}
              </p>
              <p className="mt-2 hidden text-[11px] font-medium text-emerald-900/60 sm:block">ชำระแล้ว · เขตเวลาไทย</p>
              <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-600 opacity-[0.06] blur-2xl" />
            </div>
            <div className={buildingPosStatCardVioletClass}>
              <p className="text-[10px] font-black uppercase tracking-widest text-violet-800/70">หมวดขายดี</p>
              <p className="mt-3 text-lg font-black leading-snug tracking-tight text-[#1e1b4b] sm:text-xl">
                {dashboardStats.bestCategoryLabel}
              </p>
              <p className="mt-2 hidden text-xs font-medium text-[#66638c] sm:block">
                ขายรวม {dashboardStats.bestCategoryQty.toLocaleString()} จาน/แก้ว
              </p>
              <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-violet-600 opacity-[0.06] blur-2xl" />
            </div>
            <div className={`${buildingPosStatCardIndigoClass} col-span-2 sm:col-span-1`}>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-800/70">ลูกค้าวันนี้</p>
              <p className="mt-3 text-2xl font-black tabular-nums tracking-tight text-indigo-900 sm:text-3xl">
                {dashboardStats.uniqueCustomers.toLocaleString()}
              </p>
              <p className="mt-2 hidden text-xs font-medium text-indigo-900/65 sm:block">นับจากชื่อ/โต๊ะที่มีออเดอร์</p>
              <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-indigo-600 opacity-[0.06] blur-2xl" />
            </div>
          </section>

          <BuildingPosOpenTablesPanel
            orders={orders}
            menuImageById={menuImageById}
            onOrderStatusChange={(id, status) => void moveOrderStatus(id, status)}
            onOrderDelete={(id) => void onSalesHistoryOrderDelete(id)}
            onOrderPaymentSlipSaved={(id, url) => saveOrderPaymentSlip(id, url)}
            shopLabel={shopLabel}
            logoUrl={logoUrl}
            paymentChannelsNote={paymentChannelsNote ?? null}
            headerAction={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void refreshData()}
                  disabled={refreshing}
                  aria-busy={refreshing}
                  className={cn(
                    appTemplateOutlineButtonClass,
                    "inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-0 px-0 sm:min-w-0 sm:gap-1.5 sm:px-4",
                    "border-[#dcd8f0] bg-white/80 text-[#4d47b6] disabled:opacity-60",
                  )}
                  aria-label={refreshing ? "กำลังรีเฟรชออเดอร์" : "รีเฟรชออเดอร์"}
                  title="รีเฟรชออเดอร์"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={cn("h-5 w-5 shrink-0", refreshing && "animate-spin")}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.25}
                    aria-hidden
                  >
                    <path
                      d="M21 12a9 9 0 11-3.05-6.65M21 3v6h-6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="hidden text-sm font-semibold sm:inline">
                    {refreshing ? "กำลังรีเฟรช…" : "รีเฟรช"}
                  </span>
                </button>
                <Link
                  href={BUILDING_POS_ORDER_HREF}
                  className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-white/75 px-0 text-sm font-black text-[#5b61ff] shadow-sm ring-1 ring-[#5b61ff]/25 backdrop-blur-sm touch-manipulation transition-colors hover:bg-white active:opacity-90 sm:min-w-[6rem] sm:px-4"
                  aria-label="ไปหน้าออร์เดอร์"
                >
                  <span className="sm:hidden" aria-hidden>
                    +
                  </span>
                  <span className="hidden sm:inline">ออเดอร์</span>
                </Link>
              </div>
            }
          />
        </div>
      ) : null}

      {nav.main === "menu" ? (
        <section className={buildingPosContentPanelClass}>
          <div className="flex flex-row items-start justify-between gap-3 border-b border-[#ecebff] pb-4">
            <h2 className="min-w-0 text-lg font-black tracking-tight text-[#1e1b4b]">เมนูอาหาร</h2>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => openCatManage()}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] items-center justify-center rounded-xl px-3 text-xs font-semibold text-[#4d47b6] sm:px-4 sm:text-sm",
                )}
                aria-label="จัดการหมวดหมู่"
                title="หมวดหมู่ — เพิ่ม แก้ไข ลบ"
              >
                หมวดหมู่
              </button>
              {multiKitchenEnabled ? (
                <button
                  type="button"
                  onClick={() => {
                    setKitchenFormOpen(false);
                    setKitchenEditing(null);
                    setKitchenManageOpen(true);
                  }}
                  className={cn(
                    appTemplateOutlineButtonClass,
                    "inline-flex min-h-[40px] items-center justify-center rounded-xl px-3 text-xs font-semibold text-[#4d47b6] sm:px-4 sm:text-sm",
                  )}
                  aria-label="จัดการแผนกครัว"
                  title="แผนกครัว — เพิ่ม แก้ไข ลบ"
                >
                  แผนกครัว
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => openMenuCreate()}
                className="app-btn-primary inline-flex min-h-[40px] items-center justify-center gap-1 rounded-xl px-3 text-sm font-semibold sm:px-4 sm:py-2.5"
                aria-label="เพิ่มเมนู"
              >
                <span aria-hidden>+</span>
                <span>เพิ่มเมนู</span>
              </button>
            </div>
          </div>

          <div
            className="mt-4 min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth pb-1 [-webkit-overflow-scrolling:touch]"
            role="group"
            aria-label="กรองตามหมวดหมู่ — เลื่อนซ้ายขวาได้"
          >
            <div className="flex w-max touch-pan-x gap-2 pr-1 sm:flex-wrap sm:pr-0">
              <button
                type="button"
                onClick={() => setFilterCat("all")}
                className={cn(
                  "shrink-0 snap-start transition",
                  filterCat === "all" ? buildingPosChipActiveClass : buildingPosChipIdleClass,
                )}
                aria-pressed={filterCat === "all"}
              >
                ทั้งหมด
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFilterCat(c.id)}
                  className={cn(
                    "shrink-0 snap-start transition",
                    filterCat === c.id ? buildingPosChipActiveClass : buildingPosChipIdleClass,
                  )}
                  aria-pressed={filterCat === c.id}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {filteredMenuItems.length === 0 ? (
            <AppEmptyState tone="violet" className="mt-4">
              {categories.length === 0
                ? "เริ่มจากเพิ่มหมวด แล้วเพิ่มเมนู"
                : filterCat === "all"
                  ? "ยังไม่มีเมนูอาหาร"
                  : "ไม่มีเมนูในหมวดนี้"}
            </AppEmptyState>
          ) : (
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMenuItems.map((m) => (
              <li
                key={m.id}
                className={`group/item flex min-h-[72px] items-center gap-3 p-3 sm:p-4 ${buildingPosListRowCardClass}`}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-gradient-to-b from-[#4338ca] via-[#5b61ff] to-[#0d9488] opacity-90"
                />
                <PosThumb url={m.image_url} />
                <div className="relative min-w-0 flex-1">
                  <p className="font-black tracking-tight text-[#1e1b4b]">{m.name}</p>
                  <p className="mt-0.5 text-xs text-[#66638c]">
                    ฿{m.price.toLocaleString()} · {categories.find((c) => c.id === m.category_id)?.name ?? "-"}
                    {multiKitchenEnabled && m.kitchen_department_id
                      ? ` · ครัว ${kitchenDeptNameById.get(m.kitchen_department_id) ?? m.kitchen_department_id}`
                      : ""}
                  </p>
                  {!m.is_active ? <span className="mt-1 inline-block text-xs text-amber-700">ปิดใช้งาน</span> : null}
                </div>
                <div className="relative flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void toggleMenuFeatured(m)}
                    className={cn(
                      "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border text-sm",
                      m.is_featured
                        ? "border-amber-300 bg-amber-50 text-amber-900"
                        : "border-[#e1e3ff] bg-white text-[#66638c]",
                    )}
                    aria-label={m.is_featured ? `ยกเลิกแนะนำ ${m.name}` : `ตั้งแนะนำ ${m.name}`}
                    title={m.is_featured ? "ยกเลิกแนะนำ" : "ตั้งเป็นแนะนำ"}
                    aria-pressed={m.is_featured}
                  >
                    <span aria-hidden>{m.is_featured ? "★" : "☆"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openMenuEdit(m)}
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไขเมนู ${m.name}`}
                    title="แก้ไข"
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteMenuRow(m)}
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบเมนู ${m.name}`}
                    title="ลบ"
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          )}
        </section>
      ) : null}

      {nav.main === "qr" && nav.qr === "customer" ? (
        <div className="space-y-4">
          <section className={buildingPosQrHubOuterClass}>
            <div className="border-b border-white/50 bg-gradient-to-r from-[#4d47b6]/[0.08] via-transparent to-[#0d9488]/[0.06] px-4 py-4 sm:px-6 sm:py-5">
              <h2 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">ศูนย์ QR</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:gap-6 sm:p-6">
              <button
                type="button"
                onClick={() => {
                  setShowStaffQrModal(false);
                  setShowQrModal(true);
                }}
                className={cn(
                  "group relative w-full overflow-hidden rounded-[2.5rem] border border-white/50 text-left",
                  "bg-gradient-to-br from-white/50 via-indigo-50/35 to-violet-200/25",
                  "p-6 shadow-[0_28px_70px_-24px_rgba(91,97,255,0.42),inset_0_1px_0_0_rgba(255,255,255,0.65)] backdrop-blur-2xl",
                  "ring-1 ring-inset ring-white/60 transition-all duration-300",
                  "hover:-translate-y-1 hover:border-white/75 hover:shadow-[0_34px_85px_-22px_rgba(91,97,255,0.48)]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b61ff]",
                )}
                aria-label="เปิดจัดการ QR ลูกค้า"
              >
                <span className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#5b61ff]/28 blur-3xl" aria-hidden />
                <div className="relative flex items-start gap-4 sm:gap-5">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/55 ring-1 ring-white/75 backdrop-blur-md sm:h-16 sm:w-16">
                    <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#5b61ff] sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <path d="M14 14h3v3h-3zM20 14h1v1h-1zM18 18h3v3h-3z" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">QR ลูกค้า</h3>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">สร้าง QR ร้านหรือโต๊ะ แล้วส่งออกเป็นลิงก์/ไฟล์ได้ทันที</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowQrModal(false);
                  setShowStaffQrModal(true);
                }}
                className={cn(
                  "group relative w-full overflow-hidden rounded-[2.5rem] border border-white/50 text-left",
                  "bg-gradient-to-br from-white/50 via-amber-50/35 to-orange-100/22",
                  "p-6 shadow-[0_28px_70px_-24px_rgba(217,119,6,0.35),inset_0_1px_0_0_rgba(255,255,255,0.65)] backdrop-blur-2xl",
                  "ring-1 ring-inset ring-white/60 transition-all duration-300",
                  "hover:-translate-y-1 hover:border-white/75 hover:shadow-[0_34px_85px_-22px_rgba(217,119,6,0.4)]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600",
                )}
                aria-label="เปิดจัดการ QR พนักงาน"
              >
                <span className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-amber-400/25 blur-3xl" aria-hidden />
                <div className="relative flex items-start gap-4 sm:gap-5">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/55 ring-1 ring-white/75 backdrop-blur-md sm:h-16 sm:w-16">
                    <svg viewBox="0 0 24 24" className="h-7 w-7 text-amber-700 sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">QR พนักงาน</h3>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">ลิงก์คงที่สำหรับเข้าหน้าจัดการออเดอร์พนักงาน</p>
                  </div>
                </div>
              </button>

              {multiKitchenEnabled && activeKitchenDepartments.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-black uppercase tracking-wide text-[#66638c]">ลิงก์ครัวตามแผนก</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeKitchenDepartments.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setShowQrModal(false);
                          setShowStaffQrModal(false);
                          setKitchenLinkDeptId(d.id);
                          setStationModal("kitchen");
                        }}
                        className={cn(
                          "group relative w-full overflow-hidden rounded-[2rem] border border-white/50 text-left",
                          "bg-gradient-to-br from-white/50 via-sky-50/50 to-cyan-100/30",
                          "p-5 shadow-md backdrop-blur-2xl ring-1 ring-inset ring-white/60 transition",
                          "hover:-translate-y-0.5 hover:border-white/75",
                        )}
                        aria-label={`เปิดลิงก์ครัว ${d.name}`}
                      >
                        <h3 className="text-base font-black tracking-tight text-[#1e1b4b]">{d.name}</h3>
                        <p className="mt-1 text-xs font-medium text-slate-600">เฉพาะเมนูที่จำแนกไว้แผนกนี้</p>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQrModal(false);
                      setShowStaffQrModal(false);
                      setKitchenLinkDeptId(null);
                      setStationModal("kitchen");
                    }}
                    className={cn(
                      appTemplateOutlineButtonClass,
                      "w-full min-h-[44px] rounded-xl text-sm font-black text-[#4d47b6]",
                    )}
                  >
                    ลิงก์ครัวรวม (ทุกเมนู)
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowQrModal(false);
                    setShowStaffQrModal(false);
                    setKitchenLinkDeptId(null);
                    setStationModal("kitchen");
                  }}
                  className={cn(
                    "group relative w-full overflow-hidden rounded-[2.5rem] border border-white/50 text-left",
                    "bg-gradient-to-br from-white/50 via-sky-50/50 to-cyan-100/30",
                    "p-6 shadow-[0_28px_70px_-24px_rgba(14,165,233,0.35),inset_0_1px_0_0_rgba(255,255,255,0.65)] backdrop-blur-2xl",
                    "ring-1 ring-inset ring-white/60 transition-all duration-300",
                    "hover:-translate-y-1 hover:border-white/75 hover:shadow-[0_34px_85px_-22px_rgba(14,165,233,0.42)]",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600",
                  )}
                  aria-label="เปิดลิงก์แผนกครัว"
                >
                  <span className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-sky-400/25 blur-3xl" aria-hidden />
                  <div className="relative flex items-start gap-4 sm:gap-5">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/55 ring-1 ring-white/75 backdrop-blur-md sm:h-16 sm:w-16">
                      <svg viewBox="0 0 24 24" className="h-7 w-7 text-sky-700 sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M4 10h16v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8z" strokeLinejoin="round" />
                        <path d="M8 10V7a4 4 0 018 0v3M8 14h.01M12 14h.01M16 14h.01" strokeLinecap="round" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <h3 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">แผนกครัว</h3>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                        {multiKitchenEnabled
                          ? "ยังไม่มีแผนก — ไปที่แท็บเมนู → แผนกครัว เพื่อเพิ่ม แล้วจะได้ลิงก์แยกตามแผนก"
                          : "รับออเดอร์ · กำลังทำ · กด «ทำเสร็จแล้ว» เพื่อส่งต่อแผนกเสิร์ฟ"}
                      </p>
                    </div>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowQrModal(false);
                  setShowStaffQrModal(false);
                  setStationModal("serve");
                }}
                className={cn(
                  "group relative w-full overflow-hidden rounded-[2.5rem] border border-white/50 text-left",
                  "bg-gradient-to-br from-white/50 via-emerald-50/45 to-teal-100/28",
                  "p-6 shadow-[0_28px_70px_-24px_rgba(16,185,129,0.35),inset_0_1px_0_0_rgba(255,255,255,0.65)] backdrop-blur-2xl",
                  "ring-1 ring-inset ring-white/60 transition-all duration-300",
                  "hover:-translate-y-1 hover:border-white/75 hover:shadow-[0_34px_85px_-22px_rgba(16,185,129,0.42)]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600",
                )}
                aria-label="เปิดลิงก์แผนกเสิร์ฟ"
              >
                <span className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-400/22 blur-3xl" aria-hidden />
                <div className="relative flex items-start gap-4 sm:gap-5">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/55 ring-1 ring-white/75 backdrop-blur-md sm:h-16 sm:w-16">
                    <svg viewBox="0 0 24 24" className="h-7 w-7 text-emerald-700 sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="text-lg font-black tracking-tight text-[#1e1b4b] sm:text-xl">แผนกเสิร์ฟ</h3>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
                      ทำเสร็จแล้ว · กำลังเสิร์ฟ · เสิร์ฟเรียบร้อย
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </section>

          <FormModal
            open={showQrModal}
            onClose={() => setShowQrModal(false)}
            title="QR ลูกค้า"
            appearance="glass"
            glassTint="violet"
            size="lg"
            mobileCentered
            footer={
              <div className="flex w-full justify-end">
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-white/55 bg-white/70 px-4 text-sm font-black text-[#5b61ff] shadow-sm backdrop-blur-sm"
                >
                  <span aria-hidden>✕</span>
                  ปิด
                </button>
              </div>
            }
          >
            <div className="space-y-4">
              {tableQrCards === null ? (
                <p className="text-sm text-[#66638c]">กำลังโหลดการ์ดโต๊ะ…</p>
              ) : (
                <>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    <li>
                      <button
                        type="button"
                        onClick={() => setQrCardFocus("shop")}
                        className={cn(
                          "flex h-full min-h-[120px] w-full flex-col rounded-[1.25rem] border p-3 text-left shadow-sm transition",
                          qrCardFocus === "shop"
                            ? "border-[#4d47b6] bg-gradient-to-b from-[#ecebff] to-white ring-2 ring-[#4d47b6]/25"
                            : "border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 hover:border-[#4d47b6]/35",
                        )}
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#4d47b6]">ทั่วไป</span>
                        <span className="mt-2 text-center text-sm font-bold text-[#2e2a58]">QR ร้าน</span>
                        <span className="mt-1 text-center text-[11px] text-[#66638c]">ลูกค้ากรอกโต๊ะเอง</span>
                      </button>
                    </li>
                    {tableQrCards.map((label) => (
                      <li key={label} className="relative">
                        <button
                          type="button"
                          onClick={() => setQrCardFocus(label)}
                          className={cn(
                            "flex h-full min-h-[120px] w-full flex-col rounded-[1.25rem] border p-3 pr-8 text-left shadow-sm transition",
                            qrCardFocus === label
                              ? "border-[#4d47b6] bg-gradient-to-b from-[#ecebff] to-white ring-2 ring-[#4d47b6]/25"
                              : "border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 hover:border-[#4d47b6]/35",
                          )}
                        >
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#66638c]">โต๊ะ</span>
                          <span className="mt-2 line-clamp-2 text-center text-xl font-bold tabular-nums text-[#2e2a58]">{label}</span>
                        </button>
                        <button
                          type="button"
                          className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-xs font-bold text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`ลบการ์ดโต๊ะ ${label}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTableQrCard(label);
                          }}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col gap-2 rounded-[1.25rem] border border-dashed border-[#d8d6ec] bg-white/50 p-3 sm:flex-row sm:items-end sm:gap-3">
                    <label className="min-w-0 flex-1 text-xs font-medium text-[#4d47b6]">
                      เพิ่มการ์ดโต๊ะ
                      <input
                        className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
                        placeholder="เช่น A1, บาร์, VIP"
                        value={newTableCardInput}
                        onChange={(e) => setNewTableCardInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTableQrCard();
                          }
                        }}
                        autoComplete="off"
                      />
                    </label>
                    <button type="button" onClick={() => addTableQrCard()} className="app-btn-primary shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold">
                      เพิ่มการ์ด
                    </button>
                  </div>
                </>
              )}
              <div className="rounded-[1.25rem] border border-[#e1e3ff] bg-white/80 p-4 shadow-inner backdrop-blur-sm sm:p-5">
                {qrCardFocus === "shop" ? (
                  <>
                    <h3 className="text-sm font-semibold text-[#2e2a58] sm:text-base">ส่งออก QR — ร้านทั่วไป</h3>
                    {baseUrl.startsWith("http") && orderQrUrl ? (
                      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                        {posterUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={posterUrl} alt="QR สั่งอาหารร้าน" className={cn(shopQrTemplateGeneratedPosterThumbClass, "shrink-0")} />
                        ) : null}
                        <div className="grid w-full max-w-md flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                          <button type="button" onClick={() => void copyOrderLink(orderQrUrl)} className="app-btn-soft rounded-xl px-4 py-3 text-sm font-semibold text-[#4d47b6] sm:col-span-2 sm:py-2">คัดลอกลิงก์</button>
                          <button type="button" disabled={qrBusy || !orderQrUrl} onClick={() => void downloadQrPdf()} className="app-btn-primary rounded-xl px-4 py-3 text-sm font-semibold sm:py-2">ดาวน์โหลด PDF (A4)</button>
                          <button type="button" disabled={qrBusy || !orderQrUrl} onClick={() => void downloadQrPng()} className="app-btn-soft rounded-xl px-4 py-3 text-sm font-semibold text-[#4d47b6] sm:py-2">ดาวน์โหลด PNG</button>
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-[#2e2a58] sm:text-base">ส่งออก QR — โต๊ะ {qrCardFocus}</h3>
                    {baseUrl.startsWith("http") && posTableOrderUrl ? (
                      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                        {posTablePosterUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={posTablePosterUrl} alt={`QR โต๊ะ ${qrCardFocus}`} className={cn(shopQrTemplateGeneratedPosterThumbClass, "shrink-0")} />
                        ) : null}
                        <div className="grid w-full max-w-md flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                          <button type="button" onClick={() => void copyOrderLink(posTableOrderUrl)} className="app-btn-soft rounded-xl px-4 py-3 text-sm font-semibold text-[#4d47b6] sm:col-span-2 sm:py-2">คัดลอกลิงก์</button>
                          <button type="button" disabled={posTableQrBusy || !posTableQrPng} onClick={() => void downloadPosTablePdf("a4")} className="app-btn-primary rounded-xl px-4 py-3 text-sm font-semibold sm:py-2">ดาวน์โหลด PDF (A4)</button>
                          <button type="button" disabled={posTableQrBusy || !posTableQrPng} onClick={() => void downloadPosTablePng()} className="app-btn-soft rounded-xl px-4 py-3 text-sm font-semibold text-[#4d47b6] sm:py-2">ดาวน์โหลด PNG</button>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </FormModal>

          <FormModal
            open={showStaffQrModal}
            onClose={() => setShowStaffQrModal(false)}
            title="QR พนักงาน"
            appearance="glass"
            glassTint="amber"
            size="lg"
            mobileCentered
            footer={
              <div className="flex w-full justify-end">
                <button
                  type="button"
                  onClick={() => setShowStaffQrModal(false)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-white/55 bg-white/70 px-4 text-sm font-black text-amber-700 shadow-sm backdrop-blur-sm"
                >
                  <span aria-hidden>✕</span>
                  ปิด
                </button>
              </div>
            }
          >
            <BuildingPosStaffQrSection shopLabel={shopLabel} logoUrl={logoUrl} compactForModal />
          </FormModal>

          <FormModal
            open={stationModal !== null}
            onClose={() => {
              setStationModal(null);
              setKitchenLinkDeptId(null);
            }}
            title={stationModalTitle}
            description={
              stationModal === "serve"
                ? "เปิดบนมือถือ/แท็บเล็ตเสิร์ฟ — ทำเสร็จแล้ว · กำลังเสิร์ฟ · เสิร์ฟเรียบร้อย"
                : kitchenLinkDeptId != null
                  ? "เปิดบนครัวแผนกนี้ — เห็นเฉพาะเมนูที่จำแนกไว้แผนกนี้"
                  : "เปิดบนครัว — กด «ทำเสร็จแล้ว · ส่งต่อแผนกเสิร์ฟ» เมื่อทำอาหารเสร็จ"
            }
            appearance="glass"
            glassTint="violet"
            size="md"
            mobileCentered
            footer={
              <div className="flex w-full justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setStationModal(null);
                    setKitchenLinkDeptId(null);
                  }}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-white/55 bg-white/70 px-4 text-sm font-black text-[#5b61ff] shadow-sm backdrop-blur-sm"
                >
                  ปิด
                </button>
              </div>
            }
          >
            {stationModal ? (
              <div className="space-y-3">
                <p className="break-all rounded-[1.25rem] border border-[#e1e3ff] bg-[#faf9ff] px-3 py-2.5 text-xs font-semibold text-[#2e2a58]">
                  {stationModalUrl}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="app-btn-primary min-h-[44px] flex-1 rounded-xl px-4 text-sm font-black"
                    onClick={() => window.open(stationModalUrl, "_blank", "noopener,noreferrer")}
                  >
                    เปิดลิงก์
                  </button>
                  <button
                    type="button"
                    className={cn(
                      appTemplateOutlineButtonClass,
                      "min-h-[44px] flex-1 rounded-xl px-4 text-sm font-black text-[#4d47b6]",
                    )}
                    onClick={() =>
                      void copyStationLink(
                        kitchenLinkDeptId != null
                          ? `kitchen-${kitchenLinkDeptId}`
                          : stationModal,
                        stationModalUrl,
                      )
                    }
                  >
                    {stationCopied ===
                    (kitchenLinkDeptId != null ? `kitchen-${kitchenLinkDeptId}` : stationModal)
                      ? "คัดลอกแล้ว"
                      : "คัดลอกลิงก์"}
                  </button>
                </div>
              </div>
            ) : null}
          </FormModal>
        </div>
      ) : null}

      {nav.main === "finance" && nav.finance === "sales" ? (
        <div className="space-y-4 sm:space-y-5">
          <BuildingPosSalesHistoryPanel
            orders={orders}
            categories={categories}
            menuItems={menuItems}
            onOrderStatusChange={(id, s) => void onSalesHistoryOrderStatusChange(id, s)}
            onOrderDelete={(id) => void onSalesHistoryOrderDelete(id)}
            onRefresh={() => void refreshData()}
            refreshing={refreshing}
            onSlipImageOpen={(url) => slipLightbox.open(url)}
          />
          <AppImageLightbox src={slipLightbox.src} alt="สลิปโอน" onClose={slipLightbox.close} />
        </div>
      ) : null}

      {nav.main === "finance" && nav.finance === "costs" ? (
        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap justify-end gap-2 print:hidden">
            <button
              type="button"
              onClick={() => void refreshData()}
              disabled={refreshing}
              aria-busy={refreshing}
              aria-label="รีเฟรชข้อมูลต้นทุน"
              title="รีเฟรช"
              className={cn(
                appTemplateOutlineButtonClass,
                "inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-0 px-0 sm:min-w-0 sm:gap-1.5 sm:px-4",
                "border-[#dcd8f0] bg-white/80 text-[#4d47b6] disabled:opacity-60",
              )}
            >
              <svg
                viewBox="0 0 24 24"
                className={cn("h-5 w-5 shrink-0", refreshing && "animate-spin")}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.25}
                aria-hidden
              >
                <path d="M21 12a9 9 0 11-3.05-6.65M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="hidden sm:inline">{refreshing ? "กำลังรีเฟรช…" : "รีเฟรช"}</span>
            </button>
          </div>
          <BuildingPosIngredientsPanel ingredients={ingredients} onChanged={() => void loadAll()} />
          <BuildingPosPurchasesPanel
            purchaseOrders={purchaseOrders}
            ingredients={ingredients}
            onChanged={() => void loadAll()}
          />
        </div>
      ) : null}

      <FormModal
        open={catManageOpen}
        onClose={() => {
          if (catSaving) return;
          setCatManageOpen(false);
          setCatFormOpen(false);
          setCatEditing(null);
        }}
        title={catFormOpen ? (catEditing ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่") : "หมวดหมู่"}
        description={catFormOpen ? "ลำดับเลขน้อยแสดงก่อนหน้าลูกค้า" : "เพิ่ม แก้ไข หรือลบหมวดทั้งหมด"}
        size="lg"
        mobileCentered
        footer={
          catFormOpen ? (
            <FormModalFooterActions
              onCancel={closeCatForm}
              onSubmit={() => void submitCatModal()}
              submitLabel={catEditing ? "บันทึกการแก้ไข" : "เพิ่มหมวดหมู่"}
              loading={catSaving}
              submitDisabled={!catForm.name.trim() || !Number.isFinite(Number(catForm.sort_order))}
            />
          ) : (
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => openCatCreate()}
                className="app-btn-primary inline-flex min-h-[44px] items-center gap-1 rounded-xl px-4 text-sm font-semibold"
              >
                <span aria-hidden>+</span>
                เพิ่มหมวดหมู่
              </button>
              <button
                type="button"
                onClick={() => {
                  setCatManageOpen(false);
                  setCatFormOpen(false);
                  setCatEditing(null);
                }}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-white/55 bg-white/70 px-4 text-sm font-black text-[#5b61ff] shadow-sm backdrop-blur-sm"
              >
                ปิด
              </button>
            </div>
          )
        }
      >
        {catFormOpen ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="mx-auto shrink-0 sm:mx-0">
              <p className="mb-1 text-xs font-medium text-[#4d47b6]">ตัวอย่างรูปหมวด</p>
              <PosThumb url={catForm.image_url} />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <label className="block text-xs font-medium text-[#4d47b6]">
                ชื่อหมวดหมู่
                <input
                  className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  placeholder="เช่น อาหารจานเดียว"
                  value={catForm.name}
                  onChange={(e) => setCatForm((s) => ({ ...s, name: e.target.value }))}
                  autoComplete="off"
                />
              </label>
              <label className="block text-xs font-medium text-[#4d47b6]">
                URL รูปหมวด <span className="font-normal text-[#9b98c4]">(ไม่บังคับ)</span>
                <input
                  className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  placeholder="https://..."
                  value={catForm.image_url}
                  onChange={(e) => setCatForm((s) => ({ ...s, image_url: e.target.value }))}
                  autoComplete="off"
                />
              </label>
              <label className="block text-xs font-medium text-[#4d47b6]">
                อัปโหลดรูปจากเครื่อง
                <input
                  className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-[#ecebff] file:px-2 file:py-1 file:text-xs file:font-medium file:text-[#4d47b6]"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setCatUploading(true);
                    void uploadImage(file)
                      .then((url) => {
                        if (url) setCatForm((s) => ({ ...s, image_url: url }));
                      })
                      .finally(() => setCatUploading(false));
                  }}
                />
              </label>
              {catUploading ? <p className="text-xs text-[#66638c]">กำลังอัปโหลดรูป…</p> : null}
              <label className="block text-xs font-medium text-[#4d47b6]">
                ลำดับแสดงผล
                <input
                  className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  placeholder="ตัวเลข — น้อยขึ้นก่อน"
                  type="number"
                  value={catForm.sort_order}
                  onChange={(e) => setCatForm((s) => ({ ...s, sort_order: e.target.value }))}
                />
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#4d47b6]">
                <input
                  type="checkbox"
                  checked={catForm.is_active}
                  onChange={(e) => setCatForm((s) => ({ ...s, is_active: e.target.checked }))}
                />
                เปิดใช้งานหมวดนี้
              </label>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <p className="rounded-[1.25rem] border border-dashed border-[#d8d6ec] bg-[#faf9ff]/70 px-3 py-8 text-center text-sm font-semibold text-[#66638c]">
            ยังไม่มีหมวด — กด «เพิ่มหมวดหมู่»
          </p>
        ) : (
          <ul className="max-h-[min(60vh,28rem)] space-y-2 overflow-y-auto overscroll-contain pr-0.5">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex min-h-[56px] items-center gap-3 rounded-[1.25rem] border border-[#e8e6f4]/90 bg-white/80 px-3 py-2.5"
              >
                <PosThumb url={c.image_url} size="sm" />
                <span className="min-w-0 flex-1 text-sm font-semibold text-[#1e1b4b]">
                  <span className="text-[#66638c]">{c.sort_order}.</span> {c.name}
                  {c.is_active ? null : (
                    <span className="mt-0.5 block text-xs font-normal text-amber-700">ปิดใช้งาน</span>
                  )}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openCatEdit(c)}
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไขหมวด ${c.name}`}
                    title="แก้ไข"
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteCategoryRow(c)}
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบหมวด ${c.name}`}
                    title="ลบ"
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </FormModal>

      <FormModal
        open={kitchenManageOpen}
        onClose={() => {
          if (kitchenSaving) return;
          setKitchenManageOpen(false);
          setKitchenFormOpen(false);
          setKitchenEditing(null);
        }}
        title={kitchenFormOpen ? (kitchenEditing ? "แก้ไขแผนกครัว" : "เพิ่มแผนกครัว") : "แผนกครัว"}
        description={
          kitchenFormOpen
            ? "ตั้งชื่อแผนก เช่น ครัวร้อน · ครัวเย็น · บาร์ — เมนูจะส่งไปลิงก์ครัวของแผนกนั้น"
            : "เพิ่ม แก้ไข หรือลบแผนกครัว (แพ็ก 299+)"
        }
        size="lg"
        mobileCentered
        footer={
          kitchenFormOpen ? (
            <FormModalFooterActions
              onCancel={() => {
                if (kitchenSaving) return;
                setKitchenFormOpen(false);
                setKitchenEditing(null);
              }}
              onSubmit={() => void submitKitchenModal()}
              submitLabel={kitchenEditing ? "บันทึกการแก้ไข" : "เพิ่มแผนกครัว"}
              loading={kitchenSaving}
              submitDisabled={!kitchenForm.name.trim() || !Number.isFinite(Number(kitchenForm.sort_order))}
            />
          ) : (
            <div className="flex w-full flex-wrap justify-between gap-2">
              <button
                type="button"
                className="app-btn-primary min-h-[44px] rounded-xl px-4 text-sm font-black"
                onClick={() => openKitchenCreate()}
              >
                เพิ่มแผนกครัว
              </button>
              <button
                type="button"
                className={cn(appTemplateOutlineButtonClass, "min-h-[44px] rounded-xl px-4 text-sm font-black")}
                onClick={() => {
                  setKitchenManageOpen(false);
                  setKitchenFormOpen(false);
                  setKitchenEditing(null);
                }}
              >
                ปิด
              </button>
            </div>
          )
        }
      >
        {kitchenFormOpen ? (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-[#4d47b6]">
              ชื่อแผนกครัว
              <input
                className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                placeholder="เช่น ครัวร้อน"
                value={kitchenForm.name}
                onChange={(e) => setKitchenForm((s) => ({ ...s, name: e.target.value }))}
                autoComplete="off"
              />
            </label>
            <label className="block text-xs font-medium text-[#4d47b6]">
              ลำดับแสดง
              <input
                className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                type="number"
                value={kitchenForm.sort_order}
                onChange={(e) => setKitchenForm((s) => ({ ...s, sort_order: e.target.value }))}
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#4d47b6]">
              <input
                type="checkbox"
                checked={kitchenForm.is_active}
                onChange={(e) => setKitchenForm((s) => ({ ...s, is_active: e.target.checked }))}
              />
              เปิดใช้งานแผนกนี้
            </label>
          </div>
        ) : kitchenDepartments.length === 0 ? (
          <p className="rounded-[1.25rem] border border-dashed border-[#d8d6ec] bg-[#faf9ff]/70 px-3 py-8 text-center text-sm font-semibold text-[#66638c]">
            ยังไม่มีแผนกครัว — กด «เพิ่มแผนกครัว»
          </p>
        ) : (
          <ul className="max-h-[min(60vh,28rem)] space-y-2 overflow-y-auto overscroll-contain pr-0.5">
            {kitchenDepartments.map((d) => (
              <li
                key={d.id}
                className="flex min-h-[56px] items-center gap-3 rounded-[1.25rem] border border-[#e8e6f4]/90 bg-white/80 px-3 py-2.5"
              >
                <span className="min-w-0 flex-1 text-sm font-semibold text-[#1e1b4b]">
                  <span className="text-[#66638c]">{d.sort_order}.</span> {d.name}
                  {d.is_active ? null : (
                    <span className="mt-0.5 block text-xs font-normal text-amber-700">ปิดใช้งาน</span>
                  )}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openKitchenEdit(d)}
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไขแผนก ${d.name}`}
                    title="แก้ไข"
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteKitchenRow(d)}
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบแผนก ${d.name}`}
                    title="ลบ"
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </FormModal>

      <FormModal
        open={menuModalOpen}
        onClose={() => {
          if (menuSaving) return;
          setMenuModalOpen(false);
          setMenuEditing(null);
        }}
        title={menuEditing ? "แก้ไขเมนู" : "เพิ่มเมนูอาหาร"}
        description="เลือกหมวด ชื่อ และราคา"
        size="lg"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => {
              if (menuSaving) return;
              setMenuModalOpen(false);
              setMenuEditing(null);
            }}
            onSubmit={() => void submitMenuModal()}
            submitLabel={menuEditing ? "บันทึกการแก้ไข" : "เพิ่มเมนู"}
            loading={menuSaving}
            submitDisabled={
              !menuForm.name.trim() ||
              !Number.isFinite(Number(menuForm.category_id)) ||
              Number(menuForm.category_id) <= 0 ||
              !Number.isFinite(Number(menuForm.price))
            }
          />
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="mx-auto shrink-0 sm:mx-0">
            <p className="mb-1 text-xs font-medium text-[#4d47b6]">ตัวอย่างรูปเมนู</p>
            <PosThumb url={menuForm.image_url} />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <label className="block text-xs font-medium text-[#4d47b6]">
              หมวดหมู่
              <select
                className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                value={menuForm.category_id}
                onChange={(e) => setMenuForm((s) => ({ ...s, category_id: e.target.value }))}
              >
                <option value="">เลือกหมวดหมู่</option>
                {(menuEditing ? categories : categories.filter((c) => c.is_active)).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {!c.is_active ? " (ปิดใช้งาน)" : ""}
                  </option>
                ))}
              </select>
            </label>
            {multiKitchenEnabled ? (
              <label className="block text-xs font-medium text-[#4d47b6]">
                แผนกครัว
                <select
                  className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  value={menuForm.kitchen_department_id}
                  onChange={(e) => setMenuForm((s) => ({ ...s, kitchen_department_id: e.target.value }))}
                >
                  <option value="">ไม่ระบุ (แสดงทุกครัว)</option>
                  {(menuEditing ? kitchenDepartments : activeKitchenDepartments).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {!d.is_active ? " (ปิดใช้งาน)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="block text-xs font-medium text-[#4d47b6]">
              ชื่อเมนู
              <input
                className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                placeholder="เช่น ข้าวกะเพราไก่"
                value={menuForm.name}
                onChange={(e) => setMenuForm((s) => ({ ...s, name: e.target.value }))}
                autoComplete="off"
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-[#4d47b6]">
                URL รูปเมนู <span className="font-normal text-[#9b98c4]">(ไม่บังคับ)</span>
                <input
                  className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  placeholder="https://..."
                  value={menuForm.image_url}
                  onChange={(e) => setMenuForm((s) => ({ ...s, image_url: e.target.value }))}
                  autoComplete="off"
                />
              </label>
              <label className="block text-xs font-medium text-[#4d47b6]">
                ราคาขาย (บาท / 1 ที่)
                <input
                  className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                  placeholder="เช่น 55"
                  type="number"
                  value={menuForm.price}
                  onChange={(e) => setMenuForm((s) => ({ ...s, price: e.target.value }))}
                />
              </label>
            </div>
            <label className="block text-xs font-medium text-[#4d47b6]">
              อัปโหลดรูปจากเครื่อง
              <input
                className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-[#ecebff] file:px-2 file:py-1 file:text-xs file:font-medium file:text-[#4d47b6]"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setMenuUploading(true);
                  void uploadImage(file)
                    .then((url) => {
                      if (url) setMenuForm((s) => ({ ...s, image_url: url }));
                    })
                    .finally(() => setMenuUploading(false));
                }}
              />
            </label>
            {menuUploading ? <p className="text-xs text-[#66638c]">กำลังอัปโหลดรูป…</p> : null}
            <label className="block text-xs font-medium text-[#4d47b6]">
              รายละเอียด <span className="font-normal text-[#9b98c4]">(ไม่บังคับ)</span>
              <input
                className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
                placeholder="คำอธิบายสั้น ๆ ให้ลูกค้าเห็น"
                value={menuForm.description}
                onChange={(e) => setMenuForm((s) => ({ ...s, description: e.target.value }))}
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#4d47b6]">
              <input
                type="checkbox"
                checked={menuForm.is_active}
                onChange={(e) => setMenuForm((s) => ({ ...s, is_active: e.target.checked }))}
              />
              เปิดขายเมนูนี้
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#4d47b6]">
              <input
                type="checkbox"
                checked={menuForm.is_featured}
                onChange={(e) => setMenuForm((s) => ({ ...s, is_featured: e.target.checked }))}
              />
              แนะนำหน้าลูกค้า
            </label>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
