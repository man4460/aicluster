# OpenClaw OCR Contract — `/api/openclaw/ocr`

> ส่งให้ทีม OpenClaw ใช้ปรับ prompt + output schema ของ OCR endpoint
> เป้าหมาย: ให้ Ai Cluster (ฝั่งโปรเจค) parse ผลได้โดยไม่ต้อง map คีย์ใหม่
> ฐาน URL ปัจจุบัน: `http://192.168.1.191:3000/api/openclaw/ocr`

---

## 1) ปัญหาที่พบในผลลัพธ์ปัจจุบัน

ส่งสลิป TTB จริง 1 ใบ (รูปคุณภาพคมชัด) ทดสอบ 2 รอบ ได้กลับมาแบบนี้

```json
{ "content": "{ \"date\": \"24/04/69\", \"amount\": \"30.00\", \"sender\": \"TTB\", \"bank\": \"THAI_TTB\", \"ref\": \"TTB-XXXX-XXXX-XXXX-6\", \"note\": \"TTB\" }" }
```

```json
{ "content": "{ \"date\": \"24เม.ย.69, 08:04\", \"amount\": \"30.00\", \"sender\": \"TTB\", \"bank\": \"THB\", \"ref\": \"TTB\", \"note\": \"TTB\" }" }
```

ของจริงในสลิป (TTB)

| ฟิลด์ | ค่าจริงในสลิป | OpenClaw ตอบ |
| --- | --- | --- |
| วันที่ | 24 เม.ย. 69 (พ.ศ.2569 = 2026) | `"24/04/69"` |
| เวลา | 08:04 น. | (ไม่มีคีย์แยก) |
| จำนวน | 30.00 บาท | `"30.00"` ✓ |
| ผู้โอน | นาย เร๊าะมัน หะนิแร — XXX-X-XX153-6 (ttb) | `"TTB"` ✗ |
| ผู้รับ | นางสาว จินตนา ช่อชน — XXX-XXX-0644 (พร้อมเพย์) | (ไม่มีคีย์ recipient) ✗ |
| ธนาคาร | TTB → PromptPay | `"THAI_TTB"` / `"THB"` |
| รหัสอ้างอิง | `260424080444235337` | `"TTB-XXXX-XXXX-XXXX-6"` ✗ |

ปัญหา 4 ข้อ

1. **ใช้คีย์ผิดสคีมา** — โปรเจคต้องการ `entryDateYmd / entryTime / amountBaht / transferFrom / transferTo / bankName / reference / slipNote / rawText`
2. **`content` เป็น string ของ JSON อีกชั้น** — ควรส่ง object ตรง ๆ ไม่ห่อ string
3. **ไม่ได้ OCR จริง** — โมเดลกำลัง "เดา" จากธีม TTB แล้วยัด `"TTB"` เข้าทุกช่องที่ไม่มั่นใจ
4. **ไม่คืน `rawText`** — ฝั่งเรา fallback parse ด้วย regex ไม่ได้

---

## 2) สคีมา Output ที่ขอให้ใช้

ต้องตอบ HTTP 200 กับ body **JSON object เดียว** (ไม่ห่อ string, ไม่มี markdown fence) ตามรูปแบบนี้

```json
{
  "rawText": "string — ข้อความดิบทั้งหมดที่อ่านได้จากสลิป (บรรทัดต่อบรรทัด คั่นด้วย \\n)",
  "entryDateYmd": "YYYY-MM-DD หรือ null  — แปลงเป็น ค.ศ. แล้ว (ถ้าสลิปเป็น พ.ศ. ให้ลบ 543)",
  "entryTime": "HH:mm หรือ null",
  "amountBaht": 30.0,
  "transferFrom": "ชื่อ/บัญชีผู้โอน เช่น 'นาย เร๊าะมัน หะนิแร XXX-X-XX153-6' หรือ null",
  "transferTo":   "ชื่อ/บัญชีผู้รับ เช่น 'นางสาว จินตนา ช่อชน XXX-XXX-0644' หรือ null",
  "bankName": "TTB | SCB | KBANK | BBL | KTB | PromptPay | TrueMoney … หรือ null",
  "reference": "เลขอ้างอิง เช่น '260424080444235337' หรือ null",
  "slipNote": "string หรือ null",
  "directionGuess": "in | out | null"
}
```

