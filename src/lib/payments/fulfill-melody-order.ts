import { prisma } from "@/lib/prisma";
import { fulfillTopUpOrder } from "@/lib/payments/fulfill-top-up";

type MelodyOrderKind = "TOKEN_TOPUP" | "PLAN_SUBSCRIPTION";

function getOrderKind(meta: unknown): MelodyOrderKind {
  if (meta && typeof meta === "object" && (meta as { kind?: unknown }).kind === "TOKEN_TOPUP") {
    return "TOKEN_TOPUP";
  }
  return "PLAN_SUBSCRIPTION";
}

export async function fulfillMelodyOrder(
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const order = await prisma.topUpOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      userId: true,
      tokensToDeduct: true,
      melodyMeta: true,
    },
  });
  if (!order) return { ok: false, error: "ไม่พบคำสั่งซื้อ" };
  if (order.status === "PAID") return { ok: true };

  const kind = getOrderKind(order.melodyMeta);
  if (kind !== "TOKEN_TOPUP") {
    return await fulfillTopUpOrder(orderId);
  }

  const add = order.tokensToDeduct;
  if (!Number.isInteger(add) || add <= 0) {
    await prisma.topUpOrder.update({
      where: { id: orderId },
      data: { status: "FAILED" },
    });
    return { ok: false, error: "ยอดเติมโทเคนไม่ถูกต้อง" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const latest = await tx.topUpOrder.findUnique({
        where: { id: orderId },
        select: { status: true, userId: true, tokensToDeduct: true },
      });
      if (!latest || latest.status !== "PENDING") return;
      await tx.topUpOrder.update({
        where: { id: orderId },
        data: { status: "PAID" },
      });
      await tx.user.update({
        where: { id: latest.userId },
        data: { tokens: { increment: latest.tokensToDeduct } },
      });
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "อัปเดตไม่สำเร็จ" };
  }
}

