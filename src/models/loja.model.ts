import { Schema, model } from "mongoose";
import type { Types } from "mongoose";

export interface LojaPersistence {
  nomeLoja: string;
  setor: string;
  demandaContratadaKW: number;
  dataCadastro: Date;
  tarifaId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const lojaSchema = new Schema<LojaPersistence>(
  {
    nomeLoja: { type: String, required: true, trim: true },
    setor: { type: String, required: true, trim: true },
    demandaContratadaKW: { type: Number, required: true, min: 0 },
    dataCadastro: { type: Date, required: true, default: Date.now },
    tarifaId: { type: Schema.Types.ObjectId, ref: "Tarifa", required: true },
  },
  {
    collection: "lojas",
    timestamps: true,
    versionKey: false,
    strict: "throw",
  },
);

lojaSchema.index({ tarifaId: 1 });
lojaSchema.index({ nomeLoja: 1 });

export const LojaModel = model<LojaPersistence>("Loja", lojaSchema);
