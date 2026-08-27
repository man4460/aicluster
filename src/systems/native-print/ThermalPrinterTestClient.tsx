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
      setLog("อนุญาตสิทธิ์แล้ว — Bluetooth พร้อม");
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
        title="ทดสอบเครื่องพิมพ์ Bluetooth"
        description="ใช้ได้เฉพาะแอป Android MAWELL (ไม่ใช่ Chrome) · รุ่นแนะนำ MP210 (BLE)"
      />

      {!native ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
          ตอนนี้อยู่ในเบราว์เซอร์ — พิมพ์บลูทูธไม่ได้ เปิดผ่านแอป MAWELL แล้วเข้า{" "}
          <span className="font-mono text-xs">/dashboard/printer-test</span>
        </p>
      ) : (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900">
          โหมดแอป native พร้อมทดสอบ
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
          <li>กด <strong>ขอสิทธิ์ Bluetooth</strong> → อนุญาตเมื่อระบบถาม</li>
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
