#!/usr/bin/env bash
# =============================================================================
# MAWELL DB Restore — ดึง backup จากเครื่อง 2 → restore ลง MySQL ในเครื่อง 4
# -----------------------------------------------------------------------------
#   bash scripts/backup-db-restore.sh                 # ใช้ latest.sql.gz บนเครื่อง 2
#   bash scripts/backup-db-restore.sh <ชื่อไฟล์.sql.gz>  # ระบุไฟล์เอง
#   bash scripts/backup-db-restore.sh --list           # ลิสต์ไฟล์ที่มีบนเครื่อง 2
#
# ⚠️  RESTORE จะ DROP ฐานเดิม `mawell_buffet` แล้ว CREATE ใหม่ — ใช้เฉพาะตอนกู้
#     ตั้ง BACKUP_RESTORE_CONFIRM=YES หรือ ใส่ flag --yes เพื่อยืนยัน
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

CONFIG_FILE="${BACKUP_CONFIG_FILE:-$ROOT_DIR/scripts/backup-db.env}"
if [[ -f "$CONFIG_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a; source "$CONFIG_FILE"; set +a
fi

BACKUP_REMOTE_HOST="${BACKUP_REMOTE_HOST:-192.168.1.192}"
BACKUP_REMOTE_USER="${BACKUP_REMOTE_USER:-mawell}"
BACKUP_REMOTE_PATH="${BACKUP_REMOTE_PATH:-mawell-backups}"
BACKUP_REMOTE_PORT="${BACKUP_REMOTE_PORT:-22}"
BACKUP_SSH_KEY="${BACKUP_SSH_KEY:-$HOME/.ssh/id_ed25519}"

SOURCE_HOST="${SOURCE_HOST:-127.0.0.1}"
SOURCE_PORT="${SOURCE_PORT:-3306}"
SOURCE_USER="${SOURCE_USER:-root}"
SOURCE_DB="${SOURCE_DB:-mawell_buffet}"
SOURCE_PASSWORD="${SOURCE_PASSWORD:-}"

if [[ -z "$SOURCE_PASSWORD" && -f "$ROOT_DIR/.env" ]]; then
  url_line="$(grep -E '^DATABASE_URL=' "$ROOT_DIR/.env" | head -1 | sed -E 's/^DATABASE_URL="?([^"]+)"?$/\1/')"
  if [[ "$url_line" =~ mysql://([^:]+):([^@]+)@([^:/]+):([0-9]+)/(.+) ]]; then
    SOURCE_USER="${SOURCE_USER:-${BASH_REMATCH[1]}}"
    SOURCE_PASSWORD="${BASH_REMATCH[2]}"
    SOURCE_HOST="${SOURCE_HOST:-${BASH_REMATCH[3]}}"
    SOURCE_PORT="${SOURCE_PORT:-${BASH_REMATCH[4]}}"
    SOURCE_DB="${SOURCE_DB:-${BASH_REMATCH[5]%%\?*}}"
  fi
fi

SSH_OPTS=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new -p "$BACKUP_REMOTE_PORT")
if [[ -f "$BACKUP_SSH_KEY" ]]; then
  SSH_OPTS+=(-i "$BACKUP_SSH_KEY")
fi
SSH_TARGET="${BACKUP_REMOTE_USER}@${BACKUP_REMOTE_HOST}"

CONFIRM="${BACKUP_RESTORE_CONFIRM:-}"
TARGET_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --list)
      ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "ls -lh ~/${BACKUP_REMOTE_PATH}/${SOURCE_DB}-*.sql.gz 2>/dev/null | tail -30; ls -l ~/${BACKUP_REMOTE_PATH}/latest.sql.gz 2>/dev/null"
      exit 0
      ;;
    --yes|-y)
      CONFIRM="YES"; shift ;;
    --help|-h)
      sed -n '2,12p' "$0"; exit 0 ;;
    *)
      TARGET_FILE="$1"; shift ;;
  esac
done

[[ -n "$SOURCE_PASSWORD" ]] || { echo "ไม่พบ SOURCE_PASSWORD (.env หรือ scripts/backup-db.env)" >&2; exit 1; }
command -v mysql >/dev/null 2>&1 || { echo "ไม่มี mysql client ในเครื่อง" >&2; exit 1; }

REMOTE_FILE="${TARGET_FILE:-latest.sql.gz}"

if [[ "$CONFIRM" != "YES" ]]; then
  echo "⚠️  จะ DROP ฐาน '${SOURCE_DB}' บน ${SOURCE_HOST}:${SOURCE_PORT} แล้ว restore จาก ${SSH_TARGET}:${BACKUP_REMOTE_PATH}/${REMOTE_FILE}"
  read -r -p "พิมพ์ YES เพื่อยืนยัน: " ANS
  [[ "$ANS" == "YES" ]] || { echo "ยกเลิก"; exit 1; }
fi

echo "[restore] ดึง ~/${BACKUP_REMOTE_PATH}/${REMOTE_FILE} จาก ${SSH_TARGET} ..."
TMP_LOCAL="$(mktemp -t mawell-restore-XXXX).sql.gz"
trap 'rm -f "$TMP_LOCAL"' EXIT
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "cat ~/${BACKUP_REMOTE_PATH}/${REMOTE_FILE}" > "$TMP_LOCAL"

SIZE="$(du -h "$TMP_LOCAL" | awk '{print $1}')"
echo "[restore] ได้ไฟล์ขนาด ${SIZE} → DROP/CREATE/IMPORT '${SOURCE_DB}'"

export MYSQL_PWD="$SOURCE_PASSWORD"
mysql -h "$SOURCE_HOST" -P "$SOURCE_PORT" -u "$SOURCE_USER" \
  -e "DROP DATABASE IF EXISTS \`${SOURCE_DB}\`; CREATE DATABASE \`${SOURCE_DB}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

gunzip -c "$TMP_LOCAL" | mysql -h "$SOURCE_HOST" -P "$SOURCE_PORT" -u "$SOURCE_USER" "$SOURCE_DB"
unset MYSQL_PWD

echo "[restore] ✓ restore '${SOURCE_DB}' จาก ${REMOTE_FILE} เรียบร้อย"
echo "         อย่าลืม: npx prisma generate && pm2 restart software-mawell"
