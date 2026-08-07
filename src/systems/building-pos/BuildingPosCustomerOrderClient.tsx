"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  shopQrTemplateCardClass,
  shopQrTemplateCtaButtonClass,
  shopQrTemplateHeadKickerClass,
  shopQrTemplateHeadTitleClass,
  shopQrTemplateMaxWidthClass,
  shopQrTemplateOrderPagePaddingClass,
  shopQrTemplatePageBgClass,
} from "@/components/qr/shop-qr-template";
import { cn } from "@/lib/cn";
import { formatBangkokDateTimeStable, formatDormAmountStable } from "@/lib/dormitory/format-display-stable";
import {
  buildingPosCustomerSessionStorageKey,
  isCustomerOrderSessionUuid,
} from "@/lib/building-pos/customer-order-session";
import {
  BUILDING_POS_STAFF_ORDER_CHANNELS,
  type BuildingPosStaffOrderChannel,
  buildingPosStaffOrderNoteLine,
} from "@/lib/building-pos/staff-order-channel";
import {
  createBuildingPosPublicApiRepository,
  type PosCategory,
  type PosMenuItem,
  type PosOrder,
  type PosOrderItem,
} from "@/systems/building-pos/building-pos-service";
import { BuildingPosRemoteImg } from "@/systems/building-pos/components/building-pos-remote-image";
import {
  buildingPosChipActiveClass,
  buildingPosChipIdleClass,
  buildingPosNavActiveClass,
} from "@/systems/building-pos/components/building-pos-ui-tokens";
import {
  isBuildingPosMemberPhoneReady,
  normalizeBuildingPosMemberPhone,
  type BuildingPosLoyaltyRewardDto,
} from "@/systems/building-pos/lib/loyalty-rule";
import { BuildingPosCustomerLoyaltyPanel } from "@/systems/building-pos/components/BuildingPosCustomerLoyaltyPanel";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";

function buildingPosCustomerPhoneStorageKey(ownerId: string, trialSessionId: string) {
  return `mawell.building-pos.loyalty-phone.${ownerId}.${trialSessionId}`;
}

function buildingPosCustomerStatusLabel(st: PosOrder["status"]): string {
  switch (st) {
    case "NEW":
      return "รับออเดอร์แล้ว";
    case "PREPARING":
      return "กำลังทำ";
    case "SERVED":
      return "ทำเสร็จแล้ว · รอเสิร์ฟ";
    case "SERVING":
      return "กำลังเสิร์ฟ";
    case "DELIVERED":
      return "เสิร์ฟเรียบร้อย";
    case "PAID":
      return "ชำระเงินแล้ว";
    default:
      return st;
  }
}

