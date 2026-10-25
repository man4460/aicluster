import { NextResponse } from "next/server";
import { withSmartPoliceOwner } from "@/lib/smart-police/api-route";
import { readSheetLayoutFile, writeSheetLayoutFile } from "@/lib/smart-police/sheet-layout-store";
import type { SheetLayout } from "@/lib/smart-police/form-templates/sheet-layout";

export async function GET(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;

  const slug = (new URL(req.url).searchParams.get("slug") ?? "").trim();
  if (!slug) return NextResponse.json({ error: "ต้องระบุ slug" }, { status: 400 });

  const layout = await readSheetLayoutFile(gate.ctx.ownerUserId, slug);
  return NextResponse.json(
    { layout },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}

export async function POST(req: Request) {
  const gate = await withSmartPoliceOwner();
  if (!gate.ok) return gate.res;

  const body = (await req.json().catch(() => null)) as
    | { slug?: string; layout?: Partial<SheetLayout> }
    | null;
  const slug = (body?.slug ?? "").trim();
  if (!slug || !body?.layout) {
    return NextResponse.json({ error: "ต้องระบุ slug และ layout" }, { status: 400 });
  }

  const layout: SheetLayout = {
    offsets: body.layout.offsets ?? {},
    texts: body.layout.texts ?? {},
    lines: body.layout.lines ?? [],
    hidden: body.layout.hidden ?? [],
  };
  await writeSheetLayoutFile(gate.ctx.ownerUserId, slug, layout);
  return NextResponse.json({ ok: true });
}
