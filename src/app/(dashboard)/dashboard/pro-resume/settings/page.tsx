import { ProResumeSettingsClient } from "@/systems/pro-resume/components/ProResumeSettingsClient";
import { loadProResumePage } from "@/systems/pro-resume/lib/load-pro-resume-page";

export default async function ProResumeSettingsPage() {
  const { profile, hasMonthly, trialSessionId } = await loadProResumePage();
  return (
    <ProResumeSettingsClient initialProfile={profile} hasMonthly={hasMonthly} trialSessionId={trialSessionId} />
  );
}
