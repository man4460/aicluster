import { PageContainer } from "@/components/ui/page-container";
import { requireAttendanceSection } from "@/systems/attendance/lib/guard";
import { AttendanceLayoutChrome } from "@/systems/attendance/components/AttendanceLayoutChrome";

export default async function AttendanceLayout({ children }: { children: React.ReactNode }) {
  await requireAttendanceSection();

  return (
    <PageContainer>
      <AttendanceLayoutChrome>{children}</AttendanceLayoutChrome>
    </PageContainer>
  );
}
