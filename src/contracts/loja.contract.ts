import { z } from "zod";
import { objectIdStringSchema, positiveNumberSchema } from "./common.ts";

export const lojaInputSchema = z
  .object({
    nomeLoja: z.string().trim().min(1).max(100),
    setor: z.string().trim().min(1).max(50),
    demandaContratadaKW: positiveNumberSchema,
    tarifaId: objectIdStringSchema,
  })
  .strict();

export type LojaInput = z.infer<typeof lojaInputSchema>;
