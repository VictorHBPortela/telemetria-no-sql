import type { HydratedDocument, Types } from "mongoose";
import type { LojaInput } from "../contracts/loja.contract.ts";
import { LojaModel } from "../models/loja.model.ts";
import type { LojaPersistence } from "../models/loja.model.ts";
import type { PersistedDocument } from "../shared/persistence.ts";

export type LojaRecord = LojaPersistence & PersistedDocument;

export type LojaWriteData = Omit<LojaInput, "tarifaId"> & {
  tarifaId: Types.ObjectId;
};

const toRecord = (document: HydratedDocument<LojaPersistence>): LojaRecord => ({
  _id: document._id,
  nomeLoja: document.nomeLoja,
  setor: document.setor,
  demandaContratadaKW: document.demandaContratadaKW,
  dataCadastro: document.dataCadastro,
  tarifaId: document.tarifaId,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});

export class LojaRepository {
  public async create(data: LojaWriteData): Promise<LojaRecord> {
    const document = await LojaModel.create({ ...data, dataCadastro: new Date() });
    return toRecord(document);
  }

  public async findAll(): Promise<LojaRecord[]> {
    const documents = await LojaModel.find().sort({ nomeLoja: 1 }).exec();
    return documents.map(toRecord);
  }

  public async findById(id: Types.ObjectId): Promise<LojaRecord | null> {
    const document = await LojaModel.findById(id).exec();
    return document === null ? null : toRecord(document);
  }

  public async update(id: Types.ObjectId, data: LojaWriteData): Promise<LojaRecord | null> {
    const document = await LojaModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).exec();
    return document === null ? null : toRecord(document);
  }

  public async delete(id: Types.ObjectId): Promise<boolean> {
    const result = await LojaModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  }

  public async countByTarifaId(tarifaId: Types.ObjectId): Promise<number> {
    return LojaModel.countDocuments({ tarifaId }).exec();
  }

  public async count(): Promise<number> {
    return LojaModel.countDocuments().exec();
  }
}
