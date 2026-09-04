import { ProResumeProfileClient } from "@/systems/pro-resume/components/ProResumeProfileClient";
import { loadProResumePage } from "@/systems/pro-resume/lib/load-pro-resume-page";

export default async function ProResumeProfilePage() {
  const { profile } = await loadProResumePage();
  return <ProResumeProfileClient initialProfile={profile} />;
}
