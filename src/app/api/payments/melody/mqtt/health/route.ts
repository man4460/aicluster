import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getMelodyMqttBridge } from "@/lib/integrations/melody-mqtt";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const mqtt = getMelodyMqttBridge();
  mqtt.ensureStarted();
  return NextResponse.json(mqtt.getHealth());
}

