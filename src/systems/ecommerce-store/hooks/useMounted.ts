"use client";

import { useEffect, useState } from "react";

/** หลีกเลี่ยง hydration mismatch จาก browser extension (เช่น fdprocessedid บนปุ่ม/input) */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
