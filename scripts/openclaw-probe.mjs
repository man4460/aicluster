#!/usr/bin/env node
/**
 * ตรวจ TCP + WebSocket/handshake ไป OpenClaw Gateway ตามค่าใน .env
 * รันจากรากโปรเจกต์: npm run openclaw:probe
 */
import { config } from "dotenv";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
config({ path: path.join(root, ".env"), quiet: true });

const wsUrl =
  process.env.OPENCLAW_AGENT_WS_URL?.trim() ||
  process.env.OPENCLAW_GATEWAY_WS_URL?.trim() ||
  process.env.OPENCLAW_WS_URL?.trim() ||
  "";

const apiKey =
  process.env.OPENCLAW_API_KEY?.trim() || process.env.OPENCLAW_AGENT_API_KEY?.trim() || "";

function tcpProbe(host, port, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.setTimeout(timeoutMs);
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => resolve(false));
  });
}

async function main() {
  console.log("[openclaw-probe] โหลด .env จาก:", path.join(root, ".env"));
  console.log("");

  if (!wsUrl) {
    console.log("ไม่พบ OPENCLAW_AGENT_WS_URL / OPENCLAW_GATEWAY_WS_URL / OPENCLAW_WS_URL");
    console.log("ถ้าแชทผ่าน HTTP อย่างเดียว ให้ตั้ง OPENCLAW_AGENT_API_URL และไม่บังคับ WS");
    process.exitCode = 2;
    return;
  }

  let u;
  try {
    u = new URL(wsUrl);
  } catch {
    console.error("OPENCLAW_*_WS_URL ไม่ใช่ URL ที่อ่านได้:", wsUrl);
    process.exitCode = 2;
    return;
  }

  if (u.protocol !== "ws:" && u.protocol !== "wss:") {
    console.error("ต้องเป็น ws: หรือ wss: ได้รับ:", u.protocol);
    process.exitCode = 2;
    return;
  }

  const host = u.hostname;
  const port = Number(u.port || (u.protocol === "wss:" ? 443 : 80));
  const pathPart = u.pathname === "" ? "/" : u.pathname;
  console.log("เป้าหมาย:", `${u.protocol}//${host}:${port}${pathPart}`);
  if (!apiKey) {
    console.warn("คำเตือน: ไม่มี OPENCLAW_API_KEY / OPENCLAW_AGENT_API_KEY — ขั้น WS มักล้มเหลวหลัง handshake");
  }
  console.log("");

  console.log("(1) TCP …");
  const tcpOk = await tcpProbe(host, port);
  if (!tcpOk) {
    console.log("    ผล: ไม่ติด — เครื่องนี้ยังเข้าพอร์ตไม่ได้");
    console.log("");
    console.log("แก้บนเครื่อง Gateway (" + host + "):");
    console.log("  - รัน Gateway ให้ฟังพอร์ตนี้ (มักใช้ openclaw gateway status)");
    console.log("  - เปิด Windows Firewall inbound TCP " + port + " (รัน PowerShell แบบ Administrator บนเครื่อง Gateway):");
    console.log(
      '    powershell -ExecutionPolicy Bypass -File "' +
        path.join(root, "scripts", "openclaw-gateway-windows-firewall-add-18789.ps1") +
        '"',
    );
    console.log("");
    console.log("อ้างอิง: docs/openclaw-gateway-lan-checklist.md");
    process.exitCode = 1;
    return;
  }
  console.log("    ผล: ติด");
  console.log("");

  if (!apiKey) {
    console.log("(2) WebSocket — ข้าม (ไม่มี API key)");
    process.exitCode = 2;
    return;
  }

  console.log("(2) WebSocket + handshake (openclaw-sdk) …");
  const { createClient } = await import("openclaw-sdk");
  const clientId = process.env.OPENCLAW_CLIENT_ID?.trim() || "aicluster-chat-ai";
  const client = createClient({
    url: wsUrl,
    clientId,
    auth: { token: apiKey },
    connectTimeoutMs: 20000,
    requestTimeoutMs: 20000,
    autoReconnect: false,
  });
  try {
    await client.connect();
    console.log("    ผล: พร้อมใช้ (handshake สำเร็จ)");
    client.disconnect();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("    ผล: ล้มเหลว —", msg);
    console.log("");
    console.log("เช็ค: API key ตรงกับ Gateway · ws กับ wss · path ใน URL");
    console.log("อ้างอิง: docs/openclaw-gateway-lan-checklist.md");
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
