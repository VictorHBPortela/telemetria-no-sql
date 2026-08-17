import type { HydratedDocument, Model, Types } from "mongoose";
import type { TarifaInput, ModalidadeTarifa } from "../contracts/tarifa.contract.ts";
import type { PersistedDocument } from "../shared/persistence.ts";
import {
  TarifaBrancaModel,
  TarifaConvencionalModel,
  TarifaDemandaModel,
  TarifaModel,
} from "../models/tarifa.model.ts";
import type { TarifaPersistence } from "../models/tarifa.model.ts";

export type TarifaRecord = TarifaPersistence & PersistedDocument;

const toRecord = (document: HydratedDocument<TarifaPersistence>): TarifaRecord => ({
  _id: document._id,
  codigo: document.codigo,
  nome: document.nome,
  modalidade: document.modalidade,
  vigenciaInicio: document.vigenciaInicio,
  vigenciaFim: document.vigenciaFim,
  ativa: document.ativa,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
  ...(document.precoKwh === undefined ? {} : { precoKwh: document.precoKwh }),
  ...(document.precoDemandaKw === undefined
    ? {}
    : { precoDemandaKw: document.precoDemandaKw }),
  ...(document.precosKwh === undefined
    ? {}
    : {
        precosKwh: {
          foraPonta: document.precosKwh.foraPonta,
          intermediario: document.precosKwh.intermediario,
          ponta: document.precosKwh.ponta,
        },
      }),
});

const modelByModalidade = (modalidade: ModalidadeTarifa): Model<TarifaPersistence> => {
  switch (modalidade) {
    case "CONVENCIONAL":
      return TarifaConvencionalModel;
    case "BRANCA":
      return TarifaBrancaModel;
    case "DEMANDA":
      return TarifaDemandaModel;
  }
};

export class TarifaRepository {
  public async create(input: TarifaInput): Promise<TarifaRecord> {
    const document = await modelByModalidade(input.modalidade).create(input);
    return toRecord(document);
  }

  public async findAll(): Promise<TarifaRecord[]> {
    const documents = await TarifaModel.find().sort({ codigo: 1 }).exec();
    return documents.map(toRecord);
  }

  public async findById(id: Types.ObjectId): Promise<TarifaRecord | null> {
    const document = await TarifaModel.findById(id).exec();
    return document === null ? null : toRecord(document);
  }

  public async findByCodigo(codigo: string): Promise<TarifaRecord | null> {
    const document = await TarifaModel.findOne({ codigo }).exec();
    return document === null ? null : toRecord(document);
  }

  public async update(id: Types.ObjectId, input: TarifaInput): Promise<TarifaRecord | null> {
    const document = await modelByModalidade(input.modalidade)
      .findByIdAndUpdate(id, input, { new: true, runValidators: true })
      .exec();
    return document === null ? null : toRecord(document);
  }

  public async delete(id: Types.ObjectId): Promise<boolean> {
    const result = await TarifaModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  }

  public async count(): Promise<number> {
    return TarifaModel.countDocuments().exec();
  }
}
