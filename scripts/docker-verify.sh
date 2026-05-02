#!/usr/bin/env bash
# Mac / Linux: build + up + smoke test
# ใช้: chmod +x scripts/docker-verify.sh && ./scripts/docker-verify.sh
# เก็บคอนเทนเนอร์ไว้: DOCKER_VERIFY_KEEP=1 ./scripts/docker-verify.sh

set -euo pipefail
cd "$(dirname "$0")/.."

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon ไม่ได้รัน — เปิด Docker Desktop / OrbStack ก่อน" >&2
  exit 1
fi

if [[ -z "${MYSQL_ROOT_PASSWORD:-}" || -z "${AUTH_SECRET:-}" ]] && [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ -z "${MYSQL_ROOT_PASSWORD:-}" || -z "${AUTH_SECRET:-}" ]]; then
  echo "ตั้ง MYSQL_ROOT_PASSWORD และ AUTH_SECRET ใน .env" >&2
  exit 1
fi

PORT="${APP_PORT:-3000}"

echo "[docker-verify] docker compose build app …"
docker compose build app

echo "[docker-verify] docker compose up -d …"
docker compose up -d

echo "[docker-verify] รอแอปพร้อม …"
ok=0
for i in $(seq 1 45); do
  sleep 2
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}/" || true)
  if [[ "$code" =~ ^2|^3 ]]; then
    ok=1
    break
  fi
done

if [[ "$ok" -ne 1 ]]; then
  echo "[docker-verify] ล้มเหลว — logs app:" >&2
  docker compose logs --tail 80 app
  docker compose down
  exit 1
fi

echo "[docker-verify] ผ่าน: HTTP $code จาก http://127.0.0.1:${PORT}/"

if [[ "${DOCKER_VERIFY_KEEP:-}" != "1" ]]; then
  echo "[docker-verify] docker compose down …"
  docker compose down
else
  echo "[docker-verify] คอนเทนเนอร์ยังรัน — หยุด: docker compose down"
fi
