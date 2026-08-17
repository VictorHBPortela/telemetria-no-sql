import { Schema, model } from "mongoose";
import type { Model } from "mongoose";
import type { ModalidadeTarifa } from "../contracts/tarifa.contract.ts";

export interface TarifaPersistence {
  codigo: string;
  nome: string;
  modalidade: ModalidadeTarifa;
  vigenciaInicio: Date;
  vigenciaFim: Date;
  ativa: boolean;
  precoKwh?: number;
  precoDemandaKw?: number;
  precosKwh?: {
    foraPonta: number;
    intermediario: number;
    ponta: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const tarifaBaseSchema = new Schema<TarifaPersistence>(
  {
    codigo: { type: String, required: true, trim: true },
    nome: { type: String, required: true, trim: true },
    vigenciaInicio: { type: Date, required: true },
    vigenciaFim: { type: Date, required: true },
    ativa: { type: Boolean, required: true },
  },
  {
    collection: "tarifas",
    discriminatorKey: "modalidade",
    timestamps: true,
    versionKey: false,
    strict: "throw",
  },
);

tarifaBaseSchema.index({ codigo: 1 }, { unique: true });
tarifaBaseSchema.index({ modalidade: 1, ativa: 1 });

const tarifaBaseModel = model<TarifaPersistence>("Tarifa", tarifaBaseSchema);

const convencionalSchema = new Schema<TarifaPersistence>(
  { precoKwh: { type: Number, required: true, min: 0 } },
  { _id: false, strict: "throw" },
);

const brancaSchema = new Schema<TarifaPersistence>(
  {
    precosKwh: {
      type: new Schema(
        {
          foraPonta: { type: Number, required: true, min: 0 },
          intermediario: { type: Number, required: true, min: 0 },
          ponta: { type: Number, required: true, min: 0 },
        },
        { _id: false, strict: "throw" },
      ),
      required: true,
    },
  },
  { _id: false, strict: "throw" },
);

const demandaSchema = new Schema<TarifaPersistence>(
  {
    precoKwh: { type: Number, required: true, min: 0 },
    precoDemandaKw: { type: Number, required: true, min: 0 },
  },
  { _id: false, strict: "throw" },
);

export const TarifaModel: Model<TarifaPersistence> = tarifaBaseModel;
export const TarifaConvencionalModel = tarifaBaseModel.discriminator(
  "TarifaConvencional",
  convencionalSchema,
  "CONVENCIONAL",
);
export const TarifaBrancaModel = tarifaBaseModel.discriminator(
  "TarifaBranca",
  brancaSchema,
  "BRANCA",
);
export const TarifaDemandaModel = tarifaBaseModel.discriminator(
  "TarifaDemanda",
  demandaSchema,
  "DEMANDA",
);
