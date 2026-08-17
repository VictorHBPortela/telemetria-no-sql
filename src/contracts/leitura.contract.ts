import { z } from "zod";
import {
  isoDateSchema,
  nonNegativeNumberSchema,
  objectIdStringSchema,
  positiveNumberSchema,
} from "./common.ts";

export const leituraInputSchema = z
  .object({
    medidorId: objectIdStringSchema,
    dataHoraLeitura: isoDateSchema,
    consumoKwh: positiveNumberSchema,
    tensaoVolts: nonNegativeNumberSchema,
    correnteAmperes: nonNegativeNumberSchema,
  })
  .strict();

export type LeituraInput = z.infer<typeof leituraInputSchema>;
