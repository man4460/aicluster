import { NextResponse } from "next/server";
import { requireModuleApi } from "@/lib/modules/guard";
import { SMART_POLICE_MODULE_SLUG } from "@/lib/modules/config";
import { prisma } from "@/lib/prisma";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { mapSuspectAddress } from "@/lib/smart-police/investigation/serialize";
import { ADDRESS_KINDS } from "@/lib/smart-police/investigation/types";

/** POST /api/smart-police/investigation/suspects/[id]/addresses — เพิ่มพิกัดที่อยู่ */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;
  const guard = await requireModuleApi(SMART_POLICE_MODULE_SLUG);
  if (guard) return guard;

  const { id } = await params;
  const suspect = await prisma.smartPoliceSuspect.findFirst({
    where: { id, ownerUserId: gate.ctx.ownerUserId },
    select: { id: true },
  });
  if (!suspect) return NextResponse.json({ error: "ไม่พบบุคคลต้องสงสัย" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const address = typeof body?.address === "string" ? body.address.trim() : "";
  if (!address) return NextResponse.json({ error: "ต้องระบุที่อยู่" }, { status: 400 });

  const kind = typeof body?.kind === "string" && ADDRESS_KINDS.includes(body.kind as never)
    ? (body.kind as string)
    : "HOME";
  const num = (v: unknown) => {
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
    return Number.isFinite(n) ? n : null;
  };

  const created = await prisma.smartPoliceSuspectAddress.create({
    data: {
      suspectId: id,
      kind,
      label: typeof body?.label === "string" && body.label.trim() ? body.label.trim() : null,
      address,
      latitude: num(body?.latitude),
      longitude: num(body?.longitude),
      accuracyM: num(body?.accuracyM) === null ? null : Math.round(num(body?.accuracyM)!),
      source: typeof body?.source === "string" && body.source.trim() ? body.source.trim() : null,
    },
  });

  return NextResponse.json({ address: mapSuspectAddress(created) }, { status: 201 });
}
