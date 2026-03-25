"use client";

import { usePathname } from "next/navigation";
import { AttendanceModuleHeader } from "./AttendanceModuleHeader";

export function AttendanceLayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  return (
    <>
      <AttendanceModuleHeader pathname={pathname} />
      {children}
    </>
  );
}
