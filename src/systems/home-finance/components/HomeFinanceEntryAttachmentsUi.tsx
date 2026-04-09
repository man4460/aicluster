"use client";

import { useId, type ChangeEvent } from "react";
import { isHomeFinancePdfUrl } from "@/lib/home-finance/attachments";
import { cn } from "@/lib/cn";

/** แสดงในฟอร์มทันทีหลังเลือกไฟล์ — อัปโหลดเสร็จแล้วแทนที่ด้วย URL จากเซิร์ฟเวอร์ */
export type HomeFinancePendingUpload = {
  id: string;
  objectUrl: string;
  name: string;
  isPdf: boolean;
};

export function revokeHomeFinancePendingObjectUrls(rows: readonly HomeFinancePendingUpload[]) {
  for (const r of rows) {
    try {
      URL.revokeObjectURL(r.objectUrl);
    } catch {
      /* ignore */
    }
  }
}

function SlipUploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function fileBasename(url: string): string {
  try {
    const seg = url.split("/").pop() || "เอกสาร";
    return decodeURIComponent(seg.split("?")[0] || seg);
  } catch {
    return "เอกสาร";
  }
}

/** ใช้ URL เต็มสำหรับ img/a บางเคส (โฟลเดอร์ย่อย / แท็บใหม่) */
function resolvePublicUrl(u: string): string {
  if (typeof window === "undefined") return u;
  const t = u.trim();
  if (t.startsWith("/")) return `${window.location.origin}${t}`;
  return t;
}

function pickSingleFile(
  e: ChangeEvent<HTMLInputElement>,
  onUploadFiles: (files: FileList | File[]) => Promise<void>,
) {
  const f = e.target.files?.[0];
  e.target.value = "";
  if (f) void onUploadFiles([f]);
}

