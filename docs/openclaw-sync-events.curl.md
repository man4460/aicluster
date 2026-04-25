# OpenClaw Sync API Quick Curl

ตั้งค่า environment ก่อน:

```bash
export API_BASE="http://localhost:3000"
export SYNC_SECRET="openclaw-sync-2026-local"
export OWNER_USER_ID="cm123owneruserid"
```

## 1) Upsert events

```bash
curl -X POST "$API_BASE/api/sync/openclaw/events" \
  -H "Content-Type: application/json" \
  -H "x-openclaw-sync-secret: $SYNC_SECRET" \
  -d '{
    "source": "openclaw",
    "ownerUserId": "'"$OWNER_USER_ID"'",
    "requestId": "sync-2026-04-25-002",
    "events": [
      {
        "type": "note",
        "externalId": "note-9002",
        "op": "upsert",
        "content": "โทรหาช่างแอร์พรุ่งนี้เช้า",
        "tags": ["auto", "openclaw"]
      },
      {
        "type": "plan",
        "externalId": "plan-9002",
        "op": "upsert",
        "title": "ปลุกลูกตอน 23:50",
        "status": "TODO",
        "steps": ["ปลุกลูก"]
      },
      {
        "type": "finance",
        "externalId": "finance-9002",
        "op": "upsert",
        "entryDate": "2026-04-25",
        "entryType": "EXPENSE",
        "amount": 45,
        "title": "ค่าน้ำแข็ง",
        "categoryKey": "FOOD",
        "categoryLabel": "อาหาร"
      }
    ]
  }'
```

## 2) Retry safe (requestId dedupe)

ยิงซ้ำ request เดิมด้วย `requestId` เดิมได้เลย ระบบจะตอบ `deduped: true`

```bash
curl -X POST "$API_BASE/api/sync/openclaw/events" \
  -H "Content-Type: application/json" \
  -H "x-openclaw-sync-secret: $SYNC_SECRET" \
  -d '{
    "source": "openclaw",
    "ownerUserId": "'"$OWNER_USER_ID"'",
    "requestId": "sync-2026-04-25-002",
    "events": [
      {
        "type": "note",
        "externalId": "note-9002",
        "op": "upsert",
        "content": "โทรหาช่างแอร์พรุ่งนี้เช้า"
      }
    ]
  }'
```

## 3) Delete event by externalId

```bash
curl -X POST "$API_BASE/api/sync/openclaw/events" \
  -H "Content-Type: application/json" \
  -H "x-openclaw-sync-secret: $SYNC_SECRET" \
  -d '{
    "source": "openclaw",
    "ownerUserId": "'"$OWNER_USER_ID"'",
    "requestId": "sync-2026-04-25-003",
    "events": [
      { "type": "note", "externalId": "note-9002", "op": "delete" }
    ]
  }'
```

## 4) Debug external -> local mapping

```bash
curl "$API_BASE/api/sync/openclaw/events?ownerUserId=$OWNER_USER_ID&source=openclaw&type=finance&externalId=finance-9002" \
  -H "x-openclaw-sync-secret: $SYNC_SECRET"
```

## 5) Debug requestId dedupe history

```bash
curl "$API_BASE/api/sync/openclaw/events?ownerUserId=$OWNER_USER_ID&source=openclaw&requestId=sync-2026-04-25-002" \
  -H "x-openclaw-sync-secret: $SYNC_SECRET"
```
