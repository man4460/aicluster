import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { stopTrial } from "@/lib/modules/trial-store";

type Params = { params: Promise<{ moduleId: string }> };

export async function DELETE(_: Request, { params }: Params) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { moduleId } = await params;
  if (!moduleId) return NextResponse.json({ error: "moduleId ไม่ถูกต้อง" }, { status: 400 });
  await stopTrial(auth.session.sub, moduleId);
  return NextResponse.json({ ok: true });
}

