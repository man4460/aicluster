"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AppDashboardSection,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  checkBluetoothPermissions,
  discoverThermalPrinters,
  hasNativeBluetoothPermissionPlugin,
  isNativeThermalPrinterAvailable,
  openNativeAppPermissionSettings,
  printThermalTestSlip,
  requestThermalPrinterPermissions,
  type DiscoveredThermalPrinter,
} from "@/lib/native/thermal-printer";

const backLinkClass = cn(
  appTemplateOutlineButtonClass,
  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 py-2 text-sm font-semibold sm:min-h-0 sm:min-w-0 sm:px-4 sm:py-2.5",
);

export function ThermalPrinterTestClient() {
  const native = typeof window !== "undefined" && isNativeThermalPrinterAvailable();
  const permPluginReady = typeof window !== "undefined" && hasNativeBluetoothPermissionPlugin();
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string>("");
  const [printers, setPrinters] = useState<DiscoveredThermalPrinter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function onRequestPerms() {
    setBusy(true);
    setLog("กำลังขอสิทธิ์จากระบบ…");
    try {
      const status = await requestThermalPrinterPermissions((msg) => setLog(msg));
      setLog(`อนุญาตแล้ว (Android SDK ${status.sdk ?? "?"}) — พร้อมสแกน Bluetooth`);
    } catch (e) {
      setLog(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onCheckPerms() {
    setBusy(true);
    setLog("กำลังตรวจสถานะสิทธิ์…");
    try {
      const s = await checkBluetoothPermissions();
      setLog(
        `สถานะสิทธิ์: ${s.ok ? "พร้อมใช้" : "ยังไม่ครบ"} · SDK ${s.sdk ?? "?"} · scan=${s.bluetoothScan ?? "?"} · connect=${s.bluetoothConnect ?? "?"} · ตำแหน่ง=${s.location ?? "?"}`,
      );
    } catch (e) {
      setLog(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onOpenSettings() {
    setBusy(true);
    try {
      await openNativeAppPermissionSettings();
      setLog("เปิดหน้าตั้งค่าแอปแล้ว — อนุญาต「อุปกรณ์ใกล้เคียง」หรือ「ตำแหน่ง」แล้วกลับมากดขอสิทธิ์อีกครั้ง");
    } catch (e) {
      setLog(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onScan() {
    setBusy(true);
    setLog("กำลังสแกน…");
    try {
      const list = await discoverThermalPrinters(15000);
      setPrinters(list);
      setSelectedId(list[0]?.id ?? null);
      setLog(
        list.length
          ? `พบ ${list.length} เครื่อง — เลือกแล้วกดพิมพ์ทดสอบ`
          : "ไม่พบเครื่อง — เปิด MP210, จับคู่ Bluetooth ในตั้งค่ามือถือ, แล้วกดสแกนใหม่",
      );
    } catch (e) {
      setLog(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onTestPrint() {
    if (!selectedId) {
      setLog("เลือกเครื่องก่อน");
      return;
    }
    setBusy(true);
    setLog("กำลังพิมพ์…");
    try {
      await printThermalTestSlip(selectedId);
      setLog("พิมพ์ทดสอบสำเร็จ");
    } catch (e) {
      setLog(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppDashboardSection tone="violet" className="space-y-4">
      <AppSectionHeader
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
        actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        title="ทดสอบเครื่องพิมพ์ Bluetooth"
        description="ใช้ได้เฉพาะแอป Android MAWELL (ไม่ใช่ Chrome) · รุ่นแนะนำ MP210 (BLE)"
        action={
          <Link href="/dashboard" aria-label="กลับหน้าหลัก" className={backLinkClass}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              className="h-5 w-5 sm:mr-1.5"
              aria-hidden
            >
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">กลับหน้าหลัก</span>
          </Link>
        }
      />

      {!native ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
          ตอนนี้อยู่ในเบราว์เซอร์ — พิมพ์บลูทูธไม่ได้ เปิดผ่านแอป MAWELL แล้วเข้า{" "}
          <span className="font-mono text-xs">/dashboard/printer-test</span>
        </p>
      ) : permPluginReady ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900">
          โหมดแอป native พร้อมทดสอบ
        </p>
      ) : (
        <p className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
          แอปเวอร์ชันเก่า — ยังไม่มีตัวขอสิทธิ์ Bluetooth ในตัว ให้ติดตั้ง APK เวอร์ชันใหม่จาก{" "}
          <span className="font-mono text-xs">/download-app</span>
        </p>
      )}

      <div className="rounded-2xl border border-[#e8e6fc] bg-white/80 px-4 py-3 text-sm text-[#5f5a8a]">
        <p className="font-black text-[#2e2a58]">วิธีตั้งค่า MP210 (ทีละขั้น)</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs sm:text-sm">
          <li>เปิดเครื่องพิมพ์ MP210 ให้ไฟ Bluetooth พร้อมจับคู่</li>
          <li>
            มือถือ: <strong>ตั้งค่า → Bluetooth</strong> → จับคู่กับ MP210 (ครั้งแรก)
          </li>
          <li>เปิดแอป <strong>MAWELL</strong> (ไม่ใช่ Chrome) → เข้าเมนูทดสอบพิมพ์</li>
          <li>กด <strong>ขอสิทธิ์ Bluetooth</strong> → อนุญาตเมื่อระบบถาม (Android 12+ = อุปกรณ์ใกล้เคียง · Android เก่า = ตำแหน่ง)</li>
          <li>ถ้าไม่มีหน้าต่างถาม → กด <strong>เปิดตั้งค่าสิทธิ์แอป</strong> แล้วอนุญาตเอง</li>
          <li>กด <strong>สแกนหาเครื่อง</strong> → แตะเลือก MP210 ในรายการ</li>
          <li>กด <strong>พิมพ์ทดสอบ</strong></li>
        </ol>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!native || busy}
          onClick={() => void onRequestPerms()}
          className={cn(appTemplateOutlineButtonClass, "min-h-10 px-4 disabled:opacity-50")}
        >
          1) ขอสิทธิ์ Bluetooth
        </button>
        <button
          type="button"
          disabled={!native || busy}
          onClick={() => void onCheckPerms()}
          className={cn(appTemplateOutlineButtonClass, "min-h-10 px-4 disabled:opacity-50")}
        >
          ตรวจสถานะสิทธิ์
        </button>
        <button
          type="button"
          disabled={!native || busy}
          onClick={() => void onOpenSettings()}
          className={cn(appTemplateOutlineButtonClass, "min-h-10 px-4 disabled:opacity-50")}
        >
          เปิดตั้งค่าสิทธิ์แอป
        </button>
        <button
          type="button"
          disabled={!native || busy}
          onClick={() => void onScan()}
          className={cn(appTemplateOutlineButtonClass, "min-h-10 px-4 disabled:opacity-50")}
        >
          2) สแกนหาเครื่อง
        </button>
        <button
          type="button"
          disabled={!native || busy || !selectedId}
          onClick={() => void onTestPrint()}
          className="app-btn-primary min-h-10 px-4 disabled:opacity-50"
        >
          3) พิมพ์ทดสอบ
        </button>
      </div>

      {printers.length > 0 ? (
        <ul className="space-y-2" role="listbox" aria-label="รายการเครื่องพิมพ์">
          {printers.map((p) => {
            const active = p.id === selectedId;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition",
                    active
                      ? "border-[#5b61ff]/45 bg-[#5b61ff]/10 text-[#2e2a58]"
                      : "border-white/70 bg-white/85 text-[#5f5a8a] hover:border-[#5b61ff]/25",
                  )}
                  onClick={() => setSelectedId(p.id)}
                >
                  <span>{p.name}</span>
                  {p.transport ? (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#8b87a8]">
                      {p.transport}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {log ? (
        <p className="rounded-xl border border-[#e8e6fc] bg-[#faf9ff] px-3 py-2 text-sm font-medium text-[#4d47b6]" role="status">
          {log}
        </p>
      ) : null}
    </AppDashboardSection>
  );
}
