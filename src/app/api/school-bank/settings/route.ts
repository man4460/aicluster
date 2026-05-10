import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSchoolBankOwnerContext } from "@/systems/school-bank/lib/school-bank-api-auth";

export async function PATCH(req: Request) {
  const ctx = await getSchoolBankOwnerContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { displayName?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const displayName = (body.displayName ?? "").trim();
  if (!displayName || displayName.length > 120) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }

  await prisma.schoolBankSettings.update({
    where: { id: ctx.settings.id },
    data: { displayName },
  });

  return NextResponse.json({ ok: true, displayName });
}
