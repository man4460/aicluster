"use client";

import { usePathname } from "next/navigation";
import { BarberModuleHeader } from "./BarberModuleHeader";

export function BarberLayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  return (
    <>
      <BarberModuleHeader pathname={pathname} />
      {children}
    </>
  );
}
