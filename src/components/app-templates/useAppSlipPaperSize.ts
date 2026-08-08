"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_APP_SLIP_PAPER_SIZE,
  parseAppSlipPaperSize,
  type AppSlipPaperSize,
} from "@/components/app-templates/slip-print";

/**
 * โหลดขนาดกระดาษเริ่มต้นจากโปรไฟล์ส่วนกลาง (`GET /api/profile`)
 * ใช้ก่อนพิมพ์ใบเสร็จกลาง — อย่า hardcode SLIP_80 ในโมดูล
 */
export async function fetchAppDefaultSlipPaperSize(opts?: {
  credentials?: RequestCredentials;
}): Promise<AppSlipPaperSize> {
  try {
    const res = await fetch("/api/profile", {
      credentials: opts?.credentials ?? "include",
      cache: "no-store",
    });
    if (!res.ok) return DEFAULT_APP_SLIP_PAPER_SIZE;
    const j = (await res.json().catch(() => ({}))) as {
      profile?: { defaultPaperSize?: string | null };
    };
    return parseAppSlipPaperSize(j.profile?.defaultPaperSize);
  } catch {
    return DEFAULT_APP_SLIP_PAPER_SIZE;
  }
}

/** บันทึกขนาดกระดาษเริ่มต้นไปโปรไฟล์ส่วนกลาง (`PATCH /api/profile`) */
export async function saveAppDefaultSlipPaperSize(
  paper: AppSlipPaperSize,
  opts?: { credentials?: RequestCredentials },
): Promise<AppSlipPaperSize> {
  const size = parseAppSlipPaperSize(paper);
  const res = await fetch("/api/profile", {
    method: "PATCH",
    credentials: opts?.credentials ?? "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ defaultPaperSize: size }),
  });
  const j = (await res.json().catch(() => ({}))) as {
    profile?: { defaultPaperSize?: string | null };
    error?: string;
  };
  if (!res.ok) {
    throw new Error(typeof j.error === "string" ? j.error : "บันทึกขนาดสลิปไม่สำเร็จ");
  }
  return parseAppSlipPaperSize(j.profile?.defaultPaperSize ?? size);
}

/** Hook — ขนาดกระดาษจากโปรไฟล์ (หรือค่าที่ส่งเข้ามา เช่น จาก staff bootstrap) */
export function useAppSlipPaperSize(initial?: AppSlipPaperSize | string | null) {
  const [paper, setPaper] = useState<AppSlipPaperSize>(() =>
    initial != null && initial !== "" ? parseAppSlipPaperSize(initial) : DEFAULT_APP_SLIP_PAPER_SIZE,
  );
  const [loaded, setLoaded] = useState(initial != null && initial !== "");

  useEffect(() => {
    if (initial != null && initial !== "") {
      setPaper(parseAppSlipPaperSize(initial));
      setLoaded(true);
      return;
    }
    let cancelled = false;
    void fetchAppDefaultSlipPaperSize().then((size) => {
      if (cancelled) return;
      setPaper(size);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [initial]);

  const reload = useCallback(async () => {
    const size = await fetchAppDefaultSlipPaperSize();
    setPaper(size);
    setLoaded(true);
    return size;
  }, []);

  return { paper, setPaper, loaded, reload };
}
