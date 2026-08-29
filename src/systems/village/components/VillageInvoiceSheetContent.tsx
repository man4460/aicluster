"use client";

import { AppInvoicePayUploadQrSection } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { formatVillageAmountStable } from "@/lib/village/format-display-stable";

export type VillageInvoiceSheetContentProps = {
  className?: string;
  villageName: string;
  taxId?: string | null;
  address?: string | null;
  contactPhone?: string | null;
  houseNo: string;
  residentName: string;
  residentPhone: string;
  periodMonth: string;
  amount: number;
  paymentChannelsNote?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  promptPayQrDataUrl?: string | null;
  /** QR หน้าแนบสลิปสาธารณะ */
  slipUploadQrDataUrl?: string | null;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] font-bold tracking-wide text-slate-400">{children}</span>;
}

export function VillageInvoiceSheetContent({
  className,
  villageName,
  taxId,
  address,
  contactPhone,
  houseNo,
  residentName,
  residentPhone,
  periodMonth,
  amount,
  paymentChannelsNote,
  bankName,
  bankAccountNumber,
  bankAccountName,
  promptPayQrDataUrl,
  slipUploadQrDataUrl,
}: VillageInvoiceSheetContentProps) {
  const amt = formatVillageAmountStable(amount, 2);
  const hasBank = Boolean(bankName?.trim() || bankAccountNumber?.trim() || bankAccountName?.trim());

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/90 bg-white px-4 py-5 text-slate-900 shadow-sm sm:px-7 sm:py-7 md:px-9 md:py-8",
        className,
      )}
    >
      <header className="flex flex-col gap-4 border-b border-slate-200/90 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:pb-5">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold leading-tight tracking-tight text-slate-900 sm:text-xl">{villageName}</h1>
          <p className="mt-1 text-xs font-semibold text-[#3730a3] sm:text-sm">ใบแจ้งหนี้ค่าส่วนกลาง</p>
        </div>
        <div className="min-w-0 text-left text-xs leading-relaxed text-slate-600 sm:max-w-[55%] sm:text-right sm:text-sm">
          {taxId ? <p className="font-medium text-slate-800">เลขผู้เสียภาษี {taxId}</p> : null}
          {address ? <p className={cn("whitespace-pre-line", Boolean(taxId) && "mt-1")}>{address}</p> : null}
          {contactPhone ? <p className="mt-1.5 font-medium text-slate-800">ติดต่อ {contactPhone}</p> : null}
        </div>
      </header>

      <section className="mt-4 sm:mt-5">
        <h2 className="text-[10px] font-bold tracking-[0.12em] text-slate-400">ข้อมูลบ้าน</h2>
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 text-sm sm:gap-x-8">
          <div className="min-w-0">
            <FieldLabel>บ้าน</FieldLabel>
            <p className="mt-0.5 font-semibold tabular-nums text-slate-900">{houseNo}</p>
          </div>
          <div className="min-w-0">
            <FieldLabel>เจ้าของ / ผู้อยู่อาศัย</FieldLabel>
            <p className="mt-0.5 font-semibold leading-snug text-slate-900">{residentName}</p>
          </div>
          <div className="min-w-0">
            <FieldLabel>เบอร์ติดต่อ</FieldLabel>
            <p className="mt-0.5 break-all font-medium tabular-nums text-slate-800">{residentPhone}</p>
          </div>
          <div className="min-w-0">
            <FieldLabel>งวด</FieldLabel>
            <p className="mt-0.5 font-mono text-sm font-semibold text-slate-800">{periodMonth}</p>
          </div>
        </div>
      </section>

      <div className="mt-5 rounded-xl bg-gradient-to-br from-indigo-50/90 via-white to-slate-50 px-4 py-4 text-center ring-1 ring-indigo-100/80 sm:mt-6 sm:px-5 sm:py-5">
        <p className="text-[11px] font-semibold text-slate-600">ยอดคงเหลือที่ต้องชำระ (บาท)</p>
        <p className="mt-1.5 text-3xl font-bold tabular-nums text-[#3730a3] sm:text-4xl">{amt}</p>
      </div>

      <section className="mt-5 sm:mt-6">
        <h2 className="text-[10px] font-bold tracking-[0.12em] text-slate-500">ช่องทางชำระเงิน</h2>
        {hasBank ? (
          <div className="mt-2 space-y-1 text-sm leading-relaxed text-slate-800">
            {bankName?.trim() ? (
              <p>
                <span className="text-slate-500">ธนาคาร </span>
                <span className="font-semibold">{bankName.trim()}</span>
              </p>
            ) : null}
            {bankAccountNumber?.trim() ? (
              <p>
                <span className="text-slate-500">เลขบัญชี </span>
                <span className="font-semibold tabular-nums">{bankAccountNumber.trim()}</span>
              </p>
            ) : null}
            {bankAccountName?.trim() ? (
              <p>
                <span className="text-slate-500">ชื่อบัญชี </span>
                <span className="font-semibold">{bankAccountName.trim()}</span>
              </p>
            ) : null}
          </div>
        ) : null}
        {paymentChannelsNote?.trim() ? (
          <p
            className={cn(
              "whitespace-pre-line text-sm leading-relaxed text-slate-800",
              hasBank ? "mt-3" : "mt-2",
            )}
          >
            {paymentChannelsNote.trim()}
          </p>
        ) : null}
        {!hasBank && !paymentChannelsNote?.trim() ? (
          <p className="mt-2 text-xs text-slate-500">(ตั้งค่าบัญชีโอนได้ที่ตั้งค่าโครงการ → ชำระเงิน)</p>
        ) : null}
      </section>

      <AppInvoicePayUploadQrSection
        amountLabel={amt}
        promptPayQrDataUrl={promptPayQrDataUrl}
        slipUploadQrDataUrl={slipUploadQrDataUrl}
        missingPromptPayMessage="ยังไม่ได้ตั้งเบอร์พร้อมเพย์ — ตั้งค่าได้ที่ตั้งค่าโครงการ → ชำระเงิน"
        uploadSteps={[
          "โอนเงินตามช่องทางด้านบนให้ครบยอด",
          "สแกน QR อัปโหลดสลิปด้านขวา หรือขอลิงก์จากนิติบุคคล",
          "นิติบุคคลตรวจสลิปที่ค่าส่วนกลาง → รับชำระ แล้วกดอนุมัติ",
        ]}
      />

      <p className="mt-5 text-center text-[10px] text-slate-400 sm:mt-6">MAWELL — ระบบจัดการหมู่บ้าน</p>
    </div>
  );
}
