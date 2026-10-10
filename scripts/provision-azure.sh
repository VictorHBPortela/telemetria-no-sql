#!/usr/bin/env bash
set -Eeuo pipefail

required=(
  AZURE_RESOURCE_GROUP
  AZURE_APP_SERVICE_PLAN
  AZURE_WEBAPP_NAME
  AZURE_CONTAINER_REGISTRY
  GITHUB_REPOSITORY
)

for variable in "${required[@]}"; do
  [[ -n "${!variable:-}" ]] || { echo "Variável obrigatória ausente: $variable" >&2; exit 1; }
done

command -v az >/dev/null || { echo "Azure CLI não encontrado" >&2; exit 1; }
az account show >/dev/null || { echo "Execute 'az login' antes deste script" >&2; exit 1; }

location="${AZURE_LOCATION:-brazilsouth}"
sku="${AZURE_APP_SERVICE_SKU:-S1}"
identity_name="${AZURE_GITHUB_IDENTITY_NAME:-${AZURE_WEBAPP_NAME}-github}"
image_name="${CONTAINER_IMAGE_NAME:-telemetria-no-sql}"

[[ "$GITHUB_REPOSITORY" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] || {
  echo "GITHUB_REPOSITORY deve estar no formato owner/repository" >&2
  exit 1
}
[[ "$sku" =~ ^(S[1-3]|P[0-9].*|I[1-6].*)$ ]] || {
  echo "AZURE_APP_SERVICE_SKU deve oferecer deployment slots (por exemplo, S1 ou P0V3)" >&2
  exit 1
}

resource_group="$AZURE_RESOURCE_GROUP"
plan_name="$AZURE_APP_SERVICE_PLAN"
webapp_name="$AZURE_WEBAPP_NAME"
registry_name="$AZURE_CONTAINER_REGISTRY"

az group create \
  --name "$resource_group" \
  --location "$location" \
  --output none

if ! az acr show --name "$registry_name" --resource-group "$resource_group" >/dev/null 2>&1; then
  az acr create \
    --name "$registry_name" \
    --resource-group "$resource_group" \
    --location "$location" \
    --sku Basic \
    --output none
fi

if ! az appservice plan show --name "$plan_name" --resource-group "$resource_group" >/dev/null 2>&1; then
  az appservice plan create \
    --name "$plan_name" \
    --resource-group "$resource_group" \
    --location "$location" \
    --sku "$sku" \
    --is-linux \
    --output none
fi

if ! az webapp show --name "$webapp_name" --resource-group "$resource_group" >/dev/null 2>&1; then
  az webapp create \
    --name "$webapp_name" \
    --resource-group "$resource_group" \
    --plan "$plan_name" \
    --container-image-name mcr.microsoft.com/azuredocs/aci-helloworld:latest \
    --https-only true \
    --output none
fi

client_id="$(az ad app list --display-name "$identity_name" --query '[0].appId' --output tsv)"
if [[ -z "$client_id" ]]; then
  client_id="$(az ad app create --display-name "$identity_name" --query appId --output tsv)"
fi

principal_id="$(az ad sp show --id "$client_id" --query id --output tsv 2>/dev/null || true)"
if [[ -z "$principal_id" ]]; then
  principal_id="$(az ad sp create --id "$client_id" --query id --output tsv)"
fi

create_federated_credential() {
  local environment="$1"
  local credential_name="github-$environment"
  local subject="repo:$GITHUB_REPOSITORY:environment:$environment"
  local parameters

  if az ad app federated-credential show \
    --id "$client_id" \
    --federated-credential-id "$credential_name" \
    >/dev/null 2>&1; then
    return
  fi

  parameters="{\"name\":\"$credential_name\",\"issuer\":\"https://token.actions.githubusercontent.com\",\"subject\":\"$subject\",\"description\":\"GitHub Actions $environment\",\"audiences\":[\"api://AzureADTokenExchange\"]}"
  az ad app federated-credential create \
    --id "$client_id" \
    --parameters "$parameters" \
    --output none
}

ensure_role() {
  local role="$1"
  local scope="$2"
  local count

  count="$(az role assignment list \
    --assignee "$principal_id" \
    --role "$role" \
    --scope "$scope" \
    --query 'length(@)' \
    --output tsv)"

  if [[ "$count" == "0" ]]; then
    az role assignment create \
      --assignee-object-id "$principal_id" \
      --assignee-principal-type ServicePrincipal \
      --role "$role" \
      --scope "$scope" \
      --output none
  fi
}

create_federated_credential staging
create_federated_credential production

registry_id="$(az acr show --name "$registry_name" --resource-group "$resource_group" --query id --output tsv)"
webapp_id="$(az webapp show --name "$webapp_name" --resource-group "$resource_group" --query id --output tsv)"
ensure_role AcrPush "$registry_id"
ensure_role "Website Contributor" "$webapp_id"

subscription_id="$(az account show --query id --output tsv)"
tenant_id="$(az account show --query tenantId --output tsv)"

cat <<OUTPUT
Infraestrutura e identidade OIDC criadas.

Cadastre estas GitHub Repository Variables:
AZURE_CLIENT_ID=$client_id
AZURE_TENANT_ID=$tenant_id
AZURE_SUBSCRIPTION_ID=$subscription_id
AZURE_RESOURCE_GROUP=$resource_group
AZURE_CONTAINER_REGISTRY=$registry_name
AZURE_WEBAPP_NAME=$webapp_name
CONTAINER_IMAGE_NAME=$image_name

Agora execute scripts/configure-azure-app.sh com as configurações de runtime.
OUTPUT
