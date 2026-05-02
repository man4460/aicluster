#!/usr/bin/env bash
# Export mawell_buffet จาก MySQL ต้นทาง -> ไฟล์ .sql (ใช้บน Mac/Linux)
#   bash scripts/mysql-export-from-mysql.sh
# ตัวแปร: SOURCE_HOST (ค่าเริ่ม 127.0.0.1), SOURCE_PORT (3306), SOURCE_USER (root),
#         SOURCE_PASSWORD, DATABASE (mawell_buffet), OUT (./mawell_buffet_dump.sql)
set -euo pipefail
cd "$(dirname "$0")/.."
SOURCE_HOST="${SOURCE_HOST:-127.0.0.1}"
SOURCE_PORT="${SOURCE_PORT:-3306}"
SOURCE_USER="${SOURCE_USER:-root}"
DATABASE="${DATABASE:-mawell_buffet}"
OUT="${OUT:-./mawell_buffet_dump.sql}"
if [[ -z "${SOURCE_PASSWORD:-}" ]]; then
  read -r -s -p "รหัส MySQL ต้นทาง (${SOURCE_USER}): " SOURCE_PASSWORD
  echo
fi
export MYSQL_PWD="$SOURCE_PASSWORD"
mysqldump -h "$SOURCE_HOST" -P "$SOURCE_PORT" -u "$SOURCE_USER" \
  --single-transaction --routines --triggers \
  --set-gtid-purged=OFF --column-statistics=0 \
  "$DATABASE" > "$OUT"
unset MYSQL_PWD
echo "[export] เขียน $OUT — นำเข้า: RECREATE=1 bash scripts/mysql-import-to-docker.sh $OUT"
