#!/usr/bin/env bash
set -Eeuo pipefail

base_url="${1:?Uso: scripts/smoke-test.sh <url-base>}"
attempts="${SMOKE_TEST_ATTEMPTS:-30}"
interval="${SMOKE_TEST_INTERVAL_SECONDS:-10}"
health_url="${base_url%/}/health"
response_file="$(mktemp)"
trap 'rm -f "$response_file"' EXIT

for ((attempt = 1; attempt <= attempts; attempt++)); do
  status_code="$(curl --silent --show-error --location \
    --connect-timeout 5 --max-time 15 \
    --output "$response_file" --write-out '%{http_code}' \
    "$health_url" || true)"

  if [[ "$status_code" == "200" ]] && grep -Eq '"status"[[:space:]]*:[[:space:]]*"UP"' "$response_file"; then
    echo "Smoke test aprovado em $health_url"
    exit 0
  fi

  echo "Tentativa $attempt/$attempts: $health_url respondeu HTTP ${status_code:-000}"
  sleep "$interval"
done

echo "Smoke test falhou após $attempts tentativas: $health_url" >&2
exit 1
