import type { Metadata } from "next";
import { bangkokMonthStartYmd, bangkokTodayYmd } from "@/lib/dates/bangkok-calendar";
import { ActivityLogsClient } from "@/systems/activity-logs/components/ActivityLogsClient";
import { ActivityLogsShell } from "@/systems/activity-logs/components/ActivityLogsShell";

export const metadata: Metadata = {
  title: "ประวัติกรรม | ศูนย์แอดมิน",
};

export default function AdminActivityLogsPage() {
  return (
    <ActivityLogsShell>
      <ActivityLogsClient initialFrom={bangkokMonthStartYmd()} initialTo={bangkokTodayYmd()} />
    </ActivityLogsShell>
  );
}
