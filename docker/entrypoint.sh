#!/bin/sh
set -e

# Docker Compose: สร้าง DATABASE_URL ใหม่ด้วยรหัสแบบ URL-encoded (รองรับ @ : / # ฯลฯ ใน MYSQL_ROOT_PASSWORD)
if [ "${PRISMA_DOCKER_REBUILD_DATABASE_URL:-}" = "1" ]; then
  if [ -z "${MYSQL_ROOT_PASSWORD:-}" ]; then
    echo "[docker] ต้องตั้ง MYSQL_ROOT_PASSWORD ใน .env สำหรับ docker compose" >&2
    exit 1
  fi
  _user="${MYSQL_USER:-root}"
  _host="${DOCKER_MYSQL_HOST:-db}"
  _port="${DOCKER_MYSQL_PORT:-3306}"
  _db="${MYSQL_DATABASE:-mawell_buffet}"
  # ตัด CRLF / ช่องว่าง — ให้ตรงกับที่ MySQL official image ใช้ตอน init (มิฉะนั้น P1000 บน Windows)
  _pass_enc="$(node -e "
const p = String(process.env.MYSQL_ROOT_PASSWORD || '').replace(/\r/g, '').trim();
if (!p) process.exit(1);
process.stdout.write(encodeURIComponent(p));
")"
  export DATABASE_URL="mysql://${_user}:${_pass_enc}@${_host}:${_port}/${_db}"
  echo "[docker] DATABASE_URL → mysql://${_user}:***@${_host}:${_port}/${_db}"
fi

if [ "${PRISMA_DB_PUSH:-}" = "1" ] || [ "${PRISMA_DB_PUSH:-}" = "true" ]; then
  echo "[docker] prisma db push (PRISMA_DB_PUSH)…"
  _push_flags="--skip-generate"
  if [ "${PRISMA_ACCEPT_DATA_LOSS:-}" = "1" ] || [ "${PRISMA_ACCEPT_DATA_LOSS:-}" = "true" ]; then
    _push_flags="$_push_flags --accept-data-loss"
    echo "[docker] PRISMA_ACCEPT_DATA_LOSS=1 — ยอมลบ/แก้ตารางตาม schema"
  fi
  npx prisma db push $_push_flags
else
  echo "[docker] prisma migrate deploy…"
  npx prisma migrate deploy
fi
echo "[docker] starting Next.js…"
exec npm run start