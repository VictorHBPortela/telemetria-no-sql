# Telemetria NoSQL

API REST para telemetria energética desenvolvida com Bun, TypeScript, KoaJS,
MongoDB e Mongoose. É a versão NoSQL do projeto `telemetria`, que permanece
inalterado na pasta vizinha.

## Arquitetura

Cada recurso segue o fluxo abaixo:

```text
HTTP → controller → service → repository → model Mongoose → MongoDB
```

- `controllers`: contrato HTTP e validação dos corpos com Zod.
- `services`: regras de negócio, referências e integridade entre collections.
- `repositories`: consultas e persistência com Mongoose.
- `models`: schemas, índices e discriminadores MongoDB.
- `contracts`: entradas e uniões TypeScript derivadas dos validadores.

As cinco collections são `tarifas`, `lojas`, `medidores`, `leituras` e
`alertas`. A collection `tarifas` demonstra o modelo flexível do MongoDB com
documentos `CONVENCIONAL`, `BRANCA` e `DEMANDA`, cada qual com uma estrutura de
preços diferente e validada.

## Executar com Docker

Pré-requisito: Docker Desktop em execução.

```bash
docker compose up --build -d
docker compose exec app bun run seed
```

A API ficará em `http://localhost:8080`. Verifique-a com:

```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/tarifas
```

O seed é idempotente: pode ser executado novamente sem duplicar os documentos.
Ele cria ou atualiza dez documentos determinísticos em cada collection e mostra
as contagens ao terminar.

Para encerrar os containers sem apagar os dados:

```bash
docker compose down
```

Para remover também o volume do MongoDB, use `docker compose down -v`. Esse
comando apaga permanentemente os dados locais.

## Executar com Bun instalado

Copie `.env.example` para `.env`, ajuste `MONGODB_URI` e execute:

```bash
bun install
bun run seed
bun run dev
```

Também é possível informar uma URI do MongoDB Atlas em `MONGODB_URI`.
O Compose publica seu MongoDB local na porta `27018` por padrão para evitar
conflitos; esse valor pode ser alterado com `MONGO_PORT`.

## Autenticação

GET, HEAD e OPTIONS são públicos. POST, PUT, PATCH e DELETE usam HTTP Basic com
`SECURITY_USER` e `SECURITY_PASSWORD`. Os valores de desenvolvimento do Compose
são `admin` e `admin123`; substitua-os fora do ambiente local.

Exemplo de escrita autenticada:

```bash
curl -u admin:admin123 \
  -H "Content-Type: application/json" \
  -d '{"codigo":"TAR-NOVA","nome":"Tarifa nova","modalidade":"CONVENCIONAL","vigenciaInicio":"2026-01-01T00:00:00.000Z","vigenciaFim":"2026-12-31T23:59:59.000Z","ativa":true,"precoKwh":0.75}' \
  http://localhost:8080/api/tarifas
```

## Rotas

Cada base abaixo possui POST, GET, GET `/:id`, PUT `/:id` e DELETE `/:id`:

| Collection | Base |
| --- | --- |
| Tarifas | `/api/tarifas` |
| Lojas | `/api/lojas` |
| Medidores | `/api/medidores` |
| Leituras | `/api/leituras` |
| Alertas | `/api/alertas` |

Rotas adicionais preservadas da aplicação original:

- `GET /api/medidores/loja/:lojaId`
- `GET /api/leituras/medidor/:medidorId`
- `GET /api/alertas/medidor/:medidorId`
- `GET /api/alertas/nao-resolvidos`
- `PATCH /api/alertas/:id/resolver`

Relacionamentos são enviados como strings ObjectId nos campos `tarifaId`,
`lojaId` e `medidorId`. Datas usam ISO 8601. A modalidade de uma tarifa não
pode ser alterada depois da criação; seus demais dados podem ser atualizados.

O arquivo `telemetria-no-sql.postman_collection.json` contém exemplos completos
dos cinco CRUDs e das rotas adicionais.

## Integridade e respostas

- Uma tarifa vinculada a lojas não pode ser excluída.
- Uma loja com medidores não pode ser excluída.
- Um medidor com leituras ou alertas não pode ser excluído.
- Violações de dependência e unicidade retornam `409`.
- Entradas inválidas retornam `400`, referências ausentes retornam `404` e
  credenciais inválidas retornam `401`.

## Qualidade e testes

Com os serviços do Compose disponíveis, execute:

```bash
docker compose run --rm \
  -e MONGODB_URI_TEST=mongodb://mongo:27017/telemetria_test \
  app bun run check
```

Os testes usam exclusivamente o banco `telemetria_test`, recriam seus dados e
validam seed idempotente, autenticação, flexibilidade das tarifas, filtros,
CRUDs completos e bloqueios de integridade.

Com Bun instalado localmente e MongoDB em `localhost:27017`:

```bash
MONGODB_URI_TEST=mongodb://localhost:27017/telemetria_test bun run check
```
