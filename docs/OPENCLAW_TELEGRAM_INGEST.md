# OpenClaw — รับรูปจาก Telegram แล้วบันทึกใน home_finance_entries

วิธีให้ openclaw (หรือ agent ใด ๆ ที่อยู่ภายนอก) ดึงรูปสลิปจาก Telegram แล้วบันทึกเข้าระบบรายรับ-รายจ่ายของบ้าน
ผ่าน HTTP เท่านั้น ไม่ต้องเข้าถึง filesystem ของเครื่องโฮสต์

---

## 1. ภาพรวม flow

```
Telegram user --(photo)--> Telegram Bot --(webhook)--> openclaw agent
                                                          │
                                                          │  (1) ดึง bytes ของรูปจาก Telegram (getFile + file/bot{token}/{path})
                                                          │  (2) OCR / แยกข้อมูลสลิป (ฝั่ง openclaw)
                                                          │
                                                          ▼
                                       POST /api/sync/openclaw/uploads     ← อัปโหลดรูปเข้า public/uploads/home-finance/
                                       (multipart/form-data, sync secret)     คืน { imageUrl: "/uploads/home-finance/...jpg" }
                                                          │
                                                          ▼
                                       POST /api/sync/openclaw/events      ← สร้าง/อัปเดต HomeFinanceEntry
                                       (JSON, sync secret)                    ใส่ slipImageUrl / attachmentUrls = imageUrl จากขั้นที่แล้ว
```

ทั้งสอง endpoint ใช้ **shared secret เดียวกัน** ตั้งใน `.env` ของฝั่ง ma-well:

```dotenv
OPENCLAW_SYNC_SECRET=<random_long_token>
```

ฝั่ง openclaw ต้องเก็บโทเค็นเดียวกัน — ส่งผ่านแบบใดแบบหนึ่ง:

- `X-OpenClaw-Sync-Secret: <token>` (แนะนำ)
- หรือ `Authorization: Bearer <token>`

> ทุก endpoint อยู่ภายใต้ `https://app.ma-well.com` (หรือ origin ที่ deploy)

---

## 2. หา `ownerUserId` ของผู้ใช้ Telegram

`HomeFinanceEntry` ผูกกับ `ownerUserId` (User.id ใน ma-well) ไม่ได้ผูกกับ `telegramChatId` โดยตรง — openclaw ต้องแม็พก่อน

วิธีหา:

```sql
SELECT id, username, fullName
  FROM users
 WHERE telegramChatId = '<chat_id ของ user ใน Telegram>'
 LIMIT 1;
```

หรือถ้าฝั่ง openclaw ไม่มีสิทธิ์อ่าน DB ตรง ๆ สามารถสร้าง endpoint resolver ภายหลังได้ตามต้องการ ตอนนี้ส่ง `ownerUserId` มากับทุก request

> `ownerUserId` ของผู้ใช้ `mawell` ในระบบนี้ปัจจุบันคือ `cmp0udptg00051t5p0hyecuvv`

---

## 3. Endpoint: อัปโหลดรูป

`POST /api/sync/openclaw/uploads`

- `Content-Type: multipart/form-data`
- ฟิลด์:
  | field | required | คำอธิบาย |
  |---|---|---|
  | `file` | yes | ไฟล์รูป (`image/jpeg|png|webp|gif` ≤ 5MB) หรือ PDF (≤ 8MB) |
  | `ownerUserId` | yes | User.id (เช่น `cmp0udptg00051t5p0hyecuvv`) |
  | `externalId` | recommended | ID ของฝั่ง openclaw/Telegram เช่น `tg-{chat_id}-{message_id}` หรือ `file_unique_id` — ใช้กันชนกับ event ภายหลัง |

**ตัวอย่าง curl** (ฝั่ง openclaw หลังดึงรูปจาก Telegram มาเก็บใน `/tmp/slip.jpg` แล้ว):

```bash
curl -sf -X POST https://app.ma-well.com/api/sync/openclaw/uploads \
  -H "X-OpenClaw-Sync-Secret: $OPENCLAW_SYNC_SECRET" \
  -F "file=@/tmp/slip.jpg;type=image/jpeg" \
  -F "ownerUserId=cmp0udptg00051t5p0hyecuvv" \
  -F "externalId=tg-829304-105421"
```

**Response 200**:

```json
{
  "ok": true,
  "imageUrl": "/uploads/home-finance/cmp0udptg000-tg-829304-105421-1715431200000-9af0c7.jpg",
  "filename": "cmp0udptg000-tg-829304-105421-1715431200000-9af0c7.jpg",
  "bytes": 268473,
  "mime": "image/jpeg"
}
```

`imageUrl` ที่ได้คือ **path สำหรับใช้กับ event ในขั้นถัดไป** (ห้ามใช้ URL เต็ม — schema validate ว่าต้องขึ้นต้น `/uploads/home-finance/`)

