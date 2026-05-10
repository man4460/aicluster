import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SchoolBankMembersClient } from "@/systems/school-bank/components/SchoolBankMembersClient";
import { requireSchoolBankPage } from "@/systems/school-bank/lib/school-bank-page-auth";

export const metadata: Metadata = {
  title: "บัญชีนักเรียน | ธนาคารโรงเรียน",
};

export default async function SchoolBankMembersPage() {
  const { session, scope } = await requireSchoolBankPage();
  const initial = await prisma.schoolBankAccount.findMany({
    where: { ownerUserId: session.sub, trialSessionId: scope.trialSessionId, isActive: true },
    orderBy: [{ classroomLabel: "asc" }, { memberCode: "asc" }],
    select: {
      id: true,
      memberCode: true,
      memberName: true,
      classroomLabel: true,
      balanceSatang: true,
    },
  });
  return <SchoolBankMembersClient initial={initial} />;
}
