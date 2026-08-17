import { Types } from "mongoose";
import type { TarifaInput } from "../contracts/tarifa.contract.ts";
import type { StatusMedidor } from "../contracts/medidor.contract.ts";
import type { TipoAlerta } from "../contracts/alerta.contract.ts";
import {
  TarifaBrancaModel,
  TarifaConvencionalModel,
  TarifaDemandaModel,
  TarifaModel,
} from "../models/tarifa.model.ts";
import { LojaModel } from "../models/loja.model.ts";
import { MedidorModel } from "../models/medidor.model.ts";
import { LeituraModel } from "../models/leitura.model.ts";
import { AlertaModel } from "../models/alerta.model.ts";

const objectId = (prefix: string, index: number): Types.ObjectId =>
  new Types.ObjectId(`${prefix}${index.toString().padStart(2, "0")}`);

const tarifaId = (index: number): Types.ObjectId => objectId("1000000000000000000000", index);
const lojaId = (index: number): Types.ObjectId => objectId("2000000000000000000000", index);
const medidorId = (index: number): Types.ObjectId => objectId("3000000000000000000000", index);
const leituraId = (index: number): Types.ObjectId => objectId("4000000000000000000000", index);
const alertaId = (index: number): Types.ObjectId => objectId("5000000000000000000000", index);

type SeedTarifa = TarifaInput & { _id: Types.ObjectId };

const tarifas: SeedTarifa[] = [
  {
    _id: tarifaId(1), codigo: "TAR-CONV-01", nome: "Convencional Sul", modalidade: "CONVENCIONAL",
    vigenciaInicio: new Date("2026-01-01T00:00:00.000Z"), vigenciaFim: new Date("2026-12-31T23:59:59.000Z"), ativa: true, precoKwh: 0.72,
  },
  {
    _id: tarifaId(2), codigo: "TAR-CONV-02", nome: "Convencional Sudeste", modalidade: "CONVENCIONAL",
    vigenciaInicio: new Date("2026-01-01T00:00:00.000Z"), vigenciaFim: new Date("2026-12-31T23:59:59.000Z"), ativa: true, precoKwh: 0.76,
  },
  {
    _id: tarifaId(3), codigo: "TAR-CONV-03", nome: "Convencional Centro", modalidade: "CONVENCIONAL",
    vigenciaInicio: new Date("2026-01-01T00:00:00.000Z"), vigenciaFim: new Date("2026-12-31T23:59:59.000Z"), ativa: true, precoKwh: 0.74,
  },
  {
    _id: tarifaId(4), codigo: "TAR-BRANCA-01", nome: "Branca Comercial A", modalidade: "BRANCA",
    vigenciaInicio: new Date("2026-01-01T00:00:00.000Z"), vigenciaFim: new Date("2026-12-31T23:59:59.000Z"), ativa: true,
    precosKwh: { foraPonta: 0.55, intermediario: 0.82, ponta: 1.18 },
  },
  {
    _id: tarifaId(5), codigo: "TAR-BRANCA-02", nome: "Branca Comercial B", modalidade: "BRANCA",
    vigenciaInicio: new Date("2026-01-01T00:00:00.000Z"), vigenciaFim: new Date("2026-12-31T23:59:59.000Z"), ativa: true,
    precosKwh: { foraPonta: 0.57, intermediario: 0.85, ponta: 1.22 },
  },
  {
    _id: tarifaId(6), codigo: "TAR-BRANCA-03", nome: "Branca Comercial C", modalidade: "BRANCA",
    vigenciaInicio: new Date("2026-01-01T00:00:00.000Z"), vigenciaFim: new Date("2026-12-31T23:59:59.000Z"), ativa: false,
    precosKwh: { foraPonta: 0.53, intermediario: 0.8, ponta: 1.15 },
  },
  {
    _id: tarifaId(7), codigo: "TAR-DEM-01", nome: "Demanda Shopping", modalidade: "DEMANDA",
    vigenciaInicio: new Date("2026-01-01T00:00:00.000Z"), vigenciaFim: new Date("2026-12-31T23:59:59.000Z"), ativa: true, precoKwh: 0.61, precoDemandaKw: 42.5,
  },
  {
    _id: tarifaId(8), codigo: "TAR-DEM-02", nome: "Demanda Industrial", modalidade: "DEMANDA",
    vigenciaInicio: new Date("2026-01-01T00:00:00.000Z"), vigenciaFim: new Date("2026-12-31T23:59:59.000Z"), ativa: true, precoKwh: 0.59, precoDemandaKw: 45.2,
  },
  {
    _id: tarifaId(9), codigo: "TAR-DEM-03", nome: "Demanda Varejo", modalidade: "DEMANDA",
    vigenciaInicio: new Date("2026-01-01T00:00:00.000Z"), vigenciaFim: new Date("2026-12-31T23:59:59.000Z"), ativa: true, precoKwh: 0.63, precoDemandaKw: 40.8,
  },
  {
    _id: tarifaId(10), codigo: "TAR-DEM-04", nome: "Demanda Corporativa", modalidade: "DEMANDA",
    vigenciaInicio: new Date("2026-01-01T00:00:00.000Z"), vigenciaFim: new Date("2026-12-31T23:59:59.000Z"), ativa: true, precoKwh: 0.6, precoDemandaKw: 44.1,
  },
];

