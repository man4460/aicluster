import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { getDocTransmissionDataScope } from "@/lib/trial/module-scopes";
import { DocRecordsClient } from "@/systems/doc-transmission/components/DocRecordsClient";
import { DOC_CATEGORY_BY_SLUG } from "@/systems/doc-transmission/lib/doc-types";

export const dynamic = "force-dynamic";

export default async function DocRecordsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = DOC_CATEGORY_BY_SLUG[slug];
  if (!category) notFound();

  const session = await getSession();
  if (!session) redirect("/login");
  const scope = await getDocTransmissionDataScope(session.sub);

  const departments = await prisma.docTransmissionDepartment.findMany({
    where: { ownerUserId: session.sub, trialSessionId: scope.trialSessionId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, code: true, name: true },
  });

  return <DocRecordsClient categorySlug={slug} departments={departments} />;
}
