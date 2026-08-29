import { notFound } from "next/navigation";
import { formatVillageAmountStable } from "@/lib/village/format-display-stable";
import { getVillagePublicInvoiceDto } from "@/lib/village/village-invoice-sheet";
import { VillagePublicSlipForm } from "@/systems/village/components/VillagePublicSlipForm";

type Props = { params: Promise<{ token: string }> };

export default async function VillagePublicSlipPage({ params }: Props) {
  const { token } = await params;
  const t = token?.trim() ?? "";
  if (t.length < 16) notFound();

  const invoice = await getVillagePublicInvoiceDto(t);
  if (!invoice) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-lg font-semibold text-slate-900">ลิงก์ใช้งานไม่ได้</h1>
        <p className="mt-2 text-sm text-slate-600">ลิงก์ไม่ถูกต้องหรือหมดอายุ</p>
      </div>
    );
  }

  if (invoice.alreadyPaid) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="text-lg font-semibold text-slate-900">รายการนี้ชำระครบแล้ว</h1>
        <p className="mt-2 text-sm text-slate-600">
          บ้าน {invoice.houseNo} · งวด {invoice.periodMonth}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium tracking-wide text-slate-500">แจ้งชำระค่าส่วนกลาง</p>
        <p className="mt-1 text-lg font-bold text-slate-900">{invoice.villageName}</p>
        <p className="mt-2 text-sm text-slate-700">
          บ้าน <span className="font-semibold tabular-nums">{invoice.houseNo}</span> · {invoice.residentName}
        </p>
        <p className="mt-1 font-mono text-sm text-slate-500">งวด {invoice.periodMonth}</p>
        <p className="mt-3 text-2xl font-bold tabular-nums text-[#0000BF]">
          {formatVillageAmountStable(invoice.amount, 2)} บาท
        </p>
        {invoice.contactPhone ? (
          <p className="mt-2 text-xs text-slate-500">ติดต่อนิติบุคคล {invoice.contactPhone}</p>
        ) : null}
      </div>

      {invoice.promptPayQrDataUrl ? (
        <div className="mb-4 flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wide text-slate-500">สแกนจ่าย พร้อมเพย์</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL สร้างจากเซิร์ฟเวอร์ */}
          <img
            src={invoice.promptPayQrDataUrl}
            alt="PromptPay QR"
            className="mt-3 h-auto w-[min(100%,220px)] object-contain"
          />
          <p className="mt-2 text-[11px] text-slate-500">
            ยอด {formatVillageAmountStable(invoice.amount, 2)} บาท
          </p>
        </div>
      ) : null}

      {invoice.paymentChannelsNote ? (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold tracking-wide text-slate-500">ช่องทางโอน</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-800">
            {invoice.paymentChannelsNote}
          </p>
        </div>
      ) : null}

      <VillagePublicSlipForm token={t} hasPendingSlip={invoice.hasPendingSlip} />
    </div>
  );
}
