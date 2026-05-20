# ติดตั้ง OpenClaw บนเครื่อง LAN (ตัวอย่าง 192.168.1.193) + Ollama โลคัล — ใช้กับ MAWELL Chat AI

เอกสารนี้สำหรับ **เครื่อง 3** ที่รัน OpenClaw Gateway เอง แล้วให้โปรเจกต์นี้ (`Next.js`) เรียกผ่าน **`OPENCLAW_AGENT_WS_URL`**  
โฟกัส: **ผูก Ollama บนเครื่องเดียวกันก่อน** + เลือกโมเดล **ไม่หนัก** พอสนทนาทั่วไป / เลขาได้

อ้างอิงทางการ: [Getting started — OpenClaw](https://docs.openclaw.ai/start/getting-started), [Ollama provider](https://docs.openclaw.ai/providers/ollama.md)

---

## 0) สิ่งที่ต้องมีบน 192.168.1.193

| รายการ | หมายเหตุ |
|--------|-----------|
| **Node.js** | แนะนำ **Node 24** (ขั้นต่ำ 22.16+ ตาม OpenClaw) |
| **Ollama** | ติดตั้งจาก [ollama.com/download](https://ollama.com/download) — รัน `ollama serve` (พอร์ตดีฟอลต์ **11434**) |
| เครือข่าย | เครื่องรัน MAWELL ต้อง `ping` / เข้าพอร์ต Gateway จาก LAN ได้ |

---

## 1) ติดตั้ง OpenClaw CLI + Gateway

### Linux / macOS

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Windows (PowerShell — รันในฐานะผู้ใช้ที่จะรัน gateway)

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

วิธีอื่น (Docker / npm): [Install — OpenClaw](https://docs.openclaw.ai/install)

---

## 2) ดึงโมเดล Ollama ที่ “ไม่หนัก” — เหมาะเลขา / สื่อสารทั่วไป

รันบน **193** หลังติดตั้ง Ollama:

```bash
# แนะนำอย่างใดอย่างหนึ่ง (หรือทั้งคู่เพื่อสลับทดสอบ)
ollama pull llama3.2:3b    # ~2GB class — โปรเจกต์นี้ใช้เป็นดีฟอลต์แชทข้อความบ่อย
ollama pull qwen2.5:3b     # หลายภาษา รวมไทย โดยรวมดีในระดับขนาดเล็ก
```

ทางเลือกเบากว่านี้ (ถ้าเครื่องอ่อนมาก): `qwen2.5:1.5b`, `phi3.5:3.8b`, `gemma2:2b` — ลอง `ollama list` หลัง pull

**ไม่แนะนำ**ให้ OpenClaw ใช้ `http://host:11434/v1` (OpenAI-compatible) — ใช้ native **`http://127.0.0.1:11434`** ตาม [เอกสาร Ollama ของ OpenClaw](https://docs.openclaw.ai/providers/ollama.md)

---

## 3) Onboarding — เลือก Ollama โลคัล + โมเดล

### แบบโต้ตอบ (แนะนำครั้งแรก)

```bash
openclaw onboard --install-daemon
```

เลือก **Ollama** → โหมด **Local only** (หรือ Cloud+Local ถ้าต้องการ) → ใส่ base URL Ollama บนเครื่องเดียวกัน:

`http://127.0.0.1:11434`

### แบบไม่โต้ตอบ (ตัวอย่าง)

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://127.0.0.1:11434" \
  --custom-model-id "llama3.2:3b" \
  --accept-risk
```

ตั้งค่าโมเดลหลัก (ถ้ายังไม่ได้ตั้งใน wizard):

```bash
openclaw models list --provider ollama
openclaw models set ollama/llama3.2:3b
```

สำหรับ LAN โลคัล OpenClaw ยอมรับ credential แบบ placeholder **`ollama-local`** (ดูเอกสาร provider)

---

## 4) ยืนยัน Gateway + พอร์ต 18789

```bash
openclaw gateway status
```

ควรเห็น Gateway ฟังพอร์ต **18789** (ค่ามาตรฐาน)

- เปิด **Firewall บน 193** ให้พอร์ต **18789/tcp** จาก subnet เดียวกับเครื่องรัน MAWELL  
- ถ้า Gateway bind แค่ `127.0.0.1` เครื่องอื่นจะต่อไม่ได้ — ตั้งให้ listen **0.0.0.0** หรือตามเอกสาร OpenClaw สำหรับ remote LAN (ดู `openclaw gateway` / config)

ทดสอบจากเครื่องรัน MAWELL (รากโปรเจกต์):

```bash
npm run openclaw:probe
```

จาก PowerShell:

```powershell
Test-NetConnection -ComputerName 192.168.1.193 -Port 18789
```

---

## 5) ดึง API key / token ให้ MAWELL ใช้

หลัง onboard แล้ว ให้ดู token ที่ Gateway ใช้ authenticate WebSocket (มักอยู่ใน config / Control UI ตามเวอร์ชัน OpenClaw)  
โปรเจกต์นี้อ่านจาก **`OPENCLAW_API_KEY`** หรือ **`OPENCLAW_AGENT_API_KEY`** ส่งเป็น `Authorization: Bearer …` และฝั่ง WS

---

## 6) ตั้งค่า `.env` บนเครื่องที่รัน MAWELL (Next.js)

ตัวอย่าง (แก้ token ให้ตรงกับ Gateway จริง):

```env
OPENCLAW_AGENT_WS_URL=ws://192.168.1.193:18789
OPENCLAW_API_KEY=<token-จาก-openclaw-gateway>
OPENCLAW_AGENT_MODEL=openclaw-agent
OPENCLAW_CLIENT_ID=aicluster-chat-ai
```

**แชทข้อความใน MAWELL** ยังใช้ Ollama ตรงได้ก่อน (`OLLAMA_API_URL` บนเครื่อง dev) — OpenClaw เป็น fallback/เส้นทางเสริมตาม `personal-ai-service.ts`  
ถ้าต้องการให้ **แชทผ่าน OpenClaw เป็นหลัก** ให้ตั้งค่า OpenClaw ตามขั้นตอนด้านบนให้ครบ และปรับลำดับ/ตัวแปรตามนโยบายใน `.env.example` / [`docs/README.md`](./README.md)

---

## 7) เอกสารเสริมใน repo นี้

- [openclaw-gateway-lan-checklist.md](./openclaw-gateway-lan-checklist.md) — แก้ `WebSocket error occurred` / พอร์ตผิด / ชนกับแอป HTTP อื่น

---

## สรุปสั้น ๆ

1. บน **193**: ติดตั้ง Ollama → `ollama pull llama3.2:3b` (หรือ `qwen2.5:3b`)  
2. บน **193**: ติดตั้ง OpenClaw → `openclaw onboard` เลือก Ollama ที่ `http://127.0.0.1:11434`  
3. เปิด **18789** ให้ LAN  
4. บน **เครื่อง MAWELL**: `OPENCLAW_AGENT_WS_URL=ws://192.168.1.193:18789` + API key ที่ตรงกับ Gateway

รายละเอียด CLI/config อาจเปลี่ยนตามเวอร์ชัน OpenClaw — ถ้าคำสั่งล้ม ให้รัน `openclaw doctor` หรือดู [docs.openclaw.ai](https://docs.openclaw.ai) เวอร์ชันล่าสุด
