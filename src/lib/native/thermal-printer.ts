import { Capacitor, registerPlugin } from "@capacitor/core";

export type DiscoveredThermalPrinter = {
  id: string;
  name: string;
  transport?: string;
};

type BtPermStatus = {
  ok?: boolean;
  sdk?: number;
  bluetoothScan?: string;
  bluetoothConnect?: string;
  location?: string;
};

type MawellBluetoothPermissionsPlugin = {
  check: () => Promise<BtPermStatus>;
  request: () => Promise<BtPermStatus>;
  openAppSettings: () => Promise<void>;
};

const MawellBluetoothPermissions = registerPlugin<MawellBluetoothPermissionsPlugin>(
  "MawellBluetoothPermissions",
);

function errMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return e instanceof Error ? e.message : String(e);
}

function isGranted(v: string | undefined): boolean {
  return (v ?? "").toLowerCase() === "granted";
}

/** รันในแอป Capacitor (Android / iOS) เท่านั้น — เว็บเบราว์เซอร์คืน false */
export function isNativeThermalPrinterAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

async function loadPlugin() {
  const mod = await import("@delicity/capacitor-thermal-printer");
  return mod.ThermalPrinter;
}

export async function openNativeAppPermissionSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await MawellBluetoothPermissions.openAppSettings();
}

export async function requestThermalPrinterPermissions(): Promise<BtPermStatus> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("ต้องเปิดในแอป MAWELL (ไม่ใช่เบราว์เซอร์)");
  }

  const ThermalPrinter = await loadPlugin();
  const bt = await ThermalPrinter.isBluetoothEnabled().catch(() => ({ enabled: false }));
  if (!bt.enabled) {
    throw new Error("ยังไม่ได้เปิด Bluetooth บนมือถือ — เปิด Bluetooth แล้วลองใหม่");
  }

  // ขอผ่านปลั๊กอินของเรา — บังคับโชว์ไดอะล็อกระบบ (ตำแหน่งบน Android ≤11 / Nearby บน 12+)
  let status = await MawellBluetoothPermissions.request();

  // สำรอง: เรียกปลั๊กอินพิมพ์ด้วย (Android 12+)
  try {
    await ThermalPrinter.requestPermissions();
    status = await MawellBluetoothPermissions.check();
  } catch {
    /* ignore */
  }

  if (!status.ok) {
    const scan = status.bluetoothScan ?? "?";
    const connect = status.bluetoothConnect ?? "?";
    const location = status.location ?? "?";
    const sdk = status.sdk ?? 0;
    if (sdk > 0 && sdk < 31 && !isGranted(location)) {
      throw new Error(
        "ยังไม่อนุญาตตำแหน่ง (จำเป็นสำหรับสแกน Bluetooth บน Android รุ่นนี้) — กดอนุญาตเมื่อระบบถาม หรือเปิดสิทธิ์ในตั้งค่าแอป",
      );
    }
    throw new Error(
      `ยังไม่อนุญาต Bluetooth (scan=${scan}, connect=${connect}) — กดอนุญาตเมื่อระบบถาม หรือเปิดสิทธิ์「อุปกรณ์ใกล้เคียง」ในตั้งค่าแอป`,
    );
  }

  return status;
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
