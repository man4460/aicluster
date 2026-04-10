import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDormInvoiceSheetDto } from "@/lib/dormitory/dorm-invoice-sheet";
import { DormInvoicePosPrintToolbar } from "@/systems/dormitory/components/DormInvoicePosPrintToolbar";
import { DormInvoicePreviewModal } from "@/systems/dormitory/components/DormInvoicePreviewModal";
import { DormInvoicePrintStyles } from "@/systems/dormitory/components/DormInvoicePrintStyles";
import { DormInvoiceSheetContent } from "@/systems/dormitory/components/DormInvoiceSheetContent";
import { dormBtnSecondary } from "@/systems/dormitory/dorm-ui";
import { cn } from "@/lib/cn";

type Props = { params: Promise<{ paymentId: string }> };

function parsePaymentId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function requestBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function DormitoryInvoicePage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { paymentId: raw } = await params;
  const pid = parsePaymentId(raw);
  if (pid === null) notFound();

  const baseUrl = await requestBaseUrl();
  const dto = await getDormInvoiceSheetDto(pid, session.sub, baseUrl);
  if (!dto) notFound();

  const sheetProps = {
    dormName: dto.dormName,
    logoUrl: dto.logoUrl,
    taxId: dto.taxId,
    address: dto.address,
    caretakerPhone: dto.caretakerPhone,
    roomNumber: dto.roomNumber,
    tenantName: dto.tenantName,
    tenantPhone: dto.tenantPhone,
    periodMonth: dto.periodMonth,
    amount: dto.amount,
    paymentChannelsNote: dto.paymentChannelsNote,
    promptPayQrDataUrl: dto.promptPayQrDataUrl,
    slipUploadQrDataUrl: dto.slipUploadQrDataUrl,
  };

  return (
    <>
      <DormInvoicePrintStyles />

      <div className="mx-auto max-w-[210mm]">
        <DormInvoiceSheetContent {...sheetProps} printRootId="dorm-invoice-root" />
      </div>

      <div className="no-print mx-auto mt-4 max-w-[210mm] sm:mt-6">
        <div className="app-surface rounded-2xl p-4 sm:p-5">
          <h2 className="text-base font-semibold tracking-tight text-[#2e2a58]">เครื่องมือใบแจ้งหนี้</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#66638c]">
            พิมพ์ตามขนาดสลิป ดาวน์โหลด PDF พรีวิว หรือกลับหน้าห้อง — ส่วนนี้ไม่ถูกพิมพ์
          </p>
          <div className="mt-3 flex flex-col gap-3">
            <DormInvoicePosPrintToolbar sheet={sheetProps} />
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <DormInvoicePreviewModal {...sheetProps} />
              <Link
                href={`/dashboard/dormitory/rooms/${dto.roomId}`}
                className={cn(dormBtnSecondary, "inline-flex w-full justify-center sm:w-auto")}
              >
                กลับห้อง {dto.roomNumber}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
