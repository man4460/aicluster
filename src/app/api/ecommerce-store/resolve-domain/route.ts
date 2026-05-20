import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeEcommerceHostname } from "@/lib/ecommerce/custom-domain";

/** Proxy / DNS — แปลง hostname → storeId */
export async function GET(req: Request) {
  const host = normalizeEcommerceHostname(new URL(req.url).searchParams.get("host"));
  if (!host) {
    return NextResponse.json({ storeId: null });
  }

  const store = await prisma.ecommerceStore.findFirst({
    where: {
      customDomainVerified: true,
      OR: [{ customDomain: host }, { customDomain: `www.${host}` }],
    },
    select: { id: true },
  });

  return NextResponse.json({ storeId: store?.id ?? null });
}
