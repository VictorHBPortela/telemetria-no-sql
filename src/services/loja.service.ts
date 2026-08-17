import type { LojaInput } from "../contracts/loja.contract.ts";
import type { LojaResponse } from "../domain/api-types.ts";
import type { LojaRepository } from "../repositories/loja.repository.ts";
import type { LojaRecord } from "../repositories/loja.repository.ts";
import type { TarifaRepository } from "../repositories/tarifa.repository.ts";
import type { MedidorRepository } from "../repositories/medidor.repository.ts";
import { AppError } from "../shared/app-error.ts";
import { parseObjectId } from "../shared/object-id.ts";

const toResponse = (record: LojaRecord): LojaResponse => ({
  lojaId: record._id.toString(),
  nomeLoja: record.nomeLoja,
  setor: record.setor,
  demandaContratadaKW: record.demandaContratadaKW,
  dataCadastro: record.dataCadastro.toISOString(),
  tarifaId: record.tarifaId.toString(),
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

export class LojaService {
  public constructor(
    private readonly lojaRepository: LojaRepository,
    private readonly tarifaRepository: TarifaRepository,
    private readonly medidorRepository: MedidorRepository,
  ) {}

  public async create(input: LojaInput): Promise<LojaResponse> {
    const tarifaId = parseObjectId(input.tarifaId, "tarifaId");
    if ((await this.tarifaRepository.findById(tarifaId)) === null) {
      throw new AppError(404, `Tarifa com ID ${input.tarifaId} não encontrada`);
    }
    return toResponse(await this.lojaRepository.create({ ...input, tarifaId }));
  }

  public async findAll(): Promise<LojaResponse[]> {
    return (await this.lojaRepository.findAll()).map(toResponse);
  }

  public async findById(idValue: string): Promise<LojaResponse> {
    return toResponse(await this.findRecord(idValue));
  }

  public async update(idValue: string, input: LojaInput): Promise<LojaResponse> {
    const id = parseObjectId(idValue, "lojaId");
    if ((await this.lojaRepository.findById(id)) === null) {
      throw new AppError(404, `Loja com ID ${idValue} não encontrada`);
    }
    const tarifaId = parseObjectId(input.tarifaId, "tarifaId");
    if ((await this.tarifaRepository.findById(tarifaId)) === null) {
      throw new AppError(404, `Tarifa com ID ${input.tarifaId} não encontrada`);
    }
    const updated = await this.lojaRepository.update(id, { ...input, tarifaId });
    if (updated === null) {
      throw new AppError(404, `Loja com ID ${idValue} não encontrada`);
    }
    return toResponse(updated);
  }

  public async delete(idValue: string): Promise<void> {
    const id = parseObjectId(idValue, "lojaId");
    if ((await this.lojaRepository.findById(id)) === null) {
      throw new AppError(404, `Loja com ID ${idValue} não encontrada`);
    }
    if ((await this.medidorRepository.countByLojaId(id)) > 0) {
      throw new AppError(409, "A loja não pode ser excluída porque possui medidores");
    }
    await this.lojaRepository.delete(id);
  }

  private async findRecord(idValue: string): Promise<LojaRecord> {
    const id = parseObjectId(idValue, "lojaId");
    const record = await this.lojaRepository.findById(id);
    if (record === null) {
      throw new AppError(404, `Loja com ID ${idValue} não encontrada`);
    }
    return record;
  }
}
