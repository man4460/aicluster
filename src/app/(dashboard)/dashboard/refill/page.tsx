import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-container";
import { isTokenDebtLocked, tokenArrearsToClear } from "@/lib/tokens/token-debt";

export const metadata: Metadata = {
  title: "ชำระค่าค้าง / เติมโทเคน | MAWELL PLATFORM",
};

export default async function RefillPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { tokens: true, role: true },
  });
  if (!user) redirect("/login");

  const arrears = tokenArrearsToClear(user.tokens);
  const locked = isTokenDebtLocked(user.tokens);

  return (
    <div className="space-y-6">
      <PageHeader
        title={locked ? "บัญชีถูกล็อค — ชำระค่าค้าง" : arrears > 0 ? "มียอดติดค้าง" : "เติมโทเคน"}
        description={
          locked
            ? `ติดลบถึงเกณฑ์ล็อคแล้ว — ต้องชำระ ${arrears} บาท (เติมจนยอดไม่ติดลบ) จึงเข้าใช้ระบบต่อได้`
            : "สายรายวันหัก 1 โทเคนต่อโมดูลต่อวัน — โทเคนไม่พอจะติดลบได้ และล็อคเมื่อติดลบถึง 100"
        }
      />
      <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-8 text-center shadow-sm">
        <p className="text-sm font-semibold tabular-nums text-amber-950">
          ยอดปัจจุบัน {user.tokens.toLocaleString("th-TH")} โทเคน
          {arrears > 0 ? ` · ค้างชำระ ${arrears.toLocaleString("th-TH")} บาท` : ""}
        </p>
        <p className="text-sm leading-relaxed text-amber-900/90">
          {locked
            ? "ชำระค่าค้างที่หน้าแพ็กเกจ แล้วกลับมาใช้งานได้ทันทีเมื่อยอดไม่ติดลบ"
            : "เติมโทเคนหรือสมัครแพ็ก 199 ต่อโมดูลที่หน้าแพ็กเกจ / ระบบทั้งหมด"}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard/plans"
            className="inline-flex justify-center rounded-lg bg-[#0000BF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0000a3]"
          >
            {arrears > 0 ? `ชำระค่าค้าง ${arrears} บาท` : "เติมโทเคน"}
          </Link>
          <Link
            href="/dashboard/modules"
            className="inline-flex justify-center rounded-lg border border-amber-300 bg-white px-5 py-2.5 text-sm font-medium text-amber-950 hover:bg-amber-100"
          >
            ระบบทั้งหมด
          </Link>
        </div>
      </div>
    </div>
  );
}