**Error codes**:

| code | สาเหตุ |
|---|---|
| `400` | `file` ผิด, ขนาดเกิน, mime ไม่อนุญาต |
| `401` | secret ไม่ถูก |
| `404` | `ownerUserId` ไม่มีใน users |
| `500` | ไม่ได้ตั้ง `OPENCLAW_SYNC_SECRET` ฝั่ง server |

---

## 4. Endpoint: บันทึก / อัปเดตรายการ

`POST /api/sync/openclaw/events`

- `Content-Type: application/json`
- รับ batch ของ event ได้ใน 1 request

**Schema สำหรับสร้างรายการรายรับ-รายจ่ายจากสลิป**:

```jsonc
{
  "source": "openclaw",                                   // optional, default "openclaw"
  "ownerUserId": "cmp0udptg00051t5p0hyecuvv",             // required
  "requestId": "tg-829304-105421",                        // optional, idempotency key ทั้งคำขอ
  "events": [
    {
      "type": "finance",
      "externalId": "tg-829304-105421",                   // required, unique ต่อ user — ส่งซ้ำได้ จะกลายเป็น update
      "op": "upsert",                                     // "upsert" (default) | "delete"

      "entryDate": "2026-05-11",                          // YYYY-MM-DD
      "entryType": "EXPENSE",                             // "INCOME" | "EXPENSE"
      "amount": 1250.50,
      "title": "ค่าวัสดุก่อสร้าง",                          // ≤ 160 chars
      "categoryKey": "GENERAL_SHOPPING",                  // ดูตารางหมวดท้ายเอกสาร
      "categoryLabel": "ของใช้ในบ้าน",                     // ≤ 100 chars

      "billNumber": "REF20260511-001",                    // optional
      "paymentMethod": "promptpay",                       // optional
      "note": "OCR confidence 0.92",                      // optional, ≤ 600
      "dueDate": null,                                    // optional

      "slipImageUrl": "/uploads/home-finance/cmp0udptg000-tg-829304-105421-1715431200000-9af0c7.jpg",
      "attachmentUrls": [
        "/uploads/home-finance/cmp0udptg000-tg-829304-105421-1715431200000-9af0c7.jpg"
      ]
    }
  ]
}
```

> ทั้ง `slipImageUrl` และ `attachmentUrls[]` ต้องเป็น path ที่ได้คืนมาจาก `/api/sync/openclaw/uploads` เท่านั้น (ขึ้นต้น `/uploads/home-finance/`)

**ตัวอย่าง curl**:

```bash
curl -sf -X POST https://app.ma-well.com/api/sync/openclaw/events \
  -H "X-OpenClaw-Sync-Secret: $OPENCLAW_SYNC_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "openclaw",
    "ownerUserId": "cmp0udptg00051t5p0hyecuvv",
    "requestId": "tg-829304-105421",
    "events": [{
      "type": "finance",
      "externalId": "tg-829304-105421",
      "op": "upsert",
      "entryDate": "2026-05-11",
      "entryType": "EXPENSE",
      "amount": 1250.50,
      "title": "ค่าวัสดุก่อสร้าง",
      "categoryKey": "GENERAL_SHOPPING",
      "categoryLabel": "ของใช้ในบ้าน",
      "slipImageUrl": "/uploads/home-finance/cmp0udptg000-tg-829304-105421-1715431200000-9af0c7.jpg"
    }]
  }'
```

**Response 200**:

```json
{
  "ok": true,
  "source": "openclaw",
  "ownerUserId": "cmp0udptg00051t5p0hyecuvv",
  "requestId": "tg-829304-105421",
  "summary": { "total": 1, "ok": 1, "error": 0 },
  "results": [
    {
      "type": "finance",
      "externalId": "tg-829304-105421",
      "op": "upsert",
      "status": "ok",
      "localId": 1234
    }
  ]
}
```

### Idempotency

- `requestId` (ระดับคำขอ) — ถ้าส่ง requestId เดิมซ้ำ ระบบจะตอบ `deduped: true` ทันที ไม่ทำซ้ำ
- `externalId` (ระดับ event) — ถ้ามี HomeFinanceEntry ที่ `externalSource = source` และ `externalId` ตรงกัน จะ **update** แทน create

แนะนำ:

```
requestId  = "tg-<chat_id>-<message_id>-<batch_seq>"
externalId = "tg-<chat_id>-<message_id>"      (เพื่อให้แก้รายการเดิมได้เมื่อ OCR ใหม่)
```

---

## 5. หมวด (`categoryKey` ↔ `categoryLabel`) มาตรฐาน

