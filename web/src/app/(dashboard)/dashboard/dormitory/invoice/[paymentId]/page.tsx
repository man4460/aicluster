import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ensurePaymentPublicProofToken } from "@/lib/dormitory/proof-token";
import { getDormitoryDataScope } from "@/lib/trial/module-scopes";
import { buildPromptPayQrDataUrl } from "@/lib/dormitory/promptpay-qr-image";
import { buildUrlQrDataUrl } from "@/lib/dormitory/url-qr-dataurl";
import { PrintButton } from "@/systems/dormitory/components/PrintButton";
import { DormInvoiceCopyLink } from "@/systems/dormitory/components/DormInvoiceCopyLink";

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

  const scope = await getDormitoryDataScope(session.sub);
  const payment = await prisma.splitBillPayment.findFirst({
    where: {
      id: pid,
      paymentStatus: "PENDING",
      tenant: { room: { ownerUserId: session.sub, trialSessionId: scope.trialSessionId } },
    },
    include: {
      tenant: true,
      bill: { include: { room: true } },
    },
  });
  if (!payment) notFound();

  const ownerId = payment.bill.room.ownerUserId;
  const profile = await prisma.dormitoryProfile.findUnique({
    where: {
      ownerUserId_trialSessionId: { ownerUserId: ownerId, trialSessionId: scope.trialSessionId },
    },
  });

  const proofToken = await ensurePaymentPublicProofToken(payment.id);
  const baseUrl = await requestBaseUrl();
  const uploadPagePath = `/pay/dorm/${proofToken}`;
  const uploadPageAbs = baseUrl ? `${baseUrl}${uploadPagePath}` : uploadPagePath;
  const slipUploadQrDataUrl =
    uploadPageAbs.startsWith("http://") || uploadPageAbs.startsWith("https://")
      ? await buildUrlQrDataUrl(uploadPageAbs, 120)
      : null;

  const amount = Number(payment.amountToPay);
  const qrDataUrl =
    profile?.promptPayPhone && profile.promptPayPhone.replace(/\D/g, "").length >= 9
      ? await buildPromptPayQrDataUrl(profile.promptPayPhone, amount)
      : null;

  const periodMonth = `${payment.bill.billingYear}-${String(payment.bill.billingMonth).padStart(2, "0")}`;
  const dormName = profile?.displayName?.trim() || "หอพัก";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