กฎสำคัญ

- `entryDateYmd` ต้องเป็น **ค.ศ.** เสมอ (ถ้าสลิปแสดง `24 เม.ย. 69` หรือ `24/04/69` ให้แปลง `69` เป็น `2569` แล้วลบ 543 → `2026`)
- `amountBaht` เป็น **number** (ไม่ใช่ string, ไม่มีเครื่องหมาย ฿/บาท)
- ถ้าฟิลด์ใดอ่านไม่ออกจริง ๆ ให้ใส่ `null` — **ห้าม** ใส่ชื่อธนาคาร (`"TTB"`) แทนคำว่าไม่รู้
- ห้ามมาส์กตัวเลขที่อยู่บนสลิปเอง (เช่น reference เห็นชัด ๆ ห้ามแทนเป็น `XXXX-XXXX`)
- ตัวเลขบัญชีที่ถูกมาส์กในสลิปแล้ว (`XXX-X-XX153-6`) ให้คงไว้ตามนั้น

---

## 3) System Prompt ที่แนะนำ (ถ้าใช้ LLM Vision)

```text
คุณคือระบบ OCR สลิปโอนเงินภาษาไทย/อังกฤษ
หน้าที่: อ่านตัวอักษรในรูปทุกตัวอย่างซื่อสัตย์ แล้วคืน JSON เดียวตามสคีมาด้านล่าง

กฎ:
1. ตอบเฉพาะ JSON object เดียว — ไม่มี markdown, ไม่มี ``` , ไม่มีคำบรรยาย
2. ถ้าฟิลด์ใดอ่านไม่ออกหรือไม่มีในรูป ให้ใส่ null — ห้ามเดา ห้ามใส่ชื่อธนาคารแทน
3. วันที่: คืนเป็น YYYY-MM-DD ปี ค.ศ. (ถ้าเห็นปี 2 หลัก เช่น 69 หรือเห็น 25xx ให้ตีความเป็น พ.ศ. แล้วลบ 543)
4. เวลา: คืนเป็น HH:mm 24 ชั่วโมง
5. amountBaht ต้องเป็นตัวเลข ไม่ใช่ string
6. rawText ต้องคืนข้อความทุกบรรทัดที่อ่านได้ — ใช้ \n คั่น
7. transferFrom/transferTo ต้องเป็นชื่อบุคคล + เลขบัญชี (ถ้ามี) ไม่ใช่ชื่อธนาคาร
8. bankName คือชื่อธนาคารหรือแอปเท่านั้น (TTB, SCB, KBANK, BBL, KTB, PromptPay, TrueMoney …)

สคีมา Output (key ต้องตรงเป๊ะ):
{
  "rawText": string,
  "entryDateYmd": "YYYY-MM-DD" | null,
  "entryTime": "HH:mm" | null,
  "amountBaht": number | null,
  "transferFrom": string | null,
  "transferTo": string | null,
  "bankName": string | null,
  "reference": string | null,
  "slipNote": string | null,
  "directionGuess": "in" | "out" | null
}
```

ตัวอย่างผลลัพธ์ที่ "ถูกต้อง" สำหรับสลิป TTB ใบที่ใช้ทดสอบ

```json
{
  "rawText": "ttb\nโอนเงินสำเร็จ\n24 เม.ย. 69, 08:04 น.\n30.00\nค่าธรรมเนียม 0.00\nนาย เร๊าะมัน หะนิแร\nXXX-X-XX153-6\nttb\nนางสาว จินตนา ช่อชน\nXXX-XXX-0644\nพร้อมเพย์\nรหัสอ้างอิง: 260424080444235337",
  "entryDateYmd": "2026-04-24",
  "entryTime": "08:04",
  "amountBaht": 30.0,
  "transferFrom": "นาย เร๊าะมัน หะนิแร XXX-X-XX153-6",
  "transferTo": "นางสาว จินตนา ช่อชน XXX-XXX-0644",
  "bankName": "TTB",
  "reference": "260424080444235337",
  "slipNote": null,
  "directionGuess": "out"
}
```

---

## 4) Request ที่ฝั่ง Ai Cluster ส่งไปจริง

`POST {OPENCLAW_API_URL}` (ปัจจุบัน `http://192.168.1.191:3000/api/openclaw/ocr`)

