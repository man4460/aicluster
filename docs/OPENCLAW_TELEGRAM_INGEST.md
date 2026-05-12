# OpenClaw — บันทึกสลิปจาก Telegram เข้าระบบรายรับ–รายจ่าย (MAWELL)

วิธีให้ openclaw (หรือ agent ใด ๆ ภายนอก) ดึงรูปสลิปจาก Telegram แล้วบันทึกเข้าระบบ
รายรับ–รายจ่ายของบ้าน ผ่าน HTTP API เท่านั้น

ทั้งสอง endpoint ใช้ shared secret เดียวกัน:

```env
# .env ฝั่ง ma-well
OPENCLAW_SYNC_SECRET=<random_long_token>
```

ส่งใน header ของทุก request (เลือกแบบใดแบบหนึ่ง):

```http
X-OpenClaw-Sync-Secret: <token>
# หรือ
Authorization: Bearer <token>
```

---

## Flow มาตรฐาน

```
Telegram → openclaw agent
              │
              │  (1) ดาวน์โหลด bytes ของรูปจาก Telegram
              │  (2) OCR / แยกข้อมูลสลิป
              │
              ▼
   POST /api/sync/openclaw/uploads      ← อัปโหลดรูปเข้า public/uploads/home-finance/<userId>/
   (multipart/form-data + secret)         คืน { imageUrl: "/uploads/home-finance/<userId>/<file>" }
              │
              ▼
   POST /api/sync/openclaw/events       ← สร้าง/อัปเดต HomeFinanceEntry
   (JSON + secret)                        ใส่ slipImageUrl / attachmentUrls = imageUrl จากขั้นที่แล้ว
```

ทั้งสอง endpoint **idempotent** — รันซ้ำด้วย `externalId` เดิม จะ upsert ไม่ทำซ้ำ

---

## ระบุเจ้าของรายการ — `ownerUserId` หรือ `ownerUsername`

ส่งทางใดทางหนึ่ง (ไม่ต้องส่งทั้งคู่):

| field | ตัวอย่าง | หมายเหตุ |
|---|---|---|
| `ownerUserId` | `"cmp0udptg00051t5p0hyecuvv"` | เสถียร ไม่เปลี่ยน — ใช้กรณีฝั่ง openclaw แมป chat → userId ไว้แล้ว |
| `ownerUsername` | `"mawell"` | อ่านง่าย — แต่ถ้า admin เปลี่ยน username ต้องอัปเดต mapping ฝั่ง agent |

ถ้าส่งมาทั้งคู่ — ใช้ `ownerUserId` เป็นหลัก

ไฟล์รูปจะถูกเก็บใต้ `/uploads/home-finance/<userId>/` ของผู้นั้นเสมอ (folder = userId)

---

## 1) `POST /api/sync/openclaw/uploads`

อัปโหลดไฟล์รูปสลิป / PDF — รับเป็น **multipart/form-data**

| field | ชนิด | ความยาว | คำอธิบาย |
|---|---|---|---|
| `file` | binary | ≤ 5 MB (รูป) / ≤ 8 MB (PDF) | JPG / PNG / WEBP / GIF / PDF |
| `ownerUserId` หรือ `ownerUsername` | string | ≤ 191 / ≤ 64 | ระบุเจ้าของ |
| `externalId` | string (optional) | ≤ 128 | ID ฝั่ง openclaw (เช่น `tg-<chat>-<message_id>`) — กันชนชื่อไฟล์ + ใช้ต่อใน event |

**Response 200**

```json
{
  "ok": true,
  "imageUrl": "/uploads/home-finance/cmp0udptg00051t5p0hyecuvv/tg-8283-12345-1778500000-a1b2c3.jpg",
  "filename": "tg-8283-12345-1778500000-a1b2c3.jpg",
  "bytes": 154321,
  "mime": "image/jpeg"
}
```

**Error** — 400 (validation), 401 (secret), 404 (owner ไม่พบ)

---

## 2) `POST /api/sync/openclaw/events`

สร้าง/อัปเดต/ลบรายการ — รับเป็น **JSON**

