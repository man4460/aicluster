import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { getDocTransmissionDataScope } from "@/lib/trial/module-scopes";
import { DocDepartmentsClient } from "@/systems/doc-transmission/components/DocDepartmentsClient";

export const dynamic = "force-dynamic";

export default async function DocMasterPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const scope = await getDocTransmissionDataScope(session.sub);

  const items = await prisma.docTransmissionDepartment.findMany({
    where: { ownerUserId: session.sub, trialSessionId: scope.trialSessionId },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  return (
    <DocDepartmentsClient
      initial={items.map((i) => ({
        id: i.id,
        code: i.code,
        name: i.name,
        contactPerson: i.contactPerson,
        phone: i.phone,
        email: i.email,
        isInternal: i.isInternal,
        isActive: i.isActive,
        sortOrder: i.sortOrder,
      }))}
    />
  );
}
