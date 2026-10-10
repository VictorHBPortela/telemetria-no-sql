# CI/CD e ambientes Azure

## Estratégia

A aplicação usa Bun em uma imagem Docker própria. O Azure App Service executa o
container e, portanto, não precisa oferecer Bun como runtime nativo.

O pipeline segue este fluxo:

1. o workflow `CI` instala dependências com `bun ci`, valida tipos, lint e testes;
2. a imagem de produção é validada ainda na CI;
3. depois da CI da `main`, o workflow `CD` publica a imagem no Azure Container Registry;
4. a mesma imagem é implantada no slot `staging` e passa por smoke test;
5. o environment `production` pode exigir aprovação manual;
6. o slot `staging` é promovido por swap, sem reconstruir a imagem.

O App Service Plan precisa oferecer suporte a deployment slots, como os tiers
Standard ou Premium.

## GitHub Actions

Crie os environments `staging` e `production` em **Settings → Environments**.
No environment `production`, configure ao menos um required reviewer. O CD só é
acionado por um `push` bem-sucedido no `main` deste próprio repositório; código
de pull requests ou forks não recebe acesso ao Azure.

Cadastre estas **Repository variables** em
**Settings → Secrets and variables → Actions → Variables**:

| Variável | Conteúdo |
| --- | --- |
| `AZURE_CLIENT_ID` | Client ID da aplicação/identidade usada pelo GitHub OIDC |
| `AZURE_TENANT_ID` | Tenant ID do Microsoft Entra ID |
| `AZURE_SUBSCRIPTION_ID` | ID da assinatura Azure |
| `AZURE_RESOURCE_GROUP` | Resource group do App Service e ACR |
| `AZURE_CONTAINER_REGISTRY` | Nome do ACR, sem `.azurecr.io` |
| `AZURE_WEBAPP_NAME` | Nome do Azure Web App |
| `CONTAINER_IMAGE_NAME` | `telemetria-no-sql` |

Os IDs e nomes não são credenciais; por isso ficam em variables. O workflow usa
OIDC e não exige client secret persistente no GitHub.

Crie duas credenciais federadas na identidade do Azure:

- `repo:<owner>/<repo>:environment:staging`
- `repo:<owner>/<repo>:environment:production`

A identidade do GitHub precisa conseguir publicar no ACR (`AcrPush`) e gerenciar
o Web App/slots (`Website Contributor`, com escopo mínimo nos recursos usados).

## Provisionamento inicial do Azure

O script idempotente cria Resource Group, ACR, App Service Plan Linux S1, Web
App de container, aplicação Microsoft Entra, credenciais federadas dos dois
environments e as permissões mínimas do pipeline:

```bash
export AZURE_RESOURCE_GROUP="<resource-group>"
export AZURE_APP_SERVICE_PLAN="<app-service-plan>"
export AZURE_WEBAPP_NAME="<nome-globalmente-unico>"
export AZURE_CONTAINER_REGISTRY="<nome-globalmente-unico-sem-hifens>"
export GITHUB_REPOSITORY="<owner>/<repositorio>"

# Opcionais: brazilsouth, S1 e telemetria-no-sql são os padrões.
export AZURE_LOCATION="brazilsouth"
export AZURE_APP_SERVICE_SKU="S1"
export CONTAINER_IMAGE_NAME="telemetria-no-sql"

./scripts/provision-azure.sh
```

É necessário estar autenticado com `az login` e ter permissão para criar
recursos, aplicações no Microsoft Entra e atribuições RBAC. Ao terminar, o
script imprime os valores que devem ser cadastrados como Repository variables.
Os environments `staging` e `production` ainda precisam ser criados no GitHub.

## Configuração do Azure App Service

Depois do provisionamento, o script abaixo cria o slot `staging` e configura
App Settings, identidades gerenciadas e a permissão `AcrPull`:

```bash
export AZURE_RESOURCE_GROUP="<resource-group>"
export AZURE_WEBAPP_NAME="<web-app>"
export AZURE_CONTAINER_REGISTRY="<nome-do-acr>"

export STAGING_MONGODB_URI="<uri-do-banco-staging>"
export STAGING_SECURITY_USER="<usuario-staging>"
export STAGING_SECURITY_PASSWORD="<senha-staging>"

export PRODUCTION_MONGODB_URI="<uri-do-banco-producao>"
export PRODUCTION_SECURITY_USER="<usuario-producao>"
export PRODUCTION_SECURITY_PASSWORD="<senha-producao>"

./scripts/configure-azure-app.sh
```

Staging e produção devem usar bancos e credenciais diferentes. Os nomes
`MONGODB_URI`, `SECURITY_USER` e `SECURITY_PASSWORD` são configurados como slot
settings para não trocarem de ambiente durante o swap. `PORT` e `WEBSITES_PORT`
devem valer `8080`.

Os templates estão em `config/staging.env.example` e
`config/production.env.example`. Não versione arquivos preenchidos com valores
reais.

## MongoDB

O Compose fornece MongoDB somente para desenvolvimento local e CI. No Azure,
use um serviço externo acessível pelo App Service, como MongoDB Atlas ou outro
serviço compatível com o protocolo MongoDB.

## Gerar o ZIP da entrega

Depois de validar e commitar os arquivos:

```bash
./scripts/package-delivery.sh
```

O script valida a presença dos artefatos obrigatórios e usa `git archive`, o que
inclui somente arquivos versionados e evita enviar `.env`, credenciais,
`node_modules`, logs ou outros artefatos locais.