```json
{
  "source": "openclaw",
  "ownerUsername": "mawell",
  "requestId": "tg-8283-batch-2026-05-12T07:00",
  "events": [
    {
      "type": "finance",
      "op": "upsert",
      "externalId": "tg-8283-12345",
      "entry": {
        "entryDate": "2026-05-12",
        "type": "EXPENSE",
        "categoryKey": "GENERAL_FOOD",
        "categoryLabel": "ค่าอาหาร",
        "title": "ก๋วยเตี๋ยวเรือ - ร้านป้าทิพย์",
        "amount": 70,
        "paymentMethod": "พร้อมเพย์",
        "slipImageUrl": "/uploads/home-finance/cmp0udptg00051t5p0hyecuvv/tg-8283-12345-1778500000-a1b2c3.jpg",
        "note": "อาหารกลางวัน"
      }
    }
  ]
}
```

### Fields ของ event `type: "finance"`

| field | ชนิด | required | คำอธิบาย |
|---|---|---|---|
| `externalId` | string | ✓ | unique ต่อ owner — รันซ้ำจะ upsert |
| `op` | `"upsert"` หรือ `"delete"` | ✓ | |
| `entry.entryDate` | `YYYY-MM-DD` | ✓ (upsert) | วันที่รายการ |
| `entry.type` | `"INCOME"` หรือ `"EXPENSE"` | ✓ | |
| `entry.categoryKey` | string | ✓ | เห็นตารางหมวดด้านล่าง |
| `entry.categoryLabel` | string | ✓ | ข้อความ label ของหมวด |
| `entry.title` | string ≤ 160 | ✓ | |
| `entry.amount` | number (≥ 0) | ✓ | บาท (ทศนิยม 2 ตำแหน่ง) |
| `entry.dueDate` | `YYYY-MM-DD` | ✗ | ครบกำหนด |
| `entry.billNumber` | string ≤ 100 | ✗ | เลขที่ใบเสร็จ |
| `entry.paymentMethod` | string ≤ 40 | ✗ | เช่น "พร้อมเพย์", "บัตรเครดิต" |
| `entry.note` | string ≤ 600 | ✗ | |
| `entry.slipImageUrl` | string | ✗ | path คืนจาก `/uploads` endpoint |
| `entry.attachmentUrls` | string[] (≤ 20) | ✗ | หลายไฟล์ |
| `entry.syncedAt` | ISO 8601 | ✗ | |

### หมวด (built-in keys)

| key | label |
|---|---|
| `UTILITIES_ELECTRIC` | ค่าไฟฟ้า |
| `UTILITIES_WATER` | ค่าน้ำประปา |
| `VEHICLE_CAR` | รถยนต์ |
| `VEHICLE_MOTORCYCLE` | รถจักรยานยนต์ |
| `VEHICLE_SERVICE` | ซ่อม/เข้าศูนย์รถ |
| `GENERAL_FOOD` | ค่าอาหาร |
| `GENERAL_HOME_REPAIR` | ค่าซ่อมบ้าน |
| `GENERAL_SHOPPING` | ของใช้ในบ้าน |
| `GENERAL_HEALTH` | สุขภาพ/ยา |
| `GENERAL_EDUCATION` | การศึกษา |
| `GENERAL_TRAVEL` | เดินทาง |
| `GENERAL_INCOME` | รายรับทั่วไป |
| `OTHER` | อื่น ๆ |

ถ้าใช้ key อื่นนอกตารางได้ — แต่ตาราง dropdown ในแอปจะแสดงเฉพาะ built-in + custom ของ owner

---

## ตัวอย่าง — curl (copy-paste ทันที)

