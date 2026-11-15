#!/usr/bin/env bash
# Pratinjau situs di HP.
#
#   ./scripts/preview-phone.sh
#
# Menyalakan dua hal sekaligus:
#   1. server pratinjau di jaringan lokal  → http://<IP-Mac>:4321  (satu WiFi)
#   2. tunnel publik Cloudflare            → https://xxxx.trycloudflare.com (di mana saja)
#
# Tutup dengan Ctrl+C. URL publik mati ketika skrip ini berhenti atau Mac tidur.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-4321}"

command -v cloudflared >/dev/null || { echo "cloudflared belum ada. Jalankan: brew install cloudflared"; exit 1; }

echo "→ build…"
npm run build >/dev/null

IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo '?')"
echo "→ pratinjau lokal: http://${IP}:${PORT}"

npx astro preview --port "$PORT" --host 0.0.0.0 --allowed-hosts .trycloudflare.com >/tmp/preview.log 2>&1 &
PREVIEW_PID=$!

cleanup() {
  echo
  echo "→ menghentikan…"
  kill "$PREVIEW_PID" 2>/dev/null || true
  kill "${TUNNEL_PID:-0}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

sleep 4
echo "→ membuka tunnel publik…"
cloudflared tunnel --url "http://127.0.0.1:${PORT}" --no-autoupdate >/tmp/cf-tunnel.log 2>&1 &
TUNNEL_PID=$!

for _ in $(seq 1 30); do
  URL="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cf-tunnel.log | head -1 || true)"
  [ -n "${URL:-}" ] && break
  sleep 1
done

if [ -n "${URL:-}" ]; then
  echo
  echo "  URL publik (buat dibuka di HP): $URL"
  echo "  Matikan dengan Ctrl+C."
  echo
else
  echo "Tunnel gagal — cek /tmp/cf-tunnel.log. Pratinjau lokal tetap jalan."
fi

wait "$PREVIEW_PID"
