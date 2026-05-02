import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { BARBER_MODULE_SLUG } from "@/lib/modules/config";
import { getActiveTrialBanner } from "@/lib/modules/trial-store";
import { BarberModuleShell } from "@/systems/barber/components/BarberModuleShell";
import { requireBarberSection } from "@/systems/barber/lib/guard";

export default async function BarberLayout({ children }: { children: React.ReactNode }) {
  await requireBarberSection();
  const session = await getSession();
  if (!session) redirect("/login");

  const trial = await getActiveTrialBanner(session.sub, BARBER_MODULE_SLUG);
  const trialExpiresLabel =
    trial == null
      ? null
      : trial.expiresAt.toLocaleString("th-TH", {
          timeZone: "Asia/Bangkok",
          dateStyle: "medium",
          timeStyle: "short",
        });

  return <BarberModuleShell trialExpiresLabel={trialExpiresLabel}>{children}</BarberModuleShell>;
}
