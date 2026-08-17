import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import mongoose from "mongoose";
import { createApp } from "../src/app.ts";
import { connectDatabase, disconnectDatabase } from "../src/config/database.ts";
import type { AppConfig } from "../src/config/env.ts";
import type {
  AlertaResponse,
  LeituraResponse,
  LojaResponse,
  MedidorResponse,
  TarifaResponse,
} from "../src/domain/api-types.ts";
import { runSeed } from "../src/database/seed-data.ts";

interface ApiResult<T> {
  status: number;
  body?: T;
}

const testConfig: AppConfig = {
  port: 0,
  mongodbUri: Bun.env.MONGODB_URI_TEST ?? "mongodb://localhost:27017/telemetria_test",
  securityUser: "integration-user",
  securityPassword: "integration-password",
};

const authHeader = `Basic ${Buffer.from(
  `${testConfig.securityUser}:${testConfig.securityPassword}`,
).toString("base64")}`;

let server: Server;
let baseUrl: string;

const request = async <T>(
  path: string,
  method = "GET",
  body?: object,
  authenticated = false,
): Promise<ApiResult<T>> => {
  const headers = new Headers();
  if (body !== undefined) headers.set("content-type", "application/json");
  if (authenticated) headers.set("authorization", authHeader);
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  return text.length === 0
    ? { status: response.status }
    : { status: response.status, body: JSON.parse(text) as T };
};

const requireBody = <T>(result: ApiResult<T>): T => {
  if (result.body === undefined) throw new Error("A resposta deveria possuir corpo");
  return result.body;
};

beforeAll(async () => {
  await connectDatabase(testConfig.mongodbUri);
  await mongoose.connection.dropDatabase();
  server = createApp(testConfig).listen(0);
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Não foi possível determinar a porta da API de teste");
  }
  baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
  await mongoose.connection.dropDatabase();
  await disconnectDatabase();
});

