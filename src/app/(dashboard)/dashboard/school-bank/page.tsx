import type { Metadata } from "next";
import { SchoolBankDashboardClient } from "@/systems/school-bank/components/SchoolBankDashboardClient";
import { buildSchoolBankDashboardDto } from "@/systems/school-bank/lib/load-school-bank-dashboard";
import { requireSchoolBankPage } from "@/systems/school-bank/lib/school-bank-page-auth";

export const metadata: Metadata = {
  title: "ธนาคารโรงเรียน | MAWELL",
};

export default async function SchoolBankPage() {
  const { settings, session, scope } = await requireSchoolBankPage();
  const initial = await buildSchoolBankDashboardDto(settings, session.sub, scope.trialSessionId);
  return <SchoolBankDashboardClient initial={initial} />;
}