```bash
HOST="https://app.ma-well.com"
SECRET="<OPENCLAW_SYNC_SECRET>"
USERNAME="mawell"          # หรือใช้ OWNER_USER_ID="cmp0udptg00051t5p0hyecuvv"
EXT_ID="tg-8283-12345"

# 1) อัปโหลดรูป
UP=$(curl -sS -X POST "$HOST/api/sync/openclaw/uploads" \
  -H "X-OpenClaw-Sync-Secret: $SECRET" \
  -F "file=@/path/to/slip.jpg;type=image/jpeg" \
  -F "ownerUsername=$USERNAME" \
  -F "externalId=$EXT_ID")
echo "$UP"
IMAGE_URL=$(echo "$UP" | python3 -c "import sys,json; print(json.load(sys.stdin)['imageUrl'])")

# 2) สร้าง entry (idempotent ผ่าน externalId)
curl -sS -X POST "$HOST/api/sync/openclaw/events" \
  -H "X-OpenClaw-Sync-Secret: $SECRET" \
  -H "Content-Type: application/json" \
  -d "{
    \"source\": \"openclaw\",
    \"ownerUsername\": \"$USERNAME\",
    \"events\": [{
      \"type\": \"finance\",
      \"op\": \"upsert\",
      \"externalId\": \"$EXT_ID\",
      \"entry\": {
        \"entryDate\": \"2026-05-12\",
        \"type\": \"EXPENSE\",
        \"categoryKey\": \"GENERAL_FOOD\",
        \"categoryLabel\": \"ค่าอาหาร\",
        \"title\": \"ก๋วยเตี๋ยวเรือ ป้าทิพย์\",
        \"amount\": 70,
        \"paymentMethod\": \"พร้อมเพย์\",
        \"slipImageUrl\": \"$IMAGE_URL\"
      }
    }]
  }"
```

---

## ตัวอย่าง — Python (copy-paste ทันที)

ต้องการแค่ `requests` (`pip install requests`) — ใช้ในงาน openclaw หรือ Telegram bot ทั่วไป:

```python
"""
openclaw → ma-well integration: ดาวน์โหลดรูปสลิปจาก Telegram แล้ว upsert HomeFinanceEntry

Usage:
    from mawell_ingest import save_telegram_slip_to_mawell

    save_telegram_slip_to_mawell(
        photo_bytes=b"...JPEG bytes...",
        owner_username="mawell",
        telegram_chat_id=8283294851,
        telegram_message_id=12345,
        slip_data={
            "entryDate": "2026-05-12",
            "type": "EXPENSE",
            "categoryKey": "GENERAL_FOOD",
            "categoryLabel": "ค่าอาหาร",
            "title": "ก๋วยเตี๋ยวเรือ ป้าทิพย์",
            "amount": 70.0,
            "paymentMethod": "พร้อมเพย์",
        },
    )
"""
import os
import requests

MAWELL_HOST = os.environ.get("MAWELL_HOST", "https://app.ma-well.com")
SYNC_SECRET = os.environ["OPENCLAW_SYNC_SECRET"]
HEADERS_AUTH = {"X-OpenClaw-Sync-Secret": SYNC_SECRET}


def upload_slip(
    *,
    photo_bytes: bytes,
    owner_username: str | None = None,
    owner_user_id: str | None = None,
    external_id: str,
    mime: str = "image/jpeg",
    filename: str = "slip.jpg",
) -> str:
    """อัปโหลดไฟล์รูปสลิป → คืน imageUrl ที่ใช้ใน slipImageUrl ของ event"""
    if not owner_username and not owner_user_id:
        raise ValueError("ต้องระบุ owner_username หรือ owner_user_id อย่างน้อย 1 ตัว")

    data = {"externalId": external_id}
    if owner_user_id:
        data["ownerUserId"] = owner_user_id
    else:
        data["ownerUsername"] = owner_username

    res = requests.post(
        f"{MAWELL_HOST}/api/sync/openclaw/uploads",
        headers=HEADERS_AUTH,
        files={"file": (filename, photo_bytes, mime)},
        data=data,
        timeout=30,
    )
    res.raise_for_status()
    body = res.json()
    return body["imageUrl"]


def upsert_finance_event(
    *,
    owner_username: str | None = None,
    owner_user_id: str | None = None,
    external_id: str,
    entry: dict,
    request_id: str | None = None,
) -> dict:
    """สร้าง/อัปเดต HomeFinanceEntry — idempotent ตาม external_id"""
    if not owner_username and not owner_user_id:
        raise ValueError("ต้องระบุ owner_username หรือ owner_user_id อย่างน้อย 1 ตัว")

    payload = {
        "source": "openclaw",
        "events": [
            {
                "type": "finance",
                "op": "upsert",
                "externalId": external_id,
                "entry": entry,
            }
        ],
    }
    if owner_user_id:
        payload["ownerUserId"] = owner_user_id
    else:
        payload["ownerUsername"] = owner_username
    if request_id:
        payload["requestId"] = request_id

    res = requests.post(
        f"{MAWELL_HOST}/api/sync/openclaw/events",
        headers={**HEADERS_AUTH, "Content-Type": "application/json"},
        json=payload,
        timeout=30,
    )
    res.raise_for_status()
    return res.json()


def save_telegram_slip_to_mawell(
    *,
    photo_bytes: bytes,
    owner_username: str,
    telegram_chat_id: int,
    telegram_message_id: int,
    slip_data: dict,
) -> dict:
    """One-shot helper — เรียกจาก Telegram bot handler ได้เลย"""
    external_id = f"tg-{telegram_chat_id}-{telegram_message_id}"

    image_url = upload_slip(
        photo_bytes=photo_bytes,
        owner_username=owner_username,
        external_id=external_id,
    )

    entry = {**slip_data, "slipImageUrl": image_url}
    return upsert_finance_event(
        owner_username=owner_username,
        external_id=external_id,
        entry=entry,
    )
```

