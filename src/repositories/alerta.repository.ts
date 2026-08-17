import type { HydratedDocument, Types } from "mongoose";
import type { AlertaInput } from "../contracts/alerta.contract.ts";
import { AlertaModel } from "../models/alerta.model.ts";
import type { AlertaPersistence } from "../models/alerta.model.ts";
import type { PersistedDocument } from "../shared/persistence.ts";

export type AlertaRecord = AlertaPersistence & PersistedDocument;
export type AlertaWriteData = Omit<AlertaInput, "medidorId"> & {
  medidorId: Types.ObjectId;
};

const toRecord = (document: HydratedDocument<AlertaPersistence>): AlertaRecord => ({
  _id: document._id,
  medidorId: document.medidorId,
  tipoAlerta: document.tipoAlerta,
  mensagem: document.mensagem,
  dataHoraAlerta: document.dataHoraAlerta,
  resolvido: document.resolvido,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});

export class AlertaRepository {
  public async create(data: AlertaWriteData): Promise<AlertaRecord> {
    return toRecord(await AlertaModel.create(data));
  }

  public async findAll(): Promise<AlertaRecord[]> {
    const documents = await AlertaModel.find().sort({ dataHoraAlerta: -1 }).exec();
    return documents.map(toRecord);
  }

  public async findById(id: Types.ObjectId): Promise<AlertaRecord | null> {
    const document = await AlertaModel.findById(id).exec();
    return document === null ? null : toRecord(document);
  }

  public async findByMedidorId(medidorId: Types.ObjectId): Promise<AlertaRecord[]> {
    const documents = await AlertaModel.find({ medidorId }).sort({ dataHoraAlerta: -1 }).exec();
    return documents.map(toRecord);
  }

  public async findNaoResolvidos(): Promise<AlertaRecord[]> {
    const documents = await AlertaModel.find({ resolvido: false })
      .sort({ dataHoraAlerta: -1 })
      .exec();
    return documents.map(toRecord);
  }

  public async update(id: Types.ObjectId, data: AlertaWriteData): Promise<AlertaRecord | null> {
    const document = await AlertaModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).exec();
    return document === null ? null : toRecord(document);
  }

  public async resolve(id: Types.ObjectId): Promise<AlertaRecord | null> {
    const document = await AlertaModel.findByIdAndUpdate(
      id,
      { resolvido: true },
      { new: true, runValidators: true },
    ).exec();
    return document === null ? null : toRecord(document);
  }

  public async delete(id: Types.ObjectId): Promise<boolean> {
    const result = await AlertaModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  }

  public async countByMedidorId(medidorId: Types.ObjectId): Promise<number> {
    return AlertaModel.countDocuments({ medidorId }).exec();
  }

  public async count(): Promise<number> {
    return AlertaModel.countDocuments().exec();
  }
}
