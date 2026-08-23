"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AppEmptyState,
  alertSlipPrintRequiresMonthlyPlan,
  appTemplateOutlineButtonClass,
  useAppSlipPaperSize,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { formatDormAmountStable } from "@/lib/dormitory/format-display-stable";
import {
  BUILDING_POS_STAFF_ORDER_CHANNELS,
  type BuildingPosStaffOrderChannel,
  buildingPosStaffOrderNoteLine,
} from "@/lib/building-pos/staff-order-channel";
import {
  createBuildingPosPublicApiRepository,
  type PosCategory,
  type PosMenuItem,
  type PosOrderItem,
} from "@/systems/building-pos/building-pos-service";
import { printBuildingPosOrderTicket } from "@/systems/building-pos/building-pos-order-ticket-print";
import { useBuildingPosMobileDraftSlot } from "@/systems/building-pos/components/BuildingPosMobileBottomChrome";
import { BuildingPosRemoteImg } from "@/systems/building-pos/components/building-pos-remote-image";
import {
  buildingPosChipActiveClass,
  buildingPosChipIdleClass,
  buildingPosCtaClass,
  buildingPosFieldClass,
  buildingPosNavActiveClass,
  buildingPosProductCardClass,
  buildingPosProductGridClass,
  buildingPosPulseWashClass,
} from "@/systems/building-pos/components/building-pos-ui-tokens";
import { BuildingPosOrderLoyaltyStrip } from "@/systems/building-pos/components/BuildingPosOrderLoyaltyStrip";
import { normalizeBuildingPosMemberPhone } from "@/systems/building-pos/lib/loyalty-rule";

const qtyBtnClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#5b61ff]/25 bg-white text-[#4d47b6] shadow-sm transition hover:bg-violet-50 active:scale-95 disabled:opacity-35";

function IconQtyMinus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconQtyPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

/** หน้าออร์เดอร์ในแดชบอร์ด — ซ้ายรายการ / ขวาเมนู (เดสก์ท็อป) · มือถือแบบ drink-pos
 *  portalMode = ลิงก์พนักงาน (มือถือ: สกอลล์รวม meta+เมนู · สรุปบิลใน dock ล่าง · เดสก์ท็อปซ้าย/ขวาเลื่อนอิสระ)
 */
