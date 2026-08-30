"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, Suspense } from "react";
import { DemoSessionBanner } from "@/components/dashboard/DemoSessionBanner";
import { LogoutButton, LogoutIconButton } from "@/components/layout/LogoutButton";
import { dashboardNavIconForHref } from "@/components/layout/dashboard-nav-icons";
import { MawellLogo } from "@/components/layout/MawellLogo";
import { appDashboardBrandGradientBarClass, appDashboardBrandGradientFillClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import type { SubscriptionTier, SubscriptionType } from "@/generated/prisma/enums";
import {
  buildDashboardNavGroups,
  canonicalDashboardModuleLinkHref,
  type DashboardNavGroup,
  type DashboardNavGroupId,
} from "@/lib/dashboard-nav";
import {
  CHAT_AI_DASHBOARD_HREF,
  isChatAiDashboardPath,
  resolveDashboardNavLinkHref,
} from "@/lib/dashboard/chat-ai-href";
import {
  buffetTierMaxGroup,
  MODULE_GROUP_TIER_NAME,
  UI_VISIBLE_MAX_MODULE_GROUP,
} from "@/lib/modules/config";
import {
  BUILDING_POS_HEADER_COLLAPSE_EVENT,
  BUILDING_POS_ORDER_HREF,
  isBuildingPosModulePath,
  readBuildingPosHeaderCollapsed,
  writeBuildingPosHeaderCollapsed,
} from "@/systems/building-pos/building-pos-nav";
import { BuildingPosHeaderBarNav, BuildingPosHeaderExpandButton } from "@/systems/building-pos/components/BuildingPosHeaderBarNav";
import { DrinkPosHeaderBarNav, DrinkPosHeaderExpandButton } from "@/systems/drink-pos/components/DrinkPosHeaderBarNav";
import {
  DRINK_POS_HEADER_COLLAPSE_EVENT,
  DRINK_POS_ORDER_HREF,
  isDrinkPosModulePath,
  readDrinkPosHeaderCollapsed,
  writeDrinkPosHeaderCollapsed,
} from "@/systems/drink-pos/lib/drink-pos-module-nav";
import {
  FootballTurfHeaderBarNav,
  FootballTurfHeaderExpandButton,
} from "@/systems/football-turf/components/FootballTurfHeaderBarNav";
import {
  FOOTBALL_TURF_HEADER_COLLAPSE_EVENT,
  isFootballTurfModulePath,
  readFootballTurfHeaderCollapsed,
  writeFootballTurfHeaderCollapsed,
} from "@/systems/football-turf/football-turf-module-nav";
import {
  HotelResortHeaderBarNav,
  HotelResortHeaderExpandButton,
} from "@/systems/hotel-resort/components/HotelResortHeaderBarNav";
import {
  HOTEL_RESORT_HEADER_COLLAPSE_EVENT,
  isHotelResortModulePath,
  readHotelResortHeaderCollapsed,
  writeHotelResortHeaderCollapsed,
} from "@/systems/hotel-resort/hotel-resort-module-nav";
import {
  AttendanceHeaderBarNav,
  AttendanceHeaderExpandButton,
} from "@/systems/attendance/components/AttendanceHeaderBarNav";
import {
  ATTENDANCE_HEADER_COLLAPSE_EVENT,
  isAttendanceModulePath,
  readAttendanceHeaderCollapsed,
  writeAttendanceHeaderCollapsed,
} from "@/systems/attendance/attendance-module-nav";
import {
  CarWashHeaderBarNav,
  CarWashHeaderExpandButton,
} from "@/systems/car-wash/components/CarWashHeaderBarNav";
import {
  CAR_WASH_HEADER_COLLAPSE_EVENT,
  isCarWashModulePath,
  readCarWashHeaderCollapsed,
  writeCarWashHeaderCollapsed,
} from "@/systems/car-wash/car-wash-module-nav";
import {
  MassageHeaderBarNav,
  MassageHeaderExpandButton,
} from "@/systems/massage/components/MassageHeaderBarNav";
import {
  MASSAGE_HEADER_COLLAPSE_EVENT,
  isMassageModulePath,
  readMassageHeaderCollapsed,
  writeMassageHeaderCollapsed,
} from "@/systems/massage/massage-module-nav";
import {
  BarberHeaderBarNav,
  BarberHeaderExpandButton,
} from "@/systems/barber/components/BarberHeaderBarNav";
import {
  BARBER_HEADER_COLLAPSE_EVENT,
  isBarberModulePath,
  readBarberHeaderCollapsed,
  writeBarberHeaderCollapsed,
} from "@/systems/barber/barber-module-nav";
import {
  AdminHubHeaderBarNav,
  AdminHubHeaderExpandButton,
} from "@/components/admin/AdminHubHeaderBarNav";
import {
  ADMIN_HUB_HEADER_COLLAPSE_EVENT,
  isAdminHubPath,
  readAdminHubHeaderCollapsed,
  writeAdminHubHeaderCollapsed,
} from "@/lib/admin-hub-nav";
import {
  DormitoryHeaderBarNav,
  DormitoryHeaderExpandButton,
} from "@/systems/dormitory/components/DormitoryHeaderBarNav";
import {
  DORMITORY_HEADER_COLLAPSE_EVENT,
  isDormitoryModulePath,
  readDormitoryHeaderCollapsed,
  writeDormitoryHeaderCollapsed,
} from "@/systems/dormitory/dormitory-module-nav";
import {
  VaultHeaderBarNav,
  VaultHeaderExpandButton,
} from "@/systems/vault/components/VaultHeaderBarNav";
import {
  VAULT_HEADER_COLLAPSE_EVENT,
  isVaultModulePath,
  readVaultHeaderCollapsed,
  writeVaultHeaderCollapsed,
} from "@/systems/vault/vault-module-nav";
import {
  AssetHeaderBarNav,
  AssetHeaderExpandButton,
} from "@/systems/asset/components/AssetHeaderBarNav";
import {
  ASSET_HEADER_COLLAPSE_EVENT,
  isAssetModulePath,
  readAssetHeaderCollapsed,
  writeAssetHeaderCollapsed,
} from "@/systems/asset/asset-module-nav";
import {
  GeneralStorePosHeaderBarNav,
  GeneralStorePosHeaderExpandButton,
} from "@/systems/general-store-pos/components/GeneralStorePosHeaderBarNav";
import {
  GENERAL_STORE_POS_HEADER_COLLAPSE_EVENT,
  isGeneralStorePosModulePath,
  readGeneralStorePosHeaderCollapsed,
  writeGeneralStorePosHeaderCollapsed,
} from "@/systems/general-store-pos/general-store-pos-module-nav";
import {
  EducareHeaderBarNav,
  EducareHeaderExpandButton,
} from "@/systems/educare/components/EducareHeaderBarNav";
import {
  EDUCARE_HEADER_COLLAPSE_EVENT,
  isEducareModulePath,
  readEducareHeaderCollapsed,
  writeEducareHeaderCollapsed,
} from "@/systems/educare/educare-module-nav";
import {
  CommunityCoopHeaderBarNav,
  CommunityCoopHeaderExpandButton,
} from "@/systems/community-coop/components/CommunityCoopHeaderBarNav";
import {
  COMMUNITY_COOP_HEADER_COLLAPSE_EVENT,
  isCommunityCoopModulePath,
  readCommunityCoopHeaderCollapsed,
  writeCommunityCoopHeaderCollapsed,
} from "@/systems/community-coop/community-coop-module-nav";
import {
  HomeFinanceHeaderBarNav,
  HomeFinanceHeaderExpandButton,
} from "@/systems/home-finance/components/HomeFinanceHeaderBarNav";
import {
  HOME_FINANCE_HEADER_COLLAPSE_EVENT,
  isHomeFinanceModulePath,
  readHomeFinanceHeaderCollapsed,
  writeHomeFinanceHeaderCollapsed,
} from "@/systems/home-finance/home-finance-module-nav";
import {
  EcommerceStoreHeaderBarNav,
  EcommerceStoreHeaderExpandButton,
} from "@/systems/ecommerce-store/components/EcommerceStoreHeaderBarNav";
import {
  ECOMMERCE_STORE_HEADER_COLLAPSE_EVENT,
  isEcommerceStoreModulePath,
  readEcommerceStoreHeaderCollapsed,
  writeEcommerceStoreHeaderCollapsed,
} from "@/systems/ecommerce-store/ecommerce-store-module-nav";
import {
  AppointmentQueueHeaderBarNav,
  AppointmentQueueHeaderExpandButton,
} from "@/systems/appointment-queue/components/AppointmentQueueHeaderBarNav";
import {
  APPOINTMENT_QUEUE_HEADER_COLLAPSE_EVENT,
  isAppointmentQueueModulePath,
  readAppointmentQueueHeaderCollapsed,
  writeAppointmentQueueHeaderCollapsed,
} from "@/systems/appointment-queue/appointment-queue-module-nav";
import {
  SchoolBankHeaderBarNav,
  SchoolBankHeaderExpandButton,
} from "@/systems/school-bank/components/SchoolBankHeaderBarNav";
import {
  SCHOOL_BANK_HEADER_COLLAPSE_EVENT,
  isSchoolBankModulePath,
  readSchoolBankHeaderCollapsed,
  writeSchoolBankHeaderCollapsed,
} from "@/systems/school-bank/school-bank-module-nav";
import {
  WaitQueueHeaderBarNav,
  WaitQueueHeaderExpandButton,
} from "@/systems/wait-queue/components/WaitQueueHeaderBarNav";
import {
  WAIT_QUEUE_HEADER_COLLAPSE_EVENT,
  isWaitQueueModulePath,
  readWaitQueueHeaderCollapsed,
  writeWaitQueueHeaderCollapsed,
} from "@/systems/wait-queue/wait-queue-module-nav";
import {
  ActivityLogsHeaderBarNav,
  ActivityLogsHeaderExpandButton,
} from "@/systems/activity-logs/components/ActivityLogsHeaderBarNav";
import {
  ACTIVITY_LOGS_HEADER_COLLAPSE_EVENT,
  isActivityLogsModulePath,
  readActivityLogsHeaderCollapsed,
  writeActivityLogsHeaderCollapsed,
} from "@/systems/activity-logs/activity-logs-module-nav";
import {
  PromptLibraryHeaderBarNav,
  PromptLibraryHeaderExpandButton,
} from "@/systems/prompt-library/components/PromptLibraryHeaderBarNav";
import {
  PROMPT_LIBRARY_HEADER_COLLAPSE_EVENT,
  isPromptLibraryModulePath,
  readPromptLibraryHeaderCollapsed,
  writePromptLibraryHeaderCollapsed,
} from "@/systems/prompt-library/prompt-library-module-nav";
import {
  DocTransmissionHeaderBarNav,
  DocTransmissionHeaderExpandButton,
} from "@/systems/doc-transmission/components/DocTransmissionHeaderBarNav";
import {
  DOC_TRANSMISSION_HEADER_COLLAPSE_EVENT,
  isDocTransmissionModulePath,
  readDocTransmissionHeaderCollapsed,
  writeDocTransmissionHeaderCollapsed,
} from "@/systems/doc-transmission/doc-transmission-module-nav";
import {
  LoyaltyStampHeaderBarNav,
  LoyaltyStampHeaderExpandButton,
} from "@/systems/loyalty-stamp/components/LoyaltyStampHeaderBarNav";
import {
  LOYALTY_STAMP_HEADER_COLLAPSE_EVENT,
  isLoyaltyStampModulePath,
  readLoyaltyStampHeaderCollapsed,
  writeLoyaltyStampHeaderCollapsed,
} from "@/systems/loyalty-stamp/loyalty-stamp-module-nav";
import {
  VillageHeaderBarNav,
  VillageHeaderExpandButton,
} from "@/systems/village/components/VillageHeaderBarNav";
import {
  VILLAGE_HEADER_COLLAPSE_EVENT,
  isVillageModulePath,
  readVillageHeaderCollapsed,
  writeVillageHeaderCollapsed,
} from "@/systems/village/village-nav";
import {
  LaundryHeaderBarNav,
  LaundryHeaderExpandButton,
} from "@/systems/laundry/components/LaundryHeaderBarNav";
import {
  LAUNDRY_HEADER_COLLAPSE_EVENT,
  isLaundryModulePath,
  readLaundryHeaderCollapsed,
  writeLaundryHeaderCollapsed,
} from "@/systems/laundry/laundry-module-nav";
import {
  ParkingHeaderBarNav,
  ParkingHeaderExpandButton,
} from "@/systems/parking/components/ParkingHeaderBarNav";
import {
  PARKING_HEADER_COLLAPSE_EVENT,
  isParkingModulePath,
  readParkingHeaderCollapsed,
  writeParkingHeaderCollapsed,
} from "@/systems/parking/parking-module-nav";
import {
  InventoryHeaderBarNav,
  InventoryHeaderExpandButton,
} from "@/systems/inventory/components/InventoryHeaderBarNav";
import {
  INVENTORY_HEADER_COLLAPSE_EVENT,
  isInventoryModulePath,
  readInventoryHeaderCollapsed,
  writeInventoryHeaderCollapsed,
} from "@/systems/inventory/inventory-module-nav";
import {
  SmartPoliceHeaderBarNav,
  SmartPoliceHeaderExpandButton,
} from "@/systems/smart-police/components/SmartPoliceHeaderBarNav";
import {
  SMART_POLICE_HEADER_COLLAPSE_EVENT,
  isSmartPoliceModulePath,
  readSmartPoliceHeaderCollapsed,
  writeSmartPoliceHeaderCollapsed,
} from "@/systems/smart-police/smart-police-nav";
import {
  MediaRegistryHeaderBarNav,
  MediaRegistryHeaderExpandButton,
} from "@/systems/media-registry/components/MediaRegistryHeaderBarNav";
import {
  MEDIA_REGISTRY_HEADER_COLLAPSE_EVENT,
  isMediaRegistryModulePath,
  readMediaRegistryHeaderCollapsed,
  writeMediaRegistryHeaderCollapsed,
} from "@/systems/media-registry/media-registry-module-nav";

/** localStorage — ซ่อนแถบเมนูซ้ายบนเดสก์ท็อป (ใช้ทุกหน้าแดชบอร์ดที่ผ่าน DashboardShell) */
const DASHBOARD_SIDEBAR_COLLAPSED_KEY = "mawell-dashboard-sidebar-collapsed";

function headerPackageLabel(
  subscriptionType: SubscriptionType,
  subscriptionTier: SubscriptionTier,
): string {
  if (subscriptionType === "BUFFET" && subscriptionTier !== "NONE") {
    const g = buffetTierMaxGroup(subscriptionTier);
    const name = MODULE_GROUP_TIER_NAME[g] ?? subscriptionTier;
    if (g > UI_VISIBLE_MAX_MODULE_GROUP) {
      return `${name} · เปิดกลุ่ม 1`;
    }
    return name;
  }
  return "สายรายวัน";
}

function isNavActive(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === CHAT_AI_DASHBOARD_HREF) {
    return isChatAiDashboardPath(pathname);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * อยู่หน้าโมดูลงาน (ไม่ใช่หน้าแกนระบบ) — ใช้ย่อ sidebar หลัก
 * สำคัญ: `/dashboard` ต้องเทียบ exact เท่านั้น
 */
function isModuleWorkspacePath(pathname: string): boolean {
  if (pathname === "/dashboard") return false;
  if (isChatAiDashboardPath(pathname)) return false;

  const basicPrefixes = [
    "/dashboard/profile",
    "/dashboard/plans",
    "/dashboard/chat",
    "/dashboard/modules",
    "/dashboard/systems",
    "/dashboard/admin",
  ] as const;

  for (const route of basicPrefixes) {
    if (pathname === route || pathname.startsWith(`${route}/`)) return false;
  }

  return pathname.startsWith("/dashboard/");
}

/** เลย์เอาต์โฟกัสเต็ม (ซ่อนปุ่ม sidebar + ใช้เมนู dropdown) — ปิดไว้ ให้รูปแบบเดิม + ย่อ sidebar พอ */
function shouldUseSystemFocusLayout(_pathname: string): boolean {
  return false;
}

function SidebarNavLink({
  href,
  pathname,
  label,
}: {
  href: string;
  pathname: string;
  label: string;
}) {
  const resolvedHref = canonicalDashboardModuleLinkHref(resolveDashboardNavLinkHref(href));
  const active = isNavActive(resolvedHref, pathname);
  return (
    <Link
      href={resolvedHref}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-black transition-all duration-300",
        active
          ? cn(appDashboardBrandGradientFillClass, "text-white shadow-[0_18px_30px_-22px_rgba(91,97,255,0.55)]")
          : "bg-white/70 text-slate-600 ring-1 ring-slate-200/60 hover:bg-white",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
          active ? "bg-white/15 ring-white/20" : "bg-slate-50 text-slate-500 ring-slate-200",
        )}
        aria-hidden
      >
        {dashboardNavIconForHref(resolvedHref)}
      </span>
      <span className="min-w-0 flex-1 truncate leading-tight">{label}</span>
    </Link>
  );
}

