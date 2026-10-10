# CI/CD e ambientes Azure

## Estratégia

A aplicação usa Bun em uma imagem Docker própria. O Azure App Service executa o
container e não precisa oferecer Bun como runtime nativo.

O pipeline segue este fluxo:

1. a CI instala dependências com `bun ci`, valida tipos, lint e testes;
2. depois da CI da `main`, o CD publica uma imagem identificada pelo commit no ACR;
3. a imagem é implantada no slot `staging` e passa por smoke test;
4. o environment `production` exige aprovação manual;
5. a mesma imagem validada é implantada em produção e passa por outro smoke test.

O App Service Plan precisa ser Standard S1 ou superior para oferecer deployment
slots. O workflow usa credenciais administrativas do ACR e publish profiles para
reduzir a configuração necessária nesta entrega acadêmica.

## Permitir que o Web App baixe imagens do ACR

No Portal Azure, abra **TelemetriaFiapRegistry → Settings → Access keys**, ative
**Admin user** e copie o username e um dos passwords. Mantenha essa opção ativa
enquanto este modelo simplificado estiver em uso.

Em produção, abra o Web App `telemetria-fiap-gtdbb5h7eqgvehe4` e acesse
**Deployment Center → Settings/Containers**. Configure:

```text
Registry server: telemetriafiapregistry.azurecr.io
Authentication: Admin credentials / Basic authentication
Username: valor exibido em ACR → Access keys
Password: password1 ou password2 do ACR
Image: telemetria-no-sql
Tag: initial
Port: 8080
```

O portal grava as configurações equivalentes a
`DOCKER_REGISTRY_SERVER_URL`, `DOCKER_REGISTRY_SERVER_USERNAME` e
`DOCKER_REGISTRY_SERVER_PASSWORD`. Não coloque esses valores em arquivos do
projeto. Depois de criar o slot `staging`, abra o recurso do próprio slot e
repita ou confira essa configuração em **Deployment Center →
Settings/Containers**. O login do GitHub Actions serve para publicar a imagem;
essas credenciais do Web App são o que permite a cada slot baixá-la.

## Criar o slot staging

No Web App do Portal Azure, abra **Deployment slots**, selecione **Add slot** e
use o nome `staging`. Clone as configurações de produção.

Depois, abra **Deployment slots → staging → Settings → Environment variables →
App settings**. Configure uma URI com outro banco, mesmo que ele esteja no mesmo
cluster MongoDB:

```text
PORT=8080
WEBSITES_PORT=8080
MONGODB_URI=mongodb+srv://<usuario>:<senha>@<cluster>/telemetria_staging
SECURITY_USER=<usuario-staging>
SECURITY_PASSWORD=<senha-staging>
```

Marque `MONGODB_URI`, `SECURITY_USER` e `SECURITY_PASSWORD` como deployment slot
settings. Em produção, abra o Web App principal em **Settings → Environment
variables → App settings**, use o banco `telemetria_production` e outras
credenciais. Salve e reinicie cada ambiente; os endpoints `/health` de ambos
devem responder HTTP 200 antes de ativar o CD.

## Configurar o GitHub

Crie os environments `staging` e `production` em **Settings → Environments**.
No environment `production`, configure ao menos um required reviewer.

Cadastre estas **Repository variables** em
**Settings → Secrets and variables → Actions → Variables**:

| Variável | Valor desta entrega |
| --- | --- |
| `AZURE_CONTAINER_REGISTRY` | `TelemetriaFiapRegistry` |
| `AZURE_WEBAPP_NAME` | `telemetria-fiap-gtdbb5h7eqgvehe4` |
| `CONTAINER_IMAGE_NAME` | `telemetria-no-sql` |

Cadastre estes **Repository secrets** em
**Settings → Secrets and variables → Actions → Secrets**:

| Secret | Conteúdo |
| --- | --- |
| `ACR_USERNAME` | Username exibido em ACR → Access keys |
| `ACR_PASSWORD` | `password1` ou `password2` do Admin user do ACR |
| `AZURE_WEBAPP_PUBLISH_PROFILE_STAGING` | Conteúdo XML do publish profile do slot staging |
| `AZURE_WEBAPP_PUBLISH_PROFILE_PRODUCTION` | Conteúdo XML do publish profile de produção |

Para obter os publish profiles, mantenha **SCM Basic Auth Publishing Credentials**
habilitado no Web App. Entre primeiro no slot `staging`, selecione **Download
publish profile** e copie todo o conteúdo do arquivo para o secret de staging.
Repita no Web App de produção para o secret de produção.

O CD só é acionado por um `push` bem-sucedido no `main` deste próprio
repositório. Código de pull requests e forks não recebe as credenciais.

## MongoDB e configurações de runtime

O Compose fornece MongoDB somente para desenvolvimento local e CI. No Azure,
use MongoDB Atlas ou outro serviço compatível e acessível pelo App Service.

Valores reais de `MONGODB_URI`, `SECURITY_USER` e `SECURITY_PASSWORD` pertencem
somente às Environment variables do respectivo slot. Não coloque esses valores
no GitHub nem em arquivos versionados.

Os templates sem credenciais reais estão em `config/staging.env.example` e
`config/production.env.example`.

## Gerar o ZIP da entrega

Depois de validar e commitar os arquivos:

```bash
./scripts/package-delivery.sh
```

O script valida os artefatos no commit atual e usa `git archive`, incluindo
somente arquivos versionados e excluindo `.env`, credenciais, dependências e
outros artefatos locais.
