import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { BarberFinanceClient } from "@/systems/barber/components/BarberFinanceClient";
import { barberPageStackClass } from "@/systems/barber/components/barber-ui-tokens";

export default async function BarberFinancePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const baseUrl = await getRequestBaseUrl();

  return (
    <Suspense
      fallback={
        <div className={barberPageStackClass}>
          <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
        </div>
      }
    >
      <BarberFinanceClient baseUrl={baseUrl} />
    </Suspense>
  );
}
