"use client";

import { useState } from "react";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";

type Endpoints = { punch: string; roster: string; fingerprint: string };

function CopyBtn({ text, label = "คัดลอก" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={cn(
        appTemplateOutlineButtonClass,
        "inline-flex min-h-[36px] items-center px-2.5 text-[11px] font-bold",
      )}
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setDone(true);
          window.setTimeout(() => setDone(false), 1600);
        });
      }}
    >
      {done ? "คัดลอกแล้ว" : label}
    </button>
  );
}

function CodeBlock({ title, code, hint }: { title: string; code: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-[#d8d6ec]/90 bg-white/70 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-[#2e2a58]">{title}</p>
        <CopyBtn text={code} label="คัดลอกโค้ด" />
      </div>
      {hint ? <p className="mt-1 text-[11px] font-medium text-[#66638c]">{hint}</p> : null}
      <pre className="mt-2 max-h-56 overflow-auto rounded-xl bg-[#1e1b4b] p-3 text-[10px] leading-relaxed text-emerald-50 sm:text-[11px]">
        {code}
      </pre>
    </div>
  );
}

function buildEsp32Sketch(origin: string, punchPath: string, apiKey: string) {
  const base = origin.replace(/\/$/, "");
  const punchUrl = `${base}${punchPath}`;
  return `/*
 * MAWELL Attendance — ESP32 ตัวอย่างเช็คอินด้วยลายนิ้วมือ
 * ไลบรารี: WiFi, HTTPClient (บอร์ด ESP32)
 * แทนที่ WIFI_SSID / WIFI_PASS / DEVICE_API_KEY
 */
#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "YOUR_WIFI";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
const char* DEVICE_API_KEY = "${apiKey}";
const char* PUNCH_URL = "${punchUrl}";

bool punchFingerprint(int slot, bool checkIn) {
  if (WiFi.status() != WL_CONNECTED) return false;
  HTTPClient http;
  http.begin(PUNCH_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + DEVICE_API_KEY);
  // หรือ: http.addHeader("X-Attendance-Device-Key", DEVICE_API_KEY);

  char body[160];
  snprintf(
    body,
    sizeof(body),
    "{\\"action\\":\\"%s\\",\\"method\\":\\"fingerprint\\",\\"fingerprintSlot\\":%d}",
    checkIn ? "check_in" : "check_out",
    slot
  );

  int code = http.POST(body);
  Serial.printf("punch HTTP %d\\n", code);
  if (code > 0) Serial.println(http.getString());
  http.end();
  return code >= 200 && code < 300;
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.println("\\nWiFi OK");
  // ตัวอย่าง: สแกนได้ slot 3 → เช็คอิน
  punchFingerprint(3, true);
}

void loop() {}
`;
}

function buildCurlFingerprint(origin: string, punchPath: string, apiKey: string) {
  const url = `${origin.replace(/\/$/, "")}${punchPath}`;
  return `curl -X POST "${url}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"action":"check_in","method":"fingerprint","fingerprintSlot":3}'`;
}

function buildCurlFace(origin: string, punchPath: string, apiKey: string) {
  const url = `${origin.replace(/\/$/, "")}${punchPath}`;
  return `curl -X POST "${url}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"action":"check_in","method":"face","descriptors":[[/* 128 floats */],[/* เฟรม 2 */],[/* เฟรม 3 */]]}'`;
}

function buildCurlBindFp(origin: string, fingerprintPath: string, apiKey: string) {
  const url = `${origin.replace(/\/$/, "")}${fingerprintPath}`;
  return `curl -X POST "${url}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"rosterId":12,"fingerprintSlot":3}'`;
}

function buildCurlRoster(origin: string, rosterPath: string, apiKey: string) {
  const url = `${origin.replace(/\/$/, "")}${rosterPath}`;
  return `curl "${url}" \\
  -H "Authorization: Bearer ${apiKey}"`;
}

export function AttendanceDeviceApiGuideModal({
  open,
  onClose,
  origin,
  endpoints,
  apiKeyHint,
  plainKey,
}: {
  open: boolean;
  onClose: () => void;
  origin: string;
  endpoints: Endpoints;
  apiKeyHint: string | null;
  /** คีย์ที่เพิ่งสร้าง — ถ้ามีจะใส่ในตัวอย่างโค้ด */
  plainKey: string | null;
}) {
  const keyPlaceholder =
    plainKey ??
    (apiKeyHint
      ? `att_dev_${apiKeyHint}_PASTE_SECRET_HERE`
      : "att_dev_YOUR_KEY_ID_YOUR_SECRET");
  const base = origin || "https://your-domain.com";

  const esp32 = buildEsp32Sketch(base, endpoints.punch, keyPlaceholder);
  const curlFp = buildCurlFingerprint(base, endpoints.punch, keyPlaceholder);
  const curlFace = buildCurlFace(base, endpoints.punch, keyPlaceholder);
  const curlBind = buildCurlBindFp(base, endpoints.fingerprint, keyPlaceholder);
  const curlRoster = buildCurlRoster(base, endpoints.roster, keyPlaceholder);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="วิธีเชื่อม ESP32 / เครื่องสแกน"
      description="สร้างคีย์ → ผูกพนักงาน → คัดลอกโค้ดไปยิง API"
      size="xl"
      appearance="glass"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 sm:ml-auto sm:w-auto sm:px-8"
        >
          ปิด
        </button>
      }
    >
      <div className="space-y-4 text-sm text-[#3d3a66]">
        <ol className="list-decimal space-y-1.5 pl-5 text-xs font-medium marker:font-bold marker:text-[#4d47b6] sm:text-sm">
          <li>กด «สร้าง Device API Key» แล้วคัดลอกคีย์เก็บไว้ (แสดงครั้งเดียว)</li>
          <li>เปิดสวิตช์ «เปิด Device API»</li>
          <li>
            ผูกพนักงาน: ใส่ <strong>slot ลายนิ้วมือ</strong> ในรายชื่อ หรือลงทะเบียนใบหน้า — หรือยิง API ผูกจากเครื่อง
          </li>
          <li>ใส่คีย์ใน ESP32 แล้วเรียก <code className="rounded bg-[#f3f2fb] px-1 text-[11px]">POST …/device/punch</code></li>
        </ol>

        <div className="rounded-2xl border border-[#d8d6ec]/90 bg-[#f8f7fd] px-3 py-2 text-[11px] font-medium text-[#5f5a8a]">
          <p className="font-bold text-[#2e2a58]">Auth</p>
          <p className="mt-0.5 break-all">
            Header: <code>Authorization: Bearer &lt;key&gt;</code> หรือ{" "}
            <code>X-Attendance-Device-Key: &lt;key&gt;</code>
          </p>
          <p className="mt-1 break-all">
            Base: <code>{base}</code>
            {plainKey ? (
              <span className="ml-1 text-emerald-700">(ตัวอย่างด้านล่างใส่คีย์ที่เพิ่งสร้างแล้ว)</span>
            ) : (
              <span className="ml-1 text-amber-800">— แทนที่คีย์ในโค้ดด้วยค่าจริง</span>
            )}
          </p>
        </div>

        <CodeBlock
          title="ESP32 (Arduino) — เช็คอินลายนิ้วมือ"
          hint="WiFi + HTTPClient — เรียกหลังสแกนได้ slot จากเซ็นเซอร์"
          code={esp32}
        />
        <CodeBlock title="curl — ลายนิ้วมือ" code={curlFp} />
        <CodeBlock
          title="curl — ใบหน้า (descriptor 128 ค่า)"
          hint="อุปกรณ์คำนวณ face embedding เอง แล้วส่งมาจับคู่ในระบบ · ส่ง descriptors หลายเฟรม (3–4) ระบบจะโหวตให้แม่นขึ้น · ส่งเฟรมเดียวใช้คีย์ descriptor ได้"
          code={curlFace}
        />
        <CodeBlock title="curl — ผูก fingerprint slot กับพนักงาน" code={curlBind} />
        <CodeBlock title="curl — sync รายชื่อลงเครื่อง" code={curlRoster} />
      </div>
    </FormModal>
  );
}
