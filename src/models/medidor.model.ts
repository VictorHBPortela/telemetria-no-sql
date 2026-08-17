import { Schema, model } from "mongoose";
import type { Types } from "mongoose";
import type { StatusMedidor } from "../contracts/medidor.contract.ts";

export interface MedidorPersistence {
  lojaId: Types.ObjectId;
  numeroSerie: string;
  status: StatusMedidor;
  createdAt: Date;
  updatedAt: Date;
}

const medidorSchema = new Schema<MedidorPersistence>(
  {
    lojaId: { type: Schema.Types.ObjectId, ref: "Loja", required: true },
    numeroSerie: { type: String, required: true, trim: true },
    status: { type: String, enum: ["ATIVO", "DESATIVO"], required: true, default: "ATIVO" },
  },
  {
    collection: "medidores",
    timestamps: true,
    versionKey: false,
    strict: "throw",
  },
);

medidorSchema.index({ numeroSerie: 1 }, { unique: true });
medidorSchema.index({ lojaId: 1 });

export const MedidorModel = model<MedidorPersistence>("Medidor", medidorSchema);
