#!/usr/bin/env bash
set -Eeuo pipefail

base_url="${1:?Uso: scripts/smoke-test.sh <url-base> [versão-esperada]}"
expected_version="${2:-}"
attempts="${SMOKE_TEST_ATTEMPTS:-30}"
interval="${SMOKE_TEST_INTERVAL_SECONDS:-10}"
initial_delay="${SMOKE_TEST_INITIAL_DELAY_SECONDS:-5}"
required_successes="${SMOKE_TEST_REQUIRED_SUCCESSES:-3}"
health_url="${base_url%/}/health"
response_file="$(mktemp)"
trap 'rm -f "$response_file"' EXIT

if ((initial_delay > 0)); then
  echo "Aguardando ${initial_delay}s para o App Service aplicar a nova imagem"
  sleep "$initial_delay"
fi

consecutive_successes=0

for ((attempt = 1; attempt <= attempts; attempt++)); do
  status_code="$(curl --silent --show-error --location \
    --connect-timeout 5 --max-time 15 \
    --output "$response_file" --write-out '%{http_code}' \
    "$health_url" || true)"

  version_matches=true
  if [[ -n "$expected_version" ]] &&
    ! grep -Fq "\"version\":\"${expected_version}\"" "$response_file"; then
    version_matches=false
  fi

  if [[ "$status_code" == "200" ]] &&
    grep -Eq '"status"[[:space:]]*:[[:space:]]*"UP"' "$response_file" &&
    [[ "$version_matches" == true ]]; then
    ((consecutive_successes += 1))
    echo "Tentativa $attempt/$attempts: saúde confirmada ($consecutive_successes/$required_successes)"
    if ((consecutive_successes >= required_successes)); then
      echo "Smoke test aprovado em $health_url"
      exit 0
    fi
  else
    consecutive_successes=0
    echo "Tentativa $attempt/$attempts: aguardando versão ${expected_version:-qualquer} saudável; HTTP ${status_code:-000}"
  fi

  if ((attempt < attempts)); then
    sleep "$interval"
  fi
done

echo "Smoke test falhou após $attempts tentativas: $health_url" >&2
exit 1
