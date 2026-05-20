import { NextResponse } from "next/server";
import {
  getEcommerceCnameTargetHost,
  normalizeEcommerceCustomDomainInput,
  validateEcommerceCustomDomainInput,
} from "@/lib/ecommerce/custom-domain";
import { getOrCreateEcommerceStore } from "@/lib/ecommerce/api-owner";
import { prisma } from "@/lib/prisma";
import { withEcommerceStoreOwnerContext } from "@/systems/ecommerce-store/lib/api-auth";

/** ยืนยันโดเมนหลังตั้งค่า DNS/CNAME แล้ว (Merchant กดยืนยันเมื่อพร้อม) */
export async function POST() {
  const auth = await withEcommerceStoreOwnerContext();
  if (!auth.ok) return auth.res;

  const store = await getOrCreateEcommerceStore(auth.ctx.ownerUserId);
  const domain = normalizeEcommerceCustomDomainInput(store.customDomain ?? "");
  const domainErr = validateEcommerceCustomDomainInput(domain);
  if (domainErr) {
    return NextResponse.json({ error: domainErr }, { status: 400 });
  }

  const updated = await prisma.ecommerceStore.update({
    where: { id: store.id },
    data: {
      customDomain: domain,
      customDomainVerified: true,
    },
  });

  return NextResponse.json({
    store: updated,
    hint: `ชี้ CNAME โดเมน ${domain} มาที่ ${getEcommerceCnameTargetHost()} แล้วเปิด https://${domain}`,
  });
}
