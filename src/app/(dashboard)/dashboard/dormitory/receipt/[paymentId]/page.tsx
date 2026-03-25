import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/systems/dormitory/components/PrintButton";
import {
  receiptLayoutPrintCss,
  resolveDormReceiptLayout,
  type DormReceiptLayout,
} from "@/systems/dormitory/lib/receipt-layout";

type Props = {
  params: Promise<{ paymentId: string }>;
  searchParams: Promise<{ w?: string; format?: string }>;
};

function parsePaymentId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

type DormBrand = {
  displayName: string | null;
  logoUrl: string | null;
  taxId: string | null;
  address: string | null;
  caretakerPhone: string | null;
  defaultPaperSize: string;
};

function layoutHint(layout: DormReceiptLayout): string {
  if (layout === "a4") return "A4 (210×297 mm)";
  if (layout === "slip80") return "สลิป 80 mm";
  return "สลิป 58 mm";
}

export default async function DormitoryReceiptPage({ params, searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { paymentId } = await params;
  const { w, format } = await searchParams;

  const pid = parsePaymentId(paymentId);
  if (pid === null) notFound();

  const payment = await prisma.splitBillPayment.findFirst({
    where: {
      id: pid,
      paymentStatus: "PAID",
      tenant: { room: { ownerUserId: session.sub } },
    },
    include: {
      tenant: true,
      bill: { include: { room: true } },
    },
  });
  if (!payment?.paidAt) notFound();

  const ownerId = payment.bill.room.ownerUserId;
  const dormRow = await prisma.dormitoryProfile.findUnique({
    where: { ownerUserId: ownerId },
  });

  const brand: DormBrand = {
    displayName: dormRow?.displayName ?? null,
    logoUrl: dormRow?.logoUrl ?? null,
    taxId: dormRow?.taxId ?? null,
    address: dormRow?.address ?? null,
    caretakerPhone: dormRow?.caretakerPhone ?? null,
    defaultPaperSize: dormRow?.defaultPaperSize ?? "SLIP_58",
  };

  const layout = resolveDormReceiptLayout(w, format, brand.defaultPaperSize);
  const printBlock = receiptLayoutPrintCss(layout);
  const dormTitle = brand.displayName?.trim() || "หอพัก";

  const paidAt = payment.paidAt.toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const periodMonth = `${payment.bill.billingYear}-${String(payment.bill.billingMonth).padStart(2, "0")}`;

  const isA4 = layout === "a4";
  const headerTextClass = isA4 ? "text-base" : "text-xs";
  const bodyTextClass = isA4 ? "text-sm" : "text-xs";
  const amountClass = isA4 ? "text-3xl" : "text-xl";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
@media print {
  body * { visibility: hidden !important; }
  #dorm-receipt-root, #dorm-receipt-root * { visibility: visible !important; }
  ${printBlock}
  .no-print { display: none !important; }
}
`,
        }}
      />
      <div className="no-print mb-6 flex flex-wrap items-center gap-3">
        <PrintButton />
        <p className="text-xs text-slate-500">
          เลย์เอาต์: {layoutHint(layout)} — ในกล่องพิมพ์ให้เลือกขนาดกระดาษให้ตรง (A4 หรือความกว้างสลิป)
        </p>
      </div>
      <div
        id="dorm-receipt-root"
        className={[
          "rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm",
          isA4 ? "mx-auto max-w-[210mm] p-8 md:p-10" : "p-4",
        ].join(" ")}
        style={
          isA4
            ? { width: "100%", maxWidth: "210mm", minHeight: "297mm" }
            : { maxWidth: layout === "slip80" ? "80mm" : "58mm" }
        }
      >
        <header
          className={[
            "border-b border-dashed border-slate-200 text-center",
            isA4 ? "pb-6" : "pb-3",
          ].join(" ")}
        >
          {brand.logoUrl ? (
            <div className={isA4 ? "mb-4 flex justify-center" : "mb-2 flex justify-center"}>
              <img
                src={brand.logoUrl}
                alt=""
                className={isA4 ? "max-h-28 max-w-[200px] object-contain" : "max-h-16 max-w-[120px] object-contain"}
              />
            </div>
          ) : null}
          <h1 className={`font-bold text-slate-900 ${isA4 ? "text-2xl" : "text-sm"}`}>{dormTitle}</h1>
          <p className={`mt-2 font-semibold text-slate-600 ${headerTextClass}`}>ใบเสร็จรับเงิน</p>
          {isA4 ? (
            <div className="mt-4 space-y-1 text-left text-sm text-slate-700">
              {brand.taxId ? (
                <p>
                  <span className="text-slate-500">เลขประจำตัวผู้เสียภาษี </span>
                  {brand.taxId}
                </p>
              ) : null}
              {brand.address ? (
                <p className="whitespace-pre-line">
                  <span className="text-slate-500">ที่อยู่ </span>
                  {brand.address}
                </p>
              ) : null}
              {brand.caretakerPhone ? (
                <p>
                  <span className="text-slate-500">โทรผู้ดูแล </span>
                  {brand.caretakerPhone}
                </p>
              ) : null}
            </div>
          ) : (
            <div className={`mt-2 space-y-0.5 text-slate-600 ${bodyTextClass}`}>
              {brand.taxId ? <p>เลขผู้เสียภาษี {brand.taxId}</p> : null}
              {brand.caretakerPhone ? <p>โทร {brand.caretakerPhone}</p> : null}
            </div>
          )}
        </header>

        <dl className={isA4 ? "mt-6 space-y-2" : "mt-3 space-y-1.5"}>
          <div className={`flex justify-between gap-2 ${bodyTextClass} leading-relaxed`}>
            <dt className="text-slate-500">ห้อง</dt>
            <dd className="text-right font-medium">{payment.bill.room.roomNumber}</dd>
          </div>
          <div className={`flex justify-between gap-2 ${bodyTextClass} leading-relaxed`}>
            <dt className="text-slate-500">ผู้ชำระ</dt>
            <dd className="text-right font-medium">{payment.tenant.name}</dd>
          </div>
          <div className={`flex justify-between gap-2 ${bodyTextClass} leading-relaxed`}>
            <dt className="text-slate-500">งวด</dt>
            <dd className="text-right font-medium">{periodMonth}</dd>
          </div>
          {payment.receiptNumber ? (
            <div className={`flex justify-between gap-2 ${bodyTextClass} leading-relaxed`}>
              <dt className="text-slate-500">เลขที่</dt>
              <dd className="text-right font-medium">{payment.receiptNumber}</dd>
            </div>
          ) : null}
          <div className={`flex justify-between gap-2 ${bodyTextClass} leading-relaxed`}>
            <dt className="text-slate-500">วันที่รับเงิน</dt>
            <dd className="text-right">{paidAt}</dd>
          </div>
          {payment.note ? (
            <div className={`flex justify-between gap-2 ${bodyTextClass} leading-relaxed`}>
              <dt className="text-slate-500">หมายเหตุ</dt>
              <dd className="text-right">{payment.note}</dd>
            </div>
          ) : null}
        </dl>

        <div className={isA4 ? "mt-8 border-t border-slate-200 pt-6 text-center" : "mt-4 border-t border-slate-200 pt-3 text-center"}>
          <p className={`uppercase tracking-wide text-slate-500 ${isA4 ? "text-sm" : "text-[10px]"}`}>จำนวนเงิน</p>
          <p className={`mt-2 font-bold tabular-nums text-[#0000BF] ${amountClass}`}>
            {Number(payment.amountToPay).toLocaleString("th-TH", { maximumFractionDigits: 2 })} บาท
          </p>
        </div>

        <p className={`mt-6 text-center text-slate-400 ${isA4 ? "text-xs" : "text-[10px]"}`}>
          ขอบคุณที่ใช้บริการ
          <span className="block text-[10px] text-slate-400/90">MAWELL Platform</span>
        </p>
      </div>
    </>
  );
}