const lojas = Array.from({ length: 10 }, (_, offset) => {
  const index = offset + 1;
  return {
    _id: lojaId(index),
    nomeLoja: `Loja ${index.toString().padStart(2, "0")}`,
    setor: ["Alimentação", "Vestuário", "Serviços", "Eletrônicos"][offset % 4] ?? "Varejo",
    demandaContratadaKW: 100 + index * 15,
    dataCadastro: new Date(`2026-01-${index.toString().padStart(2, "0")}T12:00:00.000Z`),
    tarifaId: tarifaId(index),
  };
});

const medidores = Array.from({ length: 10 }, (_, offset) => {
  const index = offset + 1;
  const status: StatusMedidor = index === 10 ? "DESATIVO" : "ATIVO";
  return {
    _id: medidorId(index),
    lojaId: lojaId(index),
    numeroSerie: `MED-${index.toString().padStart(3, "0")}`,
    status,
  };
});

const leituras = Array.from({ length: 10 }, (_, offset) => {
  const index = offset + 1;
  return {
    _id: leituraId(index),
    medidorId: medidorId(index),
    dataHoraLeitura: new Date(`2026-08-${index.toString().padStart(2, "0")}T10:00:00.000Z`),
    consumoKwh: 120 + index * 8.5,
    tensaoVolts: 218 + (index % 5),
    correnteAmperes: 8 + index * 0.65,
  };
});

const alertTypes: TipoAlerta[] = [
  "DEMANDA_EXCEDIDA",
  "CONSUMO_ANOMALO",
  "TENSAO_FORA_FAIXA",
  "FALHA_COMUNICACAO",
];

const alertas = Array.from({ length: 10 }, (_, offset) => {
  const index = offset + 1;
  return {
    _id: alertaId(index),
    medidorId: medidorId(index),
    tipoAlerta: alertTypes[offset % alertTypes.length] ?? "CONSUMO_ANOMALO",
    mensagem: `Alerta demonstrativo ${index}`,
    dataHoraAlerta: new Date(`2026-08-${index.toString().padStart(2, "0")}T10:05:00.000Z`),
    resolvido: index % 3 === 0,
  };
});

const upsertTarifa = async (seed: SeedTarifa): Promise<void> => {
  const { _id, ...data } = seed;
  const options = { upsert: true, runValidators: true };
  switch (data.modalidade) {
    case "CONVENCIONAL":
      await TarifaConvencionalModel.updateOne({ _id }, { $set: data }, options).exec();
      return;
    case "BRANCA":
      await TarifaBrancaModel.updateOne({ _id }, { $set: data }, options).exec();
      return;
    case "DEMANDA":
      await TarifaDemandaModel.updateOne({ _id }, { $set: data }, options).exec();
  }
};

export interface SeedCounts {
  tarifas: number;
  lojas: number;
  medidores: number;
  leituras: number;
  alertas: number;
}

export const runSeed = async (): Promise<SeedCounts> => {
  await Promise.all(tarifas.map(upsertTarifa));
  await Promise.all(
    lojas.map(({ _id, ...data }) =>
      LojaModel.updateOne({ _id }, { $set: data }, { upsert: true, runValidators: true }).exec(),
    ),
  );
  await Promise.all(
    medidores.map(({ _id, ...data }) =>
      MedidorModel.updateOne({ _id }, { $set: data }, { upsert: true, runValidators: true }).exec(),
    ),
  );
  await Promise.all(
    leituras.map(({ _id, ...data }) =>
      LeituraModel.updateOne({ _id }, { $set: data }, { upsert: true, runValidators: true }).exec(),
    ),
  );
  await Promise.all(
    alertas.map(({ _id, ...data }) =>
      AlertaModel.updateOne({ _id }, { $set: data }, { upsert: true, runValidators: true }).exec(),
    ),
  );

  await Promise.all([
    TarifaModel.syncIndexes(),
    LojaModel.syncIndexes(),
    MedidorModel.syncIndexes(),
    LeituraModel.syncIndexes(),
    AlertaModel.syncIndexes(),
  ]);

  const [tarifasCount, lojasCount, medidoresCount, leiturasCount, alertasCount] =
    await Promise.all([
      TarifaModel.countDocuments(),
      LojaModel.countDocuments(),
      MedidorModel.countDocuments(),
      LeituraModel.countDocuments(),
      AlertaModel.countDocuments(),
    ]);

  return {
    tarifas: tarifasCount,
    lojas: lojasCount,
    medidores: medidoresCount,
    leituras: leiturasCount,
    alertas: alertasCount,
  };
};
