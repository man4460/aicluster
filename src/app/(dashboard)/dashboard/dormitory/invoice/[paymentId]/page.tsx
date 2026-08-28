import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDormInvoiceSheetDto } from "@/lib/dormitory/dorm-invoice-sheet";
import { DormInvoicePageClient } from "@/systems/dormitory/components/DormInvoicePageClient";
import { DormInvoicePrintStyles } from "@/systems/dormitory/components/DormInvoicePrintStyles";
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
        <DormInvoicePageClient
          sheet={sheetProps}
          defaultPaperSize={dto.defaultPaperSize}
          toolbarExtra={
            <Link
              href={`/dashboard/dormitory/rooms/${dto.roomId}`}
              className={cn(dormBtnSecondary, "inline-flex w-full justify-center sm:w-auto")}
            >
              กลับห้อง {dto.roomNumber}
            </Link>
          }
        />
      </div>
    </>
  );
}
