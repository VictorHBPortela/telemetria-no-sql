import { Schema, model } from "mongoose";
import type { Types } from "mongoose";

export interface LeituraPersistence {
  medidorId: Types.ObjectId;
  dataHoraLeitura: Date;
  consumoKwh: number;
  tensaoVolts: number;
  correnteAmperes: number;
  createdAt: Date;
  updatedAt: Date;
}

const leituraSchema = new Schema<LeituraPersistence>(
  {
    medidorId: { type: Schema.Types.ObjectId, ref: "Medidor", required: true },
    dataHoraLeitura: { type: Date, required: true, default: Date.now },
    consumoKwh: { type: Number, required: true, min: 0 },
    tensaoVolts: { type: Number, required: true, min: 0 },
    correnteAmperes: { type: Number, required: true, min: 0 },
  },
  {
    collection: "leituras",
    timestamps: true,
    versionKey: false,
    strict: "throw",
  },
);

leituraSchema.index({ medidorId: 1, dataHoraLeitura: 1 }, { unique: true });

export const LeituraModel = model<LeituraPersistence>("Leitura", leituraSchema);
