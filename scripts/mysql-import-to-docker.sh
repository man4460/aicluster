#!/usr/bin/env bash
# นำเข้า .sql เข้า MySQL ใน Docker (service db)
# ใช้: จาก root โปรเจกต์
#   bash scripts/mysql-import-to-docker.sh path/to/dump.sql
#   RECREATE=1 bash scripts/mysql-import-to-docker.sh path/to/dump.sql
set -euo pipefail
cd "$(dirname "$0")/.."
DUMP="${1:?ระบุ path ไฟล์ dump}"
if [[ ! -f "$DUMP" ]]; then
  echo "ไม่พบไฟล์: $DUMP" >&2
  exit 1
fi
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi
: "${MYSQL_ROOT_PASSWORD:?ตั้ง MYSQL_ROOT_PASSWORD ใน .env}"
DB="${MYSQL_DATABASE:-mawell_buffet}"
if [[ "${RECREATE:-0}" == "1" ]]; then
  echo "[import] DROP + CREATE $DB ใน Docker (ข้อมูลเดิมใน Docker หาย)"
  docker compose exec -T db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "DROP DATABASE IF EXISTS '"$DB"'; CREATE DATABASE '"$DB"' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"'
fi
echo "[import] $DUMP -> Docker db:$DB"
cat "$DUMP" | docker compose exec -T db sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" --default-character-set=utf8mb4 '"$DB"
echo "[import] เสร็จ"
