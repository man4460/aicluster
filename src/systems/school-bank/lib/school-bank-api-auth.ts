import { getSession } from "@/lib/auth/session";
import { getSchoolBankDataScope } from "@/lib/trial/module-scopes";
import { prisma } from "@/lib/prisma";
import { ensureSchoolBankSettings } from "@/systems/school-bank/lib/ensure-school-bank-settings";
import { loadSchoolBankAccessState } from "@/systems/school-bank/lib/school-bank-access-guard";

export async function getSchoolBankOwnerContext() {
  const session = await getSession();
  if (!session) return null;
  const gate = await loadSchoolBankAccessState(session.sub);
  if (!gate.ok) return null;
  const scope = await getSchoolBankDataScope(session.sub);
  const settings = await ensureSchoolBankSettings(session.sub, scope.trialSessionId);
  return { userId: session.sub, scope, settings };
}

export async function assertSchoolBankAccountOwned(
  accountId: string,
  userId: string,
  trialSessionId: string,
) {
  return prisma.schoolBankAccount.findFirst({
    where: { id: accountId, ownerUserId: userId, trialSessionId },
  });
}
