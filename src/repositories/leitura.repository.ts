import type { HydratedDocument, Types } from "mongoose";
import type { LeituraInput } from "../contracts/leitura.contract.ts";
import { LeituraModel } from "../models/leitura.model.ts";
import type { LeituraPersistence } from "../models/leitura.model.ts";
import type { PersistedDocument } from "../shared/persistence.ts";

export type LeituraRecord = LeituraPersistence & PersistedDocument;
export type LeituraWriteData = Omit<LeituraInput, "medidorId"> & {
  medidorId: Types.ObjectId;
};

const toRecord = (document: HydratedDocument<LeituraPersistence>): LeituraRecord => ({
  _id: document._id,
  medidorId: document.medidorId,
  dataHoraLeitura: document.dataHoraLeitura,
  consumoKwh: document.consumoKwh,
  tensaoVolts: document.tensaoVolts,
  correnteAmperes: document.correnteAmperes,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});

export class LeituraRepository {
  public async create(data: LeituraWriteData): Promise<LeituraRecord> {
    return toRecord(await LeituraModel.create(data));
  }

  public async findAll(): Promise<LeituraRecord[]> {
    const documents = await LeituraModel.find().sort({ dataHoraLeitura: -1 }).exec();
    return documents.map(toRecord);
  }

  public async findById(id: Types.ObjectId): Promise<LeituraRecord | null> {
    const document = await LeituraModel.findById(id).exec();
    return document === null ? null : toRecord(document);
  }

  public async findByMedidorId(medidorId: Types.ObjectId): Promise<LeituraRecord[]> {
    const documents = await LeituraModel.find({ medidorId }).sort({ dataHoraLeitura: -1 }).exec();
    return documents.map(toRecord);
  }

  public async update(id: Types.ObjectId, data: LeituraWriteData): Promise<LeituraRecord | null> {
    const document = await LeituraModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).exec();
    return document === null ? null : toRecord(document);
  }

  public async delete(id: Types.ObjectId): Promise<boolean> {
    const result = await LeituraModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  }

  public async countByMedidorId(medidorId: Types.ObjectId): Promise<number> {
    return LeituraModel.countDocuments({ medidorId }).exec();
  }

  public async count(): Promise<number> {
    return LeituraModel.countDocuments().exec();
  }
}