```
UTILITIES_ELECTRIC   → "ค่าไฟฟ้า"
UTILITIES_WATER      → "ค่าน้ำประปา"
VEHICLE_CAR          → "รถยนต์"
VEHICLE_MOTORCYCLE   → "รถจักรยานยนต์"
VEHICLE_SERVICE      → "ซ่อม/เข้าศูนย์รถ"
GENERAL_FOOD         → "ค่าอาหาร"
GENERAL_HOME_REPAIR  → "ค่าซ่อมบ้าน"
GENERAL_SHOPPING     → "ของใช้ในบ้าน"
GENERAL_HEALTH       → "สุขภาพ/ยา"
GENERAL_EDUCATION    → "การศึกษา"
GENERAL_TRAVEL       → "เดินทาง"
GENERAL_INCOME       → "รายรับทั่วไป"
OTHER                → "อื่นๆ"
```

openclaw จะใช้คีย์อื่นได้ แต่ถ้าจะให้กรองในแอปง่ายควรยึดชุดนี้

---

## 6. ตรวจสอบและลบ

- **ดูรายการล่าสุดที่ sync เข้ามา**:

  ```bash
  curl -s "https://app.ma-well.com/api/sync/openclaw/events?ownerUserId=cmp0udptg00051t5p0hyecuvv&type=finance&limit=20" \
    -H "X-OpenClaw-Sync-Secret: $OPENCLAW_SYNC_SECRET"
  ```

- **ลบรายการ** (กรณีผู้ใช้บอก bot ว่าผิด):

  ```bash
  curl -sf -X POST https://app.ma-well.com/api/sync/openclaw/events \
    -H "X-OpenClaw-Sync-Secret: $OPENCLAW_SYNC_SECRET" \
    -H "Content-Type: application/json" \
    -d '{
      "ownerUserId": "cmp0udptg00051t5p0hyecuvv",
      "events": [{
        "type": "finance",
        "externalId": "tg-829304-105421",
        "op": "delete"
      }]
    }'
  ```

ไฟล์รูปบน disk ยังคงอยู่ — ถ้าต้องการลบไฟล์จริงด้วย ค่อยเพิ่ม endpoint cleanup ภายหลัง

---

## 7. Pseudocode สำหรับ openclaw

```python
def on_telegram_photo(update):
    owner_user_id = resolve_owner_user_id(update.message.chat.id)
    if not owner_user_id:
        bot.reply(update, "ยังไม่ผูกบัญชี ma-well")
        return

    external_id = f"tg-{update.message.chat.id}-{update.message.message_id}"

    photo = update.message.photo[-1]  # ใบที่ใหญ่สุด
    img_bytes = telegram_download(photo.file_id)

    # 1) อัปโหลดเข้า ma-well
    up = requests.post(
        f"{MA_WELL}/api/sync/openclaw/uploads",
        headers={"X-OpenClaw-Sync-Secret": SECRET},
        files={"file": ("slip.jpg", img_bytes, "image/jpeg")},
        data={"ownerUserId": owner_user_id, "externalId": external_id},
        timeout=30,
    ).json()
    image_url = up["imageUrl"]

    # 2) OCR ฝั่ง openclaw
    ocr = openclaw_ocr(img_bytes)
    fields = ocr["fields"]  # amount, date, merchant, ...

    # 3) สร้าง entry
    requests.post(
        f"{MA_WELL}/api/sync/openclaw/events",
        headers={
            "X-OpenClaw-Sync-Secret": SECRET,
            "Content-Type": "application/json",
        },
        json={
            "source": "openclaw",
            "ownerUserId": owner_user_id,
            "requestId": external_id,
            "events": [{
                "type": "finance",
                "externalId": external_id,
                "op": "upsert",
                "entryDate":  fields.get("date") or today_ymd(),
                "entryType":  fields.get("type") or "EXPENSE",
                "amount":     float(fields["amount"]),
                "title":      fields.get("merchant") or "รายการจากสลิป",
                "categoryKey":   fields.get("categoryKey")   or "GENERAL_SHOPPING",
                "categoryLabel": fields.get("categoryLabel") or "ของใช้ในบ้าน",
                "billNumber":    fields.get("referenceNo"),
                "paymentMethod": fields.get("paymentMethod"),
                "note":          f"OCR conf={ocr.get('confidence')}",
                "slipImageUrl":  image_url,
                "attachmentUrls": [image_url],
            }],
        },
        timeout=30,
    )
```

---

## 8. Security checklist

- [ ] `OPENCLAW_SYNC_SECRET` ในไฟล์ `.env` ของ ma-well เป็น random ≥ 32 ตัว
- [ ] ฝั่ง openclaw เก็บโทเค็นใน secret store (ไม่ commit ในโค้ด)
- [ ] เรียกผ่าน HTTPS เท่านั้น (`app.ma-well.com` ผ่าน Cloudflare Tunnel)
- [ ] log ที่ openclaw — mask `Authorization` / `X-OpenClaw-Sync-Secret`
- [ ] rate limit ฝั่ง openclaw ก่อนยิง ma-well (เผื่อ Telegram ส่งภาพ burst)