describe("API de telemetria NoSQL", () => {
  test("atende seed, autenticação, modelo flexível e CRUD das cinco collections", async () => {
    const firstSeed = await runSeed();
    const secondSeed = await runSeed();
    expect(firstSeed).toEqual({ tarifas: 10, lojas: 10, medidores: 10, leituras: 10, alertas: 10 });
    expect(secondSeed).toEqual(firstSeed);

    const health = await request<{ status: string }>("/health");
    expect(health.status).toBe(200);
    expect(requireBody(health).status).toBe("UP");

    const publicTarifas = await request<TarifaResponse[]>("/api/tarifas");
    expect(publicTarifas.status).toBe(200);
    expect(requireBody(publicTarifas)).toHaveLength(10);
    expect(new Set(requireBody(publicTarifas).map((tarifa) => tarifa.modalidade))).toEqual(
      new Set(["CONVENCIONAL", "BRANCA", "DEMANDA"]),
    );

    const conventionalPayload = {
      codigo: "TAR-TESTE-CONV",
      nome: "Tarifa de integração",
      modalidade: "CONVENCIONAL",
      vigenciaInicio: "2026-01-01T00:00:00.000Z",
      vigenciaFim: "2026-12-31T23:59:59.000Z",
      ativa: true,
      precoKwh: 0.81,
    };

    const unauthorized = await request("/api/tarifas", "POST", conventionalPayload);
    expect(unauthorized.status).toBe(401);

    const createdTarifaResult = await request<TarifaResponse>(
      "/api/tarifas", "POST", conventionalPayload, true,
    );
    expect(createdTarifaResult.status).toBe(201);
    const createdTarifa = requireBody(createdTarifaResult);

    const foundTarifa = await request<TarifaResponse>(`/api/tarifas/${createdTarifa.tarifaId}`);
    expect(foundTarifa.status).toBe(200);

    const updatedTarifa = await request<TarifaResponse>(
      `/api/tarifas/${createdTarifa.tarifaId}`,
      "PUT",
      { ...conventionalPayload, nome: "Tarifa de integração atualizada", precoKwh: 0.83 },
      true,
    );
    expect(updatedTarifa.status).toBe(200);
    expect(requireBody(updatedTarifa).nome).toContain("atualizada");

    const wrongFlexibleShape = await request(
      "/api/tarifas",
      "POST",
      { ...conventionalPayload, codigo: "TAR-INVALIDA", modalidade: "BRANCA" },
      true,
    );
    expect(wrongFlexibleShape.status).toBe(400);

    const whiteTarifa = await request<TarifaResponse>(
      "/api/tarifas",
      "POST",
      {
        ...conventionalPayload,
        codigo: "TAR-TESTE-BRANCA",
        modalidade: "BRANCA",
        precosKwh: { foraPonta: 0.5, intermediario: 0.8, ponta: 1.2 },
        precoKwh: undefined,
      },
      true,
    );
    expect(whiteTarifa.status).toBe(201);

    const demandTarifa = await request<TarifaResponse>(
      "/api/tarifas",
      "POST",
      {
        ...conventionalPayload,
        codigo: "TAR-TESTE-DEMANDA",
        modalidade: "DEMANDA",
        precoKwh: 0.6,
        precoDemandaKw: 44,
      },
      true,
    );
    expect(demandTarifa.status).toBe(201);

    const lojaPayload = {
      nomeLoja: "Loja Integração",
      setor: "Testes",
      demandaContratadaKW: 180,
      tarifaId: createdTarifa.tarifaId,
    };
    const createdLojaResult = await request<LojaResponse>("/api/lojas", "POST", lojaPayload, true);
    expect(createdLojaResult.status).toBe(201);
    const createdLoja = requireBody(createdLojaResult);
    expect((await request(`/api/lojas/${createdLoja.lojaId}`)).status).toBe(200);
    const updatedLoja = await request<LojaResponse>(
      `/api/lojas/${createdLoja.lojaId}`,
      "PUT",
      { ...lojaPayload, setor: "Qualidade" },
      true,
    );
    expect(requireBody(updatedLoja).setor).toBe("Qualidade");

    const missingReference = await request(
      "/api/lojas",
      "POST",
      { ...lojaPayload, nomeLoja: "Sem tarifa", tarifaId: "aaaaaaaaaaaaaaaaaaaaaaaa" },
      true,
    );
    expect(missingReference.status).toBe(404);

    const medidorPayload = {
      lojaId: createdLoja.lojaId,
      numeroSerie: "MED-INTEGRACAO-001",
      status: "ATIVO",
    };
    const createdMedidorResult = await request<MedidorResponse>(
      "/api/medidores", "POST", medidorPayload, true,
    );
    expect(createdMedidorResult.status).toBe(201);
    const createdMedidor = requireBody(createdMedidorResult);
    expect((await request(`/api/medidores/${createdMedidor.medidorId}`)).status).toBe(200);
    const medidoresByLoja = await request<MedidorResponse[]>(
      `/api/medidores/loja/${createdLoja.lojaId}`,
    );
    expect(requireBody(medidoresByLoja)).toHaveLength(1);
    const updatedMedidor = await request<MedidorResponse>(
      `/api/medidores/${createdMedidor.medidorId}`,
      "PUT",
      { ...medidorPayload, status: "DESATIVO" },
      true,
    );
    expect(requireBody(updatedMedidor).status).toBe("DESATIVO");
    const duplicateMedidor = await request(
      "/api/medidores", "POST", medidorPayload, true,
    );
    expect(duplicateMedidor.status).toBe(409);

    const leituraPayload = {
      medidorId: createdMedidor.medidorId,
      dataHoraLeitura: "2026-09-01T10:00:00.000Z",
      consumoKwh: 210.5,
      tensaoVolts: 220,
      correnteAmperes: 12.4,
    };
    const createdLeituraResult = await request<LeituraResponse>(
      "/api/leituras", "POST", leituraPayload, true,
    );
    expect(createdLeituraResult.status).toBe(201);
    const createdLeitura = requireBody(createdLeituraResult);
    expect((await request(`/api/leituras/${createdLeitura.leituraId}`)).status).toBe(200);
    expect(
      requireBody(
        await request<LeituraResponse[]>(`/api/leituras/medidor/${createdMedidor.medidorId}`),
      ),
    ).toHaveLength(1);
    const updatedLeitura = await request<LeituraResponse>(
      `/api/leituras/${createdLeitura.leituraId}`,
      "PUT",
      { ...leituraPayload, consumoKwh: 215.75 },
      true,
    );
    expect(requireBody(updatedLeitura).consumoKwh).toBe(215.75);
    const negativeLeitura = await request(
      "/api/leituras", "POST", { ...leituraPayload, consumoKwh: -1 }, true,
    );
    expect(negativeLeitura.status).toBe(400);

    const alertaPayload = {
      medidorId: createdMedidor.medidorId,
      tipoAlerta: "DEMANDA_EXCEDIDA",
      mensagem: "Demanda acima do limite",
      dataHoraAlerta: "2026-09-01T10:05:00.000Z",
      resolvido: false,
    };
    const createdAlertaResult = await request<AlertaResponse>(
      "/api/alertas", "POST", alertaPayload, true,
    );
    expect(createdAlertaResult.status).toBe(201);
    const createdAlerta = requireBody(createdAlertaResult);
    expect((await request(`/api/alertas/${createdAlerta.alertaId}`)).status).toBe(200);
    expect(
      requireBody(
        await request<AlertaResponse[]>(`/api/alertas/medidor/${createdMedidor.medidorId}`),
      ),
    ).toHaveLength(1);
    const updatedAlerta = await request<AlertaResponse>(
      `/api/alertas/${createdAlerta.alertaId}`,
      "PUT",
      { ...alertaPayload, mensagem: "Demanda revisada" },
      true,
    );
    expect(requireBody(updatedAlerta).mensagem).toBe("Demanda revisada");
    const resolvedAlerta = await request<AlertaResponse>(
      `/api/alertas/${createdAlerta.alertaId}/resolver`, "PATCH", undefined, true,
    );
    expect(requireBody(resolvedAlerta).resolvido).toBe(true);
    expect((await request<AlertaResponse[]>("/api/alertas/nao-resolvidos")).status).toBe(200);

    expect(
      (await request(`/api/tarifas/${createdTarifa.tarifaId}`, "DELETE", undefined, true)).status,
    ).toBe(409);
    expect(
      (await request(`/api/lojas/${createdLoja.lojaId}`, "DELETE", undefined, true)).status,
    ).toBe(409);
    expect(
      (await request(`/api/medidores/${createdMedidor.medidorId}`, "DELETE", undefined, true)).status,
    ).toBe(409);
    expect((await request("/api/lojas/id-invalido")).status).toBe(400);

    expect(
      (await request(`/api/alertas/${createdAlerta.alertaId}`, "DELETE", undefined, true)).status,
    ).toBe(204);
    expect(
      (await request(`/api/leituras/${createdLeitura.leituraId}`, "DELETE", undefined, true)).status,
    ).toBe(204);
    expect(
      (await request(`/api/medidores/${createdMedidor.medidorId}`, "DELETE", undefined, true)).status,
    ).toBe(204);
    expect(
      (await request(`/api/lojas/${createdLoja.lojaId}`, "DELETE", undefined, true)).status,
    ).toBe(204);
    expect(
      (await request(`/api/tarifas/${createdTarifa.tarifaId}`, "DELETE", undefined, true)).status,
    ).toBe(204);
    expect(
      (await request(`/api/tarifas/${requireBody(whiteTarifa).tarifaId}`, "DELETE", undefined, true)).status,
    ).toBe(204);
    expect(
      (await request(`/api/tarifas/${requireBody(demandTarifa).tarifaId}`, "DELETE", undefined, true)).status,
    ).toBe(204);
  });
});
