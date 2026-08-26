"use client";

import { useState } from "react";
import {
  AppDashboardSection,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  discoverThermalPrinters,
  isNativeThermalPrinterAvailable,
  printThermalTestSlip,
  requestThermalPrinterPermissions,
  type DiscoveredThermalPrinter,
} from "@/lib/native/thermal-printer";

export function ThermalPrinterTestClient() {
  const native = typeof window !== "undefined" && isNativeThermalPrinterAvailable();
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string>("");
  const [printers, setPrinters] = useState<DiscoveredThermalPrinter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function onRequestPerms() {
    setBusy(true);
    setLog("");
    try {
      await requestThermalPrinterPermissions();
      setLog("อนุญาตสิทธิ์แล้ว");
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
      const list = await discoverThermalPrinters(12000);
      setPrinters(list);
      setSelectedId(list[0]?.id ?? null);
      setLog(list.length ? `พบ ${list.length} เครื่อง` : "ไม่พบเครื่อง — เปิด MP210 แล้วลองใหม่");
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
        title="ทดสอบเครื่องพิมพ์ Bluetooth"
        description="สำหรับแอป Capacitor + MP210 (BLE) — เว็บเบราว์เซอร์พิมพ์บลูทูธตรง ๆ ไม่ได้"
      />

      {!native ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
          เปิดหน้านี้อยู่ในเบราว์เซอร์ — ต้องรันผ่านแอป Android/iOS (Capacitor) ถึงจะสแกน/พิมพ์ได้
        </p>
      ) : (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900">
          โหมดแอป native พร้อมทดสอบ
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!native || busy}
          onClick={() => void onRequestPerms()}
          className={cn(appTemplateOutlineButtonClass, "min-h-10 px-4 disabled:opacity-50")}
        >
          ขอสิทธิ์ Bluetooth
        </button>
        <button
          type="button"
          disabled={!native || busy}
          onClick={() => void onScan()}
          className={cn(appTemplateOutlineButtonClass, "min-h-10 px-4 disabled:opacity-50")}
        >
          สแกนหาเครื่อง
        </button>
        <button
          type="button"
          disabled={!native || busy || !selectedId}
          onClick={() => void onTestPrint()}
          className="app-btn-primary min-h-10 px-4 disabled:opacity-50"
        >
          พิมพ์ทดสอบ
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
                    "w-full rounded-2xl border px-4 py-3 text-left text-sm",
                    active
                      ? "border-[#0000BF]/50 bg-[#0000BF]/10"
                      : "border-white/60 bg-white/70",
                  )}
                  onClick={() => setSelectedId(p.id)}
                >
                  <span className="font-semibold text-[#1e1b4b]">{p.name}</span>
                  {p.transport ? (
                    <span className="mt-0.5 block text-xs text-[#66638c]">{p.transport}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {log ? (
        <pre className="overflow-x-auto rounded-2xl border border-white/50 bg-white/60 p-3 text-xs text-[#1e1b4b]">
          {log}
        </pre>
      ) : null}
    </AppDashboardSection>
  );
}
