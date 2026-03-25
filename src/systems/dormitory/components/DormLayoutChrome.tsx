"use client";

import { usePathname } from "next/navigation";
import { DormModuleHeader } from "./DormModuleHeader";

export function DormLayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  return (
    <>
      <DormModuleHeader pathname={pathname} />
      {children}
    </>
  );
}
