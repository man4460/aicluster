import { permanentRedirect } from "next/navigation";

/** เส้นทางเดิม — ใช้ศูนย์แอดมินแทน */
export default function ActivityLogsLegacyRedirect() {
  permanentRedirect("/dashboard/admin/activity-logs");
}
