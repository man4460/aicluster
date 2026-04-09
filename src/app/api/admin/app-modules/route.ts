import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status });

  const modules = await prisma.appModule.findMany({
    orderBy: [{ groupId: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      groupId: true,
      cardImageUrl: true,
      isActive: true,
    },
  });

  return NextResponse.json({ modules });
}
