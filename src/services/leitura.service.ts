import type { Types } from "mongoose";
import type { LeituraInput } from "../contracts/leitura.contract.ts";
import type { LeituraResponse } from "../domain/api-types.ts";
import type { LeituraRepository } from "../repositories/leitura.repository.ts";
import type { LeituraRecord } from "../repositories/leitura.repository.ts";
import type { MedidorRepository } from "../repositories/medidor.repository.ts";
import { AppError } from "../shared/app-error.ts";
import { parseObjectId } from "../shared/object-id.ts";

const toResponse = (record: LeituraRecord): LeituraResponse => ({
  leituraId: record._id.toString(),
  medidorId: record.medidorId.toString(),
  dataHoraLeitura: record.dataHoraLeitura.toISOString(),
  consumoKwh: record.consumoKwh,
  tensaoVolts: record.tensaoVolts,
  correnteAmperes: record.correnteAmperes,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

export class LeituraService {
  public constructor(
    private readonly leituraRepository: LeituraRepository,
    private readonly medidorRepository: MedidorRepository,
  ) {}

  public async create(input: LeituraInput): Promise<LeituraResponse> {
    const medidorId = await this.requireMedidor(input.medidorId);
    return toResponse(await this.leituraRepository.create({ ...input, medidorId }));
  }

  public async findAll(): Promise<LeituraResponse[]> {
    return (await this.leituraRepository.findAll()).map(toResponse);
  }

  public async findById(idValue: string): Promise<LeituraResponse> {
    return toResponse(await this.findRecord(idValue));
  }

  public async findByMedidorId(medidorIdValue: string): Promise<LeituraResponse[]> {
    const medidorId = await this.requireMedidor(medidorIdValue);
    return (await this.leituraRepository.findByMedidorId(medidorId)).map(toResponse);
  }

  public async update(idValue: string, input: LeituraInput): Promise<LeituraResponse> {
    const id = parseObjectId(idValue, "leituraId");
    if ((await this.leituraRepository.findById(id)) === null) {
      throw new AppError(404, `Leitura com ID ${idValue} não encontrada`);
    }
    const medidorId = await this.requireMedidor(input.medidorId);
    const updated = await this.leituraRepository.update(id, { ...input, medidorId });
    if (updated === null) {
      throw new AppError(404, `Leitura com ID ${idValue} não encontrada`);
    }
    return toResponse(updated);
  }

  public async delete(idValue: string): Promise<void> {
    const id = parseObjectId(idValue, "leituraId");
    if (!(await this.leituraRepository.delete(id))) {
      throw new AppError(404, `Leitura com ID ${idValue} não encontrada`);
    }
  }

  private async requireMedidor(medidorIdValue: string): Promise<Types.ObjectId> {
    const medidorId = parseObjectId(medidorIdValue, "medidorId");
    if ((await this.medidorRepository.findById(medidorId)) === null) {
      throw new AppError(404, `Medidor com ID ${medidorIdValue} não encontrado`);
    }
    return medidorId;
  }

  private async findRecord(idValue: string): Promise<LeituraRecord> {
    const id = parseObjectId(idValue, "leituraId");
    const record = await this.leituraRepository.findById(id);
    if (record === null) {
      throw new AppError(404, `Leitura com ID ${idValue} não encontrada`);
    }
    return record;
  }
}
