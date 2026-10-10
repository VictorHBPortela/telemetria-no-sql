#!/usr/bin/env bash
set -Eeuo pipefail

required=(
  AZURE_RESOURCE_GROUP
  AZURE_WEBAPP_NAME
  AZURE_CONTAINER_REGISTRY
  STAGING_MONGODB_URI
  STAGING_SECURITY_USER
  STAGING_SECURITY_PASSWORD
  PRODUCTION_MONGODB_URI
  PRODUCTION_SECURITY_USER
  PRODUCTION_SECURITY_PASSWORD
)

for variable in "${required[@]}"; do
  [[ -n "${!variable:-}" ]] || { echo "Variável obrigatória ausente: $variable" >&2; exit 1; }
done

command -v az >/dev/null || { echo "Azure CLI não encontrado" >&2; exit 1; }
az account show >/dev/null || { echo "Execute 'az login' antes deste script" >&2; exit 1; }

resource_group="$AZURE_RESOURCE_GROUP"
webapp_name="$AZURE_WEBAPP_NAME"
registry_name="$AZURE_CONTAINER_REGISTRY"

slot_count="$(az webapp deployment slot list \
  --resource-group "$resource_group" \
  --name "$webapp_name" \
  --query "[?name=='$webapp_name/staging'] | length(@)" \
  --output tsv)"

if [[ "$slot_count" == "0" ]]; then
  az webapp deployment slot create \
    --resource-group "$resource_group" \
    --name "$webapp_name" \
    --slot staging \
    --configuration-source "$webapp_name" \
    >/dev/null
fi

registry_id="$(az acr show --name "$registry_name" --query id --output tsv)"

configure_identity() {
  local slot="${1:-}"
  local -a slot_args=()
  [[ -z "$slot" ]] || slot_args=(--slot "$slot")

  local principal_id
  principal_id="$(az webapp identity assign \
    --resource-group "$resource_group" \
    --name "$webapp_name" \
    "${slot_args[@]}" \
    --query principalId --output tsv)"

  local assignment_count
  assignment_count="$(az role assignment list \
    --assignee "$principal_id" \
    --scope "$registry_id" \
    --role AcrPull \
    --query 'length(@)' --output tsv)"

  if [[ "$assignment_count" == "0" ]]; then
    az role assignment create \
      --assignee-object-id "$principal_id" \
      --assignee-principal-type ServicePrincipal \
      --scope "$registry_id" \
      --role AcrPull \
      >/dev/null
  fi

  local config_id
  config_id="$(az webapp config show \
    --resource-group "$resource_group" \
    --name "$webapp_name" \
    "${slot_args[@]}" \
    --query id --output tsv)"

  az resource update \
    --ids "$config_id" \
    --set properties.acrUseManagedIdentityCreds=true \
    >/dev/null
}

configure_settings() {
  local slot="$1"
  local mongodb_uri="$2"
  local security_user="$3"
  local security_password="$4"
  local -a slot_args=()
  [[ "$slot" == "production" ]] || slot_args=(--slot "$slot")

  az webapp config appsettings set \
    --resource-group "$resource_group" \
    --name "$webapp_name" \
    "${slot_args[@]}" \
    --settings PORT=8080 WEBSITES_PORT=8080 \
    --slot-settings \
      "MONGODB_URI=$mongodb_uri" \
      "SECURITY_USER=$security_user" \
      "SECURITY_PASSWORD=$security_password" \
    >/dev/null
}

configure_identity
configure_identity staging
configure_settings staging "$STAGING_MONGODB_URI" "$STAGING_SECURITY_USER" "$STAGING_SECURITY_PASSWORD"
configure_settings production "$PRODUCTION_MONGODB_URI" "$PRODUCTION_SECURITY_USER" "$PRODUCTION_SECURITY_PASSWORD"

echo "App Service e slot staging configurados para usar ACR por identidade gerenciada."
