import { Schema, model } from "mongoose";
import type { Types } from "mongoose";
import type { TipoAlerta } from "../contracts/alerta.contract.ts";

export interface AlertaPersistence {
  medidorId: Types.ObjectId;
  tipoAlerta: TipoAlerta;
  mensagem: string;
  dataHoraAlerta: Date;
  resolvido: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const alertaSchema = new Schema<AlertaPersistence>(
  {
    medidorId: { type: Schema.Types.ObjectId, ref: "Medidor", required: true },
    tipoAlerta: {
      type: String,
      enum: [
        "DEMANDA_EXCEDIDA",
        "CONSUMO_ANOMALO",
        "TENSAO_FORA_FAIXA",
        "FALHA_COMUNICACAO",
      ],
      required: true,
    },
    mensagem: { type: String, required: true, trim: true },
    dataHoraAlerta: { type: Date, required: true, default: Date.now },
    resolvido: { type: Boolean, required: true, default: false },
  },
  {
    collection: "alertas",
    timestamps: true,
    versionKey: false,
    strict: "throw",
  },
);

alertaSchema.index(
  { medidorId: 1, tipoAlerta: 1, dataHoraAlerta: 1 },
  { unique: true },
);
alertaSchema.index({ resolvido: 1 });

export const AlertaModel = model<AlertaPersistence>("Alerta", alertaSchema);
