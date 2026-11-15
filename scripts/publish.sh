#!/usr/bin/env bash
# Terbitkan perubahan ke situs permanen.
#
#   npm run publish          (atau ./scripts/publish.sh)
#   npm run publish "pesan commit"
#
# Alur: build di lokal sebagai pemeriksaan → simpan perubahan ke git →
# dorong ke GitHub → GitHub membangun ulang dan menerbitkan otomatis.
# Sekitar 1–2 menit setelah perintah ini selesai, situs sudah versi baru.
set -euo pipefail
cd "$(dirname "$0")/.."

SITE="https://dandielucky.github.io"
MSG="${1:-Perbarui konten situs}"

echo "→ memeriksa build di lokal (kalau rusak, tidak jadi diterbitkan)"
npm run build

echo "→ sisa slot aset yang belum diisi:"
npm run --silent check-assets | sed -n 's/^Sisa kerja: \(.*\)$/   \1/p' || true

echo "→ simpan perubahan"
git add -A
if git diff --cached --quiet; then
  echo "   tidak ada perubahan untuk diunggah."
else
  git commit -qm "$MSG"
  git push -q origin main
  echo "   terkirim: $MSG"
fi

echo "→ menunggu GitHub selesai menerbitkan…"
sleep 6
RUN_ID="$(gh run list --limit 1 --json databaseId,status --jq '.[0].databaseId' 2>/dev/null || true)"
if [ -n "${RUN_ID:-}" ]; then
  gh run watch "$RUN_ID" --exit-status --interval 8 >/dev/null 2>&1 && echo "   build GitHub: berhasil" || echo "   build GitHub: gagal — cek https://github.com/DandieLucky/dandielucky.github.io/actions"
fi

sleep 8
CODE="$(curl -s -o /dev/null -w '%{http_code}' -L "$SITE/")"
echo
echo "Situs: $SITE  (HTTP $CODE)"
