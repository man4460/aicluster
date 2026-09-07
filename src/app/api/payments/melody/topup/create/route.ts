import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { verifyPassword } from "@/lib/auth/password";
import { getMelodyMqttBridge, melodyMqttCompactRefs } from "@/lib/integrations/melody-mqtt";

const bodySchema = z.object({
  amountBaht: z.number().int().min(1).max(100000),
  /** ชั้นที่ 2 — ยืนยันรหัสผ่านบัญชีก่อนสร้าง QR */
  accountPassword: z.string().min(1).max(128),
});

export async function POST(req: Request) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "กรุณาระบุยอด 1-100000 บาท และรหัสผ่านบัญชี" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.session.sub },
    select: { passwordHash: true },
  });
  if (!user) {
    return NextResponse.json({ error: "ไม่พบบัญชี" }, { status: 404 });
  }
  if (!user.passwordHash?.trim()) {
    return NextResponse.json(
      {
        error:
          "บัญชีนี้ยังไม่มีรหัสผ่าน — ตั้งรหัสผ่านบัญชีก่อน (หรือให้แอดมินตั้ง) เพื่อยืนยันชั้นที่ 2 ก่อนสร้าง QR",
      },
      { status: 400 },
    );
  }
  const passwordOk = await verifyPassword(parsed.data.accountPassword, user.passwordHash);
  if (!passwordOk) {
    return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 403 });
  }

  const amountBaht = parsed.data.amountBaht;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  const orderId = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  const refs = melodyMqttCompactRefs(orderId, auth.session.sub);
  const order = await prisma.topUpOrder.create({
    data: {
      id: orderId,
      userId: auth.session.sub,
      planPriceKey: amountBaht,
      tokensToDeduct: amountBaht,
      status: "PENDING",
      melodyMeta: {
        kind: "TOKEN_TOPUP",
        source: "dashboard_topup",
        expiresAt: expiresAt.toISOString(),
        mqttDeviceId: refs.deviceId,
        mqttOrderNo: refs.mchOrderNo,
        security: { accountPasswordVerifiedAt: new Date().toISOString() },
      },
    },
  });

  const mqtt = getMelodyMqttBridge();
  mqtt.ensureStarted();
  let qrCodeContent: string | null = null;
  if (mqtt.enabled) {
    try {
      qrCodeContent = await mqtt.createTopupQr({
        orderId: order.id,
        userId: auth.session.sub,
        amountBaht,
      });
    } catch (e) {
      console.error("[melody/topup/create] mqtt qrgen failed", e);
      await prisma.topUpOrder.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });
      return NextResponse.json(
        { error: "สร้าง QR ชำระเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({
    orderId: order.id,
    amountBaht,
    tokensToAdd: amountBaht,
    paymentMethod: mqtt.enabled ? "MQTT_QR" : "WEBHOOK",
    qrCodeContent,
    expiresAt: expiresAt.toISOString(),
  });
}