export function HomeFinanceFormAttachmentsBlock({
  urls,
  pendingUploads = [],
  onChange,
  inputId,
  accept,
  hint,
  onUploadFiles,
  onOpenUrl,
  onOpenLocalPreview,
  uploadProgress,
  emptyStateVariant = "default",
  attachUiMode = "multi",
}: {
  urls: string[];
  /** ตัวอย่างจากเครื่อง — แสดงในรายการทันที ก่อนอัปโหลดเสร็จ */
  pendingUploads?: HomeFinancePendingUpload[];
  onChange: (next: string[]) => void;
  inputId: string;
  accept: string;
  hint: string;
  onUploadFiles: (files: FileList | File[]) => Promise<void>;
  onOpenUrl: (url: string) => void;
  /** เปิดดู blob รูป/PDF ระหว่างรออัปโหลด */
  onOpenLocalPreview?: (objectUrl: string, isPdf: boolean) => void;
  /** แบบ building-pos: แสดงสถานะระหว่างส่งหลายไฟล์ */
  uploadProgress?: { current: number; total: number } | null;
  /** vehicle = คำอธิบายขั้นตอนชัดเจนเมื่อยังไม่มีไฟล์ */
  emptyStateVariant?: "default" | "vehicle";
  /**
   * multi = เลือกหลายไฟล์ในครั้งเดียว (ฟอร์มรายการรายรับ–รายจ่าย)
   * vehicle-single = โปรไฟล์รถ — ทีละ 1 ไฟล์ กดปุ่มเดิมซ้ำเพื่อเพิ่ม
   */
  attachUiMode?: "multi" | "vehicle-single";
}) {
  const vehiclePrimaryInputId = useId();
  const uploading = uploadProgress != null && uploadProgress.total > 0;
  const hasAnyFiles = urls.length > 0 || pendingUploads.length > 0;
  const showEmptyVehicleGuide =
    emptyStateVariant === "vehicle" && !hasAnyFiles && !uploading;
  const vehicleMode = attachUiMode === "vehicle-single";
  const labelBtnClass = uploading
    ? "inline-flex cursor-not-allowed items-center gap-2 rounded-xl border-2 border-[#0000BF]/30 bg-[#f4f4ff] px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] opacity-60 shadow-sm transition"
    : "inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-[#0000BF]/30 bg-[#f4f4ff] px-3 py-2.5 text-sm font-semibold text-[#1e1b4b] shadow-sm transition hover:bg-[#ecebff]";

  return (
    <div className="space-y-3" aria-busy={uploading || undefined}>
      {uploading ? (
        <p role="status" className="rounded-lg border border-[#66638c]/30 bg-slate-50 px-3 py-2 text-xs font-medium text-[#4a5568]">
          กำลังอัปโหลดไฟล์ที่ {uploadProgress.current} จาก {uploadProgress.total}… แถวสีเหลืองด้านล่างคือตัวอย่างจากเครื่อง —
          เมื่อส่งสำเร็จจะย้ายเป็นรายการปกติ (เชื่อมกับเซิร์ฟเวอร์)
        </p>
      ) : null}
      {showEmptyVehicleGuide ? (
        <div className="rounded-xl border-2 border-dashed border-[#0000BF]/35 bg-gradient-to-br from-[#f4f4ff] to-white px-4 py-3 shadow-inner">
          <p className="text-sm font-semibold text-[#1e1b4b]">ยังไม่มีไฟล์แนบ — ทำตามนี้</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-slate-700">
            {vehicleMode ? (
              <>
                <li>กด「แนบเอกสาร (ทีละ 1 ไฟล์)」แล้วเลือกไฟล์ — ตกลงแล้วจะเห็นรายการด้านล่าง</li>
                <li>ต้องการเพิ่ม ให้กดปุ่มเดิมอีกครั้ง (ทีละ 1 ไฟล์)</li>
                <li>รอแถวสีเหลืองหาย (อัปโหลดครบ) แล้วค่อยกดบันทึกรถ</li>
              </>
            ) : (
              <>
                <li>กดปุ่มสีม่วง「เลือกไฟล์ (หลายไฟล์ได้)」ด้านล่างนี้</li>
                <li>ในหน้าต่างระบบ เลือกได้หลายไฟล์ (กด Ctrl หรือ ⌘ ค้างแล้วคลิกทีละไฟล์)</li>
                <li>หลังเลือกไฟล์ จะเห็นตัวอย่างในรายการทันที แล้วระบบอัปโหลดให้ — PDF กด「เปิด PDF」หรือ「ดู」เพื่อรีวิว</li>
                <li>เสร็จแล้วมีปุ่ม เปิดแท็บ · ดาวน์โหลด · ลบ — กด「เพิ่มรถ」หรือ「บันทึก」เพื่อเก็บลงระบบ</li>
              </>
            )}
          </ol>
        </div>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        {vehicleMode ? (
          <>
            <input
              id={vehiclePrimaryInputId}
              type="file"
              accept={accept}
              className="sr-only"
              disabled={uploading}
              onChange={(e) => pickSingleFile(e, onUploadFiles)}
            />
            <label htmlFor={vehiclePrimaryInputId} className={labelBtnClass}>
              <SlipUploadIcon className="shrink-0 text-[#0000BF]" />
              <span className="flex flex-col items-start leading-tight">
                <span>แนบเอกสาร (ทีละ 1 ไฟล์)</span>
                <span className="mt-0.5 text-[10px] font-normal text-slate-600">
                  เลือกครั้งละหนึ่งไฟล์ — กดซ้ำเพื่อเพิ่มหลายไฟล์
                </span>
              </span>
            </label>
          </>
        ) : (
          <>
            <input
              id={inputId}
              type="file"
              accept={accept}
              multiple
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const list = e.target.files;
                e.target.value = "";
                if (list?.length) void onUploadFiles(list);
              }}
            />
            <label htmlFor={inputId} className={labelBtnClass}>
              <SlipUploadIcon className="shrink-0 text-[#0000BF]" />
              <span className="flex flex-col items-start leading-tight">
                <span>
                  {urls.length || pendingUploads.length ? "เพิ่มไฟล์อีก" : "เลือกไฟล์ (หลายไฟล์ได้)"}
                </span>
                <span className="mt-0.5 text-[10px] font-normal text-slate-600">กดแล้วเลือกหลายรายการในกล่อง — Ctrl/⌘ ค้าง</span>
              </span>
            </label>
          </>
        )}
        <span className="max-w-md text-xs text-slate-500">{hint}</span>
      </div>
      {hasAnyFiles ? (
        <>
          <p className="rounded-lg border border-amber-200/90 bg-amber-50/90 px-3 py-2 text-xs font-medium leading-snug text-amber-950">
            {pendingUploads.length > 0 ? (
              <>
                กำลังแนบ <span className="font-bold">{pendingUploads.length}</span> ไฟล์ (ตัวอย่างจากเครื่อง) · แนบแล้วบนเซิร์ฟเวอร์{" "}
                <span className="font-bold">{urls.length}</span> ไฟล์ — รออัปโหลดครบก่อนกดบันทึก
              </>
            ) : (
              <>
                แนบแล้ว <span className="font-bold">{urls.length}</span> ไฟล์ — ใช้ปุ่มด้านล่าง: เปิด PDF/ดู · เปิดแท็บ · ดาวน์โหลด · ลบ (ก่อนกดบันทึก)
              </>
            )}
          </p>
          <ul className="flex flex-wrap gap-2" aria-label="ไฟล์แนบ">
            {pendingUploads.map((row) => (
              <li
                key={row.id}
                className="flex max-w-full items-center gap-1.5 rounded-lg border border-amber-300/90 bg-amber-50/80 px-1.5 py-1 shadow-sm ring-1 ring-amber-200/60"
              >
                {row.isPdf ? (
                  <button
                    type="button"
                    disabled={!onOpenLocalPreview}
                    onClick={() => onOpenLocalPreview?.(row.objectUrl, true)}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-red-50 text-[10px] font-bold text-red-800 ring-1 ring-red-200/80 disabled:opacity-50"
                    title="เปิด PDF (ตัวอย่าง)"
                  >
                    PDF
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!onOpenLocalPreview}
                    onClick={() => onOpenLocalPreview?.(row.objectUrl, false)}
                    className="h-12 w-12 shrink-0 overflow-hidden rounded-md ring-1 ring-amber-300 disabled:opacity-50"
                    title="ดูตัวอย่าง"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={row.objectUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-amber-950" title={row.name}>
                    {row.name}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-amber-800">กำลังอัปโหลด…</p>
                </div>
              </li>
            ))}
            {urls.map((url, i) => {
              const abs = resolvePublicUrl(url);
              return (
                <li
                  key={`${url}-${i}`}
                  className="flex max-w-full items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-1.5 py-1 shadow-sm"
                >
                  {isHomeFinancePdfUrl(url) ? (
                    <a
                      href={abs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-red-50 text-[10px] font-bold text-red-800 ring-1 ring-red-200/80"
                      title="เปิด PDF"
                    >
                      PDF
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenUrl(url)}
                      className="h-12 w-12 shrink-0 overflow-hidden rounded-md ring-1 ring-slate-200"
                      title="ดูขยาย"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={abs} alt="" className="h-full w-full object-cover" />
                    </button>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-slate-800" title={fileBasename(url)}>
                      {fileBasename(url)}
                    </p>
                    <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0">
                      <button
                        type="button"
                        className="text-[10px] font-semibold text-[#0000BF] hover:underline"
                        onClick={() => onOpenUrl(url)}
                      >
                        {isHomeFinancePdfUrl(url) ? "เปิด PDF" : "ดู"}
                      </button>
                      <a
                        href={abs}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-semibold text-[#0000BF]/90 hover:underline"
                      >
                        เปิดแท็บ
                      </a>
                      <a
                        href={abs}
                        download={fileBasename(url)}
                        className="text-[10px] font-semibold text-slate-600 hover:underline"
                      >
                        ดาวน์โหลด
                      </a>
                      <button
                        type="button"
                        className="text-[10px] font-semibold text-red-600 hover:underline"
                        onClick={() => onChange(urls.filter((_, j) => j !== i))}
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function HfIconOpenNewTab({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-5 w-5", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5M16.5 3h6v6M10.5 15L21 4.5"
      />
    </svg>
  );
}

function HfIconDownload({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-5 w-5", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4.5 19.5h15" />
    </svg>
  );
}

function HfIconEye({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-5 w-5", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

const hfVehicleAttachIconBtnSm =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-white/90 active:bg-slate-100 touch-manipulation sm:h-6 sm:w-6";

const hfIconSm = "h-3.5 w-3.5 sm:h-3 sm:w-3";

/** การ์ดรายการรถ — แถวกระชับ + ไอคอนเล็ก */
export function HomeFinanceVehicleRowAttachments({
  urls,
  onOpenAttachment,
}: {
  urls: string[];
  onOpenAttachment: (url: string) => void;
}) {
  if (urls.length === 0) {
    return <span className="text-[11px] text-slate-500">ยังไม่มี — กด「แก้ไข」เพื่อแนบเอกสาร</span>;
  }
  return (
    <ul className="flex w-full max-w-full flex-col gap-1" aria-label="เอกสารแนบ">
      {urls.map((url, i) => {
        const abs = resolvePublicUrl(url);
        const pdf = isHomeFinancePdfUrl(url);
        const base = fileBasename(url);
        return (
          <li
            key={`${url}-${i}`}
            className={cn(
              "flex min-w-0 items-center gap-1.5 rounded-lg border py-0.5 pl-1 pr-0.5",
              pdf ? "border-red-100/80 bg-red-50/40" : "border-slate-200/80 bg-slate-50/60",
            )}
          >
            <div className="shrink-0">
              {pdf ? (
                <span className="inline-flex min-w-[2rem] items-center justify-center rounded px-1 py-0.5 text-[8px] font-bold leading-none text-red-800 ring-1 ring-red-200/70">
                  PDF
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenAttachment(url)}
                  className="block h-7 w-7 overflow-hidden rounded-md ring-1 ring-slate-200/90 transition hover:ring-[#0000BF]/35"
                  title="ดูขยาย"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={abs} alt="" className="h-full w-full object-cover" />
                </button>
              )}
            </div>
            <p className="min-w-0 flex-1 truncate text-[10px] leading-tight text-slate-600 sm:text-[9px]" title={base}>
              {base}
            </p>
            <div className="flex shrink-0 items-center">
              <a
                href={abs}
                target="_blank"
                rel="noopener noreferrer"
                className={hfVehicleAttachIconBtnSm}
                title="เปิดในแท็บใหม่"
              >
                <HfIconOpenNewTab className={hfIconSm} />
                <span className="sr-only">เปิดในแท็บใหม่</span>
              </a>
              <a href={abs} download={base} className={hfVehicleAttachIconBtnSm} title="ดาวน์โหลด">
                <HfIconDownload className={hfIconSm} />
                <span className="sr-only">ดาวน์โหลด</span>
              </a>
              {!pdf ? (
                <button
                  type="button"
                  onClick={() => onOpenAttachment(url)}
                  className={hfVehicleAttachIconBtnSm}
                  title="ดูขยาย"
                >
                  <HfIconEye className={hfIconSm} />
                  <span className="sr-only">ดูขยาย</span>
                </button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function HomeFinanceHistoryAttachmentStrip({
  urls,
  onOpenImage,
}: {
  urls: string[];
  onOpenImage: (url: string) => void;
}) {
  if (urls.length === 0) {
    return <span className="text-[11px] text-slate-400">—</span>;
  }
  return (
    <ul className="flex max-w-[min(100%,18rem)] flex-wrap items-center gap-1.5" aria-label="เอกสารแนบ">
      {urls.map((url, i) => {
        const abs = resolvePublicUrl(url);
        return isHomeFinancePdfUrl(url) ? (
          <li
            key={`${url}-${i}`}
            className="flex flex-col gap-0.5 rounded-lg border border-red-100 bg-red-50/80 px-1.5 py-1"
          >
            <span className="text-[10px] font-bold text-red-900">PDF</span>
            <div className="flex flex-wrap gap-x-1.5">
              <a
                href={abs}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-semibold text-[#0000BF] underline-offset-2 hover:underline"
              >
                เปิด
              </a>
              <a
                href={abs}
                download={fileBasename(url)}
                className="text-[9px] font-medium text-slate-600 hover:underline"
              >
                ดาวน์โหลด
              </a>
            </div>
          </li>
        ) : (
          <li key={`${url}-${i}`} className="flex flex-col items-center gap-0.5">
            <button
              type="button"
              onClick={() => onOpenImage(url)}
              className="overflow-hidden rounded-lg ring-1 ring-slate-200 transition hover:ring-[#0000BF]/40"
              title="ดูขยาย"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={abs} alt="" className="h-9 w-9 object-cover" />
            </button>
            <div className="flex max-w-[5rem] flex-wrap justify-center gap-x-1.5 gap-y-0">
              <a
                href={abs}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-semibold text-[#0000BF] underline-offset-2 hover:underline"
              >
                เปิด
              </a>
              <a
                href={abs}
                download={fileBasename(url)}
                className="text-[9px] font-medium text-slate-600 hover:underline"
              >
                ดาวน์โหลด
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
