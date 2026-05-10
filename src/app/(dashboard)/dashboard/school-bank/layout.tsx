import { SchoolBankShell } from "@/systems/school-bank/components/SchoolBankShell";
import { requireSchoolBankPage } from "@/systems/school-bank/lib/school-bank-page-auth";

export default async function SchoolBankLayout({ children }: { children: React.ReactNode }) {
  const { settings } = await requireSchoolBankPage();
  return <SchoolBankShell siteName={settings.displayName}>{children}</SchoolBankShell>;
}