**Headers**

```
Content-Type: application/json
Authorization: Bearer <OPENCLAW_API_TOKEN ถ้ามี>
```

**Body** (รับได้ทั้ง 2 รูปแบบ — โปรดรองรับทั้งคู่)

```json
{ "message": "อ่านสลิปและสรุปข้อมูล …", "imageDataUrl": "data:image/png;base64,iVBORw0K…" }
```

```json
{ "message": "…", "image": "iVBORw0K…(base64 raw)" }
```

> ฝั่ง Ai Cluster จะใส่ `message` เป็น prompt ภาษาไทย ขอให้ "อ่านสลิปและคืน JSON ตามสคีมา"
> ฝั่ง OpenClaw **ควรเพิกเฉย** ต่อ message ส่วนใหญ่ และยึด system prompt ของตัวเองเป็นหลัก ตอบเป็น JSON ตามสคีมาในข้อ 2 เสมอ

---

## 5) Response Wrapper — เลือก 1 ใน 2

ฝั่ง Ai Cluster ปัจจุบัน parse ได้ทั้ง 2 รูปแบบ ขอให้เลือกแบบใดแบบหนึ่ง **และ** ทำให้ field ที่อยู่ข้างในเป็น object ตามสคีมาข้อ 2 (ไม่ใช่ string)

**แบบ A — ตอบ JSON ตรง ๆ (แนะนำ)**

```json
{
  "rawText": "…",
  "entryDateYmd": "2026-04-24",
  "amountBaht": 30,
  "...": "..."
}
```

**แบบ B — ห่อใน `content` (ถ้ายังต้องใช้ wrapper เดิม)**

```json
{
  "content": {
    "rawText": "…",
    "entryDateYmd": "2026-04-24",
    "amountBaht": 30,
    "...": "..."
  }
}
```

> ❌ ห้ามตอบแบบ `{ "content": "{\"date\":\"24/04/69\",...}" }` ซึ่งเป็น string ของ JSON
> ❌ ห้ามตอบเป็น markdown ห่อ ` ```json … ``` `

---

## 6) Acceptance Test (ฝั่ง OpenClaw รัน self-test)

1. ใช้สลิป TTB ใบทดสอบ (ภาพแนบ)
2. ผ่านเมื่อ
   - `entryDateYmd === "2026-04-24"`
   - `entryTime === "08:04"`
   - `amountBaht === 30`
   - `bankName === "TTB"`
   - `reference === "260424080444235337"`
   - `transferFrom` ขึ้นต้นด้วย `"นาย"` (มีคำว่า "เร๊าะมัน" หรือ "หะนิแร")
   - `transferTo` ขึ้นต้นด้วย `"นางสาว"` (มีคำว่า "จินตนา" หรือ "ช่อชน")
   - `rawText` ยาว ≥ 80 ตัวอักษร
3. ส่ง JSON ตอบกลับให้ทีม Ai Cluster ตรวจ

เมื่อพร้อม แจ้งกลับมาเพื่อทดสอบ end-to-end ผ่านหน้าจอแชต AI ได้เลย
