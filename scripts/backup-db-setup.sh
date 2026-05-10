#!/usr/bin/env bash
# =============================================================================
# MAWELL DB Backup — ตัวช่วยติดตั้งระบบ backup ครั้งเดียว
# -----------------------------------------------------------------------------
#   bash scripts/backup-db-setup.sh ssh        # สร้าง/ตรวจ SSH key + copy ไปเครื่อง 2
#   bash scripts/backup-db-setup.sh install    # ติดตั้ง LaunchAgent (cron 02:00 ทุกวัน)
#   bash scripts/backup-db-setup.sh uninstall  # ปลด LaunchAgent
#   bash scripts/backup-db-setup.sh status     # ตรวจสถานะ LaunchAgent
#   bash scripts/backup-db-setup.sh test       # ลองรัน backup ทันที 1 ครั้ง
#   bash scripts/backup-db-setup.sh all        # ssh + install + test
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
BACKUP_REMOTE_PORT="${BACKUP_REMOTE_PORT:-22}"
BACKUP_REMOTE_PATH="${BACKUP_REMOTE_PATH:-mawell-backups}"
BACKUP_SSH_KEY="${BACKUP_SSH_KEY:-$HOME/.ssh/id_ed25519}"

LABEL="com.mawell.db-backup"
PLIST_TMPL="$ROOT_DIR/scripts/${LABEL}.plist.tmpl"
PLIST_DST="$HOME/Library/LaunchAgents/${LABEL}.plist"
SSH_TARGET="${BACKUP_REMOTE_USER}@${BACKUP_REMOTE_HOST}"

cmd_ssh() {
  if [[ ! -f "$BACKUP_SSH_KEY" ]]; then
    echo "[ssh] สร้าง SSH key ใหม่ที่ ${BACKUP_SSH_KEY}"
    ssh-keygen -t ed25519 -f "$BACKUP_SSH_KEY" -N "" -C "mawell-db-backup@$(hostname -s)"
  else
    echo "[ssh] มี key อยู่แล้วที่ ${BACKUP_SSH_KEY}"
  fi

  if ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new -p "$BACKUP_REMOTE_PORT" -i "$BACKUP_SSH_KEY" "$SSH_TARGET" "echo ok" >/dev/null 2>&1; then
    echo "[ssh] ✓ login ${SSH_TARGET}:${BACKUP_REMOTE_PORT} ด้วย key ใช้งานได้แล้ว"
  else
    echo "[ssh] ยังไม่มี key authorized — กำลัง copy public key (ใส่รหัสผ่านของ ${BACKUP_REMOTE_USER} 1 ครั้ง)"
    if command -v ssh-copy-id >/dev/null 2>&1; then
      ssh-copy-id -p "$BACKUP_REMOTE_PORT" -i "${BACKUP_SSH_KEY}.pub" "$SSH_TARGET"
    else
      ssh -p "$BACKUP_REMOTE_PORT" "$SSH_TARGET" "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys" < "${BACKUP_SSH_KEY}.pub"
    fi
    echo "[ssh] ✓ copy key เรียบร้อย"
  fi

  ssh -o BatchMode=yes -p "$BACKUP_REMOTE_PORT" -i "$BACKUP_SSH_KEY" "$SSH_TARGET" "mkdir -p ~/${BACKUP_REMOTE_PATH} && echo '[remote] ~/${BACKUP_REMOTE_PATH} พร้อมใช้งาน'"
}

cmd_install() {
  [[ -f "$PLIST_TMPL" ]] || { echo "ไม่พบ template ${PLIST_TMPL}" >&2; exit 1; }
  mkdir -p "$HOME/Library/LaunchAgents" "$HOME/logs"

  # render template
  sed -e "s#{{REPO_DIR}}#${ROOT_DIR}#g" \
      -e "s#{{HOME_DIR}}#${HOME}#g" \
      "$PLIST_TMPL" > "$PLIST_DST"

  # ปลดเก่าก่อนถ้ามี (ไม่ fail)
  launchctl unload "$PLIST_DST" >/dev/null 2>&1 || true
  launchctl load -w "$PLIST_DST"
  echo "[install] ✓ ติดตั้ง LaunchAgent → ${PLIST_DST}"
  echo "[install]   ตารางเวลา: ทุกวัน 02:00 น."
  echo "[install]   ตรวจสถานะ: bash scripts/backup-db-setup.sh status"
}

cmd_uninstall() {
  if [[ -f "$PLIST_DST" ]]; then
    launchctl unload "$PLIST_DST" >/dev/null 2>&1 || true
    rm -f "$PLIST_DST"
    echo "[uninstall] ✓ ลบ LaunchAgent ${PLIST_DST}"
  else
    echo "[uninstall] ไม่มี ${PLIST_DST}"
  fi
}

cmd_status() {
  echo "--- LaunchAgent ---"
  if [[ -f "$PLIST_DST" ]]; then
    echo "[plist] ${PLIST_DST}"
    launchctl list | grep -E "${LABEL}\b" || echo "[launchctl] (ยังไม่ได้ load หรือ unload อยู่)"
  else
    echo "[plist] (ยังไม่ติดตั้ง)"
  fi
  echo "--- log ล่าสุด ---"
  if [[ -f "$HOME/logs/db-backup.log" ]]; then
    tail -n 12 "$HOME/logs/db-backup.log"
  else
    echo "(ยังไม่มี log)"
  fi
  echo "--- ไฟล์ backup บนเครื่อง 2 ---"
  ssh -o BatchMode=yes -p "$BACKUP_REMOTE_PORT" ${BACKUP_SSH_KEY:+-i "$BACKUP_SSH_KEY"} "$SSH_TARGET" \
    "ls -lh ~/${BACKUP_REMOTE_PATH}/*.sql.gz 2>/dev/null | tail -10; ls -l ~/${BACKUP_REMOTE_PATH}/latest.sql.gz 2>/dev/null" \
    || echo "(เชื่อม ${SSH_TARGET} ไม่ได้)"
}

cmd_test() {
  bash "$ROOT_DIR/scripts/backup-db.sh"
}

case "${1:-}" in
  ssh) cmd_ssh ;;
  install) cmd_install ;;
  uninstall) cmd_uninstall ;;
  status) cmd_status ;;
  test) cmd_test ;;
  all) cmd_ssh && cmd_install && cmd_test && cmd_status ;;
  *)
    sed -n '2,12p' "$0"
    exit 1 ;;
esac
