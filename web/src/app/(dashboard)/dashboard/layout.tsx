import { PageContainer } from "@/components/ui/page-container";

/**
 * ความกว้างและ padding เท่ากันทุกหน้าใต้ /dashboard/*
 * ใช้ flex เพื่อให้หน้าแชทขยายความสูงได้
 */
export default function DashboardPagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageContainer className="flex min-h-0 flex-1 flex-col">{children}</PageContainer>
  );
}
