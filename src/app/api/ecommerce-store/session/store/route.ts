import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { requireModulePage } from "@/lib/modules/guard";
import { ECOMMERCE_STORE_MODULE_SLUG } from "@/lib/modules/config";
import { getEcommerceOwnerFromAuth, getOrCreateEcommerceStore } from "@/lib/ecommerce/api-owner";
import { prisma } from "@/lib/prisma";
import { ecommercePublicShopUrl } from "@/lib/ecommerce/constants";
import {
  getEcommerceCnameTargetHost,
  normalizeEcommerceCustomDomainInput,
  validateEcommerceCustomDomainInput,
} from "@/lib/ecommerce/custom-domain";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireModulePage(ECOMMERCE_STORE_MODULE_SLUG);
  const owner = await getEcommerceOwnerFromAuth(session.sub);
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await getOrCreateEcommerceStore(owner.ownerUserId);
  return NextResponse.json({
    store: {
      ...store,
      publicShopPath: ecommercePublicShopUrl(store.id),
    },
    cnameTarget: getEcommerceCnameTargetHost(),
  });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await requireModulePage(ECOMMERCE_STORE_MODULE_SLUG);
  const owner = await getEcommerceOwnerFromAuth(session.sub);
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const store = await getOrCreateEcommerceStore(owner.ownerUserId);

  const data: Record<string, unknown> = {};
  const str = (k: string) => (typeof body[k] === "string" ? String(body[k]).trim() : undefined);
  if (body.storeName !== undefined) data.storeName = str("storeName") || store.storeName;
  if (body.description !== undefined) data.description = str("description") || null;
  if (body.logoUrl !== undefined) data.logoUrl = str("logoUrl") || null;
  if (body.promptPayPhone !== undefined) data.promptPayPhone = str("promptPayPhone") || null;
  if (body.bankName !== undefined) data.bankName = str("bankName") || null;
  if (body.bankAccountName !== undefined) data.bankAccountName = str("bankAccountName") || null;
  if (body.bankAccountNumber !== undefined) data.bankAccountNumber = str("bankAccountNumber") || null;
  if (body.paymentNote !== undefined) data.paymentNote = str("paymentNote") || null;
  if (body.customDomain !== undefined) {
    const raw = str("customDomain");
    const nextDomain = raw ? normalizeEcommerceCustomDomainInput(raw) : null;
    if (nextDomain) {
      const domainErr = validateEcommerceCustomDomainInput(nextDomain);
      if (domainErr) return NextResponse.json({ error: domainErr }, { status: 400 });
    }
    const prevDomain = store.customDomain ? normalizeEcommerceCustomDomainInput(store.customDomain) : null;
    data.customDomain = nextDomain || null;
    if (nextDomain !== prevDomain) {
      data.customDomainVerified = false;
    }
  }
  if (typeof body.salePageEnabled === "boolean") data.salePageEnabled = body.salePageEnabled;
  if (typeof body.merchantPaused === "boolean") data.merchantPaused = body.merchantPaused;
  if (typeof body.lowStockThreshold === "number" && Number.isFinite(body.lowStockThreshold)) {
    data.lowStockThreshold = Math.max(0, Math.floor(body.lowStockThreshold));
  }
  if (body.featuredProductId !== undefined) {
    data.featuredProductId = typeof body.featuredProductId === "string" ? body.featuredProductId : null;
  }

  const updated = await prisma.ecommerceStore.update({
    where: { id: store.id },
    data,
  });

  return NextResponse.json({
    store: { ...updated, publicShopPath: ecommercePublicShopUrl(updated.id) },
  });
}