---

## ตัวอย่าง — Telegram bot handler ที่ใช้กับ python-telegram-bot

```python
import os
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, MessageHandler, filters

from mawell_ingest import save_telegram_slip_to_mawell

# map chat_id → username ใน MA-WELL  (ดูแบบง่าย — production ใส่ใน DB)
TELEGRAM_OWNER_MAP = {
    8283294851: "mawell",
    # 1234567890: "farm",
}


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    owner = TELEGRAM_OWNER_MAP.get(chat_id)
    if not owner:
        await update.message.reply_text("chat นี้ยังไม่ได้แมปกับบัญชี MA-WELL")
        return

    photo = update.message.photo[-1]  # ความละเอียดสูงสุด
    file = await context.bot.get_file(photo.file_id)
    photo_bytes = await file.download_as_bytearray()

    # *** ส่วน OCR / parse สลิป ปล่อยให้ฝั่ง openclaw ทำเอง ***
    # ตัวอย่าง: ผลลัพธ์ OCR
    parsed = {
        "entryDate": "2026-05-12",
        "type": "EXPENSE",
        "categoryKey": "GENERAL_FOOD",
        "categoryLabel": "ค่าอาหาร",
        "title": "ก๋วยเตี๋ยวเรือ ป้าทิพย์",
        "amount": 70.0,
        "paymentMethod": "พร้อมเพย์",
    }

    result = save_telegram_slip_to_mawell(
        photo_bytes=bytes(photo_bytes),
        owner_username=owner,
        telegram_chat_id=chat_id,
        telegram_message_id=update.message.message_id,
        slip_data=parsed,
    )
    await update.message.reply_text(
        f"บันทึกแล้ว: {parsed['title']} {parsed['amount']:.2f} บาท\nผลลัพธ์: {result['summary']}"
    )


def main():
    app = ApplicationBuilder().token(os.environ["TELEGRAM_BOT_TOKEN"]).build()
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))
    app.run_polling()


if __name__ == "__main__":
    main()
```

---

## ทดสอบเร็ว ๆ จาก local

```bash
# ทดสอบ secret ถูก + รูปขึ้นจริง
curl -sS "https://app.ma-well.com/api/sync/openclaw/uploads" \
  -H "X-OpenClaw-Sync-Secret: $OPENCLAW_SYNC_SECRET" \
  -F "file=@./sample-slip.jpg" \
  -F "ownerUsername=mawell" \
  -F "externalId=test-$(date +%s)" | jq .
```

ตอบกลับควรได้:

```json
{
  "ok": true,
  "imageUrl": "/uploads/home-finance/cmp0udptg00051t5p0hyecuvv/test-1778500000-1778500001-a1b2c3.jpg",
  ...
}
```

เปิด URL ได้ → ระบบพร้อมใช้งาน

---

## Security checklist

- [ ] ตั้ง `OPENCLAW_SYNC_SECRET` ความยาว ≥ 32 ตัวอักษร และอย่า leak ลงใน repo
- [ ] หมุน secret เป็นระยะ (rotate)
- [ ] ฝั่ง openclaw — เก็บ secret ใน vault/env เท่านั้น ไม่ใส่ใน log
- [ ] ระวัง chat อื่นแอบส่ง photo มา — bot ต้อง map `chat_id → owner` อย่างเข้มงวด
- [ ] รายการที่ลงผิด — แก้โดยส่ง event เดิมที่ `op: "delete"` หรือ upsert ใหม่ด้วย `externalId` เดิมจะแทนที่ค่าเก่า
