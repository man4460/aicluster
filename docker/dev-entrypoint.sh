#!/bin/sh
set -e

# Dev container: สร้าง DATABASE_URL แบบ URL-encoded (เทียบเคียง docker/entrypoint.sh)
if [ "${PRISMA_DOCKER_REBUILD_DATABASE_URL:-}" = "1" ]; then
  if [ -z "${MYSQL_ROOT_PASSWORD:-}" ]; then
    echo "[docker-dev] ต้องตั้ง MYSQL_ROOT_PASSWORD ใน .env" >&2
    exit 1
  fi
  _user="${MYSQL_USER:-root}"
  _host="${DOCKER_MYSQL_HOST:-db}"
  _port="${DOCKER_MYSQL_PORT:-3306}"
  _db="${MYSQL_DATABASE:-mawell_buffet}"
  _pass_enc="$(node -e "
const p = String(process.env.MYSQL_ROOT_PASSWORD || '').replace(/\r/g, '').trim();
if (!p) process.exit(1);
process.stdout.write(encodeURIComponent(p));
")"
  export DATABASE_URL="mysql://${_user}:${_pass_enc}@${_host}:${_port}/${_db}"
  echo "[docker-dev] DATABASE_URL → mysql://${_user}:***@${_host}:${_port}/${_db}"
fi

if [ ! -d node_modules/next ]; then
  echo "[docker-dev] npm ci…"
  npm ci
fi

echo "[docker-dev] prisma generate…"
npx prisma generate

if [ "${PRISMA_DB_PUSH:-}" = "1" ] || [ "${PRISMA_DB_PUSH:-}" = "true" ]; then
  echo "[docker-dev] prisma db push…"
  _push_flags="--skip-generate"
  if [ "${PRISMA_ACCEPT_DATA_LOSS:-}" = "1" ] || [ "${PRISMA_ACCEPT_DATA_LOSS:-}" = "true" ]; then
    _push_flags="$_push_flags --accept-data-loss"
  fi
  npx prisma db push $_push_flags
else
  echo "[docker-dev] prisma migrate deploy…"
  npx prisma migrate deploy
fi

exec "$@"
