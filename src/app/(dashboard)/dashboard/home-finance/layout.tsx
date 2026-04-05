import { requireHomeFinanceSection } from "@/systems/home-finance/lib/guard";
import { HomeFinanceShell } from "@/systems/home-finance/components/HomeFinanceShell";

export default async function HomeFinanceLayout({ children }: { children: React.ReactNode }) {
  await requireHomeFinanceSection();
  return <HomeFinanceShell>{children}</HomeFinanceShell>;
}
