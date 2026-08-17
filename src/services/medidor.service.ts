import type { MedidorInput } from "../contracts/medidor.contract.ts";
import type { MedidorResponse } from "../domain/api-types.ts";
import type { MedidorRepository } from "../repositories/medidor.repository.ts";
import type { MedidorRecord } from "../repositories/medidor.repository.ts";
import type { LojaRepository } from "../repositories/loja.repository.ts";
import type { LeituraRepository } from "../repositories/leitura.repository.ts";
import type { AlertaRepository } from "../repositories/alerta.repository.ts";
import { AppError } from "../shared/app-error.ts";
import { parseObjectId } from "../shared/object-id.ts";

const toResponse = (record: MedidorRecord): MedidorResponse => ({
  medidorId: record._id.toString(),
  lojaId: record.lojaId.toString(),
  numeroSerie: record.numeroSerie,
  status: record.status,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

export class MedidorService {
  public constructor(
    private readonly medidorRepository: MedidorRepository,
    private readonly lojaRepository: LojaRepository,
    private readonly leituraRepository: LeituraRepository,
    private readonly alertaRepository: AlertaRepository,
  ) {}

  public async create(input: MedidorInput): Promise<MedidorResponse> {
    const lojaId = await this.requireLoja(input.lojaId);
    if (await this.medidorRepository.findByNumeroSerie(input.numeroSerie)) {
      throw new AppError(409, `Já existe um medidor com o número de série ${input.numeroSerie}`);
    }
    return toResponse(await this.medidorRepository.create({ ...input, lojaId }));
  }

  public async findAll(): Promise<MedidorResponse[]> {
    return (await this.medidorRepository.findAll()).map(toResponse);
  }

  public async findById(idValue: string): Promise<MedidorResponse> {
    return toResponse(await this.findRecord(idValue));
  }

  public async findByLojaId(lojaIdValue: string): Promise<MedidorResponse[]> {
    const lojaId = await this.requireLoja(lojaIdValue);
    return (await this.medidorRepository.findByLojaId(lojaId)).map(toResponse);
  }

  public async update(idValue: string, input: MedidorInput): Promise<MedidorResponse> {
    const id = parseObjectId(idValue, "medidorId");
    if ((await this.medidorRepository.findById(id)) === null) {
      throw new AppError(404, `Medidor com ID ${idValue} não encontrado`);
    }
    const lojaId = await this.requireLoja(input.lojaId);
    const sameSerial = await this.medidorRepository.findByNumeroSerie(input.numeroSerie);
    if (sameSerial !== null && !sameSerial._id.equals(id)) {
      throw new AppError(409, `Já existe um medidor com o número de série ${input.numeroSerie}`);
    }
    const updated = await this.medidorRepository.update(id, { ...input, lojaId });
    if (updated === null) {
      throw new AppError(404, `Medidor com ID ${idValue} não encontrado`);
    }
    return toResponse(updated);
  }

  public async delete(idValue: string): Promise<void> {
    const id = parseObjectId(idValue, "medidorId");
    if ((await this.medidorRepository.findById(id)) === null) {
      throw new AppError(404, `Medidor com ID ${idValue} não encontrado`);
    }
    const [leituras, alertas] = await Promise.all([
      this.leituraRepository.countByMedidorId(id),
      this.alertaRepository.countByMedidorId(id),
    ]);
    if (leituras > 0 || alertas > 0) {
      throw new AppError(409, "O medidor não pode ser excluído porque possui leituras ou alertas");
    }
    await this.medidorRepository.delete(id);
  }

  private async requireLoja(lojaIdValue: string) {
    const lojaId = parseObjectId(lojaIdValue, "lojaId");
    if ((await this.lojaRepository.findById(lojaId)) === null) {
      throw new AppError(404, `Loja com ID ${lojaIdValue} não encontrada`);
    }
    return lojaId;
  }

  private async findRecord(idValue: string): Promise<MedidorRecord> {
    const id = parseObjectId(idValue, "medidorId");
    const record = await this.medidorRepository.findById(id);
    if (record === null) {
      throw new AppError(404, `Medidor com ID ${idValue} não encontrado`);
    }
    return record;
  }
}
