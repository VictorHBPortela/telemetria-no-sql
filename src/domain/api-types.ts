import type { ModalidadeTarifa } from "../contracts/tarifa.contract.ts";
import type { StatusMedidor } from "../contracts/medidor.contract.ts";
import type { TipoAlerta } from "../contracts/alerta.contract.ts";

export interface TimestampsResponse {
  createdAt: string;
  updatedAt: string;
}

interface TarifaBaseResponse extends TimestampsResponse {
  tarifaId: string;
  codigo: string;
  nome: string;
  modalidade: ModalidadeTarifa;
  vigenciaInicio: string;
  vigenciaFim: string;
  ativa: boolean;
}

export interface TarifaConvencionalResponse extends TarifaBaseResponse {
  modalidade: "CONVENCIONAL";
  precoKwh: number;
}

export interface TarifaBrancaResponse extends TarifaBaseResponse {
  modalidade: "BRANCA";
  precosKwh: {
    foraPonta: number;
    intermediario: number;
    ponta: number;
  };
}

export interface TarifaDemandaResponse extends TarifaBaseResponse {
  modalidade: "DEMANDA";
  precoKwh: number;
  precoDemandaKw: number;
}

export type TarifaResponse =
  | TarifaConvencionalResponse
  | TarifaBrancaResponse
  | TarifaDemandaResponse;

export interface LojaResponse extends TimestampsResponse {
  lojaId: string;
  nomeLoja: string;
  setor: string;
  demandaContratadaKW: number;
  dataCadastro: string;
  tarifaId: string;
}

export interface MedidorResponse extends TimestampsResponse {
  medidorId: string;
  lojaId: string;
  numeroSerie: string;
  status: StatusMedidor;
}

export interface LeituraResponse extends TimestampsResponse {
  leituraId: string;
  medidorId: string;
  dataHoraLeitura: string;
  consumoKwh: number;
  tensaoVolts: number;
  correnteAmperes: number;
}

export interface AlertaResponse extends TimestampsResponse {
  alertaId: string;
  medidorId: string;
  tipoAlerta: TipoAlerta;
  mensagem: string;
  dataHoraAlerta: string;
  resolvido: boolean;
}

export interface ErrorResponse {
  erro: string;
  detalhes?: Record<string, string>;
}