@media print {
  body * { visibility: hidden !important; }
  #dorm-invoice-root, #dorm-invoice-root * { visibility: visible !important; }
  #dorm-invoice-root {
    position: absolute;
    left: 0;
    top: 0;
    width: 210mm !important;
    max-width: 210mm !important;
    min-height: 297mm;
    padding: 14mm 16mm;
    box-sizing: border-box;
  }
  .no-print { display: none !important; }
}
`,
        }}
      />

      <div className="no-print mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <PrintButton label="พิมพ์ใบแจ้งหนี้" />
          <Link
            href={`/dashboard/dormitory/rooms/${payment.bill.room.id}`}
            className="text-sm font-medium text-[#0000BF] hover:underline"
          >
            ← กลับห้อง {payment.bill.room.roomNumber}
          </Link>
        </div>
        <p className="text-xs text-slate-600">
          ส่งลิงก์ด้านล่างให้ผู้พักเพื่ออัปโหลดสลิปหลังโอน — จากนั้นคุณตรวจสลิปที่หน้าห้องแล้วกดรับชำระ
        </p>
        <DormInvoiceCopyLink url={uploadPageAbs} qrDataUrl={slipUploadQrDataUrl} />
      </div>

      <div
        id="dorm-invoice-root"
        className="mx-auto max-w-[210mm] rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm md:p-10"
        style={{ minHeight: "297mm" }}
      >
        <header className="border-b border-slate-200 pb-6 text-center">
          {profile?.logoUrl ? (
            <div className="mb-4 flex justify-center">
              <img src={profile.logoUrl} alt="" className="max-h-24 max-w-[180px] object-contain" />
            </div>
          ) : null}
          <h1 className="text-2xl font-bold text-slate-900">{dormName}</h1>
          <p className="mt-2 text-lg font-semibold text-[#0000BF]">ใบแจ้งหนี้ / แจ้งชำระค่าห้อง</p>
          {profile?.taxId ? (
            <p className="mt-2 text-sm text-slate-600">เลขผู้เสียภาษี {profile.taxId}</p>
          ) : null}
          {profile?.address ? (
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{profile.address}</p>
          ) : null}
          {profile?.caretakerPhone ? (
            <p className="mt-1 text-sm text-slate-600">ติดต่อ {profile.caretakerPhone}</p>
          ) : null}
        </header>

        <section className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <span className="text-slate-500">ห้อง</span>
            <p className="font-semibold">{payment.bill.room.roomNumber}</p>
          </div>
          <div>
            <span className="text-slate-500">ผู้พัก</span>
            <p className="font-semibold">{payment.tenant.name}</p>
          </div>
          <div>
            <span className="text-slate-500">เบอร์ผู้พัก</span>
            <p className="font-medium">{payment.tenant.phone}</p>
          </div>
          <div>
            <span className="text-slate-500">งวด</span>
            <p className="font-medium">{periodMonth}</p>
          </div>
        </section>

        <div className="mt-8 rounded-xl bg-slate-50 px-4 py-5 text-center">
          <p className="text-sm font-medium text-slate-600">ยอดที่ต้องชำระ (บาท)</p>
          <p className="mt-2 text-4xl font-bold tabular-nums text-[#0000BF]">
            {amount.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
          </p>
        </div>

        {profile?.paymentChannelsNote ? (
          <section className="mt-6">
            <h2 className="text-sm font-semibold text-slate-900">ช่องทางชำระเงิน</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{profile.paymentChannelsNote}</p>
          </section>
        ) : (
          <p className="mt-6 text-sm text-slate-500">
            (เพิ่มข้อความช่องทางโอนได้ที่เมนู ตั้งค่าหอพัก)
          </p>
        )}

        <section className="mt-8 flex flex-col items-center border-t border-dashed border-slate-200 pt-8">
          <h2 className="text-sm font-semibold text-slate-900">สแกนจ่าย พร้อมเพย์</h2>
          {qrDataUrl ? (
            <>
              <img src={qrDataUrl} alt="PromptPay QR" className="mt-4 h-56 w-56 object-contain" />
              <p className="mt-2 text-xs text-slate-500">ยอด {amount.toLocaleString("th-TH")} บาท</p>
            </>
          ) : (
            <p className="mt-4 max-w-md text-center text-sm text-amber-800">
              ยังไม่ได้ตั้งเบอร์พร้อมเพย์ — ไปที่ &quot;ตั้งค่าหอพัก&quot; แล้วกรอกเบอร์ที่ผูกพร้อมเพย์
            </p>
          )}
        </section>

        <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm">
          <h2 className="font-semibold text-slate-900">หลังโอนแล้ว — แนบสลิป</h2>
          <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {slipUploadQrDataUrl ? (
              <div className="shrink-0 text-center">
                <img
                  src={slipUploadQrDataUrl}
                  alt="QR สแกนอัปโหลดสลิป"
                  width={100}
                  height={100}
                  className="mx-auto h-[100px] w-[100px] border border-slate-200 bg-white object-contain"
                />
                <p className="mt-1 text-[10px] font-medium text-slate-600">สแกนเพื่อแนบสลิป</p>
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="break-all text-slate-700">
                หรือเปิดลิงก์: <span className="font-mono text-xs">{uploadPageAbs}</span>
              </p>
              <p className="mt-2 text-xs text-slate-500">
                ผู้จ่ายไม่ต้องล็อกอิน — อัปโหลดรูปสลิปได้ทันที เจ้าของหอจะเห็นสลิปที่หน้าห้องก่อนกดยืนยันรับเงิน
              </p>
            </div>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-slate-400">MAWELL — ระบบจัดการหอพัก</p>
      </div>
    </>
  );
}
