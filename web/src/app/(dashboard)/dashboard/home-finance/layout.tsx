import { requireHomeFinanceSection } from "@/systems/home-finance/lib/guard";

export default async function HomeFinanceLayout({ children }: { children: React.ReactNode }) {
  await requireHomeFinanceSection();
  return children;
}
