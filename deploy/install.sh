#!/usr/bin/env bash
set -euo pipefail
[[ "$EUID" -eq 0 ]] || { echo 'Run with sudo.' >&2; exit 1; }
source_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
command -v bridge >/dev/null
command -v python3 >/dev/null
command -v curl >/dev/null
release="/opt/watermark/releases/$(date -u +%Y%m%dT%H%M%SZ)"
previous="$(readlink -f /opt/watermark/current 2>/dev/null || true)"
install -d -m 0755 "$release/dist" "$release/deploy"
install -m 0644 "$source_dir/server.py" "$release/server.py"
for file in index.html app.js renderer.js i18n.js style.css favicon.svg favicon.ico favicon-32.png apple-touch-icon.png; do
  install -m 0644 "$source_dir/dist/$file" "$release/dist/$file"
done
install -m 0644 "$source_dir/deploy/bridge-registration.json" "$release/deploy/bridge-registration.json"
install -m 0644 "$source_dir/deploy/watermark.service" /etc/systemd/system/watermark.service
ln -s "$release" /opt/watermark/current.next
mv -Tf /opt/watermark/current.next /opt/watermark/current
systemctl daemon-reload
systemctl enable watermark.service
systemctl restart watermark.service
healthy=false
for attempt in {1..20}; do
  if curl --fail --silent http://127.0.0.1:18104/healthz >/dev/null; then healthy=true; break; fi
  sleep 1
done
if [[ "$healthy" != true ]]; then
  if [[ -n "$previous" && "$previous" == /opt/watermark/releases/* ]]; then
    ln -s "$previous" /opt/watermark/current.rollback
    mv -Tf /opt/watermark/current.rollback /opt/watermark/current
    systemctl restart watermark.service
  else
    systemctl stop watermark.service
  fi
  echo 'Origin health check failed; Bridge registration was not changed.' >&2
  exit 1
fi
bridge register "$release/deploy/bridge-registration.json"
curl --fail --silent --show-error -H 'Host: watermark.intqwq.com' http://127.0.0.1:18080/healthz
printf '\nInstalled: %s\n' "$release"
