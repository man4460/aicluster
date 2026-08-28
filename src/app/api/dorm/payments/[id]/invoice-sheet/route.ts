import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { withDormitoryOwnerOrStaffContext } from "@/lib/dormitory/api-auth";
import { getDormInvoiceSheetDto } from "@/lib/dormitory/dorm-invoice-sheet";

type Ctx = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function requestBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function GET(req: Request, ctx: Ctx) {
  const auth = await withDormitoryOwnerOrStaffContext(req);
  if (!auth.ok) return auth.res;

  const id = parseId((await ctx.params).id);
  if (!id) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const baseUrl = await requestBaseUrl();
  const sheet = await getDormInvoiceSheetDto(id, auth.ctx.ownerUserId, baseUrl);
  if (!sheet) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  return NextResponse.json({ sheet });
}
