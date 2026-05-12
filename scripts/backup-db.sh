#!/usr/bin/env bash
# =============================================================================
# MAWELL Backup — เครื่อง 4 (192.168.1.194) → เครื่อง 2 (192.168.1.192)
# -----------------------------------------------------------------------------
# - mysqldump local (mawell_buffet) → gzip → stream ผ่าน SSH ไปเก็บที่เครื่อง 2
# - ตั้งชื่อไฟล์ mawell_buffet-YYYYMMDD-HHMMSS.sql.gz ใต้ ~/mawell-backups/
# - อัปเดต symlink latest.sql.gz ชี้ไฟล์ล่าสุด
# - ลบไฟล์ DB backup เก่าเกิน BACKUP_RETENTION_DAYS (default 30)
# - rsync `public/uploads/` ไปเครื่อง 2 (mirror) — รูปสลิป/ไฟล์แนบทุก user
# - log ลง ~/logs/db-backup.log บนเครื่องต้นทาง
#
# รัน manual:
#   bash scripts/backup-db.sh
#
# ตั้ง cron อัตโนมัติ:
#   bash scripts/backup-db-setup.sh
#
# ปิด uploads sync ชั่วคราว: ตั้ง BACKUP_UPLOADS=false
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# ---------- โหลด config ----------
# ลำดับ: scripts/backup-db.env (ถ้ามี) → ENV var ที่ตั้งจาก caller → ค่าเริ่มต้น
CONFIG_FILE="${BACKUP_CONFIG_FILE:-$ROOT_DIR/scripts/backup-db.env}"
if [[ -f "$CONFIG_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a; source "$CONFIG_FILE"; set +a
fi

# ปลายทาง (เครื่อง 2)
BACKUP_REMOTE_HOST="${BACKUP_REMOTE_HOST:-192.168.1.192}"
BACKUP_REMOTE_USER="${BACKUP_REMOTE_USER:-mawell}"
BACKUP_REMOTE_PATH="${BACKUP_REMOTE_PATH:-mawell-backups}" # relative to remote $HOME
BACKUP_REMOTE_PORT="${BACKUP_REMOTE_PORT:-22}"
BACKUP_SSH_KEY="${BACKUP_SSH_KEY:-$HOME/.ssh/id_ed25519}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# uploads mirror (rsync)
BACKUP_UPLOADS="${BACKUP_UPLOADS:-true}"
BACKUP_UPLOADS_REMOTE_PATH="${BACKUP_UPLOADS_REMOTE_PATH:-mawell-uploads-mirror}" # relative ~/

# ต้นทาง (เครื่อง 4 — local MySQL)
SOURCE_HOST="${SOURCE_HOST:-127.0.0.1}"
SOURCE_PORT="${SOURCE_PORT:-3306}"
SOURCE_USER="${SOURCE_USER:-root}"
SOURCE_DB="${SOURCE_DB:-mawell_buffet}"
# SOURCE_PASSWORD: ถ้าไม่ตั้ง จะลองอ่านจาก DATABASE_URL ใน .env
SOURCE_PASSWORD="${SOURCE_PASSWORD:-}"

# ---------- log ----------
LOG_DIR="${BACKUP_LOG_DIR:-$HOME/logs}"
LOG_FILE="${BACKUP_LOG_FILE:-$LOG_DIR/db-backup.log}"
mkdir -p "$LOG_DIR"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" | tee -a "$LOG_FILE"
}

fail() {
  log "ERROR: $*"
  exit 1
}

# ---------- หา password จาก .env ถ้ายังไม่ตั้ง ----------
if [[ -z "$SOURCE_PASSWORD" && -f "$ROOT_DIR/.env" ]]; then
  # parse mysql://user:pass@host:port/db จาก DATABASE_URL
  url_line="$(grep -E '^DATABASE_URL=' "$ROOT_DIR/.env" | head -1 | sed -E 's/^DATABASE_URL="?([^"]+)"?$/\1/')"
  if [[ "$url_line" =~ mysql://([^:]+):([^@]+)@([^:/]+):([0-9]+)/(.+) ]]; then
    SOURCE_USER="${SOURCE_USER:-${BASH_REMATCH[1]}}"
    SOURCE_PASSWORD="${BASH_REMATCH[2]}"
    SOURCE_HOST="${SOURCE_HOST:-${BASH_REMATCH[3]}}"
    SOURCE_PORT="${SOURCE_PORT:-${BASH_REMATCH[4]}}"
    SOURCE_DB="${SOURCE_DB:-${BASH_REMATCH[5]%%\?*}}"
  fi
fi

[[ -n "$SOURCE_PASSWORD" ]] || fail "ไม่พบ SOURCE_PASSWORD (ตั้งใน scripts/backup-db.env หรือ DATABASE_URL ใน .env)"
command -v mysqldump >/dev/null 2>&1 || fail "ไม่มี mysqldump ในเครื่อง — brew install mysql-client หรือ mysql"
command -v gzip >/dev/null 2>&1 || fail "ไม่มี gzip"
command -v ssh >/dev/null 2>&1 || fail "ไม่มี ssh"

# ---------- ตรวจ SSH key ----------
SSH_OPTS=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new -p "$BACKUP_REMOTE_PORT")
if [[ -f "$BACKUP_SSH_KEY" ]]; then
  SSH_OPTS+=(-i "$BACKUP_SSH_KEY")
fi
SSH_TARGET="${BACKUP_REMOTE_USER}@${BACKUP_REMOTE_HOST}"

log "เริ่ม backup: ${SOURCE_USER}@${SOURCE_HOST}:${SOURCE_PORT}/${SOURCE_DB} → ${SSH_TARGET}:${BACKUP_REMOTE_PATH}/"

# ---------- ตรวจการเชื่อมต่อ SSH ก่อน ----------
if ! ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "mkdir -p ~/${BACKUP_REMOTE_PATH} && echo ok" >/dev/null; then
  fail "เชื่อม SSH ไป ${SSH_TARGET} (port ${BACKUP_REMOTE_PORT}) ไม่ได้ — รัน scripts/backup-db-setup.sh เพื่อตั้ง key"
fi

# ---------- เริ่มดัมป์ ----------
TS="$(date '+%Y%m%d-%H%M%S')"
REMOTE_FILE="${SOURCE_DB}-${TS}.sql.gz"
REMOTE_PATH="~/${BACKUP_REMOTE_PATH}/${REMOTE_FILE}"
TMP_LOCAL="$(mktemp -t mawell-backup-XXXX).sql.gz"

cleanup() { rm -f "$TMP_LOCAL"; }
trap cleanup EXIT

log "ดัมป์ลง $TMP_LOCAL ..."
export MYSQL_PWD="$SOURCE_PASSWORD"
# `--column-statistics=0` กัน mysql 8 client คุยกับ 5.7
# `--single-transaction` ดัมป์ขณะ DB ทำงานได้ปลอดภัย (InnoDB)
# `--routines --triggers --events` เก็บ stored procs / triggers / scheduled events
mysqldump \
  -h "$SOURCE_HOST" -P "$SOURCE_PORT" -u "$SOURCE_USER" \
  --single-transaction --routines --triggers --events \
  --set-gtid-purged=OFF \
  --column-statistics=0 \
  --no-tablespaces \
  "$SOURCE_DB" \
  | gzip -9 > "$TMP_LOCAL"
unset MYSQL_PWD

LOCAL_SIZE="$(du -h "$TMP_LOCAL" | awk '{print $1}')"
log "ดัมป์เสร็จ ขนาด ${LOCAL_SIZE} → ส่งไป ${REMOTE_PATH}"

# ---------- ส่งผ่าน SSH (cat | ssh ssh) ----------
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "mkdir -p ~/${BACKUP_REMOTE_PATH} && cat > ~/${BACKUP_REMOTE_PATH}/${REMOTE_FILE}" < "$TMP_LOCAL" \
  || fail "ส่งไฟล์ไป ${SSH_TARGET} ไม่สำเร็จ"

# ---------- อัปเดต symlink + retention บนเครื่อง 2 ----------
ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "
  set -e
  cd ~/${BACKUP_REMOTE_PATH}
  ln -sfn '${REMOTE_FILE}' latest.sql.gz
  # เก็บไม่เกิน ${BACKUP_RETENTION_DAYS} วัน — เฉพาะไฟล์ที่ขึ้นต้น ${SOURCE_DB}-
  find . -maxdepth 1 -type f -name '${SOURCE_DB}-*.sql.gz' -mtime +${BACKUP_RETENTION_DAYS} -print -delete | sed 's/^/[cleanup] ลบไฟล์เก่า: /'
  ls -lh '${REMOTE_FILE}'
" | tee -a "$LOG_FILE"

log "สำเร็จ → ${REMOTE_PATH} (size ${LOCAL_SIZE}, retention ${BACKUP_RETENTION_DAYS}d)"

# =============================================================================
# rsync mirror ของ public/uploads/  (รูปสลิป + ไฟล์แนบทุกโมดูล)
# =============================================================================
if [[ "${BACKUP_UPLOADS}" == "true" ]]; then
  if ! command -v rsync >/dev/null 2>&1; then
    log "WARN: ไม่มี rsync — ข้าม uploads mirror (brew install rsync)"
  elif [[ ! -d "$ROOT_DIR/public/uploads" ]]; then
    log "WARN: ไม่พบ $ROOT_DIR/public/uploads — ข้าม uploads mirror"
  else
    log "rsync uploads → ${SSH_TARGET}:~/${BACKUP_UPLOADS_REMOTE_PATH}/"
    # ใช้ SSH key เดียวกับ DB backup
    RSYNC_SSH_ARGS=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new -p "$BACKUP_REMOTE_PORT")
    if [[ -f "$BACKUP_SSH_KEY" ]]; then
      RSYNC_SSH_ARGS+=(-i "$BACKUP_SSH_KEY")
    fi
    RSYNC_SSH_CMD="ssh ${RSYNC_SSH_ARGS[*]}"

    # สร้างปลายทาง
    ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "mkdir -p ~/${BACKUP_UPLOADS_REMOTE_PATH}" >/dev/null \
      || { log "ERROR: สร้างโฟลเดอร์ปลายทาง mirror ไม่ได้"; exit 1; }

    # -a archive (เก็บ time/perm), -h human, --delete ลบไฟล์ฝั่งปลายทางที่ฝั่งต้นทางลบ
    # --partial-dir รองรับ resume ถ้าเชื่อมต่อหลุดกลางทาง
    rsync -ah --delete --partial-dir=.rsync-partial \
      -e "$RSYNC_SSH_CMD" \
      "$ROOT_DIR/public/uploads/" \
      "${SSH_TARGET}:~/${BACKUP_UPLOADS_REMOTE_PATH}/" \
      2>&1 | tee -a "$LOG_FILE" | tail -5 \
      || { log "ERROR: rsync uploads ล้มเหลว"; exit 1; }

    # บันทึก timestamp/marker บนปลายทาง — ดูได้ว่า mirror ล่าสุดเมื่อไหร่
    ssh "${SSH_OPTS[@]}" "$SSH_TARGET" \
      "date '+%Y-%m-%d %H:%M:%S' > ~/${BACKUP_UPLOADS_REMOTE_PATH}/.last-mirror" >/dev/null 2>&1 || true

    REMOTE_UPLOADS_SIZE="$(ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "du -sh ~/${BACKUP_UPLOADS_REMOTE_PATH} | awk '{print \$1}'" 2>/dev/null || echo "?")"
    log "uploads mirror สำเร็จ — ปลายทาง ~/${BACKUP_UPLOADS_REMOTE_PATH}/ (size ${REMOTE_UPLOADS_SIZE})"
  fi
else
  log "BACKUP_UPLOADS=false — ข้าม uploads mirror"
fi
