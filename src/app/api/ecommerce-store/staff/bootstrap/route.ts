import { NextResponse } from "next/server";
import { requireEcommerceStaff } from "@/lib/ecommerce/staff-auth";
import { getOrCreateEcommerceStore } from "@/lib/ecommerce/api-owner";
import { ecommercePublicShopUrl } from "@/lib/ecommerce/constants";
import { ECOMMERCE_STORE_MODULE_SLUG } from "@/lib/modules/config";
import { ensureOwnerModuleDailyChargeOnPublicUse } from "@/lib/modules/public-portal-access";

export async function GET(req: Request) {
  const auth = await requireEcommerceStaff(req);
  if ("error" in auth) return auth.error;
  const { ctx } = auth;

  const charge = await ensureOwnerModuleDailyChargeOnPublicUse(ctx.ownerId, ECOMMERCE_STORE_MODULE_SLUG);
  if (!charge.ok) {
    return NextResponse.json({ error: "ลิงก์ปิดชั่วคราว" }, { status: 403 });
  }

  const store = await getOrCreateEcommerceStore(ctx.ownerId, ctx.trialSessionId);
  const shopLabel = store.storeName?.trim() || "ร้านออนไลน์";
  const publicShopPath = ecommercePublicShopUrl(store.id);

  return NextResponse.json({
    ok: true,
    shopLabel,
    logoUrl: store.logoUrl,
    storeId: store.id,
    publicShopPath,
    publicShopUrl:
      typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL.trim()
        ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}${publicShopPath}`
        : publicShopPath,
    trialSessionId: ctx.trialSessionId,
    menus: [
      { key: "overview", label: "ภาพรวม" },
      { key: "orders", label: "ออเดอร์ออนไลน์" },
      { key: "pos", label: "ขายหน้าร้าน" },
      { key: "web", label: "เว็บร้าน" },
    ],
  });
}
