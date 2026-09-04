import { ProResumeDashboardClient } from "@/systems/pro-resume/components/ProResumeDashboardClient";
import { loadProResumePage } from "@/systems/pro-resume/lib/load-pro-resume-page";

export default async function ProResumeDashboardPage() {
  const { profile, hasMonthly } = await loadProResumePage();
  return <ProResumeDashboardClient initialProfile={profile} hasMonthly={hasMonthly} />;
}
