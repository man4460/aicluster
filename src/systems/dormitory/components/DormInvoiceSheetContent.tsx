"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { formatDormAmountStable } from "@/lib/dormitory/format-display-stable";

export type DormInvoiceSheetContentProps = {
  /** ใส่เมื่อเป็นกล่องที่ต้องพิมพ์ — โมดัลพรีวิวไม่ใส่ */
  printRootId?: string;
  className?: string;
  dormName: string;
  logoUrl?: string | null;
  taxId?: string | null;
  address?: string | null;
  caretakerPhone?: string | null;
  roomNumber: string;
  tenantName: string;
  tenantPhone: string;
  periodMonth: string;
  amount: number;
  paymentChannelsNote?: string | null;
  promptPayQrDataUrl?: string | null;
  /** QR หน้าแนบสลิปสาธารณะ — แสดงมุมล่างขวาในขั้นตอนแนบสลิป */
  slipUploadQrDataUrl?: string | null;
};

export function DormInvoiceSheetContent({
  printRootId,
  className,
  dormName,
  logoUrl,
  taxId,
  address,
  caretakerPhone,
  roomNumber,
  tenantName,
  tenantPhone,
  periodMonth,
  amount,
  paymentChannelsNote,
  promptPayQrDataUrl,
  slipUploadQrDataUrl,
}: DormInvoiceSheetContentProps) {
  const amt = formatDormAmountStable(amount, 2);
  const [logoOk, setLogoOk] = useState(true);

  useEffect(() => {
    setLogoOk(true);
  }, [logoUrl]);

  return (
    <div
      id={printRootId}
      className={cn(
        "rounded-2xl border border-slate-200/90 bg-white px-4 py-5 text-slate-900 shadow-sm sm:px-7 sm:py-7 md:px-9 md:py-8",
        className,
      )}
    >
      <header className="flex flex-col gap-4 border-b border-slate-200/90 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:pb-5">
        <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
          {logoUrl && logoOk ? (
            <div className="shrink-0">
              <img
                src={logoUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="h-16 w-16 rounded-xl border border-slate-100 bg-white object-contain sm:h-20 sm:w-20 sm:object-contain"
                onError={() => setLogoOk(false)}
              />
            </div>
          ) : null}
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight tracking-tight text-slate-900 sm:text-xl">{dormName}</h1>
            <p className="mt-1 text-xs font-semibold text-[#3730a3] sm:text-sm">ใบแจ้งหนี้ / แจ้งชำระค่าห้อง</p>
          </div>
        </div>
        <div className="min-w-0 text-left text-xs leading-relaxed text-slate-600 sm:max-w-[55%] sm:text-right sm:text-sm">
          {taxId ? <p className="font-medium text-slate-800">เลขผู้เสียภาษี {taxId}</p> : null}
          {address ? <p className="mt-1 whitespace-pre-line">{address}</p> : null}
          {caretakerPhone ? <p className="mt-1.5 font-medium text-slate-800">ติดต่อ {caretakerPhone}</p> : null}
        </div>
      </header>

      <section className="mt-4 sm:mt-5">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">ข้อมูลผู้พัก</h2>
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 text-sm sm:grid-cols-2 sm:gap-x-8">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">ห้อง</span>
            <p className="mt-0.5 font-semibold tabular-nums text-slate-900">{roomNumber}</p>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">ผู้พัก</span>
            <p className="mt-0.5 font-semibold leading-snug text-slate-900">{tenantName}</p>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">เบอร์ผู้พัก</span>
            <p className="mt-0.5 break-all font-medium tabular-nums text-slate-800">{tenantPhone}</p>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">งวด</span>
            <p className="mt-0.5 font-mono text-sm font-semibold text-slate-800">{periodMonth}</p>
          </div>
        </div>
      </section>

      <div className="mt-5 rounded-xl bg-gradient-to-br from-indigo-50/90 via-white to-slate-50 px-4 py-4 text-center ring-1 ring-indigo-100/80 sm:mt-6 sm:px-5 sm:py-5">
        <p className="text-[11px] font-semibold text-slate-600">ยอดที่ต้องชำระ (บาท)</p>
        <p className="mt-1.5 text-3xl font-bold tabular-nums text-[#3730a3] sm:text-4xl">{amt}</p>
      </div>

      <section className="mt-5 sm:mt-6">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">ช่องทางชำระเงิน</h2>
        {paymentChannelsNote ? (
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-800">{paymentChannelsNote}</p>
        ) : (
          <p className="mt-2 text-xs text-slate-500">(ตั้งค่าช่องทางโอนได้ที่โปรไฟล์ / ตั้งค่าหอพัก)</p>
        )}
      </section>

      <section className="mt-6 flex flex-col items-center border-t border-dashed border-slate-200 pt-6 sm:mt-7 sm:pt-7">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">สแกนจ่าย พร้อมเพย์</h2>
        {promptPayQrDataUrl ? (
          <>
            <img
              src={promptPayQrDataUrl}
              alt="PromptPay QR"
              className="mt-3 h-auto w-[min(100%,200px)] max-w-[200px] object-contain sm:mt-4 sm:w-52 sm:max-w-[208px]"
            />
            <p className="mt-2 text-[11px] text-slate-500">ยอด {amt} บาท</p>
          </>
        ) : (
          <p className="mt-3 max-w-sm text-center text-xs leading-relaxed text-amber-900 sm:text-sm">
            ยังไม่ได้ตั้งเบอร์พร้อมเพย์ — ตั้งค่าได้ที่โปรไฟล์ส่วนกลาง
          </p>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-4 sm:mt-7 sm:px-4 sm:py-5">
        <h2 className="text-center text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">หลังโอนแล้ว — แนบสลิป</h2>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
          <ol className="min-w-0 flex-1 space-y-2.5 text-xs leading-relaxed text-slate-700 sm:text-sm">
            <li className="flex gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3730a3] text-[11px] font-bold text-white">
                1
              </span>
              <span>โอนเงินตามช่องทางด้านบนให้ครบยอด</span>
            </li>
            <li className="flex gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3730a3] text-[11px] font-bold text-white">
                2
              </span>
              <span>
                สแกน QR มุมขวาเพื่ออัปโหลดสลิป หรือขอลิงก์จากเจ้าของหอแล้วเปิดลิงก์แนบรูปสลิป
              </span>
            </li>
            <li className="flex gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3730a3] text-[11px] font-bold text-white">
                3
              </span>
              <span>เจ้าของหอจะตรวจสลิปที่หน้าห้อง แล้วกดยืนยันรับชำระ</span>
            </li>
          </ol>
          {slipUploadQrDataUrl ? (
            <div className="flex shrink-0 flex-col items-center self-center sm:self-end">
              <img
                src={slipUploadQrDataUrl}
                alt="สแกนแนบสลิป"
                width={112}
                height={112}
                className="h-28 w-28 rounded-lg border border-white bg-white object-contain p-1 shadow-sm"
              />
              <p className="mt-1.5 text-center text-[10px] font-bold text-slate-600">สแกนแนบสลิป</p>
            </div>
          ) : null}
        </div>
      </section>

      <p className="mt-5 text-center text-[10px] text-slate-400 sm:mt-6">MAWELL — ระบบจัดการหอพัก</p>
    </div>
  );
}
