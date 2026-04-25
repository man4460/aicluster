# OpenClaw Pull Sync (Project pulls from OpenClaw)

Use this when OpenClaw runs on another LAN machine and you want this project to fetch missing records automatically.

## 1) Configure env on project side

```env
OPENCLAW_SYNC_SECRET=openclaw-sync-2026
OPENCLAW_SYNC_PULL_URL=http://192.168.1.194:3000/api/sync/export
OPENCLAW_REMOTE_SYNC_SECRET=openclaw-sync-2026
```

Optional:

```env
OPENCLAW_SYNC_PULL_BEARER=<token>
```

## 2) OpenClaw export endpoint contract

`GET OPENCLAW_SYNC_PULL_URL?ownerUserId=<id>&sinceIso=<iso>&limit=<n>`

Response JSON:

```json
{
  "source": "openclaw",
  "requestId": "export-2026-04-25-001",
  "events": [
    {
      "type": "note",
      "externalId": "note-123",
      "op": "upsert",
      "content": "คุณนา — โทร 096-664-2536",
      "tags": ["contact"]
    }
  ]
}
```

## 3) Trigger pull from this project

```bash
curl -X POST "http://192.168.1.191:3000/api/sync/openclaw/pull" \
  -H "Content-Type: application/json" \
  -H "x-openclaw-sync-secret: openclaw-sync-2026" \
  -d '{
    "ownerUserId": "cmn1pz7w00001uaog0dbxhx5y",
    "source": "openclaw",
    "sinceIso": "2026-04-25T00:00:00.000Z",
    "limit": 200
  }'
```

The endpoint will:
- fetch events from OpenClaw export endpoint
- forward them into local `/api/sync/openclaw/events`
- return local sync result (`summary`, `results`, dedupe by `requestId`)
