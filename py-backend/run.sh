#!/usr/bin/env bash
# Starts the FleetFuel Python analytics service.
#
#   ./py-backend/run.sh            # dev, port 8000
#   PORT=9000 ./py-backend/run.sh  # custom port
#
# Dependencies are vendored into ./lib so they survive container restarts.
# If ./lib is missing, requirements are installed there automatically.
#
# Next.js picks the service up automatically when PY_API_URL is set in .env.
set -euo pipefail

cd "$(dirname "$0")"

# Vendor dependencies into the project (persistent) instead of system site-packages.
if [ ! -d ./lib ] || ! PYTHONPATH=./lib python3 -c "import uvicorn" >/dev/null 2>&1; then
  echo "[run.sh] installing dependencies into ./lib …"
  pip3 install --quiet --target ./lib -r requirements.txt
fi

export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/app_db}"
export PY_SERVICE_TOKEN="${PY_SERVICE_TOKEN:-devtoken}"
export PYTHONPATH="./lib:${PYTHONPATH:-}"
PORT="${PORT:-8000}"
WORKERS="${WORKERS:-1}"

exec python3 -m uvicorn main:app \
  --host 0.0.0.0 \
  --port "$PORT" \
  --workers "$WORKERS" \
  --no-access-log
