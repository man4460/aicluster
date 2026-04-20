"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { printDataUrlImagePoster } from "@/components/app-templates";
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
  type PosEstimatedCosts,
  type PosIngredient,
  type PosMenuItem,
  type PosOrder,
  type PosRecipeLine,
} from "@/systems/building-pos/building-pos-service";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { BuildingPosOpenTablesPanel } from "@/systems/building-pos/BuildingPosSalesAnalytics";
import {
  BuildingPosUnifiedMenuBar,
  buildingPosDashboardTabHref,
  type BuildingPosDashTab,
} from "@/systems/building-pos/components/BuildingPosUnifiedMenuBar";

function tableQrStorageKey(ownerId: string) {
  return `mawell.buildingpos.tableQrLabels.${ownerId}`;
}

function parseBuildingPosTabQuery(q: string | null): BuildingPosDashTab {
  if (q === "orders" || q === "menu" || q === "categories") return q;
  return "overview";
}

function PosThumb({ url, size = "md" }: { url: string; size?: "sm" | "md" }) {
  const src = url?.trim();
  const box =
    size === "sm"
      ? "h-8 w-8 rounded-md text-[6px] leading-tight"
      : "h-14 w-14 rounded-xl text-[9px] leading-tight";
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={`${box} shrink-0 border border-[#e1e3ff] bg-white object-cover`}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={`flex ${box} shrink-0 items-center justify-center border border-dashed border-[#d8d6ec] bg-[#f4f3ff] px-0.5 text-center text-[#9b98c4]`}
      aria-hidden
    >
      —
    </div>
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
  const tabQ = searchParams.get("tab");

  const repo = useMemo(() => createBuildingPosSessionApiRepository(), []);
  const [tab, setTabState] = useState<BuildingPosDashTab>("overview");

  useLayoutEffect(() => {
    if (tabQ === "ingredients" || tabQ === "purchases") {
      router.replace("/dashboard/building-pos/costs");
      return;
    }
    setTabState(parseBuildingPosTabQuery(tabQ));
  }, [tabQ, router]);

  const setTab = useCallback(
    (t: BuildingPosDashTab) => {
      setTabState(t);
      router.replace(buildingPosDashboardTabHref(t), { scroll: false });
    },
    [router],
  );

  const [categories, setCategories] = useState<PosCategory[]>([]);
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
  const [recipesByMenu, setRecipesByMenu] = useState<Record<string, PosRecipeLine[]>>({});
  const [estimatedCosts, setEstimatedCosts] = useState<PosEstimatedCosts>({
    estimated_cost_baht: {},
    margin_baht: {},
    ingredient_last_unit_price_baht: {},
  });
  const [recipeLinesDraft, setRecipeLinesDraft] = useState<PosRecipeLine[]>([]);

  const [catForm, setCatForm] = useState({ name: "", image_url: "", sort_order: "1", is_active: true });
  const [menuForm, setMenuForm] = useState({
    category_id: "",
    name: "",
    image_url: "",
    price: "",
    description: "",
    is_active: true,
    is_featured: false,
  });
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catEditing, setCatEditing] = useState<PosCategory | null>(null);
  const [catSaving, setCatSaving] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [menuEditing, setMenuEditing] = useState<PosMenuItem | null>(null);
  const [menuSaving, setMenuSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const dashboardStats = useMemo(() => {
    const paidRevenue = orders.filter((o) => o.status === "PAID").reduce((s, o) => s + o.total_amount, 0);
    const customerSet = new Set(
      orders
        .map((o) => `${o.customer_name.trim()}|${o.table_no.trim()}`)
        .filter((x) => x !== "|"),
    );

    const menuToCategory = new Map<number, number>();
    menuItems.forEach((m) => menuToCategory.set(m.id, m.category_id));
    const qtyByCategory = new Map<number, number>();
    orders.forEach((o) => {
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

  async function loadAll() {
    const [c, m, o] = await Promise.all([repo.listCategories(), repo.listMenuItems(), repo.listOrders()]);
    setCategories(c);
    setMenuItems(m);
    setOrders(o);

    const emptyCosts: PosEstimatedCosts = {
      estimated_cost_baht: {},
      margin_baht: {},
      ingredient_last_unit_price_baht: {},
    };
    const inv = await Promise.allSettled([
      repo.listIngredients(),
      repo.listRecipesByMenu(),
      repo.getEstimatedCosts(),
    ]);
    setIngredients(inv[0].status === "fulfilled" ? inv[0].value : []);
    setRecipesByMenu(inv[1].status === "fulfilled" ? inv[1].value : {});
    setEstimatedCosts(inv[2].status === "fulfilled" ? inv[2].value : emptyCosts);
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

  function openCatCreate() {
    setCatEditing(null);
    setCatForm({ name: "", image_url: "", sort_order: "1", is_active: true });
    setCatModalOpen(true);
  }

  function openCatEdit(c: PosCategory) {
    setCatEditing(c);
    setCatForm({
      name: c.name,
      image_url: c.image_url ?? "",
      sort_order: String(c.sort_order),
      is_active: c.is_active,
    });
    setCatModalOpen(true);
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
      setCatModalOpen(false);
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
      await loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  function openMenuCreate() {
    setMenuEditing(null);
    setMenuForm({
      category_id: "",
      name: "",
      image_url: "",
      price: "",
      description: "",
      is_active: true,
      is_featured: false,
    });
    setRecipeLinesDraft([]);
    setMenuModalOpen(true);
  }

  function openMenuEdit(m: PosMenuItem) {
    setMenuEditing(m);
    setMenuForm({
      category_id: String(m.category_id),
      name: m.name,
      image_url: m.image_url ?? "",
      price: String(m.price),
      description: m.description ?? "",
      is_active: m.is_active,
      is_featured: !!m.is_featured,
    });
    const existing = recipesByMenu[String(m.id)] ?? [];
    setRecipeLinesDraft(existing.map((x) => ({ ...x })));
    setMenuModalOpen(true);
  }

  async function submitMenuModal() {
    const categoryId = Number(menuForm.category_id);
    const price = Number(menuForm.price);
    if (!categoryId || !menuForm.name.trim() || !Number.isFinite(price)) return;
    setMenuSaving(true);
    try {
      const payload = {
        category_id: categoryId,
        name: menuForm.name.trim(),
        image_url: menuForm.image_url.trim(),
        price,
        description: menuForm.description.trim(),
        is_active: menuForm.is_active,
        is_featured: menuForm.is_featured,
      };
      let menuId: number;
      if (menuEditing) {
        await repo.updateMenuItem(menuEditing.id, payload);
        menuId = menuEditing.id;
      } else {
        const created = await repo.createMenuItem(payload);
        menuId = created.id;
      }
      const recipePayload = recipeLinesDraft.filter(
        (l) => l.ingredient_id > 0 && Number.isFinite(l.qty_per_portion) && l.qty_per_portion > 0,
      );
      await repo.putMenuRecipe(menuId, recipePayload);
      setMenuModalOpen(false);
      setMenuEditing(null);
      await loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setMenuSaving(false);
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

  async function moveOrderStatus(id: number, status: PosOrder["status"]) {
    await repo.updateOrder(id, { status });
    await loadAll();
  }

  async function saveOrderPaymentSlip(orderId: number, imageUrl: string) {
    await repo.updateOrder(orderId, { payment_slip_url: imageUrl });
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
      <BuildingPosUnifiedMenuBar
        activeTab={tab}
        onTabChange={setTab}
        onRefresh={() => void refreshData()}
        refreshing={refreshing}
      />

      {tab === "overview" ? (
        <div className="space-y-5 sm:space-y-6">
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="app-surface rounded-2xl p-4 sm:p-5">
              <p className="text-xs text-[#66638c]">รายรับ (ออเดอร์ที่ชำระแล้ว)</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700 sm:text-3xl">฿ {dashboardStats.paidRevenue.toLocaleString()}</p>
            </div>
            <div className="app-surface rounded-2xl p-4 sm:p-5">
              <p className="text-xs text-[#66638c]">หมวดหมู่ขายดี</p>
              <p className="mt-1 text-lg font-bold leading-snug text-[#2e2a58] sm:text-xl">{dashboardStats.bestCategoryLabel}</p>
              <p className="mt-1 text-xs text-[#66638c]">ขายรวม {dashboardStats.bestCategoryQty.toLocaleString()} จาน/แก้ว</p>
            </div>
            <div className="app-surface rounded-2xl p-4 sm:p-5">
              <p className="text-xs text-[#66638c]">จำนวนลูกค้า</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-[#4d47b6] sm:text-3xl">{dashboardStats.uniqueCustomers.toLocaleString()}</p>
              <p className="mt-1 text-xs text-[#66638c]">นับจากชื่อ/โต๊ะที่มีออเดอร์</p>
            </div>
          </section>

          <BuildingPosOpenTablesPanel
            orders={orders}
            menuImageById={menuImageById}
            onOrderStatusChange={(id, status) => void moveOrderStatus(id, status)}
            onOrderPaymentSlipSaved={(id, url) => saveOrderPaymentSlip(id, url)}
            shopLabel={shopLabel}
            logoUrl={logoUrl}
            paymentChannelsNote={paymentChannelsNote ?? null}
            headerAction={
              <button
                type="button"
                onClick={() => setTab("orders")}
                className="inline-flex min-h-[40px] min-w-[5.5rem] items-center justify-center rounded-xl bg-[#ecebff] px-3 py-2 text-sm font-semibold text-[#4d47b6] ring-1 ring-[#4d47b6]/20 touch-manipulation transition-colors hover:bg-[#e0dcff] active:opacity-90 sm:min-h-[44px] sm:px-4"
              >
                QR สั่งอาหาร
              </button>
            }
          />
        </div>
      ) : null}

      {tab === "categories" ? (
        <section className="app-surface rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col gap-3 border-b border-[#ecebff] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#2e2a58]">จัดหมวดหมู่</h2>
              <p className="mt-1 text-xs text-[#66638c]">ลำดับเลขน้อยแสดงก่อน — ลบหมวดได้เมื่อไม่มีเมนูในหมวด</p>
            </div>
            <button type="button" onClick={() => openCatCreate()} className="app-btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold">
              + เพิ่มหมวดหมู่
            </button>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:gap-3">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#e1e3ff] bg-[#faf9ff] px-3 py-3 text-sm shadow-sm sm:flex-nowrap sm:bg-white"
              >
                <PosThumb url={c.image_url} />
                <span className="min-w-0 flex-1 font-medium text-[#2e2a58]">
                  <span className="text-[#66638c]">{c.sort_order}.</span> {c.name}
                  {c.is_active ? "" : <span className="mt-0.5 block text-xs font-normal text-amber-700">ปิดใช้งาน</span>}
                </span>
                <div className="flex w-full shrink-0 gap-2 sm:w-auto sm:justify-end">
                  <button
                    type="button"
                    onClick={() => openCatEdit(c)}
                    className="app-btn-soft flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-[#4d47b6] sm:flex-none"
                  >
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteCategoryRow(c)}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    ลบ
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "menu" ? (
        <section className="app-surface rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col gap-3 border-b border-[#ecebff] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#2e2a58]">เมนูอาหาร</h2>
              <p className="mt-1 text-xs text-[#66638c]">
                ราคาต่อ 1 ที่ — ต้นทุนจากสูตร × ราคาจากบันทึกรายจ่ายล่าสุด — ปุ่มดาวแสดงในแถวแนะนำหน้าลูกค้า
              </p>
            </div>
            <button type="button" onClick={() => openMenuCreate()} className="app-btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold">
              + เพิ่มเมนู
            </button>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:gap-3">
            {menuItems.map((m) => {
              const hasRecipe = (recipesByMenu[String(m.id)]?.length ?? 0) > 0;
              const ec = estimatedCosts.estimated_cost_baht[String(m.id)] ?? 0;
              const mg = estimatedCosts.margin_baht[String(m.id)];
              return (
              <li
                key={m.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#e1e3ff] bg-[#faf9ff] px-3 py-3 text-sm shadow-sm sm:flex-nowrap sm:bg-white"
              >
                <PosThumb url={m.image_url} />
                <span className="min-w-0 flex-1">
                  <span className="font-semibold text-[#2e2a58]">{m.name}</span>
                  <span className="mt-0.5 block text-xs text-[#66638c]">
                    ฿{m.price.toLocaleString()} · {categories.find((c) => c.id === m.category_id)?.name ?? "-"}
                    {hasRecipe ? (
                      <>
                        {" "}
                        · ต้นทุน ~฿{ec.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        {mg != null ? ` · กำไร ~฿${mg.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : ""}
                      </>
                    ) : null}
                  </span>
                  {!m.is_active ? <span className="mt-1 inline-block text-xs text-amber-700">ปิดใช้งาน</span> : null}
                </span>
                <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                  <button
                    type="button"
                    onClick={() => void toggleMenuFeatured(m)}
                    className={`rounded-xl border px-2.5 py-1.5 text-xs font-semibold ${
                      m.is_featured
                        ? "border-amber-300 bg-amber-50 text-amber-900"
                        : "border-[#e1e3ff] bg-white text-[#66638c]"
                    }`}
                    title="สลับเมนูแนะนำหน้าลูกค้า"
                  >
                    {m.is_featured ? "★ แนะนำ" : "☆ แนะนำ"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openMenuEdit(m)}
                    className="app-btn-soft rounded-xl px-3 py-2 text-xs font-semibold text-[#4d47b6]"
                  >
                    แก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteMenuRow(m)}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    ลบ
                  </button>
                </div>
              </li>
            );
            })}
          </ul>
        </section>
      ) : null}

      {tab === "orders" ? (
        <div className="space-y-5 sm:space-y-6">
          <section className="overflow-hidden rounded-3xl border border-[#d4d2f0]/90 bg-gradient-to-br from-white via-[#faf9ff] to-[#ecebff]/90 shadow-[0_24px_60px_-28px_rgba(77,71,182,0.45)]">
            <div className="border-b border-[#e6e4fa] bg-gradient-to-r from-[#4d47b6]/[0.07] via-transparent to-[#7c3aed]/[0.04] px-4 py-4 sm:px-6 sm:py-5">
              <h2 className="text-lg font-bold tracking-tight text-[#2e2a58] sm:text-xl">QR สั่งอาหาร</h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#66638c] sm:text-sm">
                แตะการ์ดเหมือนผังห้องหอพัก — เลือก &quot;ร้าน&quot; หรือโต๊ะ แล้วดาวน์โหลด / พิมพ์ QR ได้ทันที
              </p>
            </div>
            <div className="p-4 sm:p-6">
              {tableQrCards === null ? (
                <p className="text-sm text-[#66638c]">กำลังโหลดการ์ดโต๊ะ…</p>
              ) : (
                <>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    <li>
                      <button
                        type="button"
                        onClick={() => setQrCardFocus("shop")}
                        className={`flex h-full min-h-[132px] w-full flex-col rounded-2xl border p-4 text-left shadow-sm transition ${
                          qrCardFocus === "shop"
                            ? "border-[#4d47b6] bg-gradient-to-b from-[#ecebff] to-white ring-2 ring-[#4d47b6]/25"
                            : "border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 hover:border-[#4d47b6]/35 hover:shadow-md"
                        }`}
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#4d47b6]">ทั่วไป</span>
                        <span className="mt-2 text-center text-base font-bold leading-tight text-[#2e2a58]">QR ร้าน</span>
                        <span className="mt-1 text-center text-[11px] leading-snug text-[#66638c]">ลูกค้ากรอกโต๊ะเอง</span>
                        <span className="mt-auto pt-3 text-center text-[10px] font-medium text-[#4d47b6]">แตะ → ส่งออก QR</span>
                      </button>
                    </li>
                    {tableQrCards.map((label) => (
                      <li key={label} className="relative">
                        <button
                          type="button"
                          onClick={() => setQrCardFocus(label)}
                          className={`flex h-full min-h-[132px] w-full flex-col rounded-2xl border p-4 pr-9 text-left shadow-sm transition ${
                            qrCardFocus === label
                              ? "border-[#4d47b6] bg-gradient-to-b from-[#ecebff] to-white ring-2 ring-[#4d47b6]/25"
                              : "border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 hover:border-[#4d47b6]/35 hover:shadow-md"
                          }`}
                        >
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#66638c]">โต๊ะ</span>
                          <span className="mt-2 line-clamp-2 text-center text-2xl font-bold tabular-nums text-[#2e2a58]">
                            {label}
                          </span>
                          <span className="mt-1 text-center text-[11px] text-[#66638c]">ล็อกโต๊ะในลิงก์</span>
                          <span className="mt-auto pt-3 text-center text-[10px] font-medium text-[#4d47b6]">แตะ → ส่งออก QR</span>
                        </button>
                        <button
                          type="button"
                          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-sm font-bold leading-none text-slate-400 shadow-sm hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
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
                  <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-dashed border-[#d8d6ec] bg-white/50 p-3 sm:flex-row sm:items-end sm:gap-3">
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
                    <button
                      type="button"
                      onClick={() => addTableQrCard()}
                      className="app-btn-primary shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold"
                    >
                      เพิ่มการ์ด
                    </button>
                  </div>
                </>
              )}

              <div className="mt-6 rounded-2xl border border-[#e1e3ff] bg-white/80 p-4 shadow-inner backdrop-blur-sm sm:p-5">
                {!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://") ? (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-100">
                    ตั้งค่า URL โดเมนร้าน (https://…) ในระบบ เพื่อให้ QR แสกนได้จากมือถือลูกค้า
                  </p>
                ) : null}

                {qrCardFocus === "shop" ? (
                  <>
                    <h3 className="text-sm font-semibold text-[#2e2a58] sm:text-base">ส่งออก QR — ร้านทั่วไป</h3>
                    <p className="mt-1 text-xs text-[#66638c]">ลูกค้าเลือกเมนูและกรอกเลขโต๊ะเองหลังแสกน</p>
                    {baseUrl.startsWith("http") && orderQrUrl ? (
                      <>
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => void copyOrderLink(orderQrUrl)}
                            className="app-btn-soft rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4d47b6]"
                          >
                            คัดลอกลิงก์
                          </button>
                        </div>
                        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                          {posterUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={posterUrl}
                              alt="QR สั่งอาหารร้าน"
                              className={cn(shopQrTemplateGeneratedPosterThumbClass, "shrink-0")}
                            />
                          ) : (
                            <div className="mx-auto flex min-h-[200px] w-full max-w-[280px] shrink-0 items-center justify-center rounded-2xl border border-dashed border-[#d8d6ec] bg-[#faf9ff] px-3">
                              <span className="text-center text-xs text-[#9b98c4]">กำลังสร้างใบป้าย…</span>
                            </div>
                          )}
                          <div className="grid w-full max-w-md flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                            <button
                              type="button"
                              disabled={qrBusy || !orderQrUrl}
                              onClick={() => void downloadQrPdf()}
                              className="app-btn-primary rounded-xl px-4 py-3 text-sm font-semibold sm:py-2"
                            >
                              ดาวน์โหลด PDF (A4)
                            </button>
                            <button
                              type="button"
                              disabled={qrBusy || !orderQrUrl}
                              onClick={() => void downloadQrPdfA5()}
                              className="app-btn-soft rounded-xl px-4 py-3 text-sm font-semibold text-[#4d47b6] sm:py-2"
                            >
                              ดาวน์โหลด PDF (A5)
                            </button>
                            <button
                              type="button"
                              disabled={qrBusy || !orderQrUrl}
                              onClick={() => void downloadQrPng()}
                              className="app-btn-soft rounded-xl px-4 py-3 text-sm font-semibold text-[#4d47b6] sm:py-2"
                            >
                              ดาวน์โหลด PNG
                            </button>
                            <button
                              type="button"
                              disabled={!posterUrl}
                              onClick={() => printQrPoster("A4")}
                              className="app-btn-soft rounded-xl px-4 py-3 text-sm font-semibold text-[#4d47b6] sm:py-2"
                            >
                              พิมพ์ A4
                            </button>
                            <button
                              type="button"
                              disabled={!posterUrl}
                              onClick={() => printQrPoster("A5")}
                              className="app-btn-soft rounded-xl px-4 py-3 text-sm font-semibold text-[#4d47b6] sm:col-span-2 sm:py-2"
                            >
                              พิมพ์ A5
                            </button>
                          </div>
                        </div>
                      </>
                    ) : baseUrl.startsWith("http") ? (
                      <p className="mt-3 text-xs text-[#66638c]">กำลังเตรียมลิงก์…</p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-[#2e2a58] sm:text-base">
                      ส่งออก QR — โต๊ะ <span className="tabular-nums text-[#4d47b6]">{qrCardFocus}</span>
                    </h3>
                    <p className="mt-1 text-xs text-[#66638c]">ลูกค้าแสกนแล้วหน้าสั่งอาหารจะกรอกโต๊ะนี้ให้อัตโนมัติ</p>
                    {baseUrl.startsWith("http") && posTableOrderUrl ? (
                      <>
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => void copyOrderLink(posTableOrderUrl)}
                            className="app-btn-soft rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4d47b6]"
                          >
                            คัดลอกลิงก์
                          </button>
                        </div>
                        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                          {posTablePosterUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={posTablePosterUrl}
                              alt={`QR โต๊ะ ${qrCardFocus}`}
                              className={cn(shopQrTemplateGeneratedPosterThumbClass, "shrink-0")}
                            />
                          ) : (
                            <div className="mx-auto flex min-h-[200px] w-full max-w-[280px] shrink-0 items-center justify-center rounded-2xl border border-dashed border-[#d8d6ec] bg-[#faf9ff] px-3">
                              <span className="text-center text-xs text-[#9b98c4]">กำลังสร้างใบป้าย…</span>
                            </div>
                          )}
                          <div className="grid w-full max-w-md flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                            <button
                              type="button"
                              disabled={posTableQrBusy || !posTableQrPng}
                              onClick={() => void downloadPosTablePdf("a4")}
                              className="app-btn-primary rounded-xl px-4 py-3 text-sm font-semibold sm:py-2"
                            >
                              ดาวน์โหลด PDF (A4)
                            </button>
                            <button
                              type="button"
                              disabled={posTableQrBusy || !posTableQrPng}
                              onClick={() => void downloadPosTablePdf("a5")}
                              className="app-btn-soft rounded-xl px-4 py-3 text-sm font-semibold text-[#4d47b6] sm:py-2"
                            >
                              ดาวน์โหลด PDF (A5)
                            </button>
                            <button
                              type="button"
                              disabled={posTableQrBusy || !posTableQrPng}
                              onClick={() => void downloadPosTablePng()}
                              className="app-btn-soft rounded-xl px-4 py-3 text-sm font-semibold text-[#4d47b6] sm:py-2"
                            >
                              ดาวน์โหลด PNG
                            </button>
                            <button
                              type="button"
                              disabled={!posTablePosterUrl}
                              onClick={() => printPosTablePoster("A4")}
                              className="app-btn-soft rounded-xl px-4 py-3 text-sm font-semibold text-[#4d47b6] sm:py-2"
                            >
                              พิมพ์ A4
                            </button>
                            <button
                              type="button"
                              disabled={!posTablePosterUrl}
                              onClick={() => printPosTablePoster("A5")}
                              className="app-btn-soft rounded-xl px-4 py-3 text-sm font-semibold text-[#4d47b6] sm:col-span-2 sm:py-2"
                            >
                              พิมพ์ A5
                            </button>
                          </div>
                        </div>
                      </>
                    ) : baseUrl.startsWith("http") ? (
                      <p className="mt-3 text-xs text-[#66638c]">กำลังเตรียมลิงก์…</p>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <FormModal
        open={catModalOpen}
        onClose={() => {
          if (catSaving) return;
          setCatModalOpen(false);
          setCatEditing(null);
        }}
        title={catEditing ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}
        description="กรอกข้อมูลหมวดหมู่แล้วกดบันทึก — ลำดับเลขน้อยแสดงก่อนในหน้าลูกค้า"
        size="md"
        footer={
          <FormModalFooterActions
            onCancel={() => {
              if (catSaving) return;
              setCatModalOpen(false);
              setCatEditing(null);
            }}
            onSubmit={() => void submitCatModal()}
            submitLabel={catEditing ? "บันทึกการแก้ไข" : "เพิ่มหมวดหมู่"}
            loading={catSaving}
            submitDisabled={!catForm.name.trim() || !Number.isFinite(Number(catForm.sort_order))}
          />
        }
      >
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
              <input type="checkbox" checked={catForm.is_active} onChange={(e) => setCatForm((s) => ({ ...s, is_active: e.target.checked }))} />
              เปิดใช้งานหมวดนี้
            </label>
          </div>
        </div>
      </FormModal>

      <FormModal
        open={menuModalOpen}
        onClose={() => {
          if (menuSaving) return;
          setMenuModalOpen(false);
          setMenuEditing(null);
        }}
        title={menuEditing ? "แก้ไขเมนู" : "เพิ่มเมนูอาหาร"}
        description="เลือกหมวดหมู่ ระบุชื่อและราคา — รายละเอียดจะแสดงหน้าลูกค้า"
        size="lg"
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
            <div className="rounded-2xl border border-[#e6e4fa] bg-[#faf9ff]/80 p-3">
              <p className="text-xs font-semibold text-[#4d47b6]">สูตร / ต้นทุน (ต่อ 1 ที่ขาย)</p>
              <p className="mt-0.5 text-[11px] leading-snug text-[#66638c]">
                เลือกหมวดหมู่วัตถุดิบจากหน้า &quot;ต้นทุน / รายจ่าย&quot; (จัดการหมวด) และจำนวนต่อจาน — ราคาต่อหน่วยใช้จากบันทึกรายจ่ายล่าสุด
              </p>
              {ingredients.length === 0 ? (
                <p className="mt-2 text-xs text-amber-800">ยังไม่มีรายการของ — เพิ่มที่แท็บ &quot;รายการของ&quot; ก่อน</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {recipeLinesDraft.map((row, idx) => (
                    <li key={idx} className="flex flex-wrap items-end gap-2 rounded-xl border border-[#e1e3ff] bg-white p-2">
                      <label className="min-w-[160px] flex-1 text-[10px] font-medium text-[#66638c]">
                        รายการของ
                        <select
                          className="app-input mt-1 w-full rounded-lg px-2 py-2 text-sm"
                          value={row.ingredient_id || ""}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setRecipeLinesDraft((prev) =>
                              prev.map((r, j) => (j === idx ? { ...r, ingredient_id: v } : r)),
                            );
                          }}
                        >
                          <option value="">เลือก</option>
                          {ingredients.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                              {g.unit_label ? ` (${g.unit_label})` : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="w-[100px] text-[10px] font-medium text-[#66638c]">
                        จำนวน/จาน
                        <input
                          className="app-input mt-1 w-full rounded-lg px-2 py-2 text-sm tabular-nums"
                          inputMode="decimal"
                          value={Number.isFinite(row.qty_per_portion) ? String(row.qty_per_portion) : ""}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            setRecipeLinesDraft((prev) =>
                              prev.map((r, j) =>
                                j === idx ? { ...r, qty_per_portion: Number.isFinite(n) ? n : 0 } : r,
                              ),
                            );
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        className="mb-0.5 rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-500 hover:bg-slate-50"
                        aria-label="ลบแถวสูตร"
                        onClick={() =>
                          setRecipeLinesDraft((prev) => (prev.length <= 1 ? prev : prev.filter((_, j) => j !== idx)))
                        }
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {ingredients.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setRecipeLinesDraft((prev) => [...prev, { ingredient_id: 0, qty_per_portion: 0.01 }])}
                  className="mt-2 app-btn-soft rounded-xl px-3 py-2 text-xs font-semibold text-[#4d47b6]"
                >
                  + เพิ่มของในสูตร
                </button>
              ) : null}
            </div>
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
              แสดงในแถว &quot;เมนูแนะนำ&quot; หน้าลูกค้า
            </label>
          </div>
        </div>
      </FormModal>
    </div>
  );
}
