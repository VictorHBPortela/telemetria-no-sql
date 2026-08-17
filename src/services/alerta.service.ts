import type { Types } from "mongoose";
import type { AlertaInput } from "../contracts/alerta.contract.ts";
import type { AlertaResponse } from "../domain/api-types.ts";
import type { AlertaRepository } from "../repositories/alerta.repository.ts";
import type { AlertaRecord } from "../repositories/alerta.repository.ts";
import type { MedidorRepository } from "../repositories/medidor.repository.ts";
import { AppError } from "../shared/app-error.ts";
import { parseObjectId } from "../shared/object-id.ts";

const toResponse = (record: AlertaRecord): AlertaResponse => ({
  alertaId: record._id.toString(),
  medidorId: record.medidorId.toString(),
  tipoAlerta: record.tipoAlerta,
  mensagem: record.mensagem,
  dataHoraAlerta: record.dataHoraAlerta.toISOString(),
  resolvido: record.resolvido,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

export class AlertaService {
  public constructor(
    private readonly alertaRepository: AlertaRepository,
    private readonly medidorRepository: MedidorRepository,
  ) {}

  public async create(input: AlertaInput): Promise<AlertaResponse> {
    const medidorId = await this.requireMedidor(input.medidorId);
    return toResponse(await this.alertaRepository.create({ ...input, medidorId }));
  }

  public async findAll(): Promise<AlertaResponse[]> {
    return (await this.alertaRepository.findAll()).map(toResponse);
  }

  public async findById(idValue: string): Promise<AlertaResponse> {
    return toResponse(await this.findRecord(idValue));
  }

  public async findByMedidorId(medidorIdValue: string): Promise<AlertaResponse[]> {
    const medidorId = await this.requireMedidor(medidorIdValue);
    return (await this.alertaRepository.findByMedidorId(medidorId)).map(toResponse);
  }

  public async findNaoResolvidos(): Promise<AlertaResponse[]> {
    return (await this.alertaRepository.findNaoResolvidos()).map(toResponse);
  }

  public async update(idValue: string, input: AlertaInput): Promise<AlertaResponse> {
    const id = parseObjectId(idValue, "alertaId");
    if ((await this.alertaRepository.findById(id)) === null) {
      throw new AppError(404, `Alerta com ID ${idValue} não encontrado`);
    }
    const medidorId = await this.requireMedidor(input.medidorId);
    const updated = await this.alertaRepository.update(id, { ...input, medidorId });
    if (updated === null) {
      throw new AppError(404, `Alerta com ID ${idValue} não encontrado`);
    }
    return toResponse(updated);
  }

  public async resolve(idValue: string): Promise<AlertaResponse> {
    const id = parseObjectId(idValue, "alertaId");
    const updated = await this.alertaRepository.resolve(id);
    if (updated === null) {
      throw new AppError(404, `Alerta com ID ${idValue} não encontrado`);
    }
    return toResponse(updated);
  }

  public async delete(idValue: string): Promise<void> {
    const id = parseObjectId(idValue, "alertaId");
    if (!(await this.alertaRepository.delete(id))) {
      throw new AppError(404, `Alerta com ID ${idValue} não encontrado`);
    }
  }

  private async requireMedidor(medidorIdValue: string): Promise<Types.ObjectId> {
    const medidorId = parseObjectId(medidorIdValue, "medidorId");
    if ((await this.medidorRepository.findById(medidorId)) === null) {
      throw new AppError(404, `Medidor com ID ${medidorIdValue} não encontrado`);
    }
    return medidorId;
  }

  private async findRecord(idValue: string): Promise<AlertaRecord> {
    const id = parseObjectId(idValue, "alertaId");
    const record = await this.alertaRepository.findById(id);
    if (record === null) {
      throw new AppError(404, `Alerta com ID ${idValue} não encontrado`);
    }
    return record;
  }
}
