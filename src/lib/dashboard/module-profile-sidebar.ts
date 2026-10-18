/**
 * เมนูโมดูลในป๊อปอัปรูปโปรไฟล์ (เดสก์ท็อป) — แทน sidebar ซ้าย
 * เริ่มต้นเฉพาะ Smart Police เป็นโมเดลใหม่ ขยายโมดูลอื่นทีหลัง
 */
import {
  SMART_POLICE_MODULE_DISPLAY_NAME,
  isSmartPoliceModulePath,
  smartPoliceMainKeyFromPathname,
  smartPoliceMainMenuItems,
} from "@/systems/smart-police/smart-police-nav";

export type ModuleProfileSidebarItem = {
  key: string;
  href: string;
  label: string;
};

export type ModuleProfileSidebarConfig = {
  moduleId: string;
  moduleTitle: string;
  items: ModuleProfileSidebarItem[];
  /** คีย์รายการที่ active ตาม pathname */
  activeKey: string;
};

/** โมดูลที่ใช้เมนูในป๊อปอัปโปรไฟล์แทน sidebar ซ้าย */
export function getModuleProfileSidebar(pathname: string): ModuleProfileSidebarConfig | null {
  if (!isSmartPoliceModulePath(pathname)) return null;

  const activeKey = smartPoliceMainKeyFromPathname(pathname);
  return {
    moduleId: "smart-police",
    moduleTitle: SMART_POLICE_MODULE_DISPLAY_NAME,
    items: smartPoliceMainMenuItems.map((item) => ({
      key: item.key,
      href: item.href,
      label: item.label,
    })),
    activeKey,
  };
}

export function usesProfileModuleSidebar(pathname: string): boolean {
  return getModuleProfileSidebar(pathname) != null;
}
