import type { TarifaInput } from "../contracts/tarifa.contract.ts";
import type { TarifaResponse } from "../domain/api-types.ts";
import type { TarifaRecord } from "../repositories/tarifa.repository.ts";
import type { TarifaRepository } from "../repositories/tarifa.repository.ts";
import type { LojaRepository } from "../repositories/loja.repository.ts";
import { AppError } from "../shared/app-error.ts";
import { parseObjectId } from "../shared/object-id.ts";

const commonResponse = (record: TarifaRecord) => ({
  tarifaId: record._id.toString(),
  codigo: record.codigo,
  nome: record.nome,
  vigenciaInicio: record.vigenciaInicio.toISOString(),
  vigenciaFim: record.vigenciaFim.toISOString(),
  ativa: record.ativa,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

const toResponse = (record: TarifaRecord): TarifaResponse => {
  switch (record.modalidade) {
    case "CONVENCIONAL":
      if (record.precoKwh === undefined) {
        throw new AppError(500, "Tarifa convencional inconsistente");
      }
      return { ...commonResponse(record), modalidade: "CONVENCIONAL", precoKwh: record.precoKwh };
    case "BRANCA":
      if (record.precosKwh === undefined) {
        throw new AppError(500, "Tarifa branca inconsistente");
      }
      return { ...commonResponse(record), modalidade: "BRANCA", precosKwh: record.precosKwh };
    case "DEMANDA":
      if (record.precoKwh === undefined || record.precoDemandaKw === undefined) {
        throw new AppError(500, "Tarifa de demanda inconsistente");
      }
      return {
        ...commonResponse(record),
        modalidade: "DEMANDA",
        precoKwh: record.precoKwh,
        precoDemandaKw: record.precoDemandaKw,
      };
  }
};

export class TarifaService {
  public constructor(
    private readonly tarifaRepository: TarifaRepository,
    private readonly lojaRepository: LojaRepository,
  ) {}

  public async create(input: TarifaInput): Promise<TarifaResponse> {
    if (await this.tarifaRepository.findByCodigo(input.codigo)) {
      throw new AppError(409, `Já existe uma tarifa com o código ${input.codigo}`);
    }
    return toResponse(await this.tarifaRepository.create(input));
  }

  public async findAll(): Promise<TarifaResponse[]> {
    return (await this.tarifaRepository.findAll()).map(toResponse);
  }

  public async findById(idValue: string): Promise<TarifaResponse> {
    const record = await this.findRecord(idValue);
    return toResponse(record);
  }

  public async update(idValue: string, input: TarifaInput): Promise<TarifaResponse> {
    const id = parseObjectId(idValue, "tarifaId");
    const current = await this.tarifaRepository.findById(id);
    if (current === null) {
      throw new AppError(404, `Tarifa com ID ${idValue} não encontrada`);
    }
    if (current.modalidade !== input.modalidade) {
      throw new AppError(409, "A modalidade de uma tarifa existente não pode ser alterada");
    }
    const sameCode = await this.tarifaRepository.findByCodigo(input.codigo);
    if (sameCode !== null && !sameCode._id.equals(id)) {
      throw new AppError(409, `Já existe uma tarifa com o código ${input.codigo}`);
    }
    const updated = await this.tarifaRepository.update(id, input);
    if (updated === null) {
      throw new AppError(404, `Tarifa com ID ${idValue} não encontrada`);
    }
    return toResponse(updated);
  }

  public async delete(idValue: string): Promise<void> {
    const id = parseObjectId(idValue, "tarifaId");
    if ((await this.tarifaRepository.findById(id)) === null) {
      throw new AppError(404, `Tarifa com ID ${idValue} não encontrada`);
    }
    if ((await this.lojaRepository.countByTarifaId(id)) > 0) {
      throw new AppError(409, "A tarifa não pode ser excluída porque está vinculada a lojas");
    }
    await this.tarifaRepository.delete(id);
  }

  private async findRecord(idValue: string): Promise<TarifaRecord> {
    const id = parseObjectId(idValue, "tarifaId");
    const record = await this.tarifaRepository.findById(id);
    if (record === null) {
      throw new AppError(404, `Tarifa com ID ${idValue} não encontrada`);
    }
    return record;
  }
}