export function BuildingPosOrderClient({
  ownerId,
  trialSessionId,
  portalMode = false,
  staffAuth,
  onOrderSuccess,
  slipPrintEnabled: slipPrintEnabledProp,
  enableMobileDraft = true,
  refreshNonce = 0,
}: {
  ownerId: string;
  trialSessionId?: string;
  /** ลิงก์พนักงาน — เลย์เอาต์พอร์ทัลแบบ drink-pos staffPortal */
  portalMode?: boolean;
  /** คีย์ลิงก์พนักงาน — ใช้ API staff สำหรับแลกคะแนน */
  staffAuth?: { ownerId: string; trialSessionId: string; k: string };
  onOrderSuccess?: () => void;
  /** แพ็กเหมารายเดือน 199 — เปิดพิมพ์สลิป (ถ้าไม่ส่ง จะลองโหลดจาก bootstrap พนักงาน) */
  slipPrintEnabled?: boolean;
  /** แสดงสรุปบิลใน dock มือถือ (ปิดเมื่อสลับแท็บคิว/โต๊ะ) */
  enableMobileDraft?: boolean;
  /** รีเฟรชเมนูจากพอร์ทัลพนักงานโดยไม่ unmount ตะกร้า */
  refreshNonce?: number;
}) {
  const repo = useMemo(
    () => createBuildingPosPublicApiRepository(ownerId, trialSessionId),
    [ownerId, trialSessionId],
  );
  const setMobileDraftSlot = useBuildingPosMobileDraftSlot();

  const [categories, setCategories] = useState<PosCategory[]>([]);
  const [menuItems, setMenuItems] = useState<PosMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<number | "all">("all");
  const [cart, setCart] = useState<Record<number, PosOrderItem>>({});
  const [customerName, setCustomerName] = useState("");
  const [tableNo, setTableNo] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [staffChannel, setStaffChannel] = useState<BuildingPosStaffOrderChannel>("floor");
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  /** พิมพ์สลิปครัวหลังส่งออเดอร์สำเร็จ — ใช้ได้เมื่อแพ็กเหมาเปิดสิทธิ์ */
  const [slipPrintEnabled, setSlipPrintEnabled] = useState(slipPrintEnabledProp === true);
  const [printSlipAfterSubmit, setPrintSlipAfterSubmit] = useState(slipPrintEnabledProp === true);
  const { paper: slipPaper } = useAppSlipPaperSize();
  const menuScrollRef = useRef<HTMLDivElement>(null);
  const productGridRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (typeof slipPrintEnabledProp === "boolean") {
      setSlipPrintEnabled(slipPrintEnabledProp);
      setPrintSlipAfterSubmit(slipPrintEnabledProp);
    }
  }, [slipPrintEnabledProp]);

  const onCategoryStripWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    // overflow-x-auto ดักล้อแนวตั้ง — ส่งไปรายการเมนูถ้าเลื่อนได้ ไม่งั้นเลื่อนหน้า
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const scroller = menuScrollRef.current;
    if (scroller && scroller.scrollHeight > scroller.clientHeight + 1) {
      scroller.scrollTop += e.deltaY;
      return;
    }
    window.scrollBy({ top: e.deltaY, left: 0, behavior: "auto" });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const boot = await repo.getPublicMenuBootstrap();
      setCategories(
        (boot.categories ?? []).filter((c) => c.is_active).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id),
      );
      setMenuItems((boot.menu_items ?? []).filter((m) => m.is_active));
      setLoyaltyEnabled(Boolean(boot.loyalty?.enabled));
    } catch (e) {
      try {
        const [cats, items] = await Promise.all([repo.listCategories(), repo.listMenuItems()]);
        setCategories(cats.filter((c) => c.is_active).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id));
        setMenuItems(items.filter((m) => m.is_active));
      } catch {
        setError(e instanceof Error ? e.message : "โหลดเมนูไม่สำเร็จ");
      }
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (refreshNonce <= 0) return;
    void load();
  }, [refreshNonce, load]);

  const cartList = useMemo(() => Object.values(cart).filter((x) => x.qty > 0), [cart]);
  const cartTotal = useMemo(() => cartList.reduce((s, x) => s + x.price * x.qty, 0), [cartList]);
  const cartCount = useMemo(() => cartList.reduce((s, x) => s + x.qty, 0), [cartList]);

  const filteredProducts = useMemo(() => {
    const list =
      filterCat === "all" ? menuItems : menuItems.filter((m) => m.category_id === filterCat);
    return [...list].sort((a, b) => {
      const ff = (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      if (ff !== 0) return ff;
      return a.id - b.id;
    });
  }, [menuItems, filterCat]);

  /** บังคับจำนวนคอลัมน์เมนู — มือถือต้อง 3 (ไม่พึ่ง Tailwind cascade) */
  useLayoutEffect(() => {
    const el = productGridRef.current;
    if (!el) return;
    const applyCols = () => {
      const w = window.innerWidth;
      const cols = w >= 1536 ? 8 : w >= 1280 ? 6 : w >= 768 ? 4 : 3;
      el.style.setProperty("display", "grid", "important");
      el.style.setProperty("grid-template-columns", `repeat(${cols}, minmax(0, 1fr))`, "important");
      el.style.setProperty("gap", w >= 640 ? "0.5rem" : "0.375rem", "important");
    };
    applyCols();
    window.addEventListener("resize", applyCols);
    return () => window.removeEventListener("resize", applyCols);
  }, [filteredProducts.length, loading]);

  function addItem(item: PosMenuItem) {
    setCart((prev) => {
      const cur = prev[item.id];
      const nextQty = (cur?.qty ?? 0) + 1;
      return {
        ...prev,
        [item.id]: {
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          qty: nextQty,
          note: cur?.note ?? "",
        },
      };
    });
  }

  function setQty(menuItemId: number, qty: number) {
    setCart((prev) => {
      const cur = prev[menuItemId];
      if (!cur) return prev;
      if (qty <= 0) {
        const { [menuItemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [menuItemId]: { ...cur, qty } };
    });
  }

  function clearCart() {
    setCart({});
    setSubmitErr(null);
  }

  async function submitOrder() {
    if (cartList.length === 0) return;
    setBusy(true);
    setSubmitErr(null);
    try {
      const phoneDigits = normalizeBuildingPosMemberPhone(memberPhone);
      const created = await repo.createOrder({
        customer_name: customerName.trim(),
        table_no: tableNo.trim(),
        member_phone: phoneDigits.length >= 9 ? phoneDigits : "",
        status: "NEW",
        items: cartList,
        note: buildingPosStaffOrderNoteLine(staffChannel),
        total_amount: cartTotal,
      });
      if (printSlipAfterSubmit) {
        if (!slipPrintEnabled) {
          alertSlipPrintRequiresMonthlyPlan();
        } else {
          printBuildingPosOrderTicket(created, {
            variant: "kitchen",
            subtitle: "สลิปครัว · ส่งโต๊ะ",
            paper: slipPaper,
          });
        }
      }
      clearCart();
      setCustomerName("");
      setTableNo("");
      setMemberPhone("");
      setReviewOpen(false);
      onOrderSuccess?.();
    } catch (e) {
      setSubmitErr(e instanceof Error ? e.message : "ส่งออเดอร์ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  useLayoutEffect(() => {
    if (!enableMobileDraft || cartList.length === 0) {
      setMobileDraftSlot(null);
      return () => setMobileDraftSlot(null);
    }
    setMobileDraftSlot(
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-start gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => setReviewOpen(true)}
            className="min-w-0 flex-1 rounded-2xl border border-transparent px-1 py-0.5 text-left outline-none transition hover:border-white/50 hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-[#5b61ff]/35 disabled:opacity-50"
            aria-label="ดูสรุปรายการก่อนส่งออเดอร์"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">รายการรอส่ง</p>
            <p className="truncate text-sm font-black text-[#1e1b4b]">
              {cartCount} รายการ · ฿{formatDormAmountStable(cartTotal)}
            </p>
          </button>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
            <button
              type="button"
              className={cn(appTemplateOutlineButtonClass, "min-h-[40px] rounded-xl px-3 py-2 text-xs font-black")}
              onClick={clearCart}
              disabled={busy}
            >
              ล้าง
            </button>
            <button
              type="button"
              className={buildingPosCtaClass}
              onClick={() => setReviewOpen(true)}
              disabled={busy}
            >
              ส่งออเดอร์
            </button>
          </div>
        </div>
        <ul className="max-h-[5.5rem] space-y-0.5 overflow-y-auto overscroll-contain text-xs font-semibold text-[#66638c] [-webkit-overflow-scrolling:touch]">
          {cartList.map((l) => (
            <li key={l.menu_item_id} className="flex justify-between gap-2 px-0.5">
              <span className="min-w-0 truncate">
                {l.name} × {l.qty}
              </span>
              <span className="shrink-0 tabular-nums">฿{formatDormAmountStable(l.price * l.qty)}</span>
            </li>
          ))}
        </ul>
      </div>,
    );
    return () => setMobileDraftSlot(null);
  }, [enableMobileDraft, cartList, cartCount, cartTotal, busy, setMobileDraftSlot]);

  useEffect(() => {
    if (cartList.length === 0 && reviewOpen) setReviewOpen(false);
  }, [cartList.length, reviewOpen]);

  const metaFields = (
    <div className="space-y-2.5">
      <div
        className="flex flex-wrap gap-1.5 rounded-[1.25rem] border border-indigo-100/90 bg-white/90 p-1.5 ring-1 ring-indigo-100/70"
        role="group"
        aria-label="ช่องทางบันทึกออเดอร์"
      >
        {BUILDING_POS_STAFF_ORDER_CHANNELS.map((ch) => (
          <button
            key={ch.key}
            type="button"
            onClick={() => setStaffChannel(ch.key)}
            className={cn(
              "min-h-[40px] flex-1 rounded-xl px-2 py-2 text-center text-[11px] font-black transition sm:text-xs",
              staffChannel === ch.key
                ? cn(buildingPosNavActiveClass, "shadow-md shadow-indigo-400/25")
                : "bg-white text-slate-600 ring-1 ring-slate-200/90 hover:bg-indigo-50/80",
            )}
          >
            {ch.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-[#66638c]">
          โต๊ะ
          <input
            className={cn(buildingPosFieldClass, "mt-1")}
            value={tableNo}
            onChange={(e) => setTableNo(e.target.value)}
            placeholder="เช่น A1"
          />
        </label>
        <label className="block text-xs font-semibold text-[#66638c]">
          ชื่อลูกค้า
          <input
            className={cn(buildingPosFieldClass, "mt-1")}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="ไม่บังคับ"
          />
        </label>
        {loyaltyEnabled ?
          <div className="sm:col-span-2">
            <BuildingPosOrderLoyaltyStrip
              staffAuth={staffAuth}
              phone={memberPhone}
              onPhoneChange={setMemberPhone}
            />
          </div>
        : null}
      </div>
    </div>
  );

  const draftPanel = (
    <div className="flex shrink-0 flex-col rounded-[1.25rem] border border-white/70 bg-white/70">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#e8e6fc]/80 px-3 py-2.5">
        <p className="text-xs font-black text-[#1e1b4b]">
          รายการที่เลือก
          {cartList.length > 0 ? <span className="ml-1.5 text-[#4d47b6]">({cartCount})</span> : null}
        </p>
        {cartList.length > 0 ? (
          <button
            type="button"
            disabled={busy}
            onClick={clearCart}
            className={cn(appTemplateOutlineButtonClass, "rounded-lg px-2.5 py-1 text-[10px] font-black")}
          >
            ล้าง
          </button>
        ) : null}
      </div>

      {cartList.length === 0 ? (
        <div className="flex items-center justify-center p-4">
          <p className="text-center text-sm font-semibold text-[#66638c]">แตะเมนูด้านขวาเพื่อเพิ่มรายการ</p>
        </div>
      ) : (
        <ul className="space-y-2 p-2.5">
          {cartList.map((l) => (
            <li
              key={l.menu_item_id}
              className="rounded-[1.25rem] border border-white/70 bg-white/90 px-2.5 py-2 shadow-sm ring-1 ring-inset ring-white/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#1e1b4b]">{l.name}</p>
                  <p className="mt-0.5 text-xs font-semibold text-[#66638c]">
                    ฿{formatDormAmountStable(l.price)} / ชิ้น
                  </p>
                </div>
                <p className="shrink-0 text-sm font-black tabular-nums text-[#4d47b6]">
                  ฿{formatDormAmountStable(l.price * l.qty)}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className={qtyBtnClass}
                    aria-label={`ลด ${l.name}`}
                    onClick={() => setQty(l.menu_item_id, l.qty - 1)}
                  >
                    <IconQtyMinus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-[1.75rem] text-center text-sm font-black tabular-nums text-[#1e1b4b]">
                    {l.qty}
                  </span>
                  <button
                    type="button"
                    className={qtyBtnClass}
                    aria-label={`เพิ่ม ${l.name}`}
                    onClick={() => setQty(l.menu_item_id, l.qty + 1)}
                  >
                    <IconQtyPlus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-[10px] font-black text-rose-600 hover:bg-rose-50"
                  onClick={() => setQty(l.menu_item_id, 0)}
                >
                  ลบ
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="shrink-0 space-y-2 border-t border-[#e8e6fc]/80 bg-white/80 p-3">
        {submitErr ? <p className="text-xs font-semibold text-rose-600">{submitErr}</p> : null}
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#4d47b6]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#5b61ff]/35 text-[#0000bf] focus:ring-[#5b61ff]/40"
            checked={printSlipAfterSubmit && slipPrintEnabled}
            onChange={(e) => {
              if (!slipPrintEnabled) {
                alertSlipPrintRequiresMonthlyPlan();
                return;
              }
              setPrintSlipAfterSubmit(e.target.checked);
            }}
            disabled={busy}
          />
          {slipPrintEnabled ? "พิมพ์สลิปหลังส่งออเดอร์" : "พิมพ์สลิป (ต้องแพ็ก 199 ของโมดูลนี้)"}
        </label>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#66638c]">ยอดรวม</p>
            <p className="text-2xl font-black tabular-nums text-[#1e1b4b]">฿{formatDormAmountStable(cartTotal)}</p>
          </div>
          <button
            type="button"
            className={cn(buildingPosCtaClass, "min-w-[7.5rem] px-4 text-sm")}
            disabled={busy || cartList.length === 0}
            onClick={() => void submitOrder()}
          >
            {busy ? "กำลังส่ง…" : "ส่งออเดอร์"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col gap-3 lg:gap-4",
        portalMode && "h-full overflow-hidden",
        !portalMode && "lg:h-full lg:min-h-0 lg:overflow-hidden",
      )}
    >
      {error ? (
        <div className="shrink-0 rounded-[1.25rem] border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      {/* มือถือแดชบอร์ด: meta เหนือกริด (เลื่อนทั้งหน้า) */}
      {!portalMode ? <div className="min-w-0 shrink-0 space-y-3 lg:hidden">{metaFields}</div> : null}

      <div
        className={cn(
          "min-h-0 min-w-0 w-full max-w-full flex-1 gap-3 lg:gap-4",
          portalMode
            ? "flex flex-col overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] lg:grid lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)] lg:grid-rows-1 lg:overflow-hidden"
            : "grid lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)] lg:min-h-0 lg:grid-rows-1 lg:overflow-hidden",
        )}
      >
        {/* พอร์ทัลพนักงานมือถือ: ช่องทาง/โต๊ะ/เบอร์เลื่อนรวมกับเมนู · หัวร้านคงที่นอกนี้ */}
        {portalMode ? <div className="min-w-0 shrink-0 space-y-3 lg:hidden">{metaFields}</div> : null}

        <aside
          className={cn(
            "hidden min-h-0 min-w-0 flex-col gap-3 p-4 lg:flex",
            portalMode
              ? "h-full overflow-y-auto overscroll-contain rounded-[1.25rem] border border-white/70 bg-white/55 [-webkit-overflow-scrolling:touch]"
              : "rounded-[1.25rem] border border-[#e8e6fc]/80 bg-gradient-to-br from-white/90 via-[#f5f3ff]/75 to-[#fdf2f8]/55 shadow-sm lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain [-webkit-overflow-scrolling:touch]",
          )}
        >
          <div className="shrink-0">{metaFields}</div>
          {draftPanel}
        </aside>

        <section
          className={cn(
            "flex min-h-0 min-w-0 w-full max-w-full flex-col overflow-x-hidden p-3 lg:p-4",
            portalMode
              ? "shrink-0 rounded-[1.25rem] border border-white/70 bg-white/55 lg:min-h-0 lg:flex-1 lg:shrink lg:overflow-hidden"
              : "flex-1 rounded-[1.25rem] border border-[#e8e6fc]/80 bg-white/60 shadow-sm lg:h-full lg:min-h-0 lg:overflow-hidden",
          )}
        >
          <div
            className="min-w-0 shrink-0 overflow-x-auto overflow-y-hidden pb-2 [-webkit-overflow-scrolling:touch]"
            role="group"
            aria-label="หมวดหมู่"
            onWheel={onCategoryStripWheel}
          >
            <div className="flex w-max gap-2">
              <button
                type="button"
                onClick={() => setFilterCat("all")}
                className={cn("shrink-0 transition", filterCat === "all" ? buildingPosChipActiveClass : buildingPosChipIdleClass)}
              >
                ทั้งหมด
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFilterCat(c.id)}
                  className={cn(
                    "shrink-0 transition",
                    filterCat === c.id ? buildingPosChipActiveClass : buildingPosChipIdleClass,
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={menuScrollRef}
            className={cn(
              "min-w-0 w-full max-w-full pt-1",
              /** พอร์ทัลมือถือ: ไม่แยกสกอลล์เมนู — รวมกับ meta ใน parent · เดสก์ท็อปเลื่อนคอลัมน์ขวาอิสระ */
              "lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:[-webkit-overflow-scrolling:touch]",
            )}
          >
            {loading ? (
              <div className={cn("h-40 animate-pulse rounded-xl", buildingPosPulseWashClass)} aria-hidden />
            ) : filteredProducts.length === 0 ? (
              <AppEmptyState tone="violet" className="mt-2">
                {categories.length === 0 ? "ยังไม่มีเมนู — ไปที่แท็บเมนูเพื่อเพิ่ม" : "ไม่มีเมนูในหมวดนี้"}
              </AppEmptyState>
            ) : (
              <ul
                ref={productGridRef}
                className={cn(
                  buildingPosProductGridClass,
                  "grid w-full min-w-0 max-w-full grid-cols-3 gap-1.5 sm:gap-2 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8",
                )}
              >
                {filteredProducts.map((p) => {
                  const inCartQty = cart[p.id]?.qty ?? 0;
                  return (
                    <li key={p.id} className={cn(buildingPosProductCardClass, "min-w-0 max-w-full")}>
                      <button
                        type="button"
                        onClick={() => addItem(p)}
                        className={cn(
                          "flex w-full min-w-0 max-w-full flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-[#5b61ff]/35",
                          inCartQty > 0 && "ring-2 ring-[#5b61ff]/35 ring-offset-1",
                        )}
                        aria-label={`${p.name} ราคา ${p.price} บาท`}
                      >
                        <div className="relative aspect-square w-full max-w-full overflow-hidden bg-[#5b61ff]/08">
                          {p.image_url ? (
                            <BuildingPosRemoteImg
                              src={p.image_url}
                              className="h-full w-full max-h-full max-w-full object-cover object-center transition duration-300 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[#66638c]">
                              <svg
                                className="h-5 w-5 opacity-40 sm:h-8 sm:w-8"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.5}
                                aria-hidden
                              >
                                <rect x="4" y="5" width="16" height="14" rx="2" />
                                <circle cx="9" cy="10" r="1.2" fill="currentColor" />
                                <path d="M4 17l4-4 3 3 5-6 4 4" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          )}
                          {inCartQty > 0 ? (
                            <span className="absolute right-1 top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gradient-to-r from-[#5b61ff] via-[#8b5cf6] to-[#ec4899] px-1 text-[9px] font-black text-white shadow-md sm:right-1.5 sm:top-1.5 sm:h-6 sm:min-w-[1.5rem] sm:px-1.5 sm:text-[10px]">
                              ×{inCartQty}
                            </span>
                          ) : null}
                          {p.is_featured ? (
                            <span className="absolute left-1 top-1 rounded-full bg-amber-50/95 px-1 py-0.5 text-[7px] font-black text-amber-800 sm:left-1.5 sm:top-1.5 sm:px-1.5 sm:text-[8px]">
                              แนะนำ
                            </span>
                          ) : null}
                        </div>
                        <div className="space-y-0 p-1.5 sm:p-2">
                          <p className="line-clamp-2 text-[10px] font-black leading-tight text-[#1e1b4b] sm:text-xs">
                            {p.name}
                          </p>
                          <p className="mt-0.5 text-[10px] font-black tabular-nums text-[#4d47b6] sm:text-xs">
                            ฿{formatDormAmountStable(p.price)}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      <FormModal
        open={reviewOpen}
        onClose={() => !busy && setReviewOpen(false)}
        title="สรุปออเดอร์"
        appearance="glass"
        glassTint="violet"
        size="lg"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => !busy && setReviewOpen(false)}
            onSubmit={() => void submitOrder()}
            submitLabel={busy ? "กำลังส่ง…" : "ยืนยันส่งออเดอร์"}
            loading={busy}
            submitDisabled={cartList.length === 0}
          />
        }
      >
        <div className="space-y-3">
          {metaFields}
          {submitErr ? <p className="text-xs font-semibold text-rose-600">{submitErr}</p> : null}
          {cartList.length === 0 ? (
            <AppEmptyState>ยังไม่มีรายการ</AppEmptyState>
          ) : (
            <ul className="space-y-2">
              {cartList.map((l) => (
                <li
                  key={l.menu_item_id}
                  className="flex items-center justify-between gap-2 rounded-[1.25rem] border border-white/55 bg-white/55 p-3 text-sm shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-black text-[#1e1b4b]">{l.name}</p>
                    <p className="text-xs font-semibold text-[#66638c]">
                      ฿{formatDormAmountStable(l.price)} × {l.qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className={qtyBtnClass}
                      disabled={busy}
                      aria-label={`ลด ${l.name}`}
                      onClick={() => setQty(l.menu_item_id, l.qty - 1)}
                    >
                      <IconQtyMinus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-[1.5rem] text-center text-sm font-black tabular-nums">{l.qty}</span>
                    <button
                      type="button"
                      className={qtyBtnClass}
                      disabled={busy}
                      aria-label={`เพิ่ม ${l.name}`}
                      onClick={() => setQty(l.menu_item_id, l.qty + 1)}
                    >
                      <IconQtyPlus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between gap-2 rounded-[1.25rem] border border-[#5b61ff]/20 bg-gradient-to-r from-[#5b61ff]/10 via-[#8b5cf6]/10 to-[#ec4899]/10 px-4 py-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#66638c]">ยอดรวม</span>
            <span className="text-lg font-black tabular-nums text-[#1e1b4b]">฿{formatDormAmountStable(cartTotal)}</span>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#4d47b6]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[#5b61ff]/35 text-[#0000bf] focus:ring-[#5b61ff]/40"
              checked={printSlipAfterSubmit && slipPrintEnabled}
              onChange={(e) => {
                if (!slipPrintEnabled) {
                  alertSlipPrintRequiresMonthlyPlan();
                  return;
                }
                setPrintSlipAfterSubmit(e.target.checked);
              }}
              disabled={busy}
            />
            {slipPrintEnabled ? "พิมพ์สลิปหลังส่งออเดอร์" : "พิมพ์สลิป (ต้องแพ็ก 199 ของโมดูลนี้)"}
          </label>
        </div>
      </FormModal>
    </div>
  );
}