function DrawerNavLink({
  href,
  pathname,
  onNavigate,
  label,
}: {
  href: string;
  pathname: string;
  onNavigate: () => void;
  label: string;
}) {
  const resolvedHref = canonicalDashboardModuleLinkHref(resolveDashboardNavLinkHref(href));
  const active = isNavActive(resolvedHref, pathname);
  return (
    <Link
      href={resolvedHref}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12.5px] font-semibold transition-all duration-300",
        active
          ? "bg-white/15 text-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15)] ring-1 ring-white/30"
          : "text-white/65 hover:bg-white/10 hover:text-white",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-1.5 -translate-y-1/2 rounded-r-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
      )}
      <div className={cn("transition-all duration-300 group-hover:scale-110 group-hover:rotate-3", active ? "text-white scale-110" : "text-white/50")}>
        {dashboardNavIconForHref(resolvedHref)}
      </div>
      <span className="min-w-0 leading-tight">{label}</span>
    </Link>
  );
}

function ChevronNavExpand({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className={cn(
        "shrink-0 text-slate-400 transition-transform duration-200",
        expanded && "rotate-90",
      )}
      aria-hidden
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavCollapsibleGroup({
  group,
  open,
  onToggle,
  pathname,
  variant,
  onDrawerNavigate,
}: {
  group: DashboardNavGroup;
  open: boolean;
  onToggle: () => void;
  pathname: string;
  variant: "sidebar" | "drawer";
  onDrawerNavigate?: () => void;
}) {
  const isDrawer = variant === "drawer";
  const cardClass = isDrawer
    ? "border border-white/10 bg-white/10 backdrop-blur-xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.2)]"
    : "border border-[#e8e6fc]/70 bg-gradient-to-br from-white/70 via-white/50 to-[#f5f3ff]/45 shadow-[0_10px_28px_-20px_rgba(30,27,75,0.22)] backdrop-blur-xl";
  const headerHoverClass = isDrawer ? "hover:bg-white/15" : "hover:bg-white/75";
  const titleClass = isDrawer ? "text-white" : "text-[#2e2a58]";
  const badgeClass = isDrawer
    ? "border border-white/30 bg-white/20 text-[10px] text-white/90 font-bold tracking-tight"
    : "border border-[#0000BF]/20 bg-[#0000BF]/10 text-[10px] text-[#2e2a58] font-bold tracking-tight";
  const ringFocus = isDrawer ? "focus-visible:ring-white/40" : "focus-visible:ring-[#5b61ff]/30";

  return (
    <div className={cn("rounded-[1.15rem] p-1.5 transition-all duration-300", cardClass)}>
      <button
        type="button"
        suppressHydrationWarning
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left outline-none transition-all duration-300 focus-visible:ring-2",
          headerHoverClass,
          ringFocus,
        )}
        aria-expanded={open}
        onClick={onToggle}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className={cn("line-clamp-1 text-[13px] font-bold leading-none tracking-tight", titleClass)}>
              {group.label}
            </span>
            <span className={cn("inline-flex rounded-lg border px-2 py-0.5", badgeClass)}>
              {group.items.length}
            </span>
          </div>
        </div>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
            isDrawer ? "bg-white/10" : "bg-white/80 ring-1 ring-[#e8e6fc]/80",
          )}
          aria-hidden
        >
          <ChevronNavExpand expanded={open} />
        </span>
      </button>
      {open ? (
        <div className="mt-2 flex flex-col gap-1.5 px-1">
          {group.items.map((item, idx) => {
            const key = "href" in item ? item.href : `mod-${idx}`;
            return variant === "sidebar" ? (
              <SidebarNavLink
                key={key}
                href={item.href}
                pathname={pathname}
                label={item.label}
              />
            ) : (
              <DrawerNavLink
                key={key}
                href={item.href}
                pathname={pathname}
                label={item.label}
                onNavigate={onDrawerNavigate ?? (() => {})}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  username: string;
  /** ชื่อที่แสดงใน header (ชื่อจริงหรือ username) */
  displayName: string;
  role: "USER" | "ADMIN";
  tokens: number;
  subscriptionTier: SubscriptionTier;
  subscriptionType: SubscriptionType;
  /** โมดูลที่ user มีสิทธิ์ — แสดงในกลุ่มระบบใช้บริการ */
  serviceModules: { slug: string; title: string; groupId: number }[];
  avatarUrl: string | null;
  /** ล็อกอินเป็นบัญชีทดลองสาธารณะ — แสดงแบนเนอร์ออกจากโหมดทดลอง */
  demoSession?: boolean;
  children: React.ReactNode;
};

export function DashboardShell({
  username,
  displayName,
  role,
  tokens,
  subscriptionTier,
  subscriptionType,
  serviceModules,
  avatarUrl,
  demoSession = false,
  children,
}: Props) {
  const pathname = usePathname();
  /** หน้าพนักงานจาก QR — ไม่ใช้แถบแดชบอร์ดและ sidebar */
  const barberStaffKiosk = pathname === "/dashboard/barber/staff";
  const laundryStaffKiosk = pathname === "/dashboard/laundry/staff";
  const massageStaffKiosk = pathname === "/dashboard/massage/staff";
  const moduleStaffKiosk = barberStaffKiosk || laundryStaffKiosk || massageStaffKiosk;
  /** มือถือ: ในโมดูลหรือศูนย์แอดมิน ซ่อนเมนูหลักด้านล่าง — ให้ใช้เมนูโมดูล/แอดมินแทน */
  const onAdminHub = isAdminHubPath(pathname);
  const hideMainMobileBottomNav =
    moduleStaffKiosk || isModuleWorkspacePath(pathname) || onAdminHub;
  const [drawerOpen, setDrawerOpen] = useState(false);
  /** เดสก์ท็อป: ซ่อน sidebar เพื่อให้พื้นที่เนื้อหากว้างขึ้น — โหลดจาก localStorage หลัง mount · โหมดทดลองเริ่มซ่อน */
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => demoSession);
  const [accountOpen, setAccountOpen] = useState(false);
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
  const [drinkPosHeaderCollapsed, setDrinkPosHeaderCollapsed] = useState(false);
  const [buildingPosHeaderCollapsed, setBuildingPosHeaderCollapsed] = useState(false);
  const [footballTurfHeaderCollapsed, setFootballTurfHeaderCollapsed] = useState(false);
  const [hotelResortHeaderCollapsed, setHotelResortHeaderCollapsed] = useState(false);
  const [attendanceHeaderCollapsed, setAttendanceHeaderCollapsed] = useState(false);
  const [carWashHeaderCollapsed, setCarWashHeaderCollapsed] = useState(false);
  const [massageHeaderCollapsed, setMassageHeaderCollapsed] = useState(false);
  const [barberHeaderCollapsed, setBarberHeaderCollapsed] = useState(false);
  const [adminHubHeaderCollapsed, setAdminHubHeaderCollapsed] = useState(false);
  const [dormitoryHeaderCollapsed, setDormitoryHeaderCollapsed] = useState(false);
  const [vaultHeaderCollapsed, setVaultHeaderCollapsed] = useState(false);
  const [assetHeaderCollapsed, setAssetHeaderCollapsed] = useState(false);
  const [generalStorePosHeaderCollapsed, setGeneralStorePosHeaderCollapsed] = useState(false);
  const [educareHeaderCollapsed, setEducareHeaderCollapsed] = useState(false);
  const [communityCoopHeaderCollapsed, setCommunityCoopHeaderCollapsed] = useState(false);
  const [homeFinanceHeaderCollapsed, setHomeFinanceHeaderCollapsed] = useState(false);
  const [ecommerceStoreHeaderCollapsed, setEcommerceStoreHeaderCollapsed] = useState(false);
  const [appointmentQueueHeaderCollapsed, setAppointmentQueueHeaderCollapsed] = useState(false);
  const [schoolBankHeaderCollapsed, setSchoolBankHeaderCollapsed] = useState(false);
  const [waitQueueHeaderCollapsed, setWaitQueueHeaderCollapsed] = useState(false);
  const [activityLogsHeaderCollapsed, setActivityLogsHeaderCollapsed] = useState(false);
  const [promptLibraryHeaderCollapsed, setPromptLibraryHeaderCollapsed] = useState(false);
  const [docTransmissionHeaderCollapsed, setDocTransmissionHeaderCollapsed] = useState(false);
  const [loyaltyStampHeaderCollapsed, setLoyaltyStampHeaderCollapsed] = useState(false);
  const [villageHeaderCollapsed, setVillageHeaderCollapsed] = useState(false);
  const [laundryHeaderCollapsed, setLaundryHeaderCollapsed] = useState(false);
  const [parkingHeaderCollapsed, setParkingHeaderCollapsed] = useState(false);
  const [inventoryHeaderCollapsed, setInventoryHeaderCollapsed] = useState(false);
  const [smartPoliceHeaderCollapsed, setSmartPoliceHeaderCollapsed] = useState(false);
  const [mediaRegistryHeaderCollapsed, setMediaRegistryHeaderCollapsed] = useState(false);
  const accountWrapRef = useRef<HTMLDivElement>(null);
  const moduleMenuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const navGroups = buildDashboardNavGroups(role, serviceModules);
  const systemFocusLayout = shouldUseSystemFocusLayout(pathname);
  const onDrinkPosModule = isDrinkPosModulePath(pathname);
  const onBuildingPosModule = isBuildingPosModulePath(pathname);
  /** หน้าออเดอร์ POS — เดสก์ท็อปล็อกความสูงให้คอลัมน์ซ้าย/ขวาเลื่อนในกรอบ (มือถือไม่ล็อก) */
  const onPosOrderPage =
    pathname === DRINK_POS_ORDER_HREF ||
    pathname.startsWith(`${DRINK_POS_ORDER_HREF}/`) ||
    pathname === BUILDING_POS_ORDER_HREF ||
    pathname.startsWith(`${BUILDING_POS_ORDER_HREF}/`);
  const onFootballTurfModule = isFootballTurfModulePath(pathname);
  const onHotelResortModule = isHotelResortModulePath(pathname);
  const onAttendanceModule = isAttendanceModulePath(pathname);
  const onCarWashModule = isCarWashModulePath(pathname);
  const onMassageModule = isMassageModulePath(pathname);
  const onBarberModule = isBarberModulePath(pathname);
  const onVaultModule = isVaultModulePath(pathname);
  const onAssetModule = isAssetModulePath(pathname);
  const onGeneralStorePosModule = isGeneralStorePosModulePath(pathname);
  const onEducareModule = isEducareModulePath(pathname);
  const onCommunityCoopModule = isCommunityCoopModulePath(pathname);
  const onHomeFinanceModule = isHomeFinanceModulePath(pathname);
  const onEcommerceStoreModule = isEcommerceStoreModulePath(pathname);
  const onAppointmentQueueModule = isAppointmentQueueModulePath(pathname);
  const onSchoolBankModule = isSchoolBankModulePath(pathname);
  const onWaitQueueModule = isWaitQueueModulePath(pathname);
  const onActivityLogsModule = isActivityLogsModulePath(pathname);
  const onPromptLibraryModule = isPromptLibraryModulePath(pathname);
  const onDocTransmissionModule = isDocTransmissionModulePath(pathname);
  const onLoyaltyStampModule = isLoyaltyStampModulePath(pathname);
  const onVillageModule = isVillageModulePath(pathname);
  const onLaundryModule = isLaundryModulePath(pathname);
  const onParkingModule = isParkingModulePath(pathname);
  const onInventoryModule = isInventoryModulePath(pathname);
  const onSmartPoliceModule = isSmartPoliceModulePath(pathname);
  const onMediaRegistryModule = isMediaRegistryModulePath(pathname);
  const onDormitoryModule = isDormitoryModulePath(pathname);
  const showDrinkPosHeaderBar = onDrinkPosModule && drinkPosHeaderCollapsed;
  const showBuildingPosHeaderBar = onBuildingPosModule && buildingPosHeaderCollapsed;
  const showFootballTurfHeaderBar = onFootballTurfModule && footballTurfHeaderCollapsed;
  const showHotelResortHeaderBar = onHotelResortModule && hotelResortHeaderCollapsed;
  const showAttendanceHeaderBar = onAttendanceModule && attendanceHeaderCollapsed;
  const showCarWashHeaderBar = onCarWashModule && carWashHeaderCollapsed;
  const showMassageHeaderBar = onMassageModule && massageHeaderCollapsed;
  const showBarberHeaderBar = onBarberModule && barberHeaderCollapsed;
  const showVaultHeaderBar = onVaultModule && vaultHeaderCollapsed;
  const showAssetHeaderBar = onAssetModule && assetHeaderCollapsed;
  const showGeneralStorePosHeaderBar = onGeneralStorePosModule && generalStorePosHeaderCollapsed;
  const showEducareHeaderBar = onEducareModule && educareHeaderCollapsed;
  const showCommunityCoopHeaderBar = onCommunityCoopModule && communityCoopHeaderCollapsed;
  const showHomeFinanceHeaderBar = onHomeFinanceModule && homeFinanceHeaderCollapsed;
  const showEcommerceStoreHeaderBar = onEcommerceStoreModule && ecommerceStoreHeaderCollapsed;
  const showAppointmentQueueHeaderBar = onAppointmentQueueModule && appointmentQueueHeaderCollapsed;
  const showSchoolBankHeaderBar = onSchoolBankModule && schoolBankHeaderCollapsed;
  const showWaitQueueHeaderBar = onWaitQueueModule && waitQueueHeaderCollapsed;
  const showActivityLogsHeaderBar = onActivityLogsModule && activityLogsHeaderCollapsed;
  const showPromptLibraryHeaderBar = onPromptLibraryModule && promptLibraryHeaderCollapsed;
  const showDocTransmissionHeaderBar = onDocTransmissionModule && docTransmissionHeaderCollapsed;
  const showLoyaltyStampHeaderBar = onLoyaltyStampModule && loyaltyStampHeaderCollapsed;
  const showVillageHeaderBar = onVillageModule && villageHeaderCollapsed;
  const showLaundryHeaderBar = onLaundryModule && laundryHeaderCollapsed;
  const showParkingHeaderBar = onParkingModule && parkingHeaderCollapsed;
  const showInventoryHeaderBar = onInventoryModule && inventoryHeaderCollapsed;
  const showSmartPoliceHeaderBar = onSmartPoliceModule && smartPoliceHeaderCollapsed;
  const showMediaRegistryHeaderBar = onMediaRegistryModule && mediaRegistryHeaderCollapsed;
  const showAdminHubHeaderBar = onAdminHub && adminHubHeaderCollapsed;
  const showDormitoryHeaderBar = onDormitoryModule && dormitoryHeaderCollapsed;
  const mainNavGroups = navGroups.filter((group) => group.id === "basic");
  const mainMenuItems = mainNavGroups[0]?.items ?? [];
  const mobileNavCandidates = mainMenuItems
    .map((item) => {
      const resolvedHref = canonicalDashboardModuleLinkHref(resolveDashboardNavLinkHref(item.href));
      return { href: resolvedHref, label: item.label };
    })
    .filter((item, index, arr) => arr.findIndex((x) => x.href === item.href) === index);
  /** เมนูล่างมือถือ — ครบเมนูหลักสูงสุด 6 รายการ (ลำดับเดียวกับ sidebar) */
  const mobileNavItems = [...mobileNavCandidates].slice(0, 6);
  const activeMobileNavItem = mobileNavCandidates.find((item) => isNavActive(item.href, pathname));
  if (activeMobileNavItem && !mobileNavItems.some((item) => item.href === activeMobileNavItem.href)) {
    if (mobileNavItems.length >= 6) {
      mobileNavItems[mobileNavItems.length - 1] = activeMobileNavItem;
    } else {
      mobileNavItems.push(activeMobileNavItem);
    }
  }
  const moduleMenuGroups = navGroups.filter((group) => group.items.length > 0);
  const activeModuleMenuItem =
    moduleMenuGroups
      .flatMap((group) => group.items)
      .find((item) =>
        isNavActive(canonicalDashboardModuleLinkHref(resolveDashboardNavLinkHref(item.href)), pathname),
      ) ?? null;
  const moduleMenuLabel = activeModuleMenuItem?.label ?? "เมนูหลัก";

  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>({
    basic: true,
    finance: true,
    services: true,
    property: true,
    admin: true,
  });

  const toggleGroup = useCallback((id: DashboardNavGroupId) => {
    setGroupOpen((s) => ({ ...s, [id]: !s[id] }));
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const packageLabel = headerPackageLabel(subscriptionType, subscriptionTier);

  const toggleDesktopSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(DASHBOARD_SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
        }
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    /** ขอสาธิต / บัญชีทดลอง — ซ่อนแถบซ้ายอัตโนมัติ (ยังกดปุ่มเปิดได้อยู่) */
    if (demoSession) {
      setSidebarCollapsed(true);
      setDrawerOpen(false);
      return;
    }
    if (pathname === "/dashboard") {
      setSidebarCollapsed(false);
      try {
        window.localStorage.setItem(DASHBOARD_SIDEBAR_COLLAPSED_KEY, "0");
      } catch {
        /* ignore */
      }
      return;
    }
    /** เข้าโมดูล — ย่อ sidebar หลักไว้ก่อน (ยังกดปุ่มเปิดได้อยู่) */
    if (isModuleWorkspacePath(pathname)) {
      setSidebarCollapsed(true);
      return;
    }
    try {
      setSidebarCollapsed(window.localStorage.getItem(DASHBOARD_SIDEBAR_COLLAPSED_KEY) === "1");
    } catch {
      setSidebarCollapsed(false);
    }
  }, [pathname, demoSession]);

  useEffect(() => {
    if (!onDrinkPosModule) {
      setDrinkPosHeaderCollapsed(false);
      return;
    }
    const sync = () => setDrinkPosHeaderCollapsed(readDrinkPosHeaderCollapsed());
    sync();
    window.addEventListener(DRINK_POS_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DRINK_POS_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onDrinkPosModule]);

  useEffect(() => {
    if (!onBuildingPosModule) {
      setBuildingPosHeaderCollapsed(false);
      return;
    }
    const sync = () => setBuildingPosHeaderCollapsed(readBuildingPosHeaderCollapsed());
    sync();
    window.addEventListener(BUILDING_POS_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(BUILDING_POS_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onBuildingPosModule]);

  useEffect(() => {
    if (!onDormitoryModule) {
      setDormitoryHeaderCollapsed(false);
      return;
    }
    const sync = () => setDormitoryHeaderCollapsed(readDormitoryHeaderCollapsed());
    sync();
    window.addEventListener(DORMITORY_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DORMITORY_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onDormitoryModule]);

  useEffect(() => {
    if (!onFootballTurfModule) {
      setFootballTurfHeaderCollapsed(false);
      return;
    }
    const sync = () => setFootballTurfHeaderCollapsed(readFootballTurfHeaderCollapsed());
    sync();
    window.addEventListener(FOOTBALL_TURF_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FOOTBALL_TURF_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onFootballTurfModule]);

  useEffect(() => {
    if (!onHotelResortModule) {
      setHotelResortHeaderCollapsed(false);
      return;
    }
    const sync = () => setHotelResortHeaderCollapsed(readHotelResortHeaderCollapsed());
    sync();
    window.addEventListener(HOTEL_RESORT_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(HOTEL_RESORT_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onHotelResortModule]);

  useEffect(() => {
    if (!onAttendanceModule) {
      setAttendanceHeaderCollapsed(false);
      return;
    }
    const sync = () => setAttendanceHeaderCollapsed(readAttendanceHeaderCollapsed());
    sync();
    window.addEventListener(ATTENDANCE_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ATTENDANCE_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onAttendanceModule]);

  useEffect(() => {
    if (!onCarWashModule) {
      setCarWashHeaderCollapsed(false);
      return;
    }
    const sync = () => setCarWashHeaderCollapsed(readCarWashHeaderCollapsed());
    sync();
    window.addEventListener(CAR_WASH_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CAR_WASH_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onCarWashModule]);

  useEffect(() => {
    if (!onMassageModule) {
      setMassageHeaderCollapsed(false);
      return;
    }
    const sync = () => setMassageHeaderCollapsed(readMassageHeaderCollapsed());
    sync();
    window.addEventListener(MASSAGE_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(MASSAGE_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onMassageModule]);

  useEffect(() => {
    if (!onBarberModule) {
      setBarberHeaderCollapsed(false);
      return;
    }
    const sync = () => setBarberHeaderCollapsed(readBarberHeaderCollapsed());
    sync();
    window.addEventListener(BARBER_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(BARBER_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onBarberModule]);

  useEffect(() => {
    if (!onVaultModule) {
      setVaultHeaderCollapsed(false);
      return;
    }
    const sync = () => setVaultHeaderCollapsed(readVaultHeaderCollapsed());
    sync();
    window.addEventListener(VAULT_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(VAULT_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onVaultModule]);

  useEffect(() => {
    if (!onAssetModule) {
      setAssetHeaderCollapsed(false);
      return;
    }
    const sync = () => setAssetHeaderCollapsed(readAssetHeaderCollapsed());
    sync();
    window.addEventListener(ASSET_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ASSET_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onAssetModule]);

  useEffect(() => {
    if (!onGeneralStorePosModule) {
      setGeneralStorePosHeaderCollapsed(false);
      return;
    }
    const sync = () => setGeneralStorePosHeaderCollapsed(readGeneralStorePosHeaderCollapsed());
    sync();
    window.addEventListener(GENERAL_STORE_POS_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(GENERAL_STORE_POS_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onGeneralStorePosModule]);

  useEffect(() => {
    if (!onEducareModule) {
      setEducareHeaderCollapsed(false);
      return;
    }
    const sync = () => setEducareHeaderCollapsed(readEducareHeaderCollapsed());
    sync();
    window.addEventListener(EDUCARE_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EDUCARE_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onEducareModule]);

  useEffect(() => {
    if (!onCommunityCoopModule) {
      setCommunityCoopHeaderCollapsed(false);
      return;
    }
    const sync = () => setCommunityCoopHeaderCollapsed(readCommunityCoopHeaderCollapsed());
    sync();
    window.addEventListener(COMMUNITY_COOP_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COMMUNITY_COOP_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onCommunityCoopModule]);

  useEffect(() => {
    if (!onHomeFinanceModule) {
      setHomeFinanceHeaderCollapsed(false);
      return;
    }
    const sync = () => setHomeFinanceHeaderCollapsed(readHomeFinanceHeaderCollapsed());
    sync();
    window.addEventListener(HOME_FINANCE_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(HOME_FINANCE_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onHomeFinanceModule]);

  useEffect(() => {
    if (!onEcommerceStoreModule) {
      setEcommerceStoreHeaderCollapsed(false);
      return;
    }
    const sync = () => setEcommerceStoreHeaderCollapsed(readEcommerceStoreHeaderCollapsed());
    sync();
    window.addEventListener(ECOMMERCE_STORE_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ECOMMERCE_STORE_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onEcommerceStoreModule]);

  useEffect(() => {
    if (!onAppointmentQueueModule) {
      setAppointmentQueueHeaderCollapsed(false);
      return;
    }
    const sync = () => setAppointmentQueueHeaderCollapsed(readAppointmentQueueHeaderCollapsed());
    sync();
    window.addEventListener(APPOINTMENT_QUEUE_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(APPOINTMENT_QUEUE_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onAppointmentQueueModule]);

  useEffect(() => {
    if (!onSchoolBankModule) {
      setSchoolBankHeaderCollapsed(false);
      return;
    }
    const sync = () => setSchoolBankHeaderCollapsed(readSchoolBankHeaderCollapsed());
    sync();
    window.addEventListener(SCHOOL_BANK_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SCHOOL_BANK_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onSchoolBankModule]);

  useEffect(() => {
    if (!onWaitQueueModule) {
      setWaitQueueHeaderCollapsed(false);
      return;
    }
    const sync = () => setWaitQueueHeaderCollapsed(readWaitQueueHeaderCollapsed());
    sync();
    window.addEventListener(WAIT_QUEUE_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WAIT_QUEUE_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onWaitQueueModule]);

  useEffect(() => {
    if (!onActivityLogsModule) {
      setActivityLogsHeaderCollapsed(false);
      return;
    }
    const sync = () => setActivityLogsHeaderCollapsed(readActivityLogsHeaderCollapsed());
    sync();
    window.addEventListener(ACTIVITY_LOGS_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ACTIVITY_LOGS_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onActivityLogsModule]);

  useEffect(() => {
    if (!onPromptLibraryModule) {
      setPromptLibraryHeaderCollapsed(false);
      return;
    }
    const sync = () => setPromptLibraryHeaderCollapsed(readPromptLibraryHeaderCollapsed());
    sync();
    window.addEventListener(PROMPT_LIBRARY_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROMPT_LIBRARY_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onPromptLibraryModule]);

  useEffect(() => {
    if (!onDocTransmissionModule) {
      setDocTransmissionHeaderCollapsed(false);
      return;
    }
    const sync = () => setDocTransmissionHeaderCollapsed(readDocTransmissionHeaderCollapsed());
    sync();
    window.addEventListener(DOC_TRANSMISSION_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DOC_TRANSMISSION_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onDocTransmissionModule]);

  useEffect(() => {
    if (!onLoyaltyStampModule) {
      setLoyaltyStampHeaderCollapsed(false);
      return;
    }
    const sync = () => setLoyaltyStampHeaderCollapsed(readLoyaltyStampHeaderCollapsed());
    sync();
    window.addEventListener(LOYALTY_STAMP_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(LOYALTY_STAMP_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onLoyaltyStampModule]);

  useEffect(() => {
    if (!onVillageModule) {
      setVillageHeaderCollapsed(false);
      return;
    }
    const sync = () => setVillageHeaderCollapsed(readVillageHeaderCollapsed());
    sync();
    window.addEventListener(VILLAGE_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(VILLAGE_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onVillageModule]);

  useEffect(() => {
    if (!onLaundryModule) {
      setLaundryHeaderCollapsed(false);
      return;
    }
    const sync = () => setLaundryHeaderCollapsed(readLaundryHeaderCollapsed());
    sync();
    window.addEventListener(LAUNDRY_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(LAUNDRY_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onLaundryModule]);

  useEffect(() => {
    if (!onParkingModule) {
      setParkingHeaderCollapsed(false);
      return;
    }
    const sync = () => setParkingHeaderCollapsed(readParkingHeaderCollapsed());
    sync();
    window.addEventListener(PARKING_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PARKING_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onParkingModule]);

  useEffect(() => {
    if (!onInventoryModule) {
      setInventoryHeaderCollapsed(false);
      return;
    }
    const sync = () => setInventoryHeaderCollapsed(readInventoryHeaderCollapsed());
    sync();
    window.addEventListener(INVENTORY_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(INVENTORY_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onInventoryModule]);

  useEffect(() => {
    if (!onSmartPoliceModule) {
      setSmartPoliceHeaderCollapsed(false);
      return;
    }
    const sync = () => setSmartPoliceHeaderCollapsed(readSmartPoliceHeaderCollapsed());
    sync();
    window.addEventListener(SMART_POLICE_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SMART_POLICE_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onSmartPoliceModule]);

  useEffect(() => {
    if (!onMediaRegistryModule) {
      setMediaRegistryHeaderCollapsed(false);
      return;
    }
    const sync = () => setMediaRegistryHeaderCollapsed(readMediaRegistryHeaderCollapsed());
    sync();
    window.addEventListener(MEDIA_REGISTRY_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(MEDIA_REGISTRY_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onMediaRegistryModule]);

  useEffect(() => {
    if (!onAdminHub) {
      setAdminHubHeaderCollapsed(false);
      return;
    }
    const sync = () => setAdminHubHeaderCollapsed(readAdminHubHeaderCollapsed());
    sync();
    window.addEventListener(ADMIN_HUB_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ADMIN_HUB_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [onAdminHub]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, closeDrawer]);

  useEffect(() => {
    if (!accountOpen) return;
    function onDoc(e: MouseEvent) {
      if (!accountWrapRef.current?.contains(e.target as Node)) setAccountOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAccountOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  useEffect(() => {
    if (!moduleMenuOpen) return;
    function onDoc(e: MouseEvent) {
      if (!moduleMenuRef.current?.contains(e.target as Node)) setModuleMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setModuleMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [moduleMenuOpen]);

  return (
    <div
      className={cn(
        "flex min-h-[100dvh] flex-col text-[#2e2a58]",
        onPosOrderPage && "lg:h-[100dvh] lg:max-h-[100dvh] lg:overflow-hidden",
        moduleStaffKiosk && "h-[100dvh] max-h-[100dvh] overflow-hidden",
      )}
    >
      {/* แถบบน — แก้ว โค้งมนเทียบเปลือกโมดูล / drawer (rounded-[2.5rem]) */}
      {!moduleStaffKiosk ?
        <header className="sticky top-0 z-30 w-full">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 bottom-0 border-b border-slate-200/60 bg-gradient-to-b from-white/98 via-slate-50/96 to-slate-100/90 shadow-[0_10px_28px_-20px_rgba(51,65,85,0.28)] backdrop-blur-2xl"
          aria-hidden
        />
        <div className="relative z-[1] w-full px-3 pb-1 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4 sm:pb-1.5 sm:pt-3">
        <div className="flex h-12 w-full min-w-0 items-center gap-2 rounded-[1.15rem] border border-white/30 bg-gradient-to-r from-[#4f2f9a]/90 via-[#5b3ac2]/85 to-[#ec4899]/85 px-3 text-white shadow-[0_20px_40px_-15px_rgba(61,29,125,0.7)] backdrop-blur-xl sm:h-14 sm:gap-2.5 sm:px-5 lg:px-6">
          <button
            type="button"
            suppressHydrationWarning
            className={cn(
              "hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/40 bg-white/20 text-white shadow-sm transition-all hover:bg-white/30 active:scale-95 md:inline-flex",
              systemFocusLayout && "!hidden",
              moduleStaffKiosk && "!hidden",
            )}
            aria-pressed={sidebarCollapsed}
            aria-label={sidebarCollapsed ? "แสดงเมนูด้านข้าง" : "ซ่อนเมนูด้านข้าง"}
            title={sidebarCollapsed ? "แสดงเมนูด้านข้าง" : "ซ่อนเมนูด้านข้าง"}
            onClick={toggleDesktopSidebar}
          >
            <span className="sr-only">{sidebarCollapsed ? "แสดงเมนูด้านข้าง" : "ซ่อนเมนูด้านข้าง"}</span>
            <DesktopSidebarToggleGlyph collapsed={sidebarCollapsed} />
          </button>

          <button
            type="button"
            suppressHydrationWarning
            className={cn(
              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/40 bg-white/20 text-white shadow-sm transition-all hover:bg-white/30 active:scale-95 md:hidden",
              systemFocusLayout && "hidden",
            )}
            aria-expanded={drawerOpen}
            aria-controls={menuId}
            onClick={() => setDrawerOpen((o) => !o)}
          >
            <span className="sr-only">เปิดเมนู</span>
            <MenuIcon open={drawerOpen} />
          </button>

          <Link
            href="/dashboard"
            className="shrink-0 transition-transform hover:scale-105 active:scale-95"
            onClick={() => setDrawerOpen(false)}
          >
            <MawellLogo size="sm" />
          </Link>

          {demoSession ? <DemoSessionBanner /> : null}

          {systemFocusLayout ? (
            <div className="relative hidden shrink-0 md:block" ref={moduleMenuRef}>
              <button
                type="button"
                suppressHydrationWarning
                className="inline-flex h-10 max-w-[14rem] items-center gap-2 rounded-lg border border-white/35 bg-white/14 px-3 text-sm font-black text-white shadow-sm transition-all hover:bg-white/22 active:scale-95"
                aria-expanded={moduleMenuOpen}
                aria-haspopup="menu"
                onClick={() => setModuleMenuOpen((open) => !open)}
              >
                <span className="truncate">{moduleMenuLabel}</span>
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {moduleMenuOpen ? (
                <div
                  className="absolute left-0 top-full z-40 mt-2 w-[min(24rem,calc(100vw-3rem))] overflow-hidden rounded-xl border border-slate-200 bg-white/96 p-2 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.38)] backdrop-blur-2xl"
                  role="menu"
                >
                  <div className="max-h-[70vh] overflow-y-auto pr-1">
                    {moduleMenuGroups.map((group) => (
                      <div key={group.id} className="pb-2 last:pb-0">
                        <p className="px-2.5 pb-1 pt-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                          {group.label}
                        </p>
                        <div className="space-y-1">
                          {group.items.map((item) => {
                            const href = canonicalDashboardModuleLinkHref(resolveDashboardNavLinkHref(item.href));
                            const active = isNavActive(href, pathname);
                            return (
                              <Link
                                key={`${group.id}-${href}`}
                                href={href}
                                role="menuitem"
                                className={cn(
                                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
                                  active
                                    ? cn(appDashboardBrandGradientFillClass, "text-white")
                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                                )}
                                onClick={() => setModuleMenuOpen(false)}
                              >
                                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1", active ? "bg-white/10 ring-white/15" : "bg-slate-50 text-slate-500 ring-slate-200")}>
                                  {dashboardNavIconForHref(href)}
                                </span>
                                <span className="truncate">{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* กลาง: เมนูโมดูลเมื่อย่อหัว (เดสก์ท็อป) / โทเคน · มือถือไม่โชว์แท็บใน header */}
          <div className="min-w-0 flex-1 overflow-hidden px-0.5 sm:px-1">
            {showDrinkPosHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <DrinkPosHeaderBarNav
                    pathname={pathname}
                    onExpand={() => writeDrinkPosHeaderCollapsed(false)}
                  />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <DrinkPosHeaderExpandButton onExpand={() => writeDrinkPosHeaderCollapsed(false)} />
                </div>
              </>
            ) : showBuildingPosHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <BuildingPosHeaderBarNav onExpand={() => writeBuildingPosHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <BuildingPosHeaderExpandButton onExpand={() => writeBuildingPosHeaderCollapsed(false)} />
                </div>
              </>
            ) : showDormitoryHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <DormitoryHeaderBarNav onExpand={() => writeDormitoryHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <DormitoryHeaderExpandButton onExpand={() => writeDormitoryHeaderCollapsed(false)} />
                </div>
              </>
            ) : showFootballTurfHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <Suspense fallback={null}>
                    <FootballTurfHeaderBarNav onExpand={() => writeFootballTurfHeaderCollapsed(false)} />
                  </Suspense>
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <FootballTurfHeaderExpandButton onExpand={() => writeFootballTurfHeaderCollapsed(false)} />
                </div>
              </>
            ) : showHotelResortHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <HotelResortHeaderBarNav onExpand={() => writeHotelResortHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <HotelResortHeaderExpandButton onExpand={() => writeHotelResortHeaderCollapsed(false)} />
                </div>
              </>
            ) : showAttendanceHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <AttendanceHeaderBarNav onExpand={() => writeAttendanceHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <AttendanceHeaderExpandButton onExpand={() => writeAttendanceHeaderCollapsed(false)} />
                </div>
              </>
            ) : showCarWashHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <CarWashHeaderBarNav onExpand={() => writeCarWashHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <CarWashHeaderExpandButton onExpand={() => writeCarWashHeaderCollapsed(false)} />
                </div>
              </>
            ) : showMassageHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <MassageHeaderBarNav onExpand={() => writeMassageHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <MassageHeaderExpandButton onExpand={() => writeMassageHeaderCollapsed(false)} />
                </div>
              </>
            ) : showBarberHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <BarberHeaderBarNav onExpand={() => writeBarberHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <BarberHeaderExpandButton onExpand={() => writeBarberHeaderCollapsed(false)} />
                </div>
              </>
            ) : showVaultHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <VaultHeaderBarNav onExpand={() => writeVaultHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <VaultHeaderExpandButton onExpand={() => writeVaultHeaderCollapsed(false)} />
                </div>
              </>
            ) : showAssetHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <AssetHeaderBarNav onExpand={() => writeAssetHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <AssetHeaderExpandButton onExpand={() => writeAssetHeaderCollapsed(false)} />
                </div>
              </>
            ) : showGeneralStorePosHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <GeneralStorePosHeaderBarNav onExpand={() => writeGeneralStorePosHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <GeneralStorePosHeaderExpandButton onExpand={() => writeGeneralStorePosHeaderCollapsed(false)} />
                </div>
              </>
            ) : showEducareHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <EducareHeaderBarNav onExpand={() => writeEducareHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <EducareHeaderExpandButton onExpand={() => writeEducareHeaderCollapsed(false)} />
                </div>
              </>
            ) : showCommunityCoopHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <CommunityCoopHeaderBarNav onExpand={() => writeCommunityCoopHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <CommunityCoopHeaderExpandButton onExpand={() => writeCommunityCoopHeaderCollapsed(false)} />
                </div>
              </>
            ) : showHomeFinanceHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <HomeFinanceHeaderBarNav onExpand={() => writeHomeFinanceHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <HomeFinanceHeaderExpandButton onExpand={() => writeHomeFinanceHeaderCollapsed(false)} />
                </div>
              </>
            ) : showEcommerceStoreHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <EcommerceStoreHeaderBarNav onExpand={() => writeEcommerceStoreHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <EcommerceStoreHeaderExpandButton onExpand={() => writeEcommerceStoreHeaderCollapsed(false)} />
                </div>
              </>
            ) : showAppointmentQueueHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <AppointmentQueueHeaderBarNav onExpand={() => writeAppointmentQueueHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <AppointmentQueueHeaderExpandButton onExpand={() => writeAppointmentQueueHeaderCollapsed(false)} />
                </div>
              </>
            ) : showSchoolBankHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <SchoolBankHeaderBarNav onExpand={() => writeSchoolBankHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <SchoolBankHeaderExpandButton onExpand={() => writeSchoolBankHeaderCollapsed(false)} />
                </div>
              </>
            ) : showWaitQueueHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <WaitQueueHeaderBarNav onExpand={() => writeWaitQueueHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <WaitQueueHeaderExpandButton onExpand={() => writeWaitQueueHeaderCollapsed(false)} />
                </div>
              </>
            ) : showActivityLogsHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <ActivityLogsHeaderBarNav onExpand={() => writeActivityLogsHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <ActivityLogsHeaderExpandButton onExpand={() => writeActivityLogsHeaderCollapsed(false)} />
                </div>
              </>
            ) : showPromptLibraryHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <PromptLibraryHeaderBarNav onExpand={() => writePromptLibraryHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <PromptLibraryHeaderExpandButton onExpand={() => writePromptLibraryHeaderCollapsed(false)} />
                </div>
              </>
            ) : showDocTransmissionHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <DocTransmissionHeaderBarNav onExpand={() => writeDocTransmissionHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <DocTransmissionHeaderExpandButton onExpand={() => writeDocTransmissionHeaderCollapsed(false)} />
                </div>
              </>
            ) : showLoyaltyStampHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <LoyaltyStampHeaderBarNav onExpand={() => writeLoyaltyStampHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <LoyaltyStampHeaderExpandButton onExpand={() => writeLoyaltyStampHeaderCollapsed(false)} />
                </div>
              </>
            ) : showVillageHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <VillageHeaderBarNav onExpand={() => writeVillageHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <VillageHeaderExpandButton onExpand={() => writeVillageHeaderCollapsed(false)} />
                </div>
              </>
            ) : showLaundryHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <LaundryHeaderBarNav onExpand={() => writeLaundryHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <LaundryHeaderExpandButton onExpand={() => writeLaundryHeaderCollapsed(false)} />
                </div>
              </>
            ) : showParkingHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <ParkingHeaderBarNav onExpand={() => writeParkingHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <ParkingHeaderExpandButton onExpand={() => writeParkingHeaderCollapsed(false)} />
                </div>
              </>
            ) : showInventoryHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <InventoryHeaderBarNav onExpand={() => writeInventoryHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <InventoryHeaderExpandButton onExpand={() => writeInventoryHeaderCollapsed(false)} />
                </div>
              </>
            ) : showSmartPoliceHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <SmartPoliceHeaderBarNav onExpand={() => writeSmartPoliceHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <SmartPoliceHeaderExpandButton onExpand={() => writeSmartPoliceHeaderCollapsed(false)} />
                </div>
              </>
            ) : showMediaRegistryHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <MediaRegistryHeaderBarNav onExpand={() => writeMediaRegistryHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <MediaRegistryHeaderExpandButton onExpand={() => writeMediaRegistryHeaderCollapsed(false)} />
                </div>
              </>
            ) : showAdminHubHeaderBar ? (
              <>
                <div className="hidden min-w-0 lg:block">
                  <AdminHubHeaderBarNav onExpand={() => writeAdminHubHeaderCollapsed(false)} />
                </div>
                <div className="flex min-w-0 items-center gap-2 lg:hidden">
                  <p
                    className="min-w-0 flex-1 truncate text-left text-[11px] leading-snug text-white/95"
                    title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
                  >
                    <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                    <span className="font-medium text-white/70">โทเคน</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-bold text-white">{packageLabel}</span>
                    <span className="mx-1.5 text-white/30" aria-hidden>
                      |
                    </span>
                    <span className="font-medium text-white/90">{displayName}</span>
                  </p>
                  <AdminHubHeaderExpandButton onExpand={() => writeAdminHubHeaderCollapsed(false)} />
                </div>
              </>
            ) : (
              <p
                className="truncate text-left text-[11px] leading-snug text-white/95 sm:text-[13.5px] sm:leading-normal md:text-right"
                title={`${tokens} โทเคน · ${packageLabel} · ${displayName}`}
              >
                <span className="tabular-nums font-black">{tokens.toLocaleString()}</span>{" "}
                <span className="font-medium text-white/70">โทเคน</span>
                <span className="mx-1.5 text-white/30" aria-hidden>
                  |
                </span>
                <span className="font-bold text-white">{packageLabel}</span>
                <span className="mx-1.5 text-white/30" aria-hidden>
                  |
                </span>
                <span className="font-medium text-white/90">{displayName}</span>
              </p>
            )}
          </div>

          {/* ขวา: ไม่ wrap — โปรไฟล์ + logout เรียงแนวนอนเสมอ */}
          <div className="flex shrink-0 flex-nowrap items-center gap-1.5 border-l border-white/20 pl-2.5 sm:gap-2 sm:pl-3.5">
            <div className="hidden shrink-0 md:block">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={36}
                  height={32}
                  className="h-8 w-8 rounded-full border-2 border-white/60 object-cover shadow-md"
                  unoptimized
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/40 bg-white/20 text-xs font-black text-white shadow-md">
                  {username.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div className="relative shrink-0 md:hidden" ref={accountWrapRef}>
              <button
                type="button"
                suppressHydrationWarning
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/40 bg-white/20 p-1 text-white shadow-sm transition-all hover:bg-white/30"
                aria-expanded={accountOpen}
                aria-label="เมนูบัญชี"
                onClick={() => setAccountOpen((o) => !o)}
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 shrink-0 rounded-full border border-white/60 object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/30 text-[10px] font-black text-white">
                    {username.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </button>
              {accountOpen ? (
                <div
                  className="absolute right-0 z-40 mt-2 w-48 rounded-2xl border border-white/20 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl"
                  role="menu"
                >
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#1e1b4b] transition-colors hover:bg-[#5b61ff]/10 hover:text-[#5b61ff]"
                    role="menuitem"
                    onClick={() => setAccountOpen(false)}
                  >
                    <span className="text-lg">👤</span>
                    โปรไฟล์ของคุณ
                  </Link>
                </div>
              ) : null}
            </div>

            <LogoutIconButton className="h-9 w-9 sm:h-10 sm:w-10 transition-all hover:rotate-12" />
          </div>
        </div>
        </div>
      </header>
      : null}

      <div
        className={cn(
          "flex min-h-0 flex-1 gap-0 pb-[max(5.75rem,calc(5.75rem+env(safe-area-inset-bottom,0px)))] pt-0 md:gap-3 md:pb-4 lg:gap-4",
          /** ขอบนอกเดียวกับ wrapper แถบ header ม่วง (px-3 sm:px-4) — ห้าม px-2 แยกโมดูล */
          "px-3 sm:px-4",
          moduleStaffKiosk && "!gap-0 !px-0 !pt-0 !pb-0 sm:!px-0 sm:!pb-0",
        )}
      >
        {/* Sidebar — แก้ว โค้งมนเทียบแถบบน / drawer */}
        <aside
          className={cn(
            "hidden w-[264px] shrink-0 flex-col overflow-hidden rounded-[1.15rem] border border-[#e8e6fc]/80 bg-white/78 text-[#2e2a58] shadow-[0_20px_48px_-30px_rgba(30,27,75,0.18)] ring-1 ring-white/60 backdrop-blur-2xl md:flex md:my-3 lg:my-4",
            sidebarCollapsed && "md:!hidden",
            (systemFocusLayout || moduleStaffKiosk) && "md:hidden",
            moduleStaffKiosk && "!hidden !my-0",
          )}
          aria-label="เมนูหลัก"
        >
          <div className="p-3">
            <div className={cn("h-1.5 w-full rounded-full", appDashboardBrandGradientBarClass)} aria-hidden />
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-[11px] font-black tracking-tight text-[#2e2a58]">เมนูหลัก</p>
              <span className="inline-flex h-6 items-center rounded-lg border border-[#0000BF]/15 bg-[#0000BF]/10 px-2 text-[11px] font-black text-[#2e2a58]">
                {mainMenuItems.length}
              </span>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-3" aria-label="เมนูหลัก">
            {mainMenuItems.map((item) => (
              <SidebarNavLink key={item.href} href={item.href} pathname={pathname} label={item.label} />
            ))}
          </nav>
          <div className="border-t border-slate-200/70 bg-white/70 p-3">
            <p className="truncate text-xs text-slate-500" title={username}>
              {username}
            </p>
            <LogoutButton className="mt-2 w-full justify-center text-sm" />
          </div>
        </aside>

        <div className="flex min-w-0 min-h-0 flex-1 flex-col">
          {/* Drawer มือถือ — เริ่มใต้แถบ header */}
          {drawerOpen && !systemFocusLayout && !moduleStaffKiosk ?
            <>
              <button
                type="button"
                suppressHydrationWarning
                className="fixed inset-x-0 bottom-0 top-[4.25rem] z-[48] bg-slate-900/25 backdrop-blur-[2px] md:hidden"
                aria-label="ปิดเมนู"
                onClick={closeDrawer}
              />
              <div
                id={menuId}
                className="fixed bottom-3 left-3 top-[4.25rem] z-50 flex w-[min(100vw-2.5rem,17.5rem)] flex-col overflow-hidden rounded-[1.15rem] border border-white/15 bg-gradient-to-b from-[#4f2f9a] via-[#5b3ac2] to-[#ec4899] text-white shadow-2xl md:hidden"
              >
                <div className="flex h-12 items-center justify-between border-b border-white/25 px-3">
                  <MawellLogo size="md" />
                  <button
                    type="button"
                    suppressHydrationWarning
                    className="rounded-xl p-2 text-white hover:bg-white/20"
                    onClick={closeDrawer}
                    aria-label="ปิดเมนู"
                  >
                    <CloseIcon />
                  </button>
                </div>
                <nav className="flex flex-1 flex-col gap-3 overflow-y-auto p-2.5" aria-label="เมนู">
                  {mainNavGroups.map((group) => (
                    <NavCollapsibleGroup
                      key={group.id}
                      group={group}
                      open={groupOpen[group.id] ?? true}
                      onToggle={() => toggleGroup(group.id)}
                      pathname={pathname}
                      variant="drawer"
                      onDrawerNavigate={closeDrawer}
                    />
                  ))}
                </nav>
                <div className="border-t border-white/25 bg-black/10 p-3">
                  <p className="mb-2 truncate text-xs text-white/80">{username}</p>
                  <LogoutButton className="w-full justify-center" />
                </div>
              </div>
            </>
          : null}

          <main
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden rounded-[1.15rem]",
              onPosOrderPage && "lg:overflow-hidden",
              systemFocusLayout && "md:rounded-none",
              moduleStaffKiosk && "!rounded-none !overflow-hidden",
            )}
          >
            {children}
          </main>
        </div>
      </div>
      {!hideMainMobileBottomNav ? (
        <MobileBottomNav pathname={pathname} items={mobileNavItems} />
      ) : null}
    </div>
  );
}

function MobileBottomNav({
  pathname,
  items,
}: {
  pathname: string;
  items: { href: string; label: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden" aria-label="เมนูด้านล่าง">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-[36rem] px-3 pb-[max(calc(env(safe-area-inset-bottom,0px)+0.55rem),0.85rem)] pt-2">
        <div className="flex items-stretch justify-between gap-0.5 rounded-[1.35rem] border border-slate-200/70 bg-white/92 p-1.5 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
          {items.map((item) => (
            <MobileBottomNavLink key={item.href} href={item.href} label={item.label} pathname={pathname} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function MobileBottomNavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const active = isNavActive(href, pathname);
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-[3.35rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-center transition sm:px-1",
        active ? "bg-[#0000BF]/10 text-[#2e2a58]" : "text-slate-500 hover:bg-slate-100",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 transition",
          active
            ? cn(appDashboardBrandGradientFillClass, "text-white ring-0 shadow-[0_10px_18px_-14px_rgba(91,97,255,0.9)]")
            : "bg-white text-slate-500 ring-slate-200",
        )}
        aria-hidden
      >
        {dashboardNavIconForHref(href)}
      </span>
      <span className="max-w-full px-0.5 text-[9px] font-black leading-tight tracking-tight line-clamp-2">
        {label}
      </span>
    </Link>
  );
}

/** เดสก์ท็อป: สลับซ่อน sidebar — ลูกศรชี้ซ้ายเมื่อเมนูเปิดอยู่ (กดเพื่อซ่อน), ชี้ขวาเมื่อซ่อนแล้ว (กดเพื่อแสดง) */
function DesktopSidebarToggleGlyph({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-current" aria-hidden>
      {collapsed ? (
        <path d="M10 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M14 7l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-current" aria-hidden>
      {open ? (
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <>
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-current" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
