# MAWELL × Gemini — Knowledge API + Tools

ให้ Gemini (หรือ AI อื่นที่รองรับ function calling) **ถามแคตตาล็อกแพลตฟอร์ม** ได้แบบสด  
คู่กับไฟล์ความรู้คงที่: [`MAWELL-PLATFORM-BRIEF.md`](./MAWELL-PLATFORM-BRIEF.md)

> API นี้ = **อ่านอย่างเดียว** · ไม่มีข้อมูลลูกค้า/การเงินร้าน · ต้องมี API key

---

## 1) ตั้งค่าเซิร์ฟเวอร์

ใน `.env` / `.env.local` / โปรดักชัน:

```env
MAWELL_AI_KNOWLEDGE_API_KEY="ใส่สตริงสุ่มยาวอย่างน้อย 32 ตัวอักษร"
APP_URL="https://app.ma-well.com"
# หรือ NEXT_PUBLIC_APP_URL
```

สร้างคีย์ตัวอย่าง (เครื่องคุณ):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 2) Endpoints

Base: `{APP_ORIGIN}/api/ai/platform`

| Method | Path | ใช้เมื่อ |
|--------|------|---------|
| GET | `/api/ai/platform` | สรุปแพลตฟอร์ม |
| GET | `/api/ai/platform/modules` | รายการโมดูล |
| GET | `/api/ai/platform/modules/{slug}` | รายละเอียดโมดูล |
| GET | `/api/ai/platform/rules?topic=` | กฎ (billing\|timezone\|qr\|roles\|ux\|print\|security\|all) |
| GET | `/api/ai/platform/tools` | function declarations + แผนที่ endpoint |

### Auth (บังคับ)

```http
Authorization: Bearer <MAWELL_AI_KNOWLEDGE_API_KEY>
```

หรือ

```http
X-Mawell-Ai-Key: <MAWELL_AI_KNOWLEDGE_API_KEY>
```

### Query ของ `/modules`

- `visibleOnly=true` — เฉพาะที่ลูกค้าเห็น
- `freeOnly=true` — โมดูลฟรี
- `dailyOnly=true` — สายรายวัน
- `groupId=1`
- `q=ซักผ้า` หรือ `laundry`

### ตัวอย่าง curl

```bash
export KEY="your-key"
export BASE="http://localhost:3000"

curl -s -H "Authorization: Bearer $KEY" "$BASE/api/ai/platform" | head
curl -s -H "Authorization: Bearer $KEY" "$BASE/api/ai/platform/modules?visibleOnly=true&q=laundry"
curl -s -H "Authorization: Bearer $KEY" "$BASE/api/ai/platform/modules/smart-guard-tour"
curl -s -H "Authorization: Bearer $KEY" "$BASE/api/ai/platform/rules?topic=billing"
curl -s -H "Authorization: Bearer $KEY" "$BASE/api/ai/platform/tools"
```

---

## 3) Gemini function declarations (คัดลอกได้)

ดึงสดจาก API: `GET /api/ai/platform/tools`  
หรือใช้ชุดนี้:

```json
{
  "functionDeclarations": [
    {
      "name": "get_platform_overview",
      "description": "สรุปแพลตฟอร์ม MAWELL: แบรนด์ โมเดลธุรกิจ โทเคน บทบาท tech stack และจำนวนโมดูล",
      "parameters": { "type": "OBJECT", "properties": {} }
    },
    {
      "name": "list_modules",
      "description": "รายการโมดูล MAWELL กรองได้ด้วย freeOnly, visibleOnly, dailyOnly, groupId, q",
      "parameters": {
        "type": "OBJECT",
        "properties": {
          "freeOnly": { "type": "BOOLEAN" },
          "visibleOnly": { "type": "BOOLEAN" },
          "dailyOnly": { "type": "BOOLEAN" },
          "groupId": { "type": "INTEGER" },
          "q": { "type": "STRING" }
        }
      }
    },
    {
      "name": "get_module_detail",
      "description": "รายละเอียดโมดูลตาม slug เช่น laundry, barber, smart-guard-tour",
      "parameters": {
        "type": "OBJECT",
        "properties": {
          "slug": { "type": "STRING" }
        },
        "required": ["slug"]
      }
    },
    {
      "name": "get_platform_rules",
      "description": "กฎแพลตฟอร์ม: billing | timezone | qr | roles | ux | print | security | all",
      "parameters": {
        "type": "OBJECT",
        "properties": {
          "topic": { "type": "STRING" }
        }
      }
    }
  ]
}
```

### แมป tool → HTTP

| Tool | HTTP |
|------|------|
| `get_platform_overview` | `GET /api/ai/platform` |
| `list_modules` | `GET /api/ai/platform/modules?...` จาก args |
| `get_module_detail` | `GET /api/ai/platform/modules/{slug}` |
| `get_platform_rules` | `GET /api/ai/platform/rules?topic={topic}` |

---

## 4) System prompt แนะนำ (สั้น)

```
คุณเป็นผู้ช่วยที่รู้แพลตฟอร์ม MAWELL (SaaS ธุรกิจไทยของหจก.มาเวล)
เมื่อถูกถามว่ามีระบบอะไร / ทำงานอย่างไร / กฎโทเคน-QR-เวลา
ให้เรียก tools ของ Knowledge API ก่อนตอบ และอย่าเดาข้อมูลลูกค้าจริง
อ้างอิง slug จริง เช่น laundry, smart-guard-tour (ชื่อแสดง: ธุรกิจ รปภ.)
เวลาธุรกิจเป็น Asia/Bangkok
```

อัปโหลดเพิ่ม: ไฟล์ `docs/MAWELL-PLATFORM-BRIEF.md` เข้า Gemini File Search / context ได้

---

## 5) ตัวอย่างโค้ด Node (function calling แบบง่าย)

```js
async function callMawellTool(name, args, { base, key }) {
  const headers = { Authorization: `Bearer ${key}` };
  if (name === "get_platform_overview") {
    return fetch(`${base}/api/ai/platform`, { headers }).then((r) => r.json());
  }
  if (name === "list_modules") {
    const q = new URLSearchParams();
    for (const k of ["freeOnly", "visibleOnly", "dailyOnly", "groupId", "q"]) {
      if (args[k] != null && args[k] !== "") q.set(k, String(args[k]));
    }
    return fetch(`${base}/api/ai/platform/modules?${q}`, { headers }).then((r) => r.json());
  }
  if (name === "get_module_detail") {
    return fetch(`${base}/api/ai/platform/modules/${encodeURIComponent(args.slug)}`, {
      headers,
    }).then((r) => r.json());
  }
  if (name === "get_platform_rules") {
    const topic = args.topic || "all";
    return fetch(`${base}/api/ai/platform/rules?topic=${encodeURIComponent(topic)}`, {
      headers,
    }).then((r) => r.json());
  }
  throw new Error(`Unknown tool: ${name}`);
}
```

ต่อกับ `@google/generative-ai` โดยส่ง `functionDeclarations` แล้วเมื่อโมเดลขอ tool ให้เรียก `callMawellTool` แล้วส่งผลกลับเป็น function response

---

## 6) ความปลอดภัย

- อย่า commit API key ลง git
- หมุนคีย์ถ้าหลุด
- อย่าเปิด endpoint นี้โดยไม่มีคีย์
- อย่าผูก tool นี้กับ API ที่แก้ข้อมูลร้านลูกค้าโดยไม่มี OAuth/session แยก
