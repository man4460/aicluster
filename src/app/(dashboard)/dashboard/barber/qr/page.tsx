import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/lib/app/request-base-url";
import { getSession } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { BarberQrHubClient } from "@/systems/barber/components/BarberQrHubClient";
import { barberPageStackClass } from "@/systems/barber/components/barber-ui-tokens";

export default async function BarberQrHubPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const scope = await getBarberDataScope(session.sub);
  const [profile, baseUrl] = await Promise.all([
    getBusinessProfile(session.sub, { barberTrialSessionId: scope.trialSessionId }),
    getRequestBaseUrl(),
  ]);
  const shopLabel = profile?.name?.trim() || "ร้านตัดผม";
  const logoUrl = profile?.logoUrl?.trim() || null;

  return (
    <div className={cn(barberPageStackClass, "space-y-8 sm:space-y-10")}>
      <header className="min-w-0 text-center sm:text-left">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9490c0]">ร้านตัดผม</p>
        <h2 className="mt-1.5 text-2xl font-black tracking-tight text-[#1e1b4b] sm:text-[1.65rem]">QR</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[#66638c] sm:mx-0">
          เลือกแถบด้านบนเพื่อสลับโปสเตอร์ลูกค้าหรือพนักงาน
        </p>
      </header>

      <BarberQrHubClient
        ownerId={session.sub}
        shopLabel={shopLabel}
        logoUrl={logoUrl}
        baseUrl={baseUrl}
        trialExportBlocked={scope.isTrialSandbox}
        isTrialSandbox={scope.isTrialSandbox}
        trialSessionId={scope.trialSessionId ?? ""}
      />
    </div>
  );
}