function sortByFeaturedThenSold(a: PosMenuItem, b: PosMenuItem) {
  const ff = (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
  if (ff !== 0) return ff;
  const ds = (b.sold_qty ?? 0) - (a.sold_qty ?? 0);
  if (ds !== 0) return ds;
  return a.id - b.id;
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function IconMinus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function IconSparkles({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2l1.4 5.1L18 9l-5.6 1.9L12 16l-1.4-5.1L5 9l5.6-1.9L12 2z" />
    </svg>
  );
}

function IconFlame({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 23c4.97 0 8-3.25 8-7.5 0-3.1-1.75-5.63-4.5-8.5-.5 2.5-2 4.12-3.5 5.5.5-2.75-.25-5.63-2.5-8C6.5 5.87 4 9.12 4 13.5 4 17.75 7.03 23 12 23z" />
    </svg>
  );
}

function MenuDishCard({
  item,
  qty,
  onAdd,
  onDec,
  compact,
  showHotBadge,
  useTemplate,
}: {
  item: PosMenuItem;
  qty: number;
  onAdd: () => void;
  onDec: () => void;
  compact?: boolean;
  showHotBadge?: boolean;
  useTemplate: boolean;
}) {
  const selected = qty > 0;
  const imgH = compact ? "h-14" : "h-28";

  return (
    <article
      className={cn(
        "group relative flex shrink-0 snap-start flex-col overflow-hidden border transition-all duration-200",
        compact ? "w-[6.75rem] rounded-lg sm:w-[7.25rem]" : "w-[min(100%,11.5rem)] rounded-2xl",
        useTemplate ?
          selected ?
            "border-indigo-400 bg-indigo-50/90 shadow-[0_0_0_1px_rgba(99,102,241,0.35)]"
          : "border-slate-200/90 bg-white shadow-sm hover:border-indigo-200 hover:shadow-md"
        : selected ?
          "border-emerald-400/70 bg-emerald-950/20 shadow-[0_0_0_1px_rgba(52,211,153,0.35)]"
        : "border-white/10 bg-white/[0.06] hover:border-white/20 hover:bg-white/[0.09]",
      )}
    >
      <div
        className={cn(
          `relative ${imgH} w-full shrink-0 overflow-hidden bg-gradient-to-br`,
          useTemplate ? "from-slate-200 to-slate-300" : "from-slate-700 to-slate-900",
        )}
      >
        <BuildingPosRemoteImg
          src={item.image_url}
          className="h-full w-full object-cover"
          fallback={
            <div className={cn("flex h-full w-full items-center justify-center", useTemplate ? "text-slate-400" : "text-slate-500")}>
              <IconSparkles className={cn(compact ? "h-5 w-5" : "h-8 w-8", "opacity-40")} />
            </div>
          }
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent",
            useTemplate ? "from-slate-900/55 via-slate-900/15" : "from-slate-950/90 via-slate-950/20",
          )}
        />
        <div className="absolute left-0.5 top-0.5 flex flex-wrap gap-0.5">
          {item.is_featured ? (
            <span className="inline-flex items-center rounded bg-amber-400/95 px-1 py-px text-[8px] font-bold text-amber-950 shadow-sm">
              แนะนำ
            </span>
          ) : null}
          {showHotBadge ? (
            <span className="inline-flex items-center rounded bg-rose-500/95 px-1 py-px text-[8px] font-bold text-white shadow-sm">
              ขายดี
            </span>
          ) : null}
        </div>
        {selected ? (
          <div
            className={cn(
              "absolute right-0.5 top-0.5 flex items-center justify-center rounded-full text-white shadow ring-1",
              compact ? "h-5 w-5" : "h-8 w-8",
              useTemplate ? "bg-indigo-600 ring-white" : "bg-emerald-500 ring-slate-950",
            )}
            aria-hidden
          >
            <IconCheck className={compact ? "h-3 w-3" : "h-4 w-4"} />
          </div>
        ) : null}
      </div>
      <div className={cn("flex min-h-0 flex-1 flex-col", compact ? "p-1.5" : "p-2.5")}>
        <h3
          className={cn(
            "line-clamp-2 font-semibold leading-snug",
            compact ? "text-[10px]" : "text-xs",
            useTemplate ? "text-slate-900" : "text-white",
          )}
        >
          {item.name}
        </h3>
        {!compact && item.description ? (
          <p
            className={cn(
              "mt-0.5 line-clamp-1 text-[10px] leading-relaxed",
              useTemplate ? "text-slate-600" : "text-slate-400",
            )}
          >
            {item.description}
          </p>
        ) : null}
        <div className={cn("mt-auto flex items-end justify-between gap-0.5", compact ? "pt-1" : "pt-2")}>
          <p
            className={cn(
              "font-bold tabular-nums",
              compact ? "text-[11px]" : "text-sm",
              useTemplate ? "text-indigo-700" : "text-emerald-400",
            )}
          >
            ฿{formatDormAmountStable(item.price)}
          </p>
          <div
            className={cn(
              "flex shrink-0 items-center gap-0 rounded-full p-px shadow-md ring-1",
              useTemplate ?
                "bg-slate-100 ring-slate-200/90"
              : "bg-slate-950/90 ring-white/15",
            )}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="group"
            aria-label={`จำนวน ${item.name}`}
          >
            {selected ? (
              <button
                type="button"
                onClick={onDec}
                className={cn(
                  "flex items-center justify-center rounded-full transition",
                  compact ? "h-6 w-6" : "h-8 w-8",
                  useTemplate ?
                    "text-slate-700 hover:bg-slate-200/90"
                  : "text-white hover:bg-white/10",
                )}
                aria-label="ลดจำนวน"
              >
                <IconMinus className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
              </button>
            ) : null}
            {selected ? (
              <span
                className={cn(
                  "text-center font-bold tabular-nums",
                  compact ? "min-w-[0.9rem] px-px text-[10px]" : "min-w-[1.1rem] px-0.5 text-xs",
                  useTemplate ? "text-slate-900" : "text-white",
                )}
              >
                {qty}
              </span>
            ) : null}
            <button
              type="button"
              onClick={onAdd}
              className={cn(
                "flex items-center justify-center rounded-full text-white transition",
                compact ? "h-6 w-6" : "h-8 w-8",
                useTemplate ? "bg-indigo-600 hover:bg-indigo-500" : "bg-emerald-500 hover:bg-emerald-400",
              )}
              aria-label={selected ? "เพิ่มจำนวน" : "เพิ่มลงตะกร้า"}
            >
              <IconPlus className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function MenuDishCardGrid({
  item,
  qty,
  onAdd,
  onDec,
  showHotBadge,
  useTemplate,
}: {
  item: PosMenuItem;
  qty: number;
  onAdd: () => void;
  onDec: () => void;
  showHotBadge?: boolean;
  useTemplate: boolean;
}) {
  const selected = qty > 0;
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-lg border transition-all duration-200",
        useTemplate ?
          selected ?
            "border-indigo-400 bg-indigo-50/90 shadow-[0_0_0_1px_rgba(99,102,241,0.35)]"
          : "border-slate-200/90 bg-white shadow-sm hover:border-indigo-200"
        : selected ?
          "border-emerald-400/70 bg-emerald-950/25 shadow-[0_0_0_1px_rgba(52,211,153,0.35)]"
        : "border-white/10 bg-white/[0.06] hover:border-white/20",
      )}
    >
      <div className="flex items-center gap-2 px-2 py-1.5">
        <div
          className={cn(
            "relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-gradient-to-br",
            useTemplate ? "from-slate-200 to-slate-300" : "from-slate-700 to-slate-900",
          )}
        >
          <BuildingPosRemoteImg
            src={item.image_url}
            className="h-full w-full object-cover"
            fallback={
              <div className={cn("flex h-full w-full items-center justify-center", useTemplate ? "text-slate-400" : "text-slate-500")}>
                <IconSparkles className="h-4 w-4 opacity-40" />
              </div>
            }
          />
          {selected ? (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                useTemplate ? "bg-indigo-600/35" : "bg-emerald-600/40",
              )}
            >
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-white ring-1",
                  useTemplate ? "bg-indigo-600 ring-white/60" : "bg-emerald-500 ring-white/40",
                )}
              >
                <IconCheck className="h-3 w-3" />
              </div>
            </div>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3
              className={cn(
                "min-w-0 flex-1 truncate text-xs font-semibold leading-tight",
                useTemplate ? "text-slate-900" : "text-white",
              )}
            >
              {item.name}
            </h3>
            {item.is_featured ? (
              <span className="shrink-0 rounded bg-amber-400/90 px-1 py-px text-[8px] font-bold text-amber-950">แนะนำ</span>
            ) : null}
            {showHotBadge ? (
              <span className="shrink-0 rounded bg-rose-500/90 px-1 py-px text-[8px] font-bold text-white">ขายดี</span>
            ) : null}
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-1.5">
            <p
              className={cn(
                "text-xs font-bold tabular-nums",
                useTemplate ? "text-indigo-700" : "text-emerald-400",
              )}
            >
              ฿{formatDormAmountStable(item.price)}
            </p>
            <div
              className={cn(
                "flex items-center gap-0 rounded-full p-px ring-1",
                useTemplate ? "bg-slate-100 ring-slate-200/90" : "bg-slate-950/90 ring-white/15",
              )}
            >
              {selected ? (
                <button
                  type="button"
                  onClick={onDec}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full",
                    useTemplate ? "text-slate-700 hover:bg-slate-200/90" : "text-white hover:bg-white/10",
                  )}
                  aria-label="ลดจำนวน"
                >
                  <IconMinus className="h-3 w-3" />
                </button>
              ) : null}
              {selected ? (
                <span
                  className={cn(
                    "min-w-[1rem] px-0.5 text-center text-[11px] font-bold tabular-nums",
                    useTemplate ? "text-slate-900" : "text-white",
                  )}
                >
                  {qty}
                </span>
              ) : null}
              <button
                type="button"
                onClick={onAdd}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-white",
                  useTemplate ? "bg-indigo-600 hover:bg-indigo-500" : "bg-emerald-500 hover:bg-emerald-400",
                )}
                aria-label={selected ? "เพิ่มจำนวน" : "เพิ่มลงตะกร้า"}
              >
                <IconPlus className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function BuildingPosCustomerOrderClient({
  ownerId,
  trialSessionId,
  initialTableNo,
  variant = "customer",
  orderNoteTag,
  embeddedInModal = false,
  onOrderSuccess,
}: {
  ownerId: string;
  trialSessionId?: string;
  initialTableNo?: string;
  /** staff = หัวข้อ/หมายเหตุออเดอร์สำหรับพนักงานเสิร์ฟ */
  variant?: "customer" | "staff";
  /** บันทึกใน note ออเดอร์เพิ่มจากช่องทางพนักงาน (ถ้ามี) — ต่อท้ายข้อความช่องทาง */
  orderNoteTag?: string;
  /** เปิดในโมดัลแดชบอร์ด — ไม่ใช้เต็มจอ + แถบตะกร้า sticky ในกล่องเลื่อน */
  embeddedInModal?: boolean;
  onOrderSuccess?: () => void;
}) {
  const repo = useMemo(() => createBuildingPosPublicApiRepository(ownerId, trialSessionId), [ownerId, trialSessionId]);

  const [categories, setCategories] = useState<PosCategory[]>([]);
  const [menuItems, setMenuItems] = useState<PosMenuItem[]>([]);
  const [cart, setCart] = useState<Record<number, PosOrderItem>>({});
  const [customerName, setCustomerName] = useState("");
  const [tableNo, setTableNo] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [loyaltyRewards, setLoyaltyRewards] = useState<BuildingPosLoyaltyRewardDto[]>([]);
  /** คะแนนจากเบอร์ในแท็บข้อมูล — ใช้โชว์ปุ่มไปแลกเมื่อแลกได้ */
  const [infoLoyaltyBalance, setInfoLoyaltyBalance] = useState<number | null>(null);
  const [loyaltyLookupTick, setLoyaltyLookupTick] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<number | "all">("all");
  /** ลูกค้า: เปิดโมดัลสรุปก่อนยืนยันส่ง */
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myOrders, setMyOrders] = useState<PosOrder[]>([]);
  const [customerSessionId, setCustomerSessionId] = useState("");
  const paidResetRef = useRef(false);
  const [staffChannel, setStaffChannel] = useState<BuildingPosStaffOrderChannel>("floor");
  /** ลูกค้า: แถบข้อมูล → ออเดอร์ → สั่งอาหาร */
  const [customerTab, setCustomerTab] = useState<"info" | "orders" | "menu" | "redeem">("info");

  const isCustomer = variant === "customer";
  const customerReviewsBeforeSend = isCustomer;
  const showMenuPanel = !isCustomer || customerTab === "menu";
  const showCartBar = !isCustomer || customerTab === "menu";
  const phoneStorageKey = useMemo(
    () => buildingPosCustomerPhoneStorageKey(ownerId, trialSessionId ?? "prod"),
    [ownerId, trialSessionId],
  );

  const sessionStorageKey = useMemo(
    () => buildingPosCustomerSessionStorageKey(ownerId, trialSessionId ?? "prod", tableNo),
    [ownerId, trialSessionId, tableNo],
  );

  useEffect(() => {
    void (async () => {
      try {
        const boot = await repo.getPublicMenuBootstrap();
        setCategories((boot.categories ?? []).filter((x) => x.is_active));
        setMenuItems((boot.menu_items ?? []).filter((x) => x.is_active));
        setLoyaltyEnabled(Boolean(boot.loyalty?.enabled));
        setLoyaltyRewards(
          Array.isArray(boot.loyalty?.rewards)
            ? boot.loyalty.rewards.map((r) => ({
                id: r.id,
                title: r.title,
                menu_item_id: r.menu_item_id ?? null,
                points_cost: r.points_cost,
                sort_order: r.sort_order,
                is_active: r.is_active,
                image_url: typeof r.image_url === "string" ? r.image_url : "",
              }))
            : [],
        );
      } catch {
        const [c, m] = await Promise.all([repo.listCategories(), repo.listMenuItems()]);
        setCategories(c.filter((x) => x.is_active));
        setMenuItems(m.filter((x) => x.is_active));
      }
    })();
  }, [repo]);

  useEffect(() => {
    const t = initialTableNo?.trim();
    if (t) setTableNo(t);
  }, [initialTableNo]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(phoneStorageKey);
    if (saved) setMemberPhone(normalizeBuildingPosMemberPhone(saved));
  }, [phoneStorageKey]);

  useEffect(() => {
    if (!isCustomer) return;
    if (typeof window === "undefined") return;
    let id = localStorage.getItem(sessionStorageKey);
    if (!id || !isCustomerOrderSessionUuid(id)) {
      id = crypto.randomUUID();
      localStorage.setItem(sessionStorageKey, id);
    }
    setCustomerSessionId(id);
  }, [isCustomer, sessionStorageKey]);

  const loadMyOrders = useCallback(async () => {
    if (!isCustomer || !customerSessionId) return;
    try {
      const list = await repo.listMyOrders(tableNo, customerSessionId);
      setMyOrders(list);
    } catch {
      /* ignore */
    }
  }, [isCustomer, customerSessionId, repo, tableNo]);

  useEffect(() => {
    if (!isCustomer || !customerSessionId) return;
    void loadMyOrders();
  }, [isCustomer, customerSessionId, loadMyOrders]);

  useEffect(() => {
    if (!isCustomer || !customerSessionId) return;
    const id = window.setInterval(() => void loadMyOrders(), 12000);
    return () => window.clearInterval(id);
  }, [isCustomer, customerSessionId, loadMyOrders]);

  useEffect(() => {
    if (!isCustomer || !customerSessionId) return;
    const onFocus = () => void loadMyOrders();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [isCustomer, customerSessionId, loadMyOrders]);

  useEffect(() => {
    if (!isCustomer || myOrders.length === 0) {
      if (myOrders.length === 0) paidResetRef.current = false;
      return;
    }
    if (!myOrders.every((o) => o.status === "PAID")) {
      paidResetRef.current = false;
      return;
    }
    if (paidResetRef.current) return;
    paidResetRef.current = true;
    const next = crypto.randomUUID();
    localStorage.setItem(sessionStorageKey, next);
    setCustomerSessionId(next);
    setMyOrders([]);
    setMemberPhone("");
    setInfoLoyaltyBalance(null);
    localStorage.removeItem(phoneStorageKey);
  }, [isCustomer, myOrders, sessionStorageKey, phoneStorageKey]);

  const clearMemberPhone = useCallback(() => {
    setMemberPhone("");
    setInfoLoyaltyBalance(null);
    if (typeof window !== "undefined") localStorage.removeItem(phoneStorageKey);
  }, [phoneStorageKey]);

  useEffect(() => {
    if (!loyaltyEnabled && customerTab === "redeem") setCustomerTab("info");
  }, [loyaltyEnabled, customerTab]);

  useEffect(() => {
    if (!isCustomer || !loyaltyEnabled) {
      setInfoLoyaltyBalance(null);
      return;
    }
    if (!isBuildingPosMemberPhoneReady(memberPhone)) {
      setInfoLoyaltyBalance(null);
      return;
    }
    const digits = normalizeBuildingPosMemberPhone(memberPhone);
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const params = new URLSearchParams({ ownerId, phone: digits });
          if (trialSessionId) params.set("t", trialSessionId);
          const res = await fetch(`/api/building-pos/public/loyalty?${params}`, { cache: "no-store" });
          const j = (await res.json().catch(() => ({}))) as {
            member?: { points_balance?: number } | null;
            rewards?: BuildingPosLoyaltyRewardDto[];
          };
          if (!res.ok) {
            setInfoLoyaltyBalance(null);
            return;
          }
          if (Array.isArray(j.rewards) && j.rewards.length > 0) {
            setLoyaltyRewards(j.rewards);
          }
          const bal = j.member?.points_balance;
          setInfoLoyaltyBalance(typeof bal === "number" ? bal : 0);
        } catch {
          setInfoLoyaltyBalance(null);
        }
      })();
    }, 400);
    return () => window.clearTimeout(t);
  }, [isCustomer, loyaltyEnabled, memberPhone, ownerId, trialSessionId, loyaltyLookupTick]);

  const infoCanRedeem = useMemo(() => {
    if (infoLoyaltyBalance == null || infoLoyaltyBalance <= 0) return false;
    return loyaltyRewards.some(
      (r) => r.is_active !== false && infoLoyaltyBalance >= r.points_cost,
    );
  }, [infoLoyaltyBalance, loyaltyRewards]);

  useEffect(() => {
    if (!reviewOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setReviewOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [reviewOpen]);

  const addItem = useCallback((item: PosMenuItem) => {
    setCart((prev) => {
      const ex = prev[item.id];
      return {
        ...prev,
        [item.id]: {
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          qty: ex ? ex.qty + 1 : 1,
          note: ex?.note ?? "",
        },
      };
    });
  }, []);

  const decItem = useCallback((item: PosMenuItem) => {
    setCart((prev) => {
      const ex = prev[item.id];
      if (!ex) return prev;
      if (ex.qty <= 1) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return {
        ...prev,
        [item.id]: { ...ex, qty: ex.qty - 1 },
      };
    });
  }, []);

  const cartList = useMemo(() => Object.values(cart).filter((x) => x.qty > 0), [cart]);
  const cartTotal = useMemo(() => cartList.reduce((s, x) => s + x.qty * x.price, 0), [cartList]);
  const cartCount = useMemo(() => cartList.reduce((s, x) => s + x.qty, 0), [cartList]);

  const customerTabs = useMemo(() => {
    const tabs: Array<{
      id: "info" | "menu" | "redeem" | "orders";
      label: string;
      badge: number | null;
    }> = [
      { id: "info", label: "ข้อมูล", badge: null },
      { id: "menu", label: "สั่งอาหาร", badge: cartCount > 0 ? cartCount : null },
      { id: "orders", label: "ออเดอร์", badge: myOrders.length > 0 ? myOrders.length : null },
    ];
    if (loyaltyEnabled) {
      tabs.push({ id: "redeem", label: "แลกคะแนน", badge: null });
    }
    return tabs;
  }, [cartCount, loyaltyEnabled, myOrders.length]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id),
    [categories],
  );

  const bestsellerItems = useMemo(() => {
    return [...menuItems]
      .filter((m) => (m.sold_qty ?? 0) > 0)
      .sort((a, b) => (b.sold_qty ?? 0) - (a.sold_qty ?? 0) || sortByFeaturedThenSold(a, b))
      .slice(0, 10);
  }, [menuItems]);

  const topHotIds = useMemo(() => new Set(bestsellerItems.slice(0, 3).map((m) => m.id)), [bestsellerItems]);

  const featuredItems = useMemo(() => {
    return [...menuItems].filter((m) => m.is_featured).sort(sortByFeaturedThenSold);
  }, [menuItems]);

  function itemsForCategory(catId: number) {
    return [...menuItems].filter((m) => m.category_id === catId).sort(sortByFeaturedThenSold);
  }

  async function submitOrder(): Promise<boolean> {
    const items = cartList;
    if (items.length === 0) return false;
    const phoneDigits = normalizeBuildingPosMemberPhone(memberPhone);
    let sessionForOrder: string | undefined;
    if (isCustomer) {
      let sid = customerSessionId;
      if (typeof window !== "undefined") {
        const fromLs = localStorage.getItem(sessionStorageKey);
        if (fromLs && isCustomerOrderSessionUuid(fromLs)) sid = fromLs;
      }
      if (!sid || !isCustomerOrderSessionUuid(sid)) {
        sid = crypto.randomUUID();
        if (typeof window !== "undefined") localStorage.setItem(sessionStorageKey, sid);
      }
      setCustomerSessionId(sid);
      sessionForOrder = sid;
    }
    try {
      const staffNote =
        variant === "staff" ?
          [buildingPosStaffOrderNoteLine(staffChannel), orderNoteTag?.trim()].filter(Boolean).join(" · ")
        : (orderNoteTag?.trim() ?? "");
      if (phoneDigits.length >= 9 && typeof window !== "undefined") {
        localStorage.setItem(phoneStorageKey, phoneDigits);
      }
      await repo.createOrder(
        {
          customer_name: customerName.trim(),
          table_no: tableNo.trim(),
          member_phone: phoneDigits.length >= 9 ? phoneDigits : "",
          status: "NEW",
          items,
          total_amount: 0,
          note: staffNote,
        },
        sessionForOrder ? { customerSessionId: sessionForOrder } : undefined,
      );
      setCart({});
      setMsg("ส่งออเดอร์เรียบร้อยแล้ว");
      if (isCustomer) setCustomerTab("orders");
      onOrderSuccess?.();
      if (isCustomer && sessionForOrder) {
        const list = await repo.listMyOrders(tableNo, sessionForOrder);
        setMyOrders(list);
      }
      return true;
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "ส่งออเดอร์ไม่สำเร็จ");
      return false;
    }
  }

  const getQty = (id: number) => cart[id]?.qty ?? 0;
  /** ลูกค้าและพนักงานเสิร์ฟใช้โทนเดียวกับโปสเตอร์ QR (พื้นอ่อน) */
  const useTemplate = true;

  async function handleConfirmSendFromReview() {
    setSubmitting(true);
    try {
      const ok = await submitOrder();
      if (ok) setReviewOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={cn(
        embeddedInModal ? "min-h-0 text-slate-800" : "min-h-[100dvh]",
        !embeddedInModal &&
          (useTemplate ?
            cn(shopQrTemplatePageBgClass, "text-slate-800")
          : "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100"),
      )}
    >
      <div
        className={cn(
          embeddedInModal
            ? "w-full min-w-0 pb-28 pt-1"
            : cn(
                shopQrTemplateMaxWidthClass,
                shopQrTemplateOrderPagePaddingClass,
                isCustomer && customerTab !== "menu" ? "!pb-6" : null,
              ),
        )}
      >
        {embeddedInModal && variant === "staff" ? null : (
        <header>
          <p className={cn(useTemplate ? shopQrTemplateHeadKickerClass : "text-center text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-400/90")}>
            {variant === "staff" ? "พนักงาน" : "สแกน · สั่ง"}
          </p>
          <h1
            className={cn(
              useTemplate ? shopQrTemplateHeadTitleClass : "mt-2 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl",
            )}
          >
            {variant === "staff" ? "สั่งอาหารแทนลูกค้า" : "สั่งอาหาร"}
          </h1>
        </header>
        )}

        {isCustomer ?
          <div
            className="mt-4 flex gap-1 rounded-2xl border border-indigo-100/90 bg-white/90 p-1 shadow-sm ring-1 ring-indigo-100/60"
            role="tablist"
            aria-label="เมนูหน้าสั่งอาหาร"
          >
            {customerTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={customerTab === tab.id}
                onClick={() => {
                  setCustomerTab(tab.id);
                  if (tab.id === "orders") void loadMyOrders();
                }}
                className={cn(
                  "relative min-h-[42px] flex-1 rounded-xl px-1.5 text-center text-[11px] font-black transition sm:px-2 sm:text-xs",
                  customerTab === tab.id ?
                    cn(buildingPosNavActiveClass, "shadow-md shadow-indigo-400/25")
                  : "bg-transparent text-slate-600 hover:bg-indigo-50/80",
                )}
              >
                {tab.label}
                {tab.badge != null ?
                  <span
                    className={cn(
                      "ml-0.5 inline-flex min-w-[1.15rem] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums sm:ml-1",
                      customerTab === tab.id ? "bg-white/25 text-white" : "bg-indigo-100 text-indigo-800",
                    )}
                  >
                    {tab.badge}
                  </span>
                : null}
              </button>
            ))}
          </div>
        : null}

        {variant === "staff" ?
          <div
            className={cn(
              embeddedInModal ? "mt-1 flex flex-wrap gap-2 rounded-xl border p-1 sm:mt-2 sm:rounded-2xl sm:p-1.5" : "mt-5 flex flex-wrap gap-2 rounded-2xl border p-1.5 shadow-sm",
              useTemplate ?
                "border-indigo-100/90 bg-white/90 ring-1 ring-indigo-100/70"
              : "border-white/10 bg-white/[0.06]",
            )}
            role="group"
            aria-label="ช่องทางบันทึกออเดอร์"
          >
            {BUILDING_POS_STAFF_ORDER_CHANNELS.map((ch) => (
              <button
                key={ch.key}
                type="button"
                onClick={() => setStaffChannel(ch.key)}
                className={cn(
                  "min-h-[40px] flex-1 rounded-xl px-2 py-2 text-center text-[11px] font-black transition sm:min-h-[44px] sm:text-xs",
                  staffChannel === ch.key ?
                    useTemplate ?
                      cn(buildingPosNavActiveClass, "shadow-md shadow-indigo-400/25")
                    : "bg-emerald-500 text-white shadow-lg"
                  : useTemplate ?
                    "bg-white text-slate-600 ring-1 ring-slate-200/90 hover:bg-indigo-50/80"
                  : "bg-white/10 text-slate-300 hover:bg-white/15",
                )}
              >
                {ch.label}
              </button>
            ))}
          </div>
        : null}

        {(!isCustomer || customerTab === "info") ?
          <div
            className={cn(
              "mt-5 p-4",
              useTemplate ? shopQrTemplateCardClass : "rounded-2xl border border-white/10 bg-white/[0.05] shadow-xl backdrop-blur-md",
            )}
          >
            {isCustomer ?
              <div className="mb-3">
                <h2 className="text-sm font-bold text-slate-900">ข้อมูล</h2>
              </div>
            : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label
                className={cn("block text-xs font-medium", useTemplate ? "text-slate-600" : "text-slate-400")}
              >
                ชื่อ
                <input
                  className={cn(
                    "mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2",
                    useTemplate ?
                      "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-500/25"
                    : "border-white/10 bg-slate-950/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/40",
                  )}
                  placeholder="ชื่อลูกค้า"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </label>
              <label
                className={cn("block text-xs font-medium", useTemplate ? "text-slate-600" : "text-slate-400")}
              >
                โต๊ะ
                <input
                  className={cn(
                    "mt-1 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2",
                    useTemplate ?
                      "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-500/25"
                    : "border-white/10 bg-slate-950/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/40",
                  )}
                  placeholder="เลขโต๊ะ"
                  value={tableNo}
                  onChange={(e) => setTableNo(e.target.value)}
                />
              </label>
              {isCustomer && loyaltyEnabled ?
                <label
                  className={cn(
                    "block text-xs font-medium sm:col-span-2",
                    useTemplate ? "text-slate-600" : "text-slate-400",
                  )}
                >
                  เบอร์โทรสะสมคะแนน
                  <span className="relative mt-1 block">
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="off"
                      name="loyalty-phone"
                      className={cn(
                        "w-full rounded-xl border py-2.5 pl-3 text-sm tabular-nums focus:outline-none focus:ring-2",
                        memberPhone ? "pr-11" : "pr-3",
                        useTemplate ?
                          "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-500/25"
                        : "border-white/10 bg-slate-950/50 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/40",
                      )}
                      placeholder="08xxxxxxxx"
                      value={memberPhone}
                      onChange={(e) => {
                        const digits = normalizeBuildingPosMemberPhone(e.target.value);
                        setMemberPhone(digits);
                        if (typeof window === "undefined") return;
                        if (digits.length >= 9) localStorage.setItem(phoneStorageKey, digits);
                        else localStorage.removeItem(phoneStorageKey);
                      }}
                    />
                    {memberPhone ?
                      <button
                        type="button"
                        className={cn(
                          "absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-sm font-bold",
                          useTemplate ?
                            "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          : "text-slate-400 hover:bg-white/10 hover:text-white",
                        )}
                        aria-label="ล้างเบอร์โทร"
                        title="ล้างเบอร์"
                        onClick={clearMemberPhone}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                          <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                        </svg>
                      </button>
                    : null}
                  </span>
                </label>
              : null}
              {(!isCustomer && loyaltyEnabled) ?
                <div className="sm:col-span-2">
                  <BuildingPosCustomerLoyaltyPanel
                    ownerId={ownerId}
                    trialSessionId={trialSessionId}
                    phone={memberPhone}
                    onPhoneChange={setMemberPhone}
                    tableNo={tableNo}
                    customerName={customerName}
                    customerSessionId={customerSessionId}
                    initialRewards={loyaltyRewards}
                    onRedeemed={() => {
                      void loadMyOrders();
                      setMsg("แลกคะแนนแล้ว");
                    }}
                  />
                </div>
              : null}
            </div>
            {isCustomer ?
              <div className="mt-4 space-y-2">
                {infoCanRedeem ?
                  <button
                    type="button"
                    onClick={() => setCustomerTab("redeem")}
                    className={cn(
                      appTemplateOutlineButtonClass,
                      "flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black text-indigo-800",
                    )}
                  >
                    ดูรายการแลก
                    {infoLoyaltyBalance != null ?
                      <span className="tabular-nums text-indigo-600">
                        · {infoLoyaltyBalance.toLocaleString("th-TH")}
                      </span>
                    : null}
                  </button>
                : null}
                <button
                  type="button"
                  onClick={() => setCustomerTab("menu")}
                  className={cn(shopQrTemplateCtaButtonClass, "w-full min-h-[48px]")}
                >
                  ไปสั่งอาหาร
                </button>
              </div>
            : null}
          </div>
        : null}

        {isCustomer && loyaltyEnabled && customerTab === "redeem" ?
          <div className="mt-5">
            <BuildingPosCustomerLoyaltyPanel
              ownerId={ownerId}
              trialSessionId={trialSessionId}
              phone={memberPhone}
              hidePhoneInput
              tableNo={tableNo}
              customerName={customerName}
              customerSessionId={customerSessionId}
              initialRewards={loyaltyRewards}
              onRedeemed={() => {
                void loadMyOrders();
                setMsg("แลกคะแนนแล้ว");
                setCustomerTab("orders");
                setLoyaltyLookupTick((n) => n + 1);
              }}
            />
          </div>
        : null}

        {isCustomer && customerTab === "orders" ?
          <section className={cn("mt-5 p-4", shopQrTemplateCardClass)}>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">ออเดอร์</h2>
              <button
                type="button"
                onClick={() => void loadMyOrders()}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50/60"
              >
                รีเฟรช
              </button>
            </div>
            {!customerSessionId ?
              <p className="mt-3 text-xs text-slate-500">กำลังเตรียมเซสชัน…</p>
            : myOrders.length === 0 ?
              <div className="mt-4 space-y-3 text-center">
                <p className="text-sm text-slate-600">ยังไม่มีออเดอร์ในรอบนี้</p>
                <button
                  type="button"
                  onClick={() => setCustomerTab("menu")}
                  className={cn(shopQrTemplateCtaButtonClass, "mx-auto min-h-[44px] px-5")}
                >
                  ไปสั่งอาหาร
                </button>
              </div>
            : <ul className="mt-3 space-y-3">
                {myOrders.map((o) => (
                  <li
                    key={o.id}
                    className="rounded-xl border border-slate-200 bg-white/90 px-3 py-3 text-sm shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold tabular-nums text-slate-800">#{o.id}</span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                          o.status === "PAID" ? "bg-emerald-100 text-emerald-900"
                          : o.status === "DELIVERED" ? "bg-violet-100 text-violet-900"
                          : o.status === "SERVING" ? "bg-cyan-100 text-cyan-900"
                          : o.status === "SERVED" ? "bg-sky-100 text-sky-900"
                          : o.status === "PREPARING" ? "bg-amber-100 text-amber-900"
                          : "bg-slate-100 text-slate-800",
                        )}
                      >
                        {buildingPosCustomerStatusLabel(o.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {formatBangkokDateTimeStable(o.created_at)}
                    </p>
                    <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-700">
                      {o.items.map((it, idx) => (
                        <li key={`${o.id}-${it.menu_item_id}-${idx}`} className="flex justify-between gap-2">
                          <span className="min-w-0">
                            <span className="tabular-nums text-slate-500">×{it.qty}</span> {it.name}
                          </span>
                          <span className="shrink-0 tabular-nums">฿{formatDormAmountStable(it.price * it.qty)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-right text-sm font-bold tabular-nums text-indigo-800">
                      รวม ฿{formatDormAmountStable(o.total_amount)}
                    </p>
                  </li>
                ))}
              </ul>
            }
          </section>
        : null}

        {showMenuPanel ?
          <>
        <div className="mt-5">
          <p className="mb-2 text-xs font-medium text-slate-500">หมวดหมู่</p>
          <div className="-mx-4 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] sm:-mx-5">
            <div className="flex w-max gap-2 px-4 sm:px-5">
              <button
                type="button"
                onClick={() => setFilterCat("all")}
                className={cn(
                  "shrink-0 snap-start transition",
                  filterCat === "all" ?
                    useTemplate ?
                      buildingPosChipActiveClass
                    : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                  : useTemplate ?
                    buildingPosChipIdleClass
                  : "bg-white/10 text-slate-300 hover:bg-white/15",
                )}
              >
                ทั้งหมด
              </button>
              {sortedCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFilterCat(c.id)}
                  className={cn(
                    "flex shrink-0 snap-start items-center gap-2 transition",
                    filterCat === c.id ?
                      useTemplate ?
                        buildingPosChipActiveClass
                      : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                    : useTemplate ?
                      buildingPosChipIdleClass
                    : "bg-white/10 text-slate-300 hover:bg-white/15",
                  )}
                >
                  <BuildingPosRemoteImg src={c.image_url} className="h-6 w-6 rounded-md object-cover" fallback={null} />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filterCat === "all" && featuredItems.length > 0 ? (
          <section className="mt-5">
            <div className="mb-2 flex items-center gap-2">
              <IconSparkles className={cn("h-4 w-4", useTemplate ? "text-amber-500" : "text-amber-400")} />
              <h2 className={cn("text-base font-bold", useTemplate ? "text-slate-900" : "text-white")}>เมนูแนะนำ</h2>
            </div>
            <div className="-mx-4 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] snap-x snap-mandatory sm:-mx-5">
              <div className="flex w-max gap-1.5 px-4 sm:px-5">
                {featuredItems.map((m) => (
                  <MenuDishCard
                    key={`feat-${m.id}`}
                    item={m}
                    qty={getQty(m.id)}
                    onAdd={() => addItem(m)}
                    onDec={() => decItem(m)}
                    compact
                    showHotBadge={topHotIds.has(m.id)}
                    useTemplate={useTemplate}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {filterCat === "all" && bestsellerItems.length > 0 ? (
          <section className="mt-5">
            <div className="mb-2 flex items-center gap-2">
              <IconFlame className={cn("h-4 w-4", useTemplate ? "text-rose-500" : "text-rose-400")} />
              <h2 className={cn("text-base font-bold", useTemplate ? "text-slate-900" : "text-white")}>ขายดี</h2>
            </div>
            <div className="-mx-4 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] snap-x snap-mandatory sm:-mx-5">
              <div className="flex w-max gap-1.5 px-4 sm:px-5">
                {bestsellerItems.map((m) => (
                  <MenuDishCard
                    key={`hot-${m.id}`}
                    item={m}
                    qty={getQty(m.id)}
                    onAdd={() => addItem(m)}
                    onDec={() => decItem(m)}
                    compact
                    showHotBadge={topHotIds.has(m.id)}
                    useTemplate={useTemplate}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {sortedCategories.map((c) => {
          if (filterCat !== "all" && filterCat !== c.id) return null;
          const items = itemsForCategory(c.id);
          if (items.length === 0) return null;
          return (
            <section key={c.id} className="mt-7">
              <div
                className={cn(
                  "mb-2.5 flex items-center gap-2.5 border-b pb-2",
                  useTemplate ? "border-slate-200" : "border-white/10",
                )}
              >
                <BuildingPosRemoteImg
                  src={c.image_url}
                  className={cn(
                    "h-9 w-9 rounded-lg object-cover sm:h-10 sm:w-10",
                    useTemplate ? "border border-slate-200" : "border border-white/10",
                  )}
                  fallback={
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg sm:h-10 sm:w-10",
                        useTemplate ? "bg-slate-100 text-slate-400" : "bg-white/10 text-slate-500",
                      )}
                    >
                      <IconSparkles className="h-4 w-4 opacity-50" />
                    </div>
                  }
                />
                <div>
                  <h2 className={cn("text-base font-bold", useTemplate ? "text-slate-900" : "text-white")}>{c.name}</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {items.map((m) => (
                  <MenuDishCardGrid
                    key={m.id}
                    item={m}
                    qty={getQty(m.id)}
                    onAdd={() => addItem(m)}
                    onDec={() => decItem(m)}
                    showHotBadge={topHotIds.has(m.id)}
                    useTemplate={useTemplate}
                  />
                ))}
              </div>
            </section>
          );
        })}
          </>
        : null}

        {msg ? (
          <p
            className={cn(
              "mt-6 rounded-2xl border px-4 py-3 text-center text-sm",
              useTemplate ?
                "border-indigo-200 bg-indigo-50 text-indigo-900"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
            )}
          >
            {msg}
          </p>
        ) : null}
      </div>

      {showCartBar ?
      <div
        className={cn(
          embeddedInModal ?
            "sticky bottom-0 z-10 mt-6 border-t px-4 py-3 backdrop-blur-lg sm:px-5"
          : "fixed bottom-0 left-0 right-0 z-50 border-t px-4 py-3 backdrop-blur-lg sm:px-5",
          useTemplate ?
            "border-slate-200 bg-white/95 shadow-[0_-8px_32px_rgba(15,23,42,0.08)]"
          : "border-white/10 bg-slate-950/95 shadow-[0_-8px_32px_rgba(0,0,0,0.4)]",
        )}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 sm:max-w-xl">
          <div>
            <p className="text-xs text-slate-500">ยอดรวม</p>
            <p
              className={cn(
                "text-lg font-bold tabular-nums",
                useTemplate ? "text-slate-900" : "text-white",
              )}
            >
              ฿{formatDormAmountStable(cartTotal)}
              {cartCount > 0 ? (
                <span className="ml-2 text-sm font-normal text-slate-500">({cartCount} ชิ้น)</span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            disabled={cartList.length === 0}
            onClick={() => {
              if (customerReviewsBeforeSend) setReviewOpen(true);
              else void submitOrder();
            }}
            className={cn(
              useTemplate ?
                shopQrTemplateCtaButtonClass
              : "min-h-[48px] shrink-0 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition enabled:hover:from-emerald-400 enabled:hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {customerReviewsBeforeSend ? "ตรวจสอบรายการ" : "ส่งออเดอร์"}
          </button>
        </div>
        <div className="pb-[max(0.25rem,env(safe-area-inset-bottom))]" aria-hidden />
      </div>
      : null}

      {customerReviewsBeforeSend && reviewOpen ?
        <div
          className={cn(
            "fixed inset-0 flex flex-col justify-end sm:justify-center sm:p-4",
            embeddedInModal ? "z-[220]" : "z-[60]",
          )}
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
            aria-label="ปิด"
            onClick={() => setReviewOpen(false)}
          />
          <div
            className="relative z-10 flex max-h-[min(88dvh,640px)] w-full flex-col rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:mx-auto sm:max-w-lg sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pos-order-review-title"
          >
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-5 sm:px-5 sm:pt-6">
              <h2 id="pos-order-review-title" className="text-lg font-bold text-slate-900">
                สรุปรายการ
              </h2>

              <ul className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                {cartList.map((line) => (
                  <li
                    key={line.menu_item_id}
                    className="flex gap-3 text-sm leading-snug text-slate-800"
                  >
                    <span className="min-w-[2rem] tabular-nums text-slate-500">×{line.qty}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{line.name}</p>
                      {line.note?.trim() ?
                        <p className="mt-0.5 text-xs text-slate-500">หมายเหตุ: {line.note.trim()}</p>
                      : null}
                    </div>
                    <span className="shrink-0 tabular-nums font-semibold text-indigo-800">
                      ฿{formatDormAmountStable(line.price * line.qty)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">ชื่อ</dt>
                  <dd className="max-w-[65%] text-right font-medium text-slate-800">
                    {customerName.trim() || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">โต๊ะ</dt>
                  <dd className="text-right font-medium tabular-nums text-slate-800">
                    {tableNo.trim() || <span className="text-amber-700">ยังไม่ระบุ</span>}
                  </dd>
                </div>
                {loyaltyEnabled && normalizeBuildingPosMemberPhone(memberPhone).length >= 9 ?
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">เบอร์สะสมคะแนน</dt>
                    <dd className="text-right font-medium tabular-nums text-slate-800">
                      {normalizeBuildingPosMemberPhone(memberPhone)}
                    </dd>
                  </div>
                : loyaltyEnabled ?
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">เบอร์สะสมคะแนน</dt>
                    <dd className="text-right text-xs text-slate-500">—</dd>
                  </div>
                : null}
                <div className="flex justify-between gap-2 border-t border-slate-200/80 pt-2">
                  <dt className="font-semibold text-slate-700">ยอดรวม</dt>
                  <dd className="text-lg font-bold tabular-nums text-indigo-800">฿{formatDormAmountStable(cartTotal)}</dd>
                </div>
              </dl>
            </div>

            <div className="flex shrink-0 gap-2 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                className="min-h-[48px] flex-1 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                แก้ไข
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleConfirmSendFromReview()}
                className={cn(shopQrTemplateCtaButtonClass, "min-h-[48px] flex-[1.15] px-4")}
              >
                {submitting ? "กำลังส่ง…" : "ยืนยันส่งออเดอร์"}
              </button>
            </div>
            <div className="h-[max(0.5rem,env(safe-area-inset-bottom))] shrink-0 bg-white sm:h-2" aria-hidden />
          </div>
        </div>
      : null}
    </div>
  );
}
