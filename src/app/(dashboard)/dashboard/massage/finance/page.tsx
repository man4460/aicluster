import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { MassageFinanceClient } from "@/systems/massage/components/MassageFinanceClient";
import { massagePageStackClass } from "@/systems/massage/components/massage-ui-tokens";

export default async function MassageFinancePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const baseUrl = await getRequestBaseUrl();

  return (
    <Suspense
      fallback={
        <div className={massagePageStackClass}>
          <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
        </div>
      }
    >
      <MassageFinanceClient baseUrl={baseUrl} />
    </Suspense>
  );
}
