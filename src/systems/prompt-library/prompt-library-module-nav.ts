export const PROMPT_LIBRARY_BASE = "/dashboard/prompt-library";
export const PROMPT_LIBRARY_CATEGORIES_HREF = `${PROMPT_LIBRARY_BASE}/categories`;
export const PROMPT_LIBRARY_MODULE_DISPLAY_NAME = "คลังคำสั่ง AI";

export const PROMPT_LIBRARY_HEADER_COLLAPSE_KEY = "mawell-prompt-library-module-header-collapsed";
export const PROMPT_LIBRARY_HEADER_COLLAPSE_EVENT = "mawell-prompt-library-header-collapse";

export type PromptLibraryNavKey = "library" | "categories";

export type PromptLibraryNavItem = {
  key: PromptLibraryNavKey;
  href: string;
  label: string;
  shortLabel: string;
};

export const PROMPT_LIBRARY_NAV_ITEMS: PromptLibraryNavItem[] = [
  { key: "library", href: PROMPT_LIBRARY_BASE, label: "คลังคำสั่ง", shortLabel: "คลัง" },
  { key: "categories", href: PROMPT_LIBRARY_CATEGORIES_HREF, label: "หมวดหมู่", shortLabel: "หมวด" },
];

export function isPromptLibraryModulePath(pathname: string): boolean {
  return pathname === PROMPT_LIBRARY_BASE || pathname.startsWith(`${PROMPT_LIBRARY_BASE}/`);
}

export function promptLibraryPathFlags(pathname: string) {
  const pathNorm = pathname.replace(/\/+$/, "") || pathname;
  const onModule = isPromptLibraryModulePath(pathname);
  const isCategories =
    pathNorm === PROMPT_LIBRARY_CATEGORIES_HREF ||
    pathNorm.endsWith("/categories") ||
    pathNorm.startsWith(`${PROMPT_LIBRARY_CATEGORIES_HREF}/`);
  const isLibrary = onModule && !isCategories;
  return { onModule, isLibrary, isCategories };
}

export function isPromptLibraryNavItemActive(pathname: string, key: PromptLibraryNavKey): boolean {
  const f = promptLibraryPathFlags(pathname);
  switch (key) {
    case "library":
      return f.isLibrary;
    case "categories":
      return f.isCategories;
    default:
      return false;
  }
}

export function readPromptLibraryHeaderCollapsed(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(PROMPT_LIBRARY_HEADER_COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writePromptLibraryHeaderCollapsed(collapsed: boolean): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PROMPT_LIBRARY_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
    window.dispatchEvent(new Event(PROMPT_LIBRARY_HEADER_COLLAPSE_EVENT));
  } catch {
    /* ignore */
  }
}
