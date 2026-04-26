# OpenClaw OCR — Vision Pipeline Test Bundle

> ส่งให้ทีม OpenClaw ใช้ทดสอบ `POST /api/openclaw/ocr` ตรงกับ Vision endpoint
> เพื่อพิสูจน์ว่า image input **ถูก attach เข้าโมเดล Vision จริง**

## ไฟล์ในโฟลเดอร์นี้

| ไฟล์ | อธิบาย |
| --- | --- |
| `slip-ttb.jpg` | สลิปทดสอบจริง (TTB, 30 บาท, 24 เม.ย. 69, 08:04) — 86 KB |
| `slip-ttb.jpg.b64.txt` | base64 ของ `slip-ttb.jpg` (raw, ไม่มี data URI prefix, ไม่มี newline) |
| `slip-ttb-payload.json` | JSON พร้อม POST: `{ "message": "...", "image": "<base64>" }` |

---

## ผลทดสอบจาก Ai Cluster (ฝั่งโปรเจค) — 26 เม.ย. 2026

ยิง 3 รอบด้วย sample เดียวกัน ได้ผลต่างกันทุกครั้ง — แต่ **ไม่มีรอบไหนเป็น OCR result จริง**

### รอบ 1 — `{ message, imageDataUrl: "data:image/jpeg;base64,..." }`

```json
{
  "rawText": "To solve this problem, we need to use the following approaches:\n\n1. **Image Processing**: We will use the `tesseract.js` library to extract text from the image...\nconst tesseract = require('tesseract.js');\n..."
}
```

### รอบ 2 — `{ message, image: "<base64 raw>" }`

```json
{
  "rawText": "To solve this problem, I will use the following steps:\n\n1. **Read the input image**: I will use the `ttb` library to read the input image...\nimport ttb\nimage = ttb.imread('image.jpg')\n..."
}
```

### รอบ 3 — `{ message, image: "<base64 raw>" }` (รัน 21 วินาทีต่อมา)

```json
{
  "rawText": "I can't help you with that. Is there anything else I can help you with?"
}
```

---

## วินิจฉัย

| รอบ | rawText | สาเหตุที่เป็นไปได้ |
| --- | --- | --- |
| 1 | "How to OCR using tesseract.js" | โมเดล text-only (mavel-web?) เห็นแค่ message — รูปไม่ได้ attach |
| 2 | "How to OCR using `ttb` library (Python)" | เหมือนรอบ 1 — text-only hallucination |
| 3 | Refusal | safety guardrail trigger จากเนื้อหา message — ไม่ได้รับรูปจริง |

ผลทั้ง 3 รอบยืนยันสมมติฐาน **request ตกไปที่ text-only agent** ไม่ใช่ Vision endpoint

---

## คำสั่งทดสอบ (curl)

ในโฟลเดอร์นี้

```bash
# linux/mac
curl -sS -X POST "http://192.168.1.191:3000/api/openclaw/ocr" \
  -H "Content-Type: application/json" \
  --data-binary @slip-ttb-payload.json | jq .
```

```powershell
# powershell — ใช้ curl.exe เพราะ Invoke-WebRequest หมดเวลาที่ ~120 วินาที
curl.exe -sS -X POST "http://192.168.1.191:3000/api/openclaw/ocr" `
  -H "Content-Type: application/json" `
  --data-binary "@slip-ttb-payload.json"
```

---

## ผลลัพธ์ที่คาดหวัง (Acceptance)

```json
{
  "rawText": "ttb\nโอนเงินสำเร็จ\n24 เม.ย. 69, 08:04 น.\n30.00\nค่าธรรมเนียม 0.00\nนาย เร๊าะมัน หะนิแร\nXXX-X-XX153-6\nttb\nนางสาว จินตนา ช่อชน\nXXX-XXX-0644\nพร้อมเพย์\nรหัสอ้างอิง: 260424080444235337",
  "entryDateYmd": "2026-04-24",
  "entryTime": "08:04",
  "amountBaht": 30,
  "transferFrom": "นาย เร๊าะมัน หะนิแร XXX-X-XX153-6",
  "transferTo": "นางสาว จินตนา ช่อชน XXX-XXX-0644",
  "bankName": "TTB",
  "reference": "260424080444235337",
  "slipNote": null,
  "directionGuess": "out"
}
```

ผ่านเมื่อ — ทุกฟิลด์ตรงพอประมาณ และ `rawText` ขึ้นต้นด้วย `ttb` หรือ `โอนเงินสำเร็จ` (ไม่ใช่ `"To solve…"` หรือ `"I can't…"`)

---

## จุดที่ขอให้ทีม OpenClaw ตรวจ

1. **Route ใน `/api/openclaw/ocr`** — เมื่อ body มี `image` หรือ `imageDataUrl` ต้อง branch ไปยัง Vision pipeline ไม่ใช่ text agent (`mavel-web`)
2. **Vision model** — qwen2.5:7b, llama3:8b เป็น text-only ใช้ไม่ได้ ต้องเป็น `qwen2.5-vl` / `llava` / `bakllava` / `gemini-vision` / `gpt-4o` หรือ vision-capable
3. **Payload ที่ส่งเข้า Ollama Vision** — ต้องเป็น
   ```json
   { "model": "qwen2.5-vl:7b", "prompt": "...", "images": ["<base64-raw-no-prefix>"], "stream": false }
   ```
   (อย่าลืม strip `data:image/...;base64,` prefix ก่อนใส่ใน `images[]`)
4. **Log ที่ใส่เพิ่ม** — ขอ log ว่า `body.image?.length` และ `body.imageDataUrl?.length` ตอนเข้า handler ใหญ่ขนาดเท่าไร เพื่อยืนยันว่ารูปมาถึง endpoint จริง
5. **รับได้ทั้ง 2 key** — `image` (base64 raw) และ `imageDataUrl` (data URL with prefix)
