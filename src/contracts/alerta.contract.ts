import { z } from "zod";
import { isoDateSchema, objectIdStringSchema } from "./common.ts";

export const tipoAlertaSchema = z.enum([
  "DEMANDA_EXCEDIDA",
  "CONSUMO_ANOMALO",
  "TENSAO_FORA_FAIXA",
  "FALHA_COMUNICACAO",
]);

export const alertaInputSchema = z
  .object({
    medidorId: objectIdStringSchema,
    tipoAlerta: tipoAlertaSchema,
    mensagem: z.string().trim().min(1).max(255),
    dataHoraAlerta: isoDateSchema,
    resolvido: z.boolean().default(false),
  })
  .strict();

export type AlertaInput = z.infer<typeof alertaInputSchema>;
export type TipoAlerta = z.infer<typeof tipoAlertaSchema>;
