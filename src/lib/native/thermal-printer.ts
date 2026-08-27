import { Capacitor } from "@capacitor/core";

export type DiscoveredThermalPrinter = {
  id: string;
  name: string;
  transport?: string;
};

function errMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return e instanceof Error ? e.message : String(e);
}

/** รันในแอป Capacitor (Android / iOS) เท่านั้น — เว็บเบราว์เซอร์คืน false */
export function isNativeThermalPrinterAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

async function loadPlugin() {
  const mod = await import("@delicity/capacitor-thermal-printer");
  return mod.ThermalPrinter;
}

export async function requestThermalPrinterPermissions(): Promise<void> {
  const ThermalPrinter = await loadPlugin();
  const bt = await ThermalPrinter.isBluetoothEnabled().catch(() => ({ enabled: false }));
  if (!bt.enabled) {
    throw new Error("ยังไม่ได้เปิด Bluetooth บนมือถือ — เปิด Bluetooth แล้วลองใหม่");
  }
  await ThermalPrinter.requestPermissions();
}

export async function discoverThermalPrinters(timeoutMs = 12000): Promise<DiscoveredThermalPrinter[]> {
  const ThermalPrinter = await loadPlugin();
  await requestThermalPrinterPermissions();
  const { printers } = await ThermalPrinter.discoverPrinters({ timeoutMs });
  return (printers ?? []).map((p) => ({
    id: p.id,
    name: p.name ?? p.id,
    transport: typeof p.transport === "string" ? p.transport : undefined,
  }));
}

export async function printThermalTestSlip(printerId: string): Promise<void> {
  const ThermalPrinter = await loadPlugin();
  try {
    await ThermalPrinter.connectPrinter({ printerId }).catch(() => undefined);
    await ThermalPrinter.printText({
      printerId,
      items: [
        {
          type: "text",
          value: "MAWELL",
          style: { align: "center", bold: true, widthMultiplier: 2, heightMultiplier: 2 },
        },
        { type: "text", value: "ทดสอบพิมพ์ Bluetooth", style: { align: "center" } },
        {
          type: "text",
          value: `เวลา: ${new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}`,
          style: { align: "center" },
        },
        { type: "text", value: "MP210 / ESC-POS", style: { align: "center" } },
        { type: "feed", lines: 3 },
        { type: "cut" },
      ],
    });
  } catch (e) {
    const msg = errMessage(e) || "พิมพ์ไม่สำเร็จ";
    if (/PAIRING|pair/i.test(msg)) {
      throw new Error("ต้องจับคู่ Bluetooth กับ MP210 ในการตั้งค่ามือถือก่อน แล้วค่อยสแกนในแอป");
    }
    throw new Error(msg);
  }
}
