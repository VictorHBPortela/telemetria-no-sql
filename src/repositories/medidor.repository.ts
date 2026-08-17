import type { HydratedDocument, Types } from "mongoose";
import type { MedidorInput } from "../contracts/medidor.contract.ts";
import { MedidorModel } from "../models/medidor.model.ts";
import type { MedidorPersistence } from "../models/medidor.model.ts";
import type { PersistedDocument } from "../shared/persistence.ts";

export type MedidorRecord = MedidorPersistence & PersistedDocument;
export type MedidorWriteData = Omit<MedidorInput, "lojaId"> & { lojaId: Types.ObjectId };

const toRecord = (document: HydratedDocument<MedidorPersistence>): MedidorRecord => ({
  _id: document._id,
  lojaId: document.lojaId,
  numeroSerie: document.numeroSerie,
  status: document.status,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});

export class MedidorRepository {
  public async create(data: MedidorWriteData): Promise<MedidorRecord> {
    return toRecord(await MedidorModel.create(data));
  }

  public async findAll(): Promise<MedidorRecord[]> {
    const documents = await MedidorModel.find().sort({ numeroSerie: 1 }).exec();
    return documents.map(toRecord);
  }

  public async findById(id: Types.ObjectId): Promise<MedidorRecord | null> {
    const document = await MedidorModel.findById(id).exec();
    return document === null ? null : toRecord(document);
  }

  public async findByNumeroSerie(numeroSerie: string): Promise<MedidorRecord | null> {
    const document = await MedidorModel.findOne({ numeroSerie }).exec();
    return document === null ? null : toRecord(document);
  }

  public async findByLojaId(lojaId: Types.ObjectId): Promise<MedidorRecord[]> {
    const documents = await MedidorModel.find({ lojaId }).sort({ numeroSerie: 1 }).exec();
    return documents.map(toRecord);
  }

  public async update(id: Types.ObjectId, data: MedidorWriteData): Promise<MedidorRecord | null> {
    const document = await MedidorModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).exec();
    return document === null ? null : toRecord(document);
  }

  public async delete(id: Types.ObjectId): Promise<boolean> {
    const result = await MedidorModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  }

  public async countByLojaId(lojaId: Types.ObjectId): Promise<number> {
    return MedidorModel.countDocuments({ lojaId }).exec();
  }

  public async count(): Promise<number> {
    return MedidorModel.countDocuments().exec();
  }
}
