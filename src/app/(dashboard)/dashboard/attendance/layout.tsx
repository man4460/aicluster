import { requireAttendanceSection } from "@/systems/attendance/lib/guard";
import { AttendanceShell } from "@/systems/attendance/components/AttendanceShell";

export default async function AttendanceLayout({ children }: { children: React.ReactNode }) {
  await requireAttendanceSection();
  return <AttendanceShell>{children}</AttendanceShell>;
}
