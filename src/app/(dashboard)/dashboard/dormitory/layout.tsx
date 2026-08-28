import { getSession } from "@/lib/auth/session";
import { DORMITORY_MODULE_SLUG } from "@/lib/modules/config";
import { getActiveTrialBanner } from "@/lib/modules/trial-store";
import { DormLayoutChrome } from "@/systems/dormitory/components/DormLayoutChrome";
import { requireDormitorySection } from "@/systems/dormitory/lib/guard";

export default async function DormitoryLayout({ children }: { children: React.ReactNode }) {
  await requireDormitorySection();
  const session = await getSession();
  const trial = session ? await getActiveTrialBanner(session.sub, DORMITORY_MODULE_SLUG) : null;
  const trialExpiresLabel =
    trial == null
      ? null
      : trial.expiresAt.toLocaleString("th-TH", {
          timeZone: "Asia/Bangkok",
          dateStyle: "medium",
          timeStyle: "short",
        });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DormLayoutChrome trialExpiresLabel={trialExpiresLabel}>
        {children}
      </DormLayoutChrome>
    </div>
  );
}
