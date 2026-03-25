import { PageContainer } from "@/components/ui/page-container";
import { DormLayoutChrome } from "@/systems/dormitory/components/DormLayoutChrome";
import { requireDormitorySection } from "@/systems/dormitory/lib/guard";

export default async function DormitoryLayout({ children }: { children: React.ReactNode }) {
  await requireDormitorySection();

  return (
    <PageContainer>
      <DormLayoutChrome>{children}</DormLayoutChrome>
    </PageContainer>
  );
}
