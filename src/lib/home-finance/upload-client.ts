"use client";

import {
  prepareUploadFile,
  suggestUploadDisplayName,
} from "@/components/app-templates";

/** โยนเมื่ออัปโหลดถูกยกเลิกเพราะหมดเวลา (ไฟล์ใหญ่/เน็ตช้า) */
export const HOME_FINANCE_UPLOAD_TIMEOUT = "HOME_FINANCE_UPLOAD_TIMEOUT";

const HOME_FINANCE_UPLOAD_MS = 120_000;

export type HomeFinanceUploadKind = "slip" | "attach" | "cover";

export type HomeFinanceUploadResult = {
  imageUrl: string;
  displayName: string;
  storedFileName: string;
};

/**
 * อัปโหลดไฟล์รายรับ–รายจ่ายบ้าน — ย่อรูปด้วย prepareUploadFile ก่อนส่ง
 * ชื่อบนดิสก์มาตรฐาน module-user-kind ผ่าน saveModuleUpload
 */
export async function uploadHomeFinanceFile(
  file: File,
  options?: {
    kind?: HomeFinanceUploadKind;
    displayName?: string | null;
  },
): Promise<HomeFinanceUploadResult> {
  const kind = options?.kind ?? "attach";
  const accept = kind === "attach" ? "image-or-pdf" : "image";

  const toSend = await prepareUploadFile(file, {
    accept,
    maxPdfBytes: 5 * 1024 * 1024,
  });

  const fd = new FormData();
  fd.set("file", toSend);
  fd.set("kind", kind);

  const displayName =
    options?.displayName !== undefined
      ? (options.displayName ?? "")
      : suggestUploadDisplayName(file.name);
  if (displayName) fd.set("displayName", displayName);

  const ctrl = new AbortController();
  const tid = window.setTimeout(() => ctrl.abort(), HOME_FINANCE_UPLOAD_MS);
  try {
    const res = await fetch("/api/home-finance/upload", {
      method: "POST",
      body: fd,
      credentials: "include",
      signal: ctrl.signal,
    });
    const j = (await res.json().catch(() => ({}))) as {
      imageUrl?: string;
      error?: string;
      displayName?: string;
      storedFileName?: string;
    };
    if (!res.ok) {
      throw new Error(typeof j.error === "string" && j.error.trim() ? j.error.trim() : "อัปโหลดไม่สำเร็จ");
    }
    if (!j.imageUrl?.trim()) {
      throw new Error("อัปโหลดไม่สำเร็จ — ไม่ได้รับ URL จากเซิร์ฟเวอร์");
    }
    return {
      imageUrl: j.imageUrl.trim(),
      displayName: j.displayName ?? displayName ?? "",
      storedFileName: j.storedFileName ?? "",
    };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error(HOME_FINANCE_UPLOAD_TIMEOUT);
    }
    throw e;
  } finally {
    window.clearTimeout(tid);
  }
}

/** คืน URL อย่างเดียว — ใช้กับฟอร์มที่เก็บแค่ path */
export async function uploadHomeFinanceFileUrl(
  file: File,
  options?: Parameters<typeof uploadHomeFinanceFile>[1],
): Promise<string> {
  const r = await uploadHomeFinanceFile(file, options);
  return r.imageUrl;
}

export function homeFinanceUploadErrorMessage(err: unknown, fallback = "อัปโหลดไม่สำเร็จ"): string {
  if (err instanceof Error) {
    if (err.message === HOME_FINANCE_UPLOAD_TIMEOUT) {
      return "อัปโหลดหมดเวลา — ลองรูปเล็กลงหรือเน็ตที่เร็วขึ้น";
    }
    return err.message.trim() || fallback;
  }
  return fallback;
}
