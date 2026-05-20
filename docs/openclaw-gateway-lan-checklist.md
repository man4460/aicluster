# OpenClaw Gateway — เช็คลิสต์ LAN (เช่น 192.168.1.191)

คู่มือติดตั้ง Gateway บนเครื่องใหม่ + Ollama โลคัล: **[openclaw-install-lan-machine-ollama.md](./openclaw-install-lan-machine-ollama.md)** (ตัวอย่าง 192.168.1.193)

ข้อความ **`WebSocket error occurred`** มาจาก `openclaw-sdk` ตอน `ws.onerror` ระหว่างกำลัง `connect` — มักหมายถึง **URL/พอร์ต/โปรโตคอลไม่ตรงกับ OpenClaw Gateway จริง** หรือ **ไฟร์วอลล์ / บริการไม่ได้เปิด WebSocket**

## 1) ยืนยันว่า Gateway เปิดพอร์ตอะไร

### จากรากโปรเจกต์ (อ่าน `.env` แล้วทดสอบ TCP + WS handshake)

```bash
npm run openclaw:probe
```

- ขั้น TCP ไม่ติด → แก้ที่เครื่อง Gateway: บริการ + firewall + bind LAN (`0.0.0.0`)
- TCP ติดแต่ handshake ล้ม → เช็ค **API key** / `ws` vs `wss` / path ใน URL

### บนเครื่องที่รัน **Next.js (MAWELL)** (PowerShell)

```powershell
Test-NetConnection -ComputerName 192.168.1.191 -Port 18789
Test-NetConnection -ComputerName 192.168.1.191 -Port 8080
```

- ถ้า **`TcpTestSucceeded : False`** สำหรับพอร์ตใน `OPENCLAW_AGENT_WS_URL` → แก้ที่เครื่อง 191: เปิดบริการ Gateway / เปิดพอร์ตใน Windows Firewall / ให้ bind `0.0.0.0` ไม่ใช่แค่ `127.0.0.1`

### บนเครื่อง **Gateway เป็น Windows** — เปิด inbound พอร์ต Gateway (รัน PowerShell **Administrator**)

จากโฟลเดอร์โปรเจกต์ (คัดลอก repo ไป gateway หรือคัดลอกไฟล์สคริปต์ไปก็ได้):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\openclaw-gateway-windows-firewall-add-18789.ps1
```

ดีฟอลต์เปิด **TCP 18789** (ส่ง `-Port` ถ้า Gateway ใช้พอร์ตอื่น)

## 2) ค่าใน `.env` ของโปรเจกต์นี้

- **`OPENCLAW_AGENT_WS_URL`** = WebSocket ของ **OpenClaw Gateway** เท่านั้น (รูปแบบ `ws://host:port` หรือ `wss://...` ตามที่ Gateway เปิด)
- **`OPENCLAW_API_KEY`** หรือ **`OPENCLAW_AGENT_API_KEY`** = โทเคนที่ Gateway ยอมรับ (ต้องตรงกับที่ตั้งบนเครื่อง 191)
- **`OPENCLAW_CLIENT_ID`** (ถ้ามี) — ดีฟอลต์ในโค้ดคือ `aicluster-chat-ai`

อย่าใส่ URL ของ **แอปอื่น** (เช่นเว็บ “Personal AI Assistant” บน `:8080`) แทน Gateway — ถ้าเซิร์ฟเวอร์ไม่ใช่โปรโตคอล OpenClaw จะได้ HTTP 403 ตอน upgrade WebSocket

## 3) บนเครื่อง 192.168.1.191 (ติดตั้ง OpenClaw / Agent “Mawell ChatAI”)

ต้องมีโปรเซสที่เป็น **OpenClaw Gateway** ฟัง WebSocket ตามที่ SDK ใช้ (ดูเอกสาร/เวอร์ชันที่ติดตั้งบนเครื่องนั้น)

- ตรวจว่า Gateway **start แล้ว** และ log ไม่ฟ้องพอร์ตชน / auth fail
- ถ้า Next.js รันบน **Docker / WSL** ที่ไม่ใช่เครือข่ายเดียวกับ `192.168.1.191` อาจต้องใช้ IP ที่ route ได้จริงจาก container

## 4) ทางเลือกถ้ายังไม่พร้อมใช้ Gateway

- ตั้ง **`OPENCLAW_AGENT_API_URL`** เป็น HTTP agent แชท (ถ้ามี) หรือ
- ใช้ **Ollama** อย่างเดียวสำหรับแชท (เว้น key/URL OpenClaw ตาม [README สูตรโลคัล](README.md))

---

**ผลสำรวจครั้งหนึ่ง (ตัวอย่าง — แล้วแต่เครือข่ายคุณ):**  
`192.168.1.191:18789` ปิด · `192.168.1.191:8080` เปิด (HTTP `/health` ได้) แต่ลอง path WebSocket ตัวอย่างได้ **403** — สอดคล้องกับว่า `:8080` ไม่ใช่ Gateway หรือไม่ยอม upgrade แบบที่ SDK ใช้
