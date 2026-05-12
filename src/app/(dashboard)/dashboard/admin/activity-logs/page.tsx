import type { Metadata } from "next";
import { bangkokMonthStartYmd, bangkokTodayYmd } from "@/lib/dates/bangkok-calendar";
import { ActivityLogsClient } from "@/systems/activity-logs/components/ActivityLogsClient";

export const metadata: Metadata = {
  title: "ความเคลื่อนไหวระบบ | ศูนย์แอดมิน",
};

export default function AdminActivityLogsPage() {
  return <ActivityLogsClient initialFrom={bangkokMonthStartYmd()} initialTo={bangkokTodayYmd()} />;
}
