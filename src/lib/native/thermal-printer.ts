import { Capacitor, registerPlugin } from "@capacitor/core";

export type DiscoveredThermalPrinter = {
  id: string;
  name: string;
  transport?: string;
};

export type BluetoothPermissionStatus = {
  ok?: boolean;
  sdk?: number;
  bluetoothScan?: string;
  bluetoothConnect?: string;
  location?: string;
  launched?: boolean;
};

type MawellBluetoothPermissionsPlugin = {
  check: () => Promise<BluetoothPermissionStatus>;
  request: () => Promise<BluetoothPermissionStatus>;
  requestLegacy: () => Promise<BluetoothPermissionStatus>;
  openAppSettings: () => Promise<void>;
};

const BT_PERMS_PLUGIN_NAME = "MawellBluetoothPermissions";

const MawellBluetoothPermissions = registerPlugin<MawellBluetoothPermissionsPlugin>(BT_PERMS_PLUGIN_NAME);

function errMessage(e: unknown): string {
  if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return e instanceof Error ? e.message : String(e);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** กันปลั๊กอิน native ค้างไม่ตอบกลับ — UI ต้องไม่แข็งค้างเสมอ */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} ไม่ตอบสนองภายใน ${Math.round(ms / 1000)} วินาที`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/** รันในแอป Capacitor (Android / iOS) เท่านั้น — เว็บเบราว์เซอร์คืน false */
export function isNativeThermalPrinterAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

/** APK ที่มีปลั๊กอินขอสิทธิ์ของเรา (1.0.4 ขึ้นไป) */
export function hasNativeBluetoothPermissionPlugin(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable(BT_PERMS_PLUGIN_NAME);
}

async function loadPlugin() {
  const mod = await import("@delicity/capacitor-thermal-printer");
  return mod.ThermalPrinter;
}

export async function openNativeAppPermissionSettings(): Promise<void> {
  if (!hasNativeBluetoothPermissionPlugin()) {
    throw new Error("ต้องอัปเดตแอป MAWELL เป็นเวอร์ชันใหม่ก่อน จึงจะเปิดหน้าตั้งค่าสิทธิ์ได้");
  }
  await withTimeout(MawellBluetoothPermissions.openAppSettings(), 8000, "เปิดตั้งค่าแอป");
}

export async function checkBluetoothPermissions(): Promise<BluetoothPermissionStatus> {
  if (!hasNativeBluetoothPermissionPlugin()) return {};
  return withTimeout(MawellBluetoothPermissions.check(), 8000, "ตรวจสถานะสิทธิ์");
}

function describeStatus(status: BluetoothPermissionStatus): string {
  const sdk = status.sdk ?? 0;
  if (sdk > 0 && sdk < 31) {
    return `ตำแหน่ง=${status.location ?? "?"}`;
  }
  return `scan=${status.bluetoothScan ?? "?"}, connect=${status.bluetoothConnect ?? "?"}`;
}

/**
 * ขอสิทธิ์แล้ว **วนเช็คสถานะจริง** ควบคู่กัน — ถ้าไดอะล็อกไม่ตอบกลับ (ปลั๊กอินค้าง)
 * จะยิงคำขอทางสำรองแล้ววนเช็คต่อ ไม่ปล่อยให้ UI ค้างที่ "กำลังขอสิทธิ์"
 */
export async function requestThermalPrinterPermissions(
  onProgress?: (message: string) => void,
): Promise<BluetoothPermissionStatus> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("ต้องเปิดในแอป MAWELL (ไม่ใช่เบราว์เซอร์)");
  }

  const ThermalPrinter = await loadPlugin();
  const bt = await withTimeout(ThermalPrinter.isBluetoothEnabled(), 8000, "ตรวจสถานะ Bluetooth").catch(() => ({
    enabled: false,
  }));
  if (!bt.enabled) {
    throw new Error("ยังไม่ได้เปิด Bluetooth บนมือถือ — เปิด Bluetooth แล้วลองใหม่");
  }

  if (!hasNativeBluetoothPermissionPlugin()) {
    onProgress?.("แอปเวอร์ชันเก่า — ขอสิทธิ์ผ่านปลั๊กอินพิมพ์");
    await withTimeout(ThermalPrinter.requestPermissions(), 45000, "ขอสิทธิ์ Bluetooth");
    return { ok: true };
  }

  const already = await checkBluetoothPermissions();
  if (already.ok) return already;

  let requestError: string | null = null;
  let requestDone = false;
  onProgress?.("เปิดหน้าต่างขออนุญาตของระบบ…");
  void MawellBluetoothPermissions.request()
    .catch((e: unknown) => {
      requestError = errMessage(e);
    })
    .finally(() => {
      requestDone = true;
    });

  const deadline = Date.now() + 60000;
  let legacyTried = false;
  let lastStatus: BluetoothPermissionStatus = already;

  while (Date.now() < deadline) {
    await sleep(700);
    lastStatus = await checkBluetoothPermissions().catch(() => lastStatus);
    if (lastStatus.ok) return lastStatus;

    // ไดอะล็อกไม่ขึ้น / ปลั๊กอินไม่ตอบภายใน 6 วินาที → ยิงคำขอทางสำรอง
    const elapsed = 60000 - (deadline - Date.now());
    if (!legacyTried && (requestDone || elapsed > 6000)) {
      legacyTried = true;
      onProgress?.("ลองขอสิทธิ์ด้วยวิธีสำรอง…");
      await MawellBluetoothPermissions.requestLegacy().catch((e: unknown) => {
        requestError = requestError ?? errMessage(e);
      });
      continue;
    }

    // ผู้ใช้กดปฏิเสธ (คำขอจบแล้วแต่ยังไม่ได้สิทธิ์ และลองสำรองแล้ว)
    if (requestDone && legacyTried && elapsed > 12000) break;
  }

  const detail = describeStatus(lastStatus);
  if (requestError) {
    throw new Error(`ขอสิทธิ์ไม่สำเร็จ: ${requestError} (${detail})`);
  }
  throw new Error(
    `ยังไม่ได้รับสิทธิ์ Bluetooth (${detail}) — กด「เปิดตั้งค่าสิทธิ์แอป」แล้วอนุญาต${
      (lastStatus.sdk ?? 31) < 31 ? "「ตำแหน่ง」" : "「อุปกรณ์ใกล้เคียง」"
    }ด้วยตัวเอง`,
  );
}

export async function discoverThermalPrinters(timeoutMs = 12000): Promise<DiscoveredThermalPrinter[]> {
  const ThermalPrinter = await loadPlugin();
  await requestThermalPrinterPermissions();
  const { printers } = await withTimeout(
    ThermalPrinter.discoverPrinters({ timeoutMs }),
    timeoutMs + 15000,
    "สแกนหาเครื่องพิมพ์",
  );
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
    await withTimeout(
      ThermalPrinter.printText({
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
      }),
      40000,
      "พิมพ์ทดสอบ",
    );
  } catch (e) {
    const msg = errMessage(e) || "พิมพ์ไม่สำเร็จ";
    if (/PAIRING|pair/i.test(msg)) {
      throw new Error("ต้องจับคู่ Bluetooth กับ MP210 ในการตั้งค่ามือถือก่อน แล้วค่อยสแกนในแอป");
    }
    throw new Error(msg);
  }
}
