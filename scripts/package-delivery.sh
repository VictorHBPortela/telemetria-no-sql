#!/usr/bin/env bash
set -Eeuo pipefail

repo_root="$(git rev-parse --show-toplevel)"
output="${1:-$repo_root/telemetria-no-sql-entrega.zip}"

required=(
  package.json
  bun.lock
  src
  tests
  .github/workflows/ci.yml
  .github/workflows/cd.yml
  Dockerfile
  docker-compose.yml
  .env.example
  config/staging.env.example
  config/production.env.example
  scripts/provision-azure.sh
  scripts/smoke-test.sh
  scripts/configure-azure-app.sh
)

cd "$repo_root"

if [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
  echo "O repositório possui alterações não commitadas; o ZIP arquiva somente o HEAD." >&2
  echo "Faça commit das alterações antes de gerar a entrega." >&2
  exit 1
fi

for path in "${required[@]}"; do
  git cat-file -e "HEAD:$path" 2>/dev/null || {
    echo "Arquivo obrigatório ausente no HEAD: $path" >&2
    exit 1
  }
done

case "$output" in
  /*) ;;
  *) output="$repo_root/$output" ;;
esac

git archive --format=zip --output="$output" HEAD
echo "Entrega gerada em: $output"
